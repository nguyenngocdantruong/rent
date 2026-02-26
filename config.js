// API Configuration
const CONFIG = {
    // API Base URL
    API_BASE_URL: 'https://api.viotp.com',
    
    // Your API Token - CHANGE THIS TO YOUR ACTUAL TOKEN
    API_TOKEN: '608e6ad63b00426e8ac2ac9c6dfe90a3',
    
    // CORS Proxy - Use one of these to bypass CORS restrictions
    // Option 1: Use CORS proxy (recommended for testing)
    USE_CORS_PROXY: false, // Tắt proxy, dùng Chrome disable CORS
    CORS_PROXY: 'https://api.allorigins.win/raw?url=', // Alternative: 'https://corsproxy.io/?'
    
    // Option 2: Use your own backend proxy (create proxy.php or proxy.js on your server)
    // Set USE_CORS_PROXY: false and API_BASE_URL to your proxy URL
    
    // Auto refresh interval for checking codes (milliseconds)
    AUTO_REFRESH_INTERVAL: 5000, // 5 seconds
    
    // Countries
    COUNTRIES: [
        { code: 'vn', name: 'Việt Nam', flag: '🇻🇳', iso: 'VN' },
        { code: 'la', name: 'Lào', flag: '🇱🇦', iso: 'LA' }
    ],
    
    // Status codes
    STATUS: {
        WAITING: 0,
        SUCCESS: 1,
        EXPIRED: 2
    },
    
    // Status labels
    STATUS_LABELS: {
        0: 'Đang chờ',
        1: 'Hoàn thành',
        2: 'Hết hạn'
    },
    
    // Status colors
    STATUS_COLORS: {
        0: 'warning',
        1: 'success',
        2: 'danger'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
