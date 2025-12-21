import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Registers from './pages/Registers';
import Documents from './pages/Documents';
import Register from './pages/Register';
import AdminAuditLogs from './pages/AdminAuditLogs';
import Reg76List from './pages/excise/Reg76List';
import Reg76Form from './pages/excise/Reg76Form';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/registers" element={
            <ProtectedRoute>
              <Registers />
            </ProtectedRoute>
          } />
          <Route path="/registers/reg76" element={
            <ProtectedRoute>
              <Reg76List />
            </ProtectedRoute>
          } />
          <Route path="/registers/reg76/new" element={
            <ProtectedRoute>
              <Reg76Form />
            </ProtectedRoute>
          } />
          <Route path="/registers/reg76/edit/:id" element={
            <ProtectedRoute>
              <Reg76Form />
            </ProtectedRoute>
          } />
          <Route path="/documents" element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          } />
          <Route path="/admin/audit-logs" element={
            <ProtectedRoute>
              <AdminAuditLogs />
            </ProtectedRoute>
          } />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
