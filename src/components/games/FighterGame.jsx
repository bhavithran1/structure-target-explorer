import { useEffect, useRef, useState, useCallback } from 'react';

const W = 800, H = 380;
const FLOOR = H - 70;
const GRAVITY = 0.6;
const JUMP_PWR = -13;
const MOVE_SPEED = 4.5;
const MAX_ROUNDS = 3;

function createFighter(x, facing, type) {
  return {
    x, y: FLOOR, vx: 0, vy: 0,
    hp: 100, maxHp: 100,
    state: 'idle', stateTimer: 0,
    facing, type,
    attackCooldown: 0,
    hitFlash: 0,
    roundWins: 0,
    comboTimer: 0,
    combo: 0,
  };
}

const PUNCH_DMG = 8, KICK_DMG = 13, SPECIAL_DMG = 22;
const PUNCH_RANGE = 90, KICK_RANGE = 110, SPECIAL_RANGE = 140;

const QUESTIONS = [
  { q: 'What is the powerhouse of the cell?', a: 'Mitochondria', wrong: ['Nucleus', 'Ribosome', 'Lysosome'] },
  { q: 'Which molecule stores genetic information?', a: 'DNA', wrong: ['RNA', 'ATP', 'Protein'] },
  { q: 'What does a virus need to replicate?', a: 'A host cell', wrong: ['Oxygen', 'ATP', 'DNA polymerase'] },
  { q: 'What are the building blocks of proteins?', a: 'Amino acids', wrong: ['Nucleotides', 'Fatty acids', 'Glucose'] },
  { q: 'Which base pairs with Cytosine in DNA?', a: 'Guanine', wrong: ['Adenine', 'Thymine', 'Uracil'] },
];

function shuffle(a) { return [...a].sort(() => Math.random() - 0.5); }

