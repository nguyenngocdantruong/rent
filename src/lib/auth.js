import CONFIG from './config';

const SESSION_KEY = 'viotp_user';
const API_URL = "/zyx";

export async function login(username, password) {
  const res = await fetch(`${API_URL}/${username}`);

  if (!res.ok) {
    if (res.status === 404) throw new Error('Tên đăng nhập không tồn tại');
    throw new Error('Đã có lỗi xảy ra khi đăng nhập');
  }

  const user = await res.json();

  if (user.password !== password) {
    throw new Error('Mật khẩu không đúng');
  }

  const session = {
    id: user.id,
    username: user.username,
    fullname: user.fullname,
    avatar: user.avatar,
    // Không lưu balance và quota ở đây nữa để tránh bị sửa thủ công
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { ...session, balance: user.balance, quota: user.quota };
}

export async function fetchUserInfo(userId) {
  const res = await fetch(`${API_URL}/${userId}`);
  if (!res.ok) throw new Error('Không thể lấy thông tin người dùng');
  return await res.json();
}

export async function updateQuota(userId, newQuota) {
  const res = await fetch(`${API_URL}/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quota: newQuota })
  });
  if (!res.ok) throw new Error('Không thể cập nhật hạn ngạch');
  const updatedUser = await res.json();

  // Cập nhật session hiện tại
  const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
  if (session && (session.id === userId || session.username === userId)) {
    session.quota = updatedUser.quota;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return updatedUser;
}

export async function register(userData) {
  // Kiểm tra tên đăng nhập tồn tại (MockAPI trả về 200 nếu tìm thấy, 404 nếu không)
  const checkRes = await fetch(`${API_URL}/${userData.username}`);
  if (checkRes.ok) throw new Error('Tên đăng nhập đã tồn tại');

  const newUser = {
    ...userData,
    id: userData.username, // Sử dụng username làm ID trong MockAPI
    role: 'user',
    balance: 0,
    quota: 0,
    avatar: `https://i.pravatar.cc/150?u=${userData.username}`,
    createdAt: new Date().toISOString()
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUser)
  });

  if (!res.ok) throw new Error('Không thể đăng ký tài khoản');
  return await res.json();
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
