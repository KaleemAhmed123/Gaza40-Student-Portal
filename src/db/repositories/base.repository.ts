import mongoose, { Document, Model, UpdateQuery } from "mongoose";

// Mongoose v9 does not export FilterQuery as a named type; use a plain Record alias
type FilterQuery<T> = Record<string, any>;

/**
 * Base Repository class to encapsulate common Mongoose operations.
 * Implements soft delete behavior automatically for models that have a deletedAt field.
 */
export class BaseRepository<T extends Document> {
  constructor(protected model: Model<T>) {}

  /**
   * Helper to ensure soft-deleted records are excluded by default if the schema supports it.
   */
  protected getActiveFilter(filter: FilterQuery<T> = {}, includeDeleted = false): FilterQuery<T> {
    if (includeDeleted) {
      return filter;
    }
    if (this.model.schema.paths.deletedAt) {
      // Return filter merged with deletedAt: null or { $exists: false } or similar.
      // Since we default deletedAt to null, checking deletedAt: null is correct.
      return { deletedAt: null, ...filter };
    }
    return filter;
  }

  async find(
    filter: FilterQuery<T> = {},
    options: { sort?: any; limit?: number; skip?: number; populate?: any; includeDeleted?: boolean } = {}
  ): Promise<T[]> {
    let query = this.model.find(this.getActiveFilter(filter, options.includeDeleted));
    if (options.sort) query = query.sort(options.sort);
    if (options.skip) query = query.skip(options.skip);
    if (options.limit) query = query.limit(options.limit);
    if (options.populate) query = query.populate(options.populate);
    return query.exec();
  }

  async findOne(filter: FilterQuery<T> = {}, populate?: any, includeDeleted = false): Promise<T | null> {
    let query = this.model.findOne(this.getActiveFilter(filter, includeDeleted));
    if (populate) query = query.populate(populate);
    return query.exec();
  }

  async findById(id: string, populate?: any, includeDeleted = false): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    let query = this.model.findOne(this.getActiveFilter({ _id: id } as any, includeDeleted));
    if (populate) query = query.populate(populate);
    return query.exec();
  }

  async create(data: any): Promise<T> {
    const doc = new this.model(data);
    return doc.save();
  }

  async update(id: string, data: UpdateQuery<T>, includeDeleted = false): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return this.model.findOneAndUpdate(
      this.getActiveFilter({ _id: id } as any, includeDeleted),
      data,
      { new: true }
    ).exec();
  }

  async updateMany(filter: FilterQuery<T>, data: UpdateQuery<T>, includeDeleted = false) {
    return this.model.updateMany(
      this.getActiveFilter(filter, includeDeleted),
      data
    ).exec();
  }

  async delete(id: string): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    if (this.model.schema.paths.deletedAt) {
      return this.model.findByIdAndUpdate(
        id,
        { deletedAt: new Date() } as any,
        { new: true }
      ).exec();
    }
    return this.model.findByIdAndDelete(id).exec();
  }

  async hardDelete(id: string): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return this.model.findByIdAndDelete(id).exec();
  }

  async count(filter: FilterQuery<T> = {}, includeDeleted = false): Promise<number> {
    return this.model.countDocuments(this.getActiveFilter(filter, includeDeleted)).exec();
  }
}
