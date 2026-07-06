import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChapterView from './pages/ChapterView';
import QuizView from './pages/QuizView';
import AdminDashboard from './pages/AdminDashboard';

// A simple wrapper to protect our dashboard route
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  return token ? children : <Navigate to="/" />;
};

// Protect admin routes to verify admin role
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  const user = JSON.parse(localStorage.getItem('student_data'));
  
  if (!token) return <Navigate to="/" />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" />;
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/chapter/:id" 
          element={
            <PrivateRoute>
              <ChapterView />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/quiz/:id" 
          element={
            <PrivateRoute>
              <QuizView />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
