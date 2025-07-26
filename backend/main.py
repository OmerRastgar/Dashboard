from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from typing import List, Optional
from datetime import datetime, timedelta
import uvicorn
import pyodbc

from database import get_db_connection, test_connection, create_tables
from auth import (
    verify_password, get_password_hash, create_access_token, create_refresh_token,
    verify_token, generate_reset_token, get_current_user, get_current_active_user,
    require_permission, require_admin, ACCESS_TOKEN_EXPIRE_MINUTES, MAX_FAILED_ATTEMPTS,
    LOCKOUT_DURATION_MINUTES
)
from models import (
    # User models
    UserCreate, UserUpdate, UserResponse, UserCreateWithPassword, UserUpdateWithPassword,
    # Role models
    RoleCreate, RoleUpdate, RoleResponse,
    # Permission models
    PermissionCreate, PermissionUpdate, PermissionResponse,
    # Assignment models
    RolePermissionAssign, UserRoleAssign, UserRoleResponse,
    PermissionCheck, PermissionCheckResponse,
    # Authentication models
    LoginRequest, LoginResponse, RefreshTokenRequest, PasswordResetRequest,
    PasswordResetConfirm, ChangePasswordRequest, AdminPasswordResetRequest,
    # Other models
    AuditLogCreate, AuditLogResponse,
    DashboardMetricCreate, DashboardMetricResponse,
    DashboardSummary
)

# Create tables on startup
create_tables()

app = FastAPI(title="Dashboard Backend with RBAC", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Dashboard Backend with RBAC is running!"}

@app.get("/api/health")
async def health_check():
    db_status = test_connection()
    return {
        "status": "healthy",
        "message": "Backend is running",
        "database": db_status
    }

# ============================================================================
# ROLE MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/api/roles", response_model=List[RoleResponse])
async def get_roles(
    skip: int = 0,
    limit: int = Query(default=100, le=1000),
    active_only: bool = False
):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            if active_only:
                cursor.execute("""
                    SELECT id, name, display_name, description, is_active, created_at, updated_at
                    FROM roles 
                    WHERE is_active = 1
                    ORDER BY display_name
                    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
                """, skip, limit)
            else:
                cursor.execute("""
                    SELECT id, name, display_name, description, is_active, created_at, updated_at
                    FROM roles 
                    ORDER BY display_name
                    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
                """, skip, limit)
            
            roles = []
            for row in cursor.fetchall():
                role = RoleResponse(
                    id=row[0],
                    name=row[1],
                    display_name=row[2],
                    description=row[3],
                    is_active=bool(row[4]),
                    created_at=row[5],
                    updated_at=row[6],
                    permissions=[]
                )
                
                # Get permissions for this role
                cursor.execute("""
                    SELECT p.id, p.name, p.display_name, p.description, p.resource, p.action, p.created_at
                    FROM permissions p
                    INNER JOIN role_permissions rp ON p.id = rp.permission_id
                    WHERE rp.role_id = ?
                """, row[0])
                
                permissions = []
                for perm_row in cursor.fetchall():
                    permissions.append(PermissionResponse(
                        id=perm_row[0],
                        name=perm_row[1],
                        display_name=perm_row[2],
                        description=perm_row[3],
                        resource=perm_row[4],
                        action=perm_row[5],
                        created_at=perm_row[6]
                    ))
                
                role.permissions = permissions
                roles.append(role)
            
            return roles
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/roles/{role_id}", response_model=RoleResponse)
async def get_role(role_id: int):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, name, display_name, description, is_active, created_at, updated_at
                FROM roles WHERE id = ?
            """, role_id)
            
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Role not found")
            
            role = RoleResponse(
                id=row[0],
                name=row[1],
                display_name=row[2],
                description=row[3],
                is_active=bool(row[4]),
                created_at=row[5],
                updated_at=row[6],
                permissions=[]
            )
            
            # Get permissions for this role
            cursor.execute("""
                SELECT p.id, p.name, p.display_name, p.description, p.resource, p.action, p.created_at
                FROM permissions p
                INNER JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = ?
            """, role_id)
            
            permissions = []
            for perm_row in cursor.fetchall():
                permissions.append(PermissionResponse(
                    id=perm_row[0],
                    name=perm_row[1],
                    display_name=perm_row[2],
                    description=perm_row[3],
                    resource=perm_row[4],
                    action=perm_row[5],
                    created_at=perm_row[6]
                ))
            
            role.permissions = permissions
            return role
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/roles", response_model=RoleResponse)
async def create_role(role: RoleCreate, current_user: dict = Depends(get_current_active_user)):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check if role name already exists
            cursor.execute("SELECT COUNT(*) FROM roles WHERE name = ?", role.name)
            if cursor.fetchone()[0] > 0:
                raise HTTPException(status_code=400, detail="Role name already exists")
            
            cursor.execute("""
                INSERT INTO roles (name, display_name, description, is_active)
                OUTPUT INSERTED.id, INSERTED.name, INSERTED.display_name, INSERTED.description,
                       INSERTED.is_active, INSERTED.created_at, INSERTED.updated_at
                VALUES (?, ?, ?, ?)
            """, role.name, role.display_name, role.description, role.is_active)
            
            row = cursor.fetchone()
            
            # Log the activity
            log_activity(
                conn=conn,
                user_id=current_user.get("sub"),
                username=current_user.get("username"),
                action="create_role",
                resource="roles",
                details=f"Created role: {role.display_name} ({role.name})",
                severity="medium",
                module="role_management",
                after_data=f"Role ID: {row[0]}, Name: {role.name}, Display: {role.display_name}",
                status="success"
            )
            
            conn.commit()
            
            return RoleResponse(
                id=row[0],
                name=row[1],
                display_name=row[2],
                description=row[3],
                is_active=bool(row[4]),
                created_at=row[5],
                updated_at=row[6],
                permissions=[]
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.put("/api/roles/{role_id}", response_model=RoleResponse)
async def update_role(role_id: int, role_update: RoleUpdate, current_user: dict = Depends(get_current_active_user)):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get existing role data for logging
            cursor.execute("SELECT name, display_name, description, is_active FROM roles WHERE id = ?", role_id)
            existing_role = cursor.fetchone()
            if not existing_role:
                raise HTTPException(status_code=404, detail="Role not found")
            
            old_name, old_display_name, old_description, old_is_active = existing_role
            
            # Build update query
            update_fields = []
            update_values = []
            changes = []
            
            if role_update.name is not None and role_update.name != old_name:
                update_fields.append("name = ?")
                update_values.append(role_update.name)
                changes.append(f"name: '{old_name}' -> '{role_update.name}'")
            if role_update.display_name is not None and role_update.display_name != old_display_name:
                update_fields.append("display_name = ?")
                update_values.append(role_update.display_name)
                changes.append(f"display_name: '{old_display_name}' -> '{role_update.display_name}'")
            if role_update.description is not None and role_update.description != old_description:
                update_fields.append("description = ?")
                update_values.append(role_update.description)
                changes.append(f"description: '{old_description}' -> '{role_update.description}'")
            if role_update.is_active is not None and role_update.is_active != old_is_active:
                update_fields.append("is_active = ?")
                update_values.append(role_update.is_active)
                changes.append(f"is_active: {old_is_active} -> {role_update.is_active}")
            
            if not update_fields:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            update_fields.append("updated_at = GETDATE()")
            update_values.append(role_id)
            
            cursor.execute(f"""
                UPDATE roles 
                SET {', '.join(update_fields)}
                WHERE id = ?
            """, *update_values)
            
            # Log the activity
            if changes:
                log_activity(
                    conn=conn,
                    user_id=current_user.get("sub"),
                    username=current_user.get("username"),
                    action="update_role",
                    resource="roles",
                    details=f"Updated role: {old_display_name} ({old_name})",
                    severity="medium",
                    module="role_management",
                    before_data=f"name: {old_name}, display: {old_display_name}, description: {old_description}, active: {old_is_active}",
                    after_data=f"Changes: {', '.join(changes)}",
                    status="success"
                )
            
            conn.commit()
            
            # Return updated role
            return await get_role(role_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.delete("/api/roles/{role_id}")
async def delete_role(role_id: int, current_user: dict = Depends(get_current_active_user)):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get role details for logging
            cursor.execute("SELECT name, display_name FROM roles WHERE id = ?", role_id)
            role_row = cursor.fetchone()
            if not role_row:
                raise HTTPException(status_code=404, detail="Role not found")
            
            role_name, role_display_name = role_row
            
            # Delete role (cascade will handle role_permissions and user_roles)
            cursor.execute("DELETE FROM roles WHERE id = ?", role_id)
            
            # Log the activity with the authenticated user
            log_activity(
                conn=conn,
                user_id=current_user.get("sub"),
                username=current_user.get("username"),
                action="delete_role",
                resource="roles",
                details=f"Deleted role: {role_display_name} ({role_name})",
                severity="high",
                module="role_management",
                before_data=f"Role ID: {role_id}, Name: {role_name}, Display: {role_display_name}",
                status="success"
            )
            
            conn.commit()
            
            return {"message": f"Role {role_name} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============================================================================
# PERMISSION MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/api/permissions", response_model=List[PermissionResponse])
async def get_permissions(
    skip: int = 0,
    limit: int = Query(default=100, le=1000),
    resource: Optional[str] = None
):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            if resource:
                cursor.execute("""
                    SELECT id, name, display_name, description, resource, action, created_at
                    FROM permissions 
                    WHERE resource = ?
                    ORDER BY resource, action
                    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
                """, resource, skip, limit)
            else:
                cursor.execute("""
                    SELECT id, name, display_name, description, resource, action, created_at
                    FROM permissions 
                    ORDER BY resource, action
                    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
                """, skip, limit)
            
            permissions = []
            for row in cursor.fetchall():
                permissions.append(PermissionResponse(
                    id=row[0],
                    name=row[1],
                    display_name=row[2],
                    description=row[3],
                    resource=row[4],
                    action=row[5],
                    created_at=row[6]
                ))
            
            return permissions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/permissions", response_model=PermissionResponse)
async def create_permission(permission: PermissionCreate, current_user: dict = Depends(get_current_active_user)):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check if permission name already exists
            cursor.execute("SELECT COUNT(*) FROM permissions WHERE name = ?", permission.name)
            if cursor.fetchone()[0] > 0:
                raise HTTPException(status_code=400, detail="Permission name already exists")
            
            cursor.execute("""
                INSERT INTO permissions (name, display_name, description, resource, action)
                OUTPUT INSERTED.id, INSERTED.name, INSERTED.display_name, INSERTED.description,
                       INSERTED.resource, INSERTED.action, INSERTED.created_at
                VALUES (?, ?, ?, ?, ?)
            """, permission.name, permission.display_name, permission.description, 
                 permission.resource, permission.action)
            
            row = cursor.fetchone()
            
            # Log the activity
            log_activity(
                conn=conn,
                user_id=current_user.get("sub"),
                username=current_user.get("username"),
                action="create_permission",
                resource="permissions",
                details=f"Created permission: {permission.display_name} ({permission.name})",
                severity="medium",
                module="permission_management",
                after_data=f"Permission ID: {row[0]}, Name: {permission.name}, Resource: {permission.resource}, Action: {permission.action}",
                status="success"
            )
            
            conn.commit()
            
            return PermissionResponse(
                id=row[0],
                name=row[1],
                display_name=row[2],
                description=row[3],
                resource=row[4],
                action=row[5],
                created_at=row[6]
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============================================================================
# ROLE-PERMISSION ASSIGNMENT ENDPOINTS
# ============================================================================

@app.post("/api/roles/{role_id}/permissions")
async def assign_permissions_to_role(role_id: int, assignment: RolePermissionAssign, current_user: dict = Depends(get_current_active_user)):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get role details for logging
            cursor.execute("SELECT name, display_name FROM roles WHERE id = ?", role_id)
            role_row = cursor.fetchone()
            if not role_row:
                raise HTTPException(status_code=404, detail="Role not found")
            
            role_name, role_display_name = role_row
            
            # Get current permissions for logging
            cursor.execute("SELECT permission_id FROM role_permissions WHERE role_id = ?", role_id)
            old_permission_ids = [row[0] for row in cursor.fetchall()]
            
            # Clear existing permissions for this role
            cursor.execute("DELETE FROM role_permissions WHERE role_id = ?", role_id)
            
            # Add new permissions
            for permission_id in assignment.permission_ids:
                cursor.execute("""
                    INSERT INTO role_permissions (role_id, permission_id)
                    VALUES (?, ?)
                """, role_id, permission_id)
            
            # Log the activity
            log_activity(
                conn=conn,
                user_id=current_user.get("sub"),
                username=current_user.get("username"),
                action="assign_permissions",
                resource="role_permissions",
                details=f"Updated permissions for role: {role_display_name}",
                severity="high",
                module="role_management",
                before_data=f"Previous permissions: {old_permission_ids}",
                after_data=f"New permissions: {assignment.permission_ids}",
                status="success"
            )
            
            conn.commit()
            
            return {"message": f"Permissions assigned to role successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============================================================================
# USER-ROLE ASSIGNMENT ENDPOINTS
# ============================================================================

@app.post("/api/users/{user_id}/roles")
async def assign_roles_to_user(user_id: int, assignment: UserRoleAssign, current_user: dict = Depends(get_current_active_user)):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get user details for logging
            cursor.execute("SELECT username, full_name FROM users WHERE id = ?", user_id)
            user_row = cursor.fetchone()
            if not user_row:
                raise HTTPException(status_code=404, detail="User not found")
            
            target_username, target_full_name = user_row
            
            # Get current roles for logging
            cursor.execute("SELECT role_id FROM user_roles WHERE user_id = ?", user_id)
            old_role_ids = [row[0] for row in cursor.fetchall()]
            
            # Clear existing roles for this user
            cursor.execute("DELETE FROM user_roles WHERE user_id = ?", user_id)
            
            # Add new roles
            for role_id in assignment.role_ids:
                cursor.execute("""
                    INSERT INTO user_roles (user_id, role_id)
                    VALUES (?, ?)
                """, user_id, role_id)
            
            # Log the activity
            log_activity(
                conn=conn,
                user_id=current_user.get("sub"),
                username=current_user.get("username"),
                action="assign_roles",
                resource="user_roles",
                details=f"Updated roles for user: {target_full_name} ({target_username})",
                severity="high",
                module="user_management",
                before_data=f"Previous roles: {old_role_ids}",
                after_data=f"New roles: {assignment.role_ids}",
                status="success"
            )
            
            conn.commit()
            
            return {"message": f"Roles assigned to user successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/users/{user_id}/roles", response_model=List[RoleResponse])
async def get_user_roles(user_id: int):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT r.id, r.name, r.display_name, r.description, r.is_active, r.created_at, r.updated_at
                FROM roles r
                INNER JOIN user_roles ur ON r.id = ur.role_id
                WHERE ur.user_id = ?
            """, user_id)
            
            roles = []
            for row in cursor.fetchall():
                roles.append(RoleResponse(
                    id=row[0],
                    name=row[1],
                    display_name=row[2],
                    description=row[3],
                    is_active=bool(row[4]),
                    created_at=row[5],
                    updated_at=row[6],
                    permissions=[]
                ))
            
            return roles
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============================================================================
# PERMISSION CHECK ENDPOINT
# ============================================================================

