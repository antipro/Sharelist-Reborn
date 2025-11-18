const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, set this to your client URL
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Database Connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'sharelist'
};

let pool;
try {
  pool = mysql.createPool(dbConfig);
  console.log('Database pool created');
} catch (err) {
  console.error('Failed to create database pool', err);
}

// --- HTTP ENDPOINTS (Auth) ---

// 1. Send Verification Code
app.post('/api/auth/code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

  try {
    // In a real app, you would send this via email (SMTP/SendGrid)
    console.log(`[AUTH] Code for ${email}: ${code}`);
    
    await pool.execute(
      `INSERT INTO verify_codes (email, code, expires_at) VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE code = ?, expires_at = ?`,
      [email, code, expiresAt, code, expiresAt]
    );
    
    res.json({ message: 'Code sent', code }); // Returning code for demo purposes
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 2. Register
app.post('/api/auth/register', async (req, res) => {
  const { email, code, username, password } = req.body;
  
  try {
    // Verify Code
    const [codes] = await pool.execute(
      'SELECT * FROM verify_codes WHERE email = ? AND code = ? AND expires_at > NOW()',
      [email, code]
    );
    
    if (codes.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    // Check existing user
    const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create User
    await pool.execute(
      'INSERT INTO users (id, email, username, password_hash, timezone, language, theme) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, email, username, hashedPassword, 'UTC', 'en', 'dark']
    );

    // Create Default Project
    const projectId = uuidv4();
    await pool.execute(
      'INSERT INTO projects (id, user_id, name, created_at) VALUES (?, ?, ?, ?)',
      [projectId, userId, 'Inbox', Date.now()]
    );

    // Cleanup code
    await pool.execute('DELETE FROM verify_codes WHERE email = ?', [email]);

    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    
    res.json({
      token,
      user: { id: userId, email, username, timezone: 'UTC', language: 'en', theme: 'dark' }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        timezone: user.timezone,
        language: user.language,
        theme: user.theme
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 4. Update User Settings
app.put('/api/users/:id', async (req, res) => {
  const { timezone, language, theme } = req.body;
  const { id } = req.params;

  // In production, verify JWT token here from headers
  
  try {
    await pool.execute(
      'UPDATE users SET timezone = ?, language = ?, theme = ? WHERE id = ?',
      [timezone, language, theme, id]
    );
    
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    const user = users[0];
    
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      timezone: user.timezone,
      language: user.language,
      theme: user.theme
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// --- SOCKET.IO EVENTS (Projects & Items) ---

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  let currentUserId = null;

  // Join user-specific room for updates
  socket.on('join:user', (userId) => {
    currentUserId = userId;
    socket.join(`user:${userId}`);
    loadInitialData(userId);
  });

  // Initial Data Load
  const loadInitialData = async (userId) => {
    try {
      const [projects] = await pool.execute(
        'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at ASC', 
        [userId]
      );
      
      // Get items for all user projects
      // Simplification: Fetch all items belonging to user's projects
      const [items] = await pool.execute(
        `SELECT i.* FROM items i 
         JOIN projects p ON i.project_id = p.id 
         WHERE p.user_id = ?`,
        [userId]
      );

      socket.emit('initial-data', { projects, items });
    } catch (err) {
      console.error('Error loading initial data', err);
    }
  };

  // Project Events
  socket.on('create:project', async (data) => {
    if (!currentUserId) return;
    const newProject = {
      id: uuidv4(),
      user_id: currentUserId,
      name: data.name,
      created_at: Date.now()
    };
    
    try {
      await pool.execute(
        'INSERT INTO projects (id, user_id, name, created_at) VALUES (?, ?, ?, ?)',
        [newProject.id, newProject.user_id, newProject.name, newProject.created_at]
      );
      
      // Normalize for client (remove snake_case if needed, or handle in client)
      const clientProject = {
        id: newProject.id,
        name: newProject.name,
        createdAt: newProject.created_at
      };
      
      io.to(`user:${currentUserId}`).emit('project:created', clientProject);
    } catch (err) {
      console.error('Create project failed', err);
    }
  });

  // Item Events
  socket.on('create:item', async (data) => {
    if (!currentUserId) return;
    
    const newItem = {
      id: uuidv4(),
      project_id: data.projectId,
      content: data.content,
      completed: 0,
      created_at: Date.now()
    };

    try {
      // Verify project ownership
      const [projects] = await pool.execute(
        'SELECT id FROM projects WHERE id = ? AND user_id = ?',
        [newItem.project_id, currentUserId]
      );
      
      if (projects.length === 0) return;

      await pool.execute(
        'INSERT INTO items (id, project_id, content, completed, created_at) VALUES (?, ?, ?, ?, ?)',
        [newItem.id, newItem.project_id, newItem.content, newItem.completed, newItem.created_at]
      );

      const clientItem = {
        id: newItem.id,
        projectId: newItem.project_id,
        content: newItem.content,
        completed: false,
        createdAt: newItem.created_at
      };

      io.to(`user:${currentUserId}`).emit('item:created', clientItem);
    } catch (err) {
      console.error('Create item failed', err);
    }
  });

  socket.on('toggle:item', async (data) => {
    if (!currentUserId) return;

    try {
      // Check ownership via join
      const [rows] = await pool.execute(
        `SELECT i.completed, i.project_id FROM items i 
         JOIN projects p ON i.project_id = p.id 
         WHERE i.id = ? AND p.user_id = ?`,
        [data.itemId, currentUserId]
      );

      if (rows.length === 0) return;

      const newStatus = !rows[0].completed;
      await pool.execute('UPDATE items SET completed = ? WHERE id = ?', [newStatus, data.itemId]);
      
      // Fetch updated item to broadcast
      const [updatedRows] = await pool.execute('SELECT * FROM items WHERE id = ?', [data.itemId]);
      const item = updatedRows[0];

      io.to(`user:${currentUserId}`).emit('item:updated', {
        id: item.id,
        projectId: item.project_id,
        content: item.content,
        completed: Boolean(item.completed),
        createdAt: item.created_at
      });

    } catch (err) {
      console.error('Toggle item failed', err);
    }
  });

  socket.on('delete:item', async (data) => {
    if (!currentUserId) return;

    try {
      // Simple delete with ownership check
      await pool.execute(
        `DELETE i FROM items i 
         JOIN projects p ON i.project_id = p.id 
         WHERE i.id = ? AND p.user_id = ?`,
        [data.itemId, currentUserId]
      );

      io.to(`user:${currentUserId}`).emit('item:deleted', { itemId: data.itemId });
    } catch (err) {
      console.error('Delete item failed', err);
    }
  });

  socket.on('restore:item', async (data) => {
    if (!currentUserId) return;
    const item = data.item;

    try {
       // Verify project exists and belongs to user
       const [projects] = await pool.execute(
        'SELECT id FROM projects WHERE id = ? AND user_id = ?',
        [item.projectId, currentUserId]
      );
      
      if (projects.length === 0) return;

      await pool.execute(
        'INSERT INTO items (id, project_id, content, completed, created_at) VALUES (?, ?, ?, ?, ?)',
        [item.id, item.projectId, item.content, item.completed, item.createdAt]
      );

      io.to(`user:${currentUserId}`).emit('item:restored', item);
    } catch (err) {
      console.error('Restore item failed', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});