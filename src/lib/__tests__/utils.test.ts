import { describe, expect, it } from 'vitest';
import { formatCurrency, formatNumber, initials, percentChange, slugify } from '../utils';

describe('slugify', () => {
  it('lowercases and dashes', () => {
    expect(slugify('Acme Analytics Inc.')).toBe('acme-analytics-inc');
  });

  it('strips accents and edge dashes', () => {
    expect(slugify('  Café Übersicht!! ')).toBe('cafe-ubersicht');
  });

  it('returns empty string when nothing usable is left', () => {
    expect(slugify('***')).toBe('');
  });

  it('caps length', () => {
    expect(slugify('a'.repeat(80))).toHaveLength(40);
  });
});

describe('formatNumber', () => {
  it('keeps small numbers exact', () => {
    expect(formatNumber(9876)).toBe('9,876');
  });

  it('compacts large numbers', () => {
    expect(formatNumber(12_345)).toBe('12.3K');
    expect(formatNumber(2_000_000)).toBe('2M');
  });
});

describe('formatCurrency', () => {
  it('drops cents for whole amounts', () => {
    expect(formatCurrency(4900)).toBe('$49');
  });

  it('shows cents otherwise', () => {
    expect(formatCurrency(1999)).toBe('$19.99');
  });
});

describe('percentChange', () => {
  it('computes relative change', () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
  });

  it('returns null when there is no baseline', () => {
    expect(percentChange(10, 0)).toBeNull();
  });

  it('treats 0 -> 0 as no change', () => {
    expect(percentChange(0, 0)).toBe(0);
  });
});

describe('initials', () => {
  it('uses first and last name', () => {
    expect(initials('Dana Maria Owens')).toBe('DO');
  });

  it('falls back to the email local part', () => {
    expect(initials(null, 'sam@pulse.dev')).toBe('SA');
  });
});
