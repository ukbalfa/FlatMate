import { getPasswordStrength } from '../lib/passwordStrength';

describe('getPasswordStrength', () => {
  it('returns Weak for empty password', () => {
    const result = getPasswordStrength('');
    expect(result.level).toBe('weak');
    expect(result.score).toBe(0);
  });

  it('returns Weak for short password', () => {
    const result = getPasswordStrength('abc');
    expect(result.level).toBe('weak');
    expect(result.score).toBe(0);
  });

  it('returns Fair for 8+ chars only', () => {
    const result = getPasswordStrength('abcdefgh');
    expect(result.level).toBe('fair');
    expect(result.score).toBe(1);
  });

  it('returns Good for 8+ chars with digit', () => {
    const result = getPasswordStrength('abcdefg1');
    expect(result.level).toBe('good');
    expect(result.score).toBe(2);
  });

  it('returns Strong for 8+ chars with digit and special char', () => {
    const result = getPasswordStrength('abcdefg1!');
    expect(result.level).toBe('strong');
    expect(result.score).toBe(3);
  });

  it('returns Strong for 8+ chars with uppercase and special', () => {
    const result = getPasswordStrength('Abcdefg!');
    expect(result.level).toBe('strong');
    expect(result.score).toBe(3);
  });
});
