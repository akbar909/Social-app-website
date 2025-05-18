import { auth } from "@/lib/auth"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function LandingPage() {
  const session = await auth()

  if (session) {
    redirect("/feed")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-extrabold mb-4">Welcome to SocialApp</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Connect, share, and explore the latest updates from your friends and
          community. Join us today and be part of the conversation.
        </p>
      </header>

      <div className="flex gap-6">
        <Link href="/login">
          <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-all">
            Login
          </button>
        </Link>
        <Link href="/signup">
          <button className="px-8 py-3 bg-secondary text-secondary-foreground rounded-lg shadow-lg hover:bg-secondary/90 transition-all">
            Get Started
          </button>
        </Link>
      </div>

      <div className="mt-12 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary border-2 border-background flex items-center justify-center text-primary-foreground text-sm font-bold"
              >
                {i}
              </div>
            ))}
            <div className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-muted-foreground text-sm font-bold">
              +
            </div>
          </div>
        </div>
        <p className="text-muted-foreground">
          Join millions of people already connecting on SocialApp
        </p>
      </div>
    </div>
  )
}