@app.post("/api/check-permission", response_model=PermissionCheckResponse)
async def check_user_permission(check: PermissionCheck):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get user's roles and permissions
            cursor.execute("""
                SELECT DISTINCT p.name as permission_name, r.name as role_name
                FROM users u
                INNER JOIN user_roles ur ON u.id = ur.user_id
                INNER JOIN roles r ON ur.role_id = r.id
                INNER JOIN role_permissions rp ON r.id = rp.role_id
                INNER JOIN permissions p ON rp.permission_id = p.id
                WHERE u.id = ? AND p.resource = ? AND p.action = ? AND r.is_active = 1
            """, check.user_id, check.resource, check.action)
            
            results = cursor.fetchall()
            
            has_permission = len(results) > 0
            roles = list(set([row[1] for row in results]))
            permissions = list(set([row[0] for row in results]))
            
            return PermissionCheckResponse(
                has_permission=has_permission,
                roles=roles,
                permissions=permissions
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(login_request: LoginRequest):
    """Authenticate user and return JWT tokens"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get user with password hash
            cursor.execute("""
                SELECT id, username, email, full_name, password_hash, is_active, 
                       failed_login_attempts, account_locked_until
                FROM users 
                WHERE username = ? OR email = ?
            """, login_request.username, login_request.username)
            
            user_row = cursor.fetchone()
            if not user_row:
                # Log failed login attempt
                log_activity(
                    conn=conn, 
                    username=login_request.username, 
                    action="failed_login", 
                    resource="auth", 
                    details="User not found", 
                    severity="medium", 
                    module="auth", 
                    status="failed"
                )
                conn.commit()  # Commit the failed login log before raising exception
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid username or password"
                )
            
            user_id, username, email, full_name, password_hash, is_active, failed_attempts, locked_until = user_row
            
            # Check if account is locked
            if locked_until and datetime.now() < locked_until:
                log_activity(
                    conn=conn, 
                    user_id=user_id, 
                    username=username, 
                    action="login_attempt_locked", 
                    resource="auth", 
                    details="Account is locked", 
                    severity="high", 
                    module="auth", 
                    status="failed"
                )
                conn.commit()  # Commit the failed login log before raising exception
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail="Account is temporarily locked due to too many failed attempts"
                )
            
            # Check if account is active
            if not is_active:
                log_activity(
                    conn=conn, 
                    user_id=user_id, 
                    username=username, 
                    action="login_attempt_inactive", 
                    resource="auth", 
                    details="Account is inactive", 
                    severity="medium", 
                    module="auth", 
                    status="failed"
                )
                conn.commit()  # Commit the failed login log before raising exception
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Account is inactive"
                )
            
            # Verify password
            if not password_hash or not verify_password(login_request.password, password_hash):
                # Increment failed login attempts
                new_failed_attempts = (failed_attempts or 0) + 1
                locked_until_time = None
                
                if new_failed_attempts >= MAX_FAILED_ATTEMPTS:
                    locked_until_time = datetime.now() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
                
                cursor.execute("""
                    UPDATE users 
                    SET failed_login_attempts = ?, account_locked_until = ?
                    WHERE id = ?
                """, new_failed_attempts, locked_until_time, user_id)
                conn.commit()
                
                log_activity(
                    conn=conn, 
                    user_id=user_id, 
                    username=username, 
                    action="failed_login", 
                    resource="auth", 
                    details=f"Invalid password (attempt {new_failed_attempts})", 
                    severity="high" if new_failed_attempts >= MAX_FAILED_ATTEMPTS else "medium", 
                    module="auth", 
                    status="failed"
                )
                conn.commit()  # Commit the failed login log before raising exception
                
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid username or password"
                )
            
            # Reset failed login attempts on successful login
            cursor.execute("""
                UPDATE users 
                SET failed_login_attempts = 0, account_locked_until = NULL, last_login = GETDATE()
                WHERE id = ?
            """, user_id)
            
            # Get user permissions
            cursor.execute("""
                SELECT DISTINCT p.name
                FROM permissions p
                INNER JOIN role_permissions rp ON p.id = rp.permission_id
                INNER JOIN user_roles ur ON rp.role_id = ur.role_id
                WHERE ur.user_id = ?
            """, user_id)
            
            permissions = [row[0] for row in cursor.fetchall()]
            
            # Create JWT tokens
            token_data = {
                "sub": str(user_id),  # Convert to string for JWT compliance
                "username": username,
                "permissions": permissions
            }
            
            access_token = create_access_token(token_data)
            refresh_token = create_refresh_token({"sub": str(user_id), "username": username})
            
            # Log successful login
            log_activity(
                conn=conn, 
                user_id=user_id, 
                username=username, 
                action="user_login", 
                resource="auth", 
                details="User logged in successfully", 
                severity="info", 
                module="auth", 
                status="success"
            )
            
            conn.commit()
            
            # Get user data for response
            user_data = await get_user(user_id)
            
            return LoginResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="bearer",
                expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                user=user_data
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")

@app.post("/api/auth/refresh")
async def refresh_token(refresh_request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    try:
        payload = verify_token(refresh_request.refresh_token, "refresh")
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id_str = payload.get("sub")
        username = payload.get("username")
        
        # Convert user_id to integer for database query
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID in refresh token"
            )
        
        # Get current user permissions
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT DISTINCT p.name
                FROM permissions p
                INNER JOIN role_permissions rp ON p.id = rp.permission_id
                INNER JOIN user_roles ur ON rp.role_id = ur.role_id
                WHERE ur.user_id = ?
            """, user_id)
            
            permissions = [row[0] for row in cursor.fetchall()]
        
        # Create new access token
        token_data = {
            "sub": user_id_str,  # Keep as string for JWT compliance
            "username": username,
            "permissions": permissions
        }
        
        access_token = create_access_token(token_data)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token refresh error: {str(e)}")

