import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  return (
    <div className="text-center">
      <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
        Sign in to your account
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Access your learning dashboard
      </p>
      
      <div className="mt-8 space-y-4">
        <Button className="w-full">
          Sign in with Email
        </Button>
        <Button variant="outline" className="w-full">
          Sign in with Google
        </Button>
      </div>
    </div>
  )
}