import jwt from 'jsonwebtoken';

  export function authRequired(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: payload.sub, role: payload.role };
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  export function adminRequired(req, res, next) {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  }
