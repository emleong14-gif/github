const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

function readSubmissions() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeSubmissions(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data));
}

// Submit a new zone drawing
app.post('/api/submit', (req, res) => {
  try {
    const { points } = req.body;
    if (!Array.isArray(points) || points.length === 0) {
      return res.status(400).json({ error: 'No points provided' });
    }
    const submissions = readSubmissions();
    submissions.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      points // array of [lat, lng]
    });
    writeSubmissions(submissions);
    res.json({ success: true, totalSubmissions: submissions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all submissions flattened for the heatmap
app.get('/api/submissions', (req, res) => {
  try {
    const submissions = readSubmissions();
    const allPoints = submissions.flatMap(s => s.points);
    res.json({ totalSubmissions: submissions.length, points: allPoints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear all submissions (admin)
app.delete('/api/submissions', (req, res) => {
  writeSubmissions([]);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\nChurch Zone Mapper running at http://localhost:${PORT}`);
  console.log(`Heatmap view:           http://localhost:${PORT}/heatmap.html\n`);
});
