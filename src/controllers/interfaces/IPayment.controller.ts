import { ITransaction, IWallet } from "@/models/wallet.model";
import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

export interface IPaymentController {
    createCheckoutSessionForPremium(req: Request, res: Response, next: NextFunction): Promise<void>;
    createCheckoutSessionForCourse(req: Request, res: Response, next: NextFunction): Promise<void>;
    stripeWebhook(req: Request, res: Response, next: NextFunction): Promise<void>;
    getWallet(req: Request, res: Response, next: NextFunction): Promise<void>;
    buyCourseByWallet(req: Request, res: Response, next: NextFunction): Promise<void>;
    markAsPaid(req: Request, res: Response, next: NextFunction): Promise<void>;
    getDashboardData(req: Request, res: Response, next: NextFunction): Promise<void>;
    getTutorDashboardData(req: Request, res: Response, next: NextFunction): Promise<void>;
    revokePremium(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMonthlyPayout(req: Request, res: Response, next: NextFunction): Promise<void>;
    saveToWallet(walletData: ITransaction, user_id: Types.ObjectId): Promise<void>;
    refundPayout(courseId: Types.ObjectId, refundAmount: number): Promise<void>;
}