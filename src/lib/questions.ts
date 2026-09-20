export interface QuestionOption {
  key: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface QuestionClient {
  id: number;
  question: string;
  options: QuestionOption[];
}

export interface QuestionFull extends QuestionClient {
  correctAnswer: string;
}

export const SAP_ABAP_QUESTIONS: QuestionFull[] = [
  {
    id: 1,
    question: "Which transaction code is commonly used to create, change, and display ABAP programs?",
    options: [
      { key: "A", text: "SE11" },
      { key: "B", text: "SE38" },
      { key: "C", text: "SE93" },
      { key: "D", text: "SM37" },
    ],
    correctAnswer: "B",
  },
  {
    id: 2,
    question: "Which SAP transaction is primarily used for maintaining Data Dictionary objects such as tables, data elements, domains, and structures?",
    options: [
      { key: "A", text: "SE11" },
      { key: "B", text: "SE80" },
      { key: "C", text: "SE38" },
      { key: "D", text: "ST22" },
    ],
    correctAnswer: "A",
  },
  {
    id: 3,
    question: "Which ABAP statement is used to retrieve data from a database table?",
    options: [
      { key: "A", text: "READ" },
      { key: "B", text: "FETCH" },
      { key: "C", text: "SELECT" },
      { key: "D", text: "GET" },
    ],
    correctAnswer: "C",
  },
  {
    id: 4,
    question: "Which internal table type automatically maintains entries in ascending order according to its key?",
    options: [
      { key: "A", text: "STANDARD TABLE" },
      { key: "B", text: "SORTED TABLE" },
      { key: "C", text: "HASHED TABLE" },
      { key: "D", text: "INDEX TABLE" },
    ],
    correctAnswer: "B",
  },
  {
    id: 5,
    question: "Which statement is used to read a specific record from an internal table?",
    options: [
      { key: "A", text: "SELECT TABLE" },
      { key: "B", text: "READ TABLE" },
      { key: "C", text: "GET TABLE" },
      { key: "D", text: "FETCH TABLE" },
    ],
    correctAnswer: "B",
  },
  {
    id: 6,
    question: "What is the main purpose of a Data Element in SAP ABAP?",
    options: [
      { key: "A", text: "To store database records" },
      { key: "B", text: "To define the semantic meaning and technical attributes of a field" },
      { key: "C", text: "To execute ABAP programs" },
      { key: "D", text: "To create transactions" },
    ],
    correctAnswer: "B",
  },
  {
    id: 7,
    question: "Which ABAP statement is commonly used to loop through all records of an internal table?",
    options: [
      { key: "A", text: "LOOP AT" },
      { key: "B", text: "ITERATE" },
      { key: "C", text: "FOR EACH" },
      { key: "D", text: "REPEAT" },
    ],
    correctAnswer: "A",
  },
  {
    id: 8,
    question: "Which transaction is commonly used to create and maintain transaction codes?",
    options: [
      { key: "A", text: "SE11" },
      { key: "B", text: "SE38" },
      { key: "C", text: "SE93" },
      { key: "D", text: "SE80" },
    ],
    correctAnswer: "C",
  },
  {
    id: 9,
    question: "Which ABAP technology is primarily used to define semantically rich data models that can be consumed by applications and analytical scenarios?",
    options: [
      { key: "A", text: "CDS Views" },
      { key: "B", text: "Smart Forms" },
      { key: "C", text: "BDC" },
      { key: "D", text: "TMG" },
    ],
    correctAnswer: "A",
  },
  {
    id: 10,
    question: "Which statement can be used to modify an existing record in an internal table?",
    options: [
      { key: "A", text: "MODIFY" },
      { key: "B", text: "CHANGE TABLE" },
      { key: "C", text: "UPDATE TABLE ONLY" },
      { key: "D", text: "ALTER" },
    ],
    correctAnswer: "A",
  },
];

export function getQuestionsForCandidate(): QuestionClient[] {
  return SAP_ABAP_QUESTIONS.map(({ id, question, options }) => ({
    id,
    question,
    options,
  }));
}
