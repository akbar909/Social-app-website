"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import type { Post } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, MoreHorizontal, Trash } from "lucide-react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface PostCardProps {
  post: Post
  onDelete: (id: string) => void
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likeCount, setLikeCount] = useState(post.likeCount || 0)
  const [isDeleting, setIsDeleting] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const handleLike = async () => {
    if (!session) {
      router.push("/login")
      return
    }

    try {
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      setIsLiked(data.liked)
      setLikeCount(data.likeCount)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!session) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      toast({
        title: "Success",
        description: "Post deleted successfully",
      })

      onDelete(post._id)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const isAuthor = session?.user?.email === post.author.email

  return (
    <Card className="overflow-hidden w-full max-w-2xl mx-auto mb-4 rounded-xl">
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Link href={`/profile/${post.author._id}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.image || ""} alt={post.author.name} />
            <AvatarFallback>{post.author.name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex flex-col">
          <Link
            href={`/profile/${post.author._id}`}
            className="font-medium text-sm sm:text-base hover:underline"
          >
            {post.author.name}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </span>
        </div>

        {isAuthor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <Link href={`/post/${post._id}`}>
        <CardContent className="p-0">
          {post.content && (
            <div className="px-4 pb-3 text-sm sm:text-base leading-relaxed">
              {post.content}
            </div>
          )}

          {post.mediaUrls && post.mediaUrls.length === 1 && (
            <div className="w-full flex justify-center items-center bg-black/5 px-4 py-2">
              <Image
                src={post.mediaUrls[0] || "/placeholder.svg?height=400&width=600"}
                alt="Post image"
                width={800}
                height={600}
                className="max-w-full h-auto rounded-md"
              />
            </div>
          )}

          {post.mediaUrls && post.mediaUrls.length > 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-4 py-2">
              {post.mediaUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="w-full flex justify-center items-center bg-black/5 rounded-md overflow-hidden"
                >
                  <Image
                    src={url || "/placeholder.svg?height=400&width=600"}
                    alt={`Post image ${idx + 1}`}
                    width={400}
                    height={300}
                    className="w-full h-auto object-contain"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Link>

      <CardFooter className="flex items-center p-3 sm:p-4 gap-4">
        <Button variant="ghost" size="sm" className="gap-1 h-8" onClick={handleLike}>
          <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
          <span>{likeCount}</span>
        </Button>

        <Link href={`/post/${post._id}`}>
          <Button variant="ghost" size="sm" className="gap-1 h-8">
            <MessageCircle className="h-4 w-4" />
            <span>{post.commentCount || 0}</span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
