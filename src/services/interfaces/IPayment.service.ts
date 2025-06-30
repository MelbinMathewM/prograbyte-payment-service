import { IPayout } from "@/models/payout.model";
import { ITransaction, IWallet } from "@/models/wallet.model";
import { Types } from "mongoose";
import Stripe from "stripe";

export interface IPaymentService {
    createPremiumCheckoutSession(email: string): Promise<Stripe.Checkout.Session>;
    createCourseCheckoutSession(data: {
        email: string;
        userId: string;
        courseId: string;
        tutorId: string;
        courseName: string;
        amountInCents: number;
        couponCode?: string;
    }): Promise<Stripe.Checkout.Session>;
    handleStripeWebhook(rawBody: Buffer, signature: string | string[]): Promise<void>;
    getWallet(userId: string): Promise<IWallet | null>;
    revokePremium(userId: string): Promise<void>;
    buyCourseByWallet(courseId: string, tutorId: string, userId: string, paymentAmount: number, couponCode?: string): Promise<void>;
    markAsPaid(payoutId: string): Promise<void>;
    getMonthlyPayout(currentYear: number, currentMonth: number): Promise<IPayout[]>;
    getDashboardData(year: number, month: number): any;
    getTutorDashboardData(tutorId: string, year: number, month: number): any;
    saveToWallet(user_id: Types.ObjectId, transactionData: ITransaction): Promise<void>;
    refundPayout(courseId: Types.ObjectId, refundAmount: number): Promise<void>;
}