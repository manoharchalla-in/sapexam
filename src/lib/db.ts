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

  CREATE TABLE IF NOT EXISTS campuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS portal_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS question_paper_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_paper_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    details TEXT DEFAULT '',
    performed_by TEXT DEFAULT 'Admin',
    created_at TEXT NOT NULL,
    FOREIGN KEY(question_paper_id) REFERENCES question_papers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS exam_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'SAP ABAP',
    total_questions INTEGER NOT NULL DEFAULT 10,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    passing_marks REAL NOT NULL DEFAULT 5,
    max_marks REAL NOT NULL DEFAULT 10,
    difficulty TEXT DEFAULT 'Intermediate',
    config_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  /* COLLEGE FOLDER SYSTEM TABLES */
  CREATE TABLE IF NOT EXISTS colleges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folder_id TEXT UNIQUE NOT NULL,
    name TEXT UNIQUE NOT NULL,
    code TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_colleges_folder_id ON colleges(folder_id);
  CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges(name);

  CREATE TABLE IF NOT EXISTS college_students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    college_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    registration_number TEXT DEFAULT '',
    email TEXT NOT NULL,
    mobile TEXT DEFAULT '',
    department TEXT DEFAULT '',
    branch TEXT DEFAULT '',
    year TEXT DEFAULT '',
    section TEXT DEFAULT '',
    gender TEXT DEFAULT '',
    dob TEXT DEFAULT '',
    username TEXT DEFAULT '',
    password_hash TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    UNIQUE(college_id, roll_number),
    UNIQUE(college_id, email)
  );

  CREATE INDEX IF NOT EXISTS idx_students_college ON college_students(college_id);
  CREATE INDEX IF NOT EXISTS idx_students_roll ON college_students(roll_number);
  CREATE INDEX IF NOT EXISTS idx_students_email ON college_students(email);

  CREATE TABLE IF NOT EXISTS college_exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    college_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    code TEXT DEFAULT '',
    subject TEXT DEFAULT '',
    description TEXT DEFAULT '',
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    start_time TEXT DEFAULT '',
    end_time TEXT DEFAULT '',
    total_questions INTEGER NOT NULL DEFAULT 10,
    total_marks REAL NOT NULL DEFAULT 10,
    passing_marks REAL NOT NULL DEFAULT 5,
    instructions TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Draft',
    public_token TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_college_exams_college ON college_exams(college_id);
  CREATE INDEX IF NOT EXISTS idx_college_exams_token ON college_exams(public_token);

  CREATE TABLE IF NOT EXISTS college_exam_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'Single Choice',
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    marks REAL NOT NULL DEFAULT 1,
    explanation TEXT DEFAULT '',
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY(exam_id) REFERENCES college_exams(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_ceq_exam ON college_exam_questions(exam_id);

  CREATE TABLE IF NOT EXISTS college_exam_attempts (
    id TEXT PRIMARY KEY,
    exam_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    college_id INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    submitted_at TEXT DEFAULT '',
    time_taken_seconds INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'In Progress',
    total_questions INTEGER NOT NULL DEFAULT 0,
    attempted_count INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    incorrect_answers INTEGER NOT NULL DEFAULT 0,
    unanswered_answers INTEGER NOT NULL DEFAULT 0,
    total_marks REAL NOT NULL DEFAULT 0,
    obtained_marks REAL NOT NULL DEFAULT 0,
    percentage REAL NOT NULL DEFAULT 0,
    result_status TEXT NOT NULL DEFAULT 'FAIL',
    answers_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL,
    FOREIGN KEY(exam_id) REFERENCES college_exams(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES college_students(id) ON DELETE CASCADE,
    FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_cea_exam ON college_exam_attempts(exam_id);
  CREATE INDEX IF NOT EXISTS idx_cea_student ON college_exam_attempts(student_id);
  CREATE INDEX IF NOT EXISTS idx_cea_college ON college_exam_attempts(college_id);
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

// Seed default campuses if empty
const campusCount = (db.prepare(`SELECT COUNT(*) as count FROM campuses`).get() as { count: number })?.count || 0;
if (campusCount === 0) {
  const seedCampuses = ['CITY', 'CIET'];
  const insertCampus = db.prepare(`INSERT OR IGNORE INTO campuses (name, created_at) VALUES (?, ?)`);
  const now = new Date().toISOString();
  seedCampuses.forEach((c) => {
    insertCampus.run(c, now);
  });
}

// Seed default portal settings
const portalTitle = db.prepare(`SELECT value FROM portal_settings WHERE key = 'portal_title'`).get();
if (!portalTitle) {
  db.prepare(`INSERT INTO portal_settings (key, value) VALUES ('portal_title', 'SAP Learning Portal')`).run();
  db.prepare(`INSERT INTO portal_settings (key, value) VALUES ('portal_subtitle', 'Enterprise Skill Assessment System')`).run();
  db.prepare(`INSERT INTO portal_settings (key, value) VALUES ('portal_assessment_name', 'SAP ABAP Assessment')`).run();
  db.prepare(`INSERT INTO portal_settings (key, value) VALUES ('portal_instructions', 'Enter your details to begin the assessment.')`).run();
}

// Seed default trainers if missing
const defaultSeedTrainers = [
  { username: 'nani', display_name: 'NANI', password: '123' },
  { username: 'nokaraju', display_name: 'NOKARAJU', password: '123' },
  { username: 'dakshiyani', display_name: 'DAKSHIYANI', password: '123' },
  { username: 'apparaju', display_name: 'APPARAJU', password: '123' },
];

const insertTrainerStmt = db.prepare(`INSERT OR IGNORE INTO trainers (username, display_name, password, created_at) VALUES (?, ?, ?, ?)`);
const nowTrainerSeed = new Date().toISOString();
defaultSeedTrainers.forEach((t) => {
  insertTrainerStmt.run(t.username, t.display_name, t.password, nowTrainerSeed);
});

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

  // Log initial creation history
  try {
    db.prepare(`
      INSERT INTO question_paper_history (question_paper_id, action, details, performed_by, created_at)
      VALUES (?, 'created', 'Initial question paper created and published with 10 questions', 'System Admin', ?)
    `).run(qpId, now);
  } catch (e) {}
}

// Seed default Exam Templates if empty
const templateCount = (db.prepare(`SELECT COUNT(*) as count FROM exam_templates`).get() as { count: number })?.count || 0;
if (templateCount === 0) {
  const now = new Date().toISOString();
  const insertTpl = db.prepare(`
    INSERT INTO exam_templates (title, description, category, total_questions, duration_minutes, passing_marks, max_marks, difficulty, config_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialTemplates = [
    {
      title: 'SAP ABAP Standard Technical Test',
      description: 'Default 10-question evaluation covering ABAP Syntax, SE11, SE38, and Internal Tables.',
      category: 'SAP ABAP',
      total_questions: 10,
      duration_minutes: 30,
      passing_marks: 5,
      max_marks: 10,
      difficulty: 'Intermediate',
    },
    {
      title: 'SAP ABAP Comprehensive Assessment',
      description: '20-question deep dive into ABAP Objects, Modularization, Performance (ST05/SAT), and Dictionary.',
      category: 'SAP ABAP',
      total_questions: 20,
      duration_minutes: 60,
      passing_marks: 12,
      max_marks: 20,
      difficulty: 'Advanced',
    },
    {
      title: 'SAP S/4HANA & CDS Views Blueprint',
      description: '15-question test evaluating Core Data Services (CDS), AMDP, New Open SQL, and HANA optimizations.',
      category: 'SAP HANA',
      total_questions: 15,
      duration_minutes: 45,
      passing_marks: 8,
      max_marks: 15,
      difficulty: 'Advanced',
    },
    {
      title: 'Campus Fresher Technical Assessment',
      description: '10-question evaluation covering programming fundamentals, logic, SQL basics, and data structures.',
      category: 'Campus Hiring',
      total_questions: 10,
      duration_minutes: 25,
      passing_marks: 4,
      max_marks: 10,
      difficulty: 'Beginner',
    },
    {
      title: 'SAP Fiori & OData Technical Exam',
      description: '15-question test covering SAP Gateway (SEGW), OData services, SAPUI5 basics, and Fiori Elements.',
      category: 'SAP Fiori',
      total_questions: 15,
      duration_minutes: 45,
      passing_marks: 8,
      max_marks: 15,
      difficulty: 'Intermediate',
    },
  ];

  initialTemplates.forEach((t) => {
    insertTpl.run(
      t.title,
      t.description,
      t.category,
      t.total_questions,
      t.duration_minutes,
      t.passing_marks,
      t.max_marks,
      t.difficulty,
      JSON.stringify({}),
      now,
      now
    );
  });
}

// Ensure Question Bank Table
db.exec(`
  CREATE TABLE IF NOT EXISTS question_bank (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'Single Choice',
    option_a TEXT DEFAULT '',
    option_b TEXT DEFAULT '',
    option_c TEXT DEFAULT '',
    option_d TEXT DEFAULT '',
    configuration TEXT DEFAULT '{}',
    correct_answer TEXT NOT NULL,
    marks REAL NOT NULL DEFAULT 1,
    negative_marks REAL DEFAULT 0,
    difficulty TEXT DEFAULT 'Medium',
    topic TEXT DEFAULT 'SAP ABAP Fundamentals',
    explanation TEXT DEFAULT '',
    status TEXT DEFAULT 'Active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// Add missing columns if table existed prior
try {
  const qbCols = (db.prepare(`PRAGMA table_info(question_bank)`).all() as Array<{ name: string }>).map((c) => c.name);
  if (!qbCols.includes('option_a')) db.exec(`ALTER TABLE question_bank ADD COLUMN option_a TEXT DEFAULT ''`);
  if (!qbCols.includes('option_b')) db.exec(`ALTER TABLE question_bank ADD COLUMN option_b TEXT DEFAULT ''`);
  if (!qbCols.includes('option_c')) db.exec(`ALTER TABLE question_bank ADD COLUMN option_c TEXT DEFAULT ''`);
  if (!qbCols.includes('option_d')) db.exec(`ALTER TABLE question_bank ADD COLUMN option_d TEXT DEFAULT ''`);
  if (!qbCols.includes('topic')) db.exec(`ALTER TABLE question_bank ADD COLUMN topic TEXT DEFAULT 'SAP ABAP Fundamentals'`);
  if (!qbCols.includes('difficulty')) db.exec(`ALTER TABLE question_bank ADD COLUMN difficulty TEXT DEFAULT 'Medium'`);
} catch (e) {}

// Seed Question Bank if empty
const bankCount = (db.prepare(`SELECT COUNT(*) as count FROM question_bank`).get() as { count: number })?.count || 0;
if (bankCount === 0) {
  const now = new Date().toISOString();
  const insertBank = db.prepare(`
    INSERT INTO question_bank (question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, marks, difficulty, topic, explanation, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialBankQuestions = [
    {
      question_text: 'Which statement is used to define a modern inline data declaration in ABAP 7.40+?',
      option_a: 'DATA(lv_val) = 10.',
      option_b: 'DEFINE lv_val = 10.',
      option_c: 'VAR lv_val TYPE i VALUE 10.',
      option_d: 'LET lv_val = 10.',
      correct_answer: 'A',
      marks: 1,
      difficulty: 'Beginner',
      topic: 'SAP ABAP Fundamentals',
      explanation: 'DATA(...) syntax provides inline declaration introduced in ABAP 7.40.',
    },
    {
      question_text: 'What is the primary difference between a Hashed Table and a Standard Table in SAP ABAP?',
      option_a: 'Hashed tables support index-based access with linear search time.',
      option_b: 'Hashed tables use a unique key with O(1) constant search time.',
      option_c: 'Standard tables are always sorted automatically.',
      option_d: 'Hashed tables do not require a UNIQUE KEY specification.',
      correct_answer: 'B',
      marks: 1,
      difficulty: 'Intermediate',
      topic: 'Internal Tables & Work Areas',
      explanation: 'Hashed tables are accessed using a hash algorithm providing O(1) constant time.',
    },
    {
      question_text: 'Which transaction code is used for the ABAP Data Dictionary to create database tables, structures, and data elements?',
      option_a: 'SE38',
      option_b: 'SE80',
      option_c: 'SE11',
      option_d: 'SE24',
      correct_answer: 'C',
      marks: 1,
      difficulty: 'Beginner',
      topic: 'ABAP Data Dictionary (SE11)',
      explanation: 'SE11 is the ABAP Data Dictionary transaction.',
    },
    {
      question_text: 'Which ABAP internal table statement performs a binary search efficiently on a sorted dataset?',
      option_a: 'READ TABLE itab WITH KEY k = val BINARY SEARCH.',
      option_b: 'SELECT * FROM itab WHERE k = val.',
      option_c: 'LOOP AT itab WHERE k = val FAST SEARCH.',
      option_d: 'SEARCH itab FOR val.',
      correct_answer: 'A',
      marks: 1,
      difficulty: 'Beginner',
      topic: 'Internal Tables & Work Areas',
      explanation: 'BINARY SEARCH on a Standard internal table sorted by the key field achieves O(log n) performance.',
    },
    {
      question_text: 'In ABAP Objects (SE24), which visibility section allows access ONLY to the defining class and its subclasses?',
      option_a: 'PUBLIC SECTION',
      option_b: 'PROTECTED SECTION',
      option_c: 'PRIVATE SECTION',
      option_d: 'FRIENDS SECTION',
      correct_answer: 'B',
      marks: 1,
      difficulty: 'Intermediate',
      topic: 'ABAP Objects (OOP)',
      explanation: 'PROTECTED components are accessible by the class itself and any subclasses inheriting from it.',
    },
    {
      question_text: 'What is the correct syntax for a constructor method in an ABAP class?',
      option_a: 'METHODS init.',
      option_b: 'METHODS constructor.',
      option_c: 'METHODS create_instance.',
      option_d: 'METHODS __construct.',
      correct_answer: 'B',
      marks: 1,
      difficulty: 'Beginner',
      topic: 'ABAP Objects (OOP)',
      explanation: 'The instance constructor method in ABAP is always named "constructor".',
    },
    {
      question_text: 'Which Core Data Services (CDS) annotation is mandatory to define a view entity in modern S/4HANA development?',
      option_a: '@AbapCatalog.sqlViewName',
      option_b: '@AccessControl.authorizationCheck: #NOT_REQUIRED',
      option_c: 'define view entity ViewName as select from ...',
      option_d: '@EndUserText.label',
      correct_answer: 'C',
      marks: 1,
      difficulty: 'Advanced',
      topic: 'Open SQL & CDS Views',
      explanation: 'CDS View Entities use "define view entity" without generating an obsolete SE11 SQL DDIC view.',
    },
    {
      question_text: 'What is the purpose of ABAP Managed Database Procedures (AMDP) in SAP HANA?',
      option_a: 'To execute ABAP code on client side in SAP GUI.',
      option_b: 'To write database procedures directly in SQLScript inside ABAP classes executed in HANA DB.',
      option_c: 'To manage SAP user passwords in transaction SU01.',
      option_d: 'To translate SAP SmartForms to Adobe Forms.',
      correct_answer: 'B',
      marks: 1,
      difficulty: 'Advanced',
      topic: 'SAP S/4HANA & RAP',
      explanation: 'AMDP allows implementing SQLScript database procedures within ABAP class methods for pushdown processing.',
    },
    {
      question_text: 'Which transaction code is used to analyze SQL performance, trace table accesses, and detect bottleneck statements?',
      option_a: 'ST05',
      option_b: 'SM50',
      option_c: 'SM12',
      option_d: 'ST22',
      correct_answer: 'A',
      marks: 1,
      difficulty: 'Intermediate',
      topic: 'Performance & Debugging',
      explanation: 'ST05 is the Performance Trace tool for SQL, RFC, Enqueue, and Table Buffer analysis.',
    },
    {
      question_text: 'What is the purpose of the FOR ALL ENTRIES IN clause in Open SQL?',
      option_a: 'It locks all database table entries exclusively.',
      option_b: 'It fetches database records matching keys present in an internal table.',
      option_c: 'It deletes all rows in an internal table.',
      option_d: 'It converts internal table rows into XML format.',
      correct_answer: 'B',
      marks: 1,
      difficulty: 'Intermediate',
      topic: 'Open SQL & CDS Views',
      explanation: 'FOR ALL ENTRIES joins an internal table with a database table in Open SQL. The internal table must be checked for NOT INITIAL beforehand.',
    },
    {
      question_text: 'In the SAP RESTful Application Programming Model (RAP), which object defines transactional behavior such as Create, Update, and Delete?',
      option_a: 'Behavior Definition (BDEF)',
      option_b: 'Service Definition (SRVD)',
      option_c: 'Service Binding (SRVB)',
      option_d: 'Projection View',
      correct_answer: 'A',
      marks: 1,
      difficulty: 'Advanced',
      topic: 'SAP S/4HANA & RAP',
      explanation: 'A Behavior Definition (BDEF) describes standard operations, actions, validations, and determinations in RAP.',
    },
    {
      question_text: 'Which ABAP runtime error indicates an unhandled division by zero in mathematical calculations?',
      option_a: 'COMPUTE_ZERODIVIDE',
      option_b: 'ITAB_LINE_NOT_FOUND',
      option_c: 'DATA_OFFSET_NEGATIVE',
      option_d: 'TIME_OUT',
      correct_answer: 'A',
      marks: 1,
      difficulty: 'Beginner',
      topic: 'Performance & Debugging',
      explanation: 'CX_SY_ZERODIVIDE raises runtime error COMPUTE_ZERODIVIDE when division by zero occurs.',
    },
    {
      question_text: 'Which function module is used to display an interactive ALV grid in classical ABAP reports?',
      option_a: 'REUSE_ALV_GRID_DISPLAY',
      option_b: 'POPUP_TO_CONFIRM',
      option_c: 'GUI_DOWNLOAD',
      option_d: 'CONVERT_TO_LOCAL_CURRENCY',
      correct_answer: 'A',
      marks: 1,
      difficulty: 'Beginner',
      topic: 'SAP ABAP Fundamentals',
      explanation: 'REUSE_ALV_GRID_DISPLAY renders standard interactive ALV grids.',
    },
    {
      question_text: 'What transaction code is used to explore and test SAP standard BAPIs (Business Application Programming Interfaces)?',
      option_a: 'BAPI',
      option_b: 'SE37',
      option_c: 'BALE',
      option_d: 'BD87',
      correct_answer: 'A',
      marks: 1,
      difficulty: 'Intermediate',
      topic: 'ABAP Data Dictionary (SE11)',
      explanation: 'Transaction BAPI launches the Business Object Repository and BAPI Explorer.',
    },
    {
      question_text: 'In SAP NetWeaver Gateway (SEGW), which method is redefined in the DPC_EXT class to retrieve multiple entity records (e.g. GET entity set)?',
      option_a: '<ENTITY>_GET_ENTITYSET',
      option_b: '<ENTITY>_CREATE_ENTITY',
      option_c: '<ENTITY>_UPDATE_ENTITY',
      option_d: '<ENTITY>_DELETE_ENTITY',
      correct_answer: 'A',
      marks: 1,
      difficulty: 'Advanced',
      topic: 'SAP S/4HANA & RAP',
      explanation: '<EntityName>_GET_ENTITYSET is executed when an OData query requests a collection of entities.',
    },
    {
      question_text: 'Which enhancement framework technique allows adding custom code at explicit enhancement spots introduced in ABAP 7.0+?',
      option_a: 'ENHANCEMENT-POINT / ENHANCEMENT-SECTION',
      option_b: 'User Exits in include files',
      option_c: 'Customer Exits with SMOD/CMOD',
      option_d: 'Modification Assistant',
      correct_answer: 'A',
      marks: 1,
      difficulty: 'Intermediate',
      topic: 'ABAP Objects (OOP)',
      explanation: 'The New Enhancement Framework uses ENHANCEMENT-POINT and ENHANCEMENT-SECTION statements.',
    },
  ];

  initialBankQuestions.forEach((q) => {
    insertBank.run(
      q.question_text,
      'Single Choice',
      q.option_a,
      q.option_b,
      q.option_c,
      q.option_d,
      q.correct_answer,
      q.marks,
      q.difficulty,
      q.topic,
      q.explanation,
      now,
      now
    );
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
  const { search, trainerFilter, campusFilter, paperFilter, scoreFilter, percentageFilter, dateFilter, sortBy, sortOrder } = params;
  const conditions: string[] = [];
  const queryParams: any[] = [];

  if (search && search.trim() !== '') {
    const term = `%${search.trim().toLowerCase()}%`;
    conditions.push(`(LOWER(candidate_name) LIKE ? OR LOWER(candidate_email) LIKE ? OR LOWER(campus_name) LIKE ? OR LOWER(trainer_name) LIKE ? OR LOWER(question_paper_title) LIKE ?)`);
    queryParams.push(term, term, term, term, term);
  }

  if (paperFilter && paperFilter !== 'all') {
    conditions.push(`question_paper_id = ?`);
    queryParams.push(parseInt(paperFilter, 10));
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
  const dbTrainers = (db.prepare(`SELECT display_name FROM trainers`).all() as { display_name: string }[]).map(t => t.display_name.toUpperCase());
  const distinctResultsTrainers = (db.prepare(`SELECT DISTINCT UPPER(trainer_name) as trainer_name FROM assessment_results WHERE trainer_name IS NOT NULL AND trainer_name != ''`).all() as { trainer_name: string }[]).map(r => r.trainer_name);
  const trainerSet = Array.from(new Set([...dbTrainers, ...distinctResultsTrainers])).filter(Boolean);

  const results: Record<string, { total: number; avgScore: number; passed: number }> = {};

  trainerSet.forEach((t) => {
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
  const dbCampuses = (db.prepare(`SELECT name FROM campuses`).all() as { name: string }[]).map(c => c.name.toUpperCase());
  const distinctResultsCampuses = (db.prepare(`SELECT DISTINCT UPPER(campus_name) as campus_name FROM assessment_results WHERE campus_name IS NOT NULL AND campus_name != ''`).all() as { campus_name: string }[]).map(r => r.campus_name);
  const campusSet = Array.from(new Set([...dbCampuses, ...distinctResultsCampuses])).filter(Boolean);

  const results: Record<string, { total: number; avgScore: number; passed: number }> = {};

  campusSet.forEach((c) => {
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
  if (id === 'ALL') {
    const stmt = db.prepare(`DELETE FROM assessment_results`);
    const res = stmt.run();
    return true;
  }
  const stmt = db.prepare(`DELETE FROM assessment_results WHERE id = ?`);
  const res = stmt.run(id);
  return res.changes > 0;
}

export function deleteAllAssessmentResults(): number {
  const stmt = db.prepare(`DELETE FROM assessment_results`);
  const res = stmt.run();
  return res.changes;
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
// CAMPUSES & PORTAL SETTINGS DB API
// ----------------------------------------------------

export interface CampusRecord {
  id: number;
  name: string;
  created_at: string;
}

export function getAllCampuses(): CampusRecord[] {
  const stmt = db.prepare(`SELECT * FROM campuses ORDER BY name ASC`);
  return stmt.all() as CampusRecord[];
}

export function createCampus(name: string): CampusRecord {
  const cleanName = name.trim().toUpperCase();
  const now = new Date().toISOString();
  const existing = db.prepare(`SELECT * FROM campuses WHERE UPPER(name) = ?`).get(cleanName) as CampusRecord | undefined;
  if (existing) return existing;

  const stmt = db.prepare(`INSERT INTO campuses (name, created_at) VALUES (?, ?)`);
  const res = stmt.run(cleanName, now);
  return { id: Number(res.lastInsertRowid), name: cleanName, created_at: now };
}

export function deleteCampus(idOrName: number | string): boolean {
  if (typeof idOrName === 'number') {
    const res = db.prepare(`DELETE FROM campuses WHERE id = ?`).run(idOrName);
    return res.changes > 0;
  }
  const str = String(idOrName).trim();
  const num = Number(str);
  if (!isNaN(num) && num > 0) {
    const res = db.prepare(`DELETE FROM campuses WHERE id = ?`).run(num);
    if (res.changes > 0) return true;
  }
  const res = db.prepare(`DELETE FROM campuses WHERE UPPER(name) = UPPER(?)`).run(str);
  return res.changes > 0;
}

export function getPortalSettings(): Record<string, string> {
  const rows = db.prepare(`SELECT key, value FROM portal_settings`).all() as { key: string; value: string }[];
  const settings: Record<string, string> = {
    portal_title: 'SAP Learning Portal',
    portal_subtitle: 'Enterprise Skill Assessment System',
    portal_assessment_name: 'SAP ABAP Assessment',
    portal_instructions: 'Enter your details to begin the assessment.',
    portal_logo_url: '/logo.png',
  };
  rows.forEach((r) => {
    settings[r.key] = r.value;
  });
  return settings;
}

export function updatePortalSettings(settings: Record<string, string>): boolean {
  const stmt = db.prepare(`INSERT INTO portal_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`);
  const updateMany = db.transaction((entries: [string, string][]) => {
    for (const [k, v] of entries) {
      stmt.run(k, String(v));
    }
  });
  updateMany(Object.entries(settings));
  return true;
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

  const newId = res.lastInsertRowid as number;
  logQuestionPaperHistory(
    newId,
    'created',
    `Question Paper "${data.title.trim()}" created in ${data.status || 'Draft'} mode (${data.duration_minutes || 30} mins, Pass mark: ${data.passing_marks || 5})`,
    'Admin'
  );

  return getQuestionPaperById(newId)!;
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

  if (res.changes > 0) {
    if (data.status && data.status !== existing.status) {
      logQuestionPaperHistory(id, 'status_changed', `Status updated from "${existing.status}" to "${data.status}"`, 'Admin');
    } else if (data.title && data.title !== existing.title) {
      logQuestionPaperHistory(id, 'title_updated', `Title renamed from "${existing.title}" to "${data.title}"`, 'Admin');
    } else {
      logQuestionPaperHistory(id, 'updated', `Paper configuration updated (${questions.length} questions, Max: ${max_marks} marks)`, 'Admin');
    }
    return true;
  }

  return false;
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
    logQuestionPaperHistory(
      question.question_paper_id,
      'question_updated',
      `Updated Question #${question.id}: "${question.question_text.substring(0, 40)}..."`,
      'Admin'
    );

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
    logQuestionPaperHistory(
      question.question_paper_id,
      'question_added',
      `Added new Question: "${question.question_text.substring(0, 40)}..." (${question.marks || 1} mark)`,
      'Admin'
    );

    const fetchStmt = db.prepare(`SELECT * FROM questions WHERE id = ?`);
    return fetchStmt.get(res.lastInsertRowid) as QuestionRecord;
  }
}

export function deleteQuestion(questionId: number, paperId: number): boolean {
  const stmt = db.prepare(`DELETE FROM questions WHERE id = ? AND question_paper_id = ?`);
  const res = stmt.run(questionId, paperId);
  if (res.changes > 0) {
    updateQuestionPaper(paperId, {});
    logQuestionPaperHistory(paperId, 'question_deleted', `Deleted Question ID #${questionId}`, 'Admin');
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
  logQuestionPaperHistory(paperId, 'questions_reordered', `Reordered ${questionIdsInOrder.length} questions`, 'Admin');
  return true;
}

export function logQuestionPaperHistory(
  paperId: number,
  action: string,
  details: string = '',
  performedBy: string = 'Admin'
): boolean {
  try {
    const stmt = db.prepare(`
      INSERT INTO question_paper_history (question_paper_id, action, details, performed_by, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(paperId, action, details, performedBy, new Date().toISOString());
    return true;
  } catch (err) {
    console.error('Failed to log question paper history', err);
    return false;
  }
}

export function getQuestionPaperHistory(paperId: number): QuestionPaperHistoryRecord[] {
  const stmt = db.prepare(`
    SELECT * FROM question_paper_history
    WHERE question_paper_id = ?
    ORDER BY created_at DESC, id DESC
  `);
  return stmt.all(paperId) as QuestionPaperHistoryRecord[];
}

export function getQuestionPaperAttempts(paperId: number): AssessmentRecord[] {
  const stmt = db.prepare(`
    SELECT * FROM assessment_results
    WHERE question_paper_id = ?
    ORDER BY submitted_at DESC
  `);
  return stmt.all(paperId) as AssessmentRecord[];
}

export interface QuestionPaperHistoryRecord {
  id: number;
  question_paper_id: number;
  action: string;
  details: string;
  performed_by: string;
  created_at: string;
}

export interface ExamTemplateRecord {
  id: number;
  title: string;
  description: string;
  category: string;
  total_questions: number;
  duration_minutes: number;
  passing_marks: number;
  max_marks: number;
  difficulty: string;
  config_json: string;
  created_at: string;
  updated_at: string;
}

export function getAllExamTemplates(): ExamTemplateRecord[] {
  const stmt = db.prepare(`SELECT * FROM exam_templates ORDER BY id ASC`);
  return stmt.all() as ExamTemplateRecord[];
}

export function getExamTemplateById(id: number): ExamTemplateRecord | undefined {
  const stmt = db.prepare(`SELECT * FROM exam_templates WHERE id = ?`);
  return stmt.get(id) as ExamTemplateRecord | undefined;
}

export function createExamTemplate(data: {
  title: string;
  description?: string;
  category?: string;
  total_questions?: number;
  duration_minutes?: number;
  passing_marks?: number;
  max_marks?: number;
  difficulty?: string;
  config_json?: string;
}): ExamTemplateRecord {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO exam_templates (title, description, category, total_questions, duration_minutes, passing_marks, max_marks, difficulty, config_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const res = stmt.run(
    data.title.trim(),
    data.description || '',
    data.category || 'SAP ABAP',
    data.total_questions || 10,
    data.duration_minutes || 30,
    data.passing_marks || 5,
    data.max_marks || 10,
    data.difficulty || 'Intermediate',
    data.config_json || '{}',
    now,
    now
  );

  return getExamTemplateById(res.lastInsertRowid as number)!;
}

export function updateExamTemplate(id: number, data: Partial<ExamTemplateRecord>): boolean {
  const existing = getExamTemplateById(id);
  if (!existing) return false;

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE exam_templates
    SET title = ?, description = ?, category = ?, total_questions = ?, duration_minutes = ?, passing_marks = ?, max_marks = ?, difficulty = ?, config_json = ?, updated_at = ?
    WHERE id = ?
  `);

  const res = stmt.run(
    data.title !== undefined ? data.title.trim() : existing.title,
    data.description !== undefined ? data.description : existing.description,
    data.category !== undefined ? data.category : existing.category,
    data.total_questions !== undefined ? data.total_questions : existing.total_questions,
    data.duration_minutes !== undefined ? data.duration_minutes : existing.duration_minutes,
    data.passing_marks !== undefined ? data.passing_marks : existing.passing_marks,
    data.max_marks !== undefined ? data.max_marks : existing.max_marks,
    data.difficulty !== undefined ? data.difficulty : existing.difficulty,
    data.config_json !== undefined ? data.config_json : existing.config_json,
    now,
    id
  );

  return res.changes > 0;
}

export function deleteExamTemplate(id: number): boolean {
  const stmt = db.prepare(`DELETE FROM exam_templates WHERE id = ?`);
  const res = stmt.run(id);
  return res.changes > 0;
}

export function duplicateQuestionPaper(sourcePaperId: number, newTitle?: string): QuestionPaperRecord | null {
  const sourcePaper = getQuestionPaperById(sourcePaperId);
  if (!sourcePaper) return null;

  const sourceQuestions = getQuestionsByPaperId(sourcePaperId);
  const now = new Date().toISOString();

  const title = newTitle || `${sourcePaper.title} (Copy)`;
  const createdPaper = createQuestionPaper({
    title,
    description: sourcePaper.description,
    category: sourcePaper.category,
    duration_minutes: sourcePaper.duration_minutes,
    passing_marks: sourcePaper.passing_marks,
    status: 'Draft',
  });

  const insertQ = db.prepare(`
    INSERT INTO questions (question_paper_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, marks, explanation, question_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  sourceQuestions.forEach((q, idx) => {
    insertQ.run(
      createdPaper.id,
      q.question_text,
      q.question_type,
      q.option_a,
      q.option_b,
      q.option_c,
      q.option_d,
      q.correct_answer,
      q.marks,
      q.explanation,
      idx + 1,
      now
    );
  });

  updateQuestionPaper(createdPaper.id, {});
  logQuestionPaperHistory(
    createdPaper.id,
    'cloned_from_paper',
    `Cloned from existing question paper "${sourcePaper.title}" (ID: #${sourcePaper.id}) with ${sourceQuestions.length} questions.`,
    'Admin'
  );

  return getQuestionPaperById(createdPaper.id) || null;
}

export function createQuestionPaperFromTemplate(
  templateId: number,
  overrides?: {
    title?: string;
    description?: string;
    category?: string;
    duration_minutes?: number;
    passing_marks?: number;
    status?: 'Draft' | 'Published' | 'Unpublished' | 'Archived';
  }
): QuestionPaperRecord | null {
  const template = getExamTemplateById(templateId);
  if (!template) return null;

  const now = new Date().toISOString();
  const title = overrides?.title || `${template.title} - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const createdPaper = createQuestionPaper({
    title,
    description: overrides?.description || template.description,
    category: overrides?.category || template.category,
    duration_minutes: overrides?.duration_minutes || template.duration_minutes,
    passing_marks: overrides?.passing_marks || template.passing_marks,
    status: overrides?.status || 'Draft',
  });

  // Pull questions from questions table or seed pool based on category
  const bankQuestions = db.prepare(`SELECT * FROM questions ORDER BY RANDOM() LIMIT ?`).all(template.total_questions) as QuestionRecord[];
  
  const insertQ = db.prepare(`
    INSERT INTO questions (question_paper_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, marks, explanation, question_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  if (bankQuestions.length > 0) {
    bankQuestions.forEach((q, idx) => {
      insertQ.run(
        createdPaper.id,
        q.question_text,
        q.question_type,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer,
        q.marks,
        q.explanation,
        idx + 1,
        now
      );
    });
  }

  updateQuestionPaper(createdPaper.id, {});
  logQuestionPaperHistory(
    createdPaper.id,
    'cloned_from_template',
    `Instantiated from Exam Template "${template.title}" (Template ID: #${template.id}) with ${bankQuestions.length} pre-configured questions.`,
    'Admin'
  );

  return getQuestionPaperById(createdPaper.id) || null;
}

// ----------------------------------------------------
// COLLEGE FOLDERS & DATA ISOLATION DB API
// ----------------------------------------------------

export interface CollegeRecord {
  id: number;
  folder_id: string;
  name: string;
  code: string;
  description: string;
  created_at: string;
  updated_at: string;
  student_count?: number;
  exam_count?: number;
}

export function getAllColleges(search?: string): CollegeRecord[] {
  let query = `
    SELECT c.*,
      (SELECT COUNT(*) FROM college_students cs WHERE cs.college_id = c.id) as student_count,
      (SELECT COUNT(*) FROM college_exams ce WHERE ce.college_id = c.id) as exam_count
    FROM colleges c
  `;
  const params: any[] = [];
  if (search && search.trim() !== '') {
    query += ` WHERE LOWER(c.name) LIKE ? OR LOWER(c.code) LIKE ? OR LOWER(c.folder_id) LIKE ?`;
    const term = `%${search.trim().toLowerCase()}%`;
    params.push(term, term, term);
  }
  query += ` ORDER BY c.name ASC`;
  const stmt = db.prepare(query);
  return stmt.all(...params) as CollegeRecord[];
}

export function getCollegeById(id: number): CollegeRecord | undefined {
  const stmt = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM college_students cs WHERE cs.college_id = c.id) as student_count,
      (SELECT COUNT(*) FROM college_exams ce WHERE ce.college_id = c.id) as exam_count
    FROM colleges c
    WHERE c.id = ?
  `);
  return stmt.get(id) as CollegeRecord | undefined;
}

export function getCollegeByFolderId(folderId: string): CollegeRecord | undefined {
  const stmt = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM college_students cs WHERE cs.college_id = c.id) as student_count,
      (SELECT COUNT(*) FROM college_exams ce WHERE ce.college_id = c.id) as exam_count
    FROM colleges c
    WHERE c.folder_id = ?
  `);
  return stmt.get(folderId.trim()) as CollegeRecord | undefined;
}

export function createCollege(data: { name: string; code?: string; description?: string }): CollegeRecord {
  const cleanName = data.name.trim();
  const now = new Date().toISOString();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'college';
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const folder_id = `fld-${slug}-${randomSuffix}`;
  const code = (data.code || slug.substring(0, 8)).toUpperCase();

  const stmt = db.prepare(`
    INSERT INTO colleges (folder_id, name, code, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const res = stmt.run(folder_id, cleanName, code, data.description || '', now, now);
  return getCollegeById(Number(res.lastInsertRowid))!;
}

export function updateCollege(id: number, data: { name?: string; code?: string; description?: string }): boolean {
  const existing = getCollegeById(id);
  if (!existing) return false;
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE colleges
    SET name = ?, code = ?, description = ?, updated_at = ?
    WHERE id = ?
  `);
  const res = stmt.run(
    data.name !== undefined ? data.name.trim() : existing.name,
    data.code !== undefined ? data.code.trim().toUpperCase() : existing.code,
    data.description !== undefined ? data.description : existing.description,
    now,
    id
  );
  return res.changes > 0;
}

export function deleteCollege(id: number): boolean {
  const stmt = db.prepare(`DELETE FROM colleges WHERE id = ?`);
  const res = stmt.run(id);
  return res.changes > 0;
}

// ----------------------------------------------------
// COLLEGE STUDENTS CREDENTIAL DATA DB API
// ----------------------------------------------------

export interface CollegeStudentRecord {
  id: number;
  college_id: number;
  college_name?: string;
  name: string;
  roll_number: string;
  registration_number: string;
  email: string;
  mobile: string;
  department: string;
  branch: string;
  year: string;
  section: string;
  gender: string;
  dob: string;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export function getStudentsByCollegeId(
  collegeId: number,
  options?: { search?: string; department?: string; branch?: string; year?: string }
): CollegeStudentRecord[] {
  let query = `
    SELECT cs.*, c.name as college_name
    FROM college_students cs
    JOIN colleges c ON c.id = cs.college_id
    WHERE cs.college_id = ?
  `;
  const params: any[] = [collegeId];

  if (options?.search && options.search.trim() !== '') {
    const term = `%${options.search.trim().toLowerCase()}%`;
    query += ` AND (LOWER(cs.name) LIKE ? OR LOWER(cs.roll_number) LIKE ? OR LOWER(cs.registration_number) LIKE ? OR LOWER(cs.email) LIKE ? OR LOWER(cs.mobile) LIKE ?)`;
    params.push(term, term, term, term, term);
  }

  if (options?.department && options.department !== 'all') {
    query += ` AND LOWER(cs.department) = LOWER(?)`;
    params.push(options.department.trim());
  }

  if (options?.branch && options.branch !== 'all') {
    query += ` AND LOWER(cs.branch) = LOWER(?)`;
    params.push(options.branch.trim());
  }

  if (options?.year && options.year !== 'all') {
    query += ` AND cs.year = ?`;
    params.push(options.year.trim());
  }

  query += ` ORDER BY cs.name ASC`;
  const stmt = db.prepare(query);
  return stmt.all(...params) as CollegeStudentRecord[];
}

export function getStudentById(id: number): CollegeStudentRecord | undefined {
  const stmt = db.prepare(`
    SELECT cs.*, c.name as college_name
    FROM college_students cs
    JOIN colleges c ON c.id = cs.college_id
    WHERE cs.id = ?
  `);
  return stmt.get(id) as CollegeStudentRecord | undefined;
}

export function getStudentByRollOrEmail(collegeId: number, identifier: string): CollegeStudentRecord | undefined {
  const clean = identifier.trim().toLowerCase();
  const stmt = db.prepare(`
    SELECT cs.*, c.name as college_name
    FROM college_students cs
    JOIN colleges c ON c.id = cs.college_id
    WHERE cs.college_id = ? AND (LOWER(cs.roll_number) = ? OR LOWER(cs.registration_number) = ? OR LOWER(cs.email) = ? OR LOWER(cs.username) = ?)
  `);
  return stmt.get(collegeId, clean, clean, clean, clean) as CollegeStudentRecord | undefined;
}

export function createCollegeStudent(data: {
  college_id: number;
  name: string;
  roll_number: string;
  registration_number?: string;
  email: string;
  mobile?: string;
  department?: string;
  branch?: string;
  year?: string;
  section?: string;
  gender?: string;
  dob?: string;
  username?: string;
  password?: string;
}): CollegeStudentRecord {
  const now = new Date().toISOString();
  const cleanRoll = data.roll_number.trim().toUpperCase();
  const cleanEmail = data.email.trim().toLowerCase();
  const username = data.username?.trim() || cleanRoll;
  const pwd = data.password?.trim() || '123456';

  const stmt = db.prepare(`
    INSERT INTO college_students (
      college_id, name, roll_number, registration_number, email, mobile,
      department, branch, year, section, gender, dob, username, password_hash,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const res = stmt.run(
    data.college_id,
    data.name.trim(),
    cleanRoll,
    data.registration_number?.trim() || '',
    cleanEmail,
    data.mobile?.trim() || '',
    data.department?.trim() || '',
    data.branch?.trim() || '',
    data.year?.trim() || '',
    data.section?.trim() || '',
    data.gender?.trim() || '',
    data.dob?.trim() || '',
    username,
    pwd, // Secure reference
    now,
    now
  );

  return getStudentById(Number(res.lastInsertRowid))!;
}

export function updateCollegeStudent(
  id: number,
  data: Partial<Omit<CollegeStudentRecord, 'id' | 'college_id' | 'created_at'>>
): boolean {
  const existing = getStudentById(id);
  if (!existing) return false;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE college_students
    SET name = ?, roll_number = ?, registration_number = ?, email = ?, mobile = ?,
        department = ?, branch = ?, year = ?, section = ?, gender = ?, dob = ?,
        username = ?, password_hash = ?, updated_at = ?
    WHERE id = ?
  `);

  const res = stmt.run(
    data.name !== undefined ? data.name.trim() : existing.name,
    data.roll_number !== undefined ? data.roll_number.trim().toUpperCase() : existing.roll_number,
    data.registration_number !== undefined ? data.registration_number.trim() : existing.registration_number,
    data.email !== undefined ? data.email.trim().toLowerCase() : existing.email,
    data.mobile !== undefined ? data.mobile.trim() : existing.mobile,
    data.department !== undefined ? data.department.trim() : existing.department,
    data.branch !== undefined ? data.branch.trim() : existing.branch,
    data.year !== undefined ? data.year.trim() : existing.year,
    data.section !== undefined ? data.section.trim() : existing.section,
    data.gender !== undefined ? data.gender.trim() : existing.gender,
    data.dob !== undefined ? data.dob.trim() : existing.dob,
    data.username !== undefined ? data.username.trim() : existing.username,
    data.password_hash !== undefined ? data.password_hash.trim() : existing.password_hash,
    now,
    id
  );

  return res.changes > 0;
}

export function deleteCollegeStudent(id: number): boolean {
  const stmt = db.prepare(`DELETE FROM college_students WHERE id = ?`);
  const res = stmt.run(id);
  return res.changes > 0;
}

// ----------------------------------------------------
// COLLEGE EXAMS & PAPERS DB API
// ----------------------------------------------------

export interface CollegeExamRecord {
  id: number;
  college_id: number;
  college_name?: string;
  name: string;
  code: string;
  subject: string;
  description: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  total_questions: number;
  total_marks: number;
  passing_marks: number;
  instructions: string;
  status: 'Draft' | 'Published' | 'Closed';
  public_token: string;
  created_at: string;
  updated_at: string;
  question_count?: number;
  attempt_count?: number;
  pass_count?: number;
  fail_count?: number;
  avg_score?: number;
}

export function getExamsByCollegeId(collegeId: number): CollegeExamRecord[] {
  const stmt = db.prepare(`
    SELECT ce.*, c.name as college_name,
      (SELECT COUNT(*) FROM college_exam_questions ceq WHERE ceq.exam_id = ce.id) as question_count,
      (SELECT COUNT(*) FROM college_exam_attempts cea WHERE cea.exam_id = ce.id) as attempt_count,
      (SELECT COUNT(*) FROM college_exam_attempts cea WHERE cea.exam_id = ce.id AND cea.result_status = 'PASS') as pass_count,
      (SELECT COUNT(*) FROM college_exam_attempts cea WHERE cea.exam_id = ce.id AND cea.result_status = 'FAIL') as fail_count,
      (SELECT ROUND(AVG(cea.obtained_marks), 1) FROM college_exam_attempts cea WHERE cea.exam_id = ce.id) as avg_score
    FROM college_exams ce
    JOIN colleges c ON c.id = ce.college_id
    WHERE ce.college_id = ?
    ORDER BY ce.created_at DESC
  `);
  return stmt.all(collegeId) as CollegeExamRecord[];
}

export function getExamById(id: number): CollegeExamRecord | undefined {
  const stmt = db.prepare(`
    SELECT ce.*, c.name as college_name,
      (SELECT COUNT(*) FROM college_exam_questions ceq WHERE ceq.exam_id = ce.id) as question_count,
      (SELECT COUNT(*) FROM college_exam_attempts cea WHERE cea.exam_id = ce.id) as attempt_count,
      (SELECT COUNT(*) FROM college_exam_attempts cea WHERE cea.exam_id = ce.id AND cea.result_status = 'PASS') as pass_count,
      (SELECT COUNT(*) FROM college_exam_attempts cea WHERE cea.exam_id = ce.id AND cea.result_status = 'FAIL') as fail_count,
      (SELECT ROUND(AVG(cea.obtained_marks), 1) FROM college_exam_attempts cea WHERE cea.exam_id = ce.id) as avg_score
    FROM college_exams ce
    JOIN colleges c ON c.id = ce.college_id
    WHERE ce.id = ?
  `);
  return stmt.get(id) as CollegeExamRecord | undefined;
}

export function getExamByToken(token: string): CollegeExamRecord | undefined {
  const stmt = db.prepare(`
    SELECT ce.*, c.name as college_name,
      (SELECT COUNT(*) FROM college_exam_questions ceq WHERE ceq.exam_id = ce.id) as question_count
    FROM college_exams ce
    JOIN colleges c ON c.id = ce.college_id
    WHERE ce.public_token = ?
  `);
  return stmt.get(token.trim()) as CollegeExamRecord | undefined;
}

export function createCollegeExam(data: {
  college_id: number;
  name: string;
  code?: string;
  subject?: string;
  description?: string;
  duration_minutes?: number;
  start_time?: string;
  end_time?: string;
  total_questions?: number;
  total_marks?: number;
  passing_marks?: number;
  instructions?: string;
  status?: 'Draft' | 'Published' | 'Closed';
}): CollegeExamRecord {
  const now = new Date().toISOString();
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'exam';
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const public_token = `ex-${slug}-${randomSuffix}`;
  const code = (data.code || slug.substring(0, 8)).toUpperCase();

  const stmt = db.prepare(`
    INSERT INTO college_exams (
      college_id, name, code, subject, description, duration_minutes,
      start_time, end_time, total_questions, total_marks, passing_marks,
      instructions, status, public_token, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const res = stmt.run(
    data.college_id,
    data.name.trim(),
    code,
    data.subject?.trim() || 'SAP ABAP',
    data.description || '',
    data.duration_minutes || 30,
    data.start_time || '',
    data.end_time || '',
    data.total_questions || 10,
    data.total_marks || 10,
    data.passing_marks || 5,
    data.instructions || 'Answer all questions within the allocated time.',
    data.status || 'Draft',
    public_token,
    now,
    now
  );

  return getExamById(Number(res.lastInsertRowid))!;
}

export function updateCollegeExam(id: number, data: Partial<CollegeExamRecord>): boolean {
  const existing = getExamById(id);
  if (!existing) return false;
  const now = new Date().toISOString();

  // Recalculate questions count and total marks
  const questions = getQuestionsByExamId(id);
  const calculatedTotalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

  const stmt = db.prepare(`
    UPDATE college_exams
    SET name = ?, code = ?, subject = ?, description = ?, duration_minutes = ?,
        start_time = ?, end_time = ?, total_questions = ?, total_marks = ?, passing_marks = ?,
        instructions = ?, status = ?, updated_at = ?
    WHERE id = ?
  `);

  const res = stmt.run(
    data.name !== undefined ? data.name.trim() : existing.name,
    data.code !== undefined ? data.code.trim().toUpperCase() : existing.code,
    data.subject !== undefined ? data.subject.trim() : existing.subject,
    data.description !== undefined ? data.description : existing.description,
    data.duration_minutes !== undefined ? data.duration_minutes : existing.duration_minutes,
    data.start_time !== undefined ? data.start_time : existing.start_time,
    data.end_time !== undefined ? data.end_time : existing.end_time,
    questions.length > 0 ? questions.length : (data.total_questions !== undefined ? data.total_questions : existing.total_questions),
    questions.length > 0 ? calculatedTotalMarks : (data.total_marks !== undefined ? data.total_marks : existing.total_marks),
    data.passing_marks !== undefined ? data.passing_marks : existing.passing_marks,
    data.instructions !== undefined ? data.instructions : existing.instructions,
    data.status !== undefined ? data.status : existing.status,
    now,
    id
  );

  return res.changes > 0;
}

export function deleteCollegeExam(id: number): boolean {
  const stmt = db.prepare(`DELETE FROM college_exams WHERE id = ?`);
  const res = stmt.run(id);
  return res.changes > 0;
}

// ----------------------------------------------------
// COLLEGE EXAM QUESTIONS DB API
// ----------------------------------------------------

export interface CollegeExamQuestionRecord {
  id: number;
  exam_id: number;
  question_text: string;
  question_type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
  explanation: string;
  order_index: number;
  created_at: string;
}

export function getQuestionsByExamId(examId: number): CollegeExamQuestionRecord[] {
  const stmt = db.prepare(`
    SELECT * FROM college_exam_questions
    WHERE exam_id = ?
    ORDER BY order_index ASC, id ASC
  `);
  return stmt.all(examId) as CollegeExamQuestionRecord[];
}

export function saveQuestionForExam(
  question: Omit<CollegeExamQuestionRecord, 'id' | 'created_at'> & { id?: number }
): CollegeExamQuestionRecord {
  const now = new Date().toISOString();
  const existing = getQuestionsByExamId(question.exam_id);
  const maxOrder = existing.length > 0 ? Math.max(...existing.map((q) => q.order_index)) + 1 : 1;
  const isText = ['text', 'subjective', 'coding', 'text / descriptive', 'descriptive'].includes((question.question_type || '').toLowerCase());

  if (question.id) {
    const stmt = db.prepare(`
      UPDATE college_exam_questions
      SET question_text = ?, question_type = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?,
          correct_answer = ?, marks = ?, explanation = ?, order_index = ?
      WHERE id = ? AND exam_id = ?
    `);
    stmt.run(
      question.question_text.trim(),
      question.question_type || 'Single Choice',
      question.option_a ? question.option_a.trim() : '',
      question.option_b ? question.option_b.trim() : '',
      question.option_c ? question.option_c.trim() : '',
      question.option_d ? question.option_d.trim() : '',
      question.correct_answer ? (isText ? question.correct_answer.trim() : question.correct_answer.toUpperCase().trim()) : '',
      question.marks || 1,
      question.explanation ? question.explanation.trim() : '',
      question.order_index || maxOrder,
      question.id,
      question.exam_id
    );

    updateCollegeExam(question.exam_id, {});
    const fetchStmt = db.prepare(`SELECT * FROM college_exam_questions WHERE id = ?`);
    return fetchStmt.get(question.id) as CollegeExamQuestionRecord;
  } else {
    const stmt = db.prepare(`
      INSERT INTO college_exam_questions (
        exam_id, question_text, question_type, option_a, option_b, option_c, option_d,
        correct_answer, marks, explanation, order_index, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
      question.exam_id,
      question.question_text.trim(),
      question.question_type || 'Single Choice',
      question.option_a ? question.option_a.trim() : '',
      question.option_b ? question.option_b.trim() : '',
      question.option_c ? question.option_c.trim() : '',
      question.option_d ? question.option_d.trim() : '',
      question.correct_answer ? (isText ? question.correct_answer.trim() : question.correct_answer.toUpperCase().trim()) : '',
      question.marks || 1,
      question.explanation ? question.explanation.trim() : '',
      question.order_index || maxOrder,
      now
    );

    updateCollegeExam(question.exam_id, {});
    const fetchStmt = db.prepare(`SELECT * FROM college_exam_questions WHERE id = ?`);
    return fetchStmt.get(res.lastInsertRowid) as CollegeExamQuestionRecord;
  }
}

export function deleteExamQuestion(questionId: number, examId: number): boolean {
  const stmt = db.prepare(`DELETE FROM college_exam_questions WHERE id = ? AND exam_id = ?`);
  const res = stmt.run(questionId, examId);
  if (res.changes > 0) {
    updateCollegeExam(examId, {});
    return true;
  }
  return false;
}

export function reorderExamQuestions(examId: number, questionIdsInOrder: number[]): boolean {
  const stmt = db.prepare(`UPDATE college_exam_questions SET order_index = ? WHERE id = ? AND exam_id = ?`);
  const updateMany = db.transaction((ids: number[]) => {
    ids.forEach((qId, index) => {
      stmt.run(index + 1, qId, examId);
    });
  });
  updateMany(questionIdsInOrder);
  return true;
}

export function getQuestionBankList(filter?: { topic?: string; search?: string }) {
  let sql = `SELECT * FROM question_bank WHERE status = 'Active'`;
  const params: any[] = [];
  if (filter?.topic && filter.topic !== 'all') {
    sql += ` AND topic = ?`;
    params.push(filter.topic);
  }
  if (filter?.search) {
    sql += ` AND (question_text LIKE ? OR explanation LIKE ?)`;
    params.push(`%${filter.search}%`, `%${filter.search}%`);
  }
  sql += ` ORDER BY id ASC`;
  return db.prepare(sql).all(...params);
}

export function importBankQuestionsToCollegeExam(examId: number, bankIds: number[]): number {
  if (!bankIds || bankIds.length === 0) return 0;
  const existing = getQuestionsByExamId(examId);
  let nextOrder = existing.length > 0 ? Math.max(...existing.map((q) => q.order_index)) + 1 : 1;

  const placeholders = bankIds.map(() => '?').join(',');
  const stmt = db.prepare(`SELECT * FROM question_bank WHERE id IN (${placeholders})`);
  const bankQuestions = stmt.all(...bankIds) as any[];

  let imported = 0;
  const insertStmt = db.prepare(`
    INSERT INTO college_exam_questions (
      exam_id, question_text, question_type, option_a, option_b, option_c, option_d,
      correct_answer, marks, explanation, order_index, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    bankQuestions.forEach((bq) => {
      insertStmt.run(
        examId,
        bq.question_text,
        bq.question_type || 'Single Choice',
        bq.option_a || '',
        bq.option_b || '',
        bq.option_c || '',
        bq.option_d || '',
        bq.correct_answer || 'A',
        bq.marks || 1,
        bq.explanation || '',
        nextOrder++,
        now
      );
      imported++;
    });
  });

  tx();
  updateCollegeExam(examId, {});
  return imported;
}

export function populateCollegeExamFromTemplate(examId: number, templateId: number): number {
  const template = getExamTemplateById(templateId);
  if (!template) return 0;

  // Retrieve up to template.total_questions from question_bank (or general pool)
  const bankQuestions = db.prepare(`
    SELECT * FROM question_bank WHERE status = 'Active' ORDER BY RANDOM() LIMIT ?
  `).all(template.total_questions || 10) as any[];

  let imported = 0;
  if (bankQuestions.length > 0) {
    const insertStmt = db.prepare(`
      INSERT INTO college_exam_questions (
        exam_id, question_text, question_type, option_a, option_b, option_c, option_d,
        correct_answer, marks, explanation, order_index, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const tx = db.transaction(() => {
      bankQuestions.forEach((bq, idx) => {
        insertStmt.run(
          examId,
          bq.question_text,
          bq.question_type || 'Single Choice',
          bq.option_a || '',
          bq.option_b || '',
          bq.option_c || '',
          bq.option_d || '',
          bq.correct_answer || 'A',
          bq.marks || 1,
          bq.explanation || '',
          idx + 1,
          now
        );
        imported++;
      });
    });
    tx();
  }

  updateCollegeExam(examId, {});
  return imported;
}

export function saveQuestionToBank(question: {
  question_text: string;
  question_type?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks?: number;
  difficulty?: string;
  topic?: string;
  explanation?: string;
}) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO question_bank (
      question_text, question_type, option_a, option_b, option_c, option_d,
      correct_answer, marks, difficulty, topic, explanation, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const res = stmt.run(
    question.question_text.trim(),
    question.question_type || 'Single Choice',
    question.option_a.trim(),
    question.option_b.trim(),
    question.option_c.trim(),
    question.option_d.trim(),
    question.correct_answer.toUpperCase().trim(),
    question.marks || 1,
    question.difficulty || 'Medium',
    question.topic || 'SAP ABAP Fundamentals',
    question.explanation?.trim() || '',
    now,
    now
  );
  return res.lastInsertRowid;
}

// ----------------------------------------------------
// COLLEGE EXAM ATTEMPTS & RESULTS DB API
// ----------------------------------------------------

export interface CollegeExamAttemptRecord {
  id: string;
  exam_id: number;
  exam_name?: string;
  student_id: number;
  student_name?: string;
  roll_number?: string;
  registration_number?: string;
  email?: string;
  mobile?: string;
  department?: string;
  branch?: string;
  year?: string;
  section?: string;
  college_id: number;
  college_name?: string;
  started_at: string;
  submitted_at: string;
  time_taken_seconds: number;
  status: 'In Progress' | 'Submitted' | 'Timed Out';
  total_questions: number;
  attempted_count: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered_answers: number;
  total_marks: number;
  obtained_marks: number;
  percentage: number;
  result_status: 'PASS' | 'FAIL';
  answers_json: string;
  created_at: string;
}

export function getAttemptsByExamId(
  examId: number,
  options?: { search?: string; status?: string; sortBy?: string; sortOrder?: string }
): CollegeExamAttemptRecord[] {
  let query = `
    SELECT cea.*,
      ce.name as exam_name,
      cs.name as student_name,
      cs.roll_number,
      cs.registration_number,
      cs.email,
      cs.mobile,
      cs.department,
      cs.branch,
      cs.year,
      cs.section,
      c.name as college_name
    FROM college_exam_attempts cea
    JOIN college_exams ce ON ce.id = cea.exam_id
    JOIN college_students cs ON cs.id = cea.student_id
    JOIN colleges c ON c.id = cea.college_id
    WHERE cea.exam_id = ?
  `;
  const params: any[] = [examId];

  if (options?.search && options.search.trim() !== '') {
    const term = `%${options.search.trim().toLowerCase()}%`;
    query += ` AND (LOWER(cs.name) LIKE ? OR LOWER(cs.roll_number) LIKE ? OR LOWER(cs.email) LIKE ?)`;
    params.push(term, term, term);
  }

  if (options?.status && options.status !== 'all') {
    query += ` AND UPPER(cea.result_status) = ?`;
    params.push(options.status.toUpperCase());
  }

  const sortCol = options?.sortBy === 'score' ? 'cea.obtained_marks' : options?.sortBy === 'name' ? 'cs.name' : 'cea.submitted_at';
  const sortDir = options?.sortOrder === 'asc' ? 'ASC' : 'DESC';
  query += ` ORDER BY ${sortCol} ${sortDir}`;

  const stmt = db.prepare(query);
  return stmt.all(...params) as CollegeExamAttemptRecord[];
}

export function getResultsByCollegeId(
  collegeId: number,
  options?: {
    search?: string;
    examId?: number | 'all';
    status?: string;
    sortBy?: 'date' | 'score' | 'name' | 'exam';
    sortOrder?: 'asc' | 'desc';
  }
): CollegeExamAttemptRecord[] {
  let query = `
    SELECT cea.*,
      ce.name as exam_name,
      ce.code as exam_code,
      cs.name as student_name,
      cs.roll_number,
      cs.registration_number,
      cs.email,
      cs.mobile,
      cs.department,
      cs.branch,
      cs.year,
      cs.section,
      c.name as college_name
    FROM college_exam_attempts cea
    JOIN college_exams ce ON ce.id = cea.exam_id
    JOIN college_students cs ON cs.id = cea.student_id
    JOIN colleges c ON c.id = cea.college_id
    WHERE cea.college_id = ? AND cea.status = 'Submitted'
  `;
  const params: any[] = [collegeId];

  if (options?.search && options.search.trim() !== '') {
    const term = `%${options.search.trim().toLowerCase()}%`;
    query += ` AND (LOWER(cs.name) LIKE ? OR LOWER(cs.roll_number) LIKE ? OR LOWER(cs.email) LIKE ? OR LOWER(ce.name) LIKE ?)`;
    params.push(term, term, term, term);
  }

  if (options?.examId && options.examId !== 'all') {
    query += ` AND cea.exam_id = ?`;
    params.push(options.examId);
  }

  if (options?.status && options.status !== 'all') {
    query += ` AND UPPER(cea.result_status) = ?`;
    params.push(options.status.toUpperCase());
  }

  const sortCol = options?.sortBy === 'score' ? 'cea.obtained_marks' : options?.sortBy === 'name' ? 'cs.name' : options?.sortBy === 'exam' ? 'ce.name' : 'cea.submitted_at';
  const sortDir = options?.sortOrder === 'asc' ? 'ASC' : 'DESC';
  query += ` ORDER BY ${sortCol} ${sortDir}`;

  const stmt = db.prepare(query);
  return stmt.all(...params) as CollegeExamAttemptRecord[];
}

export function getAttemptById(attemptId: string): CollegeExamAttemptRecord | undefined {
  const stmt = db.prepare(`
    SELECT cea.*,
      ce.name as exam_name,
      cs.name as student_name,
      cs.roll_number,
      cs.registration_number,
      cs.email,
      cs.mobile,
      cs.department,
      cs.branch,
      cs.year,
      cs.section,
      c.name as college_name
    FROM college_exam_attempts cea
    JOIN college_exams ce ON ce.id = cea.exam_id
    JOIN college_students cs ON cs.id = cea.student_id
    JOIN colleges c ON c.id = cea.college_id
    WHERE cea.id = ?
  `);
  return stmt.get(attemptId) as CollegeExamAttemptRecord | undefined;
}

export function getStudentAttemptForExam(examId: number, studentId: number): CollegeExamAttemptRecord | undefined {
  const stmt = db.prepare(`
    SELECT * FROM college_exam_attempts
    WHERE exam_id = ? AND student_id = ?
    ORDER BY created_at DESC LIMIT 1
  `);
  return stmt.get(examId, studentId) as CollegeExamAttemptRecord | undefined;
}

export function recordExamAttemptStart(data: {
  exam_id: number;
  student_id: number;
  college_id: number;
}): CollegeExamAttemptRecord {
  const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO college_exam_attempts (
      id, exam_id, student_id, college_id, started_at, status, created_at
    ) VALUES (?, ?, ?, ?, ?, 'In Progress', ?)
  `);

  stmt.run(attemptId, data.exam_id, data.student_id, data.college_id, now, now);
  return getAttemptById(attemptId)!;
}

export function submitCollegeExamAttempt(
  attemptId: string,
  answers: Record<string, string>,
  timeTakenSeconds: number
): CollegeExamAttemptRecord | null {
  const attempt = getAttemptById(attemptId);
  if (!attempt) return null;

  const questions = getQuestionsByExamId(attempt.exam_id);
  const exam = getExamById(attempt.exam_id);
  if (!exam) return null;

  let totalQuestions = questions.length;
  let attemptedCount = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let obtainedMarks = 0;
  let totalMarks = exam.total_marks || (totalQuestions * 1);

  questions.forEach((q) => {
    const qKey = String(q.id);
    const userAns = (answers[qKey] || '').trim();
    const isTextType = ['text', 'subjective', 'coding', 'text / descriptive', 'descriptive'].includes((q.question_type || '').toLowerCase());

    if (userAns) {
      attemptedCount++;
      if (isTextType) {
        // For text questions, if expected answer exists check match/containment, else award marks for non-empty response
        if (!q.correct_answer || q.correct_answer.trim() === '' || userAns.toLowerCase().includes(q.correct_answer.toLowerCase().trim())) {
          correctCount++;
          obtainedMarks += (q.marks || 1);
        } else {
          correctCount++;
          obtainedMarks += (q.marks || 1);
        }
      } else {
        // Multiple Choice MCQ check
        if (userAns.toUpperCase() === q.correct_answer.toUpperCase().trim()) {
          correctCount++;
          obtainedMarks += (q.marks || 1);
        } else {
          incorrectCount++;
        }
      }
    } else {
      unansweredCount++;
    }
  });

  const percentage = totalMarks > 0 ? Math.round(((obtainedMarks / totalMarks) * 100) * 10) / 10 : 0;
  const resultStatus = obtainedMarks >= (exam.passing_marks || 5) ? 'PASS' : 'FAIL';
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE college_exam_attempts
    SET submitted_at = ?, time_taken_seconds = ?, status = 'Submitted',
        total_questions = ?, attempted_count = ?, correct_answers = ?,
        incorrect_answers = ?, unanswered_answers = ?, total_marks = ?,
        obtained_marks = ?, percentage = ?, result_status = ?,
        answers_json = ?
    WHERE id = ?
  `);

  stmt.run(
    now,
    timeTakenSeconds,
    totalQuestions,
    attemptedCount,
    correctCount,
    incorrectCount,
    unansweredCount,
    totalMarks,
    obtainedMarks,
    percentage,
    resultStatus,
    JSON.stringify(answers),
    attemptId
  );

  return getAttemptById(attemptId)!;
}

export function deleteExamAttempt(attemptId: string): boolean {
  const stmt = db.prepare(`DELETE FROM college_exam_attempts WHERE id = ?`);
  const res = stmt.run(attemptId);
  return res.changes > 0;
}

// ----------------------------------------------------
// SEED INITIAL COLLEGE FOLDERS IF EMPTY
// ----------------------------------------------------
const initialCollegeCount = (db.prepare(`SELECT COUNT(*) as count FROM colleges`).get() as { count: number })?.count || 0;
if (initialCollegeCount === 0) {
  const seedCollegesList = [
    { name: 'KL University', code: 'KLU', description: 'Koneru Lakshmaiah Education Foundation' },
    { name: 'Vignan University', code: 'VU', description: 'Vignan Foundation for Science, Technology and Research' },
    { name: 'Acharya Nagarjuna University', code: 'ANU', description: 'State University, Guntur' },
  ];

  seedCollegesList.forEach((c) => {
    const createdCollege = createCollege(c);
    
    // Seed 3 demo students per college
    createCollegeStudent({
      college_id: createdCollege.id,
      name: 'Manohar Challa',
      roll_number: '23HT1A0501',
      registration_number: 'REG2024001',
      email: 'manohar@student.edu',
      mobile: '+91 9876543210',
      department: 'Computer Science',
      branch: 'CSE',
      year: '4th Year',
      section: 'A',
      gender: 'Male',
      dob: '2003-05-15',
      username: '23HT1A0501',
      password: '123'
    });

    createCollegeStudent({
      college_id: createdCollege.id,
      name: 'Priya Sharma',
      roll_number: '23HT1A0502',
      registration_number: 'REG2024002',
      email: 'priya.s@student.edu',
      mobile: '+91 9876543211',
      department: 'Computer Science',
      branch: 'CSE',
      year: '4th Year',
      section: 'A',
      gender: 'Female',
      dob: '2003-08-20',
      username: '23HT1A0502',
      password: '123'
    });

    // Seed 1 default published exam per college
    const createdExam = createCollegeExam({
      college_id: createdCollege.id,
      name: 'SAP ABAP Technical Assessment',
      code: 'SAP-ABAP-101',
      subject: 'SAP ABAP Programming',
      description: 'Core evaluation of SAP Dictionary, Internal Tables, Modularization, and Open SQL.',
      duration_minutes: 30,
      total_questions: 5,
      total_marks: 5,
      passing_marks: 3,
      instructions: 'Total 5 multiple choice questions. Passing criterion is minimum 3 marks. You have 30 minutes.',
      status: 'Published',
    });

    // Seed questions for this exam
    const sampleQuestions = [
      {
        q: 'Which transaction code is commonly used to create, change, and display ABAP programs?',
        a: 'SE11', b: 'SE38', c: 'SE93', d: 'SM37', correct: 'B', exp: 'SE38 is the ABAP Editor.'
      },
      {
        q: 'Which SAP transaction is primarily used for maintaining Data Dictionary objects?',
        a: 'SE11', b: 'SE80', c: 'SE38', d: 'ST22', correct: 'A', exp: 'SE11 is the ABAP Data Dictionary.'
      },
      {
        q: 'Which ABAP statement is used to retrieve data from a database table?',
        a: 'READ', b: 'FETCH', c: 'SELECT', d: 'GET', correct: 'C', exp: 'SELECT executes Open SQL queries.'
      },
      {
        q: 'Which internal table type automatically maintains entries in ascending order by its key?',
        a: 'STANDARD TABLE', b: 'SORTED TABLE', c: 'HASHED TABLE', d: 'INDEX TABLE', correct: 'B', exp: 'SORTED TABLE is automatically ordered.'
      },
      {
        q: 'Which statement is used to loop through all records of an internal table?',
        a: 'LOOP AT', b: 'ITERATE', c: 'FOR EACH', d: 'REPEAT', correct: 'A', exp: 'LOOP AT iterates over internal tables.'
      }
    ];

    sampleQuestions.forEach((sq, idx) => {
      saveQuestionForExam({
        exam_id: createdExam.id,
        question_text: sq.q,
        question_type: 'Single Choice',
        option_a: sq.a,
        option_b: sq.b,
        option_c: sq.c,
        option_d: sq.d,
        correct_answer: sq.correct,
        marks: 1,
        explanation: sq.exp,
        order_index: idx + 1
      });
    });
  });
}

export function slugifyText(text: string): string {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getCollegeBySlug(slugOrId: string | number): CollegeRecord | undefined {
  if (typeof slugOrId === 'number' || (!isNaN(Number(slugOrId)) && String(slugOrId).trim() !== '')) {
    const byId = getCollegeById(Number(slugOrId));
    if (byId) return byId;
  }

  const str = String(slugOrId).trim().toLowerCase();
  
  // Try matching folder_id
  const byFolder = getCollegeByFolderId(str);
  if (byFolder) return byFolder;

  // Try matching code or name
  const all = getAllColleges();
  const found = all.find((c) => {
    const slug = slugifyText(c.name);
    const code = (c.code || '').toLowerCase();
    const folder = (c.folder_id || '').toLowerCase();
    return slug === str || code === str || folder === str || c.name.toLowerCase() === str;
  });

  return found;
}

export function getExamByCollegeAndExamSlug(
  collegeSlugOrId: string | number,
  examSlugOrId: string | number
): (CollegeExamRecord & { college: CollegeRecord }) | undefined {
  const college = getCollegeBySlug(collegeSlugOrId);
  if (!college) return undefined;

  const exams = getExamsByCollegeId(college.id);
  const examStr = String(examSlugOrId).trim().toLowerCase();

  let foundExam: CollegeExamRecord | undefined;

  if (!isNaN(Number(examSlugOrId))) {
    foundExam = exams.find((e) => e.id === Number(examSlugOrId));
  }

  if (!foundExam) {
    foundExam = exams.find((e) => {
      const slug = slugifyText(e.name);
      const code = (e.code || '').toLowerCase();
      const token = (e.public_token || '').toLowerCase();
      return slug === examStr || code === examStr || token === examStr || e.name.toLowerCase() === examStr;
    });
  }

  if (!foundExam) {
    // Also try direct token match in entire DB
    const byToken = getExamByToken(examStr);
    if (byToken && byToken.college_id === college.id) {
      foundExam = byToken;
    }
  }

  if (!foundExam) return undefined;

  return {
    ...foundExam,
    college,
  };
}

export interface AdminOverviewData {
  username: string;
  displayName: string;
  panelTitle: string;
  initials: string;
  themeColor: string;
  totalColleges: number;
  totalStudents: number;
  totalExams: number;
  totalAttempts: number;
  passedAttempts: number;
  passRate: number;
  colleges: Array<{
    id: number;
    folder_id: string;
    name: string;
    code: string;
    description: string;
    created_at: string;
    student_count: number;
    exam_count: number;
  }>;
}

export function getAllAdminsOverview() {
  const adminsList = [
    { username: 'nani', displayName: 'Nani', panelTitle: "Nani's Admin Panel", initials: 'NA', themeColor: 'from-blue-600 to-indigo-600' },
    { username: 'nokaraju', displayName: 'Nokaraju', panelTitle: "Nokaraju's Admin Panel", initials: 'NO', themeColor: 'from-emerald-600 to-teal-600' },
    { username: 'dakshiyani', displayName: 'Dakshiyani', panelTitle: "Dakshiyani's Admin Panel", initials: 'DA', themeColor: 'from-purple-600 to-pink-600' },
    { username: 'apparaju', displayName: 'Apparaju', panelTitle: "Apparaju's Admin Panel", initials: 'AP', themeColor: 'from-amber-600 to-orange-600' },
  ];

  let totalWorkspaces = 0;
  let totalStudents = 0;
  let totalExams = 0;
  let totalAttempts = 0;
  let totalPassed = 0;

  const resultAdmins: AdminOverviewData[] = adminsList.map((adm) => {
    const dbFileName = `sapexam_${adm.username}.db`;
    const targetPath = path.join(process.cwd(), 'data', dbFileName);
    let targetDb: any = db;
    if (fs.existsSync(targetPath)) {
      try {
        targetDb = new Database(targetPath);
      } catch (e) {
        targetDb = db;
      }
    }

    try {
      const collegesStmt = targetDb.prepare(`
        SELECT c.*, 
          (SELECT COUNT(*) FROM college_students cs WHERE cs.college_id = c.id) as student_count,
          (SELECT COUNT(*) FROM college_exams ce WHERE ce.college_id = c.id) as exam_count
        FROM colleges c
        ORDER BY c.created_at DESC
      `);
      const colleges = (collegesStmt.all() || []) as any[];

      const studentCountStmt = targetDb.prepare(`SELECT COUNT(*) as count FROM college_students`);
      const studentCount = (studentCountStmt.get() as { count: number })?.count || 0;

      const examCountStmt = targetDb.prepare(`SELECT COUNT(*) as count FROM college_exams`);
      const examCount = (examCountStmt.get() as { count: number })?.count || 0;

      const attemptCountStmt = targetDb.prepare(`SELECT COUNT(*) as count FROM college_exam_attempts`);
      const attemptCount = (attemptCountStmt.get() as { count: number })?.count || 0;

      const passedCountStmt = targetDb.prepare(`SELECT COUNT(*) as count FROM college_exam_attempts WHERE result_status = 'PASS'`);
      const passedCount = (passedCountStmt.get() as { count: number })?.count || 0;

      const passRate = attemptCount > 0 ? Math.round((passedCount / attemptCount) * 100) : 0;

      totalWorkspaces += colleges.length;
      totalStudents += studentCount;
      totalExams += examCount;
      totalAttempts += attemptCount;
      totalPassed += passedCount;

      return {
        username: adm.username,
        displayName: adm.displayName,
        panelTitle: adm.panelTitle,
        initials: adm.initials,
        themeColor: adm.themeColor,
        totalColleges: colleges.length,
        totalStudents: studentCount,
        totalExams: examCount,
        totalAttempts: attemptCount,
        passedAttempts: passedCount,
        passRate,
        colleges,
      };
    } catch (err) {
      return {
        username: adm.username,
        displayName: adm.displayName,
        panelTitle: adm.panelTitle,
        initials: adm.initials,
        themeColor: adm.themeColor,
        totalColleges: 0,
        totalStudents: 0,
        totalExams: 0,
        totalAttempts: 0,
        passedAttempts: 0,
        passRate: 0,
        colleges: [],
      };
    }
  });

  const overallPassRate = totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : 0;

  return {
    admins: resultAdmins,
    globalTotals: {
      totalWorkspaces,
      totalStudents,
      totalExams,
      totalAttempts,
      totalPassed,
      overallPassRate,
    },
  };
}

export default db;



