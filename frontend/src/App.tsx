import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AccountOrdersPage } from './pages/AccountOrdersPage'
import { RebalancePage } from './pages/RebalancePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AccountOrdersPage />} />
        <Route path="/rebalance" element={<RebalancePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
