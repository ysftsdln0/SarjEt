const express = require('express');
const path = require('path');

// Test the route directly
const app = express();
app.use(express.json());

// Import the vehicle routes
const vehicleRoutes = require('./src/routes/vehicles');
app.use('/api/vehicles', vehicleRoutes);

const PORT = 3001; // Different port to avoid conflicts

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Testing EV data endpoint...');
  
  // Make a request to our own endpoint
  const http = require('http');
  const req = http.request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/vehicles/ev-data',
    method: 'GET'
  }, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);
      
      if (res.statusCode === 200) {
        try {
          const vehicles = JSON.parse(data);
          console.log('Success! Vehicle count:', vehicles.length);
          console.log('First vehicle:', vehicles[0] ? vehicles[0].brand + ' ' + vehicles[0].model : 'none');
        } catch (e) {
          console.log('JSON parse error:', e.message);
          console.log('Raw data length:', data.length);
        }
      } else {
        console.log('Error response:', data);
      }
      
      process.exit(0);
    });
  });
  
  req.on('error', (e) => {
    console.error('Request failed:', e.message);
    process.exit(1);
  });
  
  req.end();
});
