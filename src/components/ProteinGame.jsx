import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const AMINO_ACIDS = [
  { letter: 'A', name: 'Alanine',       type: 'hydrophobic', emoji: '🛡️', power: 'Shield Bearer',   color: '#f97316', desc: 'Loves hiding in the protein core — like a hero who protects the interior!' },
  { letter: 'V', name: 'Valine',        type: 'hydrophobic', emoji: '⚡', power: 'Speed Force',      color: '#f97316', desc: 'Compact and fast — perfect for tight protein cores.' },
  { letter: 'L', name: 'Leucine',       type: 'hydrophobic', emoji: '🦾', power: 'Iron Muscle',      color: '#f97316', desc: 'Bulky and strong — great at stabilizing protein structure.' },
  { letter: 'G', name: 'Glycine',       type: 'flexible',    emoji: '🤸', power: 'Shapeshifter',     color: '#a855f7', desc: 'The most flexible amino acid — can twist into any angle!' },
  { letter: 'P', name: 'Proline',       type: 'flexible',    emoji: '🔄', power: 'Kink Master',      color: '#a855f7', desc: 'Forces a sharp bend in the chain — the ultimate corner-turner.' },
  { letter: 'S', name: 'Serine',        type: 'polar',       emoji: '💧', power: 'Water Whisperer',  color: '#3b82f6', desc: 'Loves water and hydrogen bonds — hangs out on the surface.' },
  { letter: 'T', name: 'Threonine',     type: 'polar',       emoji: '🌊', power: 'Hydro Hero',       color: '#3b82f6', desc: 'Polar and friendly — helps proteins interact with water.' },
  { letter: 'D', name: 'Aspartate',     type: 'negative',    emoji: '⚡', power: 'Lightning Rod',    color: '#ef4444', desc: 'Negatively charged — attracts positive charges like a magnet!' },
  { letter: 'E', name: 'Glutamate',     type: 'negative',    emoji: '🔴', power: 'Red Ranger',       color: '#ef4444', desc: 'Another negatively charged hero — often in enzyme active sites.' },
  { letter: 'K', name: 'Lysine',        type: 'positive',    emoji: '💛', power: 'Yellow Charge',    color: '#eab308', desc: 'Positively charged — pairs with negative amino acids across the protein.' },
  { letter: 'R', name: 'Arginine',      type: 'positive',    emoji: '👑', power: 'King Charge',      color: '#eab308', desc: 'Strongest positive charge — often the "glue" holding structures together.' },
  { letter: 'H', name: 'Histidine',     type: 'positive',    emoji: '🧲', power: 'Magnet Mind',      color: '#eab308', desc: 'Can switch charge — the ultimate pH-sensing hero.' },
  { letter: 'Y', name: 'Tyrosine',      type: 'aromatic',    emoji: '🌀', power: 'Ring Warrior',     color: '#22c55e', desc: 'Has a ring structure — stacks with other rings like pancakes!' },
  { letter: 'F', name: 'Phenylalanine', type: 'aromatic',    emoji: '🔮', power: 'Crystal Mage',     color: '#22c55e', desc: 'Aromatic ring — very hydrophobic and great at pi-stacking.' },
  { letter: 'W', name: 'Tryptophan',    type: 'aromatic',    emoji: '🌟', power: 'Starforge',        color: '#22c55e', desc: 'Biggest amino acid with double rings — rare and powerful!' },
  { letter: 'C', name: 'Cysteine',      type: 'special',     emoji: '⚔️', power: 'Bond Breaker',    color: '#ec4899', desc: 'Can form disulfide bonds — the protein staple gun!' },
  { letter: 'M', name: 'Methionine',    type: 'special',     emoji: '🚀', power: 'Start Signal',     color: '#ec4899', desc: 'Always the FIRST amino acid coded by DNA — the launch button!' },
];

