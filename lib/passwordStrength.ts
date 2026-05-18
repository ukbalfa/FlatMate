export type PasswordStrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  level: PasswordStrengthLevel;
  score: number;
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (password.length === 0) return { level: 'weak', score: 0 };

  let score = 0;
  if (password.length >= 8) score++;
  if (/\d/.test(password) || /[A-Z]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) score++;

  const levels: PasswordStrengthLevel[] = ['weak', 'fair', 'good', 'strong'];
  return { level: levels[score]!, score };
}
