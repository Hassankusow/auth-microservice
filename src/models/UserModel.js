const pool = require('../db/connection');

class UserModel {
  // Find a user by email
  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  // Find a user by ID
  async findById(id) {
    const result = await pool.query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  // Create a new user
  async create(email, passwordHash, role = 'user') {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, created_at`,
      [email, passwordHash, role]
    );
    return result.rows[0];
  }

  // Store a reset token and expiry on a user record
  async setResetToken(email, token, expiresAt) {
    const result = await pool.query(
      `UPDATE users
       SET reset_token = $1, reset_token_expires = $2
       WHERE email = $3
       RETURNING id, email`,
      [token, expiresAt, email]
    );
    return result.rows[0] || null;
  }

  // Look up a user by their reset token (only if not expired)
  async findByResetToken(token) {
    const result = await pool.query(
      `SELECT * FROM users
       WHERE reset_token = $1
         AND reset_token_expires > $2`,
      [token, Date.now()]
    );
    return result.rows[0] || null;
  }

  // Update a user's password hash
  async updatePassword(id, passwordHash) {
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, id]
    );
  }

  // Clear the reset token after it's been used
  async clearResetToken(id) {
    await pool.query(
      'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = $1',
      [id]
    );
  }

  // Get all users (admin only)
  async findAll() {
    const result = await pool.query(
      'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }
}

module.exports = new UserModel();
