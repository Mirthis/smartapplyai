import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/new",
    "/privacy",
    "/terms",
    "/sign-in",
    "/sign-up",
    "/about",
    "/contact",
    "/testStreaming",
    "/beta",
    "/api/(.*)",
  ],
  // debug: true
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
