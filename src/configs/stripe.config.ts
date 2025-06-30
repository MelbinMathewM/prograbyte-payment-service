import Stripe from "stripe";
import { env } from "./env.config";

const stripe = new Stripe(env.STRIPE_SECRET_KEY as string, { apiVersion: "2025-03-31.basil" });

export default stripe;