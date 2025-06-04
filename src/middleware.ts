import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';

export default withMiddlewareAuthRequired();

export const config = {
  matcher: [
    '/profile/:path*',
    '/profile-completion/:path*',
    '/role-selection/:path*',
    '/shifts/:path*',
    '/availability/:path*',
    '/documents/:path*',
    '/analytics/:path*',
    '/settings/:path*'
  ]
}; 