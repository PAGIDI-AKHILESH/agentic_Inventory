import { auditLogRepository } from '../db/repositories/AuditLogRepository';

export interface AuditLogEvent {
  tenantId: string;
  userId?: string;
  actionType: string;
  entityType: string;
  entityId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  beforeStateJson?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  afterStateJson?: any;
  ipAddress?: string;
}

export class AuditLogger {
  /**
   * Logs an event to the audit trail.
   * This is designed to be fire-and-forget so it doesn't block the main request flow.
   */
  static log(event: AuditLogEvent) {
    // In a production environment, this might push to a message queue (e.g., Redis/Kafka)
    // For now, we write directly to the database asynchronously
    Promise.resolve().then(async () => {
      try {
        await auditLogRepository.create(event.tenantId, {
          userId: event.userId,
          actionType: event.actionType,
          entityType: event.entityType,
          entityId: event.entityId,
          beforeStateJson: event.beforeStateJson ? JSON.stringify(event.beforeStateJson) : null,
          afterStateJson: event.afterStateJson ? JSON.stringify(event.afterStateJson) : null,
          ipAddress: event.ipAddress,
        });
      } catch (error) {
        console.error('Failed to write audit log:', error);
      }
    });
  }
}
