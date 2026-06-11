// ChEMBL API — free, no key required
// Find known drugs/compounds that target a given UniProt protein
const CHEMBL_BASE = 'https://www.ebi.ac.uk/chembl/api/data';

export async function getDrugsForTarget(uniprotId) {
  // First get the ChEMBL target ID
  const targetUrl = `${CHEMBL_BASE}/target.json?target_components__accession=${uniprotId}&limit=1`;
  const targetRes = await fetch(targetUrl);
  if (!targetRes.ok) return [];
  const targetData = await targetRes.json();
  const targets = targetData.targets || [];
  if (targets.length === 0) return [];

  const chemblId = targets[0].target_chembl_id;
  // Get approved drugs (max clinical phase = 4)
  const actUrl = `${CHEMBL_BASE}/mechanism.json?target_chembl_id=${chemblId}&limit=20`;
  const actRes = await fetch(actUrl);
  if (!actRes.ok) return [];
  const actData = await actRes.json();
  return (actData.mechanisms || []).map(m => ({
    name: m.mechanism_of_action,
    moleculeId: m.molecule_chembl_id,
    actionType: m.action_type,
    url: `https://www.ebi.ac.uk/chembl/compound_report_card/${m.molecule_chembl_id}/`,
  }));
}
