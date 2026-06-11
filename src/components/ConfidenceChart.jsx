import { Info } from 'lucide-react';

const BANDS = [
  { min: 90, max: 100, label: 'Very high (>90)', color: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-400', desc: 'Highly reliable — confident backbone prediction' },
  { min: 70, max: 90, label: 'Confident (70–90)', color: 'bg-cyan-400', textColor: 'text-cyan-700 dark:text-cyan-400', desc: 'Generally good — small errors possible in side chains' },
  { min: 50, max: 70, label: 'Low (50–70)', color: 'bg-amber-400', textColor: 'text-amber-700 dark:text-amber-400', desc: 'Treat with caution — may be intrinsically disordered' },
  { min: 0, max: 50, label: 'Very low (<50)', color: 'bg-orange-400', textColor: 'text-orange-700 dark:text-orange-400', desc: 'Likely disordered — not suitable for drug binding' },
];

export default function ConfidenceChart({ atoms }) {
  if (!atoms || atoms.length === 0) return null;

  const residues = [];
  const seen = new Set();
  for (const a of atoms) {
    const key = `${a.chainId}-${a.resSeq}`;
    if (!seen.has(key)) {
      seen.add(key);
      residues.push({ resSeq: a.resSeq, plddt: a.bFactor, chainId: a.chainId });
    }
  }
  residues.sort((a, b) => a.resSeq - b.resSeq);
  const total = residues.length;

  const counts = BANDS.map(b => ({
    ...b,
    count: residues.filter(r => r.plddt >= b.min && r.plddt < b.max).length,
  }));

  const avg = residues.reduce((s, r) => s + r.plddt, 0) / total;

  // Spark-line: group residues into ~100 buckets for histogram
  const buckets = 60;
  const bucketSize = Math.max(1, Math.floor(total / buckets));
  const sparkData = [];
  for (let i = 0; i < total; i += bucketSize) {
    const slice = residues.slice(i, i + bucketSize);
    sparkData.push(slice.reduce((s, r) => s + r.plddt, 0) / slice.length);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
          AlphaFold Model Confidence
        </h4>
        <span className="text-xs font-medium text-gray-500">
          Avg pLDDT: <strong className={avg >= 70 ? 'text-green-600' : avg >= 50 ? 'text-amber-500' : 'text-orange-500'}>{avg.toFixed(1)}</strong>
        </span>
      </div>

      {/* Sparkline */}
      <div className="flex items-end gap-px h-12 mb-4 overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-700/50 px-2 py-1">
        {sparkData.map((val, i) => {
          const h = Math.max(4, Math.round((val / 100) * 40));
          const color = val >= 90 ? '#3b82f6' : val >= 70 ? '#22d3ee' : val >= 50 ? '#fbbf24' : '#fb923c';
          return (
            <div key={i} title={`~${Math.round(val)}`}
              style={{ height: h, backgroundColor: color, flex: '1 1 0', minWidth: 1, borderRadius: 2 }}
            />
          );
        })}
      </div>

      {/* Band breakdown */}
      <div className="space-y-2">
        {counts.map(b => {
          const pct = total > 0 ? (b.count / total) * 100 : 0;
          return (
            <div key={b.label}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className={b.textColor + ' font-medium'}>{b.label}</span>
                <span className="text-gray-500">{b.count} residues ({pct.toFixed(0)}%)</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div className={`h-2 rounded-full ${b.color} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-1 mt-3">
        <Info className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-400">pLDDT = predicted Local Distance Difference Test. Scores from AlphaFold B-factor column. Pocket residues use the 60–90 range (surface-exposed structured regions).</p>
      </div>
    </div>
  );
}
