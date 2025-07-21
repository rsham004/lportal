import { cn } from '@/lib/utils'

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('handles conditional classes', () => {
    expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
  })

  it('handles undefined and null values', () => {
    expect(cn('base', undefined, null, 'valid')).toBe('base valid')
  })

  it('merges Tailwind classes correctly', () => {
    // tailwind-merge should handle conflicting classes
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles arrays of classes', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
  })

  it('handles objects with boolean values', () => {
    expect(cn({
      'always-present': true,
      'conditionally-present': true,
      'never-present': false,
    })).toBe('always-present conditionally-present')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
    expect(cn(undefined)).toBe('')
    expect(cn(null)).toBe('')
  })

  it('handles complex combinations', () => {
    const result = cn(
      'base-class',
      {
        'conditional-class': true,
        'hidden-class': false,
      },
      ['array-class1', 'array-class2'],
      undefined,
      'final-class'
    )
    
    expect(result).toBe('base-class conditional-class array-class1 array-class2 final-class')
  })

  it('handles duplicate classes', () => {
    // Note: cn doesn't deduplicate by default, it merges classes
    expect(cn('duplicate', 'other', 'duplicate')).toBe('duplicate other duplicate')
  })
})