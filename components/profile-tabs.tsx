"use client"

import { useState, useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/post-card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Post } from "@/types"

interface ProfileTabsProps {
  userId: string
}

export function ProfileTabs({ userId }: ProfileTabsProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const { ref, inView } = useInView()
  const { toast } = useToast()

  const fetchPosts = async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/users/${userId}/posts?page=${page}&limit=10`)

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
      toast({
        title: "Error",
        description: "Failed to fetch posts",
        variant: "destructive",
      })
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

  return (
    <Tabs defaultValue="posts" className="mt-8">
      <TabsList className="grid w-full grid-cols-1 mb-8">
        <TabsTrigger value="posts">Posts</TabsTrigger>
      </TabsList>
      <TabsContent value="posts">
        {initialLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <Alert>
            <AlertDescription>No posts found. This user hasn't posted anything yet.</AlertDescription>
          </Alert>
        ) : (
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
        )}
      </TabsContent>
    </Tabs>
  )
}
