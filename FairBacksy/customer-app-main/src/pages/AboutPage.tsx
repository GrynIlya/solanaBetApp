import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">About</h1>
          <p className="text-xl text-muted-foreground">Learn more about our technology stack</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Technology Stack</CardTitle>
            <CardDescription>Built with modern tools and best practices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <h3 className="font-semibold mb-2">Frontend</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>React 19 - UI Library</li>
                  <li>TypeScript - Type Safety</li>
                  <li>Vite - Build Tool</li>
                  <li>TailwindCSS - Styling</li>
                  <li>shadcn/ui - Component Library</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">State Management</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Zustand - Global State</li>
                  <li>React Query - Server State</li>
                  <li>React Hook Form - Form State</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Testing</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Vitest - Test Runner</li>
                  <li>React Testing Library - Component Testing</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">DevOps</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Docker - Containerization</li>
                  <li>GitHub Actions - CI/CD</li>
                  <li>Vercel/AWS Amplify - Deployment</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
