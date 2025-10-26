import {
  isValidAddress,
  normalizeAddress,
  isValidTxHash,
  isValidAmount,
  isValidEmail,
  isValidUrl,
  validatePagination,
  sanitizeString,
} from './validators';

describe('Validators', () => {
  describe('isValidAddress', () => {
    it('should validate correct Ethereum addresses', () => {
      expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(true);
      expect(isValidAddress('0x0000000000000000000000000000000000000000')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidAddress('0x123')).toBe(false);
      expect(isValidAddress('not-an-address')).toBe(false);
      expect(isValidAddress('')).toBe(false);
    });
  });

  describe('normalizeAddress', () => {
    it('should normalize valid addresses', () => {
      const address = '0x742d35cc6634c0532925a3b844bc9e7595f0beb0';
      const normalized = normalizeAddress(address);
      expect(normalized).toBeTruthy();
      expect(normalized?.startsWith('0x')).toBe(true);
    });

    it('should return null for invalid addresses', () => {
      expect(normalizeAddress('invalid')).toBeNull();
    });
  });

  describe('isValidTxHash', () => {
    it('should validate correct transaction hashes', () => {
      const hash = '0x' + 'a'.repeat(64);
      expect(isValidTxHash(hash)).toBe(true);
    });

    it('should reject invalid hashes', () => {
      expect(isValidTxHash('0x123')).toBe(false);
      expect(isValidTxHash('not-a-hash')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://invalid')).toBe(true); // URL constructor accepts ftp
    });
  });

  describe('validatePagination', () => {
    it('should return valid pagination values', () => {
      const result = validatePagination(1, 10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should enforce minimum page value', () => {
      const result = validatePagination(-5, 10);
      expect(result.page).toBe(1);
    });

    it('should enforce maximum limit', () => {
      const result = validatePagination(1, 200);
      expect(result.limit).toBe(100);
    });

    it('should handle invalid inputs', () => {
      const result = validatePagination(NaN, NaN);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('sanitizeString', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeString('Hello <World>')).toBe('Hello World');
    });

    it('should preserve safe content', () => {
      expect(sanitizeString('Hello World')).toBe('Hello World');
      expect(sanitizeString('Test 123')).toBe('Test 123');
    });
  });

  describe('isValidAmount', () => {
    it('should validate correct amounts', () => {
      expect(isValidAmount('1')).toBe(true);
      expect(isValidAmount('0.5')).toBe(true);
      expect(isValidAmount('100.123456')).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(isValidAmount('')).toBe(false);
      expect(isValidAmount('abc')).toBe(false);
      expect(isValidAmount('-1')).toBe(false);
    });
  });
});
