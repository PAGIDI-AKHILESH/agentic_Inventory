import { prisma } from '../prisma';

export class BaseRepository<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected model: any;

  constructor(modelName: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.model = (prisma as any)[modelName];
  }

  async findUnique(tenantId: string, id: string): Promise<T | null> {
    return this.model.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async findMany(tenantId: string, where: any = {}): Promise<T[]> {
    return this.model.findMany({
      where: { ...where, tenantId, isDeleted: false },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create(tenantId: string, data: any): Promise<T> {
    return this.model.create({
      data: { ...data, tenantId },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async update(tenantId: string, id: string, data: any): Promise<T> {
    // Ensure the record belongs to the tenant before updating
    const existing = await this.findUnique(tenantId, id);
    if (!existing) {
      throw new Error('Record not found or unauthorized');
    }
    return this.model.update({
      where: { id },
      data,
    });
  }

  async softDelete(tenantId: string, id: string): Promise<T> {
    const existing = await this.findUnique(tenantId, id);
    if (!existing) {
      throw new Error('Record not found or unauthorized');
    }
    return this.model.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }
}
