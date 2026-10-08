import containers from '../../../content/common/containers.json';
import wards from '../../../content/common/wards.json';
import names from '../../../content/common/names.json';
import tests from '../../../content/common/tests.json';
import orderTypes from '../../../content/common/order-types.json';
import profiles from '../../../content/common/profiles.json';
import receptionRules from '../../../content/common/reception-rules.json';
import chemTests from '../../../content/chem/tests.json';
import chemRules from '../../../content/chem/rules.json';
import chemQc from '../../../content/chem/qc.json';
import ch0d1 from '../../../content/days/ch0-d1.json';
import ch1d1 from '../../../content/days/ch1-d1.json';
import ch1d2 from '../../../content/days/ch1-d2.json';
import ch1d3 from '../../../content/days/ch1-d3.json';
import codexCommon from '../../../content/codex/common.json';
import codexChem from '../../../content/codex/chem.json';
import i18n from '../../../content/i18n/vi.json';
import { loadContent, type Content } from './load';

/** Dữ liệu thô gom từ thư mục content/ (thêm ngày mới thì import thêm ở đây). */
export const rawContent = {
  containers,
  wards,
  names,
  tests,
  orderTypes,
  profiles,
  receptionRules,
  chemTests,
  chemRules,
  chemQc,
  days: [ch0d1, ch1d1, ch1d2, ch1d3],
  codex: [...codexCommon, ...codexChem],
  i18n,
};

let cached: Content | null = null;
export function getContent(): Content {
  cached ??= loadContent(rawContent);
  return cached;
}
