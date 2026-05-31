import { findUserById } from '../store/memoryStore.js';
import { verifyToken } from '../utils/token.js';
import { sanitizeUser } from '../store/memoryStore.js';

export async function requireAuth(request, response, next) {
  const header = request.headers.authorization || '';
  const [, token] = header.split(' ');

  if (!token) {
    return response.status(401).json({ message: 'Missing authorization token' });
  }

  try {
    const payload = verifyToken(token);
    const user = await findUserById(payload.sub);

    if (!user) {
      return response.status(401).json({ message: 'Invalid session' });
    }

    request.user = sanitizeUser(user);
    next();
  } catch (_error) {
    return response.status(401).json({ message: 'Invalid or expired token' });
  }
}
