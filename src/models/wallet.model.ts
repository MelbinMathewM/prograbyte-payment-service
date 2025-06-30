import { Schema, Document, model, Types } from "mongoose";

export interface ITransaction {
    amount: number;
    type: "credit" | "debit";
    source: "course" | "premium";
    source_id?: Types.ObjectId;
    description: string;
    date: Date;
}

export interface IWallet extends Document {
    user_id: Types.ObjectId;
    balance: number;
    transactions: ITransaction[];
}

const walletSchema = new Schema<IWallet>({
    user_id: {
        type: Schema.ObjectId,
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    transactions: [{
        amount: {
            type: Number,
            required: true
        },
        type: {
            type: String,
            enum: ["credit", "debit"],
            required: true
        },
        source: {
            type: String,
            enum: ["course", "premium"],
            required: true
        },
        source_id: {
            type: Schema.ObjectId,
        },
        description: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

const Wallet = model<IWallet>("Wallet", walletSchema);

export default Wallet;
