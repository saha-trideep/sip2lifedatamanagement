const axios = require('axios');

// Test with your actual Render backend URL
const RENDER_API_URL = 'https://sip2lifedatamanagement.onrender.com'; // Replace with your actual Render URL

async function testRenderLogin() {
    console.log('--- Testing Login on Render Backend ---');
    console.log('API URL:', RENDER_API_URL);

    try {
        const response = await axios.post(`${RENDER_API_URL}/api/auth/login`, {
            email: 'admin@sip2life.com',
            password: 'admin'
        });

        console.log('✅ Login successful!');
        console.log('Token received:', response.data.token ? 'Yes' : 'No');
        console.log('User:', response.data.user);
        return true;

    } catch (error) {
        console.error('❌ Login failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', error.response.data);
        } else if (error.code === 'ENOTFOUND') {
            console.error('❌ Backend URL not found. Please update RENDER_API_URL in this script.');
        } else {
            console.error('Error:', error.message);
        }
        return false;
    }
}

testRenderLogin();
