import crypto from 'crypto';
import { db } from '../db/schema';
import { AuditLog } from '../../types';

export class AuditService {
  static log(entry: {
    userId?: string;
    userEmail?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }): AuditLog {
    const record: AuditLog = {
      id: crypto.randomUUID(),
      user_id: entry.userId,
      user_email: entry.userEmail,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId,
      metadata: entry.metadata,
      ip_address: entry.ipAddress,
      created_at: new Date().toISOString()
    };

    db.auditLogs.unshift(record);
    if (db.auditLogs.length > 2000) {
      db.auditLogs.pop();
    }

    return record;
  }

  static getLogs(limit: number = 100): AuditLog[] {
    return db.auditLogs.slice(0, limit);
  }
}
