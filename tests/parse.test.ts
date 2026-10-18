import { describe, expect, it } from 'vitest';
import { parseBulk } from '../src/lib/questions';

describe('parseBulk', () => {
  it('đọc câu 1 đáp án và nhiều đáp án, ghi chú, số thứ tự', () => {
    const { questions, errors } = parseBulk(`Câu 1: Vị thuốc nào bổ khí?
A. Hoàng liên
*B. Nhân sâm
C. Đại hoàng
> Nhân sâm đại bổ nguyên khí.

2. Chọn ngũ tạng
*A) Tâm
B) Đởm
C) Can *`);
    expect(errors).toEqual([]);
    expect(questions).toHaveLength(2);
    expect(questions[0].text).toBe('Vị thuốc nào bổ khí?');
    expect(questions[0].options.map((o) => o.text)).toEqual(['Hoàng liên', 'Nhân sâm', 'Đại hoàng']);
    expect(questions[0].correctIds).toEqual([questions[0].options[1].id]);
    expect(questions[0].note).toBe('Nhân sâm đại bổ nguyên khí.');
    expect(questions[1].text).toBe('Chọn ngũ tạng');
    expect(questions[1].correctIds).toEqual([questions[1].options[0].id, questions[1].options[2].id]);
  });

  it('báo lỗi câu thiếu đáp án đúng', () => {
    const { questions, errors } = parseBulk(`Câu hỏi?\nA. x\nB. y`);
    expect(questions).toHaveLength(0);
    expect(errors[0]).toContain('đáp án đúng');
  });
});
