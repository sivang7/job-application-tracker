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

  it('accepts contact with phone', () => {
    const result = validateCreateInput({
      company: 'Acme',
      role: 'Eng',
      contacts: [{ name: 'Pat', phone: '+1 555-0100' }],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.contacts).toEqual([{ name: 'Pat', phone: '+1 555-0100' }]);
    }
  });

  it('rejects invalid contact email', () => {
    const result = validateCreateInput({
      company: 'Acme',
      role: 'Eng',
      contacts: [{ name: 'Pat', email: 'not-an-email' }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('email');
  });

  it('rejects invalid contact phone', () => {
    const result = validateCreateInput({
      company: 'Acme',
      role: 'Eng',
      contacts: [{ name: 'Pat', phone: 'letters' }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('phone');
  });

  it('rejects invalid link', () => {
    const result = validateCreateInput({
      company: 'Acme',
      role: 'Eng',
      link: 'not-a-url',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('link');
  });

  it('accepts https link and description', () => {
    const result = validateCreateInput({
      company: 'Acme',
      role: 'Eng',
      link: 'https://jobs.example.com/123',
      description: 'Great role',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.link).toBe('https://jobs.example.com/123');
      expect(result.data.description).toBe('Great role');
    }
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

  it('allows clearing link and description with null', () => {
    const result = validateUpdateInput({ link: null, description: null });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.link).toBeUndefined();
      expect(result.data.description).toBeUndefined();
    }
  });
});
