import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MobileOptimization } from './MobileOptimization';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
const mockResizeObserver = jest.fn();
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.ResizeObserver = mockResizeObserver;

// Mock touch events
const createTouchEvent = (type: string, touches: Array<{ clientX: number; clientY: number }>) => {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'touches', {
    value: touches.map(touch => ({
      ...touch,
      identifier: 0,
      target: document.body,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1,
    })),
    writable: false,
  });
  return event;
};

describe('MobileOptimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock viewport
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 667,
      writable: true,
    });
  });

  describe('Touch Gesture Support', () => {
    it('should handle swipe gestures', async () => {
      const onSwipe = jest.fn();
      
      render(
        <MobileOptimization>
          <div data-testid="swipe-area" onSwipe={onSwipe}>
            Swipe me
          </div>
        </MobileOptimization>
      );

      const swipeArea = screen.getByTestId('swipe-area');

      // Simulate swipe right
      fireEvent(swipeArea, createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      fireEvent(swipeArea, createTouchEvent('touchmove', [{ clientX: 200, clientY: 100 }]));
      fireEvent(swipeArea, createTouchEvent('touchend', []));

      await waitFor(() => {
        expect(onSwipe).toHaveBeenCalledWith(expect.objectContaining({
          direction: 'right',
          distance: 100,
        }));
      });
    });

    it('should handle pinch-to-zoom gestures', async () => {
      const onPinch = jest.fn();
      
      render(
        <MobileOptimization>
          <div data-testid="pinch-area" onPinch={onPinch}>
            Pinch me
          </div>
        </MobileOptimization>
      );

      const pinchArea = screen.getByTestId('pinch-area');

      // Simulate pinch gesture
      fireEvent(pinchArea, createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 }
      ]));
      
      fireEvent(pinchArea, createTouchEvent('touchmove', [
        { clientX: 80, clientY: 100 },
        { clientX: 220, clientY: 100 }
      ]));
      
      fireEvent(pinchArea, createTouchEvent('touchend', []));

      await waitFor(() => {
        expect(onPinch).toHaveBeenCalledWith(expect.objectContaining({
          scale: expect.any(Number),
          center: expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number),
          }),
        }));
      });
    });

    it('should handle tap gestures with proper timing', async () => {
      const onTap = jest.fn();
      const onDoubleTap = jest.fn();
      
      render(
        <MobileOptimization>
          <div data-testid="tap-area" onTap={onTap} onDoubleTap={onDoubleTap}>
            Tap me
          </div>
        </MobileOptimization>
      );

      const tapArea = screen.getByTestId('tap-area');

      // Single tap
      fireEvent(tapArea, createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      fireEvent(tapArea, createTouchEvent('touchend', []));

      await waitFor(() => {
        expect(onTap).toHaveBeenCalled();
      });

      // Double tap
      fireEvent(tapArea, createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      fireEvent(tapArea, createTouchEvent('touchend', []));
      fireEvent(tapArea, createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      fireEvent(tapArea, createTouchEvent('touchend', []));

      await waitFor(() => {
        expect(onDoubleTap).toHaveBeenCalled();
      });
    });
  });

  describe('Viewport Management', () => {
    it('should detect mobile viewport', () => {
      render(<MobileOptimization />);
      
      // Should apply mobile-specific optimizations
      expect(document.body).toHaveClass('mobile-optimized');
    });

    it('should handle orientation changes', async () => {
      const onOrientationChange = jest.fn();
      
      render(
        <MobileOptimization onOrientationChange={onOrientationChange}>
          <div>Content</div>
        </MobileOptimization>
      );

      // Simulate orientation change
      Object.defineProperty(window, 'innerWidth', { value: 667, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 375, writable: true });
      
      fireEvent(window, new Event('orientationchange'));

      await waitFor(() => {
        expect(onOrientationChange).toHaveBeenCalledWith('landscape');
      });
    });

    it('should adjust viewport meta tag for mobile', () => {
      render(<MobileOptimization />);
      
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      expect(viewportMeta).toHaveAttribute(
        'content',
        expect.stringContaining('user-scalable=no')
      );
    });
  });

  describe('Performance Optimizations', () => {
    it('should implement lazy loading for images', async () => {
      render(
        <MobileOptimization>
          <img data-testid="lazy-image" src="test.jpg" loading="lazy" />
        </MobileOptimization>
      );

      const image = screen.getByTestId('lazy-image');
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('should optimize scroll performance', async () => {
      const onScroll = jest.fn();
      
      render(
        <MobileOptimization>
          <div data-testid="scroll-area" onScroll={onScroll} style={{ height: '200px', overflow: 'auto' }}>
            <div style={{ height: '1000px' }}>Long content</div>
          </div>
        </MobileOptimization>
      );

      const scrollArea = screen.getByTestId('scroll-area');
      
      // Simulate scroll
      fireEvent.scroll(scrollArea, { target: { scrollY: 100 } });

      // Should throttle scroll events
      expect(onScroll).toHaveBeenCalledTimes(1);
    });

    it('should implement virtual scrolling for long lists', async () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      
      render(
        <MobileOptimization>
          <div data-testid="virtual-list">
            {items.map(item => (
              <div key={item.id} data-testid={`item-${item.id}`}>
                {item.name}
              </div>
            ))}
          </div>
        </MobileOptimization>
      );

      // Should only render visible items
      expect(screen.queryByTestId('item-0')).toBeInTheDocument();
      expect(screen.queryByTestId('item-999')).not.toBeInTheDocument();
    });
  });

  describe('Battery and Data Optimization', () => {
    it('should reduce animations when battery is low', async () => {
      // Mock battery API
      Object.defineProperty(navigator, 'getBattery', {
        value: () => Promise.resolve({
          level: 0.1, // 10% battery
          charging: false,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        }),
        writable: true,
      });

      render(
        <MobileOptimization>
          <div data-testid="animated-element" className="animate-pulse">
            Animated content
          </div>
        </MobileOptimization>
      );

      await waitFor(() => {
        const element = screen.getByTestId('animated-element');
        expect(element).toHaveClass('reduce-motion');
      });
    });

    it('should optimize images for mobile data usage', () => {
      render(
        <MobileOptimization>
          <img data-testid="optimized-image" src="test.jpg" />
        </MobileOptimization>
      );

      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('loading', 'lazy');
      expect(image).toHaveAttribute('decoding', 'async');
    });

    it('should implement data saver mode', async () => {
      // Mock connection API
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          saveData: true,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        },
        writable: true,
      });

      render(
        <MobileOptimization>
          <div data-testid="content">Content</div>
        </MobileOptimization>
      );

      await waitFor(() => {
        expect(document.body).toHaveClass('data-saver-mode');
      });
    });
  });

  describe('Accessibility on Mobile', () => {
    it('should increase touch target sizes', () => {
      render(
        <MobileOptimization>
          <button data-testid="mobile-button">Click me</button>
        </MobileOptimization>
      );

      const button = screen.getByTestId('mobile-button');
      const styles = window.getComputedStyle(button);
      
      // Should have minimum 44px touch target
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
      expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
    });

    it('should improve focus management for mobile', async () => {
      render(
        <MobileOptimization>
          <input data-testid="mobile-input" type="text" />
          <button data-testid="mobile-button">Submit</button>
        </MobileOptimization>
      );

      const input = screen.getByTestId('mobile-input');
      const button = screen.getByTestId('mobile-button');

      // Focus input
      fireEvent.focus(input);
      expect(input).toHaveFocus();

      // Tab to button
      fireEvent.keyDown(input, { key: 'Tab' });
      expect(button).toHaveFocus();
    });

    it('should handle screen reader announcements', async () => {
      const mockAnnounce = jest.fn();
      
      render(
        <MobileOptimization onAnnouncement={mockAnnounce}>
          <div data-testid="content">Content loaded</div>
        </MobileOptimization>
      );

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalledWith('Content loaded');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for different screen sizes', () => {
      // Test mobile
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      
      const { rerender } = render(
        <MobileOptimization>
          <div data-testid="responsive-content">Content</div>
        </MobileOptimization>
      );

      expect(document.body).toHaveClass('mobile');

      // Test tablet
      Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
      fireEvent(window, new Event('resize'));

      rerender(
        <MobileOptimization>
          <div data-testid="responsive-content">Content</div>
        </MobileOptimization>
      );

      expect(document.body).toHaveClass('tablet');
    });

    it('should handle safe area insets', () => {
      // Mock safe area insets
      document.documentElement.style.setProperty('--sat', '44px');
      document.documentElement.style.setProperty('--sab', '34px');

      render(
        <MobileOptimization>
          <div data-testid="safe-area-content">Content</div>
        </MobileOptimization>
      );

      const content = screen.getByTestId('safe-area-content');
      expect(content).toHaveStyle({
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle touch event errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(
        <MobileOptimization>
          <div data-testid="error-prone">Content</div>
        </MobileOptimization>
      );

      const element = screen.getByTestId('error-prone');
      
      // Simulate touch event error
      const errorEvent = new Event('touchstart');
      Object.defineProperty(errorEvent, 'touches', {
        get: () => { throw new Error('Touch error'); },
      });

      fireEvent(element, errorEvent);

      // Should not crash the app
      expect(screen.getByTestId('error-prone')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should fallback when APIs are not available', () => {
      // Remove battery API
      delete (navigator as any).getBattery;
      delete (navigator as any).connection;

      render(
        <MobileOptimization>
          <div data-testid="fallback-content">Content</div>
        </MobileOptimization>
      );

      // Should still render without errors
      expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    });
  });
});