export default function FighterGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const keysRef = useRef({});
  const rafRef = useRef(null);
  const [phase, setPhase] = useState('start'); // start|fight|ko|roundEnd|trivia|gameOver
  const [roundText, setRoundText] = useState('');
  const [triviaQ, setTriviaQ] = useState(null);
  const [triviaChoices, setTriviaChoices] = useState([]);
  const [triviaFeedback, setTriviaFeedback] = useState(null);

  function resetRound() {
    const s = stateRef.current;
    s.p1 = { ...createFighter(180, 1, 'dna'), roundWins: s.p1?.roundWins || 0 };
    s.p2 = { ...createFighter(620, -1, 'virus'), roundWins: s.p2?.roundWins || 0 };
    s.round = s.round || 1;
    s.roundTimer = 60 * 60; // 60s
    s.koTimer = 0;
    s.effects = [];
    s.bgFlash = 0;
  }

  function startGame() {
    stateRef.current = { round: 1, effects: [], bgFlash: 0 };
    resetRound();
    setPhase('fight');
  }

  // AI logic
  function aiUpdate(s) {
    const ai = s.p2, player = s.p1;
    if (ai.state === 'dead' || ai.state === 'hurt') return;
    const dist = Math.abs(ai.x - player.x);

    // Face player
    ai.facing = player.x < ai.x ? -1 : 1;

    // Move toward player if far
    if (dist > 120) {
      ai.x += (player.x < ai.x ? -1 : 1) * (MOVE_SPEED * 0.8);
    } else if (dist < 50) {
      ai.x -= (player.x < ai.x ? -1 : 1) * MOVE_SPEED;
    }

    // Clamp
    ai.x = Math.max(50, Math.min(W - 50, ai.x));

    // Attack
    if (ai.attackCooldown <= 0 && dist < KICK_RANGE) {
      const r = Math.random();
      if (r < 0.015) {
        doAttack(s, 'p2', 'kick');
      } else if (r < 0.03) {
        doAttack(s, 'p2', 'punch');
      } else if (r < 0.005) {
        doAttack(s, 'p2', 'special');
      }
    }

    // Jump occasionally
    if (Math.random() < 0.003 && ai.y >= FLOOR) {
      ai.vy = JUMP_PWR;
    }
  }

  function doAttack(s, who, type) {
    const attacker = s[who];
    const defender = who === 'p1' ? s.p2 : s.p1;
    if (attacker.state === 'dead') return;

    attacker.state = 'attack';
    attacker.stateTimer = type === 'special' ? 40 : type === 'kick' ? 28 : 20;
    attacker.attackCooldown = type === 'special' ? 90 : type === 'kick' ? 45 : 30;

    const range = type === 'special' ? SPECIAL_RANGE : type === 'kick' ? KICK_RANGE : PUNCH_RANGE;
    const dmg = type === 'special' ? SPECIAL_DMG : type === 'kick' ? KICK_DMG : PUNCH_DMG;
    const dist = Math.abs(attacker.x - defender.x);

    if (dist < range) {
      defender.hp = Math.max(0, defender.hp - dmg);
      defender.state = 'hurt';
      defender.stateTimer = 14;
      defender.hitFlash = 8;
      defender.vx = (attacker.facing) * (type === 'special' ? 8 : 4);

      // Hit effect
      s.effects.push({
        x: (attacker.x + defender.x) / 2,
        y: defender.y - 40,
        type,
        life: 20,
      });
      s.bgFlash = type === 'special' ? 6 : 3;

      // Combo
      attacker.comboTimer = 60;
      attacker.combo++;
    }
  }

  useEffect(() => {
    if (phase !== 'fight') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    function onKeyDown(e) {
      keysRef.current[e.code] = true;
      // P1 attacks
      if (e.code === 'KeyF') doAttack(stateRef.current, 'p1', 'punch');
      if (e.code === 'KeyG') doAttack(stateRef.current, 'p1', 'kick');
      if (e.code === 'KeyH') doAttack(stateRef.current, 'p1', 'special');
      if ((e.code === 'KeyW' || e.code === 'Space') && stateRef.current?.p1?.y >= FLOOR) {
        e.preventDefault();
        stateRef.current.p1.vy = JUMP_PWR;
      }
    }
    function onKeyUp(e) { delete keysRef.current[e.code]; }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function loop() {
      const s = stateRef.current;
      if (!s) return;

      // Input for P1
      const p1 = s.p1;
      if (p1.state !== 'dead' && p1.state !== 'hurt') {
        if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) p1.x -= MOVE_SPEED;
        if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) p1.x += MOVE_SPEED;
        if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) p1.facing = -1;
        if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) p1.facing = 1;
      }

      // Physics for both
      [s.p1, s.p2].forEach(f => {
        f.vy += GRAVITY;
        f.y += f.vy;
        f.x += f.vx;
        f.vx *= 0.8;
        if (f.y >= FLOOR) { f.y = FLOOR; f.vy = 0; }
        f.x = Math.max(40, Math.min(W - 40, f.x));
        if (f.stateTimer > 0) { f.stateTimer--; if (f.stateTimer === 0 && f.state !== 'dead') f.state = 'idle'; }
        if (f.attackCooldown > 0) f.attackCooldown--;
        if (f.hitFlash > 0) f.hitFlash--;
        if (f.comboTimer > 0) { f.comboTimer--; if (f.comboTimer === 0) f.combo = 0; }
        // Face opponent
        const opp = f === s.p1 ? s.p2 : s.p1;
        if (f.state === 'idle' || f.state === 'run') {
          f.facing = opp.x > f.x ? 1 : -1;
        }
      });

      // AI
      aiUpdate(s);

      // Effects
      s.effects = s.effects.filter(e => e.life > 0);
      s.effects.forEach(e => e.life--);
      if (s.bgFlash > 0) s.bgFlash--;

      // Timer
      if (s.roundTimer > 0) s.roundTimer--;

      // Check KO
      const p1Dead = s.p1.hp <= 0;
      const p2Dead = s.p2.hp <= 0;
      const timedOut = s.roundTimer <= 0;

      if (p1Dead || p2Dead || timedOut) {
        if (p1Dead) s.p1.state = 'dead';
        if (p2Dead) s.p2.state = 'dead';

        const p1Wins = !p1Dead && (p2Dead || s.p1.hp > s.p2.hp);
        if (p1Wins) s.p1.roundWins++;
        else s.p2.roundWins++;

        draw(ctx, s);
        cancelAnimationFrame(rafRef.current);

        if (s.p1.roundWins >= Math.ceil(MAX_ROUNDS / 2) || s.p2.roundWins >= Math.ceil(MAX_ROUNDS / 2)) {
          setPhase('gameOver');
        } else {
          // Offer trivia bonus
          const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
          const choices = shuffle([q.a, ...q.wrong.slice(0, 3)]);
          setTriviaQ(q);
          setTriviaChoices(choices);
          setTriviaFeedback(null);
          setPhase('trivia');
        }
        return;
      }

      draw(ctx, s);
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [phase]);

  function draw(ctx, s) {
    const { p1, p2, effects, bgFlash, roundTimer } = s;

    // BG
    ctx.fillStyle = bgFlash > 0 ? '#1a0a00' : '#060b06';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#0d1a0d';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Floor
    ctx.fillStyle = '#1a2e1a';
    ctx.fillRect(0, FLOOR, W, H - FLOOR);
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(0, FLOOR, W, 2);

    // Fighters
    [p1, p2].forEach(f => drawFighter(ctx, f));

    // Effects
    effects.forEach(e => {
      ctx.save();
      ctx.translate(e.x, e.y);
      const alpha = e.life / 20;
      ctx.globalAlpha = alpha;
      if (e.type === 'special') {
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 20;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const r = (1 - alpha) * 60 + 10;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          ctx.stroke();
        }
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CRITICAL!', 0, -20);
      } else {
        ctx.fillStyle = e.type === 'kick' ? '#ff8800' : '#00d4ff';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;
        ctx.font = `bold ${e.type === 'kick' ? 20 : 16}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(e.type === 'kick' ? 'KICK!' : 'HIT!', 0, 0);
      }
      ctx.restore();
    });

    // HUD — health bars
    drawHUD(ctx, s);

    // Combo display
    if (p1.combo >= 2) {
      ctx.fillStyle = '#00d4ff';
      ctx.font = `bold ${12 + p1.combo}px monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(`${p1.combo}x COMBO!`, 20, H - 10);
    }
  }

  function drawFighter(ctx, f) {
    ctx.save();
    ctx.translate(f.x, f.y);

    const flash = f.hitFlash % 2 === 1;
    const dead = f.state === 'dead';
    const attack = f.state === 'attack';

    if (f.type === 'dna') {
      // DNA character — blue/cyan humanoid
      const color = dead ? '#334' : flash ? '#ffffff' : '#00d4ff';
      ctx.shadowColor = dead ? 'none' : '#00d4ff';
      ctx.shadowBlur = dead ? 0 : 15;

      // Legs
      const legSwing = f.y >= FLOOR ? Math.sin(Date.now() * 0.01) * 10 : 0;
      ctx.fillStyle = color;
      ctx.fillRect(-8 + legSwing * 0.5, -20, 14, 22);
      ctx.fillRect(-8 - legSwing * 0.5, -20, 14, 22);

      // Body
      ctx.fillStyle = color;
      ctx.fillRect(-16, -60, 32, 42);

      // Arms
      const armAngle = attack ? (f.facing * 0.8) : 0;
      ctx.save();
      ctx.translate(f.facing * 16, -50);
      ctx.rotate(armAngle);
      ctx.fillRect(0, 0, f.facing * 30, 8);
      ctx.restore();
      ctx.fillRect(-f.facing * 16, -50, -f.facing * 18, 8);

      // Head
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -72, 14, 0, Math.PI*2);
      ctx.fill();

      // Helix pattern on body
      if (!dead && !flash) {
        ctx.strokeStyle = '#005588';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        for (let i = 0; i < 3; i++) {
          const t = Date.now() * 0.003 + i * 1;
          ctx.beginPath();
          ctx.arc(Math.cos(t) * 8, -40 + i * 14, 4, 0, Math.PI*2);
          ctx.stroke();
        }
      }

      // Eyes
      ctx.fillStyle = dead ? '#334' : '#000';
      ctx.fillRect(f.facing * 4, -76, 5, 5);
      if (dead) {
        ctx.fillStyle = '#ff4455';
        ctx.fillText('X', f.facing * 4, -70);
      }
    } else {
      // Virus character — red/orange spiky
      const color = dead ? '#442222' : flash ? '#ffffff' : '#ff4455';
      ctx.shadowColor = dead ? 'none' : '#ff4455';
      ctx.shadowBlur = dead ? 0 : 15;

      // Legs
      ctx.fillStyle = color;
      ctx.fillRect(-10, -20, 13, 22);
      ctx.fillRect(-3, -20, 13, 22);

      // Body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -50, 22, 0, Math.PI*2);
      ctx.fill();

      // Spikes
      if (!dead) {
        const spikeColor = flash ? '#ffcccc' : '#cc2233';
        ctx.strokeStyle = spikeColor;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 8;
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + Date.now() * 0.001;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 20, -50 + Math.sin(angle) * 20);
          ctx.lineTo(Math.cos(angle) * 32, -50 + Math.sin(angle) * 32);
          ctx.stroke();
        }
      }

      // Arm attack
      if (attack) {
        ctx.fillStyle = color;
        ctx.fillRect(f.facing * 20, -52, f.facing * 35, 10);
      }

      // Head/face
      ctx.fillStyle = '#660011';
      ctx.beginPath();
      ctx.arc(0, -50, 14, 0, Math.PI*2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = dead ? '#442222' : '#ffcc00';
      ctx.shadowBlur = dead ? 0 : 6;
      ctx.shadowColor = '#ffcc00';
      ctx.fillRect(-8, -56, 5, 5);
      ctx.fillRect(3, -56, 5, 5);

      // Crown of virus
      if (!dead && !flash) {
        ctx.strokeStyle = '#ff667788';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
        for (let i = 0; i < 5; i++) {
          const a = (-Math.PI/2) + (i / 4) * Math.PI;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 14, -50 + Math.sin(a) * 14);
          ctx.lineTo(Math.cos(a) * 22, -50 + Math.sin(a) * 22);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  function drawHUD(ctx, s) {
    const { p1, p2, round, roundTimer } = s;

    // P1 health bar
    ctx.fillStyle = '#1a2e1a';
    ctx.fillRect(20, 16, 260, 18);
    ctx.fillStyle = p1.hp > 50 ? '#00ff88' : p1.hp > 25 ? '#ffcc00' : '#ff4455';
    ctx.fillRect(20, 16, (p1.hp / 100) * 260, 18);
    ctx.strokeStyle = '#2a4a2a';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 16, 260, 18);

    // P1 label
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('YOU [DNA]', 20, 52);
    ctx.fillStyle = '#5a7a5a';
    ctx.fillText(`Wins: ${'★'.repeat(p1.roundWins)}`, 20, 64);

    // P2 health bar
    ctx.fillStyle = '#1a2e1a';
    ctx.fillRect(W - 280, 16, 260, 18);
    ctx.fillStyle = p2.hp > 50 ? '#ff4455' : p2.hp > 25 ? '#ff8800' : '#cc2200';
    ctx.fillRect(W - 280 + (1 - p2.hp / 100) * 260, 16, (p2.hp / 100) * 260, 18);
    ctx.strokeStyle = '#4a1a1a';
    ctx.strokeRect(W - 280, 16, 260, 18);

    // P2 label
    ctx.fillStyle = '#ff4455';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('[VIRUS] AI', W - 20, 52);
    ctx.fillStyle = '#5a7a5a';
    ctx.fillText(`Wins: ${'★'.repeat(p2.roundWins)}`, W - 20, 64);

    // Round + timer
    ctx.fillStyle = '#b8cbb8';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`ROUND ${round} / ${MAX_ROUNDS}`, W/2, 26);
    const secs = Math.ceil(roundTimer / 60);
    ctx.fillStyle = secs < 10 ? '#ff4455' : '#5a7a5a';
    ctx.font = '11px monospace';
    ctx.fillText(`${secs}s`, W/2, 44);

    // Controls hint
    ctx.fillStyle = '#2a3a2a';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('A/D:move  W:jump  F:punch  G:kick  H:special', 10, H - 6);
  }

  function handleTrivia(choice) {
    if (triviaFeedback) return;
    const correct = choice === triviaQ.a;
    setTriviaFeedback(correct ? 'correct' : 'wrong');

    if (correct) {
      stateRef.current.p1.hp = Math.min(100, stateRef.current.p1.hp + 30);
    }

    setTimeout(() => {
      stateRef.current.round++;
      resetRound();
      setTriviaFeedback(null);
      setTriviaQ(null);
      setPhase('fight');
    }, 1600);
  }

  const p1Wins = stateRef.current?.p1?.roundWins >= Math.ceil(MAX_ROUNDS / 2);

  if (phase === 'start') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
        <div className="text-5xl">🥊</div>
        <h2 className="text-2xl font-bold text-[#ff4455]">BIO FIGHTER</h2>
        <p className="text-[#5a7a5a] text-sm max-w-sm leading-relaxed">
          You play as the DNA Warrior fighting the Virus AI. Win 2 out of 3 rounds.
          Answer biology trivia between rounds to restore HP!
        </p>
        <div className="text-xs text-[#2a4a2a] space-y-1">
          <div>A / D — move left/right</div>
          <div>W / Space — jump</div>
          <div>F — punch &nbsp; G — kick &nbsp; H — SPECIAL (best range)</div>
        </div>
        <button onClick={startGame} className="px-8 py-3 bg-[#ff4455] text-white font-bold rounded hover:bg-[#cc2233] transition-colors">
          FIGHT!
        </button>
      </div>
    );
  }

  if (phase === 'gameOver') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
        <div className="text-6xl">{p1Wins ? '🏆' : '💀'}</div>
        <h2 className="text-3xl font-bold" style={{ color: p1Wins ? '#00ff88' : '#ff4455' }}>
          {p1Wins ? 'VICTORY!' : 'DEFEATED!'}
        </h2>
        <p className="text-[#5a7a5a] text-sm">
          DNA: {stateRef.current?.p1?.roundWins} wins &nbsp;|&nbsp; Virus: {stateRef.current?.p2?.roundWins} wins
        </p>
        <button onClick={startGame} className="px-8 py-3 bg-[#ff4455] text-white font-bold rounded hover:bg-[#cc2233] transition-colors">
          REMATCH
        </button>
      </div>
    );
  }

  if (phase === 'trivia') {
    return (
      <div className="flex flex-col items-center gap-6 py-8 max-w-lg mx-auto text-center">
        <div className="text-[#ffcc00] font-bold text-sm tracking-widest">⚡ ROUND BREAK — BIOLOGY BONUS ⚡</div>
        <p className="text-[#5a7a5a] text-xs">Answer correctly to restore 30 HP before the next round!</p>
        <div className="border border-[#1a2e1a] rounded-lg p-5 bg-[#0d120d] w-full">
          <p className="text-[#b8cbb8] text-base leading-relaxed">{triviaQ?.q}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full">
          {triviaChoices.map(c => {
            let style = { borderColor: '#1a2e1a', color: '#b8cbb8', background: '#0d120d' };
            if (triviaFeedback) {
              if (c === triviaQ.a) style = { borderColor: '#00ff88', color: '#00ff88', background: '#001a08' };
              else if (triviaFeedback === 'wrong') style = { borderColor: '#ff4455', color: '#ff4455', background: '#1a0508' };
            }
            return (
              <button
                key={c}
                onClick={() => handleTrivia(c)}
                disabled={!!triviaFeedback}
                className="p-3 text-sm text-left rounded border transition-all hover:border-[#00ff88] disabled:cursor-default"
                style={style}
              >
                {c}
              </button>
            );
          })}
        </div>
        {triviaFeedback && (
          <p className="font-bold fade-in" style={{ color: triviaFeedback === 'correct' ? '#00ff88' : '#ff4455' }}>
            {triviaFeedback === 'correct' ? '✓ Correct! +30 HP restored' : `✗ Wrong! Answer: "${triviaQ?.a}"`}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-lg border border-[#1a2e1a]"
        style={{ maxWidth: '100%' }}
      />
    </div>
  );
}
