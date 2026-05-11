import { Routes, Route, Navigate } from 'react-router-dom'
import BottomNav from './components/ui/BottomNav'
import DashboardPage from './pages/DashboardPage'
import LoanPage from './pages/LoanPage'
import InvestPage from './pages/InvestPage'

export default function App() {
  return (
    <div className="max-w-lg mx-auto min-h-screen pb-20">
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/loan" element={<LoanPage />} />
        <Route path="/invest" element={<InvestPage />} />
        <Route path="/risk" element={<Navigate to="/invest" replace />} />
        <Route path="/profit" element={<Navigate to="/invest" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
