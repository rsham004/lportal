'use client';

import React, { useEffect, useRef, useState, ReactNode } from 'react';

interface TouchGesture {
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  scale?: number;
  center?: { x: number; y: number };
}

interface MobileOptimizationProps {
  children: ReactNode;
  onOrientationChange?: (orientation: 'portrait' | 'landscape') => void;
  onAnnouncement?: (message: string) => void;
}

interface TouchPoint {
  x: number;
  y: number;
  identifier: number;
}

export const MobileOptimization: React.FC<MobileOptimizationProps> = ({
  children,
  onOrientationChange,
  onAnnouncement,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isDataSaverMode, setIsDataSaverMode] = useState(false);
  
  const touchStartRef = useRef<TouchPoint[]>([]);
  const lastTapRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const width = window.innerWidth;
      const isMobileDevice = width <= 768;
      setIsMobile(isMobileDevice);
      
      // Add mobile class to body
      if (isMobileDevice) {
        document.body.classList.add('mobile-optimized');
        if (width <= 480) {
          document.body.classList.add('mobile');
        } else {
          document.body.classList.add('tablet');
        }
      } else {
        document.body.classList.remove('mobile-optimized', 'mobile', 'tablet');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    // Handle orientation changes
    const handleOrientationChange = () => {
      const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      setOrientation(newOrientation);
      onOrientationChange?.(newOrientation);
    };

    handleOrientationChange();
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [onOrientationChange]);

  useEffect(() => {
    // Battery optimization
    const initBatteryAPI = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setBatteryLevel(battery.level);
          
          const updateBattery = () => setBatteryLevel(battery.level);
          battery.addEventListener('levelchange', updateBattery);
          
          return () => {
            battery.removeEventListener('levelchange', updateBattery);
          };
        } catch (error) {
          console.warn('Battery API not available:', error);
        }
      }
    };

    initBatteryAPI();
  }, []);

  useEffect(() => {
    // Network optimization
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const updateDataSaver = () => {
        setIsDataSaverMode(connection.saveData || connection.effectiveType === '2g');
      };
      
      updateDataSaver();
      connection.addEventListener('change', updateDataSaver);
      
      return () => {
        connection.removeEventListener('change', updateDataSaver);
      };
    }
  }, []);

  useEffect(() => {
    // Apply optimizations based on battery and network
    if (batteryLevel !== null && batteryLevel < 0.2) {
      document.body.classList.add('low-battery');
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('low-battery', 'reduce-motion');
    }

    if (isDataSaverMode) {
      document.body.classList.add('data-saver-mode');
    } else {
      document.body.classList.remove('data-saver-mode');
    }
  }, [batteryLevel, isDataSaverMode]);

  useEffect(() => {
    // Optimize viewport for mobile
    if (isMobile) {
      let viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.setAttribute('name', 'viewport');
        document.head.appendChild(viewportMeta);
      }
      
      viewportMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }
  }, [isMobile]);

  // Touch gesture handlers
  const handleTouchStart = (event: React.TouchEvent) => {
    const touches = Array.from(event.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      identifier: touch.identifier,
    }));
    
    touchStartRef.current = touches;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const touchEnd = Date.now();
    const touchDuration = touchEnd - (event.timeStamp || 0);
    
    // Handle tap gestures
    if (touchDuration < 200 && touchStartRef.current.length === 1) {
      const timeSinceLastTap = touchEnd - lastTapRef.current;
      
      if (timeSinceLastTap < 300) {
        tapCountRef.current += 1;
        
        if (tapCountRef.current === 2) {
          // Double tap
          const customEvent = new CustomEvent('doubletap', {
            detail: { x: touchStartRef.current[0].x, y: touchStartRef.current[0].y }
          });
          event.currentTarget.dispatchEvent(customEvent);
          tapCountRef.current = 0;
        }
      } else {
        tapCountRef.current = 1;
        setTimeout(() => {
          if (tapCountRef.current === 1) {
            // Single tap
            const customEvent = new CustomEvent('tap', {
              detail: { x: touchStartRef.current[0].x, y: touchStartRef.current[0].y }
            });
            event.currentTarget.dispatchEvent(customEvent);
          }
          tapCountRef.current = 0;
        }, 300);
      }
      
      lastTapRef.current = touchEnd;
    }
    
    touchStartRef.current = [];
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (touchStartRef.current.length === 0) return;
    
    const currentTouches = Array.from(event.touches);
    
    if (touchStartRef.current.length === 1 && currentTouches.length === 1) {
      // Swipe gesture
      const startTouch = touchStartRef.current[0];
      const currentTouch = currentTouches[0];
      
      const deltaX = currentTouch.clientX - startTouch.x;
      const deltaY = currentTouch.clientY - startTouch.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > 50) {
        let direction: 'up' | 'down' | 'left' | 'right';
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }
        
        const customEvent = new CustomEvent('swipe', {
          detail: { direction, distance, deltaX, deltaY }
        });
        event.currentTarget.dispatchEvent(customEvent);
      }
    } else if (touchStartRef.current.length === 2 && currentTouches.length === 2) {
      // Pinch gesture
      const startDistance = Math.sqrt(
        Math.pow(touchStartRef.current[1].x - touchStartRef.current[0].x, 2) +
        Math.pow(touchStartRef.current[1].y - touchStartRef.current[0].y, 2)
      );
      
      const currentDistance = Math.sqrt(
        Math.pow(currentTouches[1].clientX - currentTouches[0].clientX, 2) +
        Math.pow(currentTouches[1].clientY - currentTouches[0].clientY, 2)
      );
      
      const scale = currentDistance / startDistance;
      const centerX = (currentTouches[0].clientX + currentTouches[1].clientX) / 2;
      const centerY = (currentTouches[0].clientY + currentTouches[1].clientY) / 2;
      
      const customEvent = new CustomEvent('pinch', {
        detail: { scale, center: { x: centerX, y: centerY } }
      });
      event.currentTarget.dispatchEvent(customEvent);
    }
  };

  // Scroll optimization
  const optimizeScrolling = (element: HTMLElement) => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Optimized scroll handling
          ticking = false;
        });
        ticking = true;
      }
    };
    
    element.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  };

  // Image optimization
  const optimizeImages = () => {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
      
      // Optimize for data saver mode
      if (isDataSaverMode && !img.dataset.optimized) {
        const src = img.src;
        if (src && !src.includes('w_auto') && !src.includes('q_auto')) {
          // Add image optimization parameters (example for Cloudinary)
          img.src = src.replace(/\.(jpg|jpeg|png|webp)/, '_w_auto,q_auto,f_auto.$1');
          img.dataset.optimized = 'true';
        }
      }
    });
  };

  useEffect(() => {
    optimizeImages();
    
    // Re-optimize when images are added
    const observer = new MutationObserver(() => {
      optimizeImages();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    return () => {
      observer.disconnect();
    };
  }, [isDataSaverMode]);

  // Accessibility announcements
  const announce = (message: string) => {
    onAnnouncement?.(message);
    
    // Create live region for screen readers
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;
    
    document.body.appendChild(liveRegion);
    
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  };

  return (
    <div
      className={`mobile-optimization-wrapper ${isMobile ? 'mobile' : 'desktop'}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        // Safe area insets for notched devices
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {children}
      
      {/* Mobile-specific styles */}
      <style jsx>{`
        .mobile-optimization-wrapper {
          min-height: 100vh;
          min-height: 100dvh; /* Dynamic viewport height */
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        
        .mobile button,
        .mobile a,
        .mobile [role="button"] {
          min-height: 44px;
          min-width: 44px;
          touch-action: manipulation;
        }
        
        .mobile input,
        .mobile textarea,
        .mobile select {
          font-size: 16px; /* Prevent zoom on iOS */
        }
        
        .reduce-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        
        .data-saver-mode img {
          filter: contrast(0.8) brightness(0.9);
        }
        
        .low-battery {
          filter: grayscale(0.2);
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        @media (max-width: 768px) {
          .mobile-optimization-wrapper {
            overflow-x: hidden;
          }
        }
      `}</style>
    </div>
  );
};