import { useState } from 'react';
import { login } from '../lib/auth';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      setLoading(true);
      const session = await login(username.trim(), password);
      onLogin(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1d2e 0%, #252943 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: 'white', borderRadius: 16,
        padding: '40px 36px', width: '100%', maxWidth: 400,
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/icon.png" alt="Logo" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 10, marginBottom: 12 }} />
          <h4 style={{ color: '#1a1d2e', fontWeight: 700, marginBottom: 4 }}>Thuê số online</h4>
          <p style={{ color: '#6c757d', fontSize: 13 }}>Đăng nhập để tiếp tục</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: 13, color: '#495057', marginBottom: 6 }}>
              Tên đăng nhập
            </label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-user" style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: '#adb5bd', fontSize: 14,
              }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                required
                autoComplete="username"
                className="form-control"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: 13, color: '#495057', marginBottom: 6 }}>
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-lock" style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: '#adb5bd', fontSize: 14,
              }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
                autoComplete="current-password"
                className="form-control"
                style={{ paddingLeft: 36, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#adb5bd', fontSize: 14, padding: 4,
                }}
              >
                <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8,
              padding: '10px 14px', color: '#c53030', fontSize: 13, marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <i className="fas fa-exclamation-circle" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-custom"
            style={{ width: '100%', fontSize: 15 }}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Đang đăng nhập...</>
            ) : (
              <><i className="fas fa-sign-in-alt" style={{ marginRight: 8 }} />Đăng nhập</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
