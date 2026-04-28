const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// C2 - Startup validation: fail fast on missing or placeholder secrets
const requiredEnv = ['JWT_SECRET', 'DB_PASSWORD'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}
if (
  process.env.JWT_SECRET === 'your_jwt_secret_key_change_in_production' ||
  process.env.JWT_SECRET.length < 32
) {
  console.error('FATAL: JWT_SECRET is a placeholder or too short (minimum 32 characters). Generate one with: openssl rand -hex 32');
  process.exit(1);
}

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const projectRoutes = require('./routes/projectRoutes');
const resourceAllocationRoutes = require('./routes/resourceAllocationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const snapshotRoutes = require('./routes/snapshots');
const dataRoutes = require('./routes/dataRoutes');

const app = express();

// H8 - Security headers with helmet
app.use(helmet());

// C3 - CORS with restricted origins
const corsOptions = {
  origin: process.env.CORS_ALLOWED_ORIGIN || 'http://localhost',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// C4 - Cookie parser middleware
app.use(cookieParser());

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/allocations', resourceAllocationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/snapshots', snapshotRoutes);
app.use('/api', dataRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
