import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility function', () => {
  it('should join multiple valid class names', () => {
    expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3');
  });

  it('should return a single class unchanged', () => {
    expect(cn('class1')).toBe('class1');
  });

  it('should filter out undefined values', () => {
    expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
  });

  it('should filter out null values', () => {
    expect(cn('class1', null, 'class2')).toBe('class1 class2');
  });

  it('should filter out false values', () => {
    expect(cn('class1', false, 'class2')).toBe('class1 class2');
  });

  it('should filter out empty strings', () => {
    expect(cn('class1', '', 'class2')).toBe('class1 class2');
  });

  it('should handle all types of falsy values together', () => {
    expect(cn('class1', undefined, null, false, '', 'class2')).toBe('class1 class2');
  });

  it('should handle empty input', () => {
    expect(cn()).toBe('');
  });

  it('should handle only falsy values', () => {
    expect(cn(undefined, null, false, '')).toBe('');
  });

  it('should preserve the order of valid class names', () => {
    expect(cn('first', 'second', 'third')).toBe('first second third');
  });
});
