import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import Users from './pages/Users';
import Equipment from './pages/Equipment';
import BorrowEquipment from './pages/BorrowEquipment';
import ReportBrokenEquipment from './pages/ReportBrokenEquipment';
import MyEquipment from './pages/MyEquipment';
import ApprovalRequests from './pages/ApprovalRequests';
import DashboardSummary from './pages/DashboardSummary';
import PasswordManager from './pages/PasswordManager';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/dashboard/summary" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="summary" replace />} />
          <Route path="summary" element={<DashboardSummary />} />
          <Route path="users" element={<Users />} />
          <Route path="equipment" element={<Equipment />} />
          <Route path="borrow" element={<BorrowEquipment />} />
          <Route path="my-equipment" element={<MyEquipment />} />
          <Route path="report-broken" element={<ReportBrokenEquipment />} />
          <Route path="approval-requests" element={<ApprovalRequests />} />
          <Route path="passwords" element={<PasswordManager />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
