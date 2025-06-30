import { Request, Response, NextFunction } from "express";
import express from "express";

export const conditionalBodyParser = (req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl.includes("/webhook/stripe")) {
    express.raw({ type: "application/json" })(req, res, next);
  } else {
    express.json({ limit: "5mb" })(req, res, (err) => {
      if (err) return next(err);
      express.urlencoded({ limit: "5mb", extended: true })(req, res, next);
    });
  }
};
