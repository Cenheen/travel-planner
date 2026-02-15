const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables
const OpenAI = require('openai');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-it-in-production';

app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../dist')));

// Middleware: Authenticate Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// API: Register
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword
      }
    });

    // Auto login after register
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// API: Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// API: Generate Itinerary (Protected - optional, maybe public is fine too? Let's keep it public for now but require key)
app.post('/api/generate', async (req, res) => {
  const { apiKey, prompt } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key is required' });
  }

  try {
    const openai = new OpenAI({ 
      apiKey,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    });
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "qwen-plus",
    });

    const content = completion.choices[0].message.content;
    res.json({ content });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate itinerary' });
  }
});

// API: Save Trip (Protected)
app.post('/api/trips', authenticateToken, async (req, res) => {
  const { destination, summary, full_json } = req.body;
  
  try {
    const trip = await prisma.trip.create({
      data: {
        destination,
        summary,
        fullJson: JSON.stringify(full_json),
        userId: req.user.userId
      }
    });
    res.json({ message: 'Trip saved successfully', trip });
  } catch (error) {
    console.error('Save trip error:', error);
    res.status(500).json({ error: 'Failed to save trip' });
  }
});

// API: Get All Trips (Protected)
app.get('/api/trips', authenticateToken, async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    
    const parsedTrips = trips.map(t => ({
      ...t,
      full_json: JSON.parse(t.fullJson)
    }));
    
    res.json({ trips: parsedTrips });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// API: Delete Trip (Protected)
app.delete('/api/trips/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Ensure the trip belongs to the user
    const trip = await prisma.trip.findFirst({
      where: { id, userId: req.user.userId }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    await prisma.trip.delete({ where: { id } });
    res.json({ message: 'Trip deleted' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

// The "catchall" handler
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
