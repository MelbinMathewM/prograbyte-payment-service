import { env } from "@/configs/env.config";

export function validateEnv() {
    if (!env.PORT) {
        throw new Error("PORT is not found in the env");
    }
    if (!env.MONGO_URI) {
        throw new Error("MONGO_URI is not found in the env");
    }
    if (!env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY is not found in the env");
    }
    if (!env.API_GATEWAY_KEY) {
        throw new Error("API_GATEWAY_KEY is not found in the env");
    }
    if (!env.FRONTEND_URL) {
        throw new Error("FROMTEND_URL is not found in the env");
    }
    if (!env.STRIPE_WEBHOOK_SECRET) {
        throw new Error("STRIPE_WEBHOOK_SECRET is not found in the env");
    }
    if (!env.RABBITMQ_URL) {
        throw new Error("RABBITMQ_URL is not found in the env");
    }
}