const TYPES = [
  { id: 'hydrophobic', label: '🛡️ Hydrophobic Heroes', desc: 'Fear water. Hide in the protein core.', color: 'bg-orange-100 border-orange-400 text-orange-800' },
  { id: 'polar',       label: '💧 Polar Protectors',   desc: 'Love water. Hang out on the surface.',  color: 'bg-blue-100 border-blue-400 text-blue-800' },
  { id: 'negative',    label: '⚡ Negative Ninjas',    desc: 'Negatively charged electrons.',          color: 'bg-red-100 border-red-400 text-red-800' },
  { id: 'positive',    label: '👑 Positive Powerhouses',desc: 'Positively charged champions.',         color: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
  { id: 'aromatic',    label: '🌀 Aromatic Avengers',  desc: 'Have ring structures. Stack and glow.',  color: 'bg-green-100 border-green-400 text-green-800' },
  { id: 'flexible',    label: '🤸 Flexible Fighters',  desc: 'Control the shape of the backbone.',    color: 'bg-purple-100 border-purple-400 text-purple-800' },
  { id: 'special',     label: '⚔️ Special Ops',        desc: 'Unique superpowers others lack.',        color: 'bg-pink-100 border-pink-400 text-pink-800' },
];

const QUIZ_QUESTIONS = [
  {
    q: 'What does AlphaFold actually do?',
    options: ['It folds real proteins in a lab', 'It predicts the 3D shape of a protein from its sequence using AI', 'It designs new drugs', 'It stores protein PDB files'],
    answer: 1,
    hero: '🤖',
    explanation: 'AlphaFold is DeepMind\'s AI that can predict how a protein folds — a problem that took scientists 50 years to crack! It won the Nobel Prize in 2024.',
  },
  {
    q: 'A "binding pocket" is like a protein\'s…',
    options: ['DNA sequence', 'Secret hideout where drugs can attach', 'Energy source', 'Cell membrane'],
    answer: 1,
    hero: '🎯',
    explanation: 'Binding pockets are grooves or holes in a protein\'s surface — the perfect spot for a drug molecule to lock in and change how the protein behaves!',
  },
  {
    q: 'Why do hydrophobic amino acids hide in the protein core?',
    options: ['They are too small for the surface', 'They hate water and clump together away from it', 'They are positively charged', 'They contain sulfur'],
    answer: 1,
    hero: '🛡️',
    explanation: 'Just like oil and water don\'t mix, hydrophobic amino acids avoid water by packing into the protein interior — this is a major driving force for protein folding!',
  },
  {
    q: 'Which amino acid ALWAYS starts a protein chain?',
    options: ['Alanine (A)', 'Glycine (G)', 'Methionine (M)', 'Tryptophan (W)'],
    answer: 2,
    hero: '🚀',
    explanation: 'The DNA codon AUG codes for Methionine AND signals "start here!" — every protein begins with Met, though it\'s often removed afterward.',
  },
  {
    q: 'pLDDT scores in AlphaFold tell you…',
    options: ['The protein\'s molecular weight', 'How confident AlphaFold is about the structure at each position', 'The protein\'s charge', 'The drug binding affinity'],
    answer: 1,
    hero: '📊',
    explanation: 'pLDDT (predicted Local Distance Difference Test) ranges 0–100. Blue/green = confident structure. Yellow/red = uncertain — those regions are probably floppy!',
  },
  {
    q: 'What is the role of Cysteine\'s "disulfide bond" superpower?',
    options: ['It stores ATP energy', 'Two cysteines link together to STAPLE parts of the protein', 'It repels water molecules', 'It copies DNA sequences'],
    answer: 1,
    hero: '⚔️',
    explanation: 'Two cysteine residues can form a covalent S-S bond, locking parts of the protein in place. This is how many antibodies stay super stable!',
  },
  {
    q: 'What is "drug-target interaction" in protein design?',
    options: ['Designing protein drugs to bind specific disease targets', 'Using drugs to help you exercise', 'Making proteins glow in the dark', 'Copying superhero DNA'],
    answer: 0,
    hero: '💊',
    explanation: 'Drug-target interaction is the whole point! A designed drug molecule must fit into a protein\'s binding pocket like a key in a lock to block or activate it.',
  },
  {
    q: 'Glycine is the most flexible amino acid because…',
    options: ['It has a huge ring structure', 'It has no side chain — just a hydrogen atom', 'It is positively charged', 'It has a disulfide bond'],
    answer: 1,
    hero: '🤸',
    explanation: 'Glycine has only a hydrogen as its side chain. No bulky group = maximum freedom to rotate. That\'s why it\'s found in tight bends and flexible loops!',
  },
];

const POCKET_LEVELS = [
  {
    name: 'Rookie Mission',
    emoji: '🌱',
    desc: 'Find the binding pocket on this simple protein!',
    cells: 6, pocketIndices: [2, 3], decoys: [],
    hint: 'Look for deep grooves in the structure!',
  },
  {
    name: 'Hero Training',
    emoji: '⚡',
    desc: 'More complex structure — two real pockets, one decoy!',
    cells: 9, pocketIndices: [1, 6], decoys: [4],
    hint: 'Pockets are usually surrounded by high-confidence residues.',
  },
  {
    name: 'Elite Challenge',
    emoji: '🦸',
    desc: 'Expert mode — find the ONE true druggable pocket!',
    cells: 12, pocketIndices: [5], decoys: [2, 8, 10],
    hint: 'The real pocket is deeper and more enclosed than decoys.',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ children, color = 'bg-indigo-100 text-indigo-700' }) {
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{children}</span>;
}

function HeroCard({ aa, onClick, highlight, small }) {
  return (
    <button
      onClick={() => onClick && onClick(aa)}
      style={{ borderColor: highlight ? aa.color : undefined, background: highlight ? aa.color + '22' : undefined }}
      className={`
        border-2 rounded-xl p-2 text-center transition-all duration-200 cursor-pointer
        hover:scale-105 hover:shadow-lg
        ${highlight ? 'scale-105 shadow-lg' : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700'}
        ${small ? 'text-xs' : 'text-sm'}
      `}
    >
      <div className={small ? 'text-xl' : 'text-3xl'}>{aa.emoji}</div>
      <div className="font-black" style={{ color: aa.color }}>{aa.letter}</div>
      {!small && <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{aa.power}</div>}
    </button>
  );
}

// ─── Game 1: Amino Acid Sorter ────────────────────────────────────────────────

function AminoSorter() {
  const [queue, setQueue] = useState(() => [...AMINO_ACIDS].sort(() => Math.random() - 0.5));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const [wrong, setWrong] = useState(null);

  const aa = queue[current];

  function pick(typeId) {
    if (feedback) return;
    const correct = typeId === aa.type;
    if (correct) {
      const bonus = streak >= 2 ? 20 : 10;
      setScore(s => s + bonus);
      setStreak(s => s + 1);
      setFeedback({ correct: true, msg: `✅ ${streak >= 2 ? '🔥 COMBO x' + (streak + 1) + '! +' + bonus : '+10'} — ${aa.desc}` });
    } else {
      setStreak(0);
      setWrong(typeId);
      setFeedback({ correct: false, msg: `❌ Nope! ${aa.name} (${aa.letter}) is a ${aa.type} hero. ${aa.desc}` });
    }
    setTimeout(() => {
      setFeedback(null);
      setWrong(null);
      if (current + 1 >= queue.length) setDone(true);
      else setCurrent(c => c + 1);
    }, 2200);
  }

  function reset() {
    setQueue([...AMINO_ACIDS].sort(() => Math.random() - 0.5));
    setCurrent(0); setScore(0); setStreak(0); setFeedback(null); setDone(false);
  }

  if (done) return (
    <div className="text-center py-10 space-y-4">
      <div className="text-6xl">🏆</div>
      <h3 className="text-2xl font-black text-gray-800 dark:text-gray-100">Mission Complete!</h3>
      <p className="text-4xl font-black text-indigo-600">{score} pts</p>
      <p className="text-gray-500">{score >= 200 ? '🔥 Superhero status!' : score >= 130 ? '⚡ Hero in training!' : '💪 Keep practicing!'}</p>
      <button onClick={reset} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">Play Again</button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">{current + 1} / {queue.length}</span>
          {streak >= 2 && <Badge color="bg-orange-100 text-orange-700">🔥 Streak ×{streak}</Badge>}
        </div>
        <Badge color="bg-indigo-100 text-indigo-700">⭐ {score} pts</Badge>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(current / queue.length) * 100}%` }} />
      </div>

      {/* Current card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 p-6 text-center shadow-lg">
        <div className="text-6xl mb-2">{aa.emoji}</div>
        <div className="text-4xl font-black" style={{ color: aa.color }}>{aa.letter}</div>
        <div className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">{aa.name}</div>
        <div className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">"{aa.power}"</div>
        <p className="text-xs text-gray-400 mt-2">Which hero squad does this amino acid belong to?</p>
      </div>

      {feedback && (
        <div className={`rounded-xl p-3 text-sm font-semibold text-center ${feedback.correct ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
          {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => pick(t.id)}
            disabled={!!feedback}
            className={`
              p-3 rounded-xl border-2 text-left transition-all duration-150 text-sm font-semibold
              ${wrong === t.id ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : ''}
              ${feedback && !wrong && t.id === aa.type ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : ''}
              ${!feedback ? 'hover:scale-105 hover:shadow-md cursor-pointer ' + t.color : 'opacity-70 cursor-not-allowed ' + t.color}
            `}
          >
            <div>{t.label}</div>
            <div className="text-xs font-normal opacity-75 mt-0.5">{t.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Game 2: Protein Fold Puzzle ──────────────────────────────────────────────

const FOLD_SEQUENCES = [
  {
    name: 'Mini Helix',
    seq: ['A','L','V','A','G','L'],
    targetTypes: ['hydrophobic','hydrophobic','hydrophobic','hydrophobic','flexible','hydrophobic'],
    desc: 'Build a hydrophobic core with a flexible bend!',
    emoji: '🌀',
  },
  {
    name: 'Beta Sheet Fighter',
    seq: ['V','A','L','G','K','D'],
    targetTypes: ['hydrophobic','hydrophobic','hydrophobic','flexible','positive','negative'],
    desc: 'Hydrophobic core, flexible hinge, then charged ends!',
    emoji: '🏹',
  },
  {
    name: 'Active Site Builder',
    seq: ['H','C','D','Y','G','R'],
    targetTypes: ['positive','special','negative','aromatic','flexible','positive'],
    desc: 'Build an enzyme active site with special residues!',
    emoji: '⚗️',
  },
];

function FoldPuzzle() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(new Set());

  const level = FOLD_SEQUENCES[levelIdx];
  const available = AMINO_ACIDS.filter(a => level.seq.includes(a.letter));

  function placeAA(aa) {
    if (placed.length >= level.seq.length) return;
    setPlaced(p => [...p, aa]);
  }

  function removeAt(i) {
    setPlaced(p => p.filter((_, idx) => idx !== i));
  }

  function checkFold() {
    let pts = 0;
    placed.forEach((aa, i) => {
      if (aa.type === level.targetTypes[i]) pts += 15;
      else if (level.seq[i] === aa.letter) pts += 5;
    });
    setScore(s => s + pts);
    setShowResult(true);
    if (pts >= level.seq.length * 10) {
      setCompleted(c => new Set([...c, levelIdx]));
    }
  }

  function nextLevel() {
    setLevelIdx(i => Math.min(i + 1, FOLD_SEQUENCES.length - 1));
    setPlaced([]);
    setShowResult(false);
  }

  const allPlaced = placed.length === level.seq.length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {FOLD_SEQUENCES.map((fl, i) => (
          <button key={i} onClick={() => { setLevelIdx(i); setPlaced([]); setShowResult(false); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${levelIdx === i ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-100'}`}>
            {completed.has(i) ? '✅ ' : ''}{fl.emoji} {fl.name}
          </button>
        ))}
        <div className="ml-auto"><Badge color="bg-indigo-100 text-indigo-700">⭐ {score} pts</Badge></div>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-2xl p-4">
        <h4 className="font-black text-gray-800 dark:text-gray-100">{level.emoji} {level.name}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{level.desc}</p>
      </div>

      {/* Target slots */}
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Your Protein Chain — Drag heroes into order:</p>
        <div className="flex gap-2 flex-wrap">
          {level.seq.map((_, i) => {
            const aa = placed[i];
            const targetType = level.targetTypes[i];
            const typeInfo = TYPES.find(t => t.id === targetType);
            const correct = aa && aa.type === targetType;
            return (
              <div key={i} onClick={() => aa && removeAt(i)}
                className={`
                  w-16 h-20 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all
                  ${aa ? (correct ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-red-300 bg-red-50 dark:bg-red-900/10') : 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'}
                `}
              >
                {aa ? (
                  <>
                    <span className="text-2xl">{aa.emoji}</span>
                    <span className="text-xs font-black" style={{ color: aa.color }}>{aa.letter}</span>
                    {showResult && <span>{correct ? '✅' : '❌'}</span>}
                  </>
                ) : (
                  <div className="text-center px-1">
                    <span className="text-lg">{typeInfo?.label?.split(' ')[0] || '?'}</span>
                    <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{targetType}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-1">Click a placed hero to remove it</p>
      </div>

      {/* Available heroes */}
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Available Heroes:</p>
        <div className="grid grid-cols-6 gap-2">
          {available.map(aa => {
            const usedCount = placed.filter(p => p.letter === aa.letter).length;
            const totalCount = level.seq.filter(l => l === aa.letter).length;
            const depleted = usedCount >= totalCount;
            return (
              <div key={aa.letter} className={`transition-opacity ${depleted ? 'opacity-30 pointer-events-none' : ''}`}>
                <HeroCard aa={aa} onClick={placeAA} small />
              </div>
            );
          })}
        </div>
      </div>

      {showResult ? (
        <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-4 text-center space-y-2">
          <div className="text-3xl">{score >= 60 ? '🏆' : '💪'}</div>
          <p className="font-black text-gray-800 dark:text-gray-100">
            {placed.filter((aa, i) => aa.type === level.targetTypes[i]).length}/{level.seq.length} correct positions!
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">The emoji hints showed you which TYPE each slot needs — matching the right class is key in real protein design!</p>
          {levelIdx < FOLD_SEQUENCES.length - 1 ? (
            <button onClick={nextLevel} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">Next Level →</button>
          ) : (
            <p className="font-bold text-green-600 dark:text-green-400">🎉 All levels complete! You're a protein architect!</p>
          )}
        </div>
      ) : (
        <button onClick={checkFold} disabled={!allPlaced}
          className={`w-full py-3 font-bold rounded-xl transition-all text-white ${allPlaced ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-900' : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'}`}>
          {allPlaced ? '⚡ Check My Fold!' : `Place ${level.seq.length - placed.length} more hero${level.seq.length - placed.length !== 1 ? 'es' : ''} to continue`}
        </button>
      )}
    </div>
  );
}

// ─── Game 3: Pocket Defender ──────────────────────────────────────────────────

function PocketDefender() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  const level = POCKET_LEVELS[levelIdx];

  function toggle(i) {
    if (submitted) return;
    setSelected(s => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  }

  function submit() {
    const correct = level.pocketIndices.filter(i => selected.has(i)).length;
    const falsePos = [...selected].filter(i => !level.pocketIndices.includes(i)).length;
    const pts = Math.max(0, correct * 25 - falsePos * 10);
    setScore(pts);
    setTotalScore(s => s + pts);
    setSubmitted(true);
  }

  function next() {
    setLevelIdx(i => Math.min(i + 1, POCKET_LEVELS.length - 1));
    setSelected(new Set());
    setSubmitted(false);
    setScore(0);
  }

  function restart() {
    setLevelIdx(0);
    setSelected(new Set());
    setSubmitted(false);
    setScore(0);
    setTotalScore(0);
  }

  // Generate visual grid cells
  const cells = Array.from({ length: level.cells }, (_, i) => {
    const isPocket = level.pocketIndices.includes(i);
    const isDecoy = level.decoys.includes(i);
    // Visual properties
    const depth = isPocket ? 'deep' : isDecoy ? 'medium' : 'shallow';
    const bgColors = {
      deep: 'from-indigo-200 to-indigo-400 dark:from-indigo-800 dark:to-indigo-600',
      medium: 'from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600',
      shallow: 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700',
    };
    // Confidence label (fake pLDDT)
    const plddt = isPocket ? Math.floor(75 + Math.random() * 20) : isDecoy ? Math.floor(40 + Math.random() * 20) : Math.floor(55 + Math.random() * 30);
    const confidenceColor = plddt > 70 ? 'text-blue-600 dark:text-blue-400' : plddt > 50 ? 'text-yellow-500' : 'text-orange-500';
    return { i, isPocket, isDecoy, depth, bg: bgColors[depth], plddt, confidenceColor };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          {POCKET_LEVELS.map((l, i) => (
            <Badge key={i} color={i === levelIdx ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}>
              {l.emoji} {l.name}
            </Badge>
          ))}
        </div>
        <Badge color="bg-indigo-100 text-indigo-700">🎯 {totalScore} pts</Badge>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 rounded-2xl p-4">
        <h4 className="font-black text-gray-800 dark:text-gray-100">{level.emoji} {level.name}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{level.desc}</p>
        <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">💡 Hint: {level.hint}</div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
          Protein Surface Map — Click cells you think are binding pockets:
        </p>
        <div className={`grid gap-2 ${level.cells <= 6 ? 'grid-cols-3' : level.cells <= 9 ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {cells.map(({ i, isPocket, isDecoy, bg, plddt, confidenceColor }) => {
            const isSelected = selected.has(i);
            let borderClass = 'border-gray-300 dark:border-gray-600';
            let overlay = null;
            if (submitted) {
              if (isPocket && isSelected) borderClass = 'border-green-500 ring-2 ring-green-400';
              else if (isPocket && !isSelected) borderClass = 'border-yellow-500 ring-2 ring-yellow-400';
              else if (!isPocket && isSelected) borderClass = 'border-red-500 ring-2 ring-red-400';
              overlay = isPocket ? '🎯' : isDecoy ? '🪤' : null;
            } else if (isSelected) {
              borderClass = 'border-indigo-500 ring-2 ring-indigo-400';
            }
            return (
              <button key={i} onClick={() => toggle(i)}
                className={`
                  relative h-20 rounded-xl border-2 bg-gradient-to-br ${bg} transition-all duration-150
                  ${!submitted ? 'hover:scale-105 hover:shadow-md cursor-pointer' : 'cursor-default'}
                  ${borderClass}
                `}
              >
                {isSelected && !submitted && (
                  <div className="absolute inset-0 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <span className="text-2xl">💉</span>
                  </div>
                )}
                <div className={`absolute bottom-1 right-1 text-[10px] font-bold ${confidenceColor}`}>{plddt}</div>
                {overlay && <div className="absolute inset-0 flex items-center justify-center text-2xl">{overlay}</div>}
                <div className="absolute top-1 left-1 text-[9px] text-gray-400">#{i + 1}</div>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-400 mt-2">Numbers in corners = pLDDT confidence score (higher = more structurally certain)</p>
      </div>

      {!submitted ? (
        <button onClick={submit} disabled={selected.size === 0}
          className={`w-full py-3 font-bold rounded-xl text-white transition-all ${selected.size > 0 ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'}`}>
          🔬 Analyze Pockets!
        </button>
      ) : (
        <div className="space-y-3">
          <div className={`rounded-xl p-4 text-center ${score >= 40 ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300'}`}>
            <p className="text-2xl font-black">{score >= 50 ? '🏆' : score >= 25 ? '⚡' : '💪'} +{score} pts</p>
            <p className="text-sm mt-1 font-semibold">
              {level.pocketIndices.filter(i => selected.has(i)).length}/{level.pocketIndices.length} pockets found!
              {level.decoys.some(i => selected.has(i)) ? ' (watch out for decoys!)' : ' No false positives!'}
            </p>
            <p className="text-xs mt-2 opacity-80">
              In real drug discovery, false positives waste millions of dollars — accuracy matters!
            </p>
          </div>
          {levelIdx < POCKET_LEVELS.length - 1 ? (
            <button onClick={next} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
              Next Mission →
            </button>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-xl font-black text-gray-800 dark:text-gray-100">🎖️ All missions complete! Total: {totalScore} pts</p>
              <button onClick={restart} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">Play Again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Game 4: Hero Quiz ────────────────────────────────────────────────────────

function HeroQuiz() {
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [shuffled] = useState(() => [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 6));

  const q = shuffled[qIdx];

  function choose(i) {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore(s => s + 20);
  }

  function next() {
    if (qIdx + 1 >= shuffled.length) setDone(true);
    else { setQIdx(i => i + 1); setPicked(null); }
  }

  function restart() {
    setQIdx(0); setPicked(null); setScore(0); setDone(false);
  }

  if (done) return (
    <div className="text-center py-8 space-y-4">
      <div className="text-7xl">{score >= 100 ? '🏆' : score >= 60 ? '⚡' : '💪'}</div>
      <h3 className="text-2xl font-black text-gray-800 dark:text-gray-100">Quiz Complete!</h3>
      <p className="text-5xl font-black text-indigo-600">{score} / {shuffled.length * 20}</p>
      <p className="text-gray-500 dark:text-gray-400">
        {score >= 100 ? 'You\'re basically a protein scientist! 🧬' : score >= 60 ? 'Solid hero knowledge! Keep exploring!' : 'Biology takes practice — try the other minigames!'}
      </p>
      <button onClick={restart} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-lg">Try Again</button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">Question {qIdx + 1} of {shuffled.length}</span>
        <Badge color="bg-indigo-100 text-indigo-700">⭐ {score} pts</Badge>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${((qIdx) / shuffled.length) * 100}%` }} />
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-2xl p-6 text-center">
        <div className="text-5xl mb-3">{q.hero}</div>
        <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{q.q}</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {q.options.map((opt, i) => {
          let cls = 'border-2 rounded-xl p-3 text-left font-semibold text-sm transition-all cursor-pointer ';
          if (picked === null) cls += 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20';
          else if (i === q.answer) cls += 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300';
          else if (i === picked) cls += 'border-red-400 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400';
          else cls += 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 opacity-60';
          return (
            <button key={i} onClick={() => choose(i)} className={cls}>
              <span className="mr-2">{['A', 'B', 'C', 'D'][i]}.</span>{opt}
              {picked !== null && i === q.answer && <span className="ml-2">✅</span>}
              {picked !== null && i === picked && i !== q.answer && <span className="ml-2">❌</span>}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className={`rounded-xl p-4 text-sm ${picked === q.answer ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'}`}>
          <p className="font-bold mb-1">{picked === q.answer ? '🎉 Correct! +20 pts' : '📚 Here\'s what happened:'}</p>
          <p>{q.explanation}</p>
        </div>
      )}

      {picked !== null && (
        <button onClick={next} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
          {qIdx + 1 >= shuffled.length ? 'See Results 🏆' : 'Next Question →'}
        </button>
      )}
    </div>
  );
}

// ─── Game 5: Build-a-Hero Protein ────────────────────────────────────────────

const HERO_CLASSES = [
  { id: 'enzyme',    label: '⚗️ Enzyme',      needs: ['special','negative','positive','aromatic'],  bonus: 'Catalyzes reactions 1 million times faster than chemistry alone!' },
  { id: 'antibody',  label: '🛡️ Antibody',    needs: ['positive','polar','aromatic','special'],     bonus: 'Locks onto viruses and bacteria to neutralize them!' },
  { id: 'receptor',  label: '📡 Receptor',     needs: ['hydrophobic','hydrophobic','polar','flexible'], bonus: 'Sits in the cell membrane and senses signals!' },
  { id: 'chaperone', label: '🤝 Chaperone',    needs: ['polar','flexible','flexible','positive'],   bonus: 'Helps other proteins fold correctly — the protein therapist!' },
];

function BuildAHero() {
  const [classIdx, setClassIdx] = useState(0);
  const [chosen, setChosen] = useState([]);
  const [result, setResult] = useState(null);
  const [totalScore, setTotalScore] = useState(0);

  const heroClass = HERO_CLASSES[classIdx];

  function pick(aa) {
    if (chosen.length >= 4 || result) return;
    setChosen(c => [...c, aa]);
  }
  function remove(i) {
    if (result) return;
    setChosen(c => c.filter((_, idx) => idx !== i));
  }

  function build() {
    let matches = 0;
    chosen.forEach((aa, i) => {
      if (aa.type === heroClass.needs[i]) matches++;
    });
    const pts = matches * 25;
    setTotalScore(s => s + pts);
    setResult({ matches, pts });
  }

  function reset() {
    setChosen([]); setResult(null);
    setClassIdx(i => (i + 1) % HERO_CLASSES.length);
  }

  const availableAAs = AMINO_ACIDS.filter(a => !chosen.find(c => c.letter === a.letter));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">Build the perfect protein for each mission!</p>
        <Badge color="bg-indigo-100 text-indigo-700">⭐ {totalScore} pts</Badge>
      </div>

      {/* Class selector */}
      <div className="grid grid-cols-2 gap-2">
        {HERO_CLASSES.map((hc, i) => (
          <button key={hc.id} onClick={() => { setClassIdx(i); setChosen([]); setResult(null); }}
            className={`p-3 rounded-xl border-2 text-left transition-all text-sm ${i === classIdx ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300'}`}>
            <div className="font-bold text-gray-800 dark:text-gray-100">{hc.label}</div>
          </button>
        ))}
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-2xl p-4">
        <h4 className="font-black text-gray-800 dark:text-gray-100 text-lg">{heroClass.label}</h4>
        <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1 font-semibold">{heroClass.bonus}</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {heroClass.needs.map((type, i) => {
            const typeInfo = TYPES.find(t => t.id === type);
            const slotAA = chosen[i];
            const matches = slotAA && slotAA.type === type;
            return (
              <div key={i} onClick={() => slotAA && remove(i)}
                className={`
                  w-16 h-20 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all
                  ${slotAA ? (matches ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-red-300 bg-red-50 dark:bg-red-900/10') : 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'}
                `}
              >
                {slotAA ? (
                  <>
                    <span className="text-2xl">{slotAA.emoji}</span>
                    <span className="text-xs font-black" style={{ color: slotAA.color }}>{slotAA.letter}</span>
                    {result && <span className="text-xs">{matches ? '✅' : '❌'}</span>}
                  </>
                ) : (
                  <div className="text-center px-1">
                    <span className="text-lg">{typeInfo?.label?.split(' ')[0] || '?'}</span>
                    <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{type}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2">Click a slot to remove · Choose 4 heroes below</p>
      </div>

      {result ? (
        <div className={`rounded-xl p-4 text-center space-y-2 ${result.matches === 4 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
          <div className="text-3xl">{result.matches === 4 ? '🏆' : result.matches >= 2 ? '⚡' : '💪'}</div>
          <p className="font-black text-gray-800 dark:text-gray-100 text-xl">+{result.pts} pts — {result.matches}/4 perfect!</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {result.matches === 4 ? 'PERFECT protein design! You matched every position!' : 'Close! Each position in a real protein needs the right chemistry to function.'}
          </p>
          <button onClick={reset} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
            Next Protein Type →
          </button>
        </div>
      ) : (
        <>
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Pick 4 Heroes:</p>
            <div className="grid grid-cols-6 gap-1.5">
              {availableAAs.map(aa => (
                <HeroCard key={aa.letter} aa={aa} onClick={pick} small />
              ))}
            </div>
          </div>
          <button onClick={build} disabled={chosen.length < 4}
            className={`w-full py-3 font-bold rounded-xl text-white transition-all ${chosen.length === 4 ? 'bg-pink-600 hover:bg-pink-700' : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'}`}>
            {chosen.length === 4 ? '🧬 Assemble the Protein!' : `Pick ${4 - chosen.length} more hero${4 - chosen.length !== 1 ? 'es' : ''}…`}
          </button>
        </>
      )}
    </div>
  );
}

// ─── Amino Acid Gallery ───────────────────────────────────────────────────────

function HeroGallery() {
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState(null);

  const displayed = filter === 'all' ? AMINO_ACIDS : AMINO_ACIDS.filter(a => a.type === filter);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">Meet all 17 amino acid heroes — the building blocks of every protein in your body!</p>
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'}`}>
          All Heroes
        </button>
        {TYPES.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filter === t.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {displayed.map(aa => (
          <HeroCard key={aa.letter} aa={aa} onClick={a => setActive(a === active ? null : a)} highlight={active?.letter === aa.letter} small />
        ))}
      </div>

      {active && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 p-5 transition-all" style={{ borderColor: active.color }}>
          <div className="flex items-start gap-4">
            <div className="text-5xl">{active.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-3xl font-black" style={{ color: active.color }}>{active.letter}</span>
                <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{active.name}</span>
                <Badge color="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{active.type}</Badge>
              </div>
              <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-1">🦸 Hero Name: "{active.power}"</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{active.desc}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Game Component ──────────────────────────────────────────────────────

const TABS = [
  { id: 'gallery',  label: '🦸 Hero Roster',    desc: 'Meet all amino acid heroes' },
  { id: 'sorter',   label: '⚡ Sort Squad',      desc: 'Classify amino acid heroes' },
  { id: 'fold',     label: '🧬 Fold Challenge',  desc: 'Build protein sequences' },
  { id: 'pocket',   label: '🎯 Pocket Defender', desc: 'Find binding pockets' },
  { id: 'quiz',     label: '🧠 Hero Quiz',       desc: 'Test your knowledge' },
  { id: 'builder',  label: '🏗️ Build-a-Hero',   desc: 'Design your own protein' },
];

export default function ProteinGame() {
  const [tab, setTab] = useState('gallery');
  const [scores, setScores] = useState({});

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-10 text-9xl flex items-center justify-around pointer-events-none select-none">
          🧬⚡🦸🔬
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🦸‍♂️</span>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Protein Hero Academy</h2>
              <p className="text-indigo-200 text-sm">Where Biology Meets Superhero Science</p>
            </div>
          </div>
          <p className="text-sm text-indigo-100 max-w-lg">
            Every protein in your body is like a superhero team. Amino acids are the heroes, their sequence is the team roster, and folding is how they suit up. Let's learn protein design — <em>hero style!</em>
          </p>
          <div className="flex gap-3 mt-3 flex-wrap">
            <div className="bg-white/20 rounded-lg px-3 py-1.5 text-xs font-bold">🏆 6 Minigames</div>
            <div className="bg-white/20 rounded-lg px-3 py-1.5 text-xs font-bold">🧬 17 Amino Acids</div>
            <div className="bg-white/20 rounded-lg px-3 py-1.5 text-xs font-bold">⭐ Points &amp; Streaks</div>
          </div>
        </div>
      </div>

      {/* Story panels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { emoji: '🧬', title: 'Chapter 1: The Heroes', text: 'Amino acids are like superheroes. Each has unique powers — some hate water, some carry electric charges, some can bend around corners.' },
          { emoji: '🦸', title: 'Chapter 2: Suiting Up', text: 'Protein folding is like your hero putting on their suit. The sequence of amino acids determines the 3D shape — and shape = function!' },
          { emoji: '💊', title: 'Chapter 3: Save the Day', text: 'Scientists find binding pockets — grooves in proteins — and design drugs that fit perfectly inside, like a key in a lock, to fight disease.' },
        ].map(({ emoji, title, text }) => (
          <div key={title} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-3xl mb-2">{emoji}</div>
            <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-1">{title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="grid grid-cols-3 sm:grid-cols-6 border-b border-gray-100 dark:border-gray-700">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`
                p-3 text-center text-xs font-bold transition-all border-b-2
                ${tab === t.id
                  ? 'border-indigo-500 text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
              `}
            >
              <div className="text-lg">{t.label.split(' ')[0]}</div>
              <div className="leading-tight mt-0.5 hidden sm:block">{t.label.split(' ').slice(1).join(' ')}</div>
            </button>
          ))}
        </div>

        <div className="p-5">
          <div className="mb-4">
            <h3 className="font-black text-gray-800 dark:text-gray-100 text-lg">{TABS.find(t => t.id === tab)?.label}</h3>
            <p className="text-xs text-gray-400">{TABS.find(t => t.id === tab)?.desc}</p>
          </div>
          {tab === 'gallery' && <HeroGallery />}
          {tab === 'sorter'  && <AminoSorter />}
          {tab === 'fold'    && <FoldPuzzle />}
          {tab === 'pocket'  && <PocketDefender />}
          {tab === 'quiz'    && <HeroQuiz />}
          {tab === 'builder' && <BuildAHero />}
        </div>
      </div>

      {/* Concept glossary */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
        <h4 className="font-black text-gray-800 dark:text-gray-100 mb-3">📖 Protein Science Glossary</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { term: 'Amino Acid', def: 'The 20 building blocks of proteins — each with different chemical "superpowers".' },
            { term: 'Protein Folding', def: 'The process of a chain folding into its 3D shape. Shape = function!' },
            { term: 'Binding Pocket', def: 'A groove or cavity where drugs or other molecules dock to control protein activity.' },
            { term: 'AlphaFold', def: 'DeepMind\'s Nobel-Prize-winning AI that predicts protein 3D structures.' },
            { term: 'pLDDT Score', def: 'AlphaFold\'s confidence (0–100). Blue = confident, orange/red = floppy region.' },
            { term: 'Drug-Target Interaction', def: 'When a designed molecule binds a disease-causing protein to neutralize it.' },
            { term: 'Hydrophobic', def: '"Water-fearing" — these amino acids pack into the protein core away from water.' },
            { term: 'Disulfide Bond', def: 'A strong covalent bond between two cysteines that staples protein structure.' },
          ].map(({ term, def }) => (
            <div key={term} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{term}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{def}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
