import { UserProfile, RoleName, PermissionCode } from '../../types';
import { INITIAL_ROLES } from '../db/seedData';

export class RBACService {
  static getRolePermissions(roleName: RoleName): PermissionCode[] {
    const role = INITIAL_ROLES.find(r => r.name === roleName);
    return role ? role.permissions : [];
  }

  static hasPermission(user: UserProfile, permission: PermissionCode): boolean {
    if (!user || !user.is_active) return false;
    if (user.roles.includes('super_admin')) return true;

    // Check direct permissions
    if (user.permissions && user.permissions.includes(permission)) {
      return true;
    }

    // Check inherited role permissions
    for (const r of user.roles) {
      const perms = this.getRolePermissions(r);
      if (perms.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  static hasAnyRole(user: UserProfile, roles: RoleName[]): boolean {
    if (!user || !user.is_active) return false;
    if (user.roles.includes('super_admin')) return true;
    return user.roles.some(r => roles.includes(r));
  }

  static isAdmin(user: UserProfile): boolean {
    return this.hasAnyRole(user, ['admin', 'super_admin', 'catalog_manager', 'order_manager']);
  }

  static canManageUsers(user: UserProfile): boolean {
    return this.hasPermission(user, 'users.update') && user.roles.includes('super_admin');
  }

  static validatePrivilegeEscalation(actor: UserProfile, targetRoles: RoleName[]): boolean {
    // A non-super_admin can never assign super_admin role
    if (!actor.roles.includes('super_admin') && targetRoles.includes('super_admin')) {
      return false;
    }
    return true;
  }
}
