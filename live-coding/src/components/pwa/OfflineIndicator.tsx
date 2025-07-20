'use client';

import React from 'react';
import { usePWA } from './PWAProvider';
import { WifiOffIcon } from '@heroicons/react/24/outline';

interface OfflineIndicatorProps {
  className?: string;
  message?: string;
  description?: string;
  showDescription?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  message = 'You are currently offline',
  description = 'Some features may be limited. Your progress will sync when you reconnect.',
  showDescription = true,
}) => {
  const { isOffline } = usePWA();

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`
        fixed top-4 right-4 z-50
        bg-red-50 border border-red-200 text-red-800
        p-4 rounded-lg shadow-lg
        transition-all duration-300
        max-w-sm
        ${className}
      `}
    >
      <div className="flex items-start space-x-3">
        <WifiOffIcon 
          className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" 
          aria-label="Offline"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {message}
          </p>
          {showDescription && description && (
            <p className="text-sm text-red-600 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};