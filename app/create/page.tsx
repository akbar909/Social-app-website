import { CreatePostForm } from "@/components/create-post-form"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function CreatePostPage() {
  let session = null
  try {
    session = await auth()
  } catch (error) {
    console.error("Error fetching session:", error)
  }

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Link href="/" className="flex items-center text-sm mb-6 hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to home
      </Link>

      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Create Post</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Share your thoughts, images, or videos</p>
        </div>
        <CreatePostForm />
      </div>
    </div>
  )
}
