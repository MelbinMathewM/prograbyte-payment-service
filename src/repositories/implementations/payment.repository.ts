import Payout, { IPayout } from "@/models/payout.model";
import { BaseRepository } from "../base.repository";
import { IPaymentRepository } from "../interfaces/IPayment.repository";
import { injectable } from "inversify";

@injectable()
export class PaymentRepository extends BaseRepository<IPayout> implements IPaymentRepository {
    constructor() {
        super(Payout);
    }
}