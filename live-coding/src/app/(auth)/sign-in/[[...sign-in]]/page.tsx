import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your Learning Portal account
          </p>
        </div>
        
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
              card: 'bg-card text-card-foreground border border-border shadow-lg',
              headerTitle: 'text-foreground',
              headerSubtitle: 'text-muted-foreground',
              socialButtonsBlockButton: 'border border-border bg-background text-foreground hover:bg-accent',
              formFieldInput: 'border border-border bg-background text-foreground',
              footerActionLink: 'text-primary hover:text-primary/80',
            },
          }}
          redirectUrl="/dashboard"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  )
}