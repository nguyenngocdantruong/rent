import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getBalanceCached } from '../lib/cache';
import { getBalance } from '../lib/api';

export default function Layout({ children }) {
  const [balance, setBalance] = useState(getBalanceCached());
  const [showQR, setShowQR] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    if (balance === null) {
      getBalance().then((v) => mounted && setBalance(v)).catch(() => {});
    }
    const onRefresh = () => {
      getBalance().then((v) => mounted && setBalance(v)).catch(() => {});
    };
    window.addEventListener('balance-refresh', onRefresh);
    return () => {
      mounted = false;
      window.removeEventListener('balance-refresh', onRefresh);
    };
  }, [balance]);

  return (
    <>
      <div className="sidebar">
        <Sidebar currentPath={location.pathname} />
      </div>
      <div className="main-content">
        <div className="top-bar">
          <div />
          <div className="user-info">
            <div className="balance">{(balance ?? 0).toLocaleString('vi-VN')}₫</div>
            <button
              onClick={() => setShowQR(true)}
              style={{
                background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                border: 'none', color: 'white',
                padding: '6px 14px', borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              ☕ Nuôi tôi
            </button>
            <div className="user-avatar">
              <i className="fas fa-user" />
            </div>
          </div>
        </div>
        <div className="content-wrapper">{children}</div>
        <div className="footer">2026© <strong>Thuê số online</strong></div>
      </div>

      {showQR && (
        <div
          onClick={() => setShowQR(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 16, padding: 30,
              textAlign: 'center', maxWidth: 360, width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h5 style={{ marginBottom: 4, color: '#1a1d2e' }}>☕ Mời tôi ly cà phê</h5>
            <p style={{ fontSize: 13, color: '#6c757d', marginBottom: 16 }}>
              Scan QR để ủng hộ — cảm ơn bạn rất nhiều!
            </p>
            <img
              src="https://img.vietqr.io/image/MB-40423456789-print.png"
              alt="QR donate"
              style={{ width: '100%', borderRadius: 8 }}
            />
            <button
              onClick={() => setShowQR(false)}
              style={{
                marginTop: 16, background: '#f0f0f0', border: 'none',
                padding: '8px 24px', borderRadius: 8, cursor: 'pointer',
                fontSize: 14, fontWeight: 500,
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
}