@app.post("/api/auth/logout")
async def logout(current_user: dict = Depends(get_current_active_user)):
    """Logout user (client should discard tokens)"""
    try:
        with get_db_connection() as conn:
            log_activity(
                conn=conn, 
                user_id=current_user["id"], 
                username=current_user["username"], 
                action="user_logout", 
                resource="auth", 
                details="User logged out", 
                severity="info", 
                module="auth", 
                status="success"
            )
        
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logout error: {str(e)}")

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    """Get current authenticated user information"""
    return await get_user(current_user["id"])

@app.post("/api/auth/change-password")
async def change_password(
    password_request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_active_user)
):
    """Change user's own password"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get current password hash
            cursor.execute("SELECT password_hash FROM users WHERE id = ?", current_user["id"])
            row = cursor.fetchone()
            if not row or not row[0]:
                raise HTTPException(status_code=400, detail="No password set for this user")
            
            # Verify current password
            if not verify_password(password_request.current_password, row[0]):
                log_activity(
                    conn=conn, 
                    user_id=current_user["id"], 
                    username=current_user["username"], 
                    action="password_change_failed", 
                    resource="auth", 
                    details="Invalid current password", 
                    severity="medium", 
                    module="auth", 
                    status="failed"
                )
                raise HTTPException(status_code=400, detail="Invalid current password")
            
            # Update password
            new_password_hash = get_password_hash(password_request.new_password)
            cursor.execute("""
                UPDATE users SET password_hash = ? WHERE id = ?
            """, new_password_hash, current_user["id"])
            
            conn.commit()
            
            log_activity(
                conn=conn, 
                user_id=current_user["id"], 
                username=current_user["username"], 
                action="password_changed", 
                resource="auth", 
                details="User changed their password", 
                severity="medium", 
                module="auth", 
                status="success"
            )
            
            return {"message": "Password changed successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Password change error: {str(e)}")

@app.post("/api/auth/admin/reset-password")
async def admin_reset_password(
    reset_request: AdminPasswordResetRequest,
    current_user: dict = Depends(require_admin())
):
    """Admin endpoint to reset user password"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check if target user exists
            cursor.execute("SELECT username FROM users WHERE id = ?", reset_request.user_id)
            user_row = cursor.fetchone()
            if not user_row:
                raise HTTPException(status_code=404, detail="User not found")
            
            target_username = user_row[0]
            
            # Update password
            new_password_hash = get_password_hash(reset_request.new_password)
            cursor.execute("""
                UPDATE users 
                SET password_hash = ?, failed_login_attempts = 0, account_locked_until = NULL
                WHERE id = ?
            """, new_password_hash, reset_request.user_id)
            
            conn.commit()
            
            log_activity(
                conn=conn, 
                user_id=current_user["id"], 
                username=current_user["username"], 
                action="admin_password_reset", 
                resource="users", 
                details=f"Admin reset password for user: {target_username}", 
                severity="high", 
                module="user_management", 
                status="success"
            )
            
            return {"message": f"Password reset successfully for user {target_username}"}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Password reset error: {str(e)}")

