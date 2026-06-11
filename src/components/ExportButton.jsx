import { Download } from 'lucide-react';

export default function ExportButton({ pockets, proteinName, uniprotId }) {
  function exportCSV() {
    const header = 'ResidueNumber,ResidueName,ChainId,pLDDT_Score,AminoAcidType';
    const AA_TYPE = {
      ALA: 'nonpolar', ARG: 'positive', ASN: 'polar', ASP: 'negative', CYS: 'special',
      GLN: 'polar', GLU: 'negative', GLY: 'special', HIS: 'positive', ILE: 'nonpolar',
      LEU: 'nonpolar', LYS: 'positive', MET: 'nonpolar', PHE: 'aromatic', PRO: 'special',
      SER: 'polar', THR: 'polar', TRP: 'aromatic', TYR: 'aromatic', VAL: 'nonpolar',
    };
    const rows = pockets.map(p =>
      [p.resSeq, p.resName, p.chainId || 'A', p.bFactor.toFixed(1), AA_TYPE[p.resName] || 'unknown'].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${uniprotId || proteinName}_pockets.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportFASTA() {
    const seq = pockets.map(p => {
      const one = { ALA:'A',ARG:'R',ASN:'N',ASP:'D',CYS:'C',GLN:'Q',GLU:'E',GLY:'G',HIS:'H',ILE:'I',
                    LEU:'L',LYS:'K',MET:'M',PHE:'F',PRO:'P',SER:'S',THR:'T',TRP:'W',TYR:'Y',VAL:'V' };
      return one[p.resName] || 'X';
    }).join('');
    const fasta = `>${uniprotId || proteinName} predicted pocket residues (pLDDT 60-90)\n${seq}\n`;
    const blob = new Blob([fasta], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${uniprotId || proteinName}_pocket_residues.fasta`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!pockets || pockets.length === 0) return null;

  return (
    <div className="flex gap-2">
      <button
        onClick={exportCSV}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-colors"
      >
        <Download className="w-3 h-3" /> CSV
      </button>
      <button
        onClick={exportFASTA}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-colors"
      >
        <Download className="w-3 h-3" /> FASTA
      </button>
    </div>
  );
}
