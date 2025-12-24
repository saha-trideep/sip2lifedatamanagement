-- Add indexes for optimized login queries
-- This will significantly speed up user lookups by email

-- Index on User.email for faster login queries
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);

-- Index on AuditLog for faster audit queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_auditlog_userid ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS idx_auditlog_createdat ON "AuditLog"("createdAt");
