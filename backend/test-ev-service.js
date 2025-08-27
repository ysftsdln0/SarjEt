const evService = require('./src/services/EVDataService');

console.log('Using EVDataService singleton...');

console.log('Getting all vehicles...');
const vehicles = evService.getAllVehicles();
console.log('Vehicles count:', vehicles ? vehicles.length : 'undefined');

if (vehicles && vehicles.length > 0) {
  console.log('First vehicle:', JSON.stringify(vehicles[0], null, 2));
} else {
  console.log('No vehicles found!');
  
  // Debug raw data
  console.log('\nDebugging raw data...');
  console.log('Raw data exists:', !!evService.rawData);
  if (evService.rawData) {
    console.log('Raw data keys:', Object.keys(evService.rawData));
    if (evService.rawData.data) {
      console.log('Data array length:', evService.rawData.data.length);
      if (evService.rawData.data.length > 0) {
        console.log('First raw vehicle:', JSON.stringify(evService.rawData.data[0], null, 2));
      }
    }
  }
}

console.log('\nGetting brands...');
const brands = evService.getMakes();
console.log('Brands:', brands);
