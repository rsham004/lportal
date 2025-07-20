import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationSystem } from './NotificationSystem';
import { NotificationProvider } from './NotificationProvider';

// Mock service worker for push notifications
const mockServiceWorker = {
  register: jest.fn(),
  getRegistration: jest.fn(),
  pushManager: {
    subscribe: jest.fn(),
    getSubscription: jest.fn(),
  },
};

// Mock Notification API
const mockNotification = {
  permission: 'default',
  requestPermission: jest.fn(),
};

Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: mockServiceWorker,
  },
  writable: true,
});

Object.defineProperty(global, 'Notification', {
  value: mockNotification,
  writable: true,
});

const mockUser = {
  id: 'user-123',
  name: 'John Doe',
  role: 'student',
};

const mockNotifications = [
  {
    id: 'notif-1',
    userId: 'user-123',
    type: 'assignment_due' as const,
    title: 'Assignment Due Soon',
    message: 'Your assignment is due in 2 hours',
    data: { assignmentId: 'assignment-123' },
    createdAt: '2024-01-15T10:00:00Z',
    read: false,
  },
  {
    id: 'notif-2',
    userId: 'user-123',
    type: 'course_update' as const,
    title: 'New Lesson Available',
    message: 'A new lesson has been added to React Fundamentals',
    data: { courseId: 'course-456', lessonId: 'lesson-789' },
    createdAt: '2024-01-15T09:30:00Z',
    read: true,
  },
  {
    id: 'notif-3',
    userId: 'user-123',
    type: 'achievement' as const,
    title: 'Achievement Unlocked!',
    message: 'You completed your first course!',
    data: { achievementId: 'first-course' },
    createdAt: '2024-01-15T09:00:00Z',
    read: false,
  },
];

const mockNotificationContext = {
  notifications: mockNotifications,
  unreadCount: 2,
  isPermissionGranted: false,
  isSubscribed: false,
  requestPermission: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  deleteNotification: jest.fn(),
  clearAll: jest.fn(),
};

const renderWithProvider = (component: React.ReactElement, context = mockNotificationContext) => {
  return render(
    <NotificationProvider value={context}>
      {component}
    </NotificationProvider>
  );
};

