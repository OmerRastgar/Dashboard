-- SQL Server Database Setup Script
-- Run this script to create the database and user for the dashboard

-- Create database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'DashboardDB')
BEGIN
    CREATE DATABASE DashboardDB;
END
GO

USE DashboardDB;
GO

-- Create login and user
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'dashboard_user')
BEGIN
    CREATE LOGIN dashboard_user WITH PASSWORD = 'StrongPassword123!';
END
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'dashboard_user')
BEGIN
    CREATE USER dashboard_user FOR LOGIN dashboard_user;
    ALTER ROLE db_datareader ADD MEMBER dashboard_user;
    ALTER ROLE db_datawriter ADD MEMBER dashboard_user;
    ALTER ROLE db_ddladmin ADD MEMBER dashboard_user;
END
GO

-- The tables will be created automatically by SQLAlchemy when the FastAPI app starts
-- But here's the schema for reference:

/*
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    email NVARCHAR(100) NOT NULL UNIQUE,
    full_name NVARCHAR(100) NOT NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    last_login DATETIME2 NULL
);

CREATE TABLE audit_logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NULL,
    username NVARCHAR(50) NULL,
    action NVARCHAR(100) NOT NULL,
    resource NVARCHAR(100) NULL,
    details NTEXT NULL,
    ip_address NVARCHAR(45) NULL,
    user_agent NVARCHAR(500) NULL,
    timestamp DATETIME2 DEFAULT GETDATE(),
    status NVARCHAR(20) DEFAULT 'success'
);

CREATE TABLE dashboard_metrics (
    id INT IDENTITY(1,1) PRIMARY KEY,
    metric_name NVARCHAR(100) NOT NULL,
    metric_value FLOAT NOT NULL,
    metric_type NVARCHAR(50) NOT NULL,
    category NVARCHAR(50) NOT NULL,
    timestamp DATETIME2 DEFAULT GETDATE(),
    description NVARCHAR(200) NULL
);
*/

PRINT 'Database setup completed successfully!';