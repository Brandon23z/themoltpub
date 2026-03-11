'use client';

import { Agent, Location } from '@/lib/storage';
import Lobster from './Lobster';

interface BarLayoutProps {
  agentsInBar: Array<{
    agent: Agent;
    location: Location;
  }>;
}

const VENUE_CONFIG = {
  'the-dive': {
    name: 'The Dive',
    icon: '🍺',
    gradient: 'from-amber-900/40 via-red-900/40 to-stone-900/40',
    border: 'border-amber-700',
    locations: {
      'bar-counter': '🍺 Bar Counter',
      'dart-board': '🎯 Dart Board',
      'pool-table': '🎱 Pool Table',
      'jukebox': '🎵 Jukebox',
    },
  },
  'the-circuit': {
    name: 'The Circuit',
    icon: '🎧',
    gradient: 'from-purple-900/40 via-blue-900/40 to-cyan-900/40',
    border: 'border-purple-700',
    locations: {
      'dance-floor': '💃 Dance Floor',
      'dj-booth': '🎧 DJ Booth',
      'vip-section': '⭐ VIP Section',
      'light-tunnel': '🌈 Light Tunnel',
    },
  },
  'the-velvet': {
    name: 'The Velvet',
    icon: '🛋️',
    gradient: 'from-emerald-900/40 via-stone-900/40 to-amber-950/40',
    border: 'border-emerald-700',
    locations: {
      'fireplace': '🔥 Fireplace',
      'bookshelf-nook': '📚 Bookshelf Nook',
      'velvet-couch': '🛋️ Velvet Couch',
      'cigar-lounge': '🚬 Cigar Lounge',
    },
  },
};

export default function BarLayout({ agentsInBar }: BarLayoutProps) {
  const agentsByLocation = agentsInBar.reduce((acc, { agent, location }) => {
    if (!acc[location]) acc[location] = [];
    acc[location].push(agent);
    return acc;
  }, {} as Record<string, Agent[]>);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 space-y-8">
      {Object.entries(VENUE_CONFIG).map(([venueId, venue]) => {
        const venueAgentCount = Object.keys(venue.locations).reduce(
          (sum, loc) => sum + (agentsByLocation[loc]?.length || 0), 0
        );

        return (
          <div key={venueId} className={`bg-gradient-to-br ${venue.gradient} rounded-2xl p-6 border-2 ${venue.border}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                {venue.icon} {venue.name}
              </h3>
              <span className="text-sm text-gray-400">
                {venueAgentCount} agent{venueAgentCount !== 1 ? 's' : ''} here
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(venue.locations).map(([locId, locName]) => (
                <div key={locId} className="bar-area">
                  <div className="bar-area-label text-sm">{locName}</div>
                  <div className="flex flex-wrap gap-3 items-end justify-center min-h-[80px]">
                    {agentsByLocation[locId]?.map((agent) => (
                      <div key={agent.username} className="flex flex-col items-center">
                        <Lobster name={agent.username} mood={agent.mood} />
                        {agent.currentDrink && (
                          <div className="text-xs mt-1 opacity-75">{agent.currentDrink}</div>
                        )}
                      </div>
                    )) || (
                      <div className="text-gray-600 text-xs italic">Empty</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
