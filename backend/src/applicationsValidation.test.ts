import { describe, expect, it } from 'vitest';
import { validateCreateInput, validateUpdateInput } from './applicationsValidation.js';

describe('validateCreateInput', () => {
  it('accepts minimal valid input', () => {
    const result = validateCreateInput({ company: 'Acme', role: 'Engineer' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ company: 'Acme', role: 'Engineer' });
    }
  });

  it('rejects missing company', () => {
    const result = validateCreateInput({ role: 'Engineer' });
    expect(result).toEqual({ ok: false, error: 'company is required' });
  });

  it('rejects empty role after trim', () => {
    const result = validateCreateInput({ company: 'Acme', role: '   ' });
    expect(result).toEqual({ ok: false, error: 'role cannot be empty' });
  });

  it('rejects invalid status', () => {
    const result = validateCreateInput({ company: 'Acme', role: 'Eng', status: 'pending' });
    expect(result).toEqual({ ok: false, error: 'Invalid status' });
  });

  it('rejects invalid appliedDate', () => {
    const result = validateCreateInput({
      company: 'Acme',
      role: 'Eng',
      appliedDate: 'not-a-date',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('appliedDate');
  });

  it('accepts valid optional fields', () => {
    const result = validateCreateInput({
      company: 'Acme',
      role: 'Eng',
      status: 'applied',
      appliedDate: '2026-01-15',
      contacts: [{ name: 'Pat' }],
    });
    expect(result.ok).toBe(true);
  });

  it('rejects contact without name', () => {
    const result = validateCreateInput({
      company: 'Acme',
      role: 'Eng',
      contacts: [{}],
    });
    expect(result.ok).toBe(false);
  });
});

describe('validateUpdateInput', () => {
  it('rejects empty patch', () => {
    const result = validateUpdateInput({});
    expect(result).toEqual({ ok: false, error: 'At least one field is required to update' });
  });

  it('accepts status-only patch', () => {
    const result = validateUpdateInput({ status: 'interviewing' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ status: 'interviewing' });
  });

  it('allows clearing appliedDate with null', () => {
    const result = validateUpdateInput({ appliedDate: null });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.appliedDate).toBeUndefined();
  });
});
