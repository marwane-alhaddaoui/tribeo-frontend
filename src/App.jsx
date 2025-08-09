import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import HomePage from "./pages/Home";
import Dashboard from "./pages/Dashboard/WrapperDashboard"; // Wrapper qui choisit User ou Coach
import SessionDetailPage from "./pages/SessionDetail";
import CreateSessionPage from "./pages/SessionCreate";
import PrivateRoute from "./routes/PrivateRoute";
import SessionsPage from "./pages/Sessions";
import ProfilePage from "./pages/Profile/ProfilePage";
import AdminRoute from "./routes/AdminRoute";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Toutes les pages partagent le Layout */}
        <Route element={<Layout />}>
          {/* Pages publiques */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Pages privées */}
          <Route
            path="/sessions"
            element={
              <PrivateRoute>
                <SessionsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/sessions/create"
            element={
              <PrivateRoute>
                <CreateSessionPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/sessions/:id"
            element={
              <PrivateRoute>
                <SessionDetailPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Dashboard admin */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
