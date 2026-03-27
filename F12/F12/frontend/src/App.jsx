import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminProfile } from './pages/AdminProfile';
import { PsychologistDashboard } from './pages/PsychologistDashboard';
import { PsychologistProfile } from './pages/PsychologistProfile';
import { TestConstructor } from './pages/TestConstructor';
import { ClientForm } from './pages/ClientForm';
import { ReportTemplateEditor } from './pages/ReportTemplateEditor';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/form/:formId" element={<ClientForm />} />

          {/* Админ */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/profile" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminProfile />
            </ProtectedRoute>
          } />

          {/* Психолог */}
          <Route path="/psychologist" element={
            <ProtectedRoute allowedRoles={['psychologist']}>
              <PsychologistDashboard />
            </ProtectedRoute>
          } />
          <Route path="/psychologist/profile" element={
            <ProtectedRoute allowedRoles={['psychologist']}>
              <PsychologistProfile />
            </ProtectedRoute>
          } />

          {/* Конструктор тестов */}
          <Route path="/psychologist/constructor/new" element={
            <ProtectedRoute allowedRoles={['psychologist', 'admin']}>
              <TestConstructor />
            </ProtectedRoute>
          } />
          <Route path="/psychologist/constructor/:testId" element={
            <ProtectedRoute allowedRoles={['psychologist', 'admin']}>
              <TestConstructor />
            </ProtectedRoute>
          } />
          <Route path="/psychologist/reports/:testId" element={
            <ProtectedRoute allowedRoles={['psychologist', 'admin']}>
              <ReportTemplateEditor />
              </ProtectedRoute>
         } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;