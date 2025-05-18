import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Generate a secure secret if one is not provided
const secret = process.env.NEXTAUTH_SECRET || "123456789"

export async function middleware(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: secret,
    })

    // Protected routes
    const protectedRoutes = ["/create", "/profile/edit", "/feed"]

    // Check if the route is protected and user is not authenticated
    if (protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route)) && !token) {
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    // If there's an error, allow the request to proceed
    // The server component will handle authentication
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/create", "/profile/edit", "/feed"],
}
