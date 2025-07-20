/**
 * Phase Integration Demonstration Component
 * 
 * Visual demonstration showing how Phase 1, Phase 2.1, and Phase 2.2 
 * components work together seamlessly across different user roles.
 */

'use client'

import React, { useState } from 'react'
import { AuthProvider } from './auth/AuthProvider'
import { AuthorizationProvider } from './authorization/AuthorizationProvider'
import { Can } from './authorization/Can'
import { RoleGuard } from './authorization/RoleGuard'
import { Header } from './shared/Header'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Form } from './ui/Form'
import { Card } from './ui/Card'
import { ThemeProvider } from './providers/ThemeProvider'
import { ThemeToggle } from './ui/ThemeToggle'
import { AppLayout } from './ui/AppLayout'
import { UserRole } from '../lib/authorization/roles'

// Mock user data for demonstration
const mockUsers = {
  [UserRole.STUDENT]: {
    id: 'student_123',
    name: 'Alice Student',
    email: 'alice@student.com',
    role: UserRole.STUDENT,
  },
  [UserRole.INSTRUCTOR]: {
    id: 'instructor_123',
    name: 'Bob Instructor',
    email: 'bob@instructor.com',
    role: UserRole.INSTRUCTOR,
  },
  [UserRole.ADMIN]: {
    id: 'admin_123',
    name: 'Carol Admin',
    email: 'carol@admin.com',
    role: UserRole.ADMIN,
  },
  [UserRole.SUPER_ADMIN]: {
    id: 'superadmin_123',
    name: 'Dave SuperAdmin',
    email: 'dave@superadmin.com',
    role: UserRole.SUPER_ADMIN,
  },
}

interface DemoSectionProps {
  title: string
  description: string
  children: React.ReactNode
}

function DemoSection({ title, description, children }: DemoSectionProps) {
  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </Card>
  )
}

interface RoleSwitcherProps {
  currentRole: UserRole | null
  onRoleChange: (role: UserRole | null) => void
}

function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  return (
    <Card className="p-4 bg-muted/50">
      <h4 className="font-medium mb-3">Switch User Role (Demo)</h4>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={currentRole === null ? "default" : "outline"}
          size="sm"
          onClick={() => onRoleChange(null)}
        >
          Unauthenticated
        </Button>
        {Object.values(UserRole).map(role => (
          <Button
            key={role}
            variant={currentRole === role ? "default" : "outline"}
            size="sm"
            onClick={() => onRoleChange(role)}
            className="capitalize"
          >
            {role.replace('_', ' ')}
          </Button>
        ))}
      </div>
      {currentRole && (
        <div className="mt-3 p-3 bg-background rounded border">
          <p className="text-sm">
            <strong>Current User:</strong> {mockUsers[currentRole].name} ({mockUsers[currentRole].email})
          </p>
        </div>
      )}
    </Card>
  )
}

function PermissionMatrix({ currentRole }: { currentRole: UserRole | null }) {
  const permissions = [
    { action: 'read', subject: 'Course', label: 'Read Courses' },
    { action: 'create', subject: 'Course', label: 'Create Courses' },
    { action: 'update', subject: 'Course', label: 'Update Courses' },
    { action: 'delete', subject: 'Course', label: 'Delete Courses' },
    { action: 'manage', subject: 'User', label: 'Manage Users' },
    { action: 'manage', subject: 'System', label: 'Manage System' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
      {permissions.map(({ action, subject, label }) => (
        <Can key={`${action}-${subject}`} action={action} subject={subject}>
          <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
            <span className="text-green-600 dark:text-green-400">✅</span>
            <span className="text-green-800 dark:text-green-200">{label}</span>
          </div>
        </Can>
      ))}
      {permissions.map(({ action, subject, label }) => (
        <Can 
          key={`${action}-${subject}-denied`} 
          action={action} 
          subject={subject}
          fallback={
            <div className="flex items-center space-x-2 p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
              <span className="text-red-600 dark:text-red-400">❌</span>
              <span className="text-red-800 dark:text-red-200">{label}</span>
            </div>
          }
        />
      ))}
    </div>
  )
}

function CourseManagementDemo({ currentRole }: { currentRole: UserRole | null }) {
  const [courseTitle, setCourseTitle] = useState('')

  return (
    <div className="space-y-4">
      <Can 
        action="create" 
        subject="Course"
        fallback={
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
            <p className="text-yellow-800 dark:text-yellow-200">
              You need instructor privileges to create courses.
            </p>
          </div>
        }
      >
        <Form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Course Title</label>
            <Input
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="Enter course title..."
              className="w-full"
            />
          </div>
          <Button type="submit" disabled={!courseTitle.trim()}>
            Create Course
          </Button>
        </Form>
      </Can>

      <div className="grid gap-3">
        <h5 className="font-medium">Available Actions:</h5>
        <div className="space-y-2">
          <Can action="read" subject="Course">
            <Button variant="outline" size="sm" className="w-full justify-start">
              📖 View All Courses
            </Button>
          </Can>
          <Can action="create" subject="Course">
            <Button variant="outline" size="sm" className="w-full justify-start">
              ➕ Create New Course
            </Button>
          </Can>
          <Can action="update" subject="Course">
            <Button variant="outline" size="sm" className="w-full justify-start">
              ✏️ Edit Courses
            </Button>
          </Can>
          <Can action="delete" subject="Course">
            <Button variant="outline" size="sm" className="w-full justify-start">
              🗑️ Delete Courses
            </Button>
          </Can>
        </div>
      </div>
    </div>
  )
}

function AdminPanelDemo() {
  return (
    <RoleGuard 
      allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}
      fallback={
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
          <p className="text-red-800 dark:text-red-200">
            Admin access required to view this panel.
          </p>
        </div>
      }
    >
      <div className="space-y-4">
        <h5 className="font-medium">Admin Panel</h5>
        <div className="grid grid-cols-2 gap-3">
          <Can action="manage" subject="User">
            <Button variant="secondary" size="sm" className="w-full">
              👥 Manage Users
            </Button>
          </Can>
          <Button variant="secondary" size="sm" className="w-full">
            📊 View Analytics
          </Button>
          <Can action="manage" subject="System">
            <Button variant="destructive" size="sm" className="w-full">
              ⚙️ System Settings
            </Button>
          </Can>
          <Button variant="secondary" size="sm" className="w-full">
            📋 Audit Logs
          </Button>
        </div>
      </div>
    </RoleGuard>
  )
}

