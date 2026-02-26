import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import QuickRentPage from './pages/QuickRentPage';
import HistoryPage from './pages/HistoryPage';
import GuidePage from './pages/GuidePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import { useAuth } from './lib/AuthContext';

function ProtectedApp() {
  const { user, login } = useAuth();

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/quick-rent" replace />} />
        <Route path="/quick-rent" element={<QuickRentPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return <ProtectedApp />;
}
