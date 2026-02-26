const ONE_DAY = 24 * 60 * 60 * 1000;

export function getBalanceCached() {
  try {
    const raw = localStorage.getItem('viotp_balance_cache');
    if (!raw) return null;
    const { balance, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < ONE_DAY) return balance;
    localStorage.removeItem('viotp_balance_cache');
  } catch {}
  return null;
}

export function setBalanceCache(balance) {
  localStorage.setItem('viotp_balance_cache', JSON.stringify({ balance, timestamp: Date.now() }));
}

export function getServicesCached(country) {
  try {
    const raw = localStorage.getItem(`viotp_services_${country}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setServicesCache(country, data) {
  localStorage.setItem(`viotp_services_${country}`, JSON.stringify(data));
}

export function getActiveRequests() {
  try {
    const raw = localStorage.getItem('viotp_active_requests');
    return raw ? new Map(Object.entries(JSON.parse(raw))) : new Map();
  } catch {
    return new Map();
  }
}

export function setActiveRequests(map) {
  localStorage.setItem('viotp_active_requests', JSON.stringify(Object.fromEntries(map)));
}
