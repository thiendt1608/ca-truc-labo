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
