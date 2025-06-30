import * as amqp from "amqplib";
import { env } from "./env.config";
import logger from "@/utils/logger.util";

let rabbitConnection: amqp.Connection | null = null;
let rabbitChannel: amqp.Channel | null = null;
const exchange = "payment_service";

export const initializeRabbitMQ = async (): Promise<void> => {
  try {
    rabbitConnection = await amqp.connect(env.RABBITMQ_URL as string) as unknown as amqp.Connection;
    rabbitChannel = await (rabbitConnection as any).createChannel();
    await rabbitChannel?.assertExchange(exchange, "topic", { durable: true });
    logger.info("Connected to RabbitMQ");
  } catch (error) {
    logger.error("RabbitMQ Initialization Error:", error);
    throw error;
  }
};

export const getRabbitMQ = () => ({
  connection: rabbitConnection,
  channel: rabbitChannel,
  exchange,
});

export const closeRabbitMQ = async (): Promise<void> => {
  try {
    await (rabbitChannel as any).close();
    await (rabbitConnection as any).close();
    logger.info("RabbitMQ Connection Closed");
  } catch (error) {
    logger.error("❌ Error closing RabbitMQ connection:", error);
  }
};
