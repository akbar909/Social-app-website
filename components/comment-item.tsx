"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { MoreHorizontal, Trash, Loader2 } from "lucide-react"
import type { Comment } from "@/types"

interface CommentItemProps {
  comment: Comment
  onDelete: (commentId: string) => void
}

export function CommentItem({ comment, onDelete }: CommentItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { data: session } = useSession()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!session) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/posts/${comment.postId}/comments/${comment._id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      toast({
        title: "Success",
        description: "Comment deleted successfully",
      })

      onDelete(comment._id)
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

  const isAuthor = session?.user?.email === comment.author.email

  return (
    <div className="flex gap-4">
      <Link href={`/profile/${comment.author._id}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.image || ""} alt={comment.author.name} />
          <AvatarFallback>{comment.author.name?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${comment.author._id}`} className="font-semibold text-sm hover:underline">
              {comment.author.name}
            </Link>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>

          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
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
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="text-sm">{comment.content}</div>
      </div>
    </div>
  )
}
