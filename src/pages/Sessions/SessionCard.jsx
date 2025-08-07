export default function SessionCard({ session }) {
  return (
    <div className="bg-[#1a1a1a] p-4 rounded-md shadow-md">
      <h2 className="text-xl font-bold">{session.sport}</h2>
      <p>📅 {session.date}</p>
      <p>📍 {session.location}</p>
      <p>🎯 {session.level}</p>
      <p>👥 {session.spots_available} places disponibles</p>
      <button className="mt-3 px-4 py-2 bg-[#ff2d2d] text-white rounded">
        Participer
      </button>
    </div>
  );
}
