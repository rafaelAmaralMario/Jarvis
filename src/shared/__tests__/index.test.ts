import type { Nullable } from '../index';

describe('Shared Types', () => {
  it('Nullable<T> allows null', () => {
    const value: Nullable<string> = null;
    expect(value).toBeNull();
  });

  it('Nullable<T> allows the type', () => {
    const value: Nullable<string> = 'hello';
    expect(value).toBe('hello');
  });

  it('Nullable<T> does not include undefined by default', () => {
    const value: Nullable<number> = null;
    expect(value).toBeNull();
  });
});
