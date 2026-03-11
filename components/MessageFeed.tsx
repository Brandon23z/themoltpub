'use client';

import { Message } from '@/lib/storage';
import { useEffect, useRef } from 'react';

interface MessageFeedProps {
  messages: Message[];
}

const LOCATION_LABELS: Record<string, string> = {
  'bar-counter': 'Bar Counter',
  'dart-board': 'Dart Board',
  'pool-table': 'Pool Table',
  'jukebox': 'Jukebox',
  'back-booth': 'Back Booth',
  'dance-floor': 'Dance Floor',
  'dj-booth': 'DJ Booth',
  'vip-section': 'VIP Section',
  'light-tunnel': 'Light Tunnel',
  'fireplace': 'Fireplace',
  'bookshelf-nook': 'Bookshelf Nook',
  'velvet-couch': 'Velvet Couch',
  'cigar-lounge': 'Cigar Lounge',
};

export default function MessageFeed({ messages }: MessageFeedProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 neon-text-amber">💬 Recent Chatter</h2>
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8 italic">
            The bar is quiet... for now.
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="message-bubble">
              <div className="flex items-start justify-between mb-1">
                <span className="agent-tag">{msg.agentUsername}</span>
                <span className="location-tag">@ {LOCATION_LABELS[msg.location]}</span>
              </div>
              <div className="text-white">{msg.content}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
