import { describe, expect, it } from 'vitest';
import { getContent } from '../content/bundled';
import type { Order, Sample } from '../core/types';
import { balanceSkill, expectedPostSpin, isBalanced } from './chem';

const content = getContent();

describe('máy ly tâm', () => {
  const empty = () => Array.from({ length: 12 }, () => null as string | null);
  it('cân bằng khi mỗi ống có ống đối diện', () => {
    const s = empty();
    s[0] = 'a';
    expect(isBalanced(s)).toBe(false);
    s[6] = 'water';
    expect(isBalanced(s)).toBe(true);
    expect(balanceSkill(s)).toBe(100);
  });
  it('trừ điểm khi dùng thừa ống nước, 0 điểm khi lệch', () => {
    const s = empty();
    s[0] = 'a';
    s[6] = 'b';
    s[1] = 'water';
    s[7] = 'water';
    expect(balanceSkill(s)).toBe(80);
    s[2] = 'c';
    expect(balanceSkill(s)).toBe(0);
  });
});

describe('khay sau ly tâm', () => {
  const order = { tests: ['CHOL'] } as Order;
  const sample = (defects: Sample['defects']) => ({ defects }) as Sample;
  it('tan huyết + chỉ ảnh hưởng khi xét nghiệm nhạy ở mức đó', () => {
    expect(expectedPostSpin(content, sample([{ kind: 'hemolysis', level: 1 }]), order)).toBe('load');
    expect(
      expectedPostSpin(content, sample([{ kind: 'hemolysis', level: 1 }]), { tests: ['ELEC'] } as Order),
    ).toEqual({
      reject: 'hemolysis',
    });
    expect(expectedPostSpin(content, sample([{ kind: 'hemolysis', level: 3 }]), order)).toEqual({
      reject: 'hemolysis',
    });
  });
  it('đục → ly tâm tốc độ cao; vàng → vẫn nạp máy', () => {
    expect(expectedPostSpin(content, sample([{ kind: 'lipemia' }]), order)).toBe('highSpeedSpin');
    expect(expectedPostSpin(content, sample([{ kind: 'icterus' }]), order)).toBe('load');
  });
});
