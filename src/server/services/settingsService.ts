import crypto from 'crypto';
import { db } from '../db/schema';
import { SystemSettings } from '../../types';

export class SettingsService {
  static getSettings(): SystemSettings {
    return { ...db.settings };
  }

  static updateExchangeRate(newRate: number, userId?: string): SystemSettings {
    if (newRate <= 0) {
      throw new Error('Exchange rate must be greater than 0');
    }

    const prevRate = db.settings.exchange_rate_usd_to_ngn;
    db.settings.exchange_rate_usd_to_ngn = newRate;

    db.auditLogs.push({
      id: crypto.randomUUID(),
      user_id: userId,
      action: 'SYSTEM_SETTINGS_CHANGED',
      entity: 'system_settings',
      entity_id: 'exchange_rate_usd_to_ngn',
      metadata: { previous_rate: prevRate, new_rate: newRate },
      created_at: new Date().toISOString()
    });

    return { ...db.settings };
  }

  static updateSettings(partial: Partial<SystemSettings>, userId?: string): SystemSettings {
    db.settings = {
      ...db.settings,
      ...partial
    };

    db.auditLogs.push({
      id: crypto.randomUUID(),
      user_id: userId,
      action: 'SYSTEM_SETTINGS_CHANGED',
      entity: 'system_settings',
      entity_id: 'general_settings',
      metadata: partial,
      created_at: new Date().toISOString()
    });

    return { ...db.settings };
  }
}
