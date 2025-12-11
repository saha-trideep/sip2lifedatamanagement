require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Checking buckets...");
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error("Error listing buckets:", error);
    } else {
        console.log("Buckets found:", data.map(b => b.name));
        const docBucket = data.find(b => b.name === 'documents');
        if (docBucket) {
            console.log("Verified: 'documents' bucket exists.");
            console.log("Public:", docBucket.public);
        } else {
            console.error("CRITICAL: 'documents' bucket NOT found.");
        }
    }
}

main();
