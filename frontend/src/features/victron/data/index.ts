import type { ProjectDossier } from '../types/investor-dossier';
import { BESS_PRESTICE_DOSSIER } from './bess-prestice-dossier';
import { TREETINO_V1_DOSSIER } from './treetino-v1-dossier';
import { EV_HUB_DOSSIER } from './ev-hub-dossier';
import { OFFGRID_HOMESTEAD_DOSSIER } from './offgrid-homestead-dossier';

export {
  BESS_PRESTICE_DOSSIER,
  TREETINO_V1_DOSSIER,
  EV_HUB_DOSSIER,
  OFFGRID_HOMESTEAD_DOSSIER,
};

export const PROJECT_DOSSIERS: Record<string, ProjectDossier> = {
  ess: BESS_PRESTICE_DOSSIER,
  '219742': BESS_PRESTICE_DOSSIER,
  'treetino-v1': TREETINO_V1_DOSSIER,
  '100001': TREETINO_V1_DOSSIER,
  ev: EV_HUB_DOSSIER,
  '374891': EV_HUB_DOSSIER,
  offgrid: OFFGRID_HOMESTEAD_DOSSIER,
  '209689': OFFGRID_HOMESTEAD_DOSSIER,
};

export function getProjectDossier(
  keyOrSiteId: string | number,
): ProjectDossier {
  const key = String(keyOrSiteId);
  return (
    PROJECT_DOSSIERS[key] ??
    PROJECT_DOSSIERS['treetino-v1'] ??
    BESS_PRESTICE_DOSSIER
  );
}
