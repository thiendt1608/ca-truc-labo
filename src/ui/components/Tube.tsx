import { getContent, type ContainerId, type Defect } from '../../sim';

const SERUM = '#f4d27a';
function serumColor(defects: Defect[]): string {
  const hemo = defects.find((d) => d.kind === 'hemolysis');
  if (hemo) return ['#f2b6a8', '#e57c6e', '#c0392b'][hemo.level - 1]!;
  if (defects.some((d) => d.kind === 'lipemia')) return '#f5f1e8';
  if (defects.some((d) => d.kind === 'icterus')) return '#c97a06';
  return SERUM;
}

/** Ống máu vẽ đơn giản: nắp màu + chữ cái (màu không phải thông tin duy nhất), thân máu hoặc đã tách lớp. */
export function Tube({
  container,
  spun = false,
  defects = [],
  size = 44,
  underfill = false,
}: {
  container: ContainerId;
  spun?: boolean;
  defects?: Defect[];
  size?: number;
  underfill?: boolean;
}) {
  const c = getContent().containers.find((x) => x.id === container)!;
  if (c.kind === 'cup') {
    return (
      <svg
        width={size}
        height={size * 1.2}
        viewBox="0 0 40 48"
        role="img"
        aria-label={`${c.name} (${c.letter})`}
      >
        <path d="M8 12 L12 44 H28 L32 12 Z" fill="#fff8dc" stroke="#8a96a3" strokeWidth="1.5" />
        <path d="M10 24 L12 44 H28 L30 24 Z" fill="#f1cf4a" />
        <rect x="6" y="4" width="28" height="9" rx="3" fill={c.color} stroke="#00000033" />
        <text x="20" y="36" textAnchor="middle" fontSize="11" fontWeight="700" fill="#5d534a">
          {c.letter}
        </text>
      </svg>
    );
  }
  const h = size * 1.6;
  const fillTop = underfill ? 0.62 : 0.32;
  return (
    <svg width={size} height={h} viewBox="0 0 40 64" role="img" aria-label={`${c.name} (${c.letter})`}>
      <rect x="10" y="12" width="20" height="48" rx="9" fill="#ffffff" stroke="#8a96a3" strokeWidth="1.5" />
      {spun ? (
        <>
          <rect
            x="11"
            y={64 * fillTop}
            width="18"
            height={64 * (0.55 - fillTop) + 10}
            fill={serumColor(defects)}
          />
          <rect x="11" y="45" width="18" height="14" rx="8" fill="#8e1b1b" />
        </>
      ) : (
        <rect x="11" y={64 * fillTop} width="18" height={60 - 64 * fillTop} rx="8" fill="#a31f1f" />
      )}
      <rect x="7" y="2" width="26" height="13" rx="3" fill={c.color} stroke="#00000033" />
      <text x="20" y="12" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff">
        {c.letter}
      </text>
    </svg>
  );
}