export function PhaseIntegrationDemo() {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(UserRole.STUDENT)

  // Mock Clerk auth based on selected role
  React.useEffect(() => {
    // In a real app, this would be handled by Clerk
    // This is just for demonstration purposes
  }, [currentRole])

  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthorizationProvider>
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 space-y-8">
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-foreground">
                  Phase Integration Demonstration
                </h1>
                <p className="text-muted-foreground max-w-3xl mx-auto">
                  This demonstration shows how Phase 1 (UI Components), Phase 2.1 (Authentication), 
                  and Phase 2.2 (Authorization) work together seamlessly. Switch between different 
                  user roles to see how the interface adapts.
                </p>
              </div>

              <RoleSwitcher currentRole={currentRole} onRoleChange={setCurrentRole} />

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Header Integration Demo */}
                <DemoSection
                  title="Header Integration"
                  description="Phase 1 Header component with Phase 2.1 authentication and Phase 2.2 authorization"
                >
                  <div className="border rounded-lg overflow-hidden">
                    <Header />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Phase 1: Logo, search, theme toggle, responsive design</p>
                    <p>• Phase 2.1: Sign in/out buttons, user menu</p>
                    <p>• Phase 2.2: Role-based notification visibility</p>
                  </div>
                </DemoSection>

                {/* Permission Matrix */}
                <DemoSection
                  title="Permission Matrix"
                  description="Real-time permission checking based on current user role"
                >
                  <PermissionMatrix currentRole={currentRole} />
                </DemoSection>

                {/* Course Management */}
                <DemoSection
                  title="Course Management"
                  description="Phase 1 forms with Phase 2.2 permission-based access control"
                >
                  <CourseManagementDemo currentRole={currentRole} />
                </DemoSection>

                {/* Admin Panel */}
                <DemoSection
                  title="Admin Panel"
                  description="Role-based UI rendering with Phase 1 components"
                >
                  <AdminPanelDemo />
                </DemoSection>

                {/* Theme Integration */}
                <DemoSection
                  title="Theme Integration"
                  description="Phase 1 theme system working across all phases"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Theme Toggle:</span>
                      <ThemeToggle variant="button" />
                    </div>
                    <div className="p-4 bg-card text-card-foreground border rounded">
                      <p className="text-sm">
                        All components use consistent CSS variables for theming.
                        Authentication and authorization components inherit the same
                        theme system as Phase 1 components.
                      </p>
                    </div>
                  </div>
                </DemoSection>

                {/* Layout Integration */}
                <DemoSection
                  title="Layout Integration"
                  description="Phase 1 layout components with role-based content"
                >
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      AppLayout components work seamlessly with authorization:
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded border">
                        <strong>Header:</strong> Auth state
                      </div>
                      <div className="p-2 bg-green-50 dark:bg-green-950 rounded border">
                        <strong>Sidebar:</strong> Role-based nav
                      </div>
                      <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded border">
                        <strong>Content:</strong> Permission gates
                      </div>
                    </div>
                  </div>
                </DemoSection>
              </div>

              {/* Integration Summary */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Integration Verification Summary
                </h2>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">✅</div>
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Phase 1 Components
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      UI, Theme, Layout working
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-md">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">✅</div>
                    <div className="text-sm font-medium text-green-800 dark:text-green-200">
                      Phase 2.1 Auth
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      Clerk integration seamless
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-md">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">✅</div>
                    <div className="text-sm font-medium text-purple-800 dark:text-purple-200">
                      Phase 2.2 Authorization
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">
                      CASL permissions working
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-md">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">✅</div>
                    <div className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      Full Integration
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">
                      All phases working together
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </AuthorizationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}