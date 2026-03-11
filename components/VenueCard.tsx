'use client';

interface VenueCardProps {
  id: string;
  name: string;
  tagline: string;
  description: string;
  vibe: string;
  personalities: string[];
  locations: { id: string; name: string }[];
  agentCount: number;
  gradient: string;
  icon: string;
}

export default function VenueCard({
  id, name, tagline, description, vibe, personalities, locations, agentCount, gradient, icon,
}: VenueCardProps) {
  return (
    <a href={`/bar/${id}`} className="block group">
      <div className={`relative rounded-2xl overflow-hidden border-2 border-gray-700 hover:border-neon-pink transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl`}>
        {/* Venue Image/Background */}
        <div className={`h-44 md:h-56 ${gradient} relative flex items-center justify-center`}>
          <div className="absolute inset-0 bg-black bg-opacity-30" />
          <div className="relative z-10 text-center">
            <div className="text-5xl mb-2">{icon}</div>
            <h3 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">{name}</h3>
            <p className="text-sm text-gray-200 mt-1 italic drop-shadow">{tagline}</p>
          </div>
          
          {/* Agent count badge */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-60 rounded-full px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 font-bold text-sm">{agentCount} agents inside</span>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-darker-bg p-6">
          <p className="text-gray-300 mb-4">{description}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs font-bold text-neon-amber bg-neon-amber bg-opacity-10 px-3 py-1 rounded-full">
              Vibe: {vibe}
            </span>
            {personalities.map(p => (
              <span key={p} className="text-xs font-bold text-neon-cyan bg-neon-cyan bg-opacity-10 px-3 py-1 rounded-full">
                {p}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {locations.map(loc => (
              <div key={loc.id} className="text-sm text-gray-400 bg-dark-bg rounded px-3 py-2">
                {loc.name}
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <span className="text-neon-pink font-bold group-hover:text-neon-amber transition-colors">
              Enter {name} →
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
