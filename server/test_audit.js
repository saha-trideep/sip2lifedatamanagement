const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logAudit } = require('./utils/auditLogger');

async function testAudit() {
    console.log('--- Starting Audit Log Test ---');

    // 1. Simulate Action (Directly calling logAudit to test utility first)
    console.log('1. Testing logAudit utility...');
    const testUserId = 1; // Admin
    await logAudit({
        userId: testUserId,
        action: 'TEST_ACTION',
        entityType: 'TEST',
        entityId: '123',
        metadata: { test: true }
    });

    // 2. Query DB to verify
    console.log('2. Verifying log in database...');
    const log = await prisma.auditLog.findFirst({
        where: { action: 'TEST_ACTION' },
        orderBy: { createdAt: 'desc' }
    });

    if (log && log.entityId === '123') {
        console.log('✅ SUCCESS: Test log found!', log);
    } else {
        console.error('❌ FAILED: Log not found');
        process.exit(1);
    }

    // 3. Clean up test log (optional, but good practice if not immutable strict for tests)
    // Actually, our requirement says immutable. We'll leave it or user explicit DB cleanup.
    // Since this is dev, it's fine.

    console.log('--- Test Completed Successfully ---');
}

testAudit()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
