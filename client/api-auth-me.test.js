import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import handler from '../api/auth/me.js';

process.env.JWT_SECRET = 'testsecret';

function createRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    end() {
      this.ended = true;
    }
  };
}

describe('GET /api/auth/me', () => {
  it('returns decoded user for valid token', async () => {
    const payload = { userId: 1, email: 'test@example.com', username: 'test' };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    const req = { method: 'GET', headers: { cookie: `token=${token}`, origin: 'http://localhost' } };
    const res = createRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ user: payload });
  });

  it('returns 401 for invalid token', async () => {
    const req = { method: 'GET', headers: { cookie: 'token=invalid', origin: 'http://localhost' } };
    const res = createRes();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });
});
