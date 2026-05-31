import { createUser, findUserByEmail, sanitizeUser, verifyPassword } from '../store/memoryStore.js';
import { signToken } from '../utils/token.js';

function issueSession(user, response) {
  const token = signToken(user);
  response.json({ token, user: sanitizeUser(user) });
}

export async function register(request, response) {
  const { name, email, password } = request.body;

  if (!name || !email || !password) {
    return response.status(400).json({ message: 'Name, email, and password are required' });
  }

  if (await findUserByEmail(email)) {
    return response.status(409).json({ message: 'A user with that email already exists' });
  }

  const user = await createUser({ name, email, password });
  return issueSession(user, response);
}

export async function login(request, response) {
  const { email, password } = request.body;

  if (!email || !password) {
    return response.status(400).json({ message: 'Email and password are required' });
  }

  const user = await findUserByEmail(email);

  if (!user || !verifyPassword(user, password)) {
    return response.status(401).json({ message: 'Invalid email or password' });
  }

  return issueSession(user, response);
}

export function me(request, response) {
  return response.json({ user: sanitizeUser(request.user) });
}
