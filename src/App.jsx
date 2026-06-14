import { useDarkMode } from './hooks/useDarkMode';
import DarkToggle from './components/DarkToggle';
import { useState } from 'react';
import { Dna, ExternalLink, Loader, AlertTriangle, Gamepad2, FlaskConical } from 'lucide-react';
import SearchBar from './components/SearchBar';
import ProteinCard from './components/ProteinCard';
import StructureViewer from './components/StructureViewer';
import PocketPanel from './components/PocketPanel';
import ConfidenceChart from './components/ConfidenceChart';
import ProteinGame from './components/ProteinGame';
import { searchUniProt, getAlphaFoldStructure, fetchPDBFile, parsePDB, computePocketHeuristic, esmFoldFromSequence, getUniProtSequence } from './utils/api';

export default function App() {
  const [dark, toggleDark] = useDarkMode();
  const [appMode, setAppMode] = useState('explorer'); // 'explorer' | 'game'
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedProtein, setSelectedProtein] = useState(null);
  const [structureData, setStructureData] = useState(null);
  const [pockets, setPockets] = useState(null);
  const [allAtoms, setAllAtoms] = useState(null);
  const [structureSource, setStructureSource] = useState(null); // 'alphafold' | 'esmfold'
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch(query) {
    setSearching(true);
    setError(null);
    setResults(null);
    setSelectedProtein(null);
    setStructureData(null);
    setPockets(null);
    try {
      const data = await searchUniProt(query);
      setResults(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleSelectProtein(protein) {
    setSelectedProtein(protein);
    setStructureData(null);
    setPockets(null);
    setLoadingStructure(true);
    setError(null);
    try {
      const accession = protein.primaryAccession;
      let pdbText;
      try {
        const afData = await getAlphaFoldStructure(accession);
        if (!afData || !afData[0]) throw new Error('no alphafold');
        const entry = afData[0];
        setStructureData(entry);
        setStructureSource('alphafold');
        pdbText = await fetchPDBFile(entry.pdbUrl);
      } catch {
        // AlphaFold not available — try ESMFold on the UniProt sequence
        setStructureSource('esmfold');
        const seq = await getUniProtSequence(accession);
        pdbText = await esmFoldFromSequence(seq);
        const blob = new Blob([pdbText], { type: 'text/plain' });
        const blobUrl = URL.createObjectURL(blob);
        setStructureData({ pdbUrl: blobUrl, uniprotAccession: accession });
      }
      const atoms = parsePDB(pdbText);
      setAllAtoms(atoms);
      const computedPockets = computePocketHeuristic(atoms);
      setPockets(computedPockets);
    } catch (err) {
      setError('Structure error: ' + err.message);
    } finally {
      setLoadingStructure(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Dna className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-none">Structure & Target Explorer</h1>
              <p className="text-xs text-gray-400 mt-0.5">AlphaFold · UniProt · PDB</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setAppMode('explorer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${appMode === 'explorer' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                <FlaskConical className="w-3 h-3" /> Explorer
              </button>
              <button
                onClick={() => setAppMode('game')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${appMode === 'game' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                <Gamepad2 className="w-3 h-3" /> Hero Game
              </button>
            </div>
            <a href="https://alphafold.ebi.ac.uk" target="_blank" rel="noopener noreferrer"
               className="text-xs text-gray-400 hover:text-indigo-500 flex items-center gap-1">
              AlphaFold <ExternalLink className="w-3 h-3" />
            </a>
            <DarkToggle dark={dark} toggle={toggleDark} />
          </div>
        </div>
      </header>

      {appMode === 'game' && (
        <main className="max-w-7xl mx-auto px-4 py-8">
          <ProteinGame />
        </main>
      )}
      {appMode === 'explorer' && <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Explore Protein Structures & Binding Pockets
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm">
            Search any protein, visualize its 3D structure from AlphaFold, and identify likely druggable binding pockets — all using free, public data.
          </p>
        </div>

        <SearchBar onSearch={handleSearch} loading={searching} />

        {error && (
          <div className="mt-4 max-w-2xl mx-auto flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {results !== null && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {results.length} protein{results.length !== 1 ? 's' : ''} found
              </h3>
              {results.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No proteins found. Try a different query.</p>
              )}
              {results.map(p => (
                <ProteinCard
                  key={p.primaryAccession}
                  protein={p}
                  onSelect={handleSelectProtein}
                  selected={selectedProtein?.primaryAccession === p.primaryAccession}
                />
              ))}
            </div>

            <div className="lg:col-span-2">
              {!selectedProtein && (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                  <Dna className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-400 text-sm">Select a protein to view its 3D structure</p>
                </div>
              )}
              {selectedProtein && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">
                      {selectedProtein.proteinDescription?.recommendedName?.fullName?.value || selectedProtein.uniProtkbId}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <a href={"https://www.uniprot.org/uniprot/" + selectedProtein.primaryAccession}
                         target="_blank" rel="noopener noreferrer"
                         className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                        UniProt {selectedProtein.primaryAccession} <ExternalLink className="w-3 h-3" />
                      </a>
                      {structureData?.pdbUrl && (
                        <a href={structureData.pdbUrl} target="_blank" rel="noopener noreferrer"
                           className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                          Download PDB <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {structureSource === 'esmfold' && (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                          ESMFold prediction (AlphaFold not available)
                        </span>
                      )}
                      {structureSource === 'alphafold' && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                          AlphaFold structure
                        </span>
                      )}
                    </div>
                  </div>

                  {loadingStructure && (
                    <div className="flex items-center justify-center gap-2 py-16">
                      <Loader className="w-6 h-6 text-indigo-500 animate-spin" />
                      <span className="text-sm text-gray-500">Loading AlphaFold structure…</span>
                    </div>
                  )}

                  {!loadingStructure && structureData && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                      <div className="xl:col-span-2 h-[450px]">
                        <StructureViewer pdbUrl={structureData.pdbUrl} pockets={pockets} />
                      </div>
                      <div className="xl:col-span-1 h-[450px]">
                        <PocketPanel pockets={pockets} proteinName={selectedProtein.uniProtkbId} uniprotId={selectedProtein.primaryAccession} />
                      </div>
                    </div>
                  )}

                  {allAtoms && <ConfidenceChart atoms={allAtoms} />}

                  <p className="text-xs text-gray-400 text-center bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-lg p-2">
                    Pocket predictions are heuristic estimates based on pLDDT confidence scores. Not a validated docking analysis.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {results === null && !searching && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { title: 'Search UniProt', desc: 'Find any human or model organism protein by name, gene symbol, or accession ID', icon: '🔍' },
              { title: 'View AlphaFold Structure', desc: 'Instantly load the AI-predicted 3D structure with color-coded confidence scores', icon: '🧬' },
              { title: 'Identify Binding Pockets', desc: 'Highlight residues likely to form druggable pockets based on structural properties', icon: '🎯' },
            ].map(f => (
              <div key={f.title} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-center">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm">{f.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>}
    </div>
  );
}
