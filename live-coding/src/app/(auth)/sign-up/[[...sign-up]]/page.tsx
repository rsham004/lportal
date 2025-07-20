import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground mt-2">
            Join Learning Portal and start your learning journey
          </p>
        </div>
        
        <SignUp
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
          signInUrl="/sign-in"
        />
      </div>
    </div>
  )
}