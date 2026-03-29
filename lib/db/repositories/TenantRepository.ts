import { BaseRepository } from './BaseRepository';
import { Tenant } from '@prisma/client';

export class TenantRepository extends BaseRepository<Tenant> {
  constructor() {
    super('tenant');
  }

  // Override findUnique since Tenant doesn't have a tenantId
  async findUnique(id: string): Promise<Tenant | null> {
    return this.model.findFirst({
      where: { id, isDeleted: false },
    });
  }

  // Override create since Tenant doesn't have a tenantId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create(data: any): Promise<Tenant> {
    return this.model.create({
      data,
    });
  }
}

export const tenantRepository = new TenantRepository();
