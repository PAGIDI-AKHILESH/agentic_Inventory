import { BaseRepository } from './BaseRepository';
import { InventoryItem } from '@prisma/client';

export class InventoryRepository extends BaseRepository<InventoryItem> {
  constructor() {
    super('inventoryItem');
  }

  async findBySku(tenantId: string, sku: string): Promise<InventoryItem | null> {
    return this.model.findFirst({
      where: { sku, tenantId, isDeleted: false },
    });
  }
}

export const inventoryRepository = new InventoryRepository();
