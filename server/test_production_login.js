const axios = require('axios');

// Test against production Render backend
const RENDER_API_URL = 'https://sip2lifedatamanagement.onrender.com';

async function testProductionLoginPerformance() {
    console.log('🧪 Testing Production Login Performance...\n');
    console.log(`API URL: ${RENDER_API_URL}\n`);

    const credentials = {
        email: 'admin@sip2life.com',
        password: 'admin'
    };

    const iterations = 3;
    const times = [];

    for (let i = 1; i <= iterations; i++) {
        try {
            const startTime = Date.now();

            const response = await axios.post(`${RENDER_API_URL}/api/auth/login`, credentials, {
                timeout: 15000
            });

            const endTime = Date.now();
            const duration = endTime - startTime;
            times.push(duration);

            console.log(`✅ Test ${i}/${iterations}: ${duration}ms - ${response.data.user.name}`);
        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            console.error(`❌ Test ${i}/${iterations} failed after ${duration}ms:`, error.message);
        }

        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
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

        console.log('\n🎯 Performance Analysis:');
        if (avgTime < 500) {
            console.log('   ✨ Excellent! Login is very fast.');
        } else if (avgTime < 1000) {
            console.log('   ✅ Good performance. Within acceptable range.');
        } else if (avgTime < 2000) {
            console.log('   ⚠️  Moderate. Network latency may be a factor.');
        } else {
            console.log('   ❌ Slow. Check server resources and database.');
        }

        console.log('\n💡 Note: Production performance includes:');
        console.log('   - Network latency to Render servers');
        console.log('   - Database query time');
        console.log('   - Server processing time');
        console.log('   - Cold start delays (if server was sleeping)');
    } else {
        console.log('\n❌ All tests failed. Server may be down or unreachable.');
    }
}

testProductionLoginPerformance().catch(console.error);
