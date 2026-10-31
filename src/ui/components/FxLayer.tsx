import { useEffect, useRef, useState } from 'react';
import type { ContainerId } from '../../sim';
import { onFx, type Fx } from '../../store/fx';
import { Tube } from './Tube';

type Item =
  | { id: number; kind: 'stamp'; ok: boolean }
  | { id: number; kind: 'fly'; container: ContainerId; dx: number; dy: number; target: string }
  | { id: number; kind: 'trust'; delta: number; x: number; y: number };

let fxId = 0;
const STAMP_MS = 700;
const FLY_MS = 520;

/** Người chơi (hoặc máy) muốn giảm chuyển động: chỉ hiện dấu tĩnh, không bay, không rung. */
export function reducedMotion(): boolean {
  return (
    document.documentElement.classList.contains('reduce-motion') ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

/** Chỗ ống bay tới: giỏ khoa (`data-room`) hoặc thùng từ chối/liên hệ (`data-bin`). */
function targetSelector(fx: Extract<Fx, { kind: 'decision' }>): string {
  return fx.to === 'routed' && fx.target
    ? `.stations [data-room="${fx.target}"]`
    : `.stations [data-bin="${fx.to}"]`;
}

/**
 * Lớp hiệu ứng phủ cả phòng (không nhận chạm): dấu ✓/✗ to giữa màn, ống bay vào giỏ rồi giỏ nảy,
 * số Niềm tin bay lên cạnh thanh Niềm tin. Chỉ dùng transform/opacity (chạy trên compositor).
 */
export function FxLayer() {
  const layer = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const timers = new Set<number>();
    const later = (ms: number, fn: () => void) => {
      const h = window.setTimeout(() => {
        timers.delete(h);
        fn();
      }, ms);
      timers.add(h);
    };
    const add = (item: Item, ms: number) => {
      setItems((list) => [...list, item]);
      later(ms, () => setItems((list) => list.filter((x) => x.id !== item.id)));
    };
    const off = onFx((fx) => {
      const box = layer.current?.getBoundingClientRect();
      if (!box) return;
      const still = reducedMotion();
      if (fx.kind === 'trust') {
        const bar = document.querySelector('.hud .trust');
        const r = bar?.getBoundingClientRect();
        add(
          {
            id: ++fxId,
            kind: 'trust',
            delta: fx.delta,
            x: r ? r.left + r.width / 2 - box.left : box.width / 2,
            y: r ? r.bottom - box.top : 40,
          },
          1100,
        );
        if (fx.delta < 0 && bar && !still)
          bar.animate(
            [
              { transform: 'translateX(0)' },
              { transform: 'translateX(-5px)' },
              { transform: 'translateX(5px)' },
              { transform: 'translateX(-3px)' },
              { transform: 'translateX(0)' },
            ],
            { duration: 360, easing: 'ease-out' },
          );
        return;
      }
      add({ id: ++fxId, kind: 'stamp', ok: fx.ok }, STAMP_MS);
      const target = document.querySelector<HTMLElement>(targetSelector(fx));
      if (!target || still) return;
      const r = target.getBoundingClientRect();
      add(
        {
          id: ++fxId,
          kind: 'fly',
          container: fx.container as ContainerId,
          dx: r.left + r.width / 2 - (box.left + box.width / 2),
          dy: r.top + r.height / 2 - (box.top + box.height / 2),
          target: targetSelector(fx),
        },
        FLY_MS + 40,
      );
    });
    return () => {
      off();
      for (const h of timers) window.clearTimeout(h);
    };
  }, []);

  return (
    <div className="fx-layer" ref={layer} aria-hidden>
      {items.map((it) =>
        it.kind === 'stamp' ? (
          <div key={it.id} className={`fx-stamp ${it.ok ? 'ok' : 'bad'}`}>
            {it.ok ? '✓' : '✗'}
          </div>
        ) : it.kind === 'trust' ? (
          <div
            key={it.id}
            className={`fx-trust ${it.delta > 0 ? 'up' : 'down'}`}
            style={{ left: it.x, top: it.y }}
          >
            {it.delta > 0 ? `+${it.delta}` : it.delta}
          </div>
        ) : (
          <FlyingTube key={it.id} item={it} />
        ),
      )}
    </div>
  );
}

function FlyingTube({ item }: { item: Extract<Item, { kind: 'fly' }> }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const a = node.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1.4)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${item.dx * 0.5}px), calc(-50% + ${item.dy * 0.5 - 60}px)) scale(1.1)`,
          opacity: 1,
          offset: 0.5,
        },
        {
          transform: `translate(calc(-50% + ${item.dx}px), calc(-50% + ${item.dy}px)) scale(0.6)`,
          opacity: 0.2,
        },
      ],
      { duration: FLY_MS, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' },
    );
    a.onfinish = () => {
      // Giỏ "nhận" ống: nảy nhẹ rồi về đúng chỗ cũ.
      document
        .querySelector(item.target)
        ?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], {
          duration: 260,
          easing: 'ease-out',
        });
    };
    return () => a.cancel();
  }, [item]);
  return (
    <div ref={el} className="fx-fly">
      <Tube container={item.container} size={34} />
    </div>
  );
}
