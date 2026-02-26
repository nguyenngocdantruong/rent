import CONFIG from './config';
import { setBalanceCache, setServicesCache } from './cache';

const IS_DEV = import.meta.env.DEV;

function buildUrl(endpoint, extraParams = {}) {
  if (IS_DEV) {
    // Vite proxy: /api/users/balance?token=...
    const params = new URLSearchParams({ token: CONFIG.API_TOKEN, ...extraParams });
    return `/api${endpoint}?${params}`;
  }
  // Production: Vercel serverless /api/proxy?path=...
  const path = endpoint.replace(/^\//, '');
  const params = new URLSearchParams({ path, ...extraParams });
  return `/api/proxy?${params}`;
}

export async function getBalance() {
  const res = await fetch(buildUrl('/users/balance'));
  const data = await res.json();
  if (data.success && data.status_code === 200) {
    setBalanceCache(data.data.balance);
    return data.data.balance;
  }
  throw new Error(data.message);
}

export async function getServices(country) {
  const res = await fetch(buildUrl('/service/getv2', { country }));
  const data = await res.json();
  if (data.success && data.status_code === 200) {
    setServicesCache(country, data.data);
    return data.data;
  }
  throw new Error(data.message);
}

export async function rentPhone(serviceId, country) {
  const res = await fetch(buildUrl('/request/getv2', { serviceId, country }));
  const data = await res.json();
  if (data.success && data.status_code === 200) return data.data;
  throw new Error(data.message || 'Không thể thuê số');
}

export async function getSession(requestId) {
  const res = await fetch(buildUrl('/session/getv2', { requestId }));
  const data = await res.json();
  if (data.success && data.status_code === 200) return data.data;
  throw new Error(data.message);
}

export async function getHistory({ serviceId, status, fromDate, toDate, limit }) {
  const extra = {
    fromDate,
    toDate,
    limit,
    service: serviceId || '-1',
    status: status !== '' ? status : '-1',
  };
  const res = await fetch(buildUrl('/session/historyv2', extra));
  const data = await res.json();
  if (data.success && data.status_code === 200) return data.data;
  throw new Error(data.message || 'Không thể tải lịch sử');
}
