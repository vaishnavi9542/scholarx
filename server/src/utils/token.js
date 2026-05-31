import jwt from 'jsonwebtoken';

export function signToken(user) {
  const secret = process.env.JWT_SECRET || 'scholarx-development-secret';

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name
    },
    secret,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'scholarx-development-secret';
  return jwt.verify(token, secret);
}
