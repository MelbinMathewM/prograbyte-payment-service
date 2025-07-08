import { inject, injectable } from "inversify";
import { IPaymentService } from "../interfaces/IPayment.service";
import { IPaymentRepository } from "@/repositories/interfaces/IPayment.repository";
import { env } from "@/configs/env.config";
import stripe from "@/configs/stripe.config";
import Stripe from "stripe";
import axios from "axios";
import { convertToObjectId } from "@/utils/convert-objectid.util";
import { ITransaction, IWallet } from "@/models/wallet.model";
import { IWalletRepository } from "@/repositories/interfaces/IWallet.repository";
import { Types } from "mongoose";
import { HttpResponse } from "@/constants/response.constant";
import { IPayout } from "@/models/payout.model";
import { createHttpError } from "@/utils/http-error.util";
import { HttpStatus } from "@/constants/status.constant";

@injectable()
export class PaymentService implements IPaymentService {
    constructor(
        @inject("IPaymentRepository") private _paymentRepository: IPaymentRepository,
        @inject("IWalletRepository") private _walletRepository: IWalletRepository
    ) { }

    async createPremiumCheckoutSession(email: string): Promise<Stripe.Checkout.Session> {
        return await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            customer_email: email,
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: "Premium Membership",
                            description: "Access all premium features",
                        },
                        unit_amount: 19900,
                        recurring: { interval: "month" },
                    },
                    quantity: 1,
                },
            ],
            success_url: `${env.FRONTEND_URL}/payment-success`,
            cancel_url: `${env.FRONTEND_URL}/payment-failed`,
            metadata: {
                type: "premium",
            },
        });
    }

    async createCourseCheckoutSession(data: {
        email: string;
        userId: string;
        courseId: string;
        tutorId: string;
        courseName: string;
        amountInCents: number;
        couponCode?: string;
    }): Promise<Stripe.Checkout.Session> {
        return await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer_email: data.email,
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: data.courseName,
                        },
                        unit_amount: data.amountInCents * 100,
                    },
                    quantity: 1,
                },
            ],
            success_url: `${env.FRONTEND_URL}/payment-success`,
            cancel_url: `${env.FRONTEND_URL}/payment-failed`,
            metadata: {
                type: "course",
                userId: data.userId,
                courseId: data.courseId,
                tutorId: data.tutorId,
                paymentAmount: data.amountInCents.toString(),
                couponCode: data.couponCode as string,
            },
        });
    }

    async handleStripeWebhook(rawBody: Buffer, signature: string | string[]): Promise<void> {
        const event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET!);

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const email = session.customer_email;
            const metadata = session.metadata;

            if (metadata?.type === "premium" && email) {

                await axios.post(`${env.AUTH_URL}/upgrade`, { email }, {
                    headers: {
                        "x-api-key": env.API_GATEWAY_KEY
                    }
                });
            } else if (metadata?.type === "course" && email && metadata.courseId) {
                const paymentAmount = Number(metadata.paymentAmount);
                const paymentId = session.payment_intent as string;

                await axios.post(`${env.COURSE_URL}/enroll`, {
                    email,
                    userId: metadata.userId,
                    courseId: metadata.courseId,
                    paymentAmount,
                    paymentId,
                    couponCode: metadata.couponCode,
                },
                    {
                        headers: {
                            "x-api-key": env.API_GATEWAY_KEY
                        }
                    });

                this.updateCoursePayout(metadata.courseId, metadata.tutorId, paymentAmount);
            }
        }
    };

    async buyCourseByWallet(courseId: string, tutorId: string, userId: string, paymentAmount: number, couponCode?: string): Promise<void> {

        let wallet = await this._walletRepository.findOne({ user_id: userId });

        if(!wallet){
            const objectUserId = convertToObjectId(userId);
            wallet = await this._walletRepository.create({ user_id: objectUserId, balance: 0, transactions: [] });
        }

        if(paymentAmount > wallet.balance){
            throw createHttpError(HttpStatus.CONFLICT, HttpResponse.INSUFFICIENT_BALANCE);
        }

        wallet.balance -= paymentAmount;

        const objectSourceId = convertToObjectId(courseId as string);
        const transaction: ITransaction = {
            amount: paymentAmount,
            type: "debit",
            source: "course",
            source_id: objectSourceId,
            description: `Course purchased`,
            date: new Date()
        };

        wallet.transactions.push(transaction);

        await this._walletRepository.save(wallet);

        await axios.post(`http://localhost:5003/enroll`, {
            userId,
            courseId,
            paymentAmount,
            couponCode,
        },
            {
                headers: {
                    "x-api-key": env.API_GATEWAY_KEY
                }
            });

        this.updateCoursePayout(courseId, tutorId, paymentAmount);
    }

    async updateCoursePayout(courseId: string, tutorId: string, paymentAmount: number): Promise<void> {

        const tutorShare = Math.round(paymentAmount * 0.7);
        const adminShare = paymentAmount - tutorShare;

        await this._paymentRepository.create({
            tutor_id: convertToObjectId(tutorId),
            type: "course",
            source_id: convertToObjectId(courseId),
            amount: paymentAmount,
            tutorShare,
            adminShare
        });
    };

    async getWallet(userId: string): Promise<IWallet | null> {

        let wallet = await this._walletRepository.findOne({ user_id: userId });

        if (!wallet) {
            const objectUserId = convertToObjectId(userId);
            await this._walletRepository.create({ user_id: objectUserId });
        }

        return wallet;
    };

    async getMonthlyPayout(currentYear: number, currentMonth: number): Promise<IPayout[]> {

        const startOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0));
        const endOfMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59));

        const payouts = await this._paymentRepository.aggregate([
            {
                $match: {
                    status: "pending",
                    // createdAt: {
                    //     $gte: startOfMonth,
                    //     $lte: endOfMonth
                    // },
                },
            },
            {
                $group: {
                    _id: "$tutor_id",
                    totalTutorShare: { $sum: "$tutorShare" },
                    totalAdminShare: { $sum: "$adminShare" },
                    totalAmount: { $sum: "$amount" },
                    payouts: {
                        $push: {
                            _id: "$_id",
                            type: "$type",
                            source_id: "$source_id",
                            amount: "$amount",
                            tutorShare: "$tutorShare",
                            adminShare: "$adminShare",
                            createdAt: "$createdAt",
                        },
                    },
                },
            }
        ]);

        const payoutsWithTutor = await Promise.all(
            payouts.map(async (payout) => {
                const tutor = await this.fetchTutorDetails(payout._id);
                return {
                    ...payout,
                    tutor,
                };
            })
        );

        return payoutsWithTutor;
    }

    private async fetchTutorDetails(tutorId: string) {
        const response = await axios.get(`http://localhost:5002/user/${tutorId}`,{
            headers: {
                "x-api-key": env.API_GATEWAY_KEY
            }
        });
        return response.data;
    };

    async getDashboardData(year: number, month: number) {
        const payouts = await this.getMonthlyPayout(year, month) as any;
    
        // Top Tutors
        const topTutors = payouts
            .sort((a: any, b: any) => b.totalTutorShare - a.totalTutorShare)
            .slice(0, 5)
            .map((payout: any) => ({
                tutorId: payout._id,
                tutorName: payout.tutor.name,
                totalEarnings: payout.totalTutorShare,
            }));
    
        // Total Revenue
        const totalRevenue = payouts.reduce(
            (acc: any, curr: any) => {
                acc.totalAmount += curr.totalAmount;
                acc.totalAdminShare += curr.totalAdminShare;
                acc.totalTutorShare += curr.totalTutorShare;
                return acc;
            },
            { totalAmount: 0, totalAdminShare: 0, totalTutorShare: 0 }
        );
    
        // Top Courses (if payouts contain source_id = course id)
        const courseMap = new Map<string, { amount: number }>();
        payouts.forEach((payout: any) => {
            payout.payouts.forEach((payment: any) => {
                if (!courseMap.has(payment.source_id)) {
                    courseMap.set(payment.source_id, { amount: 0 });
                }
                courseMap.get(payment.source_id)!.amount += payment.amount;
            });
        });
    
        const topCourses = Array.from(courseMap.entries())
            .sort((a, b) => b[1].amount - a[1].amount)
            .slice(0, 5)
            .map(([courseId, data]) => ({
                courseId,
                totalRevenue: data.amount,
            }));
    
        return {
            topTutors,
            topCourses,
            totalRevenue,
        };
    };

    async getTutorDashboardData(tutorId: string, year: number, month: number) {
        console.log(tutorId,'tu')
        const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0));
        const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
    
        const payouts = await this._paymentRepository.aggregate([
            {
                $match: {
                    tutor_id: convertToObjectId(tutorId),
                    // status: "pending",
                    // createdAt: {
                    //     $gte: startOfMonth,
                    //     $lte: endOfMonth
                    // }
                },
            },
            {
                $group: {
                    _id: "$source_id",
                    totalAmount: { $sum: "$amount" },
                    totalTutorShare: { $sum: "$tutorShare" },
                    totalAdminShare: { $sum: "$adminShare" },
                    payouts: {
                        $push: {
                            _id: "$_id",
                            type: "$type",
                            amount: "$amount",
                            createdAt: "$createdAt",
                        },
                    },
                },
            }
        ]);
        
        // Calculate overall totals
        const totalRevenue = payouts.reduce(
            (acc: any, curr: any) => {
                acc.totalAmount += curr.totalAmount;
                acc.totalTutorShare += curr.totalTutorShare;
                acc.totalAdminShare += curr.totalAdminShare;
                return acc;
            },
            { totalAmount: 0, totalTutorShare: 0, totalAdminShare: 0 }
        );
    
        // Top Courses (sorted by totalAmount descending)
        const topCourses = payouts
            .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
            .slice(0, 5)
            .map((course: any) => ({
                courseId: course._id,
                totalRevenue: course.totalAmount,
                totalTutorShare: course.totalTutorShare,
            }));
    
        return {
            totalRevenue,
            topCourses,
            payouts,
        };
    }
    

    async revokePremium(userId: string): Promise<void> {
        
        let wallet = await this._walletRepository.findOne({ user_id: userId });

        if(!wallet){
            const objectUserId = convertToObjectId(userId)
            wallet = await this._walletRepository.create({ user_id: objectUserId, balance: 0, transactions: [] });
        }

        const returnAmount = Math.floor(199 * 0.5);
        wallet.balance += returnAmount;

        const transaction: ITransaction = {
            amount: returnAmount,
            type: "credit",
            source: "premium",
            description: `Refund for premium revokation`,
            date: new Date()
        };

        wallet.transactions.push(transaction);

        await this._walletRepository.save(wallet);

        const response = await axios.put(`http://localhost:5002/user/${userId}/revoke-premium`,{ userId },{
            headers: {
                "x-api-key": env.API_GATEWAY_KEY
            }
        });

        if(response.status !== HttpStatus.OK){
            throw createHttpError(response.status, response.data.message);
        }
    }
    

    async markAsPaid(payoutId: string): Promise<void> {
        
        const payout = await this._paymentRepository.findById(payoutId);

        if(!payout){
            throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.PAYOUT_NOT_FOUND);
        }

        payout.status = "paid";
        payout.paidAt = new Date();

        await this._paymentRepository.save(payout);

        let tutorWallet = await this._walletRepository.findOne({ user_id: payout.tutor_id });

        if(!tutorWallet){
            tutorWallet = await this._walletRepository.create({ user_id: payout.tutor_id, balance: 0, transactions: [] });
        }

        tutorWallet.balance += payout.tutorShare;

        const objectSourceId = convertToObjectId(payout._id as string);
        const transaction: ITransaction = {
            amount: payout.tutorShare,
            type: "credit",
            source: "course",
            source_id: objectSourceId,
            description: `Payment for course completed`,
            date: new Date()
        };

        tutorWallet.transactions.push(transaction);

        await this._walletRepository.save(tutorWallet);
    }
    

    async saveToWallet(user_id: Types.ObjectId, transactionData: ITransaction): Promise<void> {
        let wallet = await this._walletRepository.findOne({ user_id });

        if (!wallet) {
            wallet = await this._walletRepository.create({ user_id })
        }

        wallet.transactions.push(transactionData);

        if (transactionData.type === "credit") {
            wallet.balance += transactionData.amount;
        } else if (transactionData.type === "debit") {
            wallet.balance -= transactionData.amount;
        }

        await this._walletRepository.save(wallet);
    }


    async refundPayout(courseId: Types.ObjectId, refundAmount: number): Promise<void> {
        const payment = await this._paymentRepository.findOne({ source_id: courseId });

        if (!payment) {
            console.warn(HttpResponse.NO_PAYMENT_FOUND);
            return;
        }

        const tutorShare = Math.round(refundAmount * 0.7);
        const adminShare = refundAmount - tutorShare;

        await this._paymentRepository.updateOne(
            { source_id: courseId },
            {
                $inc: {
                    tutorShare: -tutorShare,
                    adminShare: -adminShare,
                    amount: -refundAmount
                },
                $set: {
                    isRefunded: true
                }
            }
        );
    }
}