import { describe, expect, it } from 'vitest';
import { meter, quotaDayKey, setMeterEnabled } from '../src/lib/quotaMeter';

describe('quotaDayKey – ngày quota theo giờ Thái Bình Dương', () => {
  it('13:59 giờ VN (mùa hè Mỹ) vẫn là ngày hôm trước; 14:00 sang ngày mới', () => {
    expect(quotaDayKey(new Date('2026-10-19T06:59:00Z'))).toBe('2026-10-18'); // 13:59 VN
    expect(quotaDayKey(new Date('2026-10-19T07:00:00Z'))).toBe('2026-10-19'); // 14:00 VN
  });
  it('mùa đông Mỹ: làm mới lúc 15:00 giờ VN', () => {
    expect(quotaDayKey(new Date('2026-12-16T07:59:00Z'))).toBe('2026-12-15'); // 14:59 VN
    expect(quotaDayKey(new Date('2026-12-16T08:00:00Z'))).toBe('2026-12-16'); // 15:00 VN
  });
});

describe('meter – công tắc đếm', () => {
  it('tắt thì không đếm, không lỗi', () => {
    setMeterEnabled(false);
    expect(() => {
      meter.read(5);
      meter.write(2);
      meter.delete(1);
    }).not.toThrow();
  });
});
