const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testLoginPerformance() {
    console.log('🧪 Testing Login Performance...\n');
    console.log(`API URL: ${API_URL}\n`);

    const credentials = {
        email: 'admin@sip2life.com',
        password: 'admin'
    };

    const iterations = 5;
    const times = [];

    for (let i = 1; i <= iterations; i++) {
        try {
            const startTime = Date.now();

            const response = await axios.post(`${API_URL}/api/auth/login`, credentials, {
                timeout: 10000
            });

            const endTime = Date.now();
            const duration = endTime - startTime;
            times.push(duration);

            console.log(`✅ Test ${i}/${iterations}: ${duration}ms - ${response.data.user.name}`);
        } catch (error) {
            console.error(`❌ Test ${i}/${iterations} failed:`, error.message);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (times.length > 0) {
        const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        console.log('\n📊 Performance Summary:');
        console.log(`   Average: ${avgTime}ms`);
        console.log(`   Fastest: ${minTime}ms`);
        console.log(`   Slowest: ${maxTime}ms`);
        console.log(`   Tests: ${times.length}/${iterations} successful`);

        if (avgTime < 500) {
            console.log('\n✨ Excellent! Login is performing well.');
        } else if (avgTime < 1000) {
            console.log('\n⚠️  Good, but could be better. Check network/database.');
        } else {
            console.log('\n❌ Slow performance detected. Further optimization needed.');
        }
    }
}

testLoginPerformance().catch(console.error);
