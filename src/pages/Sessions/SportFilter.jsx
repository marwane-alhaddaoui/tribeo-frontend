const sports = ['Tous les sports', 'Football', 'Tennis', 'CrossFit', 'Running', 'Yoga'];

export default function SportFilter({ selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {sports.map((sport) => (
        <button
          key={sport}
          onClick={() => onSelect(sport === 'Tous les sports' ? '' : sport)}
          className={`px-4 py-2 rounded-full font-medium ${
            selected === sport || (sport === 'Tous les sports' && selected === '') 
              ? 'bg-[#ff2d2d] text-white' 
              : 'bg-[#1a1a1a] text-white border border-[#444]'
          }`}
        >
          {sport}
        </button>
      ))}
    </div>
  );
}
