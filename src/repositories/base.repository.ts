import { Model, Document, FilterQuery, UpdateQuery } from "mongoose";
import { IBaseRepository } from "./IBase.repository";

export class BaseRepository<T extends Document> implements IBaseRepository<T> {
    protected model: Model<T>;

    constructor(model: Model<T>) {
        this.model = model;
    }

    async create(data: Partial<T>): Promise<T> {
        try {
            return await this.model.create(data);
        } catch (error) {
            console.error("BaseRepository Create Error:", error);
            throw new Error("Failed to create");
        }
    }

    async findAll(filter: object = {}): Promise<T[]> {
        try {
            return await this.model.find(filter);
        } catch (error) {
            console.error("BaseRepository Find All Error:", error);
            throw new Error("Failed to fetch data");
        }
    }
    
    async findOne(filter: FilterQuery<T>, session?: any): Promise<T | null> {
        try {
            return await this.model.findOne(filter).session(session);
        } catch (error) {
            console.error("BaseRepository FindById Error:", error);
            throw new Error("Failed to fetch data");
        }
    }

    async findById(id: string): Promise<T | null> {
        try {
            return await this.model.findById(id);
        } catch (error) {
            console.error("BaseRepository FindById Error:", error);
            throw new Error("Failed to fetch data");
        }
    }

    async updateById(id: string, updatedData: Partial<T>): Promise<T | null> {
        try {
            return await this.model.findByIdAndUpdate(id, updatedData, { new: true });
        } catch (error) {
            console.error("BaseRepository Update Error:", error);
            throw new Error("Failed to update");
        }
    }

    async updateOne(filter: FilterQuery<T>, updatedData: UpdateQuery<T>): Promise<T | null> {
        try {
            return await this.model.findOneAndUpdate(filter, updatedData, { new: true });
        } catch (error) {
            console.error("BaseRepository updateOne Error:", error);
            throw new Error("Failed to update");
        }
    }

    async deleteById(id: string): Promise<boolean> {
        try {
            const result = await this.model.findByIdAndDelete(id);
            return result !== null;
        } catch (error) {
            console.error("BaseRepository Delete Error:", error);
            throw new Error("Failed to delete");
        }
    }

    async save(document: T): Promise<T> {
        return document.save();
    }

    async aggregate(pipeline: any[]): Promise<any[]> {
        return this.model.aggregate(pipeline);
    }

    async startSession() {
        return this.model.startSession();
    }
}
