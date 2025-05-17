"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import type { User as UserType } from "@/types"
import { Home, Loader2, LogOut, Menu, Moon, PlusSquare, Sun, User } from "lucide-react"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
interface MobileNavProps {
  user: UserType | null
}

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut({ redirect: false })
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      })
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Error",
        description: "There was a problem logging out",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85%] sm:w-[350px] pt-10">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl">SocialApp</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-base" onClick={() => setOpen(false)}>
            <Home className="h-5 w-5" />
            Home
          </Link>

          <button className="flex items-center gap-2 text-base text-left" onClick={toggleTheme}>
            {theme === "dark" ? (
              <>
                <Sun className="h-5 w-5" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="h-5 w-5" />
                Dark Mode
              </>
            )}
          </button>

          {user ? (
            <>
              <Link href="/create" className="flex items-center gap-2 text-base" onClick={() => setOpen(false)}>
                <PlusSquare className="h-5 w-5" />
                Create Post
              </Link>
              <Link
                href={`/profile/${user._id}`}
                className="flex items-center gap-2 text-base"
                onClick={() => setOpen(false)}
              >
                <User className="h-5 w-5" />
                Profile
              </Link>
              <Button
                className="flex items-center gap-2 text-base text-left w-full"
                onClick={async () => {
                  await handleSignOut()
                  setOpen(false)
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
                Logout
              </Button>
              {/* <Link
                href={`/profile/${user._id}`}
                className="flex items-center gap-3 cursor-pointer p-2   border-t hover:bg-accent/40 rounded-md transition-colors"
                onClick={() => setOpen(false)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.image || ""} alt={user.name} />
                  <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="grid gap-0.5">
                  <p className="text-base font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </Link> */}
            </>
          ) : (
            <>
              <Link href="/login" className="flex items-center gap-2 text-base" onClick={() => setOpen(false)}>
                <User className="h-5 w-5" />
                Login
              </Link>
              <Link href="/signup" className="flex items-center gap-2 text-base" onClick={() => setOpen(false)}>
                <User className="h-5 w-5" />
                Sign Up
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
