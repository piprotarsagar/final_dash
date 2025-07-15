const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { department, year, company, search } = req.query;
    let query = 'SELECT id, name, department, year, gender, company, package, cgpa, rounds FROM students WHERE 1=1';
    let params = [];

    if (department && department !== 'All') {
      params.push(department);
      query += ` AND department = $${params.length}`;
    }
    if (year && year !== 'All') {
      params.push(year);
      query += ` AND year = $${params.length}`;
    }
    if (company && company !== 'All') {
      params.push(company);
      query += ` AND company = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error in /api/students:", err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
