import { cn } from '@/lib/utils';
import { describe, expect, it } from '@jest/globals';

describe('Utils', () => {
  describe('cn function', () => {
    it('should combine class names correctly', () => {
      const result = cn('class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle conditional classes', () => {
      const result = cn('base-class', {
        'conditional-class': true,
        'false-class': false,
      });
      expect(result).toContain('base-class');
      expect(result).toContain('conditional-class');
      expect(result).not.toContain('false-class');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'valid-class');
      expect(result).toContain('base-class');
      expect(result).toContain('valid-class');
    });

    it('should handle empty strings', () => {
      const result = cn('', 'valid-class', '');
      expect(result).toContain('valid-class');
    });
  });
});
