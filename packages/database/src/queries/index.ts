export const userQueries = {
  findById: (id: string) => `SELECT * FROM users WHERE id = $1`,
  findByEmail: (email: string) => `SELECT * FROM users WHERE email = $1`,
  create: () => `INSERT INTO users (name, email, created_at) VALUES ($1, $2, NOW()) RETURNING *`,
  update: (id: string) => `UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
  delete: (id: string) => `DELETE FROM users WHERE id = $1`
};

export const taskQueries = {
  findByStatus: (status: string) => `SELECT * FROM tasks WHERE status = $1`,
  findByAgent: (agentId: string) => `SELECT * FROM tasks WHERE agent_id = $1`,
  create: () => `INSERT INTO tasks (title, description, status, agent_id, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
  updateStatus: (id: string) => `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`
};