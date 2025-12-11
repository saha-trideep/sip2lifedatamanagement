const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
    const form = new FormData();
    // Create a dummy file
    fs.writeFileSync('temp.txt', 'Hello World');
    form.append('file', fs.createReadStream('temp.txt'));
    form.append('title', 'Test Doc');
    form.append('department', 'General');
    form.append('userId', '1'); // Assuming ID 1 exists

    try {
        const res = await axios.post('http://localhost:3000/api/documents/upload', form, {
            headers: form.getHeaders()
        });
        console.log("Success:", res.data);
    } catch (err) {
        if (err.response) {
            console.error("Server Error:", err.response.status, err.response.data);
        } else {
            console.error("Connection Error:", err.message);
        }
    } finally {
        fs.unlinkSync('temp.txt');
    }
}

testUpload();
