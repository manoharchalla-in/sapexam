import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'sapexam.db');

const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS assessment_results (
    id TEXT PRIMARY KEY,
    candidate_name TEXT NOT NULL,
    candidate_email TEXT NOT NULL,
    campus_name TEXT DEFAULT '',
    trainer_name TEXT DEFAULT '',
    attempt_number INTEGER NOT NULL DEFAULT 1,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL DEFAULT 10,
    percentage REAL NOT NULL,
    correct_answers INTEGER NOT NULL,
    incorrect_answers INTEGER NOT NULL,
    unanswered_answers INTEGER NOT NULL,
    answers TEXT NOT NULL,
    session_id TEXT UNIQUE,
    submitted_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_candidate_email ON assessment_results(candidate_email);
  CREATE INDEX IF NOT EXISTS idx_submitted_at ON assessment_results(submitted_at);
  CREATE INDEX IF NOT EXISTS idx_score ON assessment_results(score);
  CREATE INDEX IF NOT EXISTS idx_trainer_name ON assessment_results(trainer_name);
  CREATE INDEX IF NOT EXISTS idx_campus_name ON assessment_results(campus_name);

  CREATE TABLE IF NOT EXISTS trainers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password TEXT NOT NULL DEFAULT '123',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS question_papers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'SAP ABAP',
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    passing_marks REAL NOT NULL DEFAULT 5,
    max_marks REAL NOT NULL DEFAULT 10,
    status TEXT NOT NULL DEFAULT 'Draft',
    public_token TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_paper_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'Single Choice',
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    marks REAL NOT NULL DEFAULT 1,
    explanation TEXT DEFAULT '',
    question_order INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY(question_paper_id) REFERENCES question_papers(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_qp_public_token ON question_papers(public_token);
  CREATE INDEX IF NOT EXISTS idx_questions_qp_id ON questions(question_paper_id);
`);

try {
  db.exec(`ALTER TABLE assessment_results ADD COLUMN campus_name TEXT DEFAULT ''`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE assessment_results ADD COLUMN trainer_name TEXT DEFAULT ''`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE assessment_results ADD COLUMN question_paper_id INTEGER DEFAULT NULL`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE assessment_results ADD COLUMN question_paper_title TEXT DEFAULT ''`);
} catch (e) {}

// Seed default trainers if empty
const trainerCount = (db.prepare(`SELECT COUNT(*) as count FROM trainers`).get() as { count: number })?.count || 0;
if (trainerCount === 0) {
  const seedTrainers = ['APPALARAJU', 'NOOKARAJU', 'DAKSHAYINI', 'NANI'];
  const insertStmt = db.prepare(`INSERT OR IGNORE INTO trainers (username, display_name, password, created_at) VALUES (?, ?, '123', ?)`);
  const now = new Date().toISOString();
  seedTrainers.forEach((t) => {
    insertStmt.run(t.toLowerCase(), t, now);
  });
}

