import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import CONFIG from '../lib/config';
import { getServicesCached } from '../lib/cache';
import { getServices, getHistory } from '../lib/api';

export default function HistoryPage() {
  // TẠM THỜI redirect về trang chủ
  return <Navigate to="/quick-rent" replace />;

  const [services, setServices] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [filters, setFilters] = useState({
    serviceId: '-1',
    status: '-1',
    fromDate: '',
    toDate: '',
    limit: '50',
  });

  const showAlert = (message, type = 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  useEffect(() => {
    const cached = getServicesCached('vn');
    if (cached) { setServices(cached); return; }
    getServices('vn').then(setServices).catch(() => {});
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await getHistory({ serviceId: filters.serviceId, status: filters.status, fromDate: filters.fromDate, toDate: filters.toDate, limit: filters.limit });
      setHistory(data || []);
    } catch (e) {
      showAlert(e.message || 'Lỗi kết nối API', 'danger');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text) => navigator.clipboard.writeText(text).then(() => showAlert('Đã copy: ' + text, 'success'));

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  return (
    <>
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show position-fixed`}
          style={{ top: 20, right: 20, zIndex: 9999, minWidth: 300 }}>
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert(null)} />
        </div>
      )}

      <div className="card-custom">
        <h2 className="card-title">Lọc lịch sử thuê số</h2>
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <label className="form-label">Dịch vụ</label>
            <select className="form-select" value={filters.serviceId} onChange={e => setFilter('serviceId', e.target.value)}>
              <option value="-1">Tất cả dịch vụ</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Trạng thái</label>
            <select className="form-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
              <option value="-1">Tất cả</option>
              <option value="1">Hoàn thành</option>
              <option value="0">Đang chờ</option>
              <option value="2">Hết hạn</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Từ ngày</label>
            <input type="date" className="form-control" value={filters.fromDate} onChange={e => setFilter('fromDate', e.target.value)} />
          </div>
          <div className="col-md-2">
            <label className="form-label">Đến ngày</label>
            <input type="date" className="form-control" value={filters.toDate} onChange={e => setFilter('toDate', e.target.value)} />
          </div>
          <div className="col-md-2">
            <label className="form-label">Số lượng</label>
            <select className="form-select" value={filters.limit} onChange={e => setFilter('limit', e.target.value)}>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="500">500</option>
            </select>
          </div>
          <div className="col-md-1 d-flex align-items-end">
            <button className="btn btn-primary-custom w-100" onClick={handleSearch} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm" /> : <i className="fas fa-search" />}
            </button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <h3 className="card-title">Lịch sử thuê số</h3>
        <div className="table-responsive-custom">
          <table className="table table-custom">
            <thead>
              <tr>
                <th>#</th><th>DỊCH VỤ</th><th>SỐ ĐIỆN THOẠI</th><th>CODE</th>
                <th>GIÁ</th><th>THỜI GIAN</th><th>TRẠNG THÁI</th><th>TIN NHẮN</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <i className="fas fa-search" />
                    <div>Nhấn nút tìm kiếm để xem lịch sử</div>
                  </div>
                </td></tr>
              ) : history.map((item, idx) => {
                const phone = item.PhoneOriginal || `0${item.Phone}`;
                const time = new Date(item.CreatedTime).toLocaleString('vi-VN');
                return (
                  <tr key={item.ID}>
                    <td>{idx + 1}</td>
                    <td>{item.ServiceName}</td>
                    <td><span style={{ cursor: 'pointer' }} onClick={() => copy(phone)} title="Click để copy">{phone}</span></td>
                    <td>
                      {item.Code
                        ? <span className="badge bg-success" style={{ cursor: 'pointer', fontSize: 14 }} onClick={() => copy(item.Code)} title="Click để copy">{item.Code}</span>
                        : <span className="text-muted">-</span>}
                    </td>
                    <td>{parseInt(item.Price).toLocaleString('vi-VN')}₫</td>
                    <td>{time}</td>
                    <td><span className={`badge bg-${CONFIG.STATUS_COLORS[item.Status]}`}>{CONFIG.STATUS_LABELS[item.Status]}</span></td>
                    <td>
                      {item.SmsContent
                        ? <button className="btn btn-sm btn-info" onClick={() => item.IsSound === 'true' || item.IsSound === true ? window.open(item.SmsContent, '_blank') : alert(`Tin nhắn:\n\n${item.SmsContent}`)}>
                            <i className="fas fa-eye" />
                          </button>
                        : <span className="text-muted">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
