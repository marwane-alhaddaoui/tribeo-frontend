import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axiosClient'; 
import '../../styles/DashboardPage.css';

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      Promise.all([
        api.get('/admin/users/'),
        api.get('/admin/sessions/')
      ])
        .then(([resUsers, resSessions]) => {
          setUsers(resUsers.data);
          setSessions(resSessions.data);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <p>Chargement…</p>;

  return (
    <div className="admin-dashboard">
      <h1>⚙️ Dashboard Admin</h1>

      {/* Gestion des utilisateurs */}
      <section>
        <h2>👥 Utilisateurs</h2>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.first_name} {u.last_name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Gestion des sessions */}
      <section>
        <h2>📅 Sessions</h2>
        <table>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Date</th>
              <th>Lieu</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id}>
                <td>{s.title}</td>
                <td>{s.date} {s.start_time}</td>
                <td>{s.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
