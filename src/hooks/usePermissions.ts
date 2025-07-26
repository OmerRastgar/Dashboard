import { useAuth } from '@/contexts/AuthContext';

export interface Permission {
  name: string;
  display_name: string;
  resource: string;
  action: string;
}

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Check if user has the specific permission in their permissions array
    const userPermissions = user.permissions || [];
    return userPermissions.includes(permission);
  };

  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    // Handle both string array and object array for roles
    return user.roles?.some(role => {
      if (typeof role === 'string') {
        return role.toLowerCase() === roleName.toLowerCase();
      } else if (typeof role === 'object' && role.name) {
        return role.name.toLowerCase() === roleName.toLowerCase();
      }
      return false;
    }) || false;
  };

  // Page access permissions - check actual permissions
  const canViewDashboard = () => {
    return hasPermission('dashboard.read') || 
           hasPermission('dashboard.metrics') || 
           hasPermission('dashboard.summary');
  };

  const canViewUsers = () => {
    return hasPermission('users.read') || hasRole('admin');
  };

  const canViewRoles = () => {
    return hasPermission('roles.read') || hasRole('admin');
  };

  const canViewLogs = () => {
    return hasPermission('logs.read') || hasRole('admin');
  };

  // User management permissions
  const canCreateUsers = () => {
    return hasPermission('users.create') || hasRole('admin');
  };

  const canEditUsers = () => {
    return hasPermission('users.update') || hasRole('admin');
  };

  const canDeleteUsers = () => {
    return hasPermission('users.delete') || hasRole('admin');
  };

  const canToggleUserStatus = () => {
    return hasPermission('users.toggle_status');
  };

  const canManageUserRoles = () => {
    return hasPermission('users.manage_roles');
  };

  const canResetPasswords = () => {
    return hasPermission('system.admin') || hasPermission('users.manage_roles');
  };

  // Legacy function name for backward compatibility
  const canManageRoles = () => {
    return canManageUserRoles();
  };

  // Role management permissions
  const canCreateRoles = () => {
    return hasPermission('roles.create');
  };

  const canEditRoles = () => {
    return hasPermission('roles.update');
  };

  const canDeleteRoles = () => {
    return hasPermission('roles.delete');
  };

  const canManageRolePermissions = () => {
    return hasPermission('roles.manage_permissions');
  };

  // Log permissions
  const canExportLogs = () => {
    return hasPermission('logs.export');
  };

  const canCreateLogs = () => {
    return hasPermission('logs.create');
  };

  // System permissions
  const canAccessSystemSettings = () => {
    return hasPermission('system.settings');
  };

  const canPerformSystemMaintenance = () => {
    return hasPermission('system.maintenance');
  };

  // Data permissions
  const canExportData = () => {
    return hasPermission('data.export');
  };

  const canImportData = () => {
    return hasPermission('data.import');
  };

  // Convenience methods
  const isAdmin = () => {
    return hasRole('admin') || hasPermission('system.admin');
  };

  const isEditor = () => {
    return hasRole('editor');
  };

  const canAccessUsersModule = () => {
    return canViewUsers();
  };

  const canAccessRolesModule = () => {
    return canViewRoles();
  };

  const canAccessLogsModule = () => {
    return canViewLogs();
  };

  return {
    // Core permission functions
    hasPermission,
    hasRole,
    
    // Page access permissions
    canViewDashboard,
    canViewUsers,
    canViewRoles,
    canViewLogs,
    
    // User management permissions
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canToggleUserStatus,
    canManageUserRoles,
    canManageRoles, // Legacy function name
    canResetPasswords,
    
    // Role management permissions
    canCreateRoles,
    canEditRoles,
    canDeleteRoles,
    canManageRolePermissions,
    
    // Log permissions
    canExportLogs,
    canCreateLogs,
    
    // System permissions
    canAccessSystemSettings,
    canPerformSystemMaintenance,
    
    // Data permissions
    canExportData,
    canImportData,
    
    // Convenience methods
    isAdmin,
    isEditor,
    canAccessUsersModule,
    canAccessRolesModule,
    canAccessLogsModule,
  };
};