const prisma = require('./prisma');

// Async non-blocking audit logger
function logAudit({ userId, action, entityType, entityId = null, metadata = {} }) {
    // Fire and forget - don't await this
    setImmediate(async () => {
        try {
            // Ensure metadata is small
            const metadataStr = JSON.stringify(metadata);
            if (metadataStr.length > 1024) {
                console.warn('Metadata too large, truncating');
                metadata = { truncated: true, originalSize: metadataStr.length };
            }

            await prisma.auditLog.create({
                data: {
                    userId,
                    action,
                    entityType,
                    entityId: entityId ? String(entityId) : null,
                    metadata
                }
            });
        } catch (error) {
            // Fail silently - don't break main flow
            console.error('Audit log failed:', error.message);
        }
    });
}

module.exports = { logAudit };