describe('NotificationSystem', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Notification Display', () => {
    it('should render notification bell with unread count', () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // unread count badge
    });

    it('should not show badge when no unread notifications', () => {
      const contextWithNoUnread = {
        ...mockNotificationContext,
        unreadCount: 0,
      };

      renderWithProvider(<NotificationSystem currentUser={mockUser} />, contextWithNoUnread);

      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });

    it('should show notifications panel when bell is clicked', async () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Assignment Due Soon')).toBeInTheDocument();
      expect(screen.getByText('New Lesson Available')).toBeInTheDocument();
      expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
    });

    it('should display notification types with correct icons', async () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      // Check for different notification type indicators
      expect(screen.getByTestId('assignment-icon')).toBeInTheDocument();
      expect(screen.getByTestId('course-icon')).toBeInTheDocument();
      expect(screen.getByTestId('achievement-icon')).toBeInTheDocument();
    });

    it('should show unread notifications with visual distinction', async () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      const notifications = screen.getAllByTestId('notification-item');
      
      // First notification (unread) should have unread styling
      expect(notifications[0]).toHaveClass('bg-blue-50');
      
      // Second notification (read) should not have unread styling
      expect(notifications[1]).not.toHaveClass('bg-blue-50');
    });

    it('should show relative timestamps', async () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      expect(screen.getByText(/ago/)).toBeInTheDocument();
    });
  });

  describe('Permission Management', () => {
    it('should show permission request when not granted', async () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /enable notifications/i })).toBeInTheDocument();
    });

    it('should request notification permission when button clicked', async () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      const enableButton = screen.getByRole('button', { name: /enable notifications/i });
      await user.click(enableButton);

      expect(mockNotificationContext.requestPermission).toHaveBeenCalled();
    });

    it('should show subscription options when permission granted', async () => {
      const contextWithPermission = {
        ...mockNotificationContext,
        isPermissionGranted: true,
      };

      renderWithProvider(<NotificationSystem currentUser={mockUser} />, contextWithPermission);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      expect(screen.getByText('Push Notifications')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
    });

    it('should handle subscription toggle', async () => {
      const contextWithPermission = {
        ...mockNotificationContext,
        isPermissionGranted: true,
        isSubscribed: false,
      };

      renderWithProvider(<NotificationSystem currentUser={mockUser} />, contextWithPermission);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      const subscribeButton = screen.getByRole('button', { name: /subscribe/i });
      await user.click(subscribeButton);

      expect(mockNotificationContext.subscribe).toHaveBeenCalled();
    });

    it('should show unsubscribe option when subscribed', async () => {
      const contextWithSubscription = {
        ...mockNotificationContext,
        isPermissionGranted: true,
        isSubscribed: true,
      };

      renderWithProvider(<NotificationSystem currentUser={mockUser} />, contextWithSubscription);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      expect(screen.getByRole('button', { name: /unsubscribe/i })).toBeInTheDocument();
    });
  });

  describe('Notification Actions', () => {
    it('should mark notification as read when clicked', async () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      const firstNotification = screen.getByText('Assignment Due Soon');
      await user.click(firstNotification);

      expect(mockNotificationContext.markAsRead).toHaveBeenCalledWith('notif-1');
    });

    it('should show mark all as read button', async () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      expect(screen.getByRole('button', { name: /mark all as read/i })).toBeInTheDocument();
    });

    it('should mark all notifications as read', async () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      const markAllButton = screen.getByRole('button', { name: /mark all as read/i });
      await user.click(markAllButton);

      expect(mockNotificationContext.markAllAsRead).toHaveBeenCalled();
    });

    it('should delete individual notifications', async () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(mockNotificationContext.deleteNotification).toHaveBeenCalledWith('notif-1');
    });

    it('should clear all notifications', async () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      const clearAllButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearAllButton);

      expect(mockNotificationContext.clearAll).toHaveBeenCalled();
    });
  });

  describe('Notification Filtering', () => {
    it('should filter notifications by type', async () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      const filterSelect = screen.getByRole('combobox', { name: /filter/i });
      await user.selectOptions(filterSelect, 'assignment_due');

      // Should only show assignment notifications
      expect(screen.getByText('Assignment Due Soon')).toBeInTheDocument();
      expect(screen.queryByText('New Lesson Available')).not.toBeInTheDocument();
      expect(screen.queryByText('Achievement Unlocked!')).not.toBeInTheDocument();
    });

    it('should filter by read status', async () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      const filterSelect = screen.getByRole('combobox', { name: /filter/i });
      await user.selectOptions(filterSelect, 'unread');

      // Should only show unread notifications
      expect(screen.getByText('Assignment Due Soon')).toBeInTheDocument();
      expect(screen.queryByText('New Lesson Available')).not.toBeInTheDocument();
      expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should update unread count when new notification arrives', async () => {
      const { rerender } = renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      expect(screen.getByText('2')).toBeInTheDocument();

      const updatedContext = {
        ...mockNotificationContext,
        unreadCount: 3,
        notifications: [
          {
            id: 'notif-new',
            userId: 'user-123',
            type: 'message' as const,
            title: 'New Message',
            message: 'You have a new message',
            data: {},
            createdAt: new Date().toISOString(),
            read: false,
          },
          ...mockNotifications,
        ],
      };

      render(
        <NotificationProvider value={updatedContext}>
          <NotificationSystem currentUser={mockUser} />
        </NotificationProvider>
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should show toast for new notifications', async () => {
      const { rerender } = renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      const updatedContext = {
        ...mockNotificationContext,
        notifications: [
          {
            id: 'notif-new',
            userId: 'user-123',
            type: 'message' as const,
            title: 'New Message',
            message: 'You have a new message',
            data: {},
            createdAt: new Date().toISOString(),
            read: false,
          },
          ...mockNotifications,
        ],
      };

      render(
        <NotificationProvider value={updatedContext}>
          <NotificationSystem currentUser={mockUser} />
        </NotificationProvider>
      );

      expect(screen.getByRole('alert')).toHaveTextContent('New Message');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      expect(screen.getByRole('button', { name: /notifications/i })).toHaveAttribute('aria-label');
      expect(screen.getByText('2')).toHaveAttribute('aria-label', 'Unread notifications');
    });

    it('should be keyboard navigable', async () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      
      await user.tab();
      expect(bellButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('should announce new notifications to screen readers', async () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      // Simulate new notification
      const updatedContext = {
        ...mockNotificationContext,
        notifications: [
          {
            id: 'notif-new',
            userId: 'user-123',
            type: 'message' as const,
            title: 'New Message',
            message: 'You have a new message',
            data: {},
            createdAt: new Date().toISOString(),
            read: false,
          },
          ...mockNotifications,
        ],
      };

      render(
        <NotificationProvider value={updatedContext}>
          <NotificationSystem currentUser={mockUser} />
        </NotificationProvider>
      );

      expect(screen.getByRole('status')).toHaveTextContent('New notification: New Message');
    });

    it('should support high contrast mode', () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      expect(bellButton).toHaveClass('focus:ring-2');
    });
  });

  describe('Performance', () => {
    it('should virtualize long notification lists', async () => {
      const manyNotifications = Array.from({ length: 1000 }, (_, i) => ({
        id: `notif-${i}`,
        userId: 'user-123',
        type: 'message' as const,
        title: `Notification ${i}`,
        message: `Message ${i}`,
        data: {},
        createdAt: new Date(Date.now() - i * 1000).toISOString(),
        read: i % 2 === 0,
      }));

      const contextWithManyNotifications = {
        ...mockNotificationContext,
        notifications: manyNotifications,
      };

      renderWithProvider(<NotificationSystem currentUser={mockUser} />, contextWithManyNotifications);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      // Should only render visible notifications (virtualization)
      const renderedNotifications = screen.getAllByTestId('notification-item');
      expect(renderedNotifications.length).toBeLessThan(100); // Should be much less than 1000
    });

    it('should debounce mark as read actions', async () => {
      renderWithProvider(<NotificationSystem currentUser={mockUser} />);

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      const firstNotification = screen.getByText('Assignment Due Soon');
      
      // Click multiple times quickly
      await user.click(firstNotification);
      await user.click(firstNotification);
      await user.click(firstNotification);

      // Should debounce and only call once
      await waitFor(() => {
        expect(mockNotificationContext.markAsRead).toHaveBeenCalledTimes(1);
      });
    });
  });
});