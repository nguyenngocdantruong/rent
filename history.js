// History Page JavaScript
class HistoryApp {
    constructor() {
        this.init();
    }

    init() {
        console.log('Initializing History App...');
        this.loadBalance();
        this.loadServices();
        this.setDefaultDates();
        this.bindEvents();
        
        // Auto load history on page load
        setTimeout(() => this.loadHistory(), 500);
    }

    // Set default date range (last 7 days)
    setDefaultDates() {
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);

        const formatDate = (date) => {
            return date.toISOString().split('T')[0];
        };

        document.getElementById('filterFromDate').value = formatDate(lastWeek);
        document.getElementById('filterToDate').value = formatDate(today);
    }

    // Bind events
    bindEvents() {
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.loadHistory());
        }

        // Enter key to search
        ['filterService', 'filterStatus', 'filterFromDate', 'filterToDate', 'filterLimit'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.loadHistory();
                });
            }
        });
    }

    // Build API URL with CORS proxy if enabled
    buildApiUrl(endpoint) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        if (CONFIG.USE_CORS_PROXY) {
            return `${CONFIG.CORS_PROXY}${encodeURIComponent(url)}`;
        }
        return url;
    }

    // Load balance (with caching)
    async loadBalance() {
        try {
            // Check cache first
            const cached = this.getBalanceFromCache();
            if (cached !== null) {
                this.updateBalanceDisplay(cached);
                return;
            }

            const response = await fetch(
                this.buildApiUrl(`/users/balance?token=${CONFIG.API_TOKEN}`)
            );
            const data = await response.json();
            
            if (data.success && data.status_code === 200) {
                this.updateBalanceDisplay(data.data.balance);
                this.saveBalanceToCache(data.data.balance);
            }
        } catch (error) {
            console.error('Error loading balance:', error);
        }
    }

    // Get balance from cache (valid for 1 day)
    getBalanceFromCache() {
        try {
            const cached = localStorage.getItem('viotp_balance_cache');
            if (!cached) return null;
            
            const { balance, timestamp } = JSON.parse(cached);
            const now = Date.now();
            const oneDayInMs = 24 * 60 * 60 * 1000;
            
            if (now - timestamp < oneDayInMs) {
                console.log('Using cached balance');
                return balance;
            }
            
            localStorage.removeItem('viotp_balance_cache');
            return null;
        } catch (error) {
            return null;
        }
    }

    // Save balance to cache
    saveBalanceToCache(balance) {
        try {
            const cacheData = {
                balance: balance,
                timestamp: Date.now()
            };
            localStorage.setItem('viotp_balance_cache', JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error caching balance:', error);
        }
    }

    // Update balance display
    updateBalanceDisplay(balance) {
        const balanceEl = document.getElementById('userBalance');
        if (balanceEl) {
            balanceEl.textContent = `${balance.toLocaleString('vi-VN')}₫`;
        }
    }

    // Load services for filter dropdown (with caching)
    async loadServices() {
        try {
            // Check cache first
            const cached = this.getServicesFromCache();
            if (cached) {
                this.renderServicesDropdown(cached);
                return;
            }

            const response = await fetch(
                this.buildApiUrl(`/service/getv2?token=${CONFIG.API_TOKEN}&country=vn`)
            );
            const data = await response.json();
            
            if (data.success && data.status_code === 200) {
                this.renderServicesDropdown(data.data);
                this.saveServicesToCache(data.data);
            }
        } catch (error) {
            console.error('Error loading services:', error);
        }
    }

    // Get services from cache
    getServicesFromCache() {
        try {
            const cached = localStorage.getItem('viotp_services_vn');
            if (cached) {
                console.log('Using cached services');
                return JSON.parse(cached);
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    // Save services to cache
    saveServicesToCache(services) {
        try {
            localStorage.setItem('viotp_services_vn', JSON.stringify(services));
        } catch (error) {
            console.error('Error caching services:', error);
        }
    }

    // Render services dropdown
    renderServicesDropdown(services) {
        const select = document.getElementById('filterService');
        if (!select) return;

        services.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = service.name;
            select.appendChild(option);
        });
    }

    // API: Load history
    async loadHistory() {
        const serviceId = document.getElementById('filterService').value;
        const status = document.getElementById('filterStatus').value;
        const fromDate = document.getElementById('filterFromDate').value;
        const toDate = document.getElementById('filterToDate').value;
        const limit = document.getElementById('filterLimit').value;

        // Build query params
        let params = `token=${CONFIG.API_TOKEN}`;
        if (serviceId) params += `&service=${serviceId}`;
        if (status) params += `&status=${status}`;
        if (fromDate) params += `&fromDate=${fromDate}`;
        if (toDate) params += `&toDate=${toDate}`;
        if (limit) params += `&limit=${limit}`;

        const btn = document.getElementById('searchBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

        try {
            const response = await fetch(
                this.buildApiUrl(`/session/historyv2?${params}`)
            );
            const data = await response.json();
            
            if (data.success && data.status_code === 200) {
                this.renderHistory(data.data);
            } else {
                this.showAlert(data.message || 'Không thể tải lịch sử', 'danger');
                this.renderHistory([]);
            }
        } catch (error) {
            console.error('Error loading history:', error);
            this.showAlert('Lỗi kết nối API', 'danger');
            this.renderHistory([]);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-search"></i>';
        }
    }

    // Render history table
    renderHistory(historyData) {
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;

        if (!historyData || historyData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <div>Không tìm thấy dữ liệu</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        historyData.forEach((item, index) => {
            const statusClass = CONFIG.STATUS_COLORS[item.Status];
            const statusLabel = CONFIG.STATUS_LABELS[item.Status];
            const displayPhone = item.PhoneOriginal || `0${item.Phone}`;
            const createdTime = new Date(item.CreatedTime).toLocaleString('vi-VN');

            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.ServiceName}</td>
                    <td>
                        <span class="phone-number" onclick="historyApp.copyToClipboard('${displayPhone}')" style="cursor: pointer;" title="Click để copy">
                            ${displayPhone}
                        </span>
                    </td>
                    <td>
                        ${item.Code ? 
                            `<span class="badge bg-success" onclick="historyApp.copyToClipboard('${item.Code}')" style="cursor: pointer; font-size: 14px;" title="Click để copy">${item.Code}</span>` : 
                            '<span class="text-muted">-</span>'
                        }
                    </td>
                    <td>${parseInt(item.Price).toLocaleString('vi-VN')}₫</td>
                    <td>${createdTime}</td>
                    <td><span class="badge bg-${statusClass}">${statusLabel}</span></td>
                    <td>
                        ${item.SmsContent ? 
                            `<button class="btn btn-sm btn-info" onclick="historyApp.viewMessage('${item.ID}', ${item.IsSound === 'true' || item.IsSound === true}, '${item.SmsContent.replace(/'/g, "\\'")}')">
                                <i class="fas fa-eye"></i>
                            </button>` : 
                            '<span class="text-muted">-</span>'
                        }
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    // View message
    viewMessage(id, isSound, smsContent) {
        if (isSound) {
            window.open(smsContent, '_blank');
        } else {
            alert(`Tin nhắn:\n\n${smsContent}`);
        }
    }

    // Copy to clipboard
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showAlert('Đã copy: ' + text, 'success', 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }

    // Show alert
    showAlert(message, type = 'info', duration = 3000) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, duration);
    }
}

// Initialize app when DOM is ready
let historyApp;
document.addEventListener('DOMContentLoaded', () => {
    historyApp = new HistoryApp();
});
