import crypto from 'crypto';
import { db } from '../db/schema';
import { UserProfile, RoleName, PermissionCode, Address } from '../../types';

// Simple signed token mechanism for standalone session management
const TOKEN_SECRET = process.env.JWT_SECRET || 'spinel-distribution-jwt-production-secret-key-32chars';

export function generateSessionToken(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const b64 = Buffer.from(payload).toString('base64url');
  const hmac = crypto.createHmac('sha256', TOKEN_SECRET).update(b64).digest('base64url');
  return `${b64}.${hmac}`;
}

export function verifySessionToken(token: string): { userId: string } | null {
  try {
    const [b64, hmac] = token.split('.');
    if (!b64 || !hmac) return null;
    const expectedHmac = crypto.createHmac('sha256', TOKEN_SECRET).update(b64).digest('base64url');
    if (hmac !== expectedHmac) return null;
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export class AuthService {
  static async register(params: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }): Promise<{ user: UserProfile; token: string }> {
    const existing = Array.from(db.users.values()).find(u => u.email.toLowerCase() === params.email.toLowerCase().trim());
    if (existing) {
      throw new Error('An account with this email address already exists');
    }

    const userId = crypto.randomUUID();
    const newUser: UserProfile & { password_hash: string } = {
      id: userId,
      email: params.email.toLowerCase().trim(),
      first_name: params.first_name.trim(),
      last_name: params.last_name.trim(),
      phone: params.phone?.trim() || '',
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
      is_active: true,
      email_verified: false,
      roles: ['customer'],
      permissions: ['catalog.read'],
      password_hash: params.password, // In real app use argon2/bcrypt
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.users.set(userId, newUser);

    // Audit log
    db.auditLogs.push({
      id: crypto.randomUUID(),
      user_id: userId,
      user_email: newUser.email,
      action: 'CUSTOMER_REGISTRATION',
      entity: 'profiles',
      entity_id: userId,
      created_at: new Date().toISOString()
    });

    const token = generateSessionToken(userId);
    const { password_hash, ...safeUser } = newUser;
    return { user: safeUser, token };
  }

  static async login(params: {
    email: string;
    password: string;
  }): Promise<{ user: UserProfile; token: string }> {
    const user = Array.from(db.users.values()).find(u => u.email.toLowerCase() === params.email.toLowerCase().trim());
    if (!user || user.password_hash !== params.password) {
      throw new Error('Invalid email or password');
    }

    if (!user.is_active) {
      throw new Error('Account is suspended. Please contact Spinel Distribution support.');
    }

    const token = generateSessionToken(user.id);

    // Audit log
    db.auditLogs.push({
      id: crypto.randomUUID(),
      user_id: user.id,
      user_email: user.email,
      action: 'USER_LOGIN',
      entity: 'profiles',
      entity_id: user.id,
      created_at: new Date().toISOString()
    });

    const { password_hash, ...safeUser } = user;
    return { user: safeUser, token };
  }

  static async getProfile(userId: string): Promise<UserProfile | null> {
    const user = db.users.get(userId);
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  static async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const user = db.users.get(userId);
    if (!user) throw new Error('User not found');

    const updated = {
      ...user,
      first_name: data.first_name || user.first_name,
      last_name: data.last_name || user.last_name,
      phone: data.phone !== undefined ? data.phone : user.phone,
      avatar_url: data.avatar_url || user.avatar_url,
      updated_at: new Date().toISOString()
    };

    db.users.set(userId, updated);
    const { password_hash, ...safeUser } = updated;
    return safeUser;
  }

  static async getAddresses(userId: string): Promise<Address[]> {
    return Array.from(db.addresses.values()).filter(a => a.user_id === userId);
  }

  static async addAddress(userId: string, addressData: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Address> {
    const newAddr: Address = {
      id: crypto.randomUUID(),
      user_id: userId,
      ...addressData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // If marked as default, unset other defaults
    if (newAddr.is_default) {
      for (const addr of db.addresses.values()) {
        if (addr.user_id === userId) {
          addr.is_default = false;
        }
      }
    }

    db.addresses.set(newAddr.id, newAddr);
    return newAddr;
  }
}
