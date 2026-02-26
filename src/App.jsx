import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import QuickRentPage from './pages/QuickRentPage';
import HistoryPage from './pages/HistoryPage';
import GuidePage from './pages/GuidePage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/quick-rent" replace />} />
        <Route path="/quick-rent" element={<QuickRentPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/guide" element={<GuidePage />} />
      </Routes>
    </Layout>
  );
}
