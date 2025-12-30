// This is the fix for Reg76Form.jsx fetchVats function
// Replace lines 67-77 with this:

const fetchVats = async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/reg74/vats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setVats(res.data);
        if (!isEdit && res.data.length > 0) {
            setFormData(prev => ({ ...prev, storageVat: res.data[0].vatCode }));
        }
    } catch (error) {
        console.error('Error fetching vats:', error);
        alert('Failed to load vats. Please refresh the page.');
    }
};
