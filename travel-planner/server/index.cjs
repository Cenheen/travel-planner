const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
const db = require('./db.cjs');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../dist')));

// API: Generate Itinerary
app.post('/api/generate', async (req, res) => {
  const { apiKey, prompt } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key is required' });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    const content = completion.choices[0].message.content;
    res.json({ content });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate itinerary' });
  }
});

// API: Save Trip
app.post('/api/trips', (req, res) => {
  const { id, destination, summary, full_json } = req.body;
  const sql = `INSERT INTO trips (id, destination, summary, full_json) VALUES (?, ?, ?, ?)`;
  
  db.run(sql, [id, destination, summary, JSON.stringify(full_json)], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'Trip saved successfully', id });
  });
});

// API: Get All Trips
app.get('/api/trips', (req, res) => {
  const sql = `SELECT * FROM trips ORDER BY created_at DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    const trips = rows.map(row => ({
      ...row,
      full_json: JSON.parse(row.full_json)
    }));
    res.json({ trips });
  });
});

// API: Delete Trip
app.delete('/api/trips/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM trips WHERE id = ?`;
  db.run(sql, id, function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'Trip deleted', changes: this.changes });
  });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
