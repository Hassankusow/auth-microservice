/**
 * Tests for the Auth Microservice.
 * Run with: npm test
 *
 * All database calls are mocked — no PostgreSQL instance required.
 */

process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

const request = require('supertest');
const jwt = require('jsonwebtoken');

// ─── Mock UserModel before app is loaded ──────────────────────────────────────
jest.mock('../src/models/UserModel', () => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  setResetToken: jest.fn(),
  findByResetToken: jest.fn(),
  updatePassword: jest.fn(),
  clearResetToken: jest.fn(),
  findAll: jest.fn(),
}));

const UserModel = require('../src/models/UserModel');
const app = require('../src/app');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeToken(payload = {}) {
  return jwt.sign(
    { id: 1, email: 'user@test.com', role: 'user', ...payload },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});


// ─── Health Check ─────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns 200 and status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});


// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe('POST /api/auth/register', () => {

  it('creates a user and returns 201 with token', async () => {
    UserModel.findByEmail.mockResolvedValue(null);
    UserModel.create.mockResolvedValue({ id: 1, email: 'a@test.com', role: 'user' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('a@test.com');
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@test.com' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@test.com', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/6 characters/i);
  });

  it('returns 409 when email already exists', async () => {
    UserModel.findByEmail.mockResolvedValue({ id: 1, email: 'a@test.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@test.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('assigns default role of user when role is omitted', async () => {
    UserModel.findByEmail.mockResolvedValue(null);
    UserModel.create.mockResolvedValue({ id: 2, email: 'b@test.com', role: 'user' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'b@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(UserModel.create).toHaveBeenCalledWith(
      'b@test.com', expect.any(String), 'user'
    );
  });

  it('allows creating an admin user when role is specified', async () => {
    UserModel.findByEmail.mockResolvedValue(null);
    UserModel.create.mockResolvedValue({ id: 3, email: 'admin@test.com', role: 'admin' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'admin@test.com', password: 'adminpass', role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('admin');
  });

  it('JWT payload contains id, email, and role', async () => {
    UserModel.findByEmail.mockResolvedValue(null);
    UserModel.create.mockResolvedValue({ id: 7, email: 'c@test.com', role: 'user' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'c@test.com', password: 'password123' });

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded).toMatchObject({ id: 7, email: 'c@test.com', role: 'user' });
  });
});


// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {

  it('returns 200 and token for valid credentials', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('correctpass', 10);
    UserModel.findByEmail.mockResolvedValue({
      id: 1, email: 'u@test.com', role: 'user', password_hash: hash,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'u@test.com', password: 'correctpass' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('u@test.com');
  });

  it('returns 401 for wrong password', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('correctpass', 10);
    UserModel.findByEmail.mockResolvedValue({
      id: 1, email: 'u@test.com', role: 'user', password_hash: hash,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'u@test.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('returns 401 for unknown email', async () => {
    UserModel.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'anything' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'u@test.com' });

    expect(res.status).toBe(400);
  });
});


// ─── POST /api/auth/forgot-password ──────────────────────────────────────────

describe('POST /api/auth/forgot-password', () => {

  it('returns 200 with reset token for known email', async () => {
    UserModel.findByEmail.mockResolvedValue({ id: 1, email: 'u@test.com' });
    UserModel.setResetToken.mockResolvedValue({ id: 1, email: 'u@test.com' });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'u@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.reset_token).toBeDefined();
    expect(res.body.reset_token).toHaveLength(64); // 32 bytes hex
  });

  it('returns 200 (no leak) for unknown email', async () => {
    UserModel.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.reset_token).toBeUndefined();
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({});

    expect(res.status).toBe(400);
  });

  it('calls setResetToken with correct email', async () => {
    UserModel.findByEmail.mockResolvedValue({ id: 5, email: 'x@test.com' });
    UserModel.setResetToken.mockResolvedValue({ id: 5 });

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'x@test.com' });

    expect(UserModel.setResetToken).toHaveBeenCalledWith(
      'x@test.com', expect.any(String), expect.any(Number)
    );
  });
});


// ─── POST /api/auth/reset-password ───────────────────────────────────────────

describe('POST /api/auth/reset-password', () => {

  it('resets password successfully', async () => {
    UserModel.findByResetToken.mockResolvedValue({ id: 1 });
    UserModel.updatePassword.mockResolvedValue();
    UserModel.clearResetToken.mockResolvedValue();

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'validtoken', newPassword: 'newpass123' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset successfully/i);
  });

  it('returns 400 for invalid/expired token', async () => {
    UserModel.findByResetToken.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'badtoken', newPassword: 'newpass123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it('returns 400 when new password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'tok', newPassword: '123' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'tok' });

    expect(res.status).toBe(400);
  });

  it('clears the reset token after successful reset', async () => {
    UserModel.findByResetToken.mockResolvedValue({ id: 9 });
    UserModel.updatePassword.mockResolvedValue();
    UserModel.clearResetToken.mockResolvedValue();

    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'validtoken', newPassword: 'newpass123' });

    expect(UserModel.clearResetToken).toHaveBeenCalledWith(9);
  });
});


// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {

  it('returns 200 and user profile for valid token', async () => {
    UserModel.findById.mockResolvedValue({ id: 1, email: 'u@test.com', role: 'user' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('u@test.com');
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer notavalidtoken');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it('returns 401 when authorization header has wrong prefix', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Token ${makeToken()}`);

    expect(res.status).toBe(401);
  });

  it('returns 404 when user no longer exists in DB', async () => {
    UserModel.findById.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });
});


// ─── GET /api/auth/admin/users ────────────────────────────────────────────────

describe('GET /api/auth/admin/users', () => {

  it('returns 200 and user list for admin token', async () => {
    UserModel.findAll.mockResolvedValue([
      { id: 1, email: 'a@test.com', role: 'admin' },
      { id: 2, email: 'b@test.com', role: 'user' },
    ]);

    const adminToken = makeToken({ role: 'admin' });

    const res = await request(app)
      .get('/api/auth/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users).toHaveLength(2);
  });

  it('returns 403 for a user with role user', async () => {
    const userToken = makeToken({ role: 'user' });

    const res = await request(app)
      .get('/api/auth/admin/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/insufficient permissions/i);
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/admin/users');
    expect(res.status).toBe(401);
  });
});


// ─── verifyToken middleware (unit tests) ─────────────────────────────────────

describe('verifyToken middleware', () => {
  const verifyToken = require('../src/middleware/verifyToken');

  function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  }

  it('calls next() for a valid token', () => {
    const token = makeToken();
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({ email: 'user@test.com' });
  });

  it('rejects when no authorization header is present', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an expired token', () => {
    const expiredToken = jwt.sign(
      { id: 1, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = mockRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});


// ─── checkRole middleware (unit tests) ────────────────────────────────────────

describe('checkRole middleware', () => {
  const checkRole = require('../src/middleware/checkRole');

  function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  }

  it('calls next() when role matches', () => {
    const req = { user: { id: 1, role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();

    checkRole('admin')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when role does not match', () => {
    const req = { user: { id: 1, role: 'user' } };
    const res = mockRes();
    const next = jest.fn();

    checkRole('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when req.user is not set', () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    checkRole('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
