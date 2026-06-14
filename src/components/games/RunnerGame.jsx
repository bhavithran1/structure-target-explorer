import { useEffect, useRef, useState, useCallback } from 'react';

const W = 750, H = 300;
const FLOOR = H - 60;
const GRAVITY = 0.7;
const JUMP1 = -14;
const JUMP2 = -10;

function rand(a, b) { return a + Math.floor(Math.random() * (b - a)); }

function makeObstacle(x) {
  const types = ['bacteria', 'rbc', 'bigbac'];
  const type = types[rand(0, types.length)];
  const h = type === 'bigbac' ? 55 : type === 'rbc' ? 28 : 35;
  const w = type === 'bigbac' ? 30 : type === 'rbc' ? 40 : 22;
  return { x, y: FLOOR - h, w, h, type };
}

function makeATP(x) {
  return { x, y: rand(FLOOR - 90, FLOOR - 40), collected: false };
}

export default function RunnerGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const [phase, setPhase] = useState('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [dead, setDead] = useState(false);

  const initState = () => ({
    player: { x: 100, y: FLOOR, vy: 0, jumps: 0, dead: false, frame: 0 },
    obstacles: [],
    atps: [],
    score: 0,
    speed: 4,
    frame: 0,
    spawnTimer: 60,
    atpTimer: 90,
    particles: [],
    bgOffset: 0,
  });

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.player.dead) return;
    if (s.player.jumps === 0) {
      s.player.vy = JUMP1;
      s.player.jumps = 1;
    } else if (s.player.jumps === 1) {
      s.player.vy = JUMP2;
      s.player.jumps = 2;
    }
  }, []);

  useEffect(() => {
    if (phase !== 'running') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    stateRef.current = initState();

    function onKey(e) {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        jump();
      }
    }
    window.addEventListener('keydown', onKey);

    function loop() {
      const s = stateRef.current;
      s.frame++;
      s.bgOffset = (s.bgOffset + s.speed * 0.3) % W;

      // Speed ramp
      if (s.frame % 300 === 0) s.speed = Math.min(s.speed + 0.4, 12);

      // Physics
      const p = s.player;
      p.vy += GRAVITY;
      p.y += p.vy;
      if (p.y >= FLOOR) {
        p.y = FLOOR;
        p.vy = 0;
        p.jumps = 0;
      }
      p.frame++;

      // Spawn obstacles
      s.spawnTimer--;
      if (s.spawnTimer <= 0) {
        s.obstacles.push(makeObstacle(W + 30));
        s.spawnTimer = rand(50, 110) - Math.floor(s.speed * 2);
      }

      // Spawn ATPs
      s.atpTimer--;
      if (s.atpTimer <= 0) {
        s.atps.push(makeATP(W + 20));
        s.atpTimer = rand(60, 130);
      }

      // Move obstacles
      s.obstacles = s.obstacles.filter(o => o.x > -60);
      s.obstacles.forEach(o => { o.x -= s.speed; });

      // Move ATPs
      s.atps = s.atps.filter(a => a.x > -20);
      s.atps.forEach(a => { a.x -= s.speed; });

      // Collect ATPs
      s.atps.forEach(a => {
        if (!a.collected && Math.abs(p.x - a.x) < 22 && Math.abs((p.y - 20) - a.y) < 22) {
          a.collected = true;
          s.score += 10;
          // particle burst
          for (let i = 0; i < 6; i++) {
            s.particles.push({ x: a.x, y: a.y, vx: (Math.random()-0.5)*4, vy: (Math.random()-2)*3, life: 20, color: '#ffcc00' });
          }
        }
      });

      // Score (distance)
      s.score += 0.05;

      // Particles
      s.particles = s.particles.filter(pt => pt.life > 0);
      s.particles.forEach(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.2; pt.life--; });

      // Collision
      if (!p.dead) {
        for (const o of s.obstacles) {
          const px1 = p.x - 14, px2 = p.x + 14;
          const py1 = p.y - 34, py2 = p.y;
          if (px2 > o.x + 3 && px1 < o.x + o.w - 3 && py2 > o.y + 3 && py1 < o.y + o.h - 3) {
            p.dead = true;
            setScore(Math.floor(s.score));
            setHighScore(h => Math.max(h, Math.floor(s.score)));
            setPhase('dead');
          }
        }
      }

      // Draw
      draw(ctx, s);
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', onKey);
    };
  }, [phase, jump]);

  function draw(ctx, s) {
    const { player: p } = s;

    // Background — dark blood vessel
    ctx.fillStyle = '#060b06';
    ctx.fillRect(0, 0, W, H);

    // Scrolling grid
    ctx.strokeStyle = '#0d1a0d';
    ctx.lineWidth = 1;
    for (let x = (-s.bgOffset % 50); x < W; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Ground
    ctx.fillStyle = '#1a2e1a';
    ctx.fillRect(0, FLOOR, W, H - FLOOR);
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(0, FLOOR, W, 2);

    // ATPs (hexagonal star)
    s.atps.forEach(a => {
      if (a.collected) return;
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.fillStyle = '#ffcc00';
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 8;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⬡', 0, 4);
      ctx.restore();

      ctx.fillStyle = '#ffcc00aa';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ATP', a.x, a.y + 14);
    });

    // Obstacles
    s.obstacles.forEach(o => {
      if (o.type === 'rbc') {
        // Red blood cell — ellipse
        ctx.save();
        ctx.fillStyle = '#cc2233';
        ctx.shadowColor = '#ff4455';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.ellipse(o.x + o.w/2, o.y + o.h/2, o.w/2, o.h/2, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#ff667788';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      } else if (o.type === 'bigbac') {
        // Big bacteria
        ctx.save();
        ctx.fillStyle = '#885500';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(o.x, o.y, o.w, o.h, 8);
        ctx.fill();
        // flagella
        ctx.strokeStyle = '#cc8800';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(o.x + o.w, o.y + o.h * (0.3 + i * 0.2));
          ctx.bezierCurveTo(o.x + o.w + 15, o.y + o.h * (0.2 + i * 0.2), o.x + o.w + 20, o.y + o.h * (0.5 + i * 0.15), o.x + o.w + 10, o.y + o.h * (0.6 + i * 0.1));
          ctx.stroke();
        }
        ctx.restore();
      } else {
        // Bacteria
        ctx.save();
        ctx.fillStyle = '#664400';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.roundRect(o.x, o.y, o.w, o.h, 5);
        ctx.fill();
        ctx.restore();
      }
    });

    // Player — white blood cell
    ctx.save();
    const bobY = p.jumps === 0 ? Math.sin(p.frame * 0.25) * 2 : 0;
    const squash = p.jumps > 0 ? 1.15 : 1;

    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = p.dead ? 0 : 12;

    // Body
    ctx.fillStyle = p.dead ? '#334433' : '#00d4ff';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 18 + bobY, 14, 18 * squash, 0, 0, Math.PI*2);
    ctx.fill();

    // Nucleus
    ctx.fillStyle = p.dead ? '#223322' : '#005577';
    ctx.beginPath();
    ctx.ellipse(p.x + 2, p.y - 18 + bobY, 6, 7, 0.3, 0, Math.PI*2);
    ctx.fill();

    // Pseudopods (legs/arms) when running
    if (!p.dead && p.jumps === 0) {
      ctx.fillStyle = '#00d4ff88';
      const t = p.frame * 0.3;
      for (let i = 0; i < 3; i++) {
        const angle = t + (i / 3) * Math.PI * 2;
        const px = p.x + Math.cos(angle) * 16;
        const py = p.y - 10 + bobY + Math.sin(angle) * 8;
        ctx.beginPath();
        ctx.ellipse(px, py, 5, 4, angle, 0, Math.PI*2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Particles
    s.particles.forEach(pt => {
      ctx.globalAlpha = pt.life / 20;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;

    // HUD
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${Math.floor(s.score)}`, 10, 24);
    ctx.fillStyle = '#5a7a5a';
    ctx.font = '11px monospace';
    ctx.fillText(`SPEED: ${s.speed.toFixed(1)}x`, 10, 42);
    ctx.fillStyle = '#ffcc00';
    ctx.textAlign = 'right';
    ctx.font = '11px monospace';
    ctx.fillText('SPACE / ↑ to jump  (double jump!)', W - 10, 20);

    if (p.dead) {
      ctx.fillStyle = '#ff445588';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff4455';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DEAD', W/2, H/2 - 10);
      ctx.fillStyle = '#ffcc00';
      ctx.font = '14px monospace';
      ctx.fillText(`Score: ${Math.floor(s.score)}`, W/2, H/2 + 20);
    }
  }

  if (phase === 'start' || phase === 'dead') {
    return (
      <div className="flex flex-col items-center gap-6">
        {phase === 'dead' && (
          <div className="text-center">
            <div className="text-4xl font-bold text-[#ff4455] mb-1">DEAD</div>
            <div className="text-[#ffcc00] text-lg font-bold mb-1">Score: {score}</div>
            <div className="text-[#5a7a5a] text-sm">Best: {highScore}</div>
          </div>
        )}
        {phase === 'start' && (
          <div className="text-center">
            <div className="text-5xl mb-4">🦠</div>
            <h2 className="text-2xl font-bold text-[#00d4ff] mb-2">Cell Runner</h2>
            <p className="text-[#5a7a5a] text-sm max-w-sm leading-relaxed">
              You&apos;re a white blood cell running through a blood vessel. Dodge bacteria and red blood cells. Collect ATP for bonus points. Double jump available!
            </p>
          </div>
        )}
        <button
          onClick={() => setPhase('running')}
          className="px-8 py-3 bg-[#00d4ff] text-[#050805] font-bold rounded hover:opacity-90 transition-opacity"
        >
          {phase === 'dead' ? 'Try Again' : 'Start Running'}
        </button>
        <p className="text-[#5a7a5a] text-xs">SPACE or ↑ to jump</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-lg border border-[#1a2e1a] cursor-pointer"
        style={{ maxWidth: '100%' }}
        onClick={jump}
      />
      <p className="text-[#5a7a5a] text-xs">SPACE / ↑ to jump · tap canvas on mobile</p>
    </div>
  );
}
