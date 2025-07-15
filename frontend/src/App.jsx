const API = import.meta.env.VITE_API;
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const App = () => {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({
    placed: 0,
    totalStudents: 0,
    avgPackage: null,
    companies: 0
  });
  const [charts, setCharts] = useState({
    genderDist: [],
    roundDrop: {},
    topCompanies: [],
    avgCgpa: [],
    yearlyTrends: [],
    packageDistribution: []
  });
  const [filters, setFilters] = useState({ department: 'All', year: 'All', company: 'All', search: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const PIE_COLORS = ['#DC3545', '#007BFF'];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/api/students`, { params: filters });
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching student data:", err);
      setError("Failed to load student data. Please ensure your backend API is running and accessible.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsData = async () => {
    try {
      const summaryRes = await axios.get(`${API}/api/stats/summary`, { params: filters });
      setSummary({
        placed: summaryRes.data?.placed || 0,
        totalStudents: summaryRes.data?.totalStudents !== undefined ? summaryRes.data.totalStudents : 0,
        avgPackage: summaryRes.data?.avgPackage !== undefined ? summaryRes.data.avgPackage : null,
        companies: summaryRes.data?.companies !== undefined ? summaryRes.data.companies : 0
      });

      const chartsRes = await axios.get(`${API}/api/stats/charts`, { params: filters });
      setCharts(chartsRes.data || { genderDist: [], roundDrop: {}, topCompanies: [], avgCgpa: [], yearlyTrends: [], packageDistribution: [] });
    } catch (err) {
      console.error("Error fetching stats data:", err);
      setError("Failed to load summary and chart data. Please ensure your backend API is running and accessible.");
      setSummary({ placed: 0, totalStudents: 0, avgPackage: null, companies: 0 });
      setCharts({ genderDist: [], roundDrop: {}, topCompanies: [], avgCgpa: [], yearlyTrends: [], packageDistribution: [] });
    }
  };

  useEffect(() => {
    fetchData();
    fetchStatsData();
  }, []);

  useEffect(() => {
    fetchData();
    fetchStatsData();
  }, [filters]);

  const departments = Array.isArray(students) ? [...new Set(students.map((s) => s.department).filter(Boolean))] : [];
  const years = Array.isArray(students) ? [...new Set(students.map((s) => s.year).filter(Boolean))] : [];
  const companies = Array.isArray(students) ? [...new Set(students.map((s) => s.company).filter(Boolean))] : [];

  const roundDropChartData = Object.entries(charts.roundDrop || {}).map(([key, value]) => {
    const formattedRound = key.replace(/_/g, ' ').replace('round', 'Round ').trim();
    return { round: formattedRound, count: value };
  });

  if (loading) {
    return (
      <div className="status-container">
        <div className="loading-message">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-container">
        <div className="error-message">
          <p>Error: {error}</p>
          <p className="text-lg">Please check your backend server and network connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <h1 className="dashboard-title">
        Department's Placement Dashboard
      </h1>

     
      <div className="filter-section">
        
        <select
          onChange={e => setFilters({ ...filters, department: e.target.value })}
          value={filters.department}
          className="filter-select"
        >
          <option value="All">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        
        <select
          onChange={e => setFilters({ ...filters, year: e.target.value })}
          value={filters.year}
          className="filter-select"
        >
          <option value="All">All Years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
       
        <select
          onChange={e => setFilters({ ...filters, company: e.target.value })}
          value={filters.company}
          className="filter-select"
        >
          <option value="All">All Companies</option>
          {companies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        
        <input
          type="text"
          placeholder="Search Student Name..."
          className="filter-input"
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
        />
        
        <button
          onClick={() => setFilters({ department: 'All', year: 'All', company: 'All', search: '' })}
          className="reset-button"
        >
          Reset Filters
        </button>
      </div>

      
      <div className="summary-cards-grid">
       
        <div className="summary-card card-green">
          <div className="summary-card-title">Students Placed</div>
          <div className="summary-card-value">{summary.placed}</div>
        </div>
       
        <div className="summary-card card-yellow">
          <div className="summary-card-title">Total Students</div>
          <div className="summary-card-value">{summary.totalStudents}</div>
        </div>
        
        <div className="summary-card card-purple">
          <div className="summary-card-title">Placement Rate</div>
          <div className="summary-card-value">
           
            {((summary.placed / (summary.totalStudents || 1)) * 100).toFixed(1)}%
          </div>
        </div>
        
        <div className="summary-card card-blue">
          <div className="summary-card-title">Avg Package</div>
          <div className="summary-card-value">
            {summary.avgPackage !== null ? `${summary.avgPackage}L` : 'N/A'}
          </div>
        </div>
      </div>

   
      <div className="charts-grid">
        
        <div className="chart-container">
          <h2 className="chart-title">Gender Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={charts.genderDist}
                dataKey="count"
                nameKey="gender"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
               
                {charts.genderDist?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip /> 
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        
        <div className="chart-container">
          <h2 className="chart-title">Recruitment Round Analysis</h2>
          <ResponsiveContainer width="100%" height={300}>
            
            <BarChart data={roundDropChartData}>
              <XAxis dataKey="round" interval={0} angle={-30} textAnchor="end" height={60} className="chart-axis-label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#007BFF" radius={[10, 10, 0, 0]} /> 
            </BarChart>
          </ResponsiveContainer>
        </div>

        
        <div className="chart-container">
          <h2 className="chart-title">Top Companies</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.topCompanies || []}>
              <XAxis dataKey="company" interval={0} angle={-30} textAnchor="end" height={60} className="chart-axis-label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#FFC107" radius={[10, 10, 0, 0]} /> {/* Yellow from screenshot */}
            </BarChart>
          </ResponsiveContainer>
        </div>

       
        <div className="chart-container">
          <h2 className="chart-title">Average CGPA by Company</h2>
          <ResponsiveContainer width="100%" height={300}>
            
            <BarChart data={charts.avgCgpa || []}>
              <XAxis dataKey="company" interval={0} angle={-30} textAnchor="end" height={60} className="chart-axis-label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avg_cgpa" fill="#28A745" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        
        <div className="chart-container">
          <h2 className="chart-title">Yearly Trends (Students Placed)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.yearlyTrends || []}>
              <XAxis dataKey="year" className="chart-axis-label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#6C757D" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h2 className="chart-title">Package Distribution (LPA)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.packageDistribution || []}>
              <XAxis dataKey="range" className="chart-axis-label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#FD7E14" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2 className="table-section-title">Student Details</h2>
      <div className="table-container">
        <table className="student-table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Name</th>
              <th className="table-header-cell">Department</th>
              <th className="table-header-cell">Year</th>
              <th className="table-header-cell">Company</th>
              <th className="table-header-cell">Package (LPA)</th>
              <th className="table-header-cell">CGPA</th>
              <th className="table-header-cell">Rounds Cleared</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(students) && students.length > 0 ? (
              students.map((s, idx) => (
                <tr key={idx} className="table-row">
                  <td className="table-cell">{s.name}</td>
                  <td className="table-cell">{s.department}</td>
                  <td className="table-cell">{s.year}</td>
                  <td className="table-cell">{s.company || 'N/A'}</td>
                  <td className="table-cell">{s.package || 'N/A'}</td>
                  <td className="table-cell">{s.cgpa || 'N/A'}</td>
                  <td className="table-cell">
                    {Array.isArray(s.rounds) && s.rounds.length > 0 ? s.rounds.join(', ') : 'N/A'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data-message">
                  No student data available matching the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
