import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types for SQL Server data
export interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  roles: Role[];
}

export interface CreateUserData {
  username: string;
  email: string;
  full_name: string;
  password: string;
  is_active: boolean;
  role_ids?: number[];
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  full_name?: string;
  is_active?: boolean;
  role_ids?: number[];
}

export interface CreateRoleData {
  name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
}

export interface UpdateRoleData {
  name?: string;
  display_name?: string;
  description?: string;
  is_active?: boolean;
}

export interface CreatePermissionData {
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface RolePermissionAssign {
  role_id: number;
  permission_ids: number[];
}

export interface UserRoleAssign {
  user_id: number;
  role_ids: number[];
}

export interface AuditLog {
  id: number;
  user_id?: number;
  username?: string;
  action: string;
  resource?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  status: string;
}

export interface DashboardSummary {
  total_users: number;
  active_users: number;
  total_logs: number;
  recent_logs: number;
  system_health: string;
  last_updated: string;
}

export interface DashboardMetric {
  id: number;
  metric_name: string;
  metric_value: number;
  metric_type: string;
  category: string;
  timestamp: string;
  description?: string;
}

// Arch Module Types
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  department?: string;
  position?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  roles: Role[];
  report_summary: {
    completed: number;
    in_progress: number;
    issues: number;
    total: number;
  };
}

export interface UserProfileDetailed extends UserProfile {
  profile_picture?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  manager?: string;
  team?: string;
  skills?: string[];
  certifications?: string[];
  recent_activity: UserActivity[];
  performance_metrics: {
    completion_rate: number;
    average_rating: number;
    total_hours: number;
    efficiency_score: number;
  };
}

export interface UserReportSummary {
  user_id: number;
  completed_reports: ReportItem[];
  in_progress_reports: ReportItem[];
  issues_reports: ReportItem[];
  statistics: {
    total_reports: number;
    completed_count: number;
    in_progress_count: number;
    issues_count: number;
    completion_rate: number;
    average_completion_time: number;
  };
}

export interface ReportItem {
  id: number;
  title: string;
  type: string;
  status: 'completed' | 'in_progress' | 'issues' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  due_date?: string;
  completion_date?: string;
  assigned_by?: string;
  description?: string;
  progress_percentage: number;
}

export interface UserActivity {
  id: number;
  user_id: number;
  activity_type: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Logging Module Types
export interface LogEntry {
  id: number;
  user_id?: number;
  username?: string;
  action: string;
  resource?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  status: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  session_id?: string;
  request_id?: string;
  module?: string;
  before_data?: string;
  after_data?: string;
}

export interface LogStats {
  total_logs: number;
  severity_breakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  status_breakdown: {
    success: number;
    failed: number;
  };
  unique_users: number;
  unique_modules: number;
  top_actions: Array<{ action: string; count: number }>;
  top_users: Array<{ username: string; count: number }>;
  daily_activity: Array<{ date: string; count: number; critical_count: number }>;
}

export interface CreateLogData {
  user_id?: number;
  username?: string;
  action: string;
  resource?: string;
  details?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  module?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_id?: string;
  before_data?: string;
  after_data?: string;
  status?: string;
}

// API functions
const api = {
  // Health check
  async healthCheck(): Promise<{ status: string; message: string; database: any }> {
    const response = await fetch('/api/health');
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  },

  // Dashboard APIs
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await fetch('/api/dashboard/summary');
    if (!response.ok) throw new Error('Failed to fetch dashboard summary');
    return response.json();
  },

  async getDashboardMetrics(category?: string): Promise<DashboardMetric[]> {
    const url = category ? `/api/dashboard/metrics?category=${category}` : '/api/dashboard/metrics';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch dashboard metrics');
    return response.json();
  },

  // User APIs
  async getUsers(activeOnly = false): Promise<User[]> {
    const url = activeOnly ? '/api/users?active_only=true' : '/api/users';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async getUser(id: number): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  async createUser(data: CreateUserData): Promise<User> {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },

  async updateUser(id: number, data: UpdateUserData): Promise<User> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  async deleteUser(id: number): Promise<void> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete user');
  },

  // Audit Log APIs
  async getAuditLogs(filters?: {
    action?: string;
    username?: string;
    days?: number;
  }): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (filters?.action) params.append('action', filters.action);
    if (filters?.username) params.append('username', filters.username);
    if (filters?.days) params.append('days', filters.days.toString());
    
