import { useEffect, useState } from 'react';
import { getAllUsers, getAllSessions } from '../../api/adminService';
import '../../styles/AdminDashboard.css';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, sessionsData] = await Promise.all([
          getAllUsers(),
          getAllSessions()
        ]);
        setUsers(usersData);
        setSessions(sessionsData);
      } catch (error) {
        console.error('Erreur chargement admin data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="admin-dashboard">
      <h1>📊 Dashboard Admin</h1>

      <section>
        <h2>👤 Tous les utilisateurs</h2>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Prénom</th>
              <th>Nom</th>
              <th>Rôle</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.first_name}</td>
                <td>{u.last_name}</td>
                <td>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>📅 Toutes les sessions</h2>
        <table>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Sport</th>
              <th>Date</th>
              <th>Lieu</th>
              <th>Créateur</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id}>
                <td>{s.title}</td>
                <td>{s.sport}</td>
                <td>{s.date}</td>
                <td>{s.location}</td>
                <td>{s.creator}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
