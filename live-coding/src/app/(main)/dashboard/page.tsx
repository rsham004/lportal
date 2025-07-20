export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground mt-2">
        Welcome to your learning dashboard
      </p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-8">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-2xl font-bold">12</h3>
          <p className="text-sm text-muted-foreground">Courses Enrolled</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-2xl font-bold">8</h3>
          <p className="text-sm text-muted-foreground">Courses Completed</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-2xl font-bold">24h</h3>
          <p className="text-sm text-muted-foreground">Learning Time</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-2xl font-bold">5</h3>
          <p className="text-sm text-muted-foreground">Certificates</p>
        </div>
      </div>
    </div>
  )
}