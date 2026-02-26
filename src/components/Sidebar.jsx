import { useState } from 'react';
import { Link } from 'react-router-dom';

const menu = [
  { title: 'Thuê số nhanh', to: '/quick-rent', icon: 'fa-clock' },
  { title: 'Lịch sử thuê số', to: '/history', icon: 'fa-history' },
  { title: 'Hướng dẫn', to: '/guide', icon: 'fa-book' },
  { title: 'Thông tin cá nhân', to: '/profile', icon: 'fa-user-circle' },
];

export default function Sidebar({ currentPath, onItemClick }) {
  const [showMaintenance, setShowMaintenance] = useState(false);

  return (
    <>
      {showMaintenance && (
        <div
          onClick={() => setShowMaintenance(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 16, padding: 36,
              textAlign: 'center', maxWidth: 360, width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔧</div>
            <h5 style={{ color: '#1a1d2e', marginBottom: 8 }}>Thông báo</h5>
            <p style={{ color: '#6c757d', fontSize: 14, marginBottom: 20 }}>
              Chức năng này đang bảo trì.
            </p>
            <button
              onClick={() => setShowMaintenance(false)}
              style={{
                background: '#3b9eff', border: 'none', color: 'white',
                padding: '8px 28px', borderRadius: 8,
                cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      <div className="sidebar-header">
        <div className="logo">
          <img src="/icon.png" alt="Logo" />
        </div>
        <div className="brand-name">Thuê số online</div>
      </div>
      <ul className="sidebar-menu">
        {menu.map((item) => (
          <li key={item.to}>
            {item.to === '/history' ? (
              <a
                href="#"
                className={currentPath === item.to ? 'active' : ''}
                onClick={e => {
                  e.preventDefault();
                  setShowMaintenance(true);
                  if (onItemClick) onItemClick();
                }}
              >
                <i className={`fas ${item.icon}`} />
                <span>{item.title}</span>
              </a>
            ) : (
              <Link to={item.to} className={currentPath === item.to ? 'active' : ''} onClick={onItemClick}>
                <i className={`fas ${item.icon}`} />
                <span>{item.title}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
