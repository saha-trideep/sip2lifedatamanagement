const axios = require('axios');

async function testVatsAPI() {
    try {
        console.log('\n🔍 Testing /api/reg74/vats endpoint...\n');

        // You'll need to replace this with your actual API URL and token
        const API_URL = 'http://localhost:3000'; // or your backend URL

        // Get token from login first (you'll need valid credentials)
        console.log('Note: This test requires the backend server to be running.');
        console.log('If you get a connection error, start the backend with: node index.js\n');

        const response = await axios.get(`${API_URL}/api/reg74/vats`, {
            headers: {
                // Add your auth token here if needed
                // 'Authorization': 'Bearer YOUR_TOKEN'
            }
        });

        console.log(`✅ API Response: ${response.data.length} vats found\n`);
        response.data.forEach(v => {
            console.log(`  ${v.vatCode} - ${v.vatType} (${v.capacityBl} BL)`);
        });

        console.log('\n✅ API is working correctly!');
        console.log('If the frontend dropdown is still empty, try:');
        console.log('  1. Hard refresh the browser (Ctrl+Shift+R)');
        console.log('  2. Clear browser cache');
        console.log('  3. Restart the frontend dev server');

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Backend server is not running!');
            console.log('\nStart the backend server:');
            console.log('  cd server');
            console.log('  node index.js');
        } else if (error.response?.status === 401) {
            console.log('❌ Authentication required!');
            console.log('The endpoint requires a valid JWT token.');
        } else {
            console.log('❌ Error:', error.message);
        }
    }
}

testVatsAPI();
