import { getGuardianLabel } from './guardianLabel';

describe('getGuardianLabel', () => {
  it('uses Husband Name for female members', () => {
    expect(getGuardianLabel({ gender: 'Female' })).toBe('Husband Name');
  });

  it('uses Father Name for male members', () => {
    expect(getGuardianLabel({ gender: 'Male' })).toBe('Father Name');
  });

  it('falls back to a generic label when gender is not available', () => {
    expect(getGuardianLabel({})).toBe('Father/Husband Name');
  });
});
