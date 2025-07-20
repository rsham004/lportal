'use client';

import React, { useState } from 'react';
import { usePWA } from './PWAProvider';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';

interface InstallPromptProps {
  className?: string;
  title?: string;
  description?: string;
  installButtonText?: string;
  showDismiss?: boolean;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  className = '',
  title = 'Install Learning Portal',
  description = 'Get the full app experience with offline access, push notifications, and faster loading.',
  installButtonText = 'Install App',
  showDismiss = true,
}) => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  // Don't show if not installable, already installed, or dismissed
  if (!isInstallable || isInstalled || !isVisible) {
    return null;
  }

  const handleInstall = async () => {
    try {
      setIsInstalling(true);
      await installApp();
    } catch (error) {
      console.error('Failed to install app:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-describedby="install-prompt-description"
      className={`
        fixed bottom-4 left-4 right-4 z-50
        bg-white border border-gray-200 shadow-lg rounded-lg
        p-4
        transition-all duration-300
        max-w-sm mx-auto sm:max-w-md
        dark:bg-gray-800 dark:border-gray-700
        ${className}
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <ArrowDownTrayIcon 
            className="h-6 w-6 text-blue-600 dark:text-blue-400" 
            aria-label="Install App"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 
            id="install-prompt-title"
            className="text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            {title}
          </h3>
          <p 
            id="install-prompt-description"
            className="text-sm text-gray-600 dark:text-gray-300 mt-1"
          >
            {description}
          </p>
          
          <div className="flex items-center space-x-2 mt-3">
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              size="sm"
              className="flex-1"
            >
              {isInstalling ? 'Installing...' : installButtonText}
            </Button>
            
            {showDismiss && (
              <Button
                onClick={handleDismiss}
                variant="outline"
                size="sm"
                className="px-2"
                aria-label="Dismiss"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};