/**
 * Bot cân bằng: chạy nhiều ca headless rồi in phân bố sao theo ngày và loại bot.
 * Dùng: pnpm balance [số ca mỗi ngày, mặc định 200] [--difficulty easy|normal|hard|all]
 * Mặc định chỉ chạy mức Thường. `--difficulty all` chạy cả 3 mức rồi in bảng so sánh và kiểm tra mục tiêu:
 * expert ≥ 4★ ở cả 3 mức, idle 1★, novice Dễ ≥ Thường ≥ Khó về điểm trung bình.
 */
import { getContent } from '../../src/sim/content/bundled';
import { BOT_KINDS, measure, parseArgs, type BotStats } from './stats';

const { runs, difficulties } = parseArgs(process.argv.slice(2));
const content = getContent();
/** Nhiễu thống kê chấp nhận được khi so hai mức (số ca ít). */
const NOISE_SCORE = 2;
const NOISE_STARS = 0.15;
/** Chênh lệch tối thiểu (trung bình các ngày) để thứ tự Dễ > Khó là có ý nghĩa. */
const MIN_GAP_SCORE = 3;
const MIN_GAP_STARS = 0.3;
const NAMES = { easy: 'Dễ', normal: 'Thường', hard: 'Khó' } as const;
const results = new Map<string, BotStats>();
const key = (day: string, d: string, kind: string) => `${day}|${d}|${kind}`;

for (const day of content.days) {
  for (const d of difficulties) {
    console.log(`\n== ${day.id} · ${day.title} · mức ${NAMES[d]}`);
    for (const kind of BOT_KINDS) {
      const m = measure(content, day.id, kind, d, runs);
      results.set(key(day.id, d, kind), m);
      const dist = m.stars.map((n, i) => `${i + 1}⭐ ${Math.round((100 * n) / runs)}%`).join('  ');
      console.log(
        `${kind.padEnd(7)} điểm TB ${m.avgScore.toFixed(1).padStart(5)} · niềm tin TB ${m.avgTrust.toFixed(0).padStart(3)} · ${dist}`,
      );
    }
  }
}

if (difficulties.length === 3) {
  const cell = (day: string, kind: string) =>
    difficulties
      .map((d) =>
        results
          .get(key(day, d, kind))!
          .avgScore.toFixed(0)
          .padStart(3),
      )
      .join(' / ');
  const starCell = (day: string, kind: string) =>
    difficulties.map((d) => results.get(key(day, d, kind))!.avgStars.toFixed(1)).join(' / ');
  console.log('\n== Tổng hợp (Dễ / Thường / Khó): điểm TB, sao TB');
  console.log('ngày     expert điểm   expert ★        novice điểm   novice ★        idle ★');
  for (const day of content.days) {
    console.log(
      `${day.id.padEnd(8)} ${cell(day.id, 'expert').padEnd(13)} ${starCell(day.id, 'expert').padEnd(15)} ${cell(day.id, 'novice').padEnd(13)} ${starCell(day.id, 'novice').padEnd(15)} ${starCell(day.id, 'idle')}`,
    );
  }
  const problems: string[] = [];
  let gapScore = 0;
  let gapStars = 0;
  for (const day of content.days) {
    for (const d of difficulties) {
      const e = results.get(key(day.id, d, 'expert'))!;
      const i = results.get(key(day.id, d, 'idle'))!;
      if (e.avgStars < 4)
        problems.push(`${day.id} ${NAMES[d]}: expert chỉ ${e.avgStars.toFixed(1)}★ (cần ≥ 4)`);
      if (i.minStars > 1 || i.avgStars > 1) problems.push(`${day.id} ${NAMES[d]}: idle không phải 1★`);
    }
    // Ca kết thúc sớm vì Niềm tin có điểm tổng trên ít quyết định hơn, nên so thêm theo sao; lệch ≤ nhiễu thì bỏ qua.
    const nov = difficulties.map((d) => results.get(key(day.id, d, 'novice'))!) as [
      BotStats,
      BotStats,
      BotStats,
    ];
    const inversions = ([0, 1] as const).filter(
      (i) =>
        nov[i + 1]!.avgStars > nov[i]!.avgStars + NOISE_STARS ||
        nov[i + 1]!.avgScore > nov[i]!.avgScore + NOISE_SCORE,
    );
    if (inversions.length > 0) {
      problems.push(
        `${day.id}: novice đảo thứ tự Dễ ${nov[0].avgScore.toFixed(1)}/${nov[0].avgStars.toFixed(1)}★, Thường ${nov[1].avgScore.toFixed(1)}/${nov[1].avgStars.toFixed(1)}★, Khó ${nov[2].avgScore.toFixed(1)}/${nov[2].avgStars.toFixed(1)}★`,
      );
    }
    gapScore += (nov[0].avgScore - nov[2].avgScore) / content.days.length;
    gapStars += (nov[0].avgStars - nov[2].avgStars) / content.days.length;
  }
  if (gapScore < MIN_GAP_SCORE || gapStars < MIN_GAP_STARS) {
    problems.push(
      `novice Dễ chỉ hơn Khó trung bình ${gapScore.toFixed(1)} điểm / ${gapStars.toFixed(2)}★ (cần ≥ ${MIN_GAP_SCORE} điểm và ≥ ${MIN_GAP_STARS}★)`,
    );
  }
  console.log(`\nNovice Dễ hơn Khó trung bình ${gapScore.toFixed(1)} điểm, ${gapStars.toFixed(2)}★`);
  console.log(
    problems.length === 0
      ? '\n✔ Đạt mọi mục tiêu cân bằng.'
      : `\n✘ Chưa đạt:\n  - ${problems.join('\n  - ')}`,
  );
}