// Seed default Published Question Paper if empty
const qpCount = (db.prepare(`SELECT COUNT(*) as count FROM question_papers`).get() as { count: number })?.count || 0;
if (qpCount === 0) {
  const now = new Date().toISOString();
  const defaultToken = 'sap-abap-assessment-01';
  const insertQP = db.prepare(`
    INSERT INTO question_papers (title, description, category, duration_minutes, passing_marks, max_marks, status, public_token, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const res = insertQP.run(
    'SAP ABAP Assessment 01',
    'Official SAP ABAP technical assessment question paper for candidate screening.',
    'SAP ABAP',
    30,
    5,
    10,
    'Published',
    defaultToken,
    now,
    now
  );
  const qpId = res.lastInsertRowid;

  const defaultQuestions = [
    {
      q: "Which transaction code is commonly used to create, change, and display ABAP programs?",
      a: "SE11", b: "SE38", c: "SE93", d: "SM37", correct: "B", marks: 1, exp: "SE38 is the ABAP Editor transaction."
    },
    {
      q: "Which SAP transaction is primarily used for maintaining Data Dictionary objects such as tables, data elements, domains, and structures?",
      a: "SE11", b: "SE80", c: "SE38", d: "ST22", correct: "A", marks: 1, exp: "SE11 is the ABAP Dictionary transaction."
    },
    {
      q: "Which ABAP statement is used to retrieve data from a database table?",
      a: "READ", b: "FETCH", c: "SELECT", d: "GET", correct: "C", marks: 1, exp: "SELECT statement queries open SQL database tables."
    },
    {
      q: "Which internal table type automatically maintains entries in ascending order according to its key?",
      a: "STANDARD TABLE", b: "SORTED TABLE", c: "HASHED TABLE", d: "INDEX TABLE", correct: "B", marks: 1, exp: "SORTED TABLE maintains sorted sequence."
    },
    {
      q: "Which statement is used to read a specific record from an internal table?",
      a: "SELECT TABLE", b: "READ TABLE", c: "GET TABLE", d: "FETCH TABLE", correct: "B", marks: 1, exp: "READ TABLE statement retrieves a specific row."
    },
    {
      q: "What is the main purpose of a Data Element in SAP ABAP?",
      a: "To store database records", b: "To define the semantic meaning and technical attributes of a field", c: "To execute ABAP programs", d: "To create transactions", correct: "B", marks: 1, exp: "Data Elements provide business labels and domain references."
    },
    {
      q: "Which ABAP statement is commonly used to loop through all records of an internal table?",
      a: "LOOP AT", b: "ITERATE", c: "FOR EACH", d: "REPEAT", correct: "A", marks: 1, exp: "LOOP AT iterates over internal tables."
    },
    {
      q: "Which transaction is commonly used to create and maintain transaction codes?",
      a: "SE11", b: "SE38", c: "SE93", d: "SE80", correct: "C", marks: 1, exp: "SE93 creates transaction codes."
    },
    {
      q: "Which ABAP technology is primarily used to define semantically rich data models that can be consumed by applications?",
      a: "CDS Views", b: "Smart Forms", c: "BDC", d: "TMG", correct: "A", marks: 1, exp: "Core Data Services (CDS) define data models on SAP HANA."
    },
    {
      q: "Which statement can be used to modify an existing record in an internal table?",
      a: "MODIFY", b: "CHANGE TABLE", c: "UPDATE TABLE ONLY", d: "ALTER", correct: "A", marks: 1, exp: "MODIFY updates existing rows in internal tables."
    },
  ];

  const insertQ = db.prepare(`
    INSERT INTO questions (question_paper_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, marks, explanation, question_order, created_at)
    VALUES (?, ?, 'Single Choice', ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  defaultQuestions.forEach((item, idx) => {
    insertQ.run(qpId, item.q, item.a, item.b, item.c, item.d, item.correct, item.marks, item.exp, idx + 1, now);
  });
}

export interface AssessmentRecord {
  id: string;
  candidate_name: string;
  candidate_email: string;
  campus_name?: string;
  trainer_name?: string;
  question_paper_id?: number | null;
  question_paper_title?: string;
  attempt_number: number;
  score: number;
  total_questions: number;
  percentage: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered_answers: number;
  answers: string;
  session_id?: string;
  submitted_at: string;
  created_at: string;
}

export function getAttemptNumberForEmail(email: string, paperId?: number): number {
  if (paperId) {
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM assessment_results WHERE LOWER(candidate_email) = ? AND question_paper_id = ?`);
    const res = stmt.get(email.toLowerCase(), paperId) as { count: number };
    return (res?.count || 0) + 1;
  }
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM assessment_results WHERE LOWER(candidate_email) = ?`);
  const res = stmt.get(email.toLowerCase()) as { count: number };
  return (res?.count || 0) + 1;
}

export function getRecordBySessionId(sessionId: string): AssessmentRecord | undefined {
  const stmt = db.prepare(`SELECT * FROM assessment_results WHERE session_id = ?`);
  return stmt.get(sessionId) as AssessmentRecord | undefined;
}

export function getRecordById(id: string): AssessmentRecord | undefined {
  const stmt = db.prepare(`SELECT * FROM assessment_results WHERE id = ?`);
  return stmt.get(id) as AssessmentRecord | undefined;
}

export function saveAssessmentResult(data: Omit<AssessmentRecord, 'created_at'>): AssessmentRecord {
  const now = new Date().toISOString();

  if (data.session_id) {
    const existing = getRecordBySessionId(data.session_id);
    if (existing) {
      return existing;
    }
  }

  const stmt = db.prepare(`
    INSERT INTO assessment_results (
      id, candidate_name, candidate_email, campus_name, trainer_name, question_paper_id, question_paper_title, attempt_number, score, total_questions,
      percentage, correct_answers, incorrect_answers, unanswered_answers,
      answers, session_id, submitted_at, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  stmt.run(
    data.id,
    data.candidate_name,
    data.candidate_email.toLowerCase(),
    data.campus_name || '',
    data.trainer_name || '',
    data.question_paper_id || null,
    data.question_paper_title || '',
    data.attempt_number,
    data.score,
    data.total_questions,
    data.percentage,
    data.correct_answers,
    data.incorrect_answers,
    data.unanswered_answers,
    data.answers,
    data.session_id || null,
    data.submitted_at,
    now
  );

  return { ...data, created_at: now };
}

export interface AdminQueryParams {
  search?: string;
  trainerFilter?: string; // 'all' | 'APPALARAJU' | 'NOOKARAJU' | 'DAKSHAYINI' | 'NANI'
  campusFilter?: string; // 'all' | 'CITY' | 'CIET'
  paperFilter?: string; // 'all' | question_paper_id
  scoreFilter?: string;
  percentageFilter?: string;
  dateFilter?: string;
  sortBy?: 'name' | 'email' | 'score' | 'percentage' | 'date';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export function getAdminResults(params: AdminQueryParams) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const queryParams: any[] = [];

  if (params.search && params.search.trim() !== '') {
    const term = `%${params.search.trim().toLowerCase()}%`;
    conditions.push(`(LOWER(candidate_name) LIKE ? OR LOWER(candidate_email) LIKE ? OR LOWER(campus_name) LIKE ? OR LOWER(trainer_name) LIKE ? OR LOWER(question_paper_title) LIKE ?)`);
    queryParams.push(term, term, term, term, term);
  }

  if (params.paperFilter && params.paperFilter !== 'all') {
    conditions.push(`question_paper_id = ?`);
    queryParams.push(parseInt(params.paperFilter, 10));
  }

  if (params.trainerFilter && params.trainerFilter !== 'all') {
    conditions.push(`UPPER(trainer_name) = ?`);
    queryParams.push(params.trainerFilter.trim().toUpperCase());
  }

  if (params.campusFilter && params.campusFilter !== 'all') {
    conditions.push(`UPPER(campus_name) = ?`);
    queryParams.push(params.campusFilter.trim().toUpperCase());
  }

  if (params.scoreFilter && params.scoreFilter !== 'all') {
    const parts = params.scoreFilter.split('-');
    if (parts.length === 2) {
      conditions.push(`score >= ? AND score <= ?`);
      queryParams.push(parseInt(parts[0], 10), parseInt(parts[1], 10));
    }
  }

  if (params.percentageFilter && params.percentageFilter !== 'all') {
    const parts = params.percentageFilter.split('-');
    if (parts.length === 2) {
      conditions.push(`percentage >= ? AND percentage <= ?`);
      queryParams.push(parseFloat(parts[0]));
      queryParams.push(parseFloat(parts[1]));
    }
  }

  if (params.dateFilter && params.dateFilter.trim() !== '') {
    conditions.push(`DATE(submitted_at) = DATE(?)`);
    queryParams.push(params.dateFilter.trim());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderColumn = 'submitted_at';
  switch (params.sortBy) {
    case 'name':
      orderColumn = 'candidate_name';
      break;
    case 'email':
      orderColumn = 'candidate_email';
      break;
    case 'score':
      orderColumn = 'score';
      break;
    case 'percentage':
      orderColumn = 'percentage';
      break;
    case 'date':
    default:
      orderColumn = 'submitted_at';
      break;
  }
  const orderDirection = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM assessment_results ${whereClause}`);
  const { total } = countStmt.get(...queryParams) as { total: number };

  const selectStmt = db.prepare(`
    SELECT * FROM assessment_results
    ${whereClause}
    ORDER BY ${orderColumn} ${orderDirection}
    LIMIT ? OFFSET ?
  `);

  const records = selectStmt.all(...queryParams, limit, offset) as AssessmentRecord[];

  return {
    records,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export function getAllResultsForExport(params: Omit<AdminQueryParams, 'page' | 'limit'>) {
  const { search, trainerFilter, campusFilter, scoreFilter, percentageFilter, dateFilter, sortBy, sortOrder } = params;
  const conditions: string[] = [];
  const queryParams: any[] = [];

  if (search && search.trim() !== '') {
    const term = `%${search.trim().toLowerCase()}%`;
    conditions.push(`(LOWER(candidate_name) LIKE ? OR LOWER(candidate_email) LIKE ? OR LOWER(campus_name) LIKE ? OR LOWER(trainer_name) LIKE ?)`);
    queryParams.push(term, term, term, term);
  }

  if (trainerFilter && trainerFilter !== 'all') {
    conditions.push(`UPPER(trainer_name) = ?`);
    queryParams.push(trainerFilter.trim().toUpperCase());
  }

  if (campusFilter && campusFilter !== 'all') {
    conditions.push(`UPPER(campus_name) = ?`);
    queryParams.push(campusFilter.trim().toUpperCase());
  }

  if (scoreFilter && scoreFilter !== 'all') {
    const parts = scoreFilter.split('-');
    if (parts.length === 2) {
      conditions.push(`score >= ? AND score <= ?`);
      queryParams.push(parseInt(parts[0], 10), parseInt(parts[1], 10));
    }
  }

  if (percentageFilter && percentageFilter !== 'all') {
    const parts = percentageFilter.split('-');
    if (parts.length === 2) {
      conditions.push(`percentage >= ? AND percentage <= ?`);
      queryParams.push(parseFloat(parts[0]));
      queryParams.push(parseFloat(parts[1]));
    }
  }

  if (dateFilter && dateFilter.trim() !== '') {
    conditions.push(`DATE(submitted_at) = DATE(?)`);
    queryParams.push(dateFilter.trim());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderColumn = 'submitted_at';
  switch (sortBy) {
    case 'name':
      orderColumn = 'candidate_name';
      break;
    case 'email':
      orderColumn = 'candidate_email';
      break;
    case 'score':
      orderColumn = 'score';
      break;
    case 'percentage':
      orderColumn = 'percentage';
      break;
    case 'date':
    default:
      orderColumn = 'submitted_at';
      break;
  }
  const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const selectStmt = db.prepare(`
    SELECT * FROM assessment_results
    ${whereClause}
    ORDER BY ${orderColumn} ${orderDirection}
  `);

  return selectStmt.all(...queryParams) as AssessmentRecord[];
}

export function getAdminDashboardStats(trainerFilter?: string, campusFilter?: string) {
  const conditions: string[] = [];
  const queryParams: any[] = [];

  if (trainerFilter && trainerFilter !== 'all') {
    conditions.push(`UPPER(trainer_name) = ?`);
    queryParams.push(trainerFilter.trim().toUpperCase());
  }

  if (campusFilter && campusFilter !== 'all') {
    conditions.push(`UPPER(campus_name) = ?`);
    queryParams.push(campusFilter.trim().toUpperCase());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM assessment_results ${whereClause}`);
  const { count: totalAttempts } = totalStmt.get(...queryParams) as { count: number };

  if (totalAttempts === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      averagePercentage: 0,
      highestScore: 0,
      passedCount: 0,
      belowFiveCount: 0,
      trainerStats: getTrainerBreakdown(),
      campusStats: getCampusBreakdown(),
    };
  }

  const statsStmt = db.prepare(`
    SELECT 
      AVG(score) as avgScore,
      AVG(percentage) as avgPercentage,
      MAX(score) as maxScore,
      SUM(CASE WHEN score >= 5 THEN 1 ELSE 0 END) as passed,
      SUM(CASE WHEN score < 5 THEN 1 ELSE 0 END) as belowFive
    FROM assessment_results
    ${whereClause}
  `);

  const res = statsStmt.get(...queryParams) as {
    avgScore: number;
    avgPercentage: number;
    maxScore: number;
    passed: number;
    belowFive: number;
  };

  return {
    totalAttempts,
    averageScore: Math.round((res.avgScore || 0) * 10) / 10,
    averagePercentage: Math.round((res.avgPercentage || 0) * 10) / 10,
    highestScore: res.maxScore || 0,
    passedCount: res.passed || 0,
    belowFiveCount: res.belowFive || 0,
    trainerStats: getTrainerBreakdown(),
    campusStats: getCampusBreakdown(),
  };
}

export function getTrainerBreakdown() {
  const trainers = ['APPALARAJU', 'NOOKARAJU', 'DAKSHAYINI', 'NANI'];
  const results: Record<string, { total: number; avgScore: number; passed: number }> = {};

  trainers.forEach((t) => {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        AVG(score) as avgScore,
        SUM(CASE WHEN score >= 5 THEN 1 ELSE 0 END) as passed
      FROM assessment_results 
      WHERE UPPER(trainer_name) = ?
    `);
    const res = stmt.get(t) as { total: number; avgScore: number; passed: number };
    results[t] = {
      total: res?.total || 0,
      avgScore: Math.round((res?.avgScore || 0) * 10) / 10,
      passed: res?.passed || 0,
    };
  });

  return results;
}

export function getCampusBreakdown() {
  const campuses = ['CITY', 'CIET'];
  const results: Record<string, { total: number; avgScore: number; passed: number }> = {};

  campuses.forEach((c) => {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        AVG(score) as avgScore,
        SUM(CASE WHEN score >= 5 THEN 1 ELSE 0 END) as passed
      FROM assessment_results 
      WHERE UPPER(campus_name) = ?
    `);
    const res = stmt.get(c) as { total: number; avgScore: number; passed: number };
    results[c] = {
      total: res?.total || 0,
      avgScore: Math.round((res?.avgScore || 0) * 10) / 10,
      passed: res?.passed || 0,
    };
  });

  return results;
}

export function deleteAssessmentResult(id: string): boolean {
  const stmt = db.prepare(`DELETE FROM assessment_results WHERE id = ?`);
  const res = stmt.run(id);
  return res.changes > 0;
}

export interface TrainerRecord {
  id: number;
  username: string;
  display_name: string;
  password: string;
  created_at: string;
}

export function getAllTrainers(): TrainerRecord[] {
  const stmt = db.prepare(`SELECT * FROM trainers ORDER BY display_name ASC`);
  return stmt.all() as TrainerRecord[];
}

export function getTrainerByUsername(username: string): TrainerRecord | undefined {
  const stmt = db.prepare(`SELECT * FROM trainers WHERE LOWER(username) = ?`);
  return stmt.get(username.trim().toLowerCase()) as TrainerRecord | undefined;
}

export function createTrainer(displayName: string, password: string = '123'): TrainerRecord {
  const cleanName = displayName.trim().toUpperCase();
  const username = cleanName.toLowerCase();
  const now = new Date().toISOString();

  const existing = getTrainerByUsername(username);
  if (existing) {
    return existing;
  }

  const stmt = db.prepare(`INSERT INTO trainers (username, display_name, password, created_at) VALUES (?, ?, ?, ?)`);
  const res = stmt.run(username, cleanName, password.trim() || '123', now);

  return {
    id: res.lastInsertRowid as number,
    username,
    display_name: cleanName,
    password: password.trim() || '123',
    created_at: now,
  };
}

export function updateTrainerPassword(usernameOrId: string | number, newPassword: string): boolean {
  let stmt;
  if (typeof usernameOrId === 'number') {
    stmt = db.prepare(`UPDATE trainers SET password = ? WHERE id = ?`);
  } else {
    stmt = db.prepare(`UPDATE trainers SET password = ? WHERE LOWER(username) = ?`);
  }
  const res = stmt.run(newPassword.trim(), typeof usernameOrId === 'number' ? usernameOrId : usernameOrId.toLowerCase().trim());
  return res.changes > 0;
}

export function deleteTrainer(usernameOrId: string | number): boolean {
  let stmt;
  if (typeof usernameOrId === 'number') {
    stmt = db.prepare(`DELETE FROM trainers WHERE id = ?`);
  } else {
    stmt = db.prepare(`DELETE FROM trainers WHERE LOWER(username) = ?`);
  }
  const res = stmt.run(typeof usernameOrId === 'number' ? usernameOrId : usernameOrId.toLowerCase().trim());
  return res.changes > 0;
}

// ----------------------------------------------------
// QUESTION PAPERS & QUESTIONS DB API
// ----------------------------------------------------

export interface QuestionPaperRecord {
  id: number;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  passing_marks: number;
  max_marks: number;
  status: 'Draft' | 'Published' | 'Unpublished' | 'Archived';
  public_token: string;
  created_at: string;
  updated_at: string;
  question_count?: number;
  attempt_count?: number;
}

export interface QuestionRecord {
  id: number;
  question_paper_id: number;
  question_text: string;
  question_type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
  explanation: string;
  question_order: number;
  created_at: string;
}

export function getAllQuestionPapers(): QuestionPaperRecord[] {
  const stmt = db.prepare(`
    SELECT qp.*,
      (SELECT COUNT(*) FROM questions q WHERE q.question_paper_id = qp.id) as question_count,
      (SELECT COUNT(*) FROM assessment_results ar WHERE ar.question_paper_id = qp.id) as attempt_count
    FROM question_papers qp
    ORDER BY qp.created_at DESC
  `);
  return stmt.all() as QuestionPaperRecord[];
}

export function getQuestionPaperById(id: number): QuestionPaperRecord | undefined {
  const stmt = db.prepare(`
    SELECT qp.*,
      (SELECT COUNT(*) FROM questions q WHERE q.question_paper_id = qp.id) as question_count,
      (SELECT COUNT(*) FROM assessment_results ar WHERE ar.question_paper_id = qp.id) as attempt_count
    FROM question_papers qp
    WHERE qp.id = ?
  `);
  return stmt.get(id) as QuestionPaperRecord | undefined;
}

export function getQuestionPaperByPublicToken(token: string): QuestionPaperRecord | undefined {
  const stmt = db.prepare(`
    SELECT qp.*,
      (SELECT COUNT(*) FROM questions q WHERE q.question_paper_id = qp.id) as question_count,
      (SELECT COUNT(*) FROM assessment_results ar WHERE ar.question_paper_id = qp.id) as attempt_count
    FROM question_papers qp
    WHERE qp.public_token = ?
  `);
  return stmt.get(token.trim()) as QuestionPaperRecord | undefined;
}

export function createQuestionPaper(data: {
  title: string;
  description?: string;
  category?: string;
  duration_minutes?: number;
  passing_marks?: number;
  status?: 'Draft' | 'Published' | 'Unpublished' | 'Archived';
}): QuestionPaperRecord {
  const now = new Date().toISOString();
  // Generate random unpredictable token
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const slug = (data.title || 'qp')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'exam';
  const public_token = `${slug}-${randomSuffix}`;

  const stmt = db.prepare(`
    INSERT INTO question_papers (title, description, category, duration_minutes, passing_marks, max_marks, status, public_token, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
  `);

  const res = stmt.run(
    data.title.trim(),
    data.description || '',
    data.category || 'SAP ABAP',
    data.duration_minutes || 30,
    data.passing_marks || 5,
    data.status || 'Draft',
    public_token,
    now,
    now
  );

  return getQuestionPaperById(res.lastInsertRowid as number)!;
}

export function updateQuestionPaper(id: number, data: Partial<QuestionPaperRecord>): boolean {
  const existing = getQuestionPaperById(id);
  if (!existing) return false;

  const now = new Date().toISOString();

  // Recalculate max_marks
  const questions = getQuestionsByPaperId(id);
  const max_marks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

  const stmt = db.prepare(`
    UPDATE question_papers
    SET title = ?, description = ?, category = ?, duration_minutes = ?, passing_marks = ?, max_marks = ?, status = ?, updated_at = ?
    WHERE id = ?
  `);

  const res = stmt.run(
    data.title !== undefined ? data.title.trim() : existing.title,
    data.description !== undefined ? data.description : existing.description,
    data.category !== undefined ? data.category : existing.category,
    data.duration_minutes !== undefined ? data.duration_minutes : existing.duration_minutes,
    data.passing_marks !== undefined ? data.passing_marks : existing.passing_marks,
    max_marks,
    data.status !== undefined ? data.status : existing.status,
    now,
    id
  );

  return res.changes > 0;
}

export function deleteQuestionPaper(id: number): boolean {
  const stmt = db.prepare(`DELETE FROM question_papers WHERE id = ?`);
  const res = stmt.run(id);
  return res.changes > 0;
}

export function getQuestionsByPaperId(paperId: number): QuestionRecord[] {
  const stmt = db.prepare(`SELECT * FROM questions WHERE question_paper_id = ? ORDER BY question_order ASC, id ASC`);
  return stmt.all(paperId) as QuestionRecord[];
}

export function saveQuestionForPaper(question: Omit<QuestionRecord, 'id' | 'created_at'> & { id?: number }): QuestionRecord {
  const now = new Date().toISOString();

  let maxOrder = 1;
  const existingQuestions = getQuestionsByPaperId(question.question_paper_id);
  if (existingQuestions.length > 0) {
    maxOrder = Math.max(...existingQuestions.map((q) => q.question_order)) + 1;
  }

  if (question.id) {
    const stmt = db.prepare(`
      UPDATE questions
      SET question_text = ?, question_type = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_answer = ?, marks = ?, explanation = ?, question_order = ?
      WHERE id = ? AND question_paper_id = ?
    `);
    stmt.run(
      question.question_text.trim(),
      question.question_type || 'Single Choice',
      question.option_a.trim(),
      question.option_b.trim(),
      question.option_c.trim(),
      question.option_d.trim(),
      question.correct_answer.toUpperCase().trim(),
      question.marks || 1,
      question.explanation || '',
      question.question_order || maxOrder,
      question.id,
      question.question_paper_id
    );

    // Update max_marks
    updateQuestionPaper(question.question_paper_id, {});
    const fetchStmt = db.prepare(`SELECT * FROM questions WHERE id = ?`);
    return fetchStmt.get(question.id) as QuestionRecord;
  } else {
    const stmt = db.prepare(`
      INSERT INTO questions (question_paper_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, marks, explanation, question_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
      question.question_paper_id,
      question.question_text.trim(),
      question.question_type || 'Single Choice',
      question.option_a.trim(),
      question.option_b.trim(),
      question.option_c.trim(),
      question.option_d.trim(),
      question.correct_answer.toUpperCase().trim(),
      question.marks || 1,
      question.explanation || '',
      question.question_order || maxOrder,
      now
    );

    updateQuestionPaper(question.question_paper_id, {});
    const fetchStmt = db.prepare(`SELECT * FROM questions WHERE id = ?`);
    return fetchStmt.get(res.lastInsertRowid) as QuestionRecord;
  }
}

export function deleteQuestion(questionId: number, paperId: number): boolean {
  const stmt = db.prepare(`DELETE FROM questions WHERE id = ? AND question_paper_id = ?`);
  const res = stmt.run(questionId, paperId);
  if (res.changes > 0) {
    updateQuestionPaper(paperId, {});
    return true;
  }
  return false;
}

export function reorderQuestions(paperId: number, questionIdsInOrder: number[]): boolean {
  const stmt = db.prepare(`UPDATE questions SET question_order = ? WHERE id = ? AND question_paper_id = ?`);
  const updateMany = db.transaction((ids: number[]) => {
    ids.forEach((qId, index) => {
      stmt.run(index + 1, qId, paperId);
    });
  });
  updateMany(questionIdsInOrder);
  return true;
}

export default db;
