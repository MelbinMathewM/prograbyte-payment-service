import container from "@/configs/inversify.config";
import { PaymentController } from "@/controllers/implementations/payment.controller";
import { IPaymentController } from "@/controllers/interfaces/IPayment.controller";
import { Router } from "express";

const walletRouter = Router();
const paymentController = container.get<IPaymentController>(PaymentController);

walletRouter.get("/:userId", paymentController.getWallet.bind(paymentController));
walletRouter.post("/wallet-pay", paymentController.buyCourseByWallet.bind(paymentController));
walletRouter.post("/revoke", paymentController.revokePremium.bind(paymentController));

export default walletRouter;