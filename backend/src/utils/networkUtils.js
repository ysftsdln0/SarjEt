const os = require('os');

/**
 * Local IP adresini tespit eder
 * @returns {string} Local IP adresi
 */
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  // Öncelikli arayüz isimleri (genellikle ana bağlantı)
  const priorityInterfaces = ['en0', 'eth0', 'wlan0', 'Wi-Fi', 'Ethernet'];
  
  // Önce priority interfaces'lerde ara
  for (const interfaceName of priorityInterfaces) {
    if (interfaces[interfaceName]) {
      for (const iface of interfaces[interfaceName]) {
        // IPv4, dahili olmayan (external) ve loopback olmayan adresleri al
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }
  
  // Priority interfaces'lerde bulunamazsa, tüm interfaces'lerde ara
  for (const interfaceName in interfaces) {
    for (const iface of interfaces[interfaceName]) {
      // IPv4, dahili olmayan (external) ve loopback olmayan adresleri al
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  // Hiçbir external IP bulunamazsa localhost döndür
  return '127.0.0.1';
}

/**
 * Tüm network interface bilgilerini döndürür
 * @returns {Object} Network interfaces detayları
 */
function getNetworkInterfaces() {
  const interfaces = os.networkInterfaces();
  const result = {};
  
  for (const interfaceName in interfaces) {
    result[interfaceName] = interfaces[interfaceName]
      .filter(iface => iface.family === 'IPv4')
      .map(iface => ({
        address: iface.address,
        internal: iface.internal,
        netmask: iface.netmask
      }));
  }
  
  return result;
}

/**
 * Hostname bilgisini döndürür
 * @returns {string} System hostname
 */
function getHostname() {
  return os.hostname();
}

/**
 * Platform bilgisini döndürür
 * @returns {string} System platform
 */
function getPlatform() {
  return os.platform();
}

module.exports = {
  getLocalIPAddress,
  getNetworkInterfaces,
  getHostname,
  getPlatform
};
