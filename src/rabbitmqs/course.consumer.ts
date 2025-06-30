import container from "@/configs/inversify.config"
import { PaymentController } from "@/controllers/implementations/payment.controller"
import { IPaymentController } from "@/controllers/interfaces/IPayment.controller"
import { consumeMessages } from "@/utils/rabbitmq.util";

export const courseWalletConsumer = async () => {
    const paymentController = container.get<IPaymentController>(PaymentController);

    await consumeMessages(
        "payment_course_refund",
        "course_service",
        "course.refund.payment",
        async (msg) => {
            const { walletData } = JSON.parse(msg.content.toString());
            console.log(walletData,'walletData');

            await paymentController.saveToWallet(walletData, walletData.user_id);
            await paymentController.refundPayout(walletData.source_id, walletData.amount);
        }
    )
}