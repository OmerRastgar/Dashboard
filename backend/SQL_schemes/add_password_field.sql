-- Add password field to users table
USE master;
GO

-- Check if password column exists, if not add it
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'password_hash')
BEGIN
    ALTER TABLE users ADD password_hash NVARCHAR(255) NULL;
    PRINT 'Added password_hash column to users table';
END
ELSE
BEGIN
    PRINT 'password_hash column already exists';
END
GO

-- Add password reset fields
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'password_reset_token')
BEGIN
    ALTER TABLE users ADD password_reset_token NVARCHAR(255) NULL;
    PRINT 'Added password_reset_token column to users table';
END
ELSE
BEGIN
    PRINT 'password_reset_token column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'password_reset_expires')
BEGIN
    ALTER TABLE users ADD password_reset_expires DATETIME2 NULL;
    PRINT 'Added password_reset_expires column to users table';
END
ELSE
BEGIN
    PRINT 'password_reset_expires column already exists';
END
GO

-- Add failed login attempts tracking
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'failed_login_attempts')
BEGIN
    ALTER TABLE users ADD failed_login_attempts INT DEFAULT 0;
    PRINT 'Added failed_login_attempts column to users table';
END
ELSE
BEGIN
    PRINT 'failed_login_attempts column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'account_locked_until')
BEGIN
    ALTER TABLE users ADD account_locked_until DATETIME2 NULL;
    PRINT 'Added account_locked_until column to users table';
END
ELSE
BEGIN
    PRINT 'account_locked_until column already exists';
END
GO

PRINT 'Database migration completed successfully!';