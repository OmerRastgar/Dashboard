import requests
import json

# Comprehensive permissions to add
permissions = [
    # User Management Permissions
    {"name": "users.read", "display_name": "View Users", "description": "View user information and list", "resource": "users", "action": "read"},
    {"name": "users.create", "display_name": "Create Users", "description": "Create new user accounts", "resource": "users", "action": "create"},
    {"name": "users.update", "display_name": "Update Users", "description": "Edit user information", "resource": "users", "action": "update"},
    {"name": "users.delete", "display_name": "Delete Users", "description": "Delete user accounts", "resource": "users", "action": "delete"},
    {"name": "users.manage_roles", "display_name": "Manage User Roles", "description": "Assign/remove roles from users", "resource": "users", "action": "manage_roles"},
    {"name": "users.toggle_status", "display_name": "Toggle User Status", "description": "Activate/deactivate users", "resource": "users", "action": "toggle_status"},
    
    # Role Management Permissions
    {"name": "roles.read", "display_name": "View Roles", "description": "View role information and list", "resource": "roles", "action": "read"},
    {"name": "roles.create", "display_name": "Create Roles", "description": "Create new roles", "resource": "roles", "action": "create"},
    {"name": "roles.update", "display_name": "Update Roles", "description": "Edit role information", "resource": "roles", "action": "update"},
    {"name": "roles.delete", "display_name": "Delete Roles", "description": "Delete roles", "resource": "roles", "action": "delete"},
    {"name": "roles.manage_permissions", "display_name": "Manage Role Permissions", "description": "Assign/remove permissions from roles", "resource": "roles", "action": "manage_permissions"},
    
    # Permission Management
    {"name": "permissions.read", "display_name": "View Permissions", "description": "View available permissions", "resource": "permissions", "action": "read"},
    {"name": "permissions.create", "display_name": "Create Permissions", "description": "Create new permissions", "resource": "permissions", "action": "create"},
    
    # Dashboard Access
    {"name": "dashboard.read", "display_name": "Access Dashboard", "description": "View main dashboard", "resource": "dashboard", "action": "read"},
    {"name": "dashboard.metrics", "display_name": "View Dashboard Metrics", "description": "View dashboard metrics and statistics", "resource": "dashboard", "action": "metrics"},
    {"name": "dashboard.summary", "display_name": "View Dashboard Summary", "description": "View dashboard summary information", "resource": "dashboard", "action": "summary"},
    
    # Audit Logs
    {"name": "logs.read", "display_name": "View Audit Logs", "description": "View system audit logs", "resource": "logs", "action": "read"},
    {"name": "logs.create", "display_name": "Create Audit Logs", "description": "Create audit log entries", "resource": "logs", "action": "create"},
    {"name": "logs.export", "display_name": "Export Audit Logs", "description": "Export audit logs to files", "resource": "logs", "action": "export"},
    
    # System Administration
    {"name": "system.admin", "display_name": "System Administrator", "description": "Full system access and control", "resource": "system", "action": "admin"},
    {"name": "system.settings", "display_name": "System Settings", "description": "Manage system configuration", "resource": "system", "action": "settings"},
    {"name": "system.backup", "display_name": "System Backup", "description": "Create and manage system backups", "resource": "system", "action": "backup"},
    {"name": "system.maintenance", "display_name": "System Maintenance", "description": "Perform system maintenance tasks", "resource": "system", "action": "maintenance"},
    
    # Data Management
    {"name": "data.init", "display_name": "Initialize Sample Data", "description": "Initialize system with sample data", "resource": "data", "action": "init"},
    {"name": "data.export", "display_name": "Export Data", "description": "Export system data", "resource": "data", "action": "export"},
    {"name": "data.import", "display_name": "Import Data", "description": "Import data into system", "resource": "data", "action": "import"},
    
    # Reports
    {"name": "reports.read", "display_name": "View Reports", "description": "View system reports", "resource": "reports", "action": "read"},
    {"name": "reports.create", "display_name": "Create Reports", "description": "Generate custom reports", "resource": "reports", "action": "create"},
    {"name": "reports.export", "display_name": "Export Reports", "description": "Export reports to various formats", "resource": "reports", "action": "export"},
]

base_url = "http://localhost:8000"

print("Adding comprehensive permissions...")
added_count = 0
for permission in permissions:
    try:
        response = requests.post(f"{base_url}/api/permissions", json=permission)
        if response.status_code == 200:
            print(f"✓ Added: {permission['display_name']}")
            added_count += 1
        else:
            print(f"✗ Failed to add: {permission['display_name']} - {response.text}")
    except Exception as e:
        print(f"✗ Error adding {permission['display_name']}: {str(e)}")

print(f"\nAdded {added_count} out of {len(permissions)} permissions successfully!")

# Now let's check what permissions exist
try:
    response = requests.get(f"{base_url}/api/permissions")
    if response.status_code == 200:
        existing_permissions = response.json()
        print(f"\nTotal permissions in system: {len(existing_permissions)}")
        
        # Group by resource
        by_resource = {}
        for perm in existing_permissions:
            resource = perm['resource']
            if resource not in by_resource:
                by_resource[resource] = []
            by_resource[resource].append(perm['display_name'])
        
        print("\nPermissions by resource:")
        for resource, perms in by_resource.items():
            print(f"  {resource.upper()}: {len(perms)} permissions")
            for perm in perms:
                print(f"    - {perm}")
    else:
        print(f"Failed to fetch permissions: {response.text}")
except Exception as e:
    print(f"Error fetching permissions: {str(e)}")