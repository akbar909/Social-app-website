import { SignupForm } from "@/components/signup-form"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function SignupPage() {
  const session = await auth()

  if (session) {
    redirect("/")
  }

  return (
    <div className="container mx-auto max-w-md py-8">
      <Link href="/" className="flex items-center text-sm mb-6 hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to home
      </Link>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-muted-foreground">Enter your information to create an account</p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
