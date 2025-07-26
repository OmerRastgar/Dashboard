-- Grant permissions to dashboard_user on master database
-- Run this script as an administrator to grant necessary permissions

USE master;
GO

-- Create the user if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'dashboard_user')
BEGIN
    CREATE USER dashboard_user FOR LOGIN dashboard_user;
END
GO

-- Grant necessary permissions
ALTER ROLE db_datareader ADD MEMBER dashboard_user;
ALTER ROLE db_datawriter ADD MEMBER dashboard_user;
ALTER ROLE db_ddladmin ADD MEMBER dashboard_user;

-- Grant specific permissions for table creation and management
GRANT CREATE TABLE TO dashboard_user;
GRANT ALTER ON SCHEMA::dbo TO dashboard_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO dashboard_user;

-- Grant permissions on existing tables if they exist
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.users TO dashboard_user;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'roles')
BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.roles TO dashboard_user;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'permissions')
BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.permissions TO dashboard_user;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'role_permissions')
BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.role_permissions TO dashboard_user;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'user_roles')
BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.user_roles TO dashboard_user;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'audit2_logs')
BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.audit2_logs TO dashboard_user;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'dashboard_metrics')
BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.dashboard_metrics TO dashboard_user;
END

PRINT 'Permissions granted to dashboard_user on master database successfully!';
GO