import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t py-4 sm:py-6">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6">
        <p className="text-center text-xs sm:text-sm leading-loose text-muted-foreground sm:text-left">
          &copy; {new Date().getFullYear()} SocialApp. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs sm:text-sm text-muted-foreground hover:underline">
            Privacy
          </Link>
          <Link href="/" className="text-xs sm:text-sm text-muted-foreground hover:underline">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  )
}
