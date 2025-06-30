import Wallet, { IWallet } from "@/models/wallet.model";
import { BaseRepository } from "../base.repository";
import { IWalletRepository } from "../interfaces/IWallet.repository";
import { injectable } from "inversify";

@injectable()
export class WalletRepository extends BaseRepository<IWallet> implements IWalletRepository {
    constructor() {
        super(Wallet)
    }
}