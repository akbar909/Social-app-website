"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Pencil, Loader2 } from "lucide-react"
import type { User } from "@/types"

interface ProfileHeaderProps {
  user: User
  isCurrentUser: boolean
}

export function ProfileHeader({ user, isCurrentUser }: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false)
  const [followerCount, setFollowerCount] = useState(user.followers || 0)
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const handleFollow = async () => {
    if (!session) {
      router.push("/login")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/users/${user._id}/follow`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      setIsFollowing(data.following)
      setFollowerCount((prev) => (data.following ? prev + 1 : prev - 1))
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
          <AvatarImage src={user.image || ""} alt={user.name} />
          <AvatarFallback className="text-xl sm:text-2xl">{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">@{user.username}</p>

          {user.bio && <p className="mt-2 text-sm sm:text-base">{user.bio}</p>}
        </div>

        <div className="w-full sm:w-auto flex justify-center sm:justify-end mt-4 sm:mt-0">
          {isCurrentUser ? (
            <Link href="/profile/edit">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
          ) : (
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              onClick={handleFollow}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isFollowing ? "Unfollowing..." : "Following..."}
                </>
              ) : isFollowing ? (
                "Unfollow"
              ) : (
                "Follow"
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-6 text-center border-t border-b py-3 sm:py-4">
        <div>
          <div className="font-bold">{user.postCount || 0}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Posts</div>
        </div>
        <div>
          <div className="font-bold">{followerCount}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Followers</div>
        </div>
        <div>
          <div className="font-bold">{user.following || 0}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Following</div>
        </div>
      </div>
    </div>
  )
}
