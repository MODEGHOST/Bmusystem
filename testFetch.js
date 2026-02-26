// testFetch.js
fetch('http://localhost:5000/api/equipment/dashboard-summary', {
    headers: { 'Authorization': 'Bearer test' }
})
.then(res => res.text().then(text => ({ status: res.status, text })))
.then(console.log)
.catch(console.error);
