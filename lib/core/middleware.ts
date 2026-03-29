import { NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from './auth';

export type AuthenticatedRequest = Request & {
  user?: TokenPayload;
};

type RouteHandler = (req: AuthenticatedRequest, ...args: unknown[]) => Promise<Response> | Response;

export function withAuth(handler: RouteHandler, allowedRoles?: string[]) {
  return async (req: Request, ...args: unknown[]) => {
    try {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
      }

      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);

      // RBAC Check
      if (allowedRoles && !allowedRoles.includes(decoded.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
      }

      // Inject user context into request
      const authReq = req as AuthenticatedRequest;
      authReq.user = decoded;

      return await handler(authReq, ...args);
    } catch {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
  };
}
