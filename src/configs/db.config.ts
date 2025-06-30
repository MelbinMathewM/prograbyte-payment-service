import mongoose from "mongoose";
import { env } from "./env.config";
import logger from "@/utils/logger.util";

const connectDB = async () => {
    try{
        await mongoose.connect(env.MONGO_URI as string);
        logger.info("MongoDB Connected");
    }catch(err){
        logger.warn("MongoDB not connected",err);
        process.exit(1);
    }  
};

export default connectDB;