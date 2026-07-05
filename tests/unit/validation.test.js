import { describe, expect, it } from 'vitest';
import {
  validateContactForm,
  validateEmail,
  validateMessage,
  validateName,
} from '../../app/html/js/validation.js';

describe('validateName', () => {
  it('accepts a normal name', () => {
    expect(validateName('Oscar Wilches')).toBeNull();
  });
  it('rejects empty and too-short names', () => {
    expect(validateName('')).not.toBeNull();
    expect(validateName('  ')).not.toBeNull();
    expect(validateName('A')).not.toBeNull();
    expect(validateName(undefined)).not.toBeNull();
  });
  it('rejects names longer than 80 characters', () => {
    expect(validateName('x'.repeat(81))).not.toBeNull();
  });
});

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('user@example.com')).toBeNull();
    expect(validateEmail('  user@example.co  ')).toBeNull();
  });
  it('rejects invalid emails', () => {
    expect(validateEmail('')).not.toBeNull();
    expect(validateEmail('no-at-sign')).not.toBeNull();
    expect(validateEmail('a@b')).not.toBeNull();
    expect(validateEmail('a b@c.com')).not.toBeNull();
    expect(validateEmail(null)).not.toBeNull();
  });
});

describe('validateMessage', () => {
  it('accepts a reasonable message', () => {
    expect(validateMessage('Quiero perder grasa y ganar músculo.')).toBeNull();
  });
  it('rejects too-short and too-long messages', () => {
    expect(validateMessage('hola')).not.toBeNull();
    expect(validateMessage('x'.repeat(2001))).not.toBeNull();
  });
});

describe('validateContactForm', () => {
  const valid = {
    name: 'Oscar',
    email: 'oscar@example.com',
    message: 'Quiero empezar a entrenar contigo.',
    honeypot: '',
  };

  it('accepts a fully valid submission', () => {
    const result = validateContactForm(valid);
    expect(result.valid).toBe(true);
    expect(result.bot).toBe(false);
    expect(result.errors).toEqual({});
  });

  it('collects one Spanish error message per invalid field', () => {
    const result = validateContactForm({ name: '', email: 'bad', message: '', honeypot: '' });
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).sort()).toEqual(['email', 'message', 'name']);
    for (const message of Object.values(result.errors)) {
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    }
  });

  it('flags bot submissions via the honeypot without errors', () => {
    const result = validateContactForm({ ...valid, honeypot: 'http://spam' });
    expect(result.valid).toBe(true);
    expect(result.bot).toBe(true);
  });
});
