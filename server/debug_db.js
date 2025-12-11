const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking Users...");
    const users = await prisma.user.findMany();
    console.log("Users found:", users);

    console.log("Checking RegisterEntries...");
    try {
        const entries = await prisma.registerEntry.findMany();
        console.log("Entries found:", entries);
    } catch (e) {
        console.error("Error finding entries (table might be missing):", e.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
