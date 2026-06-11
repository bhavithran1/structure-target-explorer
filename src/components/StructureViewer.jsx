import { useEffect, useRef, useState } from 'react';
import { Loader, AlertTriangle, Info } from 'lucide-react';

// Uses NGL Viewer for 3D protein visualization
export default function StructureViewer({ pdbUrl, pockets, onReady }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('cartoon');

  useEffect(() => {
    if (!pdbUrl || !containerRef.current) return;
    setLoading(true);
    setError(null);

    let stage;
    async function loadNGL() {
      try {
        const NGL = await import('ngl');
        if (stageRef.current) {
          stageRef.current.dispose();
        }
        stage = new NGL.Stage(containerRef.current, {
          backgroundColor: 'white',
          cameraType: 'perspective',
        });
        stageRef.current = stage;

        const component = await stage.loadFile(pdbUrl, { ext: 'pdb', defaultRepresentation: false });

        // Main cartoon representation colored by B-factor (pLDDT)
        component.addRepresentation('cartoon', {
          colorScheme: 'bfactor',
          colorScale: 'RdYlGn',
          colorReverse: false,
          opacity: 0.9,
        });

        // Highlight pocket residues as balls
        if (pockets && pockets.length > 0) {
          const pocketResidues = pockets.map(p => p.resSeq).join(',');
          component.addRepresentation('ball+stick', {
            sele: pocketResidues,
            colorValue: '#ff6600',
            opacity: 0.85,
            scale: 0.6,
          });
        }

        stage.autoView();
        setLoading(false);
        onReady && onReady(stage);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    loadNGL();

    return () => {
      if (stageRef.current) stageRef.current.dispose();
    };
  }, [pdbUrl]);

  function changeView(mode) {
    if (!stageRef.current) return;
    setViewMode(mode);
    const component = stageRef.current.compList[0];
    if (!component) return;
    component.removeAllRepresentations();
    const repMap = {
      cartoon: { repr: 'cartoon', opts: { colorScheme: 'bfactor', colorScale: 'RdYlGn' } },
      surface: { repr: 'surface', opts: { colorScheme: 'electrostatic', opacity: 0.8 } },
      licorice: { repr: 'licorice', opts: { colorScheme: 'element' } },
      spacefill: { repr: 'spacefill', opts: { colorScheme: 'bfactor', colorScale: 'RdYlGn' } },
    };
    const { repr, opts } = repMap[mode] || repMap.cartoon;
    component.addRepresentation(repr, opts);

    if (pockets && pockets.length > 0) {
      const sel = pockets.map(p => p.resSeq).join(',');
      component.addRepresentation('ball+stick', { sele: sel, colorValue: '#ff6600', scale: 0.6 });
    }
    stageRef.current.autoView();
  }

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-white/80 dark:bg-gray-900/80">
          <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-gray-500">Loading 3D structure…</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 p-6">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
          <p className="text-sm text-gray-500 text-center">{error}</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full min-h-[400px]" />

      {/* View mode controls */}
      {!loading && !error && (
        <div className="absolute bottom-3 left-3 flex gap-1 z-10">
          {['cartoon', 'surface', 'licorice', 'spacefill'].map(mode => (
            <button
              key={mode}
              onClick={() => changeView(mode)}
              className={`text-xs px-2 py-1 rounded capitalize font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:bg-indigo-50'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      )}

      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 rounded-lg px-2 py-1">
        <div className="w-2 h-2 rounded-full bg-orange-500" />
        <span className="text-xs text-gray-600 dark:text-gray-300">Predicted pockets</span>
      </div>

      <div className="absolute top-3 left-3 z-10 bg-white/90 dark:bg-gray-800/90 rounded-lg px-2 py-1">
        <Info className="w-3 h-3 inline mr-1 text-gray-400" />
        <span className="text-xs text-gray-500">Green = high confidence (pLDDT)</span>
      </div>
    </div>
  );
}
