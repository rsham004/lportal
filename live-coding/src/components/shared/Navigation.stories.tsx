import type { Meta, StoryObj } from '@storybook/react';
import { Navigation, NavigationItem, NavigationMenu, NavigationTrigger, NavigationContent } from './Navigation';

// Mock Next.js router for Storybook
const mockRouter = {
  push: () => {},
  replace: () => {},
  prefetch: () => {},
};

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => mockRouter,
}));

const meta: Meta<typeof Navigation> = {
  title: 'Shared/Navigation',
  component: Navigation,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Navigation>
      <NavigationItem href="/dashboard">Dashboard</NavigationItem>
      <NavigationItem href="/courses">Courses</NavigationItem>
      <NavigationItem href="/assignments">Assignments</NavigationItem>
      <NavigationItem href="/grades">Grades</NavigationItem>
    </Navigation>
  ),
};

export const WithActiveState: Story = {
  render: () => (
    <Navigation>
      <NavigationItem href="/dashboard">Dashboard</NavigationItem>
      <NavigationItem href="/courses">Courses</NavigationItem>
      <NavigationItem href="/assignments">Assignments</NavigationItem>
      <NavigationItem href="/grades">Grades</NavigationItem>
    </Navigation>
  ),
};

export const WithDropdownMenu: Story = {
  render: () => (
    <Navigation>
      <NavigationItem href="/dashboard">Dashboard</NavigationItem>
      <NavigationItem href="/courses">Courses</NavigationItem>
      <NavigationItem href="/assignments">Assignments</NavigationItem>
      <NavigationMenu>
        <NavigationTrigger>More</NavigationTrigger>
        <NavigationContent>
          <NavigationItem href="/settings">Settings</NavigationItem>
          <NavigationItem href="/profile">Profile</NavigationItem>
          <NavigationItem href="/help">Help</NavigationItem>
          <NavigationItem href="/logout">Logout</NavigationItem>
        </NavigationContent>
      </NavigationMenu>
    </Navigation>
  ),
};

export const WithDisabledItems: Story = {
  render: () => (
    <Navigation>
      <NavigationItem href="/dashboard">Dashboard</NavigationItem>
      <NavigationItem href="/courses">Courses</NavigationItem>
      <NavigationItem href="/assignments" disabled>Assignments (Coming Soon)</NavigationItem>
      <NavigationItem href="/grades">Grades</NavigationItem>
    </Navigation>
  ),
};

export const StudentNavigation: Story = {
  render: () => (
    <Navigation>
      <NavigationItem href="/dashboard">Dashboard</NavigationItem>
      <NavigationItem href="/my-courses">My Courses</NavigationItem>
      <NavigationItem href="/assignments">Assignments</NavigationItem>
      <NavigationItem href="/grades">Grades</NavigationItem>
      <NavigationItem href="/calendar">Calendar</NavigationItem>
      <NavigationMenu>
        <NavigationTrigger>Account</NavigationTrigger>
        <NavigationContent>
          <NavigationItem href="/profile">Profile</NavigationItem>
          <NavigationItem href="/settings">Settings</NavigationItem>
          <NavigationItem href="/billing">Billing</NavigationItem>
          <NavigationItem href="/help">Help & Support</NavigationItem>
          <NavigationItem href="/logout">Sign Out</NavigationItem>
        </NavigationContent>
      </NavigationMenu>
    </Navigation>
  ),
};

export const InstructorNavigation: Story = {
  render: () => (
    <Navigation>
      <NavigationItem href="/dashboard">Dashboard</NavigationItem>
      <NavigationItem href="/courses">My Courses</NavigationItem>
      <NavigationItem href="/students">Students</NavigationItem>
      <NavigationItem href="/analytics">Analytics</NavigationItem>
      <NavigationMenu>
        <NavigationTrigger>Tools</NavigationTrigger>
        <NavigationContent>
          <NavigationItem href="/course-builder">Course Builder</NavigationItem>
          <NavigationItem href="/assignment-creator">Assignment Creator</NavigationItem>
          <NavigationItem href="/gradebook">Gradebook</NavigationItem>
          <NavigationItem href="/reports">Reports</NavigationItem>
        </NavigationContent>
      </NavigationMenu>
      <NavigationMenu>
        <NavigationTrigger>Account</NavigationTrigger>
        <NavigationContent>
          <NavigationItem href="/profile">Profile</NavigationItem>
          <NavigationItem href="/settings">Settings</NavigationItem>
          <NavigationItem href="/help">Help</NavigationItem>
          <NavigationItem href="/logout">Sign Out</NavigationItem>
        </NavigationContent>
      </NavigationMenu>
    </Navigation>
  ),
};

export const AdminNavigation: Story = {
  render: () => (
    <Navigation>
      <NavigationItem href="/admin/dashboard">Dashboard</NavigationItem>
      <NavigationItem href="/admin/users">Users</NavigationItem>
      <NavigationItem href="/admin/courses">Courses</NavigationItem>
      <NavigationItem href="/admin/analytics">Analytics</NavigationItem>
      <NavigationMenu>
        <NavigationTrigger>System</NavigationTrigger>
        <NavigationContent>
          <NavigationItem href="/admin/settings">System Settings</NavigationItem>
          <NavigationItem href="/admin/integrations">Integrations</NavigationItem>
          <NavigationItem href="/admin/backups">Backups</NavigationItem>
          <NavigationItem href="/admin/logs">System Logs</NavigationItem>
        </NavigationContent>
      </NavigationMenu>
      <NavigationMenu>
        <NavigationTrigger>Account</NavigationTrigger>
        <NavigationContent>
          <NavigationItem href="/profile">Profile</NavigationItem>
          <NavigationItem href="/settings">Settings</NavigationItem>
          <NavigationItem href="/logout">Sign Out</NavigationItem>
        </NavigationContent>
      </NavigationMenu>
    </Navigation>
  ),
};