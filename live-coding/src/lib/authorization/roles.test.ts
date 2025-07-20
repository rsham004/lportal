import { UserRole, Permission, defineRolePermissions, hasPermission } from './roles'

describe('Authorization Roles and Permissions', () => {
  describe('UserRole enum', () => {
    it('defines all required user roles', () => {
      expect(UserRole.STUDENT).toBe('student')
      expect(UserRole.INSTRUCTOR).toBe('instructor')
      expect(UserRole.ADMIN).toBe('admin')
      expect(UserRole.SUPER_ADMIN).toBe('super_admin')
    })
  })

  describe('Permission enum', () => {
    it('defines all required permissions', () => {
      // Course permissions
      expect(Permission.READ_COURSE).toBe('read_course')
      expect(Permission.CREATE_COURSE).toBe('create_course')
      expect(Permission.UPDATE_COURSE).toBe('update_course')
      expect(Permission.DELETE_COURSE).toBe('delete_course')
      
      // User management permissions
      expect(Permission.READ_USER).toBe('read_user')
      expect(Permission.UPDATE_USER).toBe('update_user')
      expect(Permission.DELETE_USER).toBe('delete_user')
      
      // Admin permissions
      expect(Permission.MANAGE_USERS).toBe('manage_users')
      expect(Permission.MANAGE_SYSTEM).toBe('manage_system')
      expect(Permission.VIEW_ANALYTICS).toBe('view_analytics')
    })
  })

  describe('defineRolePermissions', () => {
    it('defines correct permissions for student role', () => {
      const studentPermissions = defineRolePermissions(UserRole.STUDENT)
      
      expect(studentPermissions).toContain(Permission.READ_COURSE)
      expect(studentPermissions).toContain(Permission.READ_USER)
      expect(studentPermissions).not.toContain(Permission.CREATE_COURSE)
      expect(studentPermissions).not.toContain(Permission.MANAGE_USERS)
    })

    it('defines correct permissions for instructor role', () => {
      const instructorPermissions = defineRolePermissions(UserRole.INSTRUCTOR)
      
      expect(instructorPermissions).toContain(Permission.READ_COURSE)
      expect(instructorPermissions).toContain(Permission.CREATE_COURSE)
      expect(instructorPermissions).toContain(Permission.UPDATE_COURSE)
      expect(instructorPermissions).toContain(Permission.READ_USER)
      expect(instructorPermissions).not.toContain(Permission.DELETE_USER)
      expect(instructorPermissions).not.toContain(Permission.MANAGE_SYSTEM)
    })

    it('defines correct permissions for admin role', () => {
      const adminPermissions = defineRolePermissions(UserRole.ADMIN)
      
      expect(adminPermissions).toContain(Permission.READ_COURSE)
      expect(adminPermissions).toContain(Permission.CREATE_COURSE)
      expect(adminPermissions).toContain(Permission.UPDATE_COURSE)
      expect(adminPermissions).toContain(Permission.DELETE_COURSE)
      expect(adminPermissions).toContain(Permission.MANAGE_USERS)
      expect(adminPermissions).toContain(Permission.VIEW_ANALYTICS)
      expect(adminPermissions).not.toContain(Permission.MANAGE_SYSTEM)
    })

    it('defines correct permissions for super admin role', () => {
      const superAdminPermissions = defineRolePermissions(UserRole.SUPER_ADMIN)
      
      expect(superAdminPermissions).toContain(Permission.READ_COURSE)
      expect(superAdminPermissions).toContain(Permission.CREATE_COURSE)
      expect(superAdminPermissions).toContain(Permission.UPDATE_COURSE)
      expect(superAdminPermissions).toContain(Permission.DELETE_COURSE)
      expect(superAdminPermissions).toContain(Permission.MANAGE_USERS)
      expect(superAdminPermissions).toContain(Permission.MANAGE_SYSTEM)
      expect(superAdminPermissions).toContain(Permission.VIEW_ANALYTICS)
    })

    it('throws error for invalid role', () => {
      expect(() => defineRolePermissions('invalid_role' as UserRole)).toThrow('Invalid role: invalid_role')
    })
  })

  describe('hasPermission', () => {
    it('returns true when user has the required permission', () => {
      expect(hasPermission(UserRole.INSTRUCTOR, Permission.CREATE_COURSE)).toBe(true)
      expect(hasPermission(UserRole.ADMIN, Permission.MANAGE_USERS)).toBe(true)
      expect(hasPermission(UserRole.SUPER_ADMIN, Permission.MANAGE_SYSTEM)).toBe(true)
    })

    it('returns false when user does not have the required permission', () => {
      expect(hasPermission(UserRole.STUDENT, Permission.CREATE_COURSE)).toBe(false)
      expect(hasPermission(UserRole.INSTRUCTOR, Permission.MANAGE_USERS)).toBe(false)
      expect(hasPermission(UserRole.ADMIN, Permission.MANAGE_SYSTEM)).toBe(false)
    })

    it('handles undefined role gracefully', () => {
      expect(hasPermission(undefined, Permission.READ_COURSE)).toBe(false)
    })

    it('handles null role gracefully', () => {
      expect(hasPermission(null as any, Permission.READ_COURSE)).toBe(false)
    })
  })
})