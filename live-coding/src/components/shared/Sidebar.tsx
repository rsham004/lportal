'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  HomeIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlayIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  className?: string;
  variant?: 'main' | 'course';
  courseData?: CourseData;
}

interface SidebarItemProps {
  icon?: React.ReactNode;
  label: string;
  href?: string;
  active?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  badge?: string | number;
  disabled?: boolean;
}

interface SidebarGroupProps {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

interface CourseData {
  id: string;
  title: string;
  modules: CourseModule[];
}

interface CourseModule {
  id: string;
  title: string;
  completed: boolean;
  lessons: CourseLesson[];
}

interface CourseLesson {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'quiz' | 'assignment';
  duration?: string;
  completed: boolean;
}

const mainNavigationItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <HomeIcon className="h-5 w-5" />,
  },
  {
    label: 'My Courses',
    href: '/courses',
    icon: <AcademicCapIcon className="h-5 w-5" />,
    badge: '3',
  },
  {
    label: 'Browse Catalog',
    href: '/catalog',
    icon: <BookOpenIcon className="h-5 w-5" />,
  },
  {
    label: 'Community',
    href: '/community',
    icon: <UserGroupIcon className="h-5 w-5" />,
  },
  {
    label: 'Progress',
    href: '/progress',
    icon: <ChartBarIcon className="h-5 w-5" />,
  },
];

const secondaryNavigationItems = [
  {
    label: 'Settings',
    href: '/settings',
    icon: <Cog6ToothIcon className="h-5 w-5" />,
  },
  {
    label: 'Help & Support',
    href: '/help',
    icon: <QuestionMarkCircleIcon className="h-5 w-5" />,
  },
];

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  href,
  active,
  children,
  onClick,
  badge,
  disabled
}) => {
  const content = (
    <div
      className={cn(
        'flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer'
      )}
      onClick={!disabled ? onClick : undefined}
    >
      <div className="flex items-center space-x-3">
        {icon}
        <span>{label}</span>
      </div>
      {badge && (
        <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );

  if (href && !disabled) {
    return (
      <Link href={href}>
        {content}
      </Link>
    );
  }

  return (
    <div>
      {content}
      {children}
    </div>
  );
};

const SidebarGroup: React.FC<SidebarGroupProps> = ({
  title,
  children,
  collapsible = false,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider',
          collapsible && 'cursor-pointer hover:text-foreground'
        )}
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <span>{title}</span>
        {collapsible && (
          <ChevronDownIcon
            className={cn(
              'h-4 w-4 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        )}
      </div>
      {isExpanded && (
        <div className="space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

const CourseModuleItem: React.FC<{
  module: CourseModule;
  courseId: string;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ module, courseId, isExpanded, onToggle }) => {
  const completedLessons = module.lessons.filter(lesson => lesson.completed).length;
  const totalLessons = module.lessons.length;
  const progress = Math.round((completedLessons / totalLessons) * 100);

  const getLessonIcon = (lesson: CourseLesson) => {
    if (lesson.completed) {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    }
    
    switch (lesson.type) {
      case 'video':
        return <PlayIcon className="h-4 w-4" />;
      case 'reading':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'quiz':
        return <QuestionMarkCircleIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-1">
      <div
        className="flex items-center justify-between px-3 py-2 text-sm font-medium cursor-pointer hover:bg-accent rounded-md transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-2">
          <ChevronRightIcon
            className={cn(
              'h-4 w-4 transition-transform',
              isExpanded && 'rotate-90'
            )}
          />
          <span className={module.completed ? 'text-green-600' : 'text-foreground'}>
            {module.title}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">
            {completedLessons}/{totalLessons}
          </span>
          {module.completed && (
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="ml-6 space-y-1">
          {module.lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/courses/${courseId}/lessons/${lesson.id}`}
              className="flex items-center space-x-3 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
            >
              {getLessonIcon(lesson)}
              <span className={lesson.completed ? 'line-through' : ''}>
                {lesson.title}
              </span>
              {lesson.duration && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {lesson.duration}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, variant = 'main', courseData, ...props }, ref) => {
    const pathname = usePathname();
    const [expandedModules, setExpandedModules] = React.useState<Set<string>>(new Set());

    const toggleModule = (moduleId: string) => {
      const newExpanded = new Set(expandedModules);
      if (newExpanded.has(moduleId)) {
        newExpanded.delete(moduleId);
      } else {
        newExpanded.add(moduleId);
      }
      setExpandedModules(newExpanded);
    };

    if (variant === 'course' && courseData) {
      return (
        <aside
          ref={ref}
          className={cn(
            'w-64 bg-background border-r h-full overflow-y-auto',
            className
          )}
          {...props}
        >
          <div className="p-4">
            <div className="mb-6">
              <Link
                href="/courses"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Courses
              </Link>
              <h2 className="text-lg font-semibold text-foreground mt-2">
                {courseData.title}
              </h2>
            </div>

            <div className="space-y-2">
              {courseData.modules.map((module) => (
                <CourseModuleItem
                  key={module.id}
                  module={module}
                  courseId={courseData.id}
                  isExpanded={expandedModules.has(module.id)}
                  onToggle={() => toggleModule(module.id)}
                />
              ))}
            </div>
          </div>
        </aside>
      );
    }

    return (
      <aside
        ref={ref}
        className={cn(
          'w-64 bg-background border-r h-full overflow-y-auto',
          className
        )}
        {...props}
      >
        <div className="p-4 space-y-6">
          {/* Main Navigation */}
          <SidebarGroup title="Main">
            {mainNavigationItems.map((item) => (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={pathname === item.href}
                badge={item.badge}
              />
            ))}
          </SidebarGroup>

          {/* Secondary Navigation */}
          <SidebarGroup title="Account">
            {secondaryNavigationItems.map((item) => (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={pathname === item.href}
              />
            ))}
          </SidebarGroup>
        </div>
      </aside>
    );
  }
);
Sidebar.displayName = 'Sidebar';

export { Sidebar };