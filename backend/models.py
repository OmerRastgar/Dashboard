from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Role Models
class RoleBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    is_active: bool = True

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class RoleResponse(RoleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    permissions: Optional[List['PermissionResponse']] = []
    
    class Config:
        from_attributes = True

# Permission Models
class PermissionBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    resource: str
    action: str

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    resource: Optional[str] = None
    action: Optional[str] = None

class PermissionResponse(PermissionBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Role Permission Assignment
class RolePermissionAssign(BaseModel):
    role_id: int
    permission_ids: List[int]

class RolePermissionResponse(BaseModel):
    id: int
    role_id: int
    permission_id: int
    created_at: datetime

# User Role Assignment
class UserRoleAssign(BaseModel):
    user_id: int
    role_ids: List[int]

class UserRoleResponse(BaseModel):
    id: int
    user_id: int
    role_id: int
    assigned_at: datetime
    assigned_by: Optional[int] = None

# Updated User Models
class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    is_active: bool = True

class UserCreate(UserBase):
    role_ids: Optional[List[int]] = []

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role_ids: Optional[List[int]] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime] = None
    roles: Optional[List[RoleResponse]] = []
    permissions: Optional[List[str]] = []
    
    class Config:
        from_attributes = True

# Audit Log Models
class AuditLogBase(BaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    resource: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    status: str = "success"

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogResponse(AuditLogBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Dashboard Models
class DashboardMetricBase(BaseModel):
    metric_name: str
    metric_value: float
    metric_type: str
    category: str
    description: Optional[str] = None

class DashboardMetricCreate(DashboardMetricBase):
    pass

class DashboardMetricResponse(DashboardMetricBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

class DashboardSummary(BaseModel):
    total_users: int
    active_users: int
    total_logs: int
    recent_logs: int
    system_health: str
    last_updated: datetime

# Permission Check Models
class PermissionCheck(BaseModel):
    user_id: int
    resource: str
    action: str

class PermissionCheckResponse(BaseModel):
    has_permission: bool
    roles: List[str]
    permissions: List[str]

# Authentication Models
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class AdminPasswordResetRequest(BaseModel):
    user_id: int
    new_password: str

class UserCreateWithPassword(UserCreate):
    password: str

class UserUpdateWithPassword(UserUpdate):
    password: Optional[str] = None