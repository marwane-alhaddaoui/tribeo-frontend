import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import PrivateRoute from './routes/PrivateRoute';

function HomePage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Bienvenue sur Tribeo</h1>
      <p>Vous êtes connecté avec succès 🎉</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Routes privées */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
