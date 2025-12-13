require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDocuments() {
    console.log("Checking document paths in database...\n");

    const docs = await prisma.document.findMany({
        take: 3,
        orderBy: { uploadedAt: 'desc' },
        select: {
            id: true,
            title: true,
            filename: true,
            path: true
        }
    });

    if (docs.length === 0) {
        console.log("No documents found in database.");
    } else {
        console.log(`Found ${docs.length} recent documents:\n`);
        docs.forEach(doc => {
            console.log(`ID: ${doc.id}`);
            console.log(`Title: ${doc.title}`);
            console.log(`Filename: ${doc.filename}`);
            console.log(`Path: ${doc.path}`);
            console.log('---');
        });
    }

    await prisma.$disconnect();
}

checkDocuments();
