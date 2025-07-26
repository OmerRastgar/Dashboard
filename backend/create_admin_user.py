#!/usr/bin/env python3
"""
Script to create a default admin user for the dashboard
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db_connection
from auth import get_password_hash

def create_admin_user():
    """Create default admin user"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check if admin user already exists (check both admin and admin123)
            cursor.execute("SELECT id, username, password_hash FROM users WHERE username IN ('admin', 'admin123') OR email = 'admin@example.com'")
            existing_admin = cursor.fetchone()
            if existing_admin:
                admin_user_id, username, current_password_hash = existing_admin
                if current_password_hash:
                    print(f"Admin user '{username}' already exists with password!")
                    return
                else:
                    print(f"Admin user '{username}' exists but has no password. Setting password...")
                    # Update existing admin user with password
                    admin_password = "admin123"
                    password_hash = get_password_hash(admin_password)
                    cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", password_hash, admin_user_id)
                    print(f"✅ Admin user password set successfully!")
                    print(f"Username: {username}")
                    print(f"Password: {admin_password}")
                    print("⚠️  Please change the default password after first login!")
                    conn.commit()
                    return
            
            # Create admin user
            admin_password = "admin123"  # Default password - should be changed after first login
            password_hash = get_password_hash(admin_password)
            
            cursor.execute("""
                INSERT INTO users (username, email, full_name, is_active, password_hash)
                VALUES (?, ?, ?, ?, ?)
            """, "admin", "admin@example.com", "System Administrator", True, password_hash)
            
            # Get the created user ID
            cursor.execute("SELECT id FROM users WHERE username = 'admin'")
            admin_user_id = cursor.fetchone()[0]
            
            # Create admin role if it doesn't exist
            cursor.execute("SELECT id FROM roles WHERE name = 'admin'")
            admin_role = cursor.fetchone()
            
            if not admin_role:
                cursor.execute("""
                    INSERT INTO roles (name, display_name, description, is_active)
                    VALUES (?, ?, ?, ?)
                """, "admin", "Administrator", "Full system access", True)
                
                cursor.execute("SELECT id FROM roles WHERE name = 'admin'")
                admin_role_id = cursor.fetchone()[0]
            else:
                admin_role_id = admin_role[0]
            
            # Assign admin role to admin user
            cursor.execute("""
                INSERT INTO user_roles (user_id, role_id)
                VALUES (?, ?)
            """, admin_user_id, admin_role_id)
            
            # Create admin permissions if they don't exist
            admin_permissions = [
                ("admin.all", "Full Admin Access", "Complete system administration access", "admin", "all"),
                ("users.create", "Create Users", "Create new user accounts", "users", "create"),
                ("users.read", "View Users", "View user information", "users", "read"),
                ("users.update", "Update Users", "Modify user accounts", "users", "update"),
                ("users.delete", "Delete Users", "Remove user accounts", "users", "delete"),
                ("roles.create", "Create Roles", "Create new roles", "roles", "create"),
                ("roles.read", "View Roles", "View role information", "roles", "read"),
                ("roles.update", "Update Roles", "Modify roles", "roles", "update"),
                ("roles.delete", "Delete Roles", "Remove roles", "roles", "delete"),
                ("permissions.read", "View Permissions", "View system permissions", "permissions", "read"),
                ("logs.read", "View Logs", "Access system logs", "logs", "read"),
                ("logs.export", "Export Logs", "Export system logs", "logs", "export"),
            ]
            
            for perm in admin_permissions:
                # Check if permission exists
                cursor.execute("SELECT id FROM permissions WHERE name = ?", perm[0])
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO permissions (name, display_name, description, resource, action)
                        VALUES (?, ?, ?, ?, ?)
                    """, *perm)
            
            # Assign all permissions to admin role
            cursor.execute("""
                INSERT INTO role_permissions (role_id, permission_id)
                SELECT ?, p.id
                FROM permissions p
                WHERE NOT EXISTS (
                    SELECT 1 FROM role_permissions rp 
                    WHERE rp.role_id = ? AND rp.permission_id = p.id
                )
            """, admin_role_id, admin_role_id)
            
            conn.commit()
            
            print("✅ Admin user created successfully!")
            print(f"Username: admin")
            print(f"Password: {admin_password}")
            print("⚠️  Please change the default password after first login!")
            
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        return False
    
    return True

if __name__ == "__main__":
    create_admin_user()