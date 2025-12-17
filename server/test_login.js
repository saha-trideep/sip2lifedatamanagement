require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testLogin() {
    console.log('--- Testing Login ---');
    console.log('API URL:', API_URL);

    try {
        const response = await axios.post(`${API_URL}/api/auth/login`, {
            email: 'admin@sip2life.com',
            password: 'admin'
        });

        console.log('✅ Login successful!');
        console.log('Token:', response.data.token);
        console.log('User:', response.data.user);

    } catch (error) {
        console.error('❌ Login failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testLogin();
