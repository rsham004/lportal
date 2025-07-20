/**
 * User Roles and Permissions System
 * 
 * Defines the role-based access control system for the learning portal.
 * Each role has specific permissions that determine what actions they can perform.
 */

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum Permission {
  // Course permissions
  READ_COURSE = 'read_course',
  CREATE_COURSE = 'create_course',
  UPDATE_COURSE = 'update_course',
  DELETE_COURSE = 'delete_course',
  
  // User management permissions
  READ_USER = 'read_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  
  // Admin permissions
  MANAGE_USERS = 'manage_users',
  MANAGE_SYSTEM = 'manage_system',
  VIEW_ANALYTICS = 'view_analytics',
}

/**
 * Role permission mappings
 * Defines what permissions each role has
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.STUDENT]: [
    Permission.READ_COURSE,
    Permission.READ_USER,
  ],
  
  [UserRole.INSTRUCTOR]: [
    Permission.READ_COURSE,
    Permission.CREATE_COURSE,
    Permission.UPDATE_COURSE,
    Permission.READ_USER,
    Permission.UPDATE_USER, // Can update their own profile
  ],
  
  [UserRole.ADMIN]: [
    Permission.READ_COURSE,
    Permission.CREATE_COURSE,
    Permission.UPDATE_COURSE,
    Permission.DELETE_COURSE,
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.MANAGE_USERS,
    Permission.VIEW_ANALYTICS,
  ],
  
  [UserRole.SUPER_ADMIN]: [
    Permission.READ_COURSE,
    Permission.CREATE_COURSE,
    Permission.UPDATE_COURSE,
    Permission.DELETE_COURSE,
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.MANAGE_USERS,
    Permission.MANAGE_SYSTEM,
    Permission.VIEW_ANALYTICS,
  ],
}

/**
 * Get all permissions for a given role
 */
export function defineRolePermissions(role: UserRole): Permission[] {
  if (!role || !(role in ROLE_PERMISSIONS)) {
    throw new Error(`Invalid role: ${role}`)
  }
  
  return ROLE_PERMISSIONS[role]
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) {
    return false
  }
  
  try {
    const permissions = defineRolePermissions(role)
    return permissions.includes(permission)
  } catch {
    return false
  }
}

/**
 * Get user role from user object
 */
export function getUserRole(user: any): UserRole | null {
  if (!user?.publicMetadata?.role) {
    return null
  }
  
  const role = user.publicMetadata.role as string
  
  // Validate that the role is a valid UserRole
  if (Object.values(UserRole).includes(role as UserRole)) {
    return role as UserRole
  }
  
  return null
}

/**
 * Check if a role is higher than another role (for hierarchy checks)
 */
export function isRoleHigherThan(role1: UserRole, role2: UserRole): boolean {
  const hierarchy = [
    UserRole.STUDENT,
    UserRole.INSTRUCTOR,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ]
  
  const role1Index = hierarchy.indexOf(role1)
  const role2Index = hierarchy.indexOf(role2)
  
  return role1Index > role2Index
}

/**
 * Get all roles that are lower than the given role
 */
export function getLowerRoles(role: UserRole): UserRole[] {
  const hierarchy = [
    UserRole.STUDENT,
    UserRole.INSTRUCTOR,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ]
  
  const roleIndex = hierarchy.indexOf(role)
  return hierarchy.slice(0, roleIndex)
}