    const url = `/api/audit-logs${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch audit logs');
    return response.json();
  },

  // Role APIs
  async getRoles(activeOnly = false): Promise<Role[]> {
    const url = activeOnly ? '/api/roles?active_only=true' : '/api/roles';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch roles');
    return response.json();
  },

  async getRole(id: number): Promise<Role> {
    const response = await fetch(`/api/roles/${id}`);
    if (!response.ok) throw new Error('Failed to fetch role');
    return response.json();
  },

  async createRole(data: CreateRoleData): Promise<Role> {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/roles', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create role');
    return response.json();
  },

  async updateRole(id: number, data: UpdateRoleData): Promise<Role> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`/api/roles/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update role');
    return response.json();
  },

  async deleteRole(id: number): Promise<void> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`/api/roles/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete role');
  },

  // Permission APIs
  async getPermissions(resource?: string): Promise<Permission[]> {
    const url = resource ? `/api/permissions?resource=${resource}` : '/api/permissions';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch permissions');
    return response.json();
  },

  async createPermission(data: CreatePermissionData): Promise<Permission> {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/permissions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create permission');
    return response.json();
  },

  // Role-Permission Assignment APIs
  async assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<{ message: string }> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`/api/roles/${roleId}/permissions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ role_id: roleId, permission_ids: permissionIds }),
    });
    if (!response.ok) throw new Error('Failed to assign permissions to role');
    return response.json();
  },

  // User-Role Assignment APIs
  async assignRolesToUser(userId: number, roleIds: number[]): Promise<{ message: string }> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`/api/users/${userId}/roles`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId, role_ids: roleIds }),
    });
    if (!response.ok) throw new Error('Failed to assign roles to user');
    return response.json();
  },

  async getUserRoles(userId: number): Promise<Role[]> {
    const response = await fetch(`/api/users/${userId}/roles`);
    if (!response.ok) throw new Error('Failed to fetch user roles');
    return response.json();
  },

  // Arch Module APIs
  async searchAllUsers(query?: string, filters?: {
    role?: string;
    status?: string;
    department?: string;
  }): Promise<UserProfile[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.department) params.append('department', filters.department);
    
    const url = `/api/arch/users${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to search users');
    return response.json();
  },

  async getUserProfile(userId: number): Promise<UserProfileDetailed> {
    const response = await fetch(`/api/arch/users/${userId}/profile`);
    if (!response.ok) throw new Error('Failed to fetch user profile');
    return response.json();
  },

  async getUserReports(userId: number): Promise<UserReportSummary> {
    const response = await fetch(`/api/arch/users/${userId}/reports`);
    if (!response.ok) throw new Error('Failed to fetch user reports');
    return response.json();
  },

  async getUserActivity(userId: number, days: number = 30): Promise<UserActivity[]> {
    const response = await fetch(`/api/arch/users/${userId}/activity?days=${days}`);
    if (!response.ok) throw new Error('Failed to fetch user activity');
    return response.json();
  },

  // Logging Module APIs
  async getLogs(filters?: {
    severity?: string;
    action?: string;
    username?: string;
    module?: string;
    days?: number;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<LogEntry[]> {
    const params = new URLSearchParams();
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.username) params.append('username', filters.username);
    if (filters?.module) params.append('module', filters.module);
    if (filters?.days) params.append('days', filters.days.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const url = `/api/logs${params.toString() ? '?' + params.toString() : ''}`;
    console.log('Fetching logs from:', url);
    
    const token = localStorage.getItem('access_token');
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Logs response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Logs API error:', errorText);
        throw new Error(`Failed to fetch logs: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Logs data received:', data);
      return data;
    } catch (error) {
      console.error('Error in getLogs:', error);
      throw error;
    }
  },

  async getLogStats(days: number = 30): Promise<LogStats> {
    const url = `/api/logs/stats?days=${days}`;
    console.log('Fetching log stats from:', url);
    
    const token = localStorage.getItem('access_token');
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Log stats response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Log stats API error:', errorText);
        throw new Error(`Failed to fetch log statistics: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Log stats data received:', data);
      return data;
    } catch (error) {
      console.error('Error in getLogStats:', error);
      throw error;
    }
  },

  async exportLogs(format: 'csv' | 'json' | 'xlsx' = 'csv', filters?: {
    severity?: string;
    action?: string;
    username?: string;
    module?: string;
    days?: number;
    status?: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.username) params.append('username', filters.username);
    if (filters?.module) params.append('module', filters.module);
    if (filters?.days) params.append('days', filters.days.toString());
    if (filters?.status) params.append('status', filters.status);
    
    const url = `/api/logs/export?${params.toString()}`;
    console.log('Exporting logs from:', url);
    
    try {
      const response = await fetch(url);
      console.log('Export response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export API error:', errorText);
        throw new Error(`Failed to export logs: ${response.status} ${errorText}`);
      }
      
      const blob = await response.blob();
      console.log('Export blob received, size:', blob.size);
      return blob;
    } catch (error) {
      console.error('Error in exportLogs:', error);
      throw error;
    }
  },

  async createLogEntry(data: CreateLogData): Promise<{ id: number; timestamp: string; message: string }> {
    const response = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create log entry');
    return response.json();
  },

  // Authentication APIs
  async login(username: string, password: string): Promise<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user: any;
  }> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }
    return response.json();
  },

  async logout(): Promise<{ message: string }> {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Logout failed');
    return response.json();
  },

  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }> {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) throw new Error('Token refresh failed');
    return response.json();
  },

  async getCurrentUser(): Promise<any> {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to get current user');
    return response.json();
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Password change failed');
    }
    return response.json();
  },

  async adminResetPassword(userId: number, newPassword: string): Promise<{ message: string }> {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/auth/admin/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: userId,
        new_password: newPassword,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Password reset failed');
    }
    return response.json();
  },

  // Initialize sample data
  async initSampleData(): Promise<{ message: string }> {
    const response = await fetch('/api/init-sample-data', {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to initialize sample data');
    return response.json();
  },
};

// React Query hooks
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: api.healthCheck,
    refetchInterval: 30000, // Check every 30 seconds
  });
};

// Dashboard hooks
export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: api.getDashboardSummary,
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useDashboardMetrics = (category?: string) => {
  return useQuery({
    queryKey: ['dashboard', 'metrics', category],
    queryFn: () => api.getDashboardMetrics(category),
    refetchInterval: 60000,
  });
};

// User hooks
export const useUsers = (activeOnly = false) => {
  return useQuery({
    queryKey: ['users', activeOnly],
    queryFn: () => api.getUsers(activeOnly),
  });
};

export const useUser = (id: number) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => api.getUser(id),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserData }) => 
      api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Audit log hooks
export const useAuditLogs = (filters?: {
  action?: string;
  username?: string;
  days?: number;
}) => {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => api.getAuditLogs(filters),
  });
};

// Role hooks
export const useRoles = (activeOnly = false) => {
  return useQuery({
    queryKey: ['roles', activeOnly],
    queryFn: () => api.getRoles(activeOnly),
  });
};

export const useRole = (id: number) => {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => api.getRole(id),
    enabled: !!id,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoleData }) => 
      api.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Permission hooks
export const usePermissions = (resource?: string) => {
  return useQuery({
    queryKey: ['permissions', resource],
    queryFn: () => api.getPermissions(resource),
  });
};

export const useCreatePermission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });
};

// Role-Permission Assignment hooks
export const useAssignPermissionsToRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: number; permissionIds: number[] }) =>
      api.assignPermissionsToRole(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

// User-Role Assignment hooks
export const useAssignRolesToUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, roleIds }: { userId: number; roleIds: number[] }) =>
      api.assignRolesToUser(userId, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUserRoles = (userId: number) => {
  return useQuery({
    queryKey: ['users', userId, 'roles'],
    queryFn: () => api.getUserRoles(userId),
    enabled: !!userId,
  });
};

// Arch Module hooks
export const useSearchAllUsers = (query?: string, filters?: {
  role?: string;
  status?: string;
  department?: string;
}) => {
  return useQuery({
    queryKey: ['arch', 'users', query, filters],
    queryFn: () => api.searchAllUsers(query, filters),
    enabled: true,
  });
};

export const useUserProfile = (userId: number) => {
  return useQuery({
    queryKey: ['arch', 'users', userId, 'profile'],
    queryFn: () => api.getUserProfile(userId),
    enabled: !!userId,
  });
};

export const useUserReports = (userId: number) => {
  return useQuery({
    queryKey: ['arch', 'users', userId, 'reports'],
    queryFn: () => api.getUserReports(userId),
    enabled: !!userId,
  });
};

export const useUserActivity = (userId: number, days: number = 30) => {
  return useQuery({
    queryKey: ['arch', 'users', userId, 'activity', days],
    queryFn: () => api.getUserActivity(userId, days),
    enabled: !!userId,
  });
};

// Logging Module hooks
export const useLogs = (filters?: {
  severity?: string;
  action?: string;
  username?: string;
  module?: string;
  days?: number;
  status?: string;
  skip?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['logs', filters],
    queryFn: () => api.getLogs(filters),
    refetchInterval: 30000, // Refresh every 30 seconds for real-time logs
  });
};

export const useLogStats = (days: number = 30) => {
  return useQuery({
    queryKey: ['logs', 'stats', days],
    queryFn: () => api.getLogStats(days),
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useExportLogs = () => {
  return useMutation({
    mutationFn: ({ format, filters }: { 
      format: 'csv' | 'json' | 'xlsx'; 
      filters?: {
        severity?: string;
        action?: string;
        username?: string;
        module?: string;
        days?: number;
        status?: string;
      }
    }) => api.exportLogs(format, filters),
  });
};

export const useCreateLogEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createLogEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
};

// Authentication hooks
export const useLogin = () => {
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      api.login(username, password),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
    },
  });
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: api.refreshToken,
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: api.getCurrentUser,
    enabled: !!localStorage.getItem('access_token'),
    retry: false,
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { 
      currentPassword: string; 
      newPassword: string; 
    }) => api.changePassword(currentPassword, newPassword),
  });
};

export const useAdminResetPassword = () => {
  return useMutation({
    mutationFn: ({ userId, newPassword }: { 
      userId: number; 
      newPassword: string; 
    }) => api.adminResetPassword(userId, newPassword),
  });
};

// Utility hooks
export const useInitSampleData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.initSampleData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};