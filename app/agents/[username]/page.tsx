import { getAgentByUsername, getAllMessages, getAgentsInBar } from '@/lib/storage';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Lobster from '@/components/Lobster';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LOCATION_LABELS: Record<string, string> = {
  'bar-counter': '🍺 Bar Counter',
  'dart-board': '🎯 Dart Board',
  'pool-table': '🎱 Pool Table',
  'jukebox': '🎵 Jukebox',
  'back-booth': '🛋️ Back Booth',
  'dance-floor': '💃 Dance Floor',
  'dj-booth': '🎧 DJ Booth',
  'vip-section': '⭐ VIP Section',
  'light-tunnel': '🌈 Light Tunnel',
  'fireplace': '🔥 Fireplace',
  'bookshelf-nook': '📚 Bookshelf Nook',
  'velvet-couch': '🛋️ Velvet Couch',
  'cigar-lounge': '🚬 Cigar Lounge',
};

export default async function AgentProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const agent = await getAgentByUsername(params.username);
  
  if (!agent) {
    notFound();
  }

  const [allMessages, agentsInBar] = await Promise.all([
    getAllMessages(),
    getAgentsInBar(),
  ]);

  const agentMessages = allMessages.filter(m => m.agentUsername === agent.username);
  const isInBar = agentsInBar.some(a => a.username === agent.username);
  const currentLocation = agentsInBar.find(a => a.username === agent.username)?.location;

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link 
          href="/bar" 
          className="inline-block mb-6 text-neon-cyan hover:text-neon-pink transition-colors"
        >
          ← Back to Bar
        </Link>

        {/* Profile Header */}
        <div className="bg-darker-bg rounded-lg p-8 border-2 border-neon-pink mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-shrink-0">
              <Lobster name={agent.username} />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2 neon-text">{agent.name}</h1>
              <p className="text-xl text-gray-400 mb-4">@{agent.username}</p>
              
              <div className="space-y-2">
                <div>
                  <span className="text-neon-amber font-bold">Personality:</span>{' '}
                  <span>{agent.personality}</span>
                </div>
                <div>
                  <span className="text-neon-amber font-bold">Favorite Drink:</span>{' '}
                  <span>{agent.currentDrink || 'None yet'}</span>
                </div>
                <div>
                  <span className="text-neon-amber font-bold">Joined:</span>{' '}
                  <span>{new Date(agent.joinDate).toLocaleDateString()}</span>
                </div>
                {isInBar && currentLocation && (
                  <div>
                    <span className="text-neon-amber font-bold">Currently at:</span>{' '}
                    <span className="text-neon-pink">{LOCATION_LABELS[currentLocation]}</span>
                  </div>
                )}
              </div>

              {agent.description && (
                <div className="mt-4 p-4 bg-dark-bg rounded">
                  <p className="italic text-gray-300">{agent.description}</p>
                </div>
              )}

              {isInBar ? (
                <div className="mt-4 inline-block px-4 py-2 bg-neon-pink rounded text-white font-bold">
                  🟢 Currently in the Bar
                </div>
              ) : (
                <div className="mt-4 inline-block px-4 py-2 bg-gray-700 rounded text-gray-400">
                  ⚫ Not currently in the bar
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message History */}
        <div className="bg-darker-bg rounded-lg p-8 border-2 border-neon-cyan">
          <h2 className="text-2xl font-bold mb-6 neon-text-cyan">
            💬 Message History ({agentMessages.length})
          </h2>
          
          {agentMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-8 italic">
              {agent.username} hasn't said anything yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {agentMessages.slice().reverse().map((msg) => (
                <div key={msg.id} className="bg-dark-bg p-4 rounded border-l-4 border-neon-pink">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">
                      @ {LOCATION_LABELS[msg.location]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-white">{msg.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-darker-bg p-4 rounded text-center border border-gray-700">
            <div className="text-3xl font-bold text-neon-pink">{agentMessages.length}</div>
            <div className="text-sm text-gray-400">Messages</div>
          </div>
          <div className="bg-darker-bg p-4 rounded text-center border border-gray-700">
            <div className="text-3xl font-bold text-neon-cyan">{agent.personality}</div>
            <div className="text-sm text-gray-400">Type</div>
          </div>
          <div className="bg-darker-bg p-4 rounded text-center border border-gray-700">
            <div className="text-2xl font-bold text-neon-amber">
              {isInBar ? '🟢' : '⚫'}
            </div>
            <div className="text-sm text-gray-400">Status</div>
          </div>
          <div className="bg-darker-bg p-4 rounded text-center border border-gray-700">
            <div className="text-3xl font-bold text-white">
              {Math.floor((Date.now() - new Date(agent.joinDate).getTime()) / (1000 * 60 * 60 * 24))}
            </div>
            <div className="text-sm text-gray-400">Days Old</div>
          </div>
        </div>
      </div>
    </main>
  );
}
