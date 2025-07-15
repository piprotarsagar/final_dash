const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000; 
app.use(cors());
app.use(express.json());

app.use('/api/students', require('./routes/students'));
app.use('/api/stats', require('./routes/stats'));

app.get('/', (req, res) => {
  res.send('Placement Dashboard Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});