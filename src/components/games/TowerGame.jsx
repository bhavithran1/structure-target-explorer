import { useEffect, useRef, useState, useCallback } from 'react';

const COLS = 14, ROWS = 8;
const CS = 52; // cell size
const W = COLS * CS, H = ROWS * CS;
const LIVES_MAX = 5;

// Path: list of [col, row] grid cells viruses walk through
const PATH = [
  [0,3],[1,3],[2,3],[3,3],[3,2],[3,1],[4,1],[5,1],[6,1],[7,1],
  [7,2],[7,3],[7,4],[7,5],[7,6],[8,6],[9,6],[10,6],[10,5],[10,4],
  [10,3],[10,2],[11,2],[12,2],[13,2],[13,3],[13,4],
];
const PATH_SET = new Set(PATH.map(([c,r]) => `${c},${r}`));

const TOWERS = {
  antibody: { name: 'Antibody', color: '#00d4ff', range: 100, damage: 8, rate: 45, cost: 75, desc: 'Balanced range & damage' },
  enzyme:   { name: 'Enzyme',   color: '#00ff88', range: 70,  damage: 18, rate: 25, cost: 100, desc: 'Fast, high damage, short range' },
  tcell:    { name: 'T-Cell',   color: '#ffcc00', range: 130, damage: 5,  rate: 60, cost: 120, desc: 'AOE damage, long range' },
};

const WAVE_CONFIGS = [
  { count: 5, hp: 40,  speed: 0.8, reward: 15 },
  { count: 8, hp: 55,  speed: 1.0, reward: 18 },
  { count: 10,hp: 70,  speed: 1.1, reward: 20 },
  { count: 12,hp: 90,  speed: 1.2, reward: 22 },
  { count: 15,hp: 120, speed: 1.3, reward: 25 },
  { count: 12,hp: 160, speed: 1.4, reward: 30 },
  { count: 18,hp: 200, speed: 1.5, reward: 35 },
  { count: 20,hp: 260, speed: 1.6, reward: 40 },
];

let nextId = 1;
function makeVirus(waveIdx) {
  const cfg = WAVE_CONFIGS[Math.min(waveIdx, WAVE_CONFIGS.length - 1)];
  return {
    id: nextId++,
    pathIdx: 0,
    progress: 0, // 0..1 between path[pathIdx] and path[pathIdx+1]
    x: PATH[0][0] * CS + CS/2,
    y: PATH[0][1] * CS + CS/2,
    hp: cfg.hp, maxHp: cfg.hp,
    speed: cfg.speed,
    reward: cfg.reward,
    slow: 0,
    dead: false,
  };
}

