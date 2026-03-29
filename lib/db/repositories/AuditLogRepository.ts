import { BaseRepository } from './BaseRepository';
import { AuditLog } from '@prisma/client';

export class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor() {
    super('auditLog');
  }

  // Audit logs are append-only, so we override update and softDelete to throw errors
  async update(): Promise<AuditLog> {
    throw new Error('Audit logs are append-only and cannot be updated.');
  }

  async softDelete(): Promise<AuditLog> {
    throw new Error('Audit logs are append-only and cannot be deleted.');
  }
}

export const auditLogRepository = new AuditLogRepository();
