import { Router } from "express";
import container from "@/configs/inversify.config";
import { PaymentController } from "@/controllers/implementations/payment.controller";
import { IPaymentController } from "@/controllers/interfaces/IPayment.controller";

const webhookRouter = Router();
const paymentController = container.get<IPaymentController>(PaymentController);

webhookRouter.post("/stripe", paymentController.stripeWebhook.bind(paymentController));

export default webhookRouter;
