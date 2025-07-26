from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from dotenv import load_dotenv
import secrets

load_dotenv()

# Configuration
SECRET_KEY = "your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random-12345"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Bearer token
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    """Create a JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """Verify and decode a JWT token"""
    try:
        print(f"DEBUG: Verifying token with SECRET_KEY: {SECRET_KEY[:10]}...")
        print(f"DEBUG: Using algorithm: {ALGORITHM}")
        print(f"DEBUG: Expected token type: {token_type}")
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"DEBUG: JWT decode successful")
        print(f"DEBUG: Payload type: {payload.get('type')}")
        print(f"DEBUG: Payload sub: {payload.get('sub')}")
        print(f"DEBUG: Payload username: {payload.get('username')}")
        
        if payload.get("type") != token_type:
            print(f"DEBUG: Token type mismatch - expected {token_type}, got {payload.get('type')}")
            return None
        
        print(f"DEBUG: Token verification successful")
        return payload
    except JWTError as e:
        print(f"DEBUG: JWT Error: {str(e)}")
        return None
    except Exception as e:
        print(f"DEBUG: Unexpected error: {str(e)}")
        return None

def generate_reset_token() -> str:
    """Generate a secure password reset token"""
    return secrets.token_urlsafe(32)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get the current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        print(f"DEBUG: Received credentials: {credentials.credentials[:20]}...")
        payload = verify_token(credentials.credentials, "access")
        print(f"DEBUG: verify_token returned: {payload is not None}")
        
        if payload is None:
            print("DEBUG: Payload is None, raising credentials exception")
            raise credentials_exception
        
        user_id_str: str = payload.get("sub")
        username: str = payload.get("username")
        print(f"DEBUG: Extracted user_id_str: {user_id_str}, username: {username}")
        
        if user_id_str is None or username is None:
            print("DEBUG: Missing user_id or username, raising credentials exception")
            raise credentials_exception
            
        try:
            user_id = int(user_id_str)  # Convert string back to integer
        except (ValueError, TypeError):
            print("DEBUG: Invalid user_id format, raising credentials exception")
            raise credentials_exception
            
        print("DEBUG: Authentication successful")
        return {
            "id": user_id,
            "sub": user_id_str,  # Keep string version for logging
            "username": username,
            "permissions": payload.get("permissions", [])
        }
    except JWTError as e:
        print(f"DEBUG: JWTError in get_current_user: {str(e)}")
        raise credentials_exception
    except Exception as e:
        print(f"DEBUG: Unexpected error in get_current_user: {str(e)}")
        raise credentials_exception

async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    """Get the current active user (additional validation can be added here)"""
    return current_user

def require_permission(permission: str):
    """Decorator to require specific permission"""
    def permission_checker(current_user: dict = Depends(get_current_active_user)):
        if permission not in current_user.get("permissions", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' required"
            )
        return current_user
    return permission_checker

def require_admin():
    """Require admin role"""
    return require_permission("admin.all")