import { Target, TrendingUp, Info } from 'lucide-react';
import DrugPanel from './DrugPanel';
import ExportButton from './ExportButton';

const AA_PROPERTIES = {
  ALA: { type: 'nonpolar', abbr: 'A' }, ARG: { type: 'positive', abbr: 'R' },
  ASN: { type: 'polar', abbr: 'N' }, ASP: { type: 'negative', abbr: 'D' },
  CYS: { type: 'special', abbr: 'C' }, GLN: { type: 'polar', abbr: 'Q' },
  GLU: { type: 'negative', abbr: 'E' }, GLY: { type: 'special', abbr: 'G' },
  HIS: { type: 'positive', abbr: 'H' }, ILE: { type: 'nonpolar', abbr: 'I' },
  LEU: { type: 'nonpolar', abbr: 'L' }, LYS: { type: 'positive', abbr: 'K' },
  MET: { type: 'nonpolar', abbr: 'M' }, PHE: { type: 'aromatic', abbr: 'F' },
  PRO: { type: 'special', abbr: 'P' }, SER: { type: 'polar', abbr: 'S' },
  THR: { type: 'polar', abbr: 'T' }, TRP: { type: 'aromatic', abbr: 'W' },
  TYR: { type: 'aromatic', abbr: 'Y' }, VAL: { type: 'nonpolar', abbr: 'V' },
};

const typeColors = {
  nonpolar: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  polar: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  positive: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  negative: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  aromatic: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  special: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function druggabilityScore(pockets) {
  if (!pockets.length) return 0;
  const avgPLDDT = pockets.reduce((s, p) => s + p.bFactor, 0) / pockets.length;
  const aromatic = pockets.filter(p => AA_PROPERTIES[p.resName]?.type === 'aromatic').length;
  const hydrophobic = pockets.filter(p => AA_PROPERTIES[p.resName]?.type === 'nonpolar').length;
  // Heuristic: aromatic + hydrophobic residues in medium-confidence region = druggable
  return Math.min(100, Math.round((aromatic * 5 + hydrophobic * 2 + avgPLDDT * 0.3)));
}

export default function PocketPanel({ pockets, proteinName, uniprotId }) {
  if (!pockets) return null;

  const score = druggabilityScore(pockets);
  const scoreColor = score > 70 ? 'text-green-600' : score > 40 ? 'text-amber-500' : 'text-red-500';
  const scoreLabel = score > 70 ? 'High' : score > 40 ? 'Moderate' : 'Low';

  const byType = pockets.reduce((acc, p) => {
    const type = AA_PROPERTIES[p.resName]?.type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 h-full overflow-auto">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Binding Pocket Analysis</h3>
      </div>

      {pockets.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No pocket residues detected</p>
      ) : (
        <>
          {/* Druggability score */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Estimated Druggability</span>
              <span className={`text-sm font-bold ${scoreColor}`}>{scoreLabel} ({score}/100)</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${score > 70 ? 'bg-green-500' : score > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="flex items-start gap-1 mt-2">
              <Info className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-400">Heuristic based on pLDDT confidence, aromatic, and hydrophobic residue density. Not a validated drug prediction.</p>
            </div>
          </div>

          {/* Residue type breakdown */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Residue composition ({pockets.length} residues)</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(byType).map(([type, count]) => (
                <span key={type} className={`text-xs px-2 py-0.5 rounded-full capitalize ${typeColors[type] || typeColors.special}`}>
                  {type}: {count}
                </span>
              ))}
            </div>
          </div>

          {/* Residue list */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Top pocket residues by confidence
            </p>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {pockets.slice(0, 20).map(p => {
                const aa = AA_PROPERTIES[p.resName];
                return (
                  <div key={p.resSeq} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 flex items-center justify-center rounded font-mono font-bold text-xs ${typeColors[aa?.type || 'other']}`}>
                        {aa?.abbr || p.resName.slice(0, 1)}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{p.resName} {p.resSeq}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-12 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${p.bFactor}%` }} />
                      </div>
                      <span className="text-gray-400 w-8 text-right">{Math.round(p.bFactor)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-400">Export pocket data</span>
        <ExportButton pockets={pockets} proteinName={proteinName} uniprotId={uniprotId} />
      </div>

      <DrugPanel uniprotId={uniprotId} />
    </div>
  );
}
