import type { Analyte } from '../content/schema';
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

export function measure(ctx: Ctx, order: Order, sample: Sample, patient: Patient): AnalyteResult[] {
  const out: AnalyteResult[] = [];
  const hemolysis = sample.defects.find((d) => d.kind === 'hemolysis');
  const effects = ctx.content.chemRules.hemolysisEffect;
  for (const code of order.tests) {
    const test = ctx.content.chemTestByCode.get(code);
    if (!test) continue;
    for (const a of test.analytes) {
      const truth = sample.hidden.truth[a.code] ?? 0;
      let value = truth * (1 + ctx.rng.normal(0, 0.02));
      if (hemolysis) value += (effects[a.code] ?? 0) * hemolysis.level;
      const factor = 10 ** a.decimals;
      value = Math.max(0, Math.round(value * factor) / factor);
      const overRange = value > a.max;
      const { flag, critical } = flagFor(a, value, patient.sex);
      out.push({
        code: a.code,
        value,
        display: overRange ? `>${a.max}` : formatValue(value, a.decimals),
        flag,
        critical,
        overRange,
      });
    }
  }
  return out;
}
