import { BadRequestException } from '@nestjs/common';
import { ParseIdPipe } from './parse-id.pipe';

describe('ParseIdPipe', () => {
  const pipe = new ParseIdPipe();

  it('aceita string ou number inteiros positivos', () => {
    expect(pipe.transform('42')).toBe(42);
    expect(pipe.transform(7)).toBe(7);
  });

  it.each(['abc', '0', '-1', '1.5', '', Number.NaN, 2_147_483_648, '99999999999'])('rejeita %p', (v) => {
    expect(() => pipe.transform(v)).toThrow(BadRequestException);
  });
});
