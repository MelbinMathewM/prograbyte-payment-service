import { Request, Response, NextFunction } from "express";
import { env } from "./env.config";

const verifyApiKey = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || apiKey !== env.API_GATEWAY_KEY) {
        return res.status(403).json({ message: "Access denied" });
    }
    next();
};

export default verifyApiKey;