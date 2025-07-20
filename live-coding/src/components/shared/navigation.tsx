import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Navigation() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold">
              Learning Portal
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
                Dashboard
              </Link>
              <Link href="/courses" className="text-sm font-medium hover:text-primary">
                Courses
              </Link>
              <Link href="/progress" className="text-sm font-medium hover:text-primary">
                Progress
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              Profile
            </Button>
            <Button size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}