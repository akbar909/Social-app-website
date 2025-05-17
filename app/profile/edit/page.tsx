import { EditProfileForm } from "@/components/edit-profile-form"
import { auth } from "@/lib/auth"
import { getUserByEmail } from "@/lib/data"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function EditProfilePage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const userDoc = await getUserByEmail(session.user?.email as string)

  if (!userDoc) {
    redirect("/")
  }

  // Convert to plain object for Client Component
  const user = {
    ...userDoc,
    _id: userDoc._id.toString(),
    createdAt: userDoc.createdAt?.toISOString?.(),
    updatedAt: userDoc.updatedAt?.toISOString?.(),
  }

  return (
    <div className="container max-w-md py-8">
      <Link
        href={`/profile/${user._id}`}
        className="flex items-center text-sm mb-6 hover:underline"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to profile
      </Link>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground">Update your profile information</p>
        </div>
        <EditProfileForm user={user} />
      </div>
    </div>
  )
}
