const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking RegisterLink Table...");
    try {
        // Try to create a dummy entry to verify table exists and schema matches
        const count = await prisma.registerLink.count();
        console.log("Current count of links:", count);
    } catch (e) {
        console.error("Error accessing RegisterLink table:", e.code, e.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
