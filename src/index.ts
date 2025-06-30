import express, { Application } from "express";
import dotenv from "dotenv";
import verifyApiKey from "@/configs/api-key.config";
import { validateEnv } from "@/utils/env-config.util";
import connectDB from "@/configs/db.config";
import webhookRouter from "@/routes/webhook.route";
import paymentRouter from "@/routes/payment.route";
import { conditionalBodyParser } from "@/middlewares/body-parser.middleware";
import { initializeRabbitMQ } from "@/configs/rabbitmq.config";
import { courseWalletConsumer } from "@/rabbitmqs/course.consumer";
import logger from "@/utils/logger.util";
import walletRouter from "./routes/wallet.route";

dotenv.config();

validateEnv();
connectDB();

const app: Application = express();

app.use(conditionalBodyParser);
app.use(verifyApiKey as express.RequestHandler);

app.use("/payments", paymentRouter);
app.use("/wallet", walletRouter);
app.use("/webhook", webhookRouter);

(async () => {
    await initializeRabbitMQ();
    await courseWalletConsumer();
})()

const PORT = process.env.PORT || 5007;
app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
});