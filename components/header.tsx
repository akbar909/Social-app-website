import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { auth } from "@/lib/auth"
import { getUserByEmail } from "@/lib/data"
import { MobileNav } from "@/components/mobile-nav"
import { PlusSquare, Home } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoutButton } from "@/components/logout-button"

export default async function Header() {
  let user = null

  try {
    const session = await auth()
    if (session?.user?.email) {
      const dbUser = await getUserByEmail(session.user.email)

      if (dbUser) {
        // Sanitize user object before passing to Client Component
        user = {
          _id: dbUser._id.toString(),
          name: dbUser.name,
          email: dbUser.email,
          image: typeof dbUser.image === "string"
            ? dbUser.image
            : dbUser.image?.toString("base64") ?? null,
        }
      }
    }
  } catch (error) {
    console.error("Error fetching user in header:", error)
  }

  return (
    <header className="sticky  top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="font-bold text-xl hidden sm:inline-block">SocialApp</span>
            <span className="font-bold text-xl sm:hidden">SA</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/" className="hidden md:block">
            <Button variant="ghost" size="icon">
              <Home className="h-5 w-5" />
              <span className="sr-only">Home</span>
            </Button>
          </Link>

          <ThemeToggle />

          {user ? (
            <>
              <Link href="/create" className="hidden md:block">
                <Button variant="ghost" size="icon">
                  <PlusSquare className="h-5 w-5" />
                  <span className="sr-only">Create Post</span>
                </Button>
              </Link>
              <Link href={`/profile/${user._id}`} className="hidden md:block">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || ""} alt={user.name} />
                    <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </Link>
              <div className="hidden md:block">
                <LogoutButton />
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden md:block">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup" className="hidden md:block">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}

          <MobileNav user={user} />
        </div>
      </div>
    </header>
  )
}
