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
import Reg74Dashboard from './pages/excise/Reg74Dashboard';
import Reg74Register from './pages/excise/Reg74Register';
import RegABatchRegister from './pages/excise/RegABatchRegister';
import Reg78Register from './pages/excise/Reg78Register';
import RegBRegister from './pages/excise/RegBRegister';
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
          <Route path="/registers/reg74" element={
            <ProtectedRoute>
              <Reg74Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/registers/reg74/register/:vatId" element={
            <ProtectedRoute>
              <Reg74Register />
            </ProtectedRoute>
          } />
          <Route path="/registers/reg-a" element={
            <ProtectedRoute>
              <RegABatchRegister />
            </ProtectedRoute>
          } />
          <Route path="/registers/reg78" element={
            <ProtectedRoute>
              <Reg78Register />
            </ProtectedRoute>
          } />
          <Route path="/registers/reg-b" element={
            <ProtectedRoute>
              <RegBRegister />
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
