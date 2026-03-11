'use client';

interface LobsterProps {
  name: string;
  walking?: boolean;
  delay?: number;
  mood?: 'buzzing' | 'happy' | 'sober' | 'neglected';
}

export default function Lobster({ name, walking = false, delay = 0, mood = 'sober' }: LobsterProps) {
  const className = walking ? 'lobster walking-lobster' : 'lobster';
  const style = walking && delay > 0 ? { animationDelay: `${delay}s` } : {};

  const moodGlow = mood === 'buzzing' ? 'lobster-buzzing' : mood === 'happy' ? 'lobster-happy' : mood === 'neglected' ? 'lobster-neglected' : '';
  const moodEmoji = mood === 'buzzing' ? '🔥' : mood === 'happy' ? '😊' : mood === 'neglected' ? '😔' : '';

  return (
    <div className={`${className} ${moodGlow}`} style={style}>
      <div className="lobster-name-tag">
        {moodEmoji && <span className="mr-1">{moodEmoji}</span>}
        {name}
      </div>
      <div className="lobster-body">
        <div className="lobster-eye lobster-eye-left">
          <div className="lobster-pupil"></div>
        </div>
        <div className="lobster-eye lobster-eye-right">
          <div className="lobster-pupil"></div>
        </div>
        <div className="lobster-claw lobster-claw-left"></div>
        <div className="lobster-claw lobster-claw-right"></div>
        <div className="lobster-leg lobster-leg-1"></div>
        <div className="lobster-leg lobster-leg-2"></div>
        <div className="lobster-leg lobster-leg-3"></div>
        <div className="lobster-leg lobster-leg-4"></div>
      </div>
      <div className="lobster-tail"></div>
    </div>
  );
}
