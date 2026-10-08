import type { Analyte } from '../content/schema';
import { qcBias } from '../departments/chemQc';
import type { Ctx } from './context';
import type { AnalyteResult, Order, Patient, Sample } from './types';

/**
 * Sinh kết quả (05-noi-dung-chuyen-mon.md, TDD mục 4.6):
 * giá trị thật của bệnh nhân → sai số đo ngẫu nhiên → nhiễu do mẫu (tan huyết) → làm tròn → gắn cờ.
 */

export function formatValue(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

export function flagFor(
  a: Analyte,
  value: number,
  sex: 'M' | 'F',
): { flag: '' | 'H' | 'L'; critical: boolean } {
  const [low, high] = sex === 'F' && a.refF ? a.refF : a.ref;
  const flag = value > high ? 'H' : value < low ? 'L' : '';
  const critical = a.critical ? value < a.critical[0] || value > a.critical[1] : false;
  return { flag, critical };
}

/** `dilution`: chỉ đo lại các chất `codes` ở mẫu đã pha loãng `ratio` lần (máy đọc giá trị loãng rồi nhân lại). */
export function measure(
  ctx: Ctx,
  order: Order,
  sample: Sample,
  patient: Patient,
  dilution?: { ratio: number; codes: string[] },
): AnalyteResult[] {
  const out: AnalyteResult[] = [];
  const hemolysis = sample.defects.find((d) => d.kind === 'hemolysis');
  const effects = ctx.content.chemRules.hemolysisEffect;
  for (const code of order.tests) {
    const test = ctx.content.chemTestByCode.get(code);
    if (!test) continue;
    for (const a of test.analytes) {
      if (dilution && !dilution.codes.includes(a.code)) continue;
      const truth = sample.hidden.truth[a.code] ?? 0;
      // Mẫu pha loãng đo lại không thêm nhiễu: số máy đọc phải khớp số người chơi đã thấy ở mini-game pha loãng.
      let value = truth * (1 + (dilution ? 0 : ctx.rng.normal(0, 0.02)) + qcBias(ctx));
      if (hemolysis) value += (effects[a.code] ?? 0) * hemolysis.level;
      const factor = 10 ** a.decimals;
      let reading: number | undefined;
      if (dilution) {
        reading = Math.max(0, Math.round((value / dilution.ratio) * factor) / factor);
        value = reading > a.max ? value : reading * dilution.ratio;
      }
      value = Math.max(0, Math.round(value * factor) / factor);
      const overRange = dilution && reading !== undefined ? reading > a.max : value > a.max;
      const { flag, critical } = flagFor(a, value, patient.sex);
      const previous = patient.previous?.[a.code];
      const limit = ctx.content.chemRules.delta.rel[a.code];
      const delta =
        previous !== undefined && limit !== undefined && Math.abs(value - previous) / previous > limit
          ? { previous: Math.round(previous * factor) / factor }
          : undefined;
      out.push({
        code: a.code,
        value,
        ...(dilution && reading !== undefined ? { dilution: { ratio: dilution.ratio, reading } } : {}),
        ...(delta ? { delta } : {}),
        display: overRange ? `>${a.max}` : formatValue(value, a.decimals),
        flag,
        critical,
        overRange,
      });
    }
  }
  return out;
}
