import { Schema, model, Types, Document } from "mongoose";

export interface IPayout extends Document {
    tutor_id: Types.ObjectId;
    type: "course" | "live";
    source_id: Types.ObjectId;
    amount: number;
    tutorShare: number;
    adminShare: number;
    status: "pending" | "paid";
    createdAt: Date;
    paidAt?: Date;
    isRefunded: boolean;
}

const payoutSchema = new Schema<IPayout>({
    tutor_id: {
        type: Schema.ObjectId,
        required: true
    },
    type: { 
        type: String, 
        enum: ["course", "live"], 
        required: true 
    },
    source_id: { 
        type: Schema.ObjectId, 
        required: true 
    },
    amount: {
        type: Number,
        required: true
    },
    tutorShare: {
        type: Number,
        required: true
    },
    adminShare: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ["pending", "paid"], 
        default: "pending" 
    },
    paidAt: { 
        type: Date 
    },
    isRefunded: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Payout = model<IPayout>("Payout", payoutSchema);
export default Payout;
