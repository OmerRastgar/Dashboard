-- Create login and user for dashboard_user on master database
-- Run this script as SQL Server administrator (sa or Windows admin)

-- Step 1: Create the server login if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'dashboard_user')
BEGIN
    CREATE LOGIN dashboard_user WITH PASSWORD = 'StrongPassword123!';
    PRINT 'Login dashboard_user created successfully';
END
ELSE
BEGIN
    PRINT 'Login dashboard_user already exists';
END
GO

-- Step 2: Switch to master database and create user
USE master;
GO

-- Create the database user if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'dashboard_user')
BEGIN
    CREATE USER dashboard_user FOR LOGIN dashboard_user;
    PRINT 'User dashboard_user created in master database';
END
ELSE
BEGIN
    PRINT 'User dashboard_user already exists in master database';
END
GO

-- Step 3: Grant necessary roles and permissions
ALTER ROLE db_datareader ADD MEMBER dashboard_user;
ALTER ROLE db_datawriter ADD MEMBER dashboard_user;
ALTER ROLE db_ddladmin ADD MEMBER dashboard_user;

-- Grant additional permissions for table creation and management
GRANT CREATE TABLE TO dashboard_user;
GRANT ALTER ON SCHEMA::dbo TO dashboard_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO dashboard_user;

PRINT 'All permissions granted to dashboard_user successfully!';
GO

-- Step 4: Test the login by switching to it
EXECUTE AS LOGIN = 'dashboard_user';
SELECT 'Login test successful - dashboard_user can connect' AS TestResult;
REVERT;
GO