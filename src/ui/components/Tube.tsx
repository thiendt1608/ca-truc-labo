import type { ReactNode } from 'react';
import { getContent, type ContainerId, type Defect } from '../../sim';

const SERUM = '#f4d27a';
function serumColor(defects: Defect[]): string {
  const hemo = defects.find((d) => d.kind === 'hemolysis');
  if (hemo) return ['#f2b6a8', '#e57c6e', '#c0392b'][hemo.level - 1]!;
  if (defects.some((d) => d.kind === 'lipemia')) return '#f5f1e8';
  if (defects.some((d) => d.kind === 'icterus')) return '#c97a06';
  return SERUM;
}

/** Màu bệnh phẩm bên trong lọ (chỉ để vẽ, không phải luật chuyên môn). */
const CUP_FILL: Partial<Record<ContainerId, string>> = { urine: '#f1cf4a', stool: '#8d6e63' };

/**
 * Ống/lọ/chai/que vẽ đơn giản: nắp màu + chữ cái (màu không phải thông tin duy nhất), thân bệnh phẩm.
 * Chưa có ảnh thật: mỗi dạng (`kind` trong content/common/containers.json) có một hình SVG riêng.
 */
export function Tube({
  container,
  spun = false,
  defects = [],
  size = 44,
  underfill = false,
  leak = false,
}: {
  container: ContainerId;
  spun?: boolean;
  defects?: Defect[];
  size?: number;
  underfill?: boolean;
  leak?: boolean;
}) {
  const c = getContent().containers.find((x) => x.id === container)!;
  const label = `${c.name} (${c.letter})${leak ? ', đang rò rỉ' : ''}`;
  const draw = (node: ReactNode) =>
    leak ? (
      <span className="tube-wrap">
        {node}
        <span className="tube-leak" aria-hidden>
          💧
        </span>
      </span>
    ) : (
      node
    );

  if (c.kind === 'cup') {
    const top = underfill ? 34 : 24;
    const dx = (top - 24) * 0.1;
    return draw(
      <svg width={size} height={size * 1.2} viewBox="0 0 40 48" role="img" aria-label={label}>
        <path d="M8 12 L12 44 H28 L32 12 Z" fill="#fff8dc" stroke="#8a96a3" strokeWidth="1.5" />
        <path
          d={`M${10 + dx} ${top} L12 44 H28 L${30 - dx} ${top} Z`}
          fill={CUP_FILL[container] ?? '#f1cf4a'}
        />
        <rect x="6" y="4" width="28" height="9" rx="3" fill={c.color} stroke="#00000033" />
        <text x="20" y="36" textAnchor="middle" fontSize="11" fontWeight="700" fill="#5d534a">
          {c.letter}
        </text>
      </svg>,
    );
  }
  if (c.kind === 'swab') {
    const top = underfill ? 40 : 32;
    return draw(
      <svg width={size} height={size * 1.6} viewBox="0 0 40 64" role="img" aria-label={label}>
        <line x1="20" y1="1" x2="20" y2="14" stroke="#b08a5b" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="12" y="14" width="16" height="46" rx="7" fill="#ffffff" stroke="#8a96a3" strokeWidth="1.5" />
        <rect x="13" y={top} width="14" height={59 - top} rx="6" fill="#bfe9e0" />
        <rect x="9" y="10" width="22" height="10" rx="3" fill={c.color} stroke="#00000033" />
        <text x="20" y="52" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2d6a5f">
          {c.letter}
        </text>
      </svg>,
    );
  }
  if (c.kind === 'bottle') {
    const top = underfill ? 46 : 34;
    return draw(
      <svg width={size} height={size * 1.6} viewBox="0 0 40 64" role="img" aria-label={label}>
        <path
          d="M15 12 H25 V22 Q33 24 33 32 V56 Q33 61 28 61 H12 Q7 61 7 56 V32 Q7 24 15 22 Z"
          fill="#ffffff"
          stroke="#8a96a3"
          strokeWidth="1.5"
        />
        <path d={`M8 ${top} H32 V56 Q32 60 28 60 H12 Q8 60 8 56 Z`} fill="#d9a441" />
        <rect x="12" y="3" width="16" height="10" rx="3" fill={c.color} stroke="#00000033" />
        <text x="20" y="54" textAnchor="middle" fontSize="11" fontWeight="700" fill="#5d534a">
          {c.letter}
        </text>
      </svg>,
    );
  }
  if (c.kind === 'jar') {
    const top = underfill ? 28 : 18;
    return draw(
      <svg width={size} height={size * 1.2} viewBox="0 0 40 48" role="img" aria-label={label}>
        <rect x="5" y="13" width="30" height="31" rx="6" fill="#ffffff" stroke="#8a96a3" strokeWidth="1.5" />
        <rect x="6" y={top} width="28" height={43 - top} rx="5" fill="#e3f1f6" />
        <ellipse cx="20" cy="34" rx="8" ry="5" fill="#d98ca0" stroke="#b5657b" />
        <rect x="3" y="5" width="34" height="10" rx="3" fill={c.color} stroke="#00000033" />
        <text x="20" y="13" textAnchor="middle" fontSize="9" fontWeight="700" fill="#ffffff">
          {c.letter}
        </text>
      </svg>,
    );
  }
  const h = size * 1.6;
  const fillTop = underfill ? 0.62 : 0.32;
  return draw(
    <svg width={size} height={h} viewBox="0 0 40 64" role="img" aria-label={label}>
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
    </svg>,
  );
}
