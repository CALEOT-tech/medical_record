const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg'); 
const bcrypt = require('bcryptjs'); // For password hashing
const session = require('express-session');
const path = require('path');
const cors = require('cors');

const app = express();
//const port = 4665;
const PORT = process.env.PORT || 4665;

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

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

// Hash passwords 
const saltRounds = 11; // Adjust as needed

const createAdmin = async () => {
  const username = 'admin'; // Replace with desired username
  const password = 'admin1234'; // Replace with desired password
  const hashedPassword = await bcrypt.hash(password, 11);

  try {
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      await pool.query(
        'INSERT INTO admins (username, password_hash) VALUES ($1, $2)',
        [username, hashedPassword]
      );
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Create the admins table and then create an admin user
const initializeDatabase = async () => {
  await createAdminTable();
  await createAdmin();
};

initializeDatabase();

// Session middleware
app.use(session({
    secret: '123456789', // Replace with a strong secret key
    resave: false,    
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Parse JSON requests for PUT requests
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Register route
app.post('/register', async (req, res) => {
    try {
      const { firstName, lastName, matricNo, department, email, medicalQuestions } = req.body;
  
      const result = await pool.query(
        'INSERT INTO students (first_name, last_name, matric_no, department, email, medical_questions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [firstName, lastName, matricNo, department, email, medicalQuestions]
      );
  
      res.status(200).json({ message: 'Registration successful!', student: result.rows[0] }); 
    } catch (error) {
      console.error('Error registering student:', error);
  
      if (error.code === '23505') { // Handle unique constraint violation (e.g., duplicate matricNo or email)
        res.status(400).json({ error: 'Matriculation number or email already exists.' });
      } else {
        res.status(500).json({ error: 'Registration failed. Please try again later.' });
      }
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
      console.log(`Attempting to delete student with matricNo: ${matricNo}`);
      const result = await pool.query('DELETE FROM students WHERE matric_no = $1 RETURNING *', [matricNo]);
      if (result.rowCount === 0) {
        console.log(`Student with matricNo: ${matricNo} not found`);
          return res.status(404).json({ error: 'Student not found' });
      }
      res.status(200).json({ message: 'Student deleted successfully', student: result.rows[0] });
  } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ error: 'Failed to delete student' });
  }
});

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`);
    process.exit(1);
  } else {
    throw err;
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
        res.redirect('/admin_dashboard.html');
      } else {
        res.status(401).json({ error: 'Invalid username or password' });
      }
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Login failed. Please try again later.' });
    }
  });

// Admin logout route
app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin');
  });

// Admin dashboard route (protected)
app.get('/admin/dashboard', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/admin'); // Redirect to login if not logged in
  }

  res.sendFile(__dirname + '/public/admin_dashboard.html');
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