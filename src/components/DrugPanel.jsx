import { useEffect, useState } from 'react';
import { Pill, ExternalLink, Loader, AlertCircle } from 'lucide-react';
import { getDrugsForTarget } from '../utils/chembl';

const ACTION_COLORS = {
  INHIBITOR: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ANTAGONIST: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  AGONIST: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ACTIVATOR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function DrugPanel({ uniprotId }) {
  const [drugs, setDrugs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uniprotId) return;
    setLoading(true);
    setError(null);
    getDrugsForTarget(uniprotId)
      .then(setDrugs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [uniprotId]);

  if (loading) return (
    <div className="flex items-center gap-2 text-xs text-gray-400 py-3">
      <Loader className="w-3 h-3 animate-spin" /> Loading ChEMBL data…
    </div>
  );

  if (error || !drugs || drugs.length === 0) return (
    <div className="text-xs text-gray-400 py-2 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {error ? 'ChEMBL lookup failed' : 'No known drug mechanisms in ChEMBL'}
    </div>
  );

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
        <Pill className="w-3 h-3 text-pink-500" /> Known Drug Mechanisms ({drugs.length})
      </p>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {drugs.map((d, i) => (
          <div key={i} className="flex items-start gap-2 text-xs bg-pink-50/50 dark:bg-pink-900/10 rounded-lg p-2 border border-pink-100 dark:border-pink-800/20">
            <div className="flex-1 min-w-0">
              <p className="text-gray-700 dark:text-gray-300 truncate">{d.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {d.actionType && (
                  <span className={"text-[10px] px-1.5 py-0.5 rounded capitalize " + (ACTION_COLORS[d.actionType] || 'bg-gray-100 text-gray-600')}>
                    {d.actionType}
                  </span>
                )}
                <a href={d.url} target="_blank" rel="noopener noreferrer"
                   className="text-pink-600 hover:underline flex items-center gap-0.5">
                  {d.moleculeId} <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
