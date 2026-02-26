const CONFIG = {
  API_BASE_URL: 'https://api.viotp.com',
  API_TOKEN: import.meta.env.VITE_API_TOKEN || '',
  MOCK_API_URL: import.meta.env.VITE_MOCK_API_URL || '',
  AUTO_REFRESH_INTERVAL: 5000,
  COUNTRIES: [
    { code: 'vn', name: 'Việt Nam', flag: '🇻🇳' },
    { code: 'la', name: 'Lào', flag: '🇱🇦' },
  ],
  STATUS: { WAITING: 0, SUCCESS: 1, EXPIRED: 2 },
  STATUS_LABELS: { 0: 'Đang chờ', 1: 'Hoàn thành', 2: 'Hết hạn' },
  STATUS_COLORS: { 0: 'warning', 1: 'success', 2: 'danger' },
};

export default CONFIG;
