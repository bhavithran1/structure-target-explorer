import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import FighterGame from './games/FighterGame';
import RunnerGame from './games/RunnerGame';
import TowerGame from './games/TowerGame';
import TriviaDuel from './games/TriviaDuel';

const GAMES = [
  {
    id: 'fighter',
    title: 'Bio Fighter',
    icon: '🥊',
    desc: 'Street-fighter style brawl. Play as a DNA Warrior vs the Virus AI. Answer biology trivia to restore HP between rounds.',
    tag: '1P vs AI',
    color: '#ff4455',
    component: FighterGame,
  },
  {
    id: 'runner',
    title: 'Cell Runner',
    icon: '🦠',
    desc: 'Endless runner inside a blood vessel. You\'re a white blood cell — dodge bacteria, collect ATP, double-jump for survival.',
    tag: 'Endless',
    color: '#00d4ff',
    component: RunnerGame,
  },
  {
    id: 'tower',
    title: 'Cell Defense',
    icon: '🛡️',
    desc: 'Tower defense — place Antibodies, Enzymes, and T-Cells to stop waves of viruses from breaching the cell nucleus.',
    tag: 'Strategy',
    color: '#ffcc00',
    component: TowerGame,
  },
  {
    id: 'trivia',
    title: 'Trivia Duel',
    icon: '⚡',
    desc: 'Race against an AI opponent to answer biology questions. Time pressure, streaks, and first to 7 wins.',
    tag: '1v1 Race',
    color: '#00ff88',
    component: TriviaDuel,
  },
];

export default function GamesHub() {
  const [activeGame, setActiveGame] = useState(null);

  if (activeGame) {
    const game = GAMES.find(g => g.id === activeGame);
    const GameComponent = game.component;
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <button
          onClick={() => setActiveGame(null)}
          className="flex items-center gap-2 text-[#5a7a5a] hover:text-[#00ff88] text-sm mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to games
        </button>
        <div className="mb-4 flex items-center gap-3">
          <span className="text-2xl">{game.icon}</span>
          <h2 className="text-xl font-bold" style={{ color: game.color }}>{game.title}</h2>
          <span className="text-xs px-2 py-0.5 rounded border text-[#5a7a5a] border-[#1a2e1a]">{game.tag}</span>
        </div>
        <GameComponent />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-[#5a7a5a] text-xs tracking-widest uppercase mb-4">// biology games</div>
      <h1 className="text-3xl font-bold text-[#00ff88] mb-2">Games</h1>
      <p className="text-[#5a7a5a] text-sm mb-10">Learn biology through play. Four games, all biology-themed.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {GAMES.map(g => (
          <button
            key={g.id}
            onClick={() => setActiveGame(g.id)}
            className="border border-[#1a2e1a] rounded-lg p-6 text-left hover:border-[#2a4a2a] transition-all bg-[#0d120d] group"
            style={{ '--accent': g.color }}
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl">{g.icon}</span>
              <span className="text-xs px-2 py-0.5 rounded border border-[#1a2e1a] text-[#5a7a5a]">{g.tag}</span>
            </div>
            <h3 className="font-bold text-base mb-2 group-hover:text-[var(--accent)] transition-colors" style={{ color: g.color }}>
              {g.title}
            </h3>
            <p className="text-[#5a7a5a] text-sm leading-relaxed">{g.desc}</p>
            <div className="mt-4 text-xs font-bold transition-colors" style={{ color: g.color }}>
              Play →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
