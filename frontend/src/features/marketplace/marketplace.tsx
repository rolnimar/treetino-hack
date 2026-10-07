import { VictronDemos } from '../victron/victron-demos';
import type { VictronDemoItem } from '../victron/victron-types';

interface MarketplaceProps {
  onSelectAsset?: (siteId: number) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  onBackProject?: (demo: VictronDemoItem) => void;
}

export function Marketplace({
  onSelectAsset,
  searchQuery,
  onClearSearch,
  onBackProject,
}: MarketplaceProps = {}) {
  return (
    <div id="trees" aria-label="Public energy marketplace" className="py-2">
      <VictronDemos
        onSelectAsset={onSelectAsset}
        searchQuery={searchQuery}
        onClearSearch={onClearSearch}
        onBackProject={onBackProject}
      />
    </div>
  );
}