export default function TowerGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const [phase, setPhase] = useState('start'); // start|play|waveClear|gameOver|win
  const [selectedTower, setSelectedTower] = useState('antibody');
  const [gold, setGold] = useState(150);
  const [lives, setLives] = useState(LIVES_MAX);
  const [wave, setWave] = useState(0);
  const [score, setScore] = useState(0);

  function initState() {
    return {
      towers: [],
      viruses: [],
      projectiles: [],
      particles: [],
      wave: 0,
      gold: 150,
      lives: LIVES_MAX,
      score: 0,
      spawnQueue: 0,
      spawnTimer: 0,
      waveActive: false,
      waveCleared: false,
      frame: 0,
    };
  }

  const startWave = useCallback(() => {
    const s = stateRef.current;
    const cfg = WAVE_CONFIGS[Math.min(s.wave, WAVE_CONFIGS.length - 1)];
    s.spawnQueue = cfg.count;
    s.spawnTimer = 0;
    s.waveActive = true;
    s.waveCleared = false;
    setPhase('play');
  }, []);

  function placeTower(col, row, type) {
    const s = stateRef.current;
    if (!s) return;
    if (PATH_SET.has(`${col},${row}`)) return;
    if (s.towers.find(t => t.col === col && t.row === row)) return;
    const def = TOWERS[type];
    if (s.gold < def.cost) return;

    s.gold -= def.cost;
    s.towers.push({
      col, row,
      x: col * CS + CS/2, y: row * CS + CS/2,
      type, ...def,
      cooldown: 0,
    });
    setGold(s.gold);
  }

  useEffect(() => {
    if (phase !== 'play') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    function onClick(e) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const col = Math.floor(mx / CS);
      const row = Math.floor(my / CS);
      placeTower(col, row, selectedTower);
    }
    canvas.addEventListener('click', onClick);

    function loop() {
      const s = stateRef.current;
      s.frame++;

      // Spawn viruses
      if (s.waveActive && s.spawnQueue > 0) {
        s.spawnTimer--;
        if (s.spawnTimer <= 0) {
          s.viruses.push(makeVirus(s.wave));
          s.spawnQueue--;
          s.spawnTimer = 55;
        }
      }

      // Move viruses
      s.viruses.forEach(v => {
        if (v.dead) return;
        const spd = v.speed * (v.slow > 0 ? 0.4 : 1);
        v.progress += spd / (CS);

        while (v.progress >= 1) {
          v.pathIdx++;
          v.progress -= 1;
          if (v.pathIdx >= PATH.length - 1) {
            // Reached end
            v.dead = true;
            s.lives = Math.max(0, s.lives - 1);
            setLives(s.lives);
            if (s.lives <= 0) {
              setPhase('gameOver');
              cancelAnimationFrame(rafRef.current);
              return;
            }
            break;
          }
        }

        if (!v.dead && v.pathIdx < PATH.length - 1) {
          const [c1, r1] = PATH[v.pathIdx];
          const [c2, r2] = PATH[v.pathIdx + 1];
          v.x = (c1 + (c2 - c1) * v.progress) * CS + CS/2;
          v.y = (r1 + (r2 - r1) * v.progress) * CS + CS/2;
        }
        if (v.slow > 0) v.slow--;
      });
      s.viruses = s.viruses.filter(v => !v.dead || v.hp > 0);

      // Tower attack
      s.towers.forEach(t => {
        if (t.cooldown > 0) { t.cooldown--; return; }
        // Find closest virus in range
        let target = null, minDist = Infinity;
        s.viruses.forEach(v => {
          if (v.dead) return;
          const d = Math.hypot(v.x - t.x, v.y - t.y);
          if (d < t.range && d < minDist) { minDist = d; target = v; }
        });
        if (!target) return;
        t.cooldown = t.rate;

        if (t.type === 'tcell') {
          // AOE
          s.viruses.forEach(v => {
            if (v.dead) return;
            const d = Math.hypot(v.x - t.x, v.y - t.y);
            if (d < t.range) {
              v.hp -= t.damage;
              v.slow = 20;
              if (v.hp <= 0) { v.dead = true; s.gold += v.reward; s.score += v.reward * 2; setGold(s.gold); setScore(s.score); spawnCoins(s, v.x, v.y); }
            }
          });
          s.particles.push({ x: t.x, y: t.y, r: 0, maxR: t.range, life: 20, color: '#ffcc00' });
        } else {
          // Projectile
          s.projectiles.push({
            x: t.x, y: t.y,
            tx: target, // track target
            speed: 5,
            damage: t.damage,
            type: t.type,
            slow: t.type === 'antibody',
            color: TOWERS[t.type].color,
          });
        }
      });

      // Move projectiles
      s.projectiles = s.projectiles.filter(p => {
        if (p.tx.dead) return false;
        const dx = p.tx.x - p.x, dy = p.tx.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < p.speed + 3) {
          // Hit
          p.tx.hp -= p.damage;
          if (p.slow) p.tx.slow = 40;
          if (p.tx.hp <= 0) {
            p.tx.dead = true;
            s.gold += p.tx.reward;
            s.score += p.tx.reward * 2;
            setGold(s.gold);
            setScore(s.score);
            spawnCoins(s, p.tx.x, p.tx.y);
          }
          return false;
        }
        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;
        return true;
      });

      // Particles
      s.particles = s.particles.filter(p => p.life > 0);
      s.particles.forEach(p => {
        if (p.r !== undefined) p.r += (p.maxR - p.r) * 0.15;
        p.life--;
      });

      // Check wave clear
      if (s.waveActive && s.spawnQueue === 0 && s.viruses.filter(v=>!v.dead).length === 0) {
        s.waveActive = false;
        s.wave++;
        setWave(s.wave);

        if (s.wave >= WAVE_CONFIGS.length) {
          setPhase('win');
          cancelAnimationFrame(rafRef.current);
          return;
        }

        // Bonus gold between waves
        s.gold += 50;
        setGold(s.gold);
        setPhase('waveClear');
        cancelAnimationFrame(rafRef.current);
        return;
      }

      draw(ctx, s);
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      canvas.removeEventListener('click', onClick);
      cancelAnimationFrame(rafRef.current);
    };
  }, [phase, selectedTower]);

  function spawnCoins(s, x, y) {
    for (let i = 0; i < 4; i++) {
      s.particles.push({ x, y, vx: (Math.random()-0.5)*3, vy: -Math.random()*3-1, life: 30, coin: true });
    }
  }

  function draw(ctx, s) {
    ctx.fillStyle = '#060b06';
    ctx.fillRect(0, 0, W, H);

    // Grid
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const onPath = PATH_SET.has(`${c},${r}`);
        ctx.fillStyle = onPath ? '#0d180a' : '#080f08';
        ctx.fillRect(c*CS, r*CS, CS, CS);
        ctx.strokeStyle = '#0d1a0d';
        ctx.lineWidth = 1;
        ctx.strokeRect(c*CS, r*CS, CS, CS);
      }
    }

    // Path
    ctx.strokeStyle = '#1a3a0a';
    ctx.lineWidth = CS - 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    PATH.forEach(([c,r], i) => {
      const x = c*CS + CS/2, y = r*CS + CS/2;
      i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.stroke();

    // Path arrows
    ctx.strokeStyle = '#2a5a1a';
    ctx.lineWidth = 1;
    for (let i = 1; i < PATH.length; i++) {
      const [c1,r1] = PATH[i-1];
      const [c2,r2] = PATH[i];
      const mx = (c1+c2)/2*CS + CS/2;
      const my = (r1+r2)/2*CS + CS/2;
      const angle = Math.atan2(r2-r1, c2-c1);
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-5, -4); ctx.lineTo(5, 0); ctx.lineTo(-5, 4);
      ctx.stroke();
      ctx.restore();
    }

    // Start/end markers
    ctx.fillStyle = '#00ff88';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('START', PATH[0][0]*CS+CS/2, PATH[0][1]*CS + CS - 4);
    ctx.fillStyle = '#ff4455';
    ctx.fillText('END', PATH[PATH.length-1][0]*CS+CS/2, PATH[PATH.length-1][1]*CS + CS - 4);

    // Towers
    s.towers.forEach(t => {
      ctx.save();
      ctx.translate(t.x, t.y);

      // Range circle (dim)
      ctx.strokeStyle = TOWERS[t.type].color + '22';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, t.range, 0, Math.PI*2);
      ctx.stroke();

      ctx.shadowColor = TOWERS[t.type].color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = TOWERS[t.type].color;

      if (t.type === 'antibody') {
        ctx.fillRect(-10, -3, 20, 6);
        ctx.fillRect(-3, -10, 6, 20);
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
      } else if (t.type === 'enzyme') {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i/6)*Math.PI*2;
          i === 0 ? ctx.moveTo(Math.cos(a)*12, Math.sin(a)*12) : ctx.lineTo(Math.cos(a)*12, Math.sin(a)*12);
        }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#050805';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
      } else {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i/8)*Math.PI*2 + (s.frame * 0.02);
          const r2 = i%2===0 ? 13 : 8;
          i === 0 ? ctx.moveTo(Math.cos(a)*r2, Math.sin(a)*r2) : ctx.lineTo(Math.cos(a)*r2, Math.sin(a)*r2);
        }
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    });

    // AOE rings
    s.particles.filter(p => p.r !== undefined).forEach(p => {
      ctx.strokeStyle = p.color + Math.floor((p.life/20)*255).toString(16).padStart(2,'0');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.stroke();
    });

    // Viruses
    s.viruses.filter(v => !v.dead).forEach(v => {
      ctx.save();
      ctx.translate(v.x, v.y);
      const pct = v.hp / v.maxHp;
      const col = pct > 0.5 ? '#ff4455' : pct > 0.25 ? '#ff8800' : '#ffcc00';

      ctx.shadowColor = col;
      ctx.shadowBlur = 8;
      ctx.fillStyle = col;

      // Spiky virus shape
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i/8)*Math.PI*2 + s.frame*0.03;
        const r = i%2===0 ? 10 : 6;
        i===0 ? ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r) : ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
      }
      ctx.closePath(); ctx.fill();

      if (v.slow > 0) {
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.stroke();
      }

      // HP bar
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(-12, -18, 24, 4);
      ctx.fillStyle = pct > 0.5 ? '#00ff88' : pct > 0.25 ? '#ffcc00' : '#ff4455';
      ctx.fillRect(-12, -18, 24 * pct, 4);
      ctx.restore();
    });

    // Projectiles
    s.projectiles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
      ctx.fill();
    });

    // Coin particles
    s.particles.filter(p => p.coin).forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.15;
      ctx.globalAlpha = p.life / 30;
      ctx.fillStyle = '#ffcc00';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('$', p.x, p.y);
    });
    ctx.globalAlpha = 1;
  }

  if (phase === 'start') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
        <div className="text-5xl">🛡️</div>
        <h2 className="text-2xl font-bold text-[#ffcc00]">Cell Defense</h2>
        <p className="text-[#5a7a5a] text-sm max-w-sm leading-relaxed">
          Defend the cell nucleus from virus waves. Place towers on the grid to destroy viruses before they reach the end. Earn gold to buy more towers.
        </p>
        <div className="text-xs text-[#2a4a2a] space-y-1">
          <div><span className="text-[#00d4ff]">Antibody</span> — balanced · 75g</div>
          <div><span className="text-[#00ff88]">Enzyme</span> — fast & powerful · 100g</div>
          <div><span className="text-[#ffcc00]">T-Cell</span> — area damage · 120g</div>
        </div>
        <button
          onClick={() => { stateRef.current = initState(); startWave(); }}
          className="px-8 py-3 bg-[#ffcc00] text-[#050805] font-bold rounded hover:opacity-90 transition-opacity"
        >
          Start Defense
        </button>
      </div>
    );
  }

  if (phase === 'gameOver') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
        <div className="text-5xl">💀</div>
        <h2 className="text-3xl font-bold text-[#ff4455]">CELL BREACHED</h2>
        <p className="text-[#5a7a5a] text-sm">Wave {wave} · Score: {score}</p>
        <button onClick={() => { stateRef.current = initState(); setGold(150); setLives(LIVES_MAX); setWave(0); setScore(0); startWave(); }}
          className="px-8 py-3 bg-[#ffcc00] text-[#050805] font-bold rounded">
          Try Again
        </button>
      </div>
    );
  }

  if (phase === 'win') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
        <div className="text-5xl">🧬</div>
        <h2 className="text-3xl font-bold text-[#00ff88]">CELL DEFENDED!</h2>
        <p className="text-[#5a7a5a] text-sm">All {WAVE_CONFIGS.length} waves defeated! Score: {score}</p>
        <button onClick={() => { stateRef.current = initState(); setGold(150); setLives(LIVES_MAX); setWave(0); setScore(0); startWave(); }}
          className="px-8 py-3 bg-[#00ff88] text-[#050805] font-bold rounded">
          Play Again
        </button>
      </div>
    );
  }

  if (phase === 'waveClear') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
        <div className="text-4xl">✓</div>
        <h2 className="text-2xl font-bold text-[#00ff88]">Wave {wave} Clear!</h2>
        <p className="text-[#5a7a5a] text-sm">+50 gold bonus · {WAVE_CONFIGS.length - wave} waves remaining</p>
        <div className="text-[#5a7a5a] text-xs">Gold: {gold} &nbsp;|&nbsp; Lives: {'❤️'.repeat(lives)} &nbsp;|&nbsp; Score: {score}</div>
        <button onClick={startWave} className="px-8 py-3 bg-[#ffcc00] text-[#050805] font-bold rounded hover:opacity-90 transition-opacity">
          Next Wave →
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-4 items-start">
      <div className="flex flex-col gap-2 shrink-0">
        {/* HUD */}
        <div className="border border-[#1a2e1a] rounded p-3 text-xs space-y-1 bg-[#0d120d] min-w-[140px]">
          <div className="text-[#5a7a5a]">WAVE {wave + 1} / {WAVE_CONFIGS.length}</div>
          <div className="text-[#ffcc00]">💰 {gold}</div>
          <div className="text-[#ff4455]">{'❤️'.repeat(lives)}{'🖤'.repeat(LIVES_MAX - lives)}</div>
          <div className="text-[#00ff88]">Score: {score}</div>
        </div>

        {/* Tower selector */}
        <div className="text-xs text-[#5a7a5a] mt-2 mb-1">SELECT TOWER:</div>
        {Object.entries(TOWERS).map(([key, def]) => (
          <button
            key={key}
            onClick={() => setSelectedTower(key)}
            className="p-2 rounded border text-left transition-all text-xs"
            style={{
              borderColor: selectedTower === key ? def.color : '#1a2e1a',
              background: selectedTower === key ? def.color + '22' : '#0d120d',
              color: def.color,
            }}
          >
            <div className="font-bold">{def.name}</div>
            <div className="text-[#5a7a5a]">{def.desc}</div>
            <div className="text-[#ffcc00]">{def.cost}g</div>
          </button>
        ))}
        <div className="text-[#2a4a2a] text-xs mt-2">Click grid to place</div>
        <div className="text-[#2a4a2a] text-xs">(not on path)</div>
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-lg border border-[#1a2e1a] cursor-crosshair"
        style={{ maxWidth: '100%' }}
      />
    </div>
  );
}
