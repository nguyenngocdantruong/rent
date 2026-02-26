import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../lib/AuthContext';
import CONFIG from '../lib/config';
import { getActiveRequests, setActiveRequests } from '../lib/cache';
import { getSession } from '../lib/api';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState(() => getActiveRequests());
  const timerRef = useRef(null);
  const [toast, setToast] = useState(null);

  const showAlert = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const refreshPending = useCallback(async (map) => {
    const pending = Array.from(map.entries()).filter(([, r]) => r.status === CONFIG.STATUS.WAITING);
    if (pending.length === 0) return map;
    let updated = new Map(map);
    await Promise.all(pending.map(async ([id]) => {
      try {
        const session = await getSession(id);
        const req = updated.get(id);
        const oldStatus = req.status;
        updated.set(id, {
          ...req,
          status: session.Status,
          code: session.Code || '',
          smsContent: session.SmsContent || '',
        });
        if (oldStatus === CONFIG.STATUS.WAITING && session.Status === CONFIG.STATUS.SUCCESS) {
          showAlert(`✅ Nhận được OTP cho số ${req.phone_number}: ${session.Code}`, 'success');
        }
      } catch {}
    }));
    return updated;
  }, [showAlert]);

  useEffect(() => {
    const hasPending = Array.from(requests.values()).some(r => r.status === CONFIG.STATUS.WAITING);
    if (!hasPending) { clearInterval(timerRef.current); timerRef.current = null; return; }
    if (timerRef.current) return;
    timerRef.current = setInterval(async () => {
      setRequests(prev => {
        refreshPending(prev).then(updated => {
          setActiveRequests(updated);
          setRequests(new Map(updated));
        });
        return prev;
      });
    }, CONFIG.AUTO_REFRESH_INTERVAL);
    return () => { clearInterval(timerRef.current); timerRef.current = null; };
  }, [requests, refreshPending]);

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => showAlert('Đã copy: ' + text, 'success'));
  };

  const getElapsed = (createdTime) => {
    const diff = Math.floor((Date.now() - new Date(createdTime)) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  const initials = user?.fullname
    ? user.fullname.split(' ').slice(-2).map((w) => w[0].toUpperCase()).join('')
    : '?';

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* Cột trái: Profile */}
      <div style={{ flex: '1 1 350px', maxWidth: 450 }}>
        <div className="card-custom">
          <h2 className="card-title">
            <i className="fas fa-user-circle" style={{ marginRight: 10, color: '#3b9eff' }} />
            Thông tin cá nhân
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 14,
              background: 'linear-gradient(135deg, #f093fb, #f5576c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 22, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#1a1d2e' }}>{user?.fullname}</div>
              <div style={{ color: '#6c757d', fontSize: 13, marginTop: 2 }}>@{user?.username}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
            <InfoRow icon="fa-id-card" label="Họ và tên" value={user?.fullname} />
            <InfoRow icon="fa-user" label="Tên đăng nhập" value={user?.username || user?.id} />
            <InfoRow
              icon="fa-chart-pie"
              label="Hạn ngạch thuê"
              value={user?.quota === -1 ? 'Vô hạn' : `${user?.quota || 0} lượt`}
              color={user?.quota === 0 ? '#ef4444' : '#3b9eff'}
            />
            <InfoRow icon="fa-shield-alt" label="Trạng thái" value="Đang hoạt động" color="#22c55e" />
          </div>
        </div>

        <div className="card-custom">
          <h5 style={{ fontWeight: 600, color: '#1a1d2e', marginBottom: 16 }}>
            <i className="fas fa-cog" style={{ marginRight: 8, color: '#6c757d' }} />
            Tài khoản
          </h5>
          <button
            onClick={logout}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              border: 'none', color: 'white',
              padding: '10px 24px', borderRadius: 8,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            <i className="fas fa-sign-out-alt" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Cột phải: Danh sách số đã thuê */}
      <div style={{ flex: '2 1 600px' }}>
        <div className="table-container" style={{ margin: 0 }}>
          <div className="section-header">
            <h3 className="card-title mb-0">Số điện thoại đang chờ OTP</h3>
            <button className="btn btn-sm btn-light" onClick={() => setRequests(new Map(getActiveRequests()))}>
              <i className="fas fa-sync-alt" />
            </button>
          </div>

          <table className="table table-custom">
            <thead>
              <tr>
                <th>DỊCH VỤ</th><th>THỜI GIAN THUÊ</th><th>GIÁ</th><th>SỐ ĐIỆN THOẠI</th><th>OTP</th><th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {requests.size === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state" style={{ padding: '40px 0' }}>
                      <i className="fas fa-history" />
                      <div>Không có số nào đang hoạt động</div>
                    </div>
                  </td>
                </tr>
              ) : (
                Array.from(requests.entries())
                  .sort(([, a], [, b]) => {
                    const da = new Date(a.date_rent || a.createdTime || '2000-01-01');
                    const db = new Date(b.date_rent || b.createdTime || '2000-01-01');
                    return db - da;
                  })
                  .slice(0, 10)
                  .map(([id, req]) => {
                  const phone = `0${req.phone_number}`;
                  const d = new Date(req.date_rent || req.createdTime || '2000-01-01');
                  const rentTime = `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
                  return (
                    <tr key={id}>
                      <td><div style={{ fontWeight: 500 }}>{req.serviceName}</div><small className="text-muted">{getElapsed(req.createdTime)} trước</small></td>
                      <td>{rentTime}</td>
                      <td>{parseInt(req.price).toLocaleString('vi-VN')}₫</td>
                      <td>
                        <span style={{ cursor: 'pointer', color: '#3b9eff', fontWeight: 600 }} onClick={() => copy(phone)} title="Click để copy">
                          {phone}
                        </span>
                      </td>
                      <td>
                        {req.code
                          ? <span className="badge bg-success" style={{ fontSize: 13, cursor: 'pointer' }} onClick={() => copy(req.code)}>{req.code}</span>
                          : <span className="text-muted">Đang chờ...</span>}
                      </td>
                      <td>
                        <span className={`badge bg-${CONFIG.STATUS_COLORS[req.status]}`} style={{ fontSize: 11 }}>
                          {CONFIG.STATUS_LABELS[req.status]}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          {requests.size > 10 && (
            <div style={{ textAlign: 'center', padding: '10px', fontSize: 12, color: '#6c757d' }}>
              Vào mục "Lịch sử" để xem đầy đủ
            </div>
          )}
        </div>
      </div>

      {/* Thông báo dạng Toast */}
      {toast && (
        <div className={`alert alert-${toast.type} position-fixed`}
             style={{ bottom: 20, right: 20, zIndex: 9999, minWidth: 250, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '10px 0', borderBottom: '1px solid #f8f9fa',
    }}>
      <i className={`fas ${icon}`} style={{ width: 18, color: '#adb5bd', fontSize: 14 }} />
      <span style={{ color: '#6c757d', fontSize: 13, width: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500, fontSize: 14, color: color || '#1a1d2e' }}>{value}</span>
    </div>
  );
}
