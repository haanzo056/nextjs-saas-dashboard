import { withAuth } from 'next-auth/middleware';

// Must match authOptions.pages.signIn. Without it withAuth sends users to the default
// /api/auth/signin, which bounces to /sign-in, which the matcher protected again.
export default withAuth({ pages: { signIn: '/sign-in' } });

export const config = {
  matcher: ['/', '/w/:path*', '/onboarding', '/invite/:path*'],
};
