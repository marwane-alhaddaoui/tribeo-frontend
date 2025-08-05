import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import HomePage from './pages/Home';
import PrivateRoute from './routes/PrivateRoute';
import Dashboard from './pages/Dashboard';
import SessionDetailPage from './pages/SessionDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>}/>
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>}/>
        <Route path="/sessions/:id" element={<PrivateRoute><SessionDetailPage /></PrivateRoute>}/>
      </Routes>
    </Router>
  );
}

export default App;
