import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AccountOrdersPage } from './pages/AccountOrdersPage'
import { RebalancePage } from './pages/RebalancePage'
import { ReturnsPage } from './pages/ReturnsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AccountOrdersPage />} />
        <Route path="/rebalance" element={<RebalancePage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
