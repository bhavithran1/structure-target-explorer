import { Dna, ChevronRight, Star } from 'lucide-react';

const DISEASE_KEYWORDS = {
  cancer: ['tumor', 'oncogen', 'cancer', 'carcinoma', 'leukemia', 'lymphoma', 'melanoma', 'glioma'],
  neurological: ['neuron', 'alzheimer', 'parkinson', 'neurodegenerat', 'brain', 'synuclein', 'tau'],
  cardiovascular: ['cardiac', 'heart', 'atheroscler', 'thrombosis', 'platelet'],
  infectious: ['virus', 'viral', 'bacterial', 'pathogen', 'infect'],
  metabolic: ['diabetes', 'insulin', 'metabolic', 'obesity', 'lipid'],
};

function getDiseaseTag(protein) {
  const text = (protein.proteinDescription?.recommendedName?.fullName?.value || '').toLowerCase()
    + (protein.comments || []).map(c => c.texts?.map(t => t.value).join(' ') || '').join(' ').toLowerCase();

  for (const [disease, keywords] of Object.entries(DISEASE_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) return disease;
  }
  return null;
}

const diseaseColors = {
  cancer: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  neurological: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  cardiovascular: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  infectious: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  metabolic: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function ProteinCard({ protein, onSelect, selected }) {
  const name = protein.proteinDescription?.recommendedName?.fullName?.value || protein.uniProtkbId;
  const gene = protein.genes?.[0]?.geneName?.value || '';
  const organism = protein.organism?.scientificName || '';
  const accession = protein.primaryAccession;
  const length = protein.sequence?.length;
  const reviewed = protein.entryType === 'UniProtKB reviewed (Swiss-Prot)';
  const diseaseTag = getDiseaseTag(protein);

  return (
    <button
      onClick={() => onSelect(protein)}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-600'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg shrink-0">
            <Dna className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{name}</span>
              {reviewed && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" title="Swiss-Prot reviewed" />}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {gene && <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{gene}</span>}
              <span className="text-xs text-gray-400">{accession}</span>
              {length && <span className="text-xs text-gray-400">{length} aa</span>}
            </div>
            <p className="text-xs text-gray-400 mt-1 italic">{organism}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {diseaseTag && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${diseaseColors[diseaseTag]}`}>
              {diseaseTag}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </button>
  );
}
