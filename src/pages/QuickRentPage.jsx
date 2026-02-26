import { useState, useEffect, useRef, useCallback } from 'react';
import CONFIG from '../lib/config';
import { getServicesCached, setServicesCache, getActiveRequests, setActiveRequests } from '../lib/cache';
import { getServices, rentPhone, getSession } from '../lib/api';

export default function QuickRentPage() {
  const [country, setCountry] = useState('vn');
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [requests, setRequests] = useState(() => getActiveRequests());
  const [renting, setRenting] = useState(false);
  const [alert, setAlert] = useState(null);
  const timerRef = useRef(null);

  const showAlert = useCallback((message, type = 'info', duration = 3000) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), duration);
  }, []);

  // Load services
  useEffect(() => {
    const cached = getServicesCached(country);
    if (cached) { setServices(cached); return; }
    getServices(country).then(setServices).catch(() => showAlert('Không thể tải dịch vụ', 'danger'));
  }, [country, showAlert]);

  // Auto refresh pending requests
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
          showAlert(`✅ Nhận được OTP: ${session.Code}`, 'success', 5000);
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

  const handleRent = async () => {
    if (!serviceId) { showAlert('Vui lòng chọn dịch vụ', 'warning'); return; }
    setRenting(true);
    try {
      const data = await rentPhone(serviceId, country);
      const selectedService = services.find(s => String(s.id) === String(serviceId));
      const newReq = {
        ...data,
        serviceName: selectedService?.name || 'Unknown',
        price: selectedService?.price || 0,
        status: CONFIG.STATUS.WAITING,
        code: '', smsContent: '',
        createdTime: new Date().toISOString(),
      };
      setRequests(prev => {
        const updated = new Map(prev);
        updated.set(data.request_id, newReq);
        setActiveRequests(updated);
        return updated;
      });
      showAlert('Thuê số thành công!', 'success');
      window.dispatchEvent(new Event('balance-refresh'));
    } catch (e) {
      showAlert(e.message || 'Không thể thuê số', 'danger');
    } finally {
      setRenting(false);
    }
  };

  const handleRefreshAll = async () => {
    const updated = await refreshPending(requests);
    setActiveRequests(updated);
    setRequests(new Map(updated));
    showAlert('Đã làm mới', 'success', 2000);
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => showAlert('Đã copy: ' + text, 'success', 2000));
  };

  const handleRefreshOne = async (id, req) => {
    const updated = await refreshPending(new Map([[id, req]]));
    setRequests(prev => {
      const next = new Map(prev);
      next.set(id, updated.get(id));
      setActiveRequests(next);
      return next;
    });
  };

  const getElapsed = (createdTime) => {
    const diff = Math.floor((Date.now() - new Date(createdTime)) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  return (
    <>
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show position-fixed`}
          style={{ top: 20, right: 20, zIndex: 9999, minWidth: 300 }}>
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert(null)} />
        </div>
      )}

      <div className="alert-custom">
        <i className="fas fa-info-circle me-2" />
        Nếu quét QR, quý khách nên kiểm tra lại nội dung trước khi chuyển khoản. Liên hệ CSKH nếu quá 15 phút không nạp thành công.
      </div>

      <div className="card-custom">
        <h2 className="card-title">Thuê số nhanh</h2>
        <div className="row g-3 mb-4">
          <div className="col-md-5">
            <label className="form-label">Quốc gia</label>
            <select className="form-select" value={country} onChange={e => setCountry(e.target.value)}>
              {CONFIG.COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-5">
            <label className="form-label">Dịch vụ</label>
            <select className="form-select" value={serviceId} onChange={e => setServiceId(e.target.value)}>
              <option value="">--- Chọn dịch vụ ---</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {s.price.toLocaleString('vi-VN')}₫</option>
              ))}
            </select>
          </div>
          <div className="col-md-2 d-flex align-items-end">
            <button className="btn btn-primary-custom w-100" onClick={handleRent} disabled={renting}>
              {renting ? <><span className="spinner-border spinner-border-sm me-2" />Đang thuê...</> : 'Thuê số ngay'}
            </button>
          </div>
        </div>
      </div>

      <div className="warning-box">
        <div className="warning-badge"><i className="fas fa-lightbulb" /> Chú ý!</div>
        <div className="warning-text">
          <strong>Trường hợp cần thuê lại sim (chỉ lấy được trong thời gian ngắn 15-30p):</strong><br />
          - Số sau khi mua sẽ không nhận được code sẽ tự động hoàn số sau khi hết thời gian (thường là 15 phút)<br />
          - Các dịch vụ như Gmail, Facebook, Zalo,... khi đăng ký &gt;5 acc sẽ bị check IP, cần reset IP Internet lại<br />
          - Shopee phải kiểm tra tài khoản đã đăng ký chưa trước khi lấy code<br />
          - Telegram cần kiểm tra tài khoản đăng ký trước khi lấy code
        </div>
      </div>

      <div className="table-container">
        <div className="section-header">
          <h3 className="card-title mb-0">Danh sách các số đang chờ tin nhắn</h3>
        </div>
        <div className="search-box">
          <i className="fas fa-search text-muted" />
          <input type="text" placeholder="Click vào Số điện thoại và Code để copy nhanh" readOnly />
          <button className="btn btn-sm btn-light" onClick={handleRefreshAll} title="Làm mới tất cả">
            <i className="fas fa-sync-alt" />
          </button>
          <span className="text-muted">để thử lại số điện thoại</span>
        </div>
        <table className="table table-custom">
          <thead>
            <tr>
              <th>#</th><th>DỊCH VỤ</th><th>GIÁ</th><th>SỐ ĐIỆN THOẠI</th>
              <th>CODE</th><th>THỜI GIAN</th><th>TRẠNG THÁI</th><th>TIN NHẮN</th>
            </tr>
          </thead>
          <tbody>
            {requests.size === 0 ? (
              <tr><td colSpan={8}>
                <div className="empty-state">
                  <i className="fas fa-inbox" /><div>Chưa có dữ liệu</div>
                </div>
              </td></tr>
            ) : Array.from(requests.entries()).map(([id, req], idx) => {
              const phone = `0${req.phone_number}`;
              return (
                <tr key={id}>
                  <td>{idx + 1}</td>
                  <td>{req.serviceName}</td>
                  <td>{parseInt(req.price).toLocaleString('vi-VN')}₫</td>
                  <td>
                    <span style={{ cursor: 'pointer' }} onClick={() => copy(phone)} title="Click để copy">{phone}</span>
                  </td>
                  <td>
                    {req.code
                      ? <span className="badge bg-success" style={{ cursor: 'pointer', fontSize: 14 }} onClick={() => copy(req.code)} title="Click để copy">{req.code}</span>
                      : <span className="text-muted">Đang chờ...</span>}
                  </td>
                  <td>{getElapsed(req.createdTime)}</td>
                  <td><span className={`badge bg-${CONFIG.STATUS_COLORS[req.status]}`}>{CONFIG.STATUS_LABELS[req.status]}</span></td>
                  <td>
                    {req.smsContent
                      ? <button className="btn btn-sm btn-info" onClick={() => req.smsContent.startsWith('http') ? window.open(req.smsContent, '_blank') : alert(`Tin nhắn:\n\n${req.smsContent}`)}>
                          <i className="fas fa-eye" />
                        </button>
                      : <button className="btn btn-sm btn-secondary" onClick={() => handleRefreshOne(id, req)}>
                          <i className="fas fa-sync-alt" />
                        </button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
