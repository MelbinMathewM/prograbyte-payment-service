import { FilterQuery, UpdateQuery } from "mongoose";

export interface IBaseRepository<T> {
    create(data: Partial<T>): Promise<T>;
    findAll(filter?: object): Promise<T[]>;
    findOne(filter: FilterQuery<T>, session?: any): Promise<T | null>;
    findById(id: string): Promise<T | null>;
    updateById(id: string, updatedData: Partial<T>): Promise<T | null>;
    updateOne(filter: FilterQuery<T>, updatedData: UpdateQuery<T>): Promise<T | null>;
    deleteById(id: string): Promise<boolean>;
    save(document: T): Promise<T>;
    aggregate(pipeline: any[]): Promise<any[]>;
    startSession(): Promise<any>;
}
