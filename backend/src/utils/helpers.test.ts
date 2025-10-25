import {
  generateRandomString,
  hashString,
  sleep,
  safeJsonParse,
  chunk,
  removeUndefined,
  calculatePercentage,
  truncate,
  unique,
  groupBy,
  omit,
  pick,
} from './helpers';

describe('Helpers', () => {
  describe('generateRandomString', () => {
    it('should generate string of specified length', () => {
      const result = generateRandomString(16);
      expect(result.length).toBe(32); // hex encoding doubles length
    });

    it('should generate unique strings', () => {
      const str1 = generateRandomString();
      const str2 = generateRandomString();
      expect(str1).not.toBe(str2);
    });
  });

  describe('hashString', () => {
    it('should hash strings consistently', () => {
      const hash1 = hashString('test');
      const hash2 = hashString('test');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashString('test1');
      const hash2 = hashString('test2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"key":"value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('should return default on invalid JSON', () => {
      const result = safeJsonParse('invalid', { default: true });
      expect(result).toEqual({ default: true });
    });
  });

  describe('chunk', () => {
    it('should split array into chunks', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = chunk(arr, 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle empty arrays', () => {
      const result = chunk([], 2);
      expect(result).toEqual([]);
    });
  });

  describe('removeUndefined', () => {
    it('should remove undefined values', () => {
      const obj = { a: 1, b: undefined, c: 3 };
      const result = removeUndefined(obj);
      expect(result).toEqual({ a: 1, c: 3 });
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(25, 100)).toBe(25);
    });

    it('should handle zero total', () => {
      expect(calculatePercentage(50, 0)).toBe(0);
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const result = truncate('Hello World', 8);
      expect(result).toBe('Hello...');
    });

    it('should not truncate short strings', () => {
      const result = truncate('Hello', 10);
      expect(result).toBe('Hello');
    });
  });

  describe('unique', () => {
    it('should remove duplicates', () => {
      const result = unique([1, 2, 2, 3, 3, 4]);
      expect(result).toEqual([1, 2, 3, 4]);
    });
  });

  describe('groupBy', () => {
    it('should group array by key', () => {
      const arr = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 },
      ];
      const result = groupBy(arr, 'type');
      expect(result.a).toHaveLength(2);
      expect(result.b).toHaveLength(1);
    });
  });

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = omit(obj, ['b']);
      expect(result).toEqual({ a: 1, c: 3 });
    });
  });

  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = pick(obj, ['a', 'c']);
      expect(result).toEqual({ a: 1, c: 3 });
    });
  });
});
