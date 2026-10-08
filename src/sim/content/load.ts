import { RawContentSchema, type RawContent } from './schema';

/** Nội dung đã kiểm tra, kèm bảng tra cứu theo id. */
export interface Content extends RawContent {
  testByCode: Map<string, RawContent['tests'][number]>;
  chemTestByCode: Map<string, RawContent['chemTests'][number]>;
  dayById: Map<string, RawContent['days'][number]>;
  codexById: Map<string, RawContent['codex'][number]>;
  orderTypeById: Map<string, RawContent['orderTypes'][number]>;
}

export interface ContentProblem {
  where: string;
  message: string;
}

/** Kiểm tra schema rồi kiểm tra tham chiếu chéo. Ném lỗi nếu có vấn đề. */
export function loadContent(raw: unknown): Content {
  const parsed = RawContentSchema.parse(raw);
  const content: Content = {
    ...parsed,
    testByCode: new Map(parsed.tests.map((t) => [t.code, t])),
    chemTestByCode: new Map(parsed.chemTests.map((t) => [t.code, t])),
    dayById: new Map(parsed.days.map((d) => [d.id, d])),
    codexById: new Map(parsed.codex.map((c) => [c.id, c])),
    orderTypeById: new Map(parsed.orderTypes.map((o) => [o.id, o])),
  };
  const problems = crossCheck(content);
  if (problems.length > 0) {
    throw new Error(
      'Nội dung game có lỗi tham chiếu:\n' + problems.map((p) => `  - ${p.where}: ${p.message}`).join('\n'),
    );
  }
  return content;
}

