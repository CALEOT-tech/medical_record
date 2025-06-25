const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg'); 
const bcrypt = require('bcryptjs'); 
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const pgSession = require('connect-pg-simple')(session);
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 4665;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log('DATABASE_URL:', process.env.DATABASE_URL); 

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 20000, // Increase connection timeout to 20 seconds
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  max: 20 // Set maximum number of clients in the pool
});

// Retry logic for database connection
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.connect();
      console.log('Connected to the database');
      return;
    } catch (err) {
      console.error(`Database connection failed. Retrying in ${delay / 1000} seconds...`, err);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error('Failed to connect to the database after multiple attempts');
};

connectWithRetry().catch(err => {
  console.error('Could not establish a database connection:', err);
  process.exit(1);
});

// Configure CORS to allow requests from Render domain
const allowedOrigins = ['http://127.0.0.1:3000', 'https://medical-record-pq83.onrender.com'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
})); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); 
// Handle OPTIONS requests
app.options('*', cors());

// Use session middleware with PostgreSQL store
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session' 
  }),
  secret: '123456789', // Replace with your secret key
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Create admins table if it doesn't exist
const createAdminTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL
      );
    `);
    console.log('Admins table created successfully');
  } catch (error) {
    console.error('Error creating admins table:', error);
  }
};

// Create session table if it doesn't exist
const createSessionTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        PRIMARY KEY (sid)
      );
      
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session(expire);
    `);
    console.log('Session table created successfully');
  } catch (error) {
    console.error('Error creating session table:', error);
  }
};

// Create students table if it doesn't exist
const createStudentsTable = async () => {
  try {
    await pool.query(`
       CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    matric_no VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    medications TEXT NOT NULL,
    previous_treatments TEXT NOT NULL,
    health_conditions TEXT NOT NULL,
    treatment_log TEXT
      );
    `);
    console.log('Students table created successfully');
  } catch (error) {
    console.error('Error creating students table:', error);
  }
};

// Hash passwords 
const saltRounds = 11; // Adjust as needed

const createAdmin = async () => {
  const username = 'admin'; // Replace with desired username
  const password = 'admin1234'; // Replace with desired password
  const hashedPassword = await bcrypt.hash(password, 11);

  try {
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      await pool.query('INSERT INTO admins (username, password_hash) VALUES ($1, $2)', [username, hashedPassword]);
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Initialize the database
const initializeDatabase = async () => {
  await createAdminTable();
  await createSessionTable();
  await createAdmin();
  await createStudentsTable();
};

initializeDatabase();

// Register route
app.post('/register', async (req, res) => {
  const { firstName, lastName, matricNo, department, email, medications, previousTreatments, healthConditions, medicalQuestions } = req.body;

  if (!firstName || !lastName || !matricNo || !department || !email || !medications || !previousTreatments|| !healthConditions|| !medicalQuestions) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO students (first_name, last_name, matric_no, department, email, medications, previousTreatments, healthConditions, medical_questions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [firstName, lastName, matricNo, department, email, medications, previousTreatments, healthConditions, medicalQuestions]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error registering student:', error);
    res.status(500).json({ error: 'Failed to register student' });
  }
});

// Get all students route
app.get('/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Delete student route
app.delete('/students/:matricNo', async (req, res) => {
  try {
      const { matricNo } = req.params;
      const result = await pool.query('DELETE FROM students WHERE matric_no = $1 RETURNING *', [matricNo]);
      if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Student not found' });
      }
      res.status(200).json({ message: 'Student deleted successfully', student: result.rows[0] });
  } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Admin login route
app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]); 

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const storedHash = result.rows[0].password_hash;

    const isMatch = await bcrypt.compare(password, storedHash);

    if (isMatch) {
      req.session.admin = true; 
      req.session.adminId = result.rows[0].id; 
      return res.status(200).json({ message: 'Login successful' });
    } else {
      return res.status(500).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Login failed. Please try again later.' });
  }
});

// Admin logout route
app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin');
});

// Admin dashboard route (protected)
app.get('/admin_dashboard.html', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/admin'); 
  }

  res.sendFile(path.join(__dirname, 'public', 'admin_dashboard.html'));
});

// Change admin password route
app.post('/admin/change-password', async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 11);

    const result = await pool.query('UPDATE admins SET password_hash = $1 WHERE username = $2 RETURNING *', [hashedPassword, username]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password. Please try again later.' });
  }
});

// Search students API route
app.get('/api/students', async (req, res) => {
  try {
    const { matricNo } = req.query; 

    let query = 'SELECT * FROM students';
    const values = [];

    if (matricNo) {
      query += ' WHERE matric_no = $1';
      values.push(matricNo);
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).send('Error fetching students.');
  }
});

// Get single student by matriculation number
app.get('/api/students/:matricNo', async (req, res) => {
  try {
    const { matricNo } = req.params;

    const result = await pool.query('SELECT * FROM students WHERE matric_no = $1', [matricNo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Error fetching student.' });
  }
});

// Edit student API route
app.put('/api/students/:matricNo', async (req, res) => {
  try {
    const { matricNo } = req.params;
    const { firstName, lastName, department, email, medicalQuestions } = req.body;

    const result = await pool.query(
      'UPDATE students SET first_name = $1, last_name = $2, department = $3, email = $4, medical_questions = $5 WHERE matric_no = $6',
      [firstName, lastName, department, email, medicalQuestions, matricNo]
    );

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).send('Error updating student.');
  }
});

app.get('/search', async (req, res) => {
  try {
    const { matricNo } = req.query;
    const result = await pool.query('SELECT * FROM students WHERE matric_no = $1', [matricNo]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

