import container from "@/configs/inversify.config";
import { PaymentController } from "@/controllers/implementations/payment.controller";
import { IPaymentController } from "@/controllers/interfaces/IPayment.controller";
import { Router } from "express";

const paymentRouter = Router();
const paymentController = container.get<IPaymentController>(PaymentController);

paymentRouter.post("/checkout/premium", paymentController.createCheckoutSessionForPremium.bind(paymentController));
paymentRouter.post("/checkout/course", paymentController.createCheckoutSessionForCourse.bind(paymentController));
paymentRouter.get("/monthly-payments", paymentController.getMonthlyPayout.bind(paymentController));
paymentRouter.post("/pay-tutor", paymentController.markAsPaid.bind(paymentController));
paymentRouter.get("/dashboard", paymentController.getDashboardData.bind(paymentController));
paymentRouter.get("/dashboard/tutor/:tutorId", paymentController.getTutorDashboardData.bind(paymentController));

export default paymentRouter;