export function crossCheck(c: Content): ContentProblem[] {
  const problems: ContentProblem[] = [];
  const add = (where: string, message: string) => problems.push({ where, message });
  const profileIds = new Set(c.profiles.profiles.map((p) => p.id));
  const containerIds = new Set(c.containers.map((x) => x.id));

  const dup = (where: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) add(where, `id bị trùng: ${id}`);
      seen.add(id);
    }
  };
  dup(
    'codex',
    c.codex.map((x) => x.id),
  );
  dup(
    'days',
    c.days.map((x) => x.id),
  );
  dup(
    'tests',
    c.tests.map((x) => x.code),
  );

  for (const t of c.tests) {
    for (const ct of t.containers)
      if (!containerIds.has(ct)) add(`tests/${t.code}`, `ống không tồn tại: ${ct}`);
    if (t.dept === 'chem' && !t.manual && !c.chemTestByCode.has(t.code))
      add(`tests/${t.code}`, 'xét nghiệm hoá sinh chưa có trong chem/tests.json');
  }
  for (const ct of c.chemTests) {
    for (const a of ct.analytes) {
      if (!(a.code in c.profiles.base))
        add(`chem/tests/${ct.code}`, `thiếu giá trị nền cho ${a.code} trong profiles.json`);
    }
  }
  const padIds = new Set(c.chemUrine.pads.map((p) => p.id));
  for (const pad of c.chemUrine.pads) {
    if (pad.colors.length !== pad.levels.length) add(`chem/urine/${pad.id}`, 'số màu phải bằng số mức');
    if (pad.normal.some((n) => n >= pad.levels.length))
      add(`chem/urine/${pad.id}`, 'mức bình thường vượt số mức');
  }
  for (const [prof, pads] of Object.entries(c.chemUrine.profiles)) {
    if (!profileIds.has(prof)) add(`chem/urine/profiles/${prof}`, 'hồ sơ không tồn tại');
    for (const id of Object.keys(pads))
      if (!padIds.has(id)) add(`chem/urine/profiles/${prof}`, `ô không tồn tại: ${id}`);
  }
  for (const o of c.orderTypes) {
    for (const code of o.testsFrom) {
      const test = c.testByCode.get(code);
      if (!test) {
        add(`order-types/${o.id}`, `xét nghiệm không tồn tại: ${code}`);
        continue;
      }
      if (test.dept !== o.dept)
        add(`order-types/${o.id}`, `${code} thuộc khoa ${test.dept}, không phải ${o.dept}`);
      for (const p of ['stat', 'routine'] as const) {
        if (!test.containers.includes(o.container[p]))
          add(`order-types/${o.id}`, `${code} không dùng được ống ${o.container[p]} (${p})`);
      }
    }
  }
  const codexRefs: [string, string][] = [
    ['chem/rules/dilution', c.chemRules.dilution.codex],
    ['chem/rules/delta', c.chemRules.delta.codex],
    ...c.receptionRules.defects.map((d) => [`reception-rules/${d.defect}`, d.codex] as [string, string]),
    ['reception-rules/irreplaceable', c.receptionRules.irreplaceable.codex],
    ['chem/rules/hemolysis', c.chemRules.hemolysis.codex],
    ['chem/rules/lipemia', c.chemRules.lipemia.codex],
    ['chem/rules/icterus', c.chemRules.icterus.codex],
  ];
  const i18nRefs: [string, string][] = [
    ...c.receptionRules.defects.map(
      (d) => [`reception-rules/${d.defect}`, d.explanationKey] as [string, string],
    ),
    ['reception-rules/irreplaceable', c.receptionRules.irreplaceable.explanationKey],
    ['chem/rules/hemolysis', c.chemRules.hemolysis.explanationKey],
    ['chem/rules/dilution', c.chemRules.dilution.explanationKey],
    ...Object.entries(c.chemQc.scenarios).flatMap(([id, sc]) => {
      codexRefs.push([`chem/qc/${id}`, sc.codex]);
      return [[`chem/qc/${id}`, sc.explanationKey]] as [string, string][];
    }),
  ];
  for (const d of c.days) {
    const where = `days/${d.id}`;
    if (d.end <= d.start) add(where, 'giờ kết thúc phải sau giờ bắt đầu');
    for (const id of Object.keys(d.orderTypes))
      if (!c.orderTypeById.has(id)) add(where, `loại phiếu không tồn tại: ${id}`);
    for (const id of Object.keys(d.profiles))
      if (!profileIds.has(id)) add(where, `hồ sơ không tồn tại: ${id}`);
    for (const id of d.codexOnStart) codexRefs.push([where, id]);
    if (d.qc && !(d.qc.scenario in c.chemQc.scenarios))
      add(where, `kịch bản QC không tồn tại: ${d.qc.scenario}`);
    if (!!d.qc !== d.unlocks.includes('qc')) add(where, 'qc và unlocks "qc" phải đi cùng nhau');
    if (d.qc && d.room !== 'chem') add(where, 'QC chỉ dùng cho phòng Hoá sinh');
    for (const s of d.scripted) {
      if (s.orderType && !c.orderTypeById.has(s.orderType))
        add(where, `kịch bản #${s.index}: loại phiếu ${s.orderType} không tồn tại`);
      if (s.profile && !profileIds.has(s.profile))
        add(where, `kịch bản #${s.index}: hồ sơ ${s.profile} không tồn tại`);
      const ot = s.orderType ? c.orderTypeById.get(s.orderType) : undefined;
      for (const code of s.tests ?? []) {
        if (ot && !ot.testsFrom.includes(code))
          add(where, `kịch bản #${s.index}: ${code} không thuộc ${ot.id}`);
      }
    }
    const total = d.waves.reduce((n, w) => n + w.count, 0);
    for (const s of d.scripted)
      if (s.index >= total) add(where, `kịch bản #${s.index} vượt quá số mẫu (${total})`);
    const roomDepts = d.room === 'reception' ? null : d.room;
    if (roomDepts) {
      for (const id of Object.keys(d.orderTypes)) {
        const ot = c.orderTypeById.get(id);
        if (ot && ot.dept !== roomDepts)
          add(where, `phòng ${d.room} nhưng có loại phiếu của khoa ${ot.dept}`);
      }
    }
  }
  for (const [where, id] of codexRefs)
    if (!c.codexById.has(id)) add(where, `thẻ Sổ tay không tồn tại: ${id}`);
  for (const [where, key] of i18nRefs) if (!(key in c.i18n)) add(where, `thiếu chuỗi i18n: ${key}`);
  return problems;
}
