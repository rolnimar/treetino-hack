export type ConduitFlowType =
  | 'emerald'
  | 'amber'
  | 'sky'
  | 'rose'
  | 'gold'
  | 'reverse-gold'
  | 'reverse-emerald'
  | 'reverse-sky'
  | 'reverse-rose';

export interface ConduitLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  flow?: ConduitFlowType | false | null;
  fundsFlow?: ConduitFlowType | false | null;
}

const FLOW_CLASSES: Record<ConduitFlowType, string> = {
  emerald: 'vrm-flow-emerald',
  amber: 'vrm-flow-amber',
  sky: 'vrm-flow-sky',
  rose: 'vrm-flow-rose',
  gold: 'vrm-flow-gold',
  'reverse-gold': 'vrm-flow-reverse-gold',
  'reverse-emerald': 'vrm-flow-reverse-emerald',
  'reverse-sky': 'vrm-flow-reverse-sky',
  'reverse-rose': 'vrm-flow-reverse-rose',
};

export function ConduitLine({
  x1,
  y1,
  x2,
  y2,
  flow,
  fundsFlow,
}: ConduitLineProps) {
  return (
    <g>
      {/* Outer Conduit Shield */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="vrm-conduit-outer" />
      {/* Inner Insulated Core */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="vrm-conduit-inner" />
      {/* Active Energy Pulse */}
      {flow && (
        <line x1={x1} y1={y1} x2={x2} y2={y2} className={FLOW_CLASSES[flow]} />
      )}
      {/* Active Funds Pulse */}
      {fundsFlow && (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          className={FLOW_CLASSES[fundsFlow]}
        />
      )}
    </g>
  );
}
