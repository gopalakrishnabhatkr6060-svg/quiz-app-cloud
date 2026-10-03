/**
 * Quiz Platform Server — Express + Supabase Cloud Database
 * 
 * All quiz submissions are stored in Supabase's hosted PostgreSQL.
 * No local database files needed!
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Supabase Client ───────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
  console.warn('⚠️ Missing Supabase credentials! API endpoints will return errors.');
  console.warn('   Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client initialized:', supabaseUrl);
}

// ─── Middleware ─────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ─── API: Submit Quiz ──────────────────────────────────────
app.post('/api/submit-quiz', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ success: false, error: 'Database not configured' });
    const data = req.body;
    const submission = {
      candidate_name: (data.candidate_name || 'Anonymous Candidate').trim(),
      candidate_email: (data.candidate_email || 'candidate@example.com').trim(),
      quiz_type: data.quiz_type || 'General Quiz',
      score: Number(data.score) || 0,
      total_questions: Number(data.total_questions) || 30,
      percentage: Number(data.percentage) || 0,
      accuracy: Number(data.accuracy) || Number(data.percentage) || 0,
      time_spent_seconds: Number(data.time_spent_seconds) || 0,
      evaluation_status: data.evaluation_status || (Number(data.percentage) >= 70 ? 'PASS' : 'FAIL'),
      answers_json: data.answers || []
    };

    const { data: inserted, error } = await supabase
      .from('quiz_submissions')
      .insert([submission])
      .select('id')
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Quiz submission stored in Supabase cloud database!',
      submission_id: inserted.id
    });
  } catch (err) {
    console.error('Error inserting submission:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── API: Get All Submissions ──────────────────────────────
app.get('/api/submissions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quiz_submissions')
      .select('id, candidate_name, candidate_email, quiz_type, score, total_questions, percentage, accuracy, time_spent_seconds, evaluation_status, submitted_at')
      .order('id', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Get Submission by ID ─────────────────────────────
app.get('/api/submissions/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quiz_submissions')
      .select('*')
      .eq('id', Number(req.params.id))
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Submission not found' });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Delete Submission ────────────────────────────────
app.delete('/api/submissions/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('quiz_submissions')
      .delete()
      .eq('id', Number(req.params.id));

    if (error) throw error;
    res.json({ success: true, message: 'Deleted from cloud database' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Dashboard Stats ──────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quiz_submissions')
      .select('percentage, score');

    if (error) throw error;

    const total = data.length;
    const avgPercentage = total > 0 ? data.reduce((s, r) => s + r.percentage, 0) / total : 0;
    const maxScore = total > 0 ? Math.max(...data.map(r => r.score)) : 0;
    const passedCount = data.filter(r => r.percentage >= 70).length;

    res.json({
      total_submissions: total,
      avg_percentage: avgPercentage,
      max_score: maxScore,
      passed_count: passedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Static Routes ─────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/js-quiz', (req, res) => res.sendFile(path.join(__dirname, 'public', 'javascript_quiz.html')));
app.get('/javascript', (req, res) => res.sendFile(path.join(__dirname, 'public', 'javascript_quiz.html')));
app.get('/transformer-quiz', (req, res) => res.sendFile(path.join(__dirname, 'public', 'transformer_quiz.html')));
app.get('/transformer', (req, res) => res.sendFile(path.join(__dirname, 'public', 'transformer_quiz.html')));
app.get('/os-quiz', (req, res) => res.sendFile(path.join(__dirname, 'public', 'os_quiz.html')));
app.get('/os', (req, res) => res.sendFile(path.join(__dirname, 'public', 'os_quiz.html')));
app.get('/finetuning-quiz', (req, res) => res.sendFile(path.join(__dirname, 'public', 'finetuning_quiz.html')));
app.get('/finetuning', (req, res) => res.sendFile(path.join(__dirname, 'public', 'finetuning_quiz.html')));
app.get('/llm-finetuning', (req, res) => res.sendFile(path.join(__dirname, 'public', 'finetuning_quiz.html')));

// ─── Start Server ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Quiz Platform running at http://localhost:${PORT}`);
  console.log(`☁️  Database: Supabase Cloud PostgreSQL`);
  console.log(`\n📊 Dashboard:          http://localhost:${PORT}/dashboard`);
  console.log(`📝 JavaScript Quiz:    http://localhost:${PORT}/js-quiz`);
  console.log(`📝 Transformer Quiz:   http://localhost:${PORT}/transformer-quiz`);
  console.log(`📝 OS Quiz:            http://localhost:${PORT}/os-quiz`);
  console.log(`📝 Fine-Tuning Quiz:   http://localhost:${PORT}/finetuning-quiz`);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
});