# ============================================================================
# UPDATED USER MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/api/users", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = Query(default=100, le=1000),
    active_only: bool = False
):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            if active_only:
                cursor.execute("""
                    SELECT id, username, email, full_name, is_active, created_at, last_login
                    FROM users 
                    WHERE is_active = 1
                    ORDER BY created_at DESC
                    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
                """, skip, limit)
            else:
                cursor.execute("""
                    SELECT id, username, email, full_name, is_active, created_at, last_login
                    FROM users 
                    ORDER BY created_at DESC
                    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
                """, skip, limit)
            
            users = []
            for row in cursor.fetchall():
                user = UserResponse(
                    id=row[0],
                    username=row[1],
                    email=row[2],
                    full_name=row[3],
                    is_active=bool(row[4]),
                    created_at=row[5],
                    last_login=row[6],
                    roles=[]
                )
                
                # Get roles for this user
                cursor.execute("""
                    SELECT r.id, r.name, r.display_name, r.description, r.is_active, r.created_at, r.updated_at
                    FROM roles r
                    INNER JOIN user_roles ur ON r.id = ur.role_id
                    WHERE ur.user_id = ?
                """, row[0])
                
                roles = []
                for role_row in cursor.fetchall():
                    roles.append(RoleResponse(
                        id=role_row[0],
                        name=role_row[1],
                        display_name=role_row[2],
                        description=role_row[3],
                        is_active=bool(role_row[4]),
                        created_at=role_row[5],
                        updated_at=role_row[6],
                        permissions=[]
                    ))
                
                user.roles = roles
                users.append(user)
            
            return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, username, email, full_name, is_active, created_at, last_login
                FROM users WHERE id = ?
            """, user_id)
            
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="User not found")
            
            user = UserResponse(
                id=row[0],
                username=row[1],
                email=row[2],
                full_name=row[3],
                is_active=bool(row[4]),
                created_at=row[5],
                last_login=row[6],
                roles=[],
                permissions=[]
            )
            
            # Get roles for this user
            cursor.execute("""
                SELECT r.id, r.name, r.display_name, r.description, r.is_active, r.created_at, r.updated_at
                FROM roles r
                INNER JOIN user_roles ur ON r.id = ur.role_id
                WHERE ur.user_id = ?
            """, user_id)
            
            roles = []
            for role_row in cursor.fetchall():
                roles.append(RoleResponse(
                    id=role_row[0],
                    name=role_row[1],
                    display_name=role_row[2],
                    description=role_row[3],
                    is_active=bool(role_row[4]),
                    created_at=role_row[5],
                    updated_at=role_row[6],
                    permissions=[]
                ))
            
            user.roles = roles
            
            # Get user permissions
            cursor.execute("""
                SELECT DISTINCT p.name
                FROM permissions p
                INNER JOIN role_permissions rp ON p.id = rp.permission_id
                INNER JOIN user_roles ur ON rp.role_id = ur.role_id
                WHERE ur.user_id = ?
            """, user_id)
            
            permissions = [row[0] for row in cursor.fetchall()]
            user.permissions = permissions
            
            return user
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/users", response_model=UserResponse)
async def create_user(user: UserCreateWithPassword, current_user: dict = Depends(get_current_active_user)):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check if username or email already exists
            cursor.execute("SELECT COUNT(*) FROM users WHERE username = ? OR email = ?", user.username, user.email)
            if cursor.fetchone()[0] > 0:
                raise HTTPException(status_code=400, detail="Username or email already exists")
            
            # Hash password
            password_hash = get_password_hash(user.password)
            
            # Insert new user
            cursor.execute("""
                INSERT INTO users (username, email, full_name, is_active, password_hash)
                OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.full_name, 
                       INSERTED.is_active, INSERTED.created_at, INSERTED.last_login
                VALUES (?, ?, ?, ?, ?)
            """, user.username, user.email, user.full_name, user.is_active, password_hash)
            
            row = cursor.fetchone()
            user_id = row[0]
            
            # Assign roles if provided
            if user.role_ids:
                for role_id in user.role_ids:
                    cursor.execute("""
                        INSERT INTO user_roles (user_id, role_id)
                        VALUES (?, ?)
                    """, user_id, role_id)
            
            conn.commit()
            
            # Log the action with severity
            severity = "high" if any(role_id in [1] for role_id in (user.role_ids or [])) else "medium"  # Admin role creation is high severity
            log_activity(
                conn=conn, 
                user_id=current_user.get("sub"), 
                username=current_user.get("username"), 
                action="create_user", 
                resource="users", 
                details=f"Created user: {user.username}", 
                severity=severity, 
                module="user_management", 
                status="success"
            )
            
            return UserResponse(
                id=row[0],
                username=row[1],
                email=row[2],
                full_name=row[3],
                is_active=bool(row[4]),
                created_at=row[5],
                last_login=row[6],
                roles=[]
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.put("/api/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate, current_user: dict = Depends(get_current_active_user)):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get existing user data for logging
            cursor.execute("SELECT username, email, full_name, is_active FROM users WHERE id = ?", user_id)
            existing_user = cursor.fetchone()
            if not existing_user:
                raise HTTPException(status_code=404, detail="User not found")
            
            old_username, old_email, old_full_name, old_is_active = existing_user
            
            # Build update query dynamically
            update_fields = []
            update_values = []
            changes = []
            
            if user_update.username is not None and user_update.username != old_username:
                update_fields.append("username = ?")
                update_values.append(user_update.username)
                changes.append(f"username: '{old_username}' -> '{user_update.username}'")
            if user_update.email is not None and user_update.email != old_email:
                update_fields.append("email = ?")
                update_values.append(user_update.email)
                changes.append(f"email: '{old_email}' -> '{user_update.email}'")
            if user_update.full_name is not None and user_update.full_name != old_full_name:
                update_fields.append("full_name = ?")
                update_values.append(user_update.full_name)
                changes.append(f"full_name: '{old_full_name}' -> '{user_update.full_name}'")
            if user_update.is_active is not None and user_update.is_active != old_is_active:
                update_fields.append("is_active = ?")
                update_values.append(user_update.is_active)
                changes.append(f"is_active: {old_is_active} -> {user_update.is_active}")
            
            if update_fields:
                update_values.append(user_id)
                cursor.execute(f"""
                    UPDATE users 
                    SET {', '.join(update_fields)}
                    WHERE id = ?
                """, *update_values)
            
            # Update roles if provided
            role_changes = []
            if user_update.role_ids is not None:
                # Get current roles for logging
                cursor.execute("SELECT role_id FROM user_roles WHERE user_id = ?", user_id)
                old_role_ids = [row[0] for row in cursor.fetchall()]
                
                cursor.execute("DELETE FROM user_roles WHERE user_id = ?", user_id)
                for role_id in user_update.role_ids:
                    cursor.execute("""
                        INSERT INTO user_roles (user_id, role_id)
                        VALUES (?, ?)
                    """, user_id, role_id)
                
                if set(old_role_ids) != set(user_update.role_ids):
                    role_changes.append(f"roles: {old_role_ids} -> {user_update.role_ids}")
            
            # Log the action with the actual user who performed the update
            if changes or role_changes:
                all_changes = changes + role_changes
                log_activity(
                    conn=conn,
                    user_id=current_user.get("sub"),
                    username=current_user.get("username"),
                    action="update_user",
                    resource="users",
                    details=f"Updated user: {old_full_name} ({old_username})",
                    severity="medium",
                    module="user_management",
                    before_data=f"username: {old_username}, email: {old_email}, full_name: {old_full_name}, active: {old_is_active}",
                    after_data=f"Changes: {', '.join(all_changes)}",
                    status="success"
                )
            
            conn.commit()
            
            # Return updated user
            return await get_user(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: int, current_user: dict = Depends(get_current_active_user)):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get user info before deletion
            cursor.execute("SELECT username, full_name FROM users WHERE id = ?", user_id)
            user_row = cursor.fetchone()
            if not user_row:
                raise HTTPException(status_code=404, detail="User not found")
            
            target_username, target_full_name = user_row
            
            # Delete user (cascade will handle user_roles)
            cursor.execute("DELETE FROM users WHERE id = ?", user_id)
            
            # Log the action with the actual user who performed the deletion
            log_activity(
                conn=conn,
                user_id=current_user.get("sub"),
                username=current_user.get("username"),
                action="delete_user",
                resource="users",
                details=f"Deleted user: {target_full_name} ({target_username})",
                severity="high",
                module="user_management",
                before_data=f"User ID: {user_id}, Username: {target_username}, Full Name: {target_full_name}",
                status="success"
            )
            
            conn.commit()
            
            return {"message": f"User {target_username} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============================================================================
# DASHBOARD ENDPOINTS (unchanged)
# ============================================================================

@app.get("/api/dashboard/summary", response_model=DashboardSummary)
async def get_dashboard_summary():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get user statistics
            cursor.execute("SELECT COUNT(*) FROM users")
            total_users = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM users WHERE is_active = 1")
            active_users = cursor.fetchone()[0]
            
            # Get log statistics
            cursor.execute("SELECT COUNT(*) FROM audit2_logs")
            total_logs = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM audit2_logs WHERE timestamp >= DATEADD(day, -7, GETDATE())")
            recent_logs = cursor.fetchone()[0]
            
            return DashboardSummary(
                total_users=total_users,
                active_users=active_users,
                total_logs=total_logs,
                recent_logs=recent_logs,
                system_health="healthy",
                last_updated=datetime.now()
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============================================================================
# INITIALIZE SAMPLE DATA WITH RBAC
# ============================================================================

# Force reinitialize with comprehensive permissions
@app.post("/api/force-init-permissions")
async def force_init_permissions():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Clear existing permissions and role assignments
            cursor.execute("DELETE FROM user_roles")
            cursor.execute("DELETE FROM role_permissions")
            cursor.execute("DELETE FROM permissions")
            
            # Create comprehensive permissions
            sample_permissions = [
                # User Management Permissions
                ("users.read", "View Users", "View user information and list", "users", "read"),
                ("users.create", "Create Users", "Create new user accounts", "users", "create"),
                ("users.update", "Update Users", "Edit user information", "users", "update"),
                ("users.delete", "Delete Users", "Delete user accounts", "users", "delete"),
                ("users.manage_roles", "Manage User Roles", "Assign/remove roles from users", "users", "manage_roles"),
                ("users.toggle_status", "Toggle User Status", "Activate/deactivate users", "users", "toggle_status"),
                
                # Role Management Permissions
                ("roles.read", "View Roles", "View role information and list", "roles", "read"),
                ("roles.create", "Create Roles", "Create new roles", "roles", "create"),
                ("roles.update", "Update Roles", "Edit role information", "roles", "update"),
                ("roles.delete", "Delete Roles", "Delete roles", "roles", "delete"),
                ("roles.manage_permissions", "Manage Role Permissions", "Assign/remove permissions from roles", "roles", "manage_permissions"),
                
                # Permission Management
                ("permissions.read", "View Permissions", "View available permissions", "permissions", "read"),
                ("permissions.create", "Create Permissions", "Create new permissions", "permissions", "create"),
                
                # Dashboard Access
                ("dashboard.read", "Access Dashboard", "View main dashboard", "dashboard", "read"),
                ("dashboard.metrics", "View Dashboard Metrics", "View dashboard metrics and statistics", "dashboard", "metrics"),
                ("dashboard.summary", "View Dashboard Summary", "View dashboard summary information", "dashboard", "summary"),
                
                # Audit Logs
                ("logs.read", "View Audit Logs", "View system audit logs", "logs", "read"),
                ("logs.create", "Create Audit Logs", "Create audit log entries", "logs", "create"),
                ("logs.export", "Export Audit Logs", "Export audit logs to files", "logs", "export"),
                
                # System Administration
                ("system.admin", "System Administrator", "Full system access and control", "system", "admin"),
                ("system.settings", "System Settings", "Manage system configuration", "system", "settings"),
                ("system.backup", "System Backup", "Create and manage system backups", "system", "backup"),
                ("system.maintenance", "System Maintenance", "Perform system maintenance tasks", "system", "maintenance"),
                
                # Data Management
                ("data.init", "Initialize Sample Data", "Initialize system with sample data", "data", "init"),
                ("data.export", "Export Data", "Export system data", "data", "export"),
                ("data.import", "Import Data", "Import data into system", "data", "import"),
                
                # Reports
                ("reports.read", "View Reports", "View system reports", "reports", "read"),
                ("reports.create", "Create Reports", "Generate custom reports", "reports", "create"),
                ("reports.export", "Export Reports", "Export reports to various formats", "reports", "export"),
            ]
            
            permission_ids = {}
            for perm in sample_permissions:
                cursor.execute("""
                    INSERT INTO permissions (name, display_name, description, resource, action)
                    OUTPUT INSERTED.id
                    VALUES (?, ?, ?, ?, ?)
                """, *perm)
                permission_ids[perm[0]] = cursor.fetchone()[0]
            
            # Reassign permissions to existing roles
            role_permissions = {
                "admin": [
                    # Full system access
                    "users.read", "users.create", "users.update", "users.delete", "users.manage_roles", "users.toggle_status",
                    "roles.read", "roles.create", "roles.update", "roles.delete", "roles.manage_permissions",
                    "permissions.read", "permissions.create",
                    "dashboard.read", "dashboard.metrics", "dashboard.summary",
                    "logs.read", "logs.create", "logs.export",
                    "system.admin", "system.settings", "system.backup", "system.maintenance",
                    "data.init", "data.export", "data.import",
                    "reports.read", "reports.create", "reports.export"
                ],
                "user_manager": [
                    # User management focused
                    "users.read", "users.create", "users.update", "users.manage_roles", "users.toggle_status",
                    "roles.read",
                    "permissions.read",
                    "dashboard.read", "dashboard.summary",
                    "logs.read",
                    "reports.read"
                ],
                "viewer": [
                    # Read-only access
                    "users.read",
                    "roles.read",
                    "permissions.read",
                    "dashboard.read", "dashboard.metrics", "dashboard.summary",
                    "logs.read",
                    "reports.read"
                ],
                "user": [
                    # Basic user access
                    "dashboard.read",
                    "reports.read"
                ]
            }
            
            # Get existing roles
            cursor.execute("SELECT id, name FROM roles")
            existing_roles = {row[1]: row[0] for row in cursor.fetchall()}
            
            # Assign permissions to roles
            for role_name, permissions in role_permissions.items():
                if role_name in existing_roles:
                    role_id = existing_roles[role_name]
                    for perm_name in permissions:
                        if perm_name in permission_ids:
                            cursor.execute("""
                                INSERT INTO role_permissions (role_id, permission_id)
                                VALUES (?, ?)
                            """, role_id, permission_ids[perm_name])
            
            # Reassign roles to users (get existing user-role relationships)
            user_role_assignments = {
                "admin": ["admin"],
                "john_doe": ["user"],
                "jane_smith": ["user_manager"],
                "bob_wilson": ["viewer"]
            }
            
            # Get existing users
            cursor.execute("SELECT id, username FROM users")
            existing_users = {row[1]: row[0] for row in cursor.fetchall()}
            
            # Assign roles to users
            for username, roles in user_role_assignments.items():
                if username in existing_users:
                    user_id = existing_users[username]
                    for role_name in roles:
                        if role_name in existing_roles:
                            cursor.execute("""
                                INSERT INTO user_roles (user_id, role_id)
                                VALUES (?, ?)
                            """, user_id, existing_roles[role_name])
            
            conn.commit()
            return {"message": "Comprehensive permissions initialized successfully", "permissions_count": len(sample_permissions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============================================================================
# ARCH MODULE ENDPOINTS
# ============================================================================

@app.get("/api/arch/users")
async def search_all_users(
    query: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    skip: int = 0,
    limit: int = Query(default=100, le=1000)
):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Build the base query
            base_query = """
                SELECT DISTINCT u.id, u.username, u.email, u.full_name, u.is_active, 
                       u.created_at, u.last_login,
                       COALESCE(u.department, 'Not Specified') as department,
                       COALESCE(u.position, 'Not Specified') as position,
                       COALESCE(u.phone, '') as phone
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE 1=1
            """
            
            params = []
            
            # Add search query filter
            if query:
                base_query += " AND (u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.department LIKE ?)"
                search_param = f"%{query}%"
                params.extend([search_param, search_param, search_param, search_param])
            
            # Add role filter
            if role:
                base_query += " AND r.name = ?"
                params.append(role)
            
            # Add status filter
            if status:
                if status == "active":
                    base_query += " AND u.is_active = 1"
                elif status == "inactive":
                    base_query += " AND u.is_active = 0"
            
            # Add department filter
            if department:
                base_query += " AND u.department = ?"
                params.append(department)
            
            base_query += " ORDER BY u.full_name OFFSET ? ROWS FETCH NEXT ? ROWS ONLY"
            params.extend([skip, limit])
            
            cursor.execute(base_query, *params)
            users_data = cursor.fetchall()
            
            users = []
            for user_row in users_data:
                user_id = user_row[0]
                
                # Get user roles
                cursor.execute("""
                    SELECT r.id, r.name, r.display_name, r.description, r.is_active, r.created_at, r.updated_at
                    FROM roles r
                    INNER JOIN user_roles ur ON r.id = ur.role_id
                    WHERE ur.user_id = ?
                """, user_id)
                
                roles = []
                for role_row in cursor.fetchall():
                    roles.append({
                        "id": role_row[0],
                        "name": role_row[1],
                        "display_name": role_row[2],
                        "description": role_row[3],
                        "is_active": bool(role_row[4]),
                        "created_at": role_row[5],
                        "updated_at": role_row[6],
                        "permissions": []
                    })
                
                # Get report summary (mock data for now)
                report_summary = {
                    "completed": 15 + (user_id % 10),
                    "in_progress": 3 + (user_id % 5),
                    "issues": 1 + (user_id % 3),
                    "total": 19 + (user_id % 18)
                }
                
                users.append({
                    "id": user_row[0],
                    "username": user_row[1],
                    "email": user_row[2],
                    "full_name": user_row[3],
                    "is_active": bool(user_row[4]),
                    "created_at": user_row[5],
                    "last_login": user_row[6],
                    "department": user_row[7],
                    "position": user_row[8],
                    "phone": user_row[9],
                    "roles": roles,
                    "report_summary": report_summary
                })
            
            return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/arch/users/{user_id}/profile")
async def get_user_profile(user_id: int):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get user basic info
            cursor.execute("""
                SELECT id, username, email, full_name, is_active, created_at, last_login,
                       COALESCE(department, 'Not Specified') as department,
                       COALESCE(position, 'Not Specified') as position,
                       COALESCE(phone, '') as phone
                FROM users WHERE id = ?
            """, user_id)
            
            user_row = cursor.fetchone()
            if not user_row:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Get user roles
            cursor.execute("""
                SELECT r.id, r.name, r.display_name, r.description, r.is_active, r.created_at, r.updated_at
                FROM roles r
                INNER JOIN user_roles ur ON r.id = ur.role_id
                WHERE ur.user_id = ?
            """, user_id)
            
            roles = []
            for role_row in cursor.fetchall():
                roles.append({
                    "id": role_row[0],
                    "name": role_row[1],
                    "display_name": role_row[2],
                    "description": role_row[3],
                    "is_active": bool(role_row[4]),
                    "created_at": role_row[5],
                    "updated_at": role_row[6],
                    "permissions": []
                })
            
            # Mock additional profile data
            profile = {
                "id": user_row[0],
                "username": user_row[1],
                "email": user_row[2],
                "full_name": user_row[3],
                "is_active": bool(user_row[4]),
                "created_at": user_row[5],
                "last_login": user_row[6],
                "department": user_row[7],
                "position": user_row[8],
                "phone": user_row[9],
                "roles": roles,
                "bio": f"Experienced professional in {user_row[7]} with expertise in various projects.",
                "location": "New York, NY",
                "timezone": "EST",
                "manager": "John Manager",
                "team": f"{user_row[7]} Team",
                "skills": ["Python", "JavaScript", "Project Management", "Data Analysis"],
                "certifications": ["PMP", "AWS Certified", "Scrum Master"],
                "report_summary": {
                    "completed": 15 + (user_id % 10),
                    "in_progress": 3 + (user_id % 5),
                    "issues": 1 + (user_id % 3),
                    "total": 19 + (user_id % 18)
                },
                "performance_metrics": {
                    "completion_rate": 85 + (user_id % 15),
                    "average_rating": 4.2 + (user_id % 8) / 10,
                    "total_hours": 1200 + (user_id * 50),
                    "efficiency_score": 78 + (user_id % 20)
                },
                "recent_activity": []
            }
            
            return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/arch/users/{user_id}/reports")
async def get_user_reports(user_id: int):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check if user exists
            cursor.execute("SELECT username FROM users WHERE id = ?", user_id)
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="User not found")
            
            # Mock report data
            completed_reports = [
                {
                    "id": i,
                    "title": f"Monthly Report {i}",
                    "type": "Monthly Review",
                    "status": "completed",
                    "priority": ["low", "medium", "high"][i % 3],
                    "created_at": "2024-01-15T10:00:00Z",
                    "updated_at": "2024-01-20T15:30:00Z",
                    "completion_date": "2024-01-20T15:30:00Z",
                    "assigned_by": "Manager",
                    "description": f"Completed monthly review report {i}",
                    "progress_percentage": 100
                }
                for i in range(1, 6)
            ]
            
            in_progress_reports = [
                {
                    "id": i + 10,
                    "title": f"Project Analysis {i}",
                    "type": "Analysis",
                    "status": "in_progress",
                    "priority": ["medium", "high"][i % 2],
                    "created_at": "2024-01-25T09:00:00Z",
                    "updated_at": "2024-01-28T14:20:00Z",
                    "due_date": "2024-02-05T17:00:00Z",
                    "assigned_by": "Team Lead",
                    "description": f"In-progress project analysis {i}",
                    "progress_percentage": 60 + (i * 10)
                }
                for i in range(1, 4)
            ]
            
            issues_reports = [
                {
                    "id": i + 20,
                    "title": f"Issue Report {i}",
                    "type": "Bug Report",
                    "status": "issues",
                    "priority": "high",
                    "created_at": "2024-01-30T11:00:00Z",
                    "updated_at": "2024-01-31T16:45:00Z",
                    "due_date": "2024-02-02T12:00:00Z",
                    "assigned_by": "QA Lead",
                    "description": f"Report with issues {i}",
                    "progress_percentage": 25
                }
                for i in range(1, 3)
            ]
            
            statistics = {
                "total_reports": len(completed_reports) + len(in_progress_reports) + len(issues_reports),
                "completed_count": len(completed_reports),
                "in_progress_count": len(in_progress_reports),
                "issues_count": len(issues_reports),
                "completion_rate": 75,
                "average_completion_time": 5.2
            }
            
            return {
                "user_id": user_id,
                "completed_reports": completed_reports,
                "in_progress_reports": in_progress_reports,
                "issues_reports": issues_reports,
                "statistics": statistics
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/arch/users/{user_id}/activity")
async def get_user_activity(user_id: int, days: int = Query(default=30, le=365)):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check if user exists
            cursor.execute("SELECT username FROM users WHERE id = ?", user_id)
            user_row = cursor.fetchone()
            if not user_row:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Get actual audit logs for the user
            cursor.execute("""
                SELECT id, action, details, timestamp, status
                FROM audit2_logs
                WHERE user_id = ? AND timestamp >= DATEADD(day, -?, GETDATE())
                ORDER BY timestamp DESC
            """, user_id, days)
            
            activities = []
            for row in cursor.fetchall():
                activities.append({
                    "id": row[0],
                    "user_id": user_id,
                    "activity_type": row[1].replace('_', ' ').title(),
                    "description": row[2] or f"User performed {row[1]}",
                    "timestamp": row[3],
                    "metadata": {"status": row[4]}
                })
            
            # Add some mock activities if no real data
            if not activities:
                mock_activities = []
                for i in range(1, 4):
                    mock_activities.extend([
                        {
                            "id": i,
                            "user_id": user_id,
                            "activity_type": "Login",
                            "description": "User logged into the system",
                            "timestamp": "2024-01-30T09:00:00Z",
                            "metadata": {"ip": "192.168.1.100"}
                        },
                        {
                            "id": i + 10,
                            "user_id": user_id,
                            "activity_type": "Report Submission",
                            "description": "Submitted monthly report",
                            "timestamp": "2024-01-29T14:30:00Z",
                            "metadata": {"report_id": 123}
                        },
                        {
                            "id": i + 20,
                            "user_id": user_id,
                            "activity_type": "Profile Update",
                            "description": "Updated profile information",
                            "timestamp": "2024-01-28T11:15:00Z",
                            "metadata": {"fields_updated": ["phone", "department"]}
                        }
                    ])
                activities.extend(mock_activities)
            
            return activities
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============================================================================
# LOGGING MODULE ENDPOINTS
# ============================================================================

@app.get("/api/logs")
async def get_logs(
    skip: int = 0,
    limit: int = Query(default=100, le=1000),
    severity: Optional[str] = None,
    action: Optional[str] = None,
    username: Optional[str] = None,
    module: Optional[str] = None,
    days: int = Query(default=30, le=365),
    status: Optional[str] = None
):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Build query with filters
            where_conditions = ["timestamp >= DATEADD(day, -?, GETDATE())"]
            params = [days]
            
            if severity:
                where_conditions.append("severity = ?")
                params.append(severity)
            if action:
                where_conditions.append("action LIKE ?")
                params.append(f"%{action}%")
            if username:
                where_conditions.append("username LIKE ?")
                params.append(f"%{username}%")
            if module:
                where_conditions.append("module = ?")
                params.append(module)
            if status:
                where_conditions.append("status = ?")
                params.append(status)
            
            params.extend([skip, limit])
            
            cursor.execute(f"""
                SELECT id, user_id, username, action, resource, details, ip_address, 
                       user_agent, CAST(timestamp AS VARCHAR(30)) as timestamp, status, 
                       COALESCE(severity, 'info') as severity, 
                       COALESCE(session_id, '') as session_id, 
                       COALESCE(request_id, '') as request_id, 
                       COALESCE(module, '') as module, 
                       COALESCE(before_data, '') as before_data, 
                       COALESCE(after_data, '') as after_data
                FROM audit2_logs
                WHERE {' AND '.join(where_conditions)}
                ORDER BY timestamp DESC
                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
            """, *params)
            
            logs = []
            for row in cursor.fetchall():
                logs.append({
                    "id": row[0],
                    "user_id": row[1],
                    "username": row[2],
                    "action": row[3],
                    "resource": row[4],
                    "details": row[5],
                    "ip_address": row[6],
                    "user_agent": row[7],
                    "timestamp": row[8],
                    "status": row[9],
                    "severity": row[10] or "info",
                    "session_id": row[11],
                    "request_id": row[12],
                    "module": row[13],
                    "before_data": row[14],
                    "after_data": row[15]
                })
            
            return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/logs/export")
async def export_logs(
    format: str = Query(default="csv", pattern="^(csv|json|xlsx)$"),
    severity: Optional[str] = None,
    action: Optional[str] = None,
    username: Optional[str] = None,
    module: Optional[str] = None,
    days: int = Query(default=30, le=365),
    status: Optional[str] = None
):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Build query with filters (same as get_logs but without pagination)
            where_conditions = ["timestamp >= DATEADD(day, -?, GETDATE())"]
            params = [days]
            
            if severity:
                where_conditions.append("severity = ?")
                params.append(severity)
            if action:
                where_conditions.append("action LIKE ?")
                params.append(f"%{action}%")
            if username:
                where_conditions.append("username LIKE ?")
                params.append(f"%{username}%")
            if module:
                where_conditions.append("module = ?")
                params.append(module)
            if status:
                where_conditions.append("status = ?")
                params.append(status)
            
            cursor.execute(f"""
                SELECT id, user_id, username, action, resource, details, ip_address, 
                       user_agent, CAST(timestamp AS VARCHAR(30)) as timestamp, status, 
                       COALESCE(severity, 'info') as severity, 
                       COALESCE(session_id, '') as session_id, 
                       COALESCE(request_id, '') as request_id, 
                       COALESCE(module, '') as module, 
                       COALESCE(before_data, '') as before_data, 
                       COALESCE(after_data, '') as after_data
                FROM audit2_logs
                WHERE {' AND '.join(where_conditions)}
                ORDER BY timestamp DESC
            """, *params)
            
            logs = []
            for row in cursor.fetchall():
                logs.append({
                    "id": row[0],
                    "user_id": row[1],
                    "username": row[2],
                    "action": row[3],
                    "resource": row[4],
                    "details": row[5],
                    "ip_address": row[6],
                    "user_agent": row[7],
                    "timestamp": row[8],
                    "status": row[9],
                    "severity": row[10] or "info",
                    "session_id": row[11],
                    "request_id": row[12],
                    "module": row[13],
                    "before_data": row[14],
                    "after_data": row[15]
                })
            
            if format == "json":
                from fastapi.responses import JSONResponse
                return JSONResponse(
                    content=logs,
                    headers={"Content-Disposition": f"attachment; filename=audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"}
                )
            elif format == "csv":
                import csv
                import io
                from fastapi.responses import Response
                
                if not logs:
                    return Response(
                        content="No logs found",
                        media_type="text/csv",
                        headers={"Content-Disposition": f"attachment; filename=audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
                    )
                
                output = io.StringIO()
                writer = csv.DictWriter(output, fieldnames=logs[0].keys())
                writer.writeheader()
                writer.writerows(logs)
                
                return Response(
                    content=output.getvalue(),
                    media_type="text/csv",
                    headers={"Content-Disposition": f"attachment; filename=audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
                )
            else:
                # For xlsx format, you'd need to install openpyxl
                raise HTTPException(status_code=400, detail="XLSX format not implemented yet")
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/logs/stats")
async def get_log_stats(days: int = Query(default=30, le=365)):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get overall stats
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_logs,
                    COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
                    COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_count,
                    COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_count,
                    COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_count,
                    COUNT(CASE WHEN severity = 'info' OR severity IS NULL THEN 1 END) as info_count,
                    COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
                    COUNT(DISTINCT username) as unique_users,
                    COUNT(DISTINCT module) as unique_modules
                FROM audit2_logs 
                WHERE timestamp >= DATEADD(day, -?, GETDATE())
            """, days)
            
            stats_row = cursor.fetchone()
            
            # Get top actions
            cursor.execute("""
                SELECT TOP 10 action, COUNT(*) as count
                FROM audit2_logs 
                WHERE timestamp >= DATEADD(day, -?, GETDATE())
                GROUP BY action
                ORDER BY count DESC
            """, days)
            
            top_actions = [{"action": row[0], "count": row[1]} for row in cursor.fetchall()]
            
            # Get top users
            cursor.execute("""
                SELECT TOP 10 username, COUNT(*) as count
                FROM audit2_logs 
                WHERE timestamp >= DATEADD(day, -?, GETDATE()) AND username IS NOT NULL
                GROUP BY username
                ORDER BY count DESC
            """, days)
            
            top_users = [{"username": row[0], "count": row[1]} for row in cursor.fetchall()]
            
            # Get daily activity
            cursor.execute("""
                SELECT 
                    CONVERT(VARCHAR, CAST(timestamp AS DATE), 23) as date,
                    COUNT(*) as count,
                    COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count
                FROM audit2_logs 
                WHERE timestamp >= DATEADD(day, -?, GETDATE())
                GROUP BY CAST(timestamp AS DATE)
                ORDER BY CAST(timestamp AS DATE) DESC
            """, days)
            
            daily_activity = [{"date": row[0], "count": row[1], "critical_count": row[2]} for row in cursor.fetchall()]
            
            return {
                "total_logs": stats_row[0],
                "severity_breakdown": {
                    "critical": stats_row[1],
                    "high": stats_row[2],
                    "medium": stats_row[3],
                    "low": stats_row[4],
                    "info": stats_row[5]
                },
                "status_breakdown": {
                    "success": stats_row[6],
                    "failed": stats_row[7]
                },
                "unique_users": stats_row[8],
                "unique_modules": stats_row[9],
                "top_actions": top_actions,
                "top_users": top_users,
                "daily_activity": daily_activity
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/logs")
async def create_log_entry(
    user_id: Optional[int] = None,
    username: Optional[str] = None,
    action: str = None,
    resource: Optional[str] = None,
    details: Optional[str] = None,
    severity: str = "info",
    module: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    session_id: Optional[str] = None,
    request_id: Optional[str] = None,
    before_data: Optional[str] = None,
    after_data: Optional[str] = None,
    status: str = "success"
):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO audit2_logs (
                    user_id, username, action, resource, details, severity, module,
                    ip_address, user_agent, session_id, request_id, before_data, after_data, status
                )
                OUTPUT INSERTED.id, INSERTED.timestamp
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, user_id, username, action, resource, details, severity, module,
                 ip_address, user_agent, session_id, request_id, before_data, after_data, status)
            
            result = cursor.fetchone()
            conn.commit()
            
            return {
                "id": result[0],
                "timestamp": result[1],
                "message": "Log entry created successfully"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Enhanced logging helper function
def log_activity(
    conn,
    user_id: Optional[int] = None,
    username: Optional[str] = None,
    action: str = None,
    resource: Optional[str] = None,
    details: Optional[str] = None,
    severity: str = "info",
    module: Optional[str] = None,
    before_data: Optional[str] = None,
    after_data: Optional[str] = None,
    status: str = "success"
):
    """Helper function to log activities with enhanced data"""
    try:
        print(f"Attempting to log activity: action={action}, username={username}, details={details}")
        
        # Validate required fields
        if action is None or action == "":
            print(f"ERROR: Action is None or empty! Cannot log activity.")
            return
            
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO audit2_logs (
                user_id, username, action, resource, details, severity, module,
                before_data, after_data, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, user_id, username, action, resource, details, severity, module,
             before_data, after_data, status)
        print(f"Successfully logged activity: {action}")
        # Don't commit here - let the calling function handle the commit
    except Exception as e:
        print(f"Logging error: {str(e)}")
        print(f"Parameters: user_id={user_id}, username={username}, action={action}, resource={resource}, details={details}, severity={severity}, module={module}, before_data={before_data}, after_data={after_data}, status={status}")

def create_sample_logs():
    """Create sample audit logs for testing"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check if we already have logs
            cursor.execute("SELECT COUNT(*) FROM audit2_logs")
            if cursor.fetchone()[0] > 0:
                return  # Already have logs
            
            sample_logs = [
                ("admin", "user_login", "auth", "User logged in successfully", "info", "auth", "success"),
                ("admin", "create_user", "users", "Created new user: john_doe", "medium", "user_management", "success"),
                ("admin", "assign_role", "roles", "Assigned role 'editor' to user john_doe", "medium", "role_management", "success"),
                ("john_doe", "user_login", "auth", "User logged in successfully", "info", "auth", "success"),
                ("admin", "update_user", "users", "Updated user profile for john_doe", "low", "user_management", "success"),
                ("system", "backup_created", "system", "Daily backup completed successfully", "info", "system", "success"),
                ("admin", "failed_login", "auth", "Failed login attempt", "high", "auth", "failed"),
                ("admin", "delete_user", "users", "Deleted user: test_user", "high", "user_management", "success"),
                ("system", "api_error", "api", "API endpoint returned 500 error", "critical", "api", "failed"),
                ("admin", "export_data", "logs", "Exported audit logs", "medium", "logs", "success"),
            ]
            
            for log in sample_logs:
                cursor.execute("""
                    INSERT INTO audit2_logs (username, action, resource, details, severity, module, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, *log)
            
            conn.commit()
            print("Sample audit logs created successfully")
    except Exception as e:
        print(f"Error creating sample logs: {e}")

@app.post("/api/create-sample-logs")
async def create_sample_logs_endpoint():
    """Create sample audit logs for testing"""
    try:
        create_sample_logs()
        return {"message": "Sample logs created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating sample logs: {str(e)}")

@app.post("/api/init-sample-data")
async def init_sample_data():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check if data already exists
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM permissions")
            permission_count = cursor.fetchone()[0]
            
            # If we have users but not the new comprehensive permissions, clear and reinitialize
            if user_count > 0 and permission_count < 20:
                # Clear existing data to reinitialize with comprehensive permissions
                cursor.execute("DELETE FROM user_roles")
                cursor.execute("DELETE FROM role_permissions")
                cursor.execute("DELETE FROM audit2_logs")
                cursor.execute("DELETE FROM dashboard_metrics")
                cursor.execute("DELETE FROM users")
                cursor.execute("DELETE FROM roles")
                cursor.execute("DELETE FROM permissions")
                conn.commit()
            elif user_count > 0 and permission_count >= 20:
                return {"message": "Comprehensive sample data already exists"}
            
            # Create sample permissions
            sample_permissions = [
                # User Management Permissions
                ("users.read", "View Users", "View user information and list", "users", "read"),
                ("users.create", "Create Users", "Create new user accounts", "users", "create"),
                ("users.update", "Update Users", "Edit user information", "users", "update"),
                ("users.delete", "Delete Users", "Delete user accounts", "users", "delete"),
                ("users.manage_roles", "Manage User Roles", "Assign/remove roles from users", "users", "manage_roles"),
                ("users.toggle_status", "Toggle User Status", "Activate/deactivate users", "users", "toggle_status"),
                
                # Role Management Permissions
                ("roles.read", "View Roles", "View role information and list", "roles", "read"),
                ("roles.create", "Create Roles", "Create new roles", "roles", "create"),
                ("roles.update", "Update Roles", "Edit role information", "roles", "update"),
                ("roles.delete", "Delete Roles", "Delete roles", "roles", "delete"),
                ("roles.manage_permissions", "Manage Role Permissions", "Assign/remove permissions from roles", "roles", "manage_permissions"),
                
                # Permission Management
                ("permissions.read", "View Permissions", "View available permissions", "permissions", "read"),
                ("permissions.create", "Create Permissions", "Create new permissions", "permissions", "create"),
                
                # Dashboard Access
                ("dashboard.read", "Access Dashboard", "View main dashboard", "dashboard", "read"),
                ("dashboard.metrics", "View Dashboard Metrics", "View dashboard metrics and statistics", "dashboard", "metrics"),
                ("dashboard.summary", "View Dashboard Summary", "View dashboard summary information", "dashboard", "summary"),
                
                # Audit Logs
                ("logs.read", "View Audit Logs", "View system audit logs", "logs", "read"),
                ("logs.create", "Create Audit Logs", "Create audit log entries", "logs", "create"),
                ("logs.export", "Export Audit Logs", "Export audit logs to files", "logs", "export"),
                
                # System Administration
                ("system.admin", "System Administrator", "Full system access and control", "system", "admin"),
                ("system.settings", "System Settings", "Manage system configuration", "system", "settings"),
                ("system.backup", "System Backup", "Create and manage system backups", "system", "backup"),
                ("system.maintenance", "System Maintenance", "Perform system maintenance tasks", "system", "maintenance"),
                
                # Data Management
                ("data.init", "Initialize Sample Data", "Initialize system with sample data", "data", "init"),
                ("data.export", "Export Data", "Export system data", "data", "export"),
                ("data.import", "Import Data", "Import data into system", "data", "import"),
                
                # Reports
                ("reports.read", "View Reports", "View system reports", "reports", "read"),
                ("reports.create", "Create Reports", "Generate custom reports", "reports", "create"),
                ("reports.export", "Export Reports", "Export reports to various formats", "reports", "export"),
            ]
            
            permission_ids = {}
            for perm in sample_permissions:
                cursor.execute("""
                    INSERT INTO permissions (name, display_name, description, resource, action)
                    OUTPUT INSERTED.id
                    VALUES (?, ?, ?, ?, ?)
                """, *perm)
                permission_ids[perm[0]] = cursor.fetchone()[0]
            
            # Create sample roles
            sample_roles = [
                ("admin", "Administrator", "Full system access", True),
                ("user_manager", "User Manager", "Can manage users", True),
                ("viewer", "Viewer", "Read-only access", True),
                ("user", "Regular User", "Basic user access", True),
            ]
            
            role_ids = {}
            for role in sample_roles:
                cursor.execute("""
                    INSERT INTO roles (name, display_name, description, is_active)
                    OUTPUT INSERTED.id
                    VALUES (?, ?, ?, ?)
                """, *role)
                role_ids[role[0]] = cursor.fetchone()[0]
            
            # Assign permissions to roles
            role_permissions = {
                "admin": [
                    # Full system access
                    "users.read", "users.create", "users.update", "users.delete", "users.manage_roles", "users.toggle_status",
                    "roles.read", "roles.create", "roles.update", "roles.delete", "roles.manage_permissions",
                    "permissions.read", "permissions.create",
                    "dashboard.read", "dashboard.metrics", "dashboard.summary",
                    "logs.read", "logs.create", "logs.export",
                    "system.admin", "system.settings", "system.backup", "system.maintenance",
                    "data.init", "data.export", "data.import",
                    "reports.read", "reports.create", "reports.export"
                ],
                "user_manager": [
                    # User management focused
                    "users.read", "users.create", "users.update", "users.manage_roles", "users.toggle_status",
                    "roles.read",
                    "permissions.read",
                    "dashboard.read", "dashboard.summary",
                    "logs.read",
                    "reports.read"
                ],
                "viewer": [
                    # Read-only access
                    "users.read",
                    "roles.read",
                    "permissions.read",
                    "dashboard.read", "dashboard.metrics", "dashboard.summary",
                    "logs.read",
                    "reports.read"
                ],
                "user": [
                    # Basic user access
                    "dashboard.read",
                    "reports.read"
                ]
            }
            
            for role_name, permissions in role_permissions.items():
                for perm_name in permissions:
                    cursor.execute("""
                        INSERT INTO role_permissions (role_id, permission_id)
                        VALUES (?, ?)
                    """, role_ids[role_name], permission_ids[perm_name])
            
            # Create sample users with additional fields
            sample_users = [
                ("admin", "admin@example.com", "System Administrator", True, "IT", "System Administrator", "+1-555-0101"),
                ("john_doe", "john@example.com", "John Doe", True, "Engineering", "Software Developer", "+1-555-0102"),
                ("jane_smith", "jane@example.com", "Jane Smith", True, "Marketing", "Marketing Manager", "+1-555-0103"),
                ("bob_wilson", "bob@example.com", "Bob Wilson", False, "Sales", "Sales Representative", "+1-555-0104"),
                ("alice_johnson", "alice@example.com", "Alice Johnson", True, "HR", "HR Specialist", "+1-555-0105"),
                ("mike_brown", "mike@example.com", "Mike Brown", True, "Finance", "Financial Analyst", "+1-555-0106"),
            ]
            
            user_ids = {}
            for user in sample_users:
                cursor.execute("""
                    INSERT INTO users (username, email, full_name, is_active, department, position, phone)
                    OUTPUT INSERTED.id
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, *user)
                user_ids[user[0]] = cursor.fetchone()[0]
            
            # Assign roles to users
            user_role_assignments = {
                "admin": ["admin"],
                "john_doe": ["user"],
                "jane_smith": ["user_manager"],
                "bob_wilson": ["viewer"]
            }
            
            for username, roles in user_role_assignments.items():
                for role_name in roles:
                    cursor.execute("""
                        INSERT INTO user_roles (user_id, role_id)
                        VALUES (?, ?)
                    """, user_ids[username], role_ids[role_name])
            
            # Create comprehensive sample audit logs with severity levels
            sample_logs = [
                # Critical severity logs
                ("admin", "create_admin_user", "users", "Created new admin account: super_admin", "success", "critical", "user_management"),
                ("admin", "delete_admin_user", "users", "Deleted admin account: old_admin", "success", "critical", "user_management"),
                ("system", "security_breach_detected", "security", "Multiple failed login attempts detected", "failed", "critical", "auth"),
                ("admin", "modify_system_permissions", "permissions", "Modified critical system permissions", "success", "critical", "role_management"),
                
                # High severity logs
                ("admin", "create_user", "users", "Created new user account: alice_johnson", "success", "high", "user_management"),
                ("jane_smith", "role_assignment", "roles", "Assigned admin role to user", "success", "high", "role_management"),
                ("system", "failed_backup", "system", "Database backup failed - disk space", "failed", "high", "system"),
                ("admin", "password_policy_change", "security", "Updated password policy requirements", "success", "high", "auth"),
                
                # Medium severity logs
                ("john_doe", "update_profile", "users", "Updated user profile information", "success", "medium", "user_management"),
                ("jane_smith", "export_data", "data", "Exported user data to CSV", "success", "medium", "api"),
                ("mike_brown", "role_change", "roles", "Changed user role from user to viewer", "success", "medium", "role_management"),
                ("system", "scheduled_maintenance", "system", "Performed scheduled system maintenance", "success", "medium", "system"),
                
                # Low severity logs
                ("alice_johnson", "view_dashboard", "dashboard", "Accessed main dashboard", "success", "low", "api"),
                ("bob_wilson", "search_users", "users", "Performed user search query", "success", "low", "api"),
                ("john_doe", "view_reports", "reports", "Viewed monthly reports", "success", "low", "api"),
                
                # Info severity logs
                ("admin", "login", "auth", "Admin login successful", "success", "info", "auth"),
                ("john_doe", "login", "auth", "User login successful", "success", "info", "auth"),
                ("jane_smith", "logout", "auth", "User logout", "success", "info", "auth"),
                ("bob_wilson", "login", "auth", "Failed login attempt - invalid password", "failed", "info", "auth"),
                ("alice_johnson", "session_timeout", "auth", "User session expired", "success", "info", "auth"),
                ("mike_brown", "api_request", "api", "API request to /api/users", "success", "info", "api"),
                ("system", "health_check", "system", "System health check completed", "success", "info", "system"),
            ]
            
            for log in sample_logs:
                cursor.execute("""
                    INSERT INTO audit2_logs (username, action, resource, details, status, severity, module)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, *log)
            
            # Create sample metrics
            sample_metrics = [
                ("Active Sessions", 25.0, "count", "users", "Currently active user sessions"),
                ("System Uptime", 99.9, "percentage", "system", "System availability percentage"),
                ("Daily Logins", 150.0, "count", "users", "Number of daily user logins"),
                ("Error Rate", 0.1, "percentage", "system", "System error rate percentage"),
            ]
            
            for metric in sample_metrics:
                cursor.execute("""
                    INSERT INTO dashboard_metrics (metric_name, metric_value, metric_type, category, description)
                    VALUES (?, ?, ?, ?, ?)
                """, *metric)
            
            conn.commit()
            return {"message": "Sample data with RBAC initialized successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)