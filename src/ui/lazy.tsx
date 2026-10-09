import { lazy, Suspense, type ReactNode } from 'react';

/**
 * Các màn/sheet lớn ít dùng tách thành chunk riêng để chunk chính < 500 kB. Mọi chunk đều nằm trong
 * precache của service worker; `preloadLazy()` kéo sẵn lúc rảnh nên mở màn gần như không có độ trễ.
 */
const loaders = {
  Codex: () => import('./screens/Codex').then((m) => ({ default: m.Codex })),
  Settings: () => import('./screens/Settings').then((m) => ({ default: m.Settings })),
  Report: () => import('./screens/Report').then((m) => ({ default: m.Report })),
  Briefing: () => import('./screens/Briefing').then((m) => ({ default: m.Briefing })),
  Stations: () => import('./components/ChemStations'),
  QcSheet: () => import('./components/QcSheet').then((m) => ({ default: m.QcSheet })),
  ResultsSheet: () => import('./components/ResultsSheet').then((m) => ({ default: m.ResultsSheet })),
  MinigameHost: () => import('./minigames/MinigameHost').then((m) => ({ default: m.MinigameHost })),
  DebugPanel: () => import('./components/DebugPanel').then((m) => ({ default: m.DebugPanel })),
} as const;

export const LazyCodex = lazy(loaders.Codex);
export const LazySettings = lazy(loaders.Settings);
export const LazyReport = lazy(loaders.Report);
export const LazyBriefing = lazy(loaders.Briefing);
export const LazyQcSheet = lazy(loaders.QcSheet);
export const LazyResultsSheet = lazy(loaders.ResultsSheet);
export const LazyMinigameHost = lazy(loaders.MinigameHost);
export const LazyDebugPanel = lazy(loaders.DebugPanel);
export const LazyCentrifugeSheet = lazy(() =>
  loaders.Stations().then((m) => ({ default: m.CentrifugeSheet })),
);
export const LazyPostSpinSheet = lazy(() => loaders.Stations().then((m) => ({ default: m.PostSpinSheet })));
export const LazyAnalyzerSheet = lazy(() => loaders.Stations().then((m) => ({ default: m.AnalyzerSheet })));
export const LazyUrineSheet = lazy(() => loaders.Stations().then((m) => ({ default: m.UrineSheet })));

/** Kéo sẵn mọi chunk khi trình duyệt rảnh, để chuyển màn không phải chờ mạng. */
export function preloadLazy() {
  const run = () => Object.values(loaders).forEach((load) => void load().catch(() => undefined));
  if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 1500);
}

/** Màn đầy đủ: khung giữ nền, chữ nhỏ, không nháy trắng. */
export function ScreenSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="screen" role="status">
          <p className="muted">Đang tải…</p>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

/** Sheet/lớp phủ: không hiện gì trong lúc tải (chunk đã precache nên rất ngắn). */
export function QuietSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
