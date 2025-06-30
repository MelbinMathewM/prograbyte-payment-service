import "reflect-metadata";
import { Container } from "inversify";

import { IPaymentRepository } from "@/repositories/interfaces/IPayment.repository";
import { IWalletRepository } from "@/repositories/interfaces/IWallet.repository";
import { IPaymentService } from "@/services/interfaces/IPayment.service";
import { IPaymentController } from "@/controllers/interfaces/IPayment.controller";

import { PaymentRepository } from "@/repositories/implementations/payment.repository";
import { WalletRepository } from "@/repositories/implementations/wallet.repository";
import { PaymentService } from "@/services/implementations/payment.service";
import { PaymentController } from "@/controllers/implementations/payment.controller";

const container = new Container({ defaultScope: "Singleton" });

container.bind<IPaymentRepository>("IPaymentRepository").to(PaymentRepository);
container.bind<IWalletRepository>("IWalletRepository").to(WalletRepository);
container.bind<IPaymentService>(PaymentService).toSelf();
container.bind<IPaymentController>(PaymentController).toSelf();

export default container;