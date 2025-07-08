import dotenv from "dotenv";

dotenv.config();

export const env = {
    get PORT() {
        return process.env.PORT;
    },
    get MONGO_URI() {
        return process.env.MONGO_URI;
    },
    get STRIPE_SECRET_KEY() {
        return process.env.STRIPE_SECRET_KEY;
    },
    get API_GATEWAY_KEY() {
        return process.env.API_GATEWAY_KEY;
    },
    get FRONTEND_URL() {
        return process.env.FRONTEND_URL
    },
    get STRIPE_WEBHOOK_SECRET() {
        return process.env.STRIPE_WEBHOOK_SECRET
    },
    get RABBITMQ_URL() {
        return process.env.RABBITMQ_URL
    },
    get AUTH_URL() {
        return process.env.AUTH_URL
    },
    get COURSE_URL() {
        return process.env.COURSE_URL
    }
}