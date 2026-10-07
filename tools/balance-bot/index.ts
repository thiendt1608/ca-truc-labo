/**
 * Bot cân bằng: chạy nhiều ca headless rồi in phân bố sao theo ngày và loại bot.
 * Dùng: pnpm balance [số ca mỗi ngày, mặc định 200]
 */
import { getContent } from '../../src/sim/content/bundled';
import { computeReport } from '../../src/sim/core/scoring';
import { runBot, type BotKind } from '../../src/sim/bots/bots';

const runs = Number(process.argv[2] ?? 200);
const content = getContent();
const kinds: BotKind[] = ['expert', 'novice', 'idle'];

for (const day of content.days) {
  console.log(`\n== ${day.id} · ${day.title}`);
  for (const kind of kinds) {
    const stars = [0, 0, 0, 0, 0];
    let total = 0;
    let trust = 0;
    for (let i = 0; i < runs; i++) {
      const { state } = runBot(content, day.id, `balance-${i}`, kind);
      const r = computeReport(state);
      stars[r.stars - 1]!++;
      total += r.total;
      trust += r.trust;
    }
    const dist = stars.map((n, i) => `${i + 1}⭐ ${Math.round((100 * n) / runs)}%`).join('  ');
    console.log(
      `${kind.padEnd(7)} điểm TB ${(total / runs).toFixed(1).padStart(5)} · niềm tin TB ${(trust / runs).toFixed(0).padStart(3)} · ${dist}`,
    );
  }
}
