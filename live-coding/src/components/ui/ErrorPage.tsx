'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Card, CardContent } from './Card';
import { 
  HomeIcon, 
  ArrowLeftIcon, 
  ExclamationTriangleIcon,
  ServerIcon,
  LockClosedIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ErrorDetails {
  errorId?: string;
  timestamp?: string;
  path?: string;
  userAgent?: string;
  [key: string]: any;
}

interface ErrorPageProps {
  type?: '404' | '500' | '403' | '503' | 'custom';
  title?: string;
  message?: string;
  layout?: 'centered' | 'split';
  showIllustration?: boolean;
  showSupport?: boolean;
  showDetails?: boolean;
  actions?: React.ReactNode;
  onRetry?: () => void;
  retryLoading?: boolean;
  details?: ErrorDetails;
  breadcrumb?: BreadcrumbItem[];
  className?: string;
}

const ErrorPage = React.forwardRef<HTMLElement, ErrorPageProps>(
  ({
    type = '404',
    title,
    message,
    layout = 'centered',
    showIllustration = true,
    showSupport = false,
    showDetails = false,
    actions,
    onRetry,
    retryLoading = false,
    details,
    breadcrumb,
    className,
    ...props
  }, ref) => {
    const router = useRouter();

    const errorConfig = {
      '404': {
        code: '404',
        title: 'Page Not Found',
        message: 'The course or page you are looking for does not exist or has been moved.',
        icon: ExclamationTriangleIcon,
        showRetry: false,
      },
      '500': {
        code: '500',
        title: 'Internal Server Error',
        message: 'Our learning platform encountered an unexpected error. Please try again later.',
        icon: ServerIcon,
        showRetry: true,
      },
      '403': {
        code: '403',
        title: 'Access Forbidden',
        message: 'You do not have permission to access this course or resource.',
        icon: LockClosedIcon,
        showRetry: false,
      },
      '503': {
        code: '503',
        title: 'Service Unavailable',
        message: 'The learning platform is temporarily unavailable for maintenance.',
        icon: WrenchScrewdriverIcon,
        showRetry: true,
      },
      'custom': {
        code: '',
        title: 'Something went wrong',
        message: 'An unexpected error occurred.',
        icon: ExclamationTriangleIcon,
        showRetry: false,
      },
    };

    const config = errorConfig[type];
    const Icon = config.icon;
    const displayTitle = title || config.title;
    const displayMessage = message || config.message;
    const headingId = 'error-page-heading';

    const handleGoHome = () => {
      router.push('/');
    };

    const handleGoBack = () => {
      router.back();
    };

    const renderIllustration = () => (
      <div 
        data-testid="error-illustration"
        className="flex items-center justify-center w-full max-w-md mx-auto"
      >
        <div className="relative">
          <div className="w-64 h-64 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center">
            <Icon className="w-24 h-24 text-muted-foreground" />
          </div>
          {config.code && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-bold text-muted-foreground/20">
                {config.code}
              </span>
            </div>
          )}
        </div>
      </div>
    );

    const renderBreadcrumb = () => {
      if (!breadcrumb) return null;

      return (
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumb.map((item, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-muted-foreground">/</span>
                )}
                {item.href ? (
                  <Link 
                    href={item.href}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      );
    };

    const renderActions = () => {
      if (actions) {
        return <div className="flex flex-wrap gap-4 justify-center">{actions}</div>;
      }

      return (
        <div className="flex flex-wrap gap-4 justify-center">
          <Button onClick={handleGoHome} className="flex items-center space-x-2">
            <HomeIcon className="w-4 h-4" />
            <span>Go Home</span>
          </Button>
          <Button variant="outline" onClick={handleGoBack} className="flex items-center space-x-2">
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Go Back</span>
          </Button>
          {(config.showRetry || onRetry) && (
            <Button
              variant="outline"
              onClick={onRetry}
              disabled={retryLoading}
              className="flex items-center space-x-2"
            >
              {retryLoading ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowPathIcon className="w-4 h-4" />
              )}
              <span>Try Again</span>
            </Button>
          )}
        </div>
      );
    };

    const renderSupport = () => {
      if (!showSupport) return null;

      return (
        <div className="text-center text-sm text-muted-foreground">
          <p>Need help? <Link href="/support" className="text-primary hover:text-primary/80 transition-colors">Contact Support</Link></p>
        </div>
      );
    };

    const renderDetails = () => {
      if (!details || !showDetails) return null;

      return (
        <Card className="mt-8 max-w-md mx-auto">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Error Details</h3>
            <div className="space-y-2 text-xs">
              {details.errorId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Error ID:</span>
                  <span className="font-mono">{details.errorId}</span>
                </div>
              )}
              {details.timestamp && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-mono">{new Date(details.timestamp).toLocaleString()}</span>
                </div>
              )}
              {details.path && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Path:</span>
                  <span className="font-mono break-all">{details.path}</span>
                </div>
              )}
              {Object.entries(details).map(([key, value]) => {
                if (['errorId', 'timestamp', 'path'].includes(key)) return null;
                return (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">{key}:</span>
                    <span className="font-mono text-right break-all">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      );
    };

    const contentClasses = cn(
      'flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto px-4',
      layout === 'split' && 'lg:text-left lg:items-start'
    );

    return (
      <main
        ref={ref}
        role="main"
        aria-labelledby={headingId}
        className={cn(
          'min-h-screen flex flex-col',
          layout === 'centered' && 'items-center justify-center py-12',
          layout === 'split' && 'lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center py-12',
          className
        )}
        {...props}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderBreadcrumb()}
          
          <div className={cn(
            layout === 'split' && 'lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center'
          )}>
            {/* Illustration */}
            {showIllustration && layout === 'split' && (
              <div className="hidden lg:block">
                {renderIllustration()}
              </div>
            )}

            {/* Content */}
            <div className={contentClasses}>
              {/* Mobile illustration for split layout */}
              {showIllustration && layout === 'split' && (
                <div className="lg:hidden mb-8">
                  {renderIllustration()}
                </div>
              )}

              {/* Centered illustration */}
              {showIllustration && layout === 'centered' && (
                <div className="mb-8">
                  {renderIllustration()}
                </div>
              )}

              {/* Error code */}
              {config.code && (
                <div className="text-8xl font-bold text-primary">
                  {config.code}
                </div>
              )}

              {/* Title and message */}
              <div className="space-y-4">
                <h1 id={headingId} className="text-3xl font-bold text-foreground">
                  {displayTitle}
                </h1>
                <p className="text-lg text-muted-foreground max-w-md">
                  {displayMessage}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-4">
                {renderActions()}
              </div>

              {/* Support */}
              <div className="pt-4">
                {renderSupport()}
              </div>
            </div>
          </div>

          {/* Error details */}
          {renderDetails()}
        </div>
      </main>
    );
  }
);

ErrorPage.displayName = 'ErrorPage';

export { ErrorPage };
export type { ErrorPageProps, ErrorDetails, BreadcrumbItem };