const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for public access
app.use(express.json({ limit: '10mb' })); // Parse JSON, limit size for security

// Rate limiting (basic, in-memory; use Redis for production)
const requestCounts = {};
setInterval(() => { Object.keys(requestCounts).forEach(key => delete requestCounts[key]); }, 60000); // Reset every minute
app.use((req, res, next) => {
  const ip = req.ip;
  requestCounts[ip] = (requestCounts[ip] || 0) + 1;
  if (requestCounts[ip] > 100) { // 100 requests per minute per IP
    return res.status(429).json({ is_success: false, message: 'Too many requests' });
  }
  next();
});

// Utility functions
function isPrime(num) {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
}

function gcd(a, b) {
  while (b !== 0) {
    let t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function generateFibonacci(n) {
  if (n <= 0) return [];
  const series = [0];
  if (n === 1) return series;
  series.push(1);
  for (let i = 2; i < n; i++) {
    series.push(series[i - 1] + series[i - 2]);
  }
  return series;
}

// AI Integration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
async function getAIResponse(question) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
    const prompt = `Answer the following question in exactly one word: ${question}`;
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    // Ensure single word; if not, default
    return response.split(' ').length === 1 ? response : 'Unknown';
  } catch (error) {
    console.error('AI Error:', error);
    return 'Unknown';
  }
}

// Routes
app.post('/bfhl', async (req, res) => {
  try {
    const body = req.body;
    const keys = Object.keys(body);
    const allowedKeys = ['fibonacci', 'prime', 'lcm', 'hcf', 'AI'];

    // Check exactly one key
    if (keys.length !== 1 || !allowedKeys.includes(keys[0])) {
      return res.status(400).json({
        is_success: false,
        official_email: 'your.chitkara.email@chitkara.edu.in',
        message: 'Exactly one key from fibonacci, prime, lcm, hcf, or AI is required.'
      });
    }

    const key = keys[0];
    let data;

    if (key === 'fibonacci') {
      const n = body[key];
      if (typeof n !== 'number' || n < 1 || n > 100 || !Number.isInteger(n)) {
        return res.status(400).json({
          is_success: false,
          official_email: 'your.chitkara.email@chitkara.edu.in',
          message: 'fibonacci must be an integer between 1 and 100.'
        });
      }
      data = generateFibonacci(n);
    } else if (key === 'prime') {
      const arr = body[key];
      if (!Array.isArray(arr) || arr.length === 0 || arr.length > 100) {
        return res.status(400).json({
          is_success: false,
          official_email: 'your.chitkara.email@chitkara.edu.in',
          message: 'prime must be a non-empty array of up to 100 integers.'
        });
      }
      const primes = arr.filter(num => typeof num === 'number' && Number.isInteger(num) && num >= 2 && isPrime(num));
      data = primes;
    } else if (key === 'lcm') {
      const arr = body[key];
      if (!Array.isArray(arr) || arr.length < 2 || arr.length > 10) {
        return res.status(400).json({
          is_success: false,
          official_email: 'your.chitkara.email@chitkara.edu.in',
          message: 'lcm must be an array of 2 to 10 positive integers.'
        });
      }
      let result = arr[0];
      for (let i = 1; i < arr.length; i++) {
        if (typeof arr[i] !== 'number' || !Number.isInteger(arr[i]) || arr[i] <= 0) {
          return res.status(400).json({
            is_success: false,
            official_email: 'your.chitkara.email@chitkara.edu.in',
            message: 'All elements in lcm array must be positive integers.'
          });
        }
        result = lcm(result, arr[i]);
      }
      data = result;
    } else if (key === 'hcf') {
      const arr = body[key];
      if (!Array.isArray(arr) || arr.length < 2 || arr.length > 10) {
        return res.status(400).json({
          is_success: false,
          official_email: 'your.chitkara.email@chitkara.edu.in',
          message: 'hcf must be an array of 2 to 10 positive integers.'
        });
      }
      let result = arr[0];
      for (let i = 1; i < arr.length; i++) {
        if (typeof arr[i] !== 'number' || !Number.isInteger(arr[i]) || arr[i] <= 0) {
          return res.status(400).json({
            is_success: false,
            official_email: 'your.chitkara.email@chitkara.edu.in',
            message: 'All elements in hcf array must be positive integers.'
          });
        }
        result = gcd(result, arr[i]);
      }
      data = result;
    } else if (key === 'AI') {
      const question = body[key];
      if (typeof question !== 'string' || question.trim().length === 0 || question.length > 500) {
        return res.status(400).json({
          is_success: false,
          official_email: 'your.chitkara.email@chitkara.edu.in',
          message: 'AI must be a non-empty string up to 500 characters.'
        });
      }
      data = await getAIResponse(question);
    }

    res.status(200).json({
      is_success: true,
      official_email: 'anshika0034.be23@chitkara.edu.in',
      data: data
    });
  } catch (error) {
    console.error('POST /bfhl Error:', error);
    res.status(500).json({
      is_success: false,
      official_email: 'your.chitkara.email@chitkara.edu.in',
      message: 'Internal server error.'
    });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: 'anshika0034.be23@chitkara.edu.in'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});