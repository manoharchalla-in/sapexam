export type QuestionType =
  | 'Single Choice'
  | 'Multiple Choice'
  | 'True / False'
  | 'Yes / No'
  | 'Fill in the Blank'
  | 'Short Answer'
  | 'Long Answer'
  | 'Code Completion'
  | 'Code Output'
  | 'Code Debugging'
  | 'Match the Following'
  | 'Ordering / Sequence'
  | 'Drag & Drop'
  | 'Dropdown Selection'
  | 'Numeric Answer'
  | 'Code Writing'
  | 'Case Study'
  | 'Image Based'
  | 'Table Based';

export interface BaseQuestionConfig {
  options?: { id: string; text: string }[];
  correctAnswers?: string[];
  acceptedAnswers?: string[];
  caseSensitive?: boolean;
  expectedOutput?: string;
  starterCode?: string;
  missingCode?: string;
  expectedCode?: string;
  correctedCode?: string;
  programmingLanguage?: string;
  keywords?: string[];
  evaluationMode?: 'Manual' | 'AI Assisted' | 'Keyword Based' | 'Exact';
  leftColumn?: string[];
  rightColumn?: string[];
  correctMappings?: Record<string, string>;
  sequenceItems?: string[];
  correctOrder?: string[];
  dragItems?: { id: string; text: string; category?: string }[];
  dropZones?: { id: string; name: string }[];
  dropdownOptions?: string[];
  numericAnswer?: number;
  minValue?: number;
  maxValue?: number;
  tolerance?: number;
  unit?: string;
  testCases?: { input: string; output: string }[];
  problemStatement?: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  caseStudyTitle?: string;
  scenario?: string;
  background?: string;
  requirements?: string[];
  subQuestions?: any[];
  imageUrl?: string;
  imageCaption?: string;
  tableHeaders?: string[];
  tableRows?: string[][];
  scoringMethod?: 'All-or-nothing' | 'Partial scoring';
}

export interface QuestionModel {
  id: number;
  question_paper_id?: number;
  question_text: string;
  question_type: QuestionType;
  configuration: string | BaseQuestionConfig;
  correct_answer: string;
  marks: number;
  negative_marks?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  topic?: string;
  explanation?: string;
  question_order?: number;
  created_at?: string;
  // Legacy compatibility fields
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
}

export interface QuestionBankItem extends QuestionModel {
  status: 'Active' | 'Archived';
  updated_at?: string;
}

export interface ExamTemplate {
  id: number;
  title: string;
  description: string;
  category: string;
  structure: {
    questionType: QuestionType;
    count: number;
    marksPerQuestion: number;
  }[];
  total_questions: number;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  created_at: string;
}

export interface QuestionPaperSettings {
  id: number;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  passing_marks: number;
  max_marks: number;
  status: 'Draft' | 'Published' | 'Unpublished' | 'Archived';
  public_token: string;
  start_date?: string;
  end_date?: string;
  timezone?: string;
  max_attempts?: number;
  one_attempt_per_email?: number;
  resume_enabled?: number;
  auto_submit?: number;
  show_result_immediately?: number;
  allow_answer_review?: number;
  randomize_questions?: number;
  randomize_options?: number;
  link_status?: 'Active' | 'Disabled';
  link_expiration?: string;
  created_at: string;
  updated_at: string;
  question_count?: number;
  attempt_count?: number;
}
