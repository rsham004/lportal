import { Button } from '@/components/ui/button'

export default function CoursesPage() {
  const courses = [
    {
      id: 1,
      title: "Introduction to React",
      description: "Learn the fundamentals of React development",
      duration: "4 hours",
      level: "Beginner"
    },
    {
      id: 2,
      title: "Advanced TypeScript",
      description: "Master advanced TypeScript concepts and patterns",
      duration: "6 hours",
      level: "Advanced"
    },
    {
      id: 3,
      title: "Next.js Full Stack",
      description: "Build full-stack applications with Next.js",
      duration: "8 hours",
      level: "Intermediate"
    }
  ]

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground mt-2">
            Explore our comprehensive course catalog
          </p>
        </div>
        <Button>Create Course</Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {courses.map((course) => (
          <div key={course.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{course.title}</h3>
              <p className="text-sm text-muted-foreground">{course.description}</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{course.duration}</span>
                <span className="text-muted-foreground">{course.level}</span>
              </div>
            </div>
            <Button className="w-full mt-4">Enroll Now</Button>
          </div>
        ))}
      </div>
    </div>
  )
}