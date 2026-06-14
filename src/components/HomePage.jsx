import { FlaskConical, Gamepad2, ChevronRight, Dna } from 'lucide-react';

const TERMINAL_LINES = [
  { text: '$ biolink --init', color: '#00ff88' },
  { text: '' },
  { text: '> Initializing BioLink Platform...', color: '#00d4ff' },
  { text: '> Connecting to UniProt database......... [OK]', color: '#b8cbb8' },
  { text: '> Loading AlphaFold structure models..... [OK]', color: '#b8cbb8' },
  { text: '> Syncing protein binding databases...... [OK]', color: '#b8cbb8' },
  { text: '' },
  { text: '> MISSION: Bridge high schoolers with university-level biology', color: '#ffcc00' },
  { text: '' },
  { text: '  [LIVE] Students connected ............. 1,247', color: '#00ff88' },
  { text: '  [LIVE] Proteins explored this week .... 8,432', color: '#00ff88' },
  { text: '  [LIVE] Binding pockets identified ..... 3,891', color: '#00ff88' },
  { text: '' },
  { text: '> Scanning DNA: ATCGATCGATCGGCTATCGA...', color: '#b8cbb8' },
  { text: '> Analysis complete — 4,891 base pairs mapped', color: '#b8cbb8' },
  { text: '' },
  { text: '> BioLink OS v2.4 ready. Welcome, researcher.', color: '#00d4ff' },
];

function TerminalSection() {
  return (
    <div style={{ border: '1px solid #1a2e1a', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#0d120d', borderBottom: '1px solid #1a2e1a' }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff4455' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffcc00' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#00ff88' }} />
        <span style={{ marginLeft: 8, fontSize: 11, color: '#5a7a5a' }}>biolink-os — terminal</span>
      </div>
      <div style={{ padding: 20, background: '#050805', fontSize: 13, lineHeight: '1.9' }}>
        {TERMINAL_LINES.map((line, i) => (
          <div
            key={i}
            style={{
              color: line.color || '#5a7a5a',
              opacity: 0,
              animation: `fadeIn 0.25s ease ${(i * 0.18).toFixed(2)}s both`,
            }}
          >
            {line.text || ' '}
          </div>
        ))}
        <div style={{
          opacity: 0,
          animation: `fadeIn 0.25s ease ${(TERMINAL_LINES.length * 0.18 + 0.1).toFixed(2)}s both`,
          color: '#00ff88',
        }}>
          <span style={{ animation: 'blink 1s step-end infinite' }}>&#x2588;</span>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: '🔍',
    title: 'Search UniProt',
    desc: 'Find any protein by name, gene symbol, or accession ID across all organisms.',
  },
  {
    icon: '🧬',
    title: '3D Structure Viewer',
    desc: 'Instantly load AI-predicted protein structures from AlphaFold with confidence scoring.',
  },
  {
    icon: '🎯',
    title: 'Binding Pocket Analysis',
    desc: 'Identify druggable binding pockets — the same analysis used in real drug discovery.',
  },
  {
    icon: '🎮',
    title: 'Biology Games',
    desc: 'Learn through play — fight viruses, run through cells, defend the nucleus.',
  },
];

export default function HomePage({ onExplore, onGames }) {
  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      {/* Hero */}
      <div className="mb-20">
        <div style={{ color: '#2a4a2a', fontSize: 12, marginBottom: 16, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          // Pre-University Biology Platform
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.15, marginBottom: 24, color: '#00ff88', fontFamily: 'Courier New, monospace' }}>
          Advanced Biology<br />
          <span style={{ color: '#00d4ff' }}>for High Schoolers.</span>
        </h1>
        <p style={{ color: '#7a9a7a', fontSize: 17, maxWidth: 560, lineHeight: 1.7, marginBottom: 40 }}>
          We connect high school students with university-level biology tools — the same
          protein databases, structure viewers, and research workflows used by real scientists.
          No gatekeeping. Just science.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button
            onClick={onExplore}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#00ff88', color: '#050805', fontWeight: 700, fontSize: 13, border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            <FlaskConical size={16} />
            Open Explorer
            <ChevronRight size={16} />
          </button>
          <button
            onClick={onGames}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'transparent', color: '#00d4ff', fontWeight: 700, fontSize: 13, border: '1px solid #1a2e1a', borderRadius: 6, cursor: 'pointer' }}
          >
            <Gamepad2 size={16} />
            Play Games
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div className="mb-20">
        <div style={{ color: '#2a4a2a', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
          // system output
        </div>
        <TerminalSection />
      </div>

      {/* Feature grid */}
      <div>
        <div style={{ color: '#2a4a2a', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 24 }}>
          // what we offer
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {FEATURES.map(f => (
            <div
              key={f.title}
              style={{ border: '1px solid #1a2e1a', borderRadius: 8, padding: 20, background: '#0d120d' }}
            >
              <div style={{ fontSize: 24, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ color: '#00ff88', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: '#5a7a5a', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA bottom */}
      <div style={{ marginTop: 80, border: '1px solid #1a2e1a', borderRadius: 8, padding: 40, textAlign: 'center', background: '#0d120d' }}>
        <Dna size={32} color="#00ff88" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ color: '#00ff88', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Ready to explore?</h2>
        <p style={{ color: '#5a7a5a', fontSize: 13, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
          Search any protein, visualize its structure, and identify binding pockets — all free, all powered by public research data.
        </p>
        <button
          onClick={onExplore}
          style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #00ff88', color: '#00ff88', fontSize: 13, fontWeight: 700, borderRadius: 6, cursor: 'pointer' }}
        >
          Start Exploring →
        </button>
      </div>
    </main>
  );
}
