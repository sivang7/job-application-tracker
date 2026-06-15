import { describe, expect, it } from 'vitest';
import { emptyFormValues } from './components/ApplicationFormFields';
import { isValidApplicationLink, validateApplicationForm } from './validateApplicationForm';

describe('isValidApplicationLink', () => {
  it('returns false for empty or partial input', () => {
    expect(isValidApplicationLink('')).toBe(false);
    expect(isValidApplicationLink('not-a-url')).toBe(false);
    expect(isValidApplicationLink('https://')).toBe(false);
  });

  it('returns true for http and https URLs', () => {
    expect(isValidApplicationLink('https://jobs.example.com/123')).toBe(true);
    expect(isValidApplicationLink('  http://example.com  ')).toBe(true);
  });
});

describe('validateApplicationForm', () => {
  it('accepts minimal valid input', () => {
    const result = validateApplicationForm({
      ...emptyFormValues(),
      company: 'Acme',
      role: 'Engineer',
    });
    expect(result.ok).toBe(true);
  });

  it('rejects empty company', () => {
    const result = validateApplicationForm({
      ...emptyFormValues(),
      company: '   ',
      role: 'Engineer',
    });
    expect(result).toEqual({ ok: false, errors: { company: 'Company is required' } });
  });

  it('rejects invalid link', () => {
    const result = validateApplicationForm({
      ...emptyFormValues(),
      company: 'Acme',
      role: 'Engineer',
      link: 'not-a-url',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.link).toContain('valid');
    }
  });

  it('accepts https link', () => {
    const result = validateApplicationForm({
      ...emptyFormValues(),
      company: 'Acme',
      role: 'Engineer',
      link: 'https://jobs.example.com/123',
    });
    expect(result.ok).toBe(true);
  });

  it('rejects invalid contact email when set', () => {
    const result = validateApplicationForm({
      ...emptyFormValues(),
      company: 'Acme',
      role: 'Engineer',
      contacts: [{ name: 'Pat', email: 'bad-email', phone: '', role: '' }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors['contacts.0.email']).toContain('email');
    }
  });

  it('rejects invalid contact phone when set', () => {
    const result = validateApplicationForm({
      ...emptyFormValues(),
      company: 'Acme',
      role: 'Engineer',
      contacts: [{ name: 'Pat', email: '', phone: 'abc', role: '' }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors['contacts.0.phone']).toBeDefined();
    }
  });

  it('accepts valid contact email and phone', () => {
    const result = validateApplicationForm({
      ...emptyFormValues(),
      company: 'Acme',
      role: 'Engineer',
      contacts: [{ name: 'Pat', email: 'pat@example.com', phone: '+1 555-0100', role: '' }],
    });
    expect(result.ok).toBe(true);
  });

  it('requires contact name when row has other fields', () => {
    const result = validateApplicationForm({
      ...emptyFormValues(),
      company: 'Acme',
      role: 'Engineer',
      contacts: [{ name: '', email: 'pat@example.com', phone: '', role: '' }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors['contacts.0.name']).toBeDefined();
    }
  });
});
