import pyodbc
import os
from dotenv import load_dotenv
from contextlib import contextmanager

load_dotenv()

# SQL Server connection configuration
SERVER = os.getenv("SQL_SERVER", "localhost")
DATABASE = os.getenv("SQL_DATABASE", "master")
USERNAME = os.getenv("SQL_USERNAME", "dashboard_user")
PASSWORD = os.getenv("SQL_PASSWORD", "StrongPassword123!")
DRIVER = os.getenv("SQL_DRIVER", "ODBC Driver 17 for SQL Server")

# Connection string for SQL Server
if USERNAME and PASSWORD:
    # Use SQL Server Authentication
    CONNECTION_STRING = f"DRIVER={{{DRIVER}}};SERVER={SERVER};DATABASE={DATABASE};UID={USERNAME};PWD={PASSWORD};TrustServerCertificate=yes;"
else:
    # Use Windows Authentication
    CONNECTION_STRING = f"DRIVER={{{DRIVER}}};SERVER={SERVER};DATABASE={DATABASE};Trusted_Connection=yes;TrustServerCertificate=yes;"

@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = None
    try:
        conn = pyodbc.connect(CONNECTION_STRING, timeout=30)
        yield conn
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()

def get_db():
    """Dependency function for FastAPI"""
    with get_db_connection() as conn:
        yield conn

def test_connection():
    """Test database connection"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1 as test")
            result = cursor.fetchone()
            return {"status": "success", "message": "Database connection successful"}
    except Exception as e:
        return {"status": "error", "message": f"Database connection failed: {str(e)}"}
print(test_connection())
def create_tables():
    """Create database tables if they don't exist"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Create roles table
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='roles' AND xtype='U')
                CREATE TABLE roles (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    name NVARCHAR(50) UNIQUE NOT NULL,
                    display_name NVARCHAR(100) NOT NULL,
                    description NVARCHAR(255) NULL,
                    is_active BIT DEFAULT 1,
                    created_at DATETIME2 DEFAULT GETDATE(),
                    updated_at DATETIME2 DEFAULT GETDATE()
                )
            """)
            
            # Create permissions table
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='permissions' AND xtype='U')
                CREATE TABLE permissions (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    name NVARCHAR(50) UNIQUE NOT NULL,
                    display_name NVARCHAR(100) NOT NULL,
                    description NVARCHAR(255) NULL,
                    resource NVARCHAR(50) NOT NULL,
                    action NVARCHAR(50) NOT NULL,
                    created_at DATETIME2 DEFAULT GETDATE()
                )
            """)
            
            # Create role_permissions junction table
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='role_permissions' AND xtype='U')
                CREATE TABLE role_permissions (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    role_id INT NOT NULL,
                    permission_id INT NOT NULL,
                    created_at DATETIME2 DEFAULT GETDATE(),
                    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
                    UNIQUE(role_id, permission_id)
                )
            """)
            
            # Update users table to reference roles
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
                CREATE TABLE users (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    username NVARCHAR(50) UNIQUE NOT NULL,
                    email NVARCHAR(100) UNIQUE NOT NULL,
                    full_name NVARCHAR(100) NOT NULL,
                    role_id INT NULL,
                    is_active BIT DEFAULT 1,
                    created_at DATETIME2 DEFAULT GETDATE(),
                    last_login DATETIME2 NULL,
                    department NVARCHAR(100) NULL,
                    position NVARCHAR(100) NULL,
                    phone NVARCHAR(20) NULL,
                    FOREIGN KEY (role_id) REFERENCES roles(id)
                )
            """)
            
            # Check if additional columns exist, if not add them
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                              WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'role_id')
                BEGIN
                    ALTER TABLE users ADD role_id INT NULL
                    ALTER TABLE users ADD CONSTRAINT FK_users_roles 
                        FOREIGN KEY (role_id) REFERENCES roles(id)
                END
            """)
            
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                              WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'department')
                BEGIN
                    ALTER TABLE users ADD department NVARCHAR(100) NULL
                END
            """)
            
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                              WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'position')
                BEGIN
                    ALTER TABLE users ADD position NVARCHAR(100) NULL
                END
            """)
            
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                              WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'phone')
                BEGIN
                    ALTER TABLE users ADD phone NVARCHAR(20) NULL
                END
            """)
            
            # Create user_roles junction table for multiple roles per user
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_roles' AND xtype='U')
                CREATE TABLE user_roles (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    user_id INT NOT NULL,
                    role_id INT NOT NULL,
                    assigned_at DATETIME2 DEFAULT GETDATE(),
                    assigned_by INT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                    FOREIGN KEY (assigned_by) REFERENCES users(id),
                    UNIQUE(user_id, role_id)
                )
            """)
            
            # Create enhanced audit logs table
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audit2_logs' AND xtype='U')
                CREATE TABLE audit2_logs (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    user_id INT NULL,
                    username NVARCHAR(50) NULL,
                    action NVARCHAR(100) NOT NULL,
                    resource NVARCHAR(100) NULL,
                    details NTEXT NULL,
                    ip_address NVARCHAR(45) NULL,
                    user_agent NVARCHAR(500) NULL,
                    timestamp DATETIME2 DEFAULT GETDATE(),
                    status NVARCHAR(20) DEFAULT 'success',
                    severity NVARCHAR(20) DEFAULT 'info',
                    session_id NVARCHAR(100) NULL,
                    request_id NVARCHAR(100) NULL,
                    module NVARCHAR(50) NULL,
                    before_data NTEXT NULL,
                    after_data NTEXT NULL
                )
            """)
            
            # Add missing columns to existing audit2_logs table
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                              WHERE TABLE_NAME = 'audit2_logs' AND COLUMN_NAME = 'severity')
                BEGIN
                    ALTER TABLE audit2_logs ADD severity NVARCHAR(20) DEFAULT 'info'
                END
            """)
            
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                              WHERE TABLE_NAME = 'audit2_logs' AND COLUMN_NAME = 'session_id')
                BEGIN
                    ALTER TABLE audit2_logs ADD session_id NVARCHAR(100) NULL
                END
            """)
            
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                              WHERE TABLE_NAME = 'audit2_logs' AND COLUMN_NAME = 'request_id')
                BEGIN
                    ALTER TABLE audit2_logs ADD request_id NVARCHAR(100) NULL
                END
            """)
            
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                              WHERE TABLE_NAME = 'audit2_logs' AND COLUMN_NAME = 'module')
                BEGIN
                    ALTER TABLE audit2_logs ADD module NVARCHAR(50) NULL
                END
            """)
            
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                              WHERE TABLE_NAME = 'audit2_logs' AND COLUMN_NAME = 'before_data')
                BEGIN
                    ALTER TABLE audit2_logs ADD before_data NTEXT NULL
                END
            """)
            
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                              WHERE TABLE_NAME = 'audit2_logs' AND COLUMN_NAME = 'after_data')
                BEGIN
                    ALTER TABLE audit2_logs ADD after_data NTEXT NULL
                END
            """)
            
            # Create dashboard metrics table
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='dashboard_metrics' AND xtype='U')
                CREATE TABLE dashboard_metrics (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    metric_name NVARCHAR(100) NOT NULL,
                    metric_value FLOAT NOT NULL,
                    metric_type NVARCHAR(50) NOT NULL,
                    category NVARCHAR(50) NOT NULL,
                    timestamp DATETIME2 DEFAULT GETDATE(),
                    description NVARCHAR(200) NULL
                )
            """)
            
            conn.commit()
            return {"status": "success", "message": "Tables created successfully"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to create tables: {str(e)}"}