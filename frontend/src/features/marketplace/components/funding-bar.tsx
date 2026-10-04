import { formatTokenAmount } from '../../../chain/amounts';

export function FundingBar({
  raised,
  target,
}: {
  raised: string;
  target: string;
}) {
  const goal = BigInt(target);
  const basisPoints = goal > 0n ? Number((BigInt(raised) * 10_000n) / goal) : 0;
  const percent = Math.min(100, Math.max(0, basisPoints / 100));
  return (
    <div className="my-5 space-y-2">
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <span>
          {formatTokenAmount(raised)} / {formatTokenAmount(target)} mockUSDC
        </span>
        <span className="font-semibold">{percent}% funded</span>
      </div>
      <div
        role="progressbar"
        aria-label="Tree funding"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-3 overflow-hidden rounded-full bg-forest/10"
      >
        <div
          className="h-full rounded-full bg-leaf transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
