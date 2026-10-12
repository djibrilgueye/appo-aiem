import { withAuth, type NextRequestWithAuth } from "next-auth/middleware"
import { NextResponse, type NextFetchEvent } from "next/server"

const protectPages = withAuth(
  function middleware() {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/",
    },
  }
)

export default function middleware(request: NextRequestWithAuth, event: NextFetchEvent) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (process.env.NODE_ENV === "development" && process.env.AIEM_REVIEW_MODE === "1") {
      const pathname = request.nextUrl.pathname
      if (!["GET", "HEAD"].includes(request.method) || (pathname.startsWith("/api/auth/") && pathname !== "/api/auth/session")) {
        return NextResponse.json({ error: "Aperçu local en lecture seule." }, { status: 405, headers: { Allow: "GET, HEAD" } })
      }
      if (pathname === "/api/ai/status") return NextResponse.json({ available: false })
    }
    return NextResponse.next()
  }
  return protectPages(request, event)
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/api/:path*"],
}
