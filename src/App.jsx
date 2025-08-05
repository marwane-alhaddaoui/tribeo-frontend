import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import HomePage from './pages/Home';
import Dashboard from './pages/Dashboard';
import SessionDetailPage from './pages/SessionDetail';
import CreateSessionPage from './pages/SessionCreate';
import PrivateRoute from './routes/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/sessions/create" element={<PrivateRoute><CreateSessionPage /></PrivateRoute>} />
        <Route path="/sessions/:id" element={<PrivateRoute><SessionDetailPage /></PrivateRoute>} />
        <Route path="/login" element={<LoginPage />} />         
        <Route path="/register" element={<RegisterPage />} />   
      </Route>
      </Routes>
    </Router>
  );
}

export default App;
