/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      // TEMPORARY: placeholder imagery for dev/preview only (non-production).
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  // typedRoutes moved out of `experimental` in Next 15.5.
  typedRoutes: true,
  eslint: {
    // Linting is a dedicated CI quality gate (`npm run lint`), run separately from
    // the build. Disabling the build-time pass avoids duplicate/inconsistent lint
    // runs and keeps `next build` focused on compilation + type-checking.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
