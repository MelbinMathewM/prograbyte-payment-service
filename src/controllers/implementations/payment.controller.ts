import { NextFunction, Request, Response } from "express";
import { IPaymentController } from "../interfaces/IPayment.controller";
import { HttpStatus } from "@/constants/status.constant";
import { HttpResponse } from "@/constants/response.constant";
import { inject, injectable } from "inversify";
import { PaymentService } from "@/services/implementations/payment.service";
import { ITransaction, IWallet } from "@/models/wallet.model";
import logger from "@/utils/logger.util";
import { Types } from "mongoose";

@injectable()
export class PaymentController implements IPaymentController {
  constructor(
    @inject(PaymentService) private _paymentService: PaymentService
  ) { }

  async createCheckoutSessionForPremium(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(HttpStatus.BAD_REQUEST).json({ error: HttpResponse.EMAIL_REQUIRED });
        return;
      }

      const session = await this._paymentService.createPremiumCheckoutSession(email);

      res.status(HttpStatus.OK).json({ sessionId: session.id });
    } catch (err) {
      next(err);
    }
  }

  async createCheckoutSessionForCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

      const { email, userId, courseId,tutorId, courseName, paymentAmount, couponCode } = req.body;
      
      if (!email || !userId || !courseId || !courseName || !paymentAmount) {
        res.status(HttpStatus.BAD_REQUEST).json({ error: HttpResponse.MISSING_FIELDS });
        return;
      }
      
      const session = await this._paymentService.createCourseCheckoutSession({ email, userId, courseId,tutorId, courseName, amountInCents: paymentAmount, couponCode });
      
      res.status(HttpStatus.OK).json({ sessionId: session.id });
    } catch (err) {
      next(err)
    }
  }

  async stripeWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sig = req.headers["stripe-signature"] as string;
      if (!sig) {
        res.status(HttpStatus.BAD_REQUEST).send(HttpResponse.MISSING_STRIPE_SIG);
        return;
      }

      const rawBody = req.body as Buffer;
      if(!rawBody) {
        res.status(HttpStatus.NOT_FOUND).send(HttpResponse.MISSING_RAW_BODY);
        return;
      }

      await this._paymentService.handleStripeWebhook(rawBody, sig);

      res.status(200).send(HttpResponse.WEBHOOK_RECEIVED);
    } catch (err) {
      next(err);
    }
  }

  async getWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try{
      const { userId } = req.params;
      const wallet = await this._paymentService.getWallet(userId);

      res.status(HttpStatus.OK).json({ wallet });
    }catch(err){
      next(err);
    }
  };

  async buyCourseByWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
      try{

        console.log(req.body,'kkk')
        const { courseId, userId, tutorId, paymentAmount, couponCode } = req.body;

        await this._paymentService.buyCourseByWallet(courseId, tutorId, userId, paymentAmount, couponCode);

        res.status(HttpStatus.OK).json({ message: HttpResponse.WALLET_PAID, success: true });
      }catch(err){
        next(err);
      }
  }

  async revokePremium(req: Request, res: Response, next: NextFunction): Promise<void> {
      try{
        const { userId } = req.body;

        if(!userId){
          res.status(HttpStatus.BAD_REQUEST).json({ error: HttpResponse.USER_ID_NOT_FOUND });
          return;
        }

        await this._paymentService.revokePremium(userId);

        res.status(HttpStatus.OK).json({ message: HttpResponse.PREMIUM_REVOKED });
      }catch(err){
        next(err);
      }
  }

  async getMonthlyPayout(req: Request, res: Response, next: NextFunction): Promise<void> {
      try{

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const payouts = await this._paymentService.getMonthlyPayout(currentMonth, currentYear);

        res.status(HttpStatus.OK).json({ payouts });
      }catch(err){
        next(err);
      }
  };

  async getDashboardData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let { year, month } = req.query;
  
      const currentDate = new Date();
      let newYear: number = currentDate.getFullYear();
      let newMonth: number = currentDate.getMonth();
  
      if (year !== undefined) {
        newYear = JSON.parse(year as string);
      }
  
      if (month !== undefined) {
        newMonth = JSON.parse(month as string);
      }
  
      console.log("Year:", newYear, "Month:", newMonth);
  
      const { topCourses, topTutors, totalRevenue } = await this._paymentService.getDashboardData(newYear, newMonth);
  
      res.status(HttpStatus.OK).json({ topCourses, topTutors, totalRevenue });
    } catch (err) {
      next(err);
    }
  }

  async getTutorDashboardData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log(req.query);
      const { year, month } = req.query;
      const { tutorId } = req.params;
      if (!tutorId) {
          res.status(400).json({ success: false, message: "Missing parameters" });
          return;
      }

      const currentDate = new Date();
      let newYear: number = currentDate.getFullYear();
      let newMonth: number = currentDate.getMonth();
  
      if (year !== undefined) {
        newYear = JSON.parse(year as string);
      }
  
      if (month !== undefined) {
        newMonth = JSON.parse(month as string);
      }

      
      const dashboardData = await this._paymentService.getTutorDashboardData(
          tutorId as string,
          newYear,
          newMonth
      );

      res.json({ success: true, data: dashboardData });
    } catch (err) {
      next(err);
    }
  }

  async markAsPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
      try{
        const { payoutId } = req.body;

        if(!payoutId){
          res.status(HttpStatus.BAD_REQUEST).json({ error: HttpResponse.PAYMENT_ID_NOT_FOUND });
          return;
        }

        await this._paymentService.markAsPaid(payoutId);

        res.status(HttpStatus.OK).json({ message: HttpResponse.TUTOR_PAID });
      }catch(err){
        next(err);
      }
  }

  async saveToWallet(walletData: ITransaction, user_id: Types.ObjectId): Promise<void> {
    try{
      const transactionData = {
        amount: walletData.amount,
        type: walletData.type,
        source: walletData.source,
        source_id: walletData.source_id,
        description: walletData.description,
        date: new Date()
    };
      await this._paymentService.saveToWallet(user_id, transactionData);
    }catch(err){
      logger.error("Failed to save to wallet", err);
      throw err;
    }
  }

  async refundPayout(courseId: Types.ObjectId, refundAmount: number): Promise<void> {
    
      await this._paymentService.refundPayout(courseId, refundAmount);
  }
}