const express = require('express');
const router = express.Router();
const pool = require('../db');

const buildFilterConditions = (filters) => {
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (filters.department && filters.department !== 'All') {
    conditions.push(`department = $${paramIndex++}`);
    values.push(filters.department);
  }
  if (filters.year && filters.year !== 'All') {
    conditions.push(`year = $${paramIndex++}`);
    values.push(filters.year);
  }
  if (filters.company && filters.company !== 'All') {
    conditions.push(`company = $${paramIndex++}`);
    values.push(filters.company);
  }
  if (filters.search) {
    conditions.push(`LOWER(name) LIKE LOWER($${paramIndex++})`);
    values.push(`%${filters.search}%`);
  }
  return { conditions, values };
};


router.get('/summary', async (req, res) => {
  try {
    const { conditions, values } = buildFilterConditions(req.query);

    const buildFinalWhereClause = (additionalConditions = []) => {
      const allConditions = [...conditions, ...additionalConditions];
      return allConditions.length > 0 ? `WHERE ${allConditions.join(' AND ')}` : '';
    };

    const placedResult = await pool.query(
      `SELECT COUNT(*) FROM students ${buildFinalWhereClause(['company IS NOT NULL', `company <> ''`])}`,
      values
    );
    
    const totalResult = await pool.query(
      `SELECT COUNT(*) FROM students ${buildFinalWhereClause()}`,
      values
    );
    
    const avgPackageResult = await pool.query(
      `SELECT ROUND(AVG(
         CASE
           WHEN TRIM(package::text) ~ '^[0-9]+(\.[0-9]+)?$' AND TRIM(package::text) <> ''
           THEN CAST(TRIM(package::text) AS NUMERIC)
           ELSE NULL
         END
       ), 2) as avg
       FROM students
       ${buildFinalWhereClause([
         `package IS NOT NULL` 
       ])}`,
       values
    );
    
    const companiesResult = await pool.query(
      `SELECT COUNT(DISTINCT company) FROM students ${buildFinalWhereClause(['company IS NOT NULL', `company <> ''`])}`,
      values
    );

    res.json({
      placed: parseInt(placedResult.rows[0].count) || 0,
      totalStudents: parseInt(totalResult.rows[0].count) || 0,
      avgPackage: parseFloat(avgPackageResult.rows[0].avg) || null,
      companies: parseInt(companiesResult.rows[0].count) || 0
    });
  } catch (err) {
    console.error("Error in /api/stats/summary:", err.message);
    res.status(500).send(err.message);
  }
});

router.get('/charts', async (req, res) => {
  try {
    const { conditions, values } = buildFilterConditions(req.query);

    const buildFinalWhereClause = (additionalConditions = []) => {
      const allConditions = [...conditions, ...additionalConditions];
      return allConditions.length > 0 ? `WHERE ${allConditions.join(' AND ')}` : '';
    };

    const genderResult = await pool.query(
      `SELECT gender, COUNT(*) FROM students ${buildFinalWhereClause()} GROUP BY gender`,
      values
    );
    
    const avgCgpaResult = await pool.query(
      `SELECT company, ROUND(AVG(cgpa), 2) as avg_cgpa FROM students ${buildFinalWhereClause(['company IS NOT NULL', `company <> ''`])} GROUP BY company ORDER BY avg_cgpa DESC`,
      values
    );
    
    const topCompaniesResult = await pool.query(
      `SELECT company, COUNT(*) FROM students ${buildFinalWhereClause(['company IS NOT NULL', `company <> ''`])} GROUP BY company ORDER BY COUNT(*) DESC LIMIT 5`,
      values
    );

    const allStudentsRounds = await pool.query(
      `SELECT id, rounds, cgpa FROM students ${buildFinalWhereClause(['cgpa IS NOT NULL'])}`,
      values
    );

    const roundDrop = {
      'round_1_failed': 0,
      'round_2_failed': 0,
      'round_3_failed': 0,
      'round_4_failed': 0
    };

    allStudentsRounds.rows.forEach(student => {
      const roundsCleared = student.rounds || [];

      const passedCoding = roundsCleared.includes('Coding');
      const passedTechnical = roundsCleared.includes('Technical Interview');
      const passedHR = roundsCleared.includes('HR Interview');
      const passedFinalOffer = roundsCleared.includes('Final Offer');

      if (!passedCoding && student.cgpa > 0) {
        roundDrop.round_1_failed++;
      } else if (passedCoding && !passedTechnical) {
        roundDrop.round_2_failed++;
      } else if (passedTechnical && !passedHR) {
        roundDrop.round_3_failed++;
      } else if (passedHR && !passedFinalOffer) {
        roundDrop.round_4_failed++;
      }
    });
const yearlyTrendsResult = await pool.query(
  `SELECT year, COUNT(*) as count
   FROM students
   ${buildFinalWhereClause(['company IS NOT NULL', 'company <> \'\''])}
   GROUP BY year
   ORDER BY year`,
   values
);
const yearlyTrends = yearlyTrendsResult.rows.map(r => ({
  year: r.year,
  count: parseInt(r.count)
}));

const packageDistributionResult = await pool.query(
  `SELECT 
     CASE
       WHEN package < 2 THEN 'Below 2 LPA'
       WHEN package >= 2 AND package < 4 THEN '2 - 4 LPA'
       WHEN package >= 4 AND package < 6 THEN '4 - 6 LPA'
       WHEN package >= 6 AND package < 8 THEN '6 - 8 LPA'
       ELSE '8+ LPA'
     END AS range,
     COUNT(*) as count
   FROM students
   ${buildFinalWhereClause(['package IS NOT NULL', 'company IS NOT NULL', "company <> ''"])}
   GROUP BY range
   ORDER BY 
     MIN(CASE
       WHEN package < 2 THEN 1
       WHEN package < 4 THEN 2
       WHEN package < 6 THEN 3
       WHEN package < 8 THEN 4
       ELSE 5
     END)`,
   values
);


const packageDistribution = packageDistributionResult.rows.map(r => ({
  range: r.range,
  count: parseInt(r.count)
}));

 res.json({
  genderDist: genderResult.rows.map(r => ({ gender: r.gender, count: parseInt(r.count) })),
  avgCgpa: avgCgpaResult.rows,
  topCompanies: topCompaniesResult.rows.map(r => ({ company: r.company, count: parseInt(r.count)})),
  roundDrop,
  yearlyTrends,
  packageDistribution
});

  } catch (err) {
    console.error("Error in /api/stats/charts:", err.message);
    res.status(500).send(err.message);
  }
});

module.exports = router;
