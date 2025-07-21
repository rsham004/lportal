import { createAbility, AbilityContext } from './ability'
import { UserRole, Permission } from './roles'

describe('CASL Ability System', () => {
  describe('createAbility', () => {
    it('creates ability for student role', () => {
      const ability = createAbility(UserRole.STUDENT)
      
      expect(ability.can('read', 'Course')).toBe(true)
      expect(ability.can('read', 'User')).toBe(true)
      expect(ability.can('create', 'Course')).toBe(false)
      expect(ability.can('manage', 'User')).toBe(false)
    })

    it('creates ability for instructor role', () => {
      const ability = createAbility(UserRole.INSTRUCTOR)
      
      expect(ability.can('read', 'Course')).toBe(true)
      expect(ability.can('create', 'Course')).toBe(true)
      expect(ability.can('update', 'Course')).toBe(true)
      expect(ability.can('delete', 'Course')).toBe(false)
      expect(ability.can('manage', 'User')).toBe(false)
    })

    it('creates ability for admin role', () => {
      const ability = createAbility(UserRole.ADMIN)
      
      expect(ability.can('read', 'Course')).toBe(true)
      expect(ability.can('create', 'Course')).toBe(true)
      expect(ability.can('update', 'Course')).toBe(true)
      expect(ability.can('delete', 'Course')).toBe(true)
      expect(ability.can('manage', 'User')).toBe(true)
      expect(ability.can('manage', 'System')).toBe(false)
    })

    it('creates ability for super admin role', () => {
      const ability = createAbility(UserRole.SUPER_ADMIN)
      
      expect(ability.can('read', 'Course')).toBe(true)
      expect(ability.can('create', 'Course')).toBe(true)
      expect(ability.can('update', 'Course')).toBe(true)
      expect(ability.can('delete', 'Course')).toBe(true)
      expect(ability.can('manage', 'User')).toBe(true)
      expect(ability.can('manage', 'System')).toBe(true)
    })

    it('creates empty ability for undefined role', () => {
      const ability = createAbility(undefined)
      
      expect(ability.can('read', 'Course')).toBe(false)
      expect(ability.can('read', 'User')).toBe(false)
      expect(ability.can('create', 'Course')).toBe(false)
    })

    it('creates empty ability for null role', () => {
      const ability = createAbility(null as any)
      
      expect(ability.can('read', 'Course')).toBe(false)
      expect(ability.can('read', 'User')).toBe(false)
      expect(ability.can('create', 'Course')).toBe(false)
    })
  })

  describe('AbilityContext', () => {
    it('provides ability context', () => {
      expect(AbilityContext).toBeDefined()
      expect(typeof AbilityContext).toBe('object')
    })
  })

  describe('Resource-specific permissions', () => {
    it('allows instructors to manage their own courses', () => {
      const ability = createAbility(UserRole.INSTRUCTOR, 'instructor_123')
      
      const ownCourse = { id: 'course_1', instructorId: 'instructor_123' }
      const otherCourse = { id: 'course_2', instructorId: 'instructor_456' }
      
      expect(ability.can('update', 'Course', ownCourse)).toBe(true)
      expect(ability.can('delete', 'Course', ownCourse)).toBe(true)
      expect(ability.can('update', 'Course', otherCourse)).toBe(false)
      expect(ability.can('delete', 'Course', otherCourse)).toBe(false)
    })

    it('allows users to manage their own profile', () => {
      const ability = createAbility(UserRole.STUDENT, 'student_123')
      
      const ownProfile = { id: 'student_123' }
      const otherProfile = { id: 'student_456' }
      
      expect(ability.can('update', 'User', ownProfile)).toBe(true)
      expect(ability.can('update', 'User', otherProfile)).toBe(false)
    })

    it('allows admins to manage all resources', () => {
      const ability = createAbility(UserRole.ADMIN, 'admin_123')
      
      const anyCourse = { id: 'course_1', instructorId: 'instructor_456' }
      const anyUser = { id: 'student_456' }
      
      expect(ability.can('update', 'Course', anyCourse)).toBe(true)
      expect(ability.can('delete', 'Course', anyCourse)).toBe(true)
      expect(ability.can('update', 'User', anyUser)).toBe(true)
      expect(ability.can('delete', 'User', anyUser)).toBe(true)
    })
  })
})