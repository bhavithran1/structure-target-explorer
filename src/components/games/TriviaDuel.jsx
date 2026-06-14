import { useState, useEffect, useRef } from 'react';

const QUESTIONS = [
  { q: 'What is the powerhouse of the cell?', a: 'Mitochondria', choices: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body'] },
  { q: 'Which molecule carries genetic information?', a: 'DNA', choices: ['RNA', 'ATP', 'DNA', 'Protein'] },
  { q: 'What carries oxygen in red blood cells?', a: 'Hemoglobin', choices: ['Insulin', 'Collagen', 'Hemoglobin', 'Keratin'] },
  { q: 'Where does photosynthesis occur in plant cells?', a: 'Chloroplast', choices: ['Mitochondria', 'Chloroplast', 'Nucleus', 'Vacuole'] },
  { q: 'Which base pairs with Adenine in DNA?', a: 'Thymine', choices: ['Guanine', 'Cytosine', 'Thymine', 'Uracil'] },
  { q: 'What type of bond holds DNA strands together?', a: 'Hydrogen bond', choices: ['Ionic bond', 'Covalent bond', 'Hydrogen bond', 'Peptide bond'] },
  { q: 'Which organelle packages and ships proteins?', a: 'Golgi body', choices: ['Lysosome', 'Golgi body', 'Vacuole', 'Endoplasmic reticulum'] },
  { q: 'What process converts glucose to energy?', a: 'Cellular respiration', choices: ['Photosynthesis', 'Fermentation', 'Cellular respiration', 'Glycolysis'] },
  { q: 'What is mRNA made from during transcription?', a: 'DNA template', choices: ['Ribosome', 'DNA template', 'tRNA', 'Amino acids'] },
  { q: 'Which cell type lacks a nucleus?', a: 'Prokaryote', choices: ['Eukaryote', 'Prokaryote', 'Plant cell', 'Animal cell'] },
  { q: 'What is the monomer of proteins?', a: 'Amino acid', choices: ['Nucleotide', 'Glucose', 'Fatty acid', 'Amino acid'] },
  { q: 'Where is ATP synthesized in aerobic respiration?', a: 'Mitochondria', choices: ['Cytoplasm', 'Mitochondria', 'Chloroplast', 'Ribosome'] },
  { q: 'What enzyme unzips DNA during replication?', a: 'Helicase', choices: ['Ligase', 'Polymerase', 'Helicase', 'Primase'] },
  { q: 'What is the fluid inside a cell called?', a: 'Cytoplasm', choices: ['Plasma', 'Cytoplasm', 'Serum', 'Lymph'] },
  { q: 'Which process splits water molecules during photosynthesis?', a: 'Photolysis', choices: ['Hydrolysis', 'Photolysis', 'Lysis', 'Osmosis'] },
];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

const WIN_SCORE = 7;
const TIMER_MAX = 12;

export default function TriviaDuel() {
  const [phase, setPhase] = useState('start');
  const [questions, setQuestions] = useState([]);
  const [qi, setQi] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [timer, setTimer] = useState(TIMER_MAX);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | 'timeout'
  const [streak, setStreak] = useState(0);
  const timerRef = useRef(null);

  function startGame() {
    const q = shuffle(QUESTIONS).slice(0, 12);
    setQuestions(q);
    setQi(0);
    setPlayerScore(0);
    setAiScore(0);
    setSelected(null);
    setFeedback(null);
    setStreak(0);
    setTimer(TIMER_MAX);
    setPhase('fight');
  }

  // Timer countdown
  useEffect(() => {
    if (phase !== 'fight' || feedback !== null) return;
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [qi, phase, feedback]);

  // AI picks answer randomly between 3-9s
  useEffect(() => {
    if (phase !== 'fight' || feedback !== null) return;
    const aiDelay = 3000 + Math.random() * 6000;
    const t = setTimeout(() => {
      if (feedback === null) {
        // AI answers (gets it right ~65% of the time)
        const correct = Math.random() < 0.65;
        if (correct) {
          setAiScore(s => s + 1);
        }
        // Don't end the player's turn — they can still answer
      }
    }, aiDelay);
    return () => clearTimeout(t);
  }, [qi, phase]);

  function handleAnswer(choice) {
    if (feedback !== null) return;
    clearInterval(timerRef.current);

    const current = questions[qi];
    const correct = choice === current?.a;
    setSelected(choice);

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setPlayerScore(s => s + 1);
      setFeedback('correct');
    } else if (choice === null) {
      setStreak(0);
      setFeedback('timeout');
      setAiScore(s => s + 1);
    } else {
      setStreak(0);
      setFeedback('wrong');
    }

    setTimeout(() => {
      const nextQi = qi + 1;
      const newPlayerScore = correct ? playerScore + 1 : playerScore;

      if (newPlayerScore >= WIN_SCORE || aiScore >= WIN_SCORE || nextQi >= questions.length) {
        setPhase('end');
      } else {
        setQi(nextQi);
        setSelected(null);
        setFeedback(null);
        setTimer(TIMER_MAX);
      }
    }, 1400);
  }

  const current = questions[qi];
  const playerWon = playerScore > aiScore;

  if (phase === 'start') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
        <div className="text-5xl mb-6">⚡</div>
        <h2 className="text-2xl font-bold text-[#00ff88] mb-3">Trivia Duel</h2>
        <p className="text-[#5a7a5a] text-sm mb-8 max-w-sm leading-relaxed">
          Race against an AI opponent. Answer biology questions faster and more accurately. First to {WIN_SCORE} correct answers wins.
        </p>
        <button onClick={startGame} className="px-8 py-3 bg-[#00ff88] text-[#050805] font-bold rounded hover:bg-[#00cc6a] transition-colors">
          Start Duel
        </button>
      </div>
    );
  }

  if (phase === 'end') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
        <div className="text-6xl mb-4">{playerWon ? '🏆' : '💀'}</div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: playerWon ? '#00ff88' : '#ff4455' }}>
          {playerWon ? 'YOU WIN!' : playerScore === aiScore ? 'DRAW!' : 'AI WINS'}
        </h2>
        <p className="text-[#5a7a5a] text-sm mb-6">
          You: {playerScore} | AI: {aiScore}
        </p>
        <button onClick={startGame} className="px-8 py-3 bg-[#00ff88] text-[#050805] font-bold rounded hover:bg-[#00cc6a] transition-colors">
          Play Again
        </button>
      </div>
    );
  }

  const timerPct = (timer / TIMER_MAX) * 100;
  const timerColor = timer > 6 ? '#00ff88' : timer > 3 ? '#ffcc00' : '#ff4455';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Scoreboard */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-center">
          <div className="text-xs text-[#5a7a5a] mb-1">YOU</div>
          <div className="text-4xl font-bold text-[#00ff88]">{playerScore}</div>
          <div className="flex gap-1 mt-2">
            {Array.from({ length: WIN_SCORE }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < playerScore ? '#00ff88' : '#1a2e1a' }} />
            ))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[#5a7a5a] text-xs mb-1">FIRST TO {WIN_SCORE}</div>
          <div className="text-[#00d4ff] font-bold text-sm">Q {qi + 1} / {questions.length}</div>
          {streak >= 2 && (
            <div className="text-[#ffcc00] text-xs mt-1">🔥 {streak} streak</div>
          )}
        </div>
        <div className="text-center">
          <div className="text-xs text-[#5a7a5a] mb-1">AI</div>
          <div className="text-4xl font-bold text-[#ff4455]">{aiScore}</div>
          <div className="flex gap-1 mt-2 justify-end">
            {Array.from({ length: WIN_SCORE }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < aiScore ? '#ff4455' : '#1a2e1a' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Timer bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-[#5a7a5a] mb-1">
          <span>time remaining</span>
          <span style={{ color: timerColor }}>{timer}s</span>
        </div>
        <div className="h-1.5 bg-[#1a2e1a] rounded overflow-hidden">
          <div
            className="h-full rounded transition-all duration-1000"
            style={{ width: `${timerPct}%`, background: timerColor }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="border border-[#1a2e1a] rounded-lg p-6 mb-4 bg-[#0d120d]">
        <div className="text-xs text-[#5a7a5a] mb-3 uppercase tracking-widest">// biology question</div>
        <p className="text-[#b8cbb8] text-lg leading-relaxed">{current?.q}</p>
      </div>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-3">
        {current?.choices.map(choice => {
          let borderColor = '#1a2e1a';
          let textColor = '#b8cbb8';
          let bg = '#0d120d';

          if (feedback !== null) {
            if (choice === current.a) {
              borderColor = '#00ff88';
              textColor = '#00ff88';
              bg = '#001a08';
            } else if (choice === selected) {
              borderColor = '#ff4455';
              textColor = '#ff4455';
              bg = '#1a0508';
            }
          } else if (selected === choice) {
            borderColor = '#00d4ff';
          }

          return (
            <button
              key={choice}
              onClick={() => handleAnswer(choice)}
              disabled={feedback !== null}
              className="p-4 text-left text-sm rounded-lg border transition-all hover:border-[#00ff88] disabled:cursor-default"
              style={{ borderColor, color: textColor, background: bg }}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="mt-4 text-center text-sm font-bold fade-in" style={{
          color: feedback === 'correct' ? '#00ff88' : feedback === 'timeout' ? '#ffcc00' : '#ff4455'
        }}>
          {feedback === 'correct' && `✓ Correct! ${streak >= 3 ? '🔥 On fire!' : ''}`}
          {feedback === 'wrong' && `✗ Wrong — "${current?.a}"`}
          {feedback === 'timeout' && `⏱ Time's up! Answer: "${current?.a}"`}
        </div>
      )}
    </div>
  );
}
