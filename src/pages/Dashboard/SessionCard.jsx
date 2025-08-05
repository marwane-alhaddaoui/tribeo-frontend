import { Link } from 'react-router-dom';

export default function SessionCard({ session }) {
  return (
    <div className="p-4 border rounded shadow bg-white hover:shadow-md transition">
      <h3 className="text-lg font-bold">{session.name}</h3>
      <p className="text-sm text-gray-600">{session.sport}</p>
      <p className="text-sm text-gray-500">
        📍 {session.location} - 🗓️ {new Date(session.date).toLocaleString()}
      </p>
      <p className="text-sm mt-2">Participants : {session.participants_count}</p>

      <Link
        to={`/sessions/${session.id}`}
        className="inline-block mt-2 text-blue-600 hover:underline text-sm"
      >
        Voir détails →
      </Link>
    </div>
  );
}
