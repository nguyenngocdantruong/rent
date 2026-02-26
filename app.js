// Main Application JavaScript
class VIOTPApp {
    constructor() {
        this.activeRequests = new Map(); // Store active phone requests
        this.autoRefreshTimer = null;
        this.currentCountry = 'vn';
        this.init();
    }

    init() {
        console.log('Initializing VIOTP App...');
        this.loadFromStorage(); // Load saved requests
        this.bindEvents();
        this.loadBalance();
        this.loadServices();
        this.restoreAndStartAutoRefresh(); // Resume polling for pending requests
    }

    // Load active requests from localStorage
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('viotp_active_requests');
            if (saved) {
                const data = JSON.parse(saved);
                this.activeRequests = new Map(Object.entries(data));
                this.renderActiveRequests();
                console.log(`Loaded ${this.activeRequests.size} requests from storage`);
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
        }
    }

    // Save active requests to localStorage
    saveToStorage() {
        try {
            const data = Object.fromEntries(this.activeRequests);
            localStorage.setItem('viotp_active_requests', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    // Resume auto-refresh for pending requests after page reload
    restoreAndStartAutoRefresh() {
        const pendingRequests = Array.from(this.activeRequests.entries())
            .filter(([_, req]) => req.status === CONFIG.STATUS.WAITING);
        
        if (pendingRequests.length > 0) {
            console.log(`Resuming auto-refresh for ${pendingRequests.length} pending requests`);
            // Start auto-refresh without passing requestId
            this.startAutoRefresh();
        }
    }

    // Build API URL with CORS proxy if enabled
    buildApiUrl(endpoint) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        if (CONFIG.USE_CORS_PROXY) {
            return `${CONFIG.CORS_PROXY}${encodeURIComponent(url)}`;
        }
        return url;
    }

    // Bind UI events
    bindEvents() {
        // Thuê số ngay button
        const rentBtn = document.getElementById('rentPhoneBtn');
        if (rentBtn) {
            rentBtn.addEventListener('click', () => this.rentPhone());
        }

        // Country select
        const countrySelect = document.getElementById('countrySelect');
        if (countrySelect) {
            countrySelect.addEventListener('change', (e) => {
                this.currentCountry = e.target.value;
                this.loadServices();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAllCodes());
        }
    }

    // API: Get user balance (with caching)
    async loadBalance(forceRefresh = false) {
        try {
            // Check cache first
            if (!forceRefresh) {
                const cached = this.getBalanceFromCache();
                if (cached !== null) {
                    this.updateBalanceDisplay(cached);
                    return;
                }
            }

            const response = await fetch(
                this.buildApiUrl(`/users/balance?token=${CONFIG.API_TOKEN}`)
            );
            const data = await response.json();
            
            if (data.success && data.status_code === 200) {
                this.updateBalanceDisplay(data.data.balance);
                // Cache balance with timestamp
                this.saveBalanceToCache(data.data.balance);
            } else {
                console.error('Failed to load balance:', data.message);
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
            
            // Check if cache is still valid (less than 1 day old)
            if (now - timestamp < oneDayInMs) {
                console.log('Using cached balance');
                return balance;
            }
            
            // Cache expired
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

    // Update balance in UI
    updateBalanceDisplay(balance) {
        const balanceEl = document.getElementById('userBalance');
        if (balanceEl) {
            balanceEl.textContent = `${balance.toLocaleString('vi-VN')}₫`;
        }
    }

    // API: Get services list (with caching)
    async loadServices() {
        try {
            // Check cache first
            const cached = this.getServicesFromCache();
            if (cached) {
                this.renderServicesDropdown(cached);
                return;
            }

            const response = await fetch(
                this.buildApiUrl(`/service/getv2?token=${CONFIG.API_TOKEN}&country=${this.currentCountry}`)
            );
            const data = await response.json();
            
            if (data.success && data.status_code === 200) {
                this.renderServicesDropdown(data.data);
                // Cache services
                this.saveServicesToCache(data.data);
            } else {
                console.error('Failed to load services:', data.message);
                this.showAlert('Không thể tải danh sách dịch vụ', 'danger');
            }
        } catch (error) {
            console.error('Error loading services:', error);
            this.showAlert('Lỗi kết nối API', 'danger');
        }
    }

    // Get services from cache
    getServicesFromCache() {
        try {
            const cached = localStorage.getItem(`viotp_services_${this.currentCountry}`);
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
            localStorage.setItem(`viotp_services_${this.currentCountry}`, JSON.stringify(services));
        } catch (error) {
            console.error('Error caching services:', error);
        }
    }

    // Render services dropdown
    renderServicesDropdown(services) {
        const select = document.getElementById('serviceSelect');
        if (!select) return;

        // Clear existing options except first one
        select.innerHTML = '<option value="">--- Chọn dịch vụ ---</option>';
        
        services.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = `${service.name} - ${service.price.toLocaleString('vi-VN')}₫`;
            option.dataset.price = service.price;
            select.appendChild(option);
        });
    }

    // API: Rent a phone number
    async rentPhone() {
        const serviceId = document.getElementById('serviceSelect').value;
        
        if (!serviceId) {
            this.showAlert('Vui lòng chọn dịch vụ', 'warning');
            return;
        }

        const btn = document.getElementById('rentPhoneBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang thuê...';

        try {
            const response = await fetch(
                this.buildApiUrl(`/request/getv2?token=${CONFIG.API_TOKEN}&serviceId=${serviceId}&country=${this.currentCountry}`)
            );
            const data = await response.json();
            
            if (data.success && data.status_code === 200) {
                const phoneData = data.data;
                this.addPhoneToList(phoneData, serviceId);
                this.showAlert('Thuê số thành công!', 'success');
                this.loadBalance(true); // Force refresh balance after renting
                
                // Start auto-refresh (if not already running)
                this.startAutoRefresh();
            } else {
                this.showAlert(data.message || 'Không thể thuê số', 'danger');
            }
        } catch (error) {
            console.error('Error renting phone:', error);
            this.showAlert('Lỗi kết nối API', 'danger');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Thuê số ngay';
        }
    }

    // Add phone to the active list
    addPhoneToList(phoneData, serviceId) {
        // Get service name and price
        const serviceSelect = document.getElementById('serviceSelect');
        const selectedOption = serviceSelect.querySelector(`option[value="${serviceId}"]`);
        const serviceName = selectedOption ? selectedOption.textContent.split(' - ')[0] : 'Unknown';
        const price = selectedOption ? selectedOption.dataset.price : '0';

        // Store in active requests
        const requestData = {
            ...phoneData,
            serviceName,
            price,
            status: CONFIG.STATUS.WAITING,
            code: '',
            smsContent: '',
            createdTime: new Date().toISOString()
        };
        this.activeRequests.set(phoneData.request_id, requestData);

        // Save to localStorage
        this.saveToStorage();

        // Render the table
        this.renderActiveRequests();
    }

    // Render active requests table
    renderActiveRequests() {
        const tbody = document.getElementById('phoneTableBody');
        if (!tbody) return;

        if (this.activeRequests.size === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <div>Chưa có dữ liệu</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        let index = 1;
        
        this.activeRequests.forEach((request, requestId) => {
            const statusClass = CONFIG.STATUS_COLORS[request.status];
            const statusLabel = CONFIG.STATUS_LABELS[request.status];
            const displayPhone = `0${request.phone_number}`;
            const elapsed = this.getElapsedTime(request.createdTime);

            html += `
                <tr>
                    <td>${index++}</td>
                    <td>${request.serviceName}</td>
                    <td>${parseInt(request.price).toLocaleString('vi-VN')}₫</td>
                    <td>
                        <span class="phone-number" onclick="app.copyToClipboard('${displayPhone}')" style="cursor: pointer;" title="Click để copy">
                            ${displayPhone}
                        </span>
                    </td>
                    <td>
                        ${request.code ? 
                            `<span class="code-display badge bg-success" onclick="app.copyToClipboard('${request.code}')" style="cursor: pointer; font-size: 14px;" title="Click để copy">${request.code}</span>` : 
                            '<span class="text-muted">Đang chờ...</span>'
                        }
                    </td>
                    <td>${elapsed}</td>
                    <td><span class="badge bg-${statusClass}">${statusLabel}</span></td>
                    <td>
                        ${request.smsContent ? 
                            `<button class="btn btn-sm btn-info" onclick="app.viewMessage('${requestId}')">
                                <i class="fas fa-eye"></i>
                            </button>` : 
                            '<button class="btn btn-sm btn-secondary" onclick="app.refreshCode(\''+requestId+'\')"><i class="fas fa-sync-alt"></i></button>'
                        }
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    // Get elapsed time
    getElapsedTime(createdTime) {
        const now = new Date();
        const created = new Date(createdTime);
        const diff = Math.floor((now - created) / 1000); // seconds
        
        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        return `${Math.floor(diff / 3600)}h`;
    }

    // API: Get code for a request
    async refreshCode(requestId) {
        try {
            const response = await fetch(
                this.buildApiUrl(`/session/getv2?token=${CONFIG.API_TOKEN}&requestId=${requestId}`)
            );
            const data = await response.json();
            
            if (data.success && data.status_code === 200) {
                const sessionData = data.data;
                
                // Update request data
                const request = this.activeRequests.get(requestId);
                if (request) {
                    const oldStatus = request.status;
                    request.status = sessionData.Status;
                    request.code = sessionData.Code || '';
                    request.smsContent = sessionData.SmsContent || '';
                    request.isSound = sessionData.IsSound === 'true' || sessionData.IsSound === true;
                    this.activeRequests.set(requestId, request);
                    
                    // Save to localStorage
                    this.saveToStorage();
                    
                    this.renderActiveRequests();
                    
                    // Thông báo khi nhận được code
                    if (oldStatus === CONFIG.STATUS.WAITING && sessionData.Status === CONFIG.STATUS.SUCCESS) {
                        this.showAlert(`✅ Nhận được OTP: ${sessionData.Code}`, 'success', 5000);
                        // Play sound notification
                        this.playNotificationSound();
                    }
                }
            }
        } catch (error) {
            console.error('Error refreshing code:', error);
        }
    }
    
    // Play notification sound
    playNotificationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTgIF2m98OScTgwOUKnk7rhkHAU2ktjyw3YmBSl+zPDcjj8KDGC06OysWBYKRZ/h8r9vIwUsgs/y2Yk4CBdpvfDknE4MDlCp5O64ZBwFNpLY8sN2JgUpfsz03I4/CgxgtOjsrFgWCkWf4fK/byMFLILP8tmJOAgXab3w5JxODA5QqeTuuGQcBTaS2PLDdiYFKX7M8NyOPwoMYLTo7KxYFgpFn+Hyv28jBSyCz/LZiTgIF2m98OScTgwOUKnk7rhkHAU2ktjyw3YmBSl+zPDcjj8KDG');
            audio.play().catch(() => {}); // Ignore if autoplay blocked
        } catch (e) {}
    }

    // Refresh all pending codes
    async refreshAllCodes() {
        const pendingRequests = Array.from(this.activeRequests.entries())
            .filter(([_, req]) => req.status === CONFIG.STATUS.WAITING);
        
        if (pendingRequests.length === 0) {
            this.showAlert('Không có số nào đang chờ tin nhắn', 'info');
            return;
        }

        for (const [requestId, _] of pendingRequests) {
            await this.refreshCode(requestId);
        }
        
        this.showAlert('Đã làm mới tất cả các số', 'success');
    }

    // Start auto-refresh for active requests
    startAutoRefresh() {
        // Don't start if already running
        if (this.autoRefreshTimer) return;
        
        this.autoRefreshTimer = setInterval(() => {
            // CHỈ fetch những số đang chờ (status=0)
            const pendingRequests = Array.from(this.activeRequests.entries())
                .filter(([_, req]) => req.status === CONFIG.STATUS.WAITING);
            
            // Stop polling nếu không còn số nào đang chờ
            if (pendingRequests.length === 0) {
                console.log('No pending requests, stopping auto-refresh');
                clearInterval(this.autoRefreshTimer);
                this.autoRefreshTimer = null;
                return;
            }

            // Chỉ fetch những số đang chờ thôi
            console.log(`Polling ${pendingRequests.length} pending requests...`);
            pendingRequests.forEach(([reqId, _]) => {
                this.refreshCode(reqId);
            });
        }, CONFIG.AUTO_REFRESH_INTERVAL);
    }

    // View SMS message
    viewMessage(requestId) {
        const request = this.activeRequests.get(requestId);
        if (!request) return;

        const message = request.smsContent || 'Không có tin nhắn';
        
        // Check if it's an audio message
        if (message.startsWith('http')) {
            window.open(message, '_blank');
        } else {
            alert(`Tin nhắn:\n\n${message}`);
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

    // Show alert message
    showAlert(message, type = 'info', duration = 3000) {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after duration
        setTimeout(() => {
            alertDiv.remove();
        }, duration);
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new VIOTPApp();
});
