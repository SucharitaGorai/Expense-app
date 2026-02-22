const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

app.get('/', (req, res) => {
  console.log('Serving dashboard.html from:', path.join(__dirname, 'public', 'dashboard.html'));
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Visit http://localhost:3001 to test dashboard.html');
});
