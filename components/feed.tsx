"use client"

import { useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"
import { Loader2 } from "lucide-react"
import { PostCard } from "@/components/post-card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { Post } from "@/types"

interface FeedProps {
  type: "latest" | "following"
}

export function Feed({ type }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const { ref, inView } = useInView()
  const { data: session } = useSession()
  const router = useRouter()

  const fetchPosts = async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/posts?page=${page}&limit=10&type=${type}`)

      if (!response.ok) {
        throw new Error("Failed to fetch posts")
      }

      const data = await response.json()

      if (data.posts.length === 0) {
        setHasMore(false)
      } else {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id))
          const newPosts = data.posts.filter((p: Post) => !existingIds.has(p._id))
          return [...prev, ...newPosts]
        })
        setPage((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setIsLoading(false)
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (inView) {
      fetchPosts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  if (initialLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (type === "following" && !session) {
    return (
      <Alert className="my-4">
        <AlertDescription>
          You need to be logged in to see posts from people you follow.
          <div className="mt-4">
            <Button onClick={() => router.push("/login")}>Login</Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (posts.length === 0 && !isLoading) {
    if (type === "following") {
      return (
        <Alert className="my-4">
          <AlertDescription>
            You're not following anyone yet or the people you follow haven't posted anything.
            <div className="mt-4">
              <Button onClick={() => router.push("/")}>Explore latest posts</Button>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <Alert className="my-4">
        <AlertDescription>
          No posts found. Be the first to create a post!
          {session && (
            <div className="mt-4">
              <Button onClick={() => router.push("/create")}>Create Post</Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}

      {hasMore && (
        <div ref={ref} className="flex justify-center py-6">
          {isLoading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        </div>
      )}
    </div>
  )
}
