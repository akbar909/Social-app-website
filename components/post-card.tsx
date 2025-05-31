"use client"

import { AspectRatio } from "@/components/ui/aspect-ratio"
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
    <Card className="overflow-hidden w-full max-w-2xl mx-auto mb-6 rounded-2xl shadow-md border border-muted bg-background">
      <CardHeader className="flex flex-row items-center gap-4 p-4 bg-muted/40">
        <Link href={`/profile/${post.author._id}`} className="shrink-0">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={post.author.image || ""} alt={post.author.name} />
            <AvatarFallback>{post.author.name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex flex-col flex-1 min-w-0">
          <Link
            href={`/profile/${post.author._id}`}
            className="font-semibold text-base truncate hover:underline"
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

      <Link href={`/post/${post._id}`} className="block group focus:outline-none">
        <CardContent className="p-0">
          {post.content && (
            <div className="px-4 pt-4 pb-3 text-base leading-relaxed text-foreground">
              {post.content}
            </div>
          )}

          {/* Single Media */}
          {post.mediaUrls && post.mediaUrls.length === 1 && (
            <div className="w-full flex justify-center items-center px-0 py-0">
              <AspectRatio ratio={16 / 9} className="w-full">
                {post.mediaUrls[0].match(/\.(mp4|webm|ogg)$/i) ? (
                  <video
                    src={post.mediaUrls[0]}
                    controls
                    className="w-full h-full object-cover rounded-xl bg-black group-hover:scale-[1.01] transition-transform duration-200"
                    style={{ maxHeight: 420 }}
                  />
                ) : (
                  <Image
                    src={post.mediaUrls[0] || "/placeholder.svg?height=400&width=600"}
                    alt="Post media"
                    fill
                    className="object-cover rounded-xl group-hover:scale-[1.01] transition-transform duration-200"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                )}
              </AspectRatio>
            </div>
          )}

          {/* Multiple Media */}
          {post.mediaUrls && post.mediaUrls.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3 px-4 py-2">
              {post.mediaUrls.map((url, idx) => (
                <AspectRatio ratio={16 / 10} key={idx} className="w-full">
                  {url.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video
                      src={url}
                      controls
                      className="w-full h-full object-cover rounded-xl bg-black group-hover:scale-[1.01] transition-transform duration-200"
                      style={{ maxHeight: 340 }}
                    />
                  ) : (
                    <Image
                      src={url || "/placeholder.svg?height=400&width=600"}
                      alt={`Post media ${idx + 1}`}
                      fill
                      className="object-cover rounded-xl group-hover:scale-[1.01] transition-transform duration-200"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}
                </AspectRatio>
              ))}
            </div>
          )}
        </CardContent>
      </Link>

      <CardFooter className="flex items-center p-3 sm:p-4 gap-4 border-t bg-muted/40">
        <Button variant="ghost" size="sm" className="gap-1 h-8" onClick={handleLike} aria-label="Like post">
          <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          <span className="font-medium text-sm">{likeCount}</span>
        </Button>

        <Link href={`/post/${post._id}`} className="focus:outline-none">
          <Button variant="ghost" size="sm" className="gap-1 h-8" aria-label="View comments">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-sm">{post.commentCount || 0}</span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}