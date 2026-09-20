import { QuestionModel, BaseQuestionConfig } from '@/types/assessment';

export interface ScoringResult {
  score: number;
  maxScore: number;
  isCorrect: boolean;
  isPartial: boolean;
  isPendingReview: boolean;
}

export function scoreQuestionResponse(
  question: QuestionModel,
  userAnswer: any
): ScoringResult {
  const marks = Number(question.marks) || 1;
  const negativeMarks = Number(question.negative_marks) || 0;
  
  let config: BaseQuestionConfig = {};
  if (typeof question.configuration === 'string') {
    try {
      config = JSON.parse(question.configuration || '{}');
    } catch {
      config = {};
    }
  } else if (question.configuration) {
    config = question.configuration;
  }

  const qType = question.question_type;

  // Single Choice / Radio
  if (qType === 'Single Choice' || qType === 'Dropdown Selection' || qType === 'Image Based') {
    const chosen = String(userAnswer || '').trim().toUpperCase();
    const target = String(question.correct_answer || config.options?.[0]?.id || '').trim().toUpperCase();
    
    if (chosen && chosen === target) {
      return { score: marks, maxScore: marks, isCorrect: true, isPartial: false, isPendingReview: false };
    }
    return { score: chosen ? -negativeMarks : 0, maxScore: marks, isCorrect: false, isPartial: false, isPendingReview: false };
  }

  // True / False & Yes / No
  if (qType === 'True / False' || qType === 'Yes / No') {
    const chosen = String(userAnswer || '').trim().toLowerCase();
    const target = String(question.correct_answer || '').trim().toLowerCase();

    if (chosen && chosen === target) {
      return { score: marks, maxScore: marks, isCorrect: true, isPartial: false, isPendingReview: false };
    }
    return { score: chosen ? -negativeMarks : 0, maxScore: marks, isCorrect: false, isPartial: false, isPendingReview: false };
  }

  // Multiple Choice
  if (qType === 'Multiple Choice') {
    const chosenArray: string[] = Array.isArray(userAnswer)
      ? userAnswer.map((a) => String(a).trim().toUpperCase())
      : typeof userAnswer === 'string'
      ? userAnswer.split(',').map((a) => a.trim().toUpperCase()).filter(Boolean)
      : [];

    const correctArray: string[] = config.correctAnswers && config.correctAnswers.length > 0
      ? config.correctAnswers.map((a) => String(a).trim().toUpperCase())
      : String(question.correct_answer || '').split(',').map((a) => a.trim().toUpperCase()).filter(Boolean);

    if (chosenArray.length === 0) {
      return { score: 0, maxScore: marks, isCorrect: false, isPartial: false, isPendingReview: false };
    }

    const isExact =
      chosenArray.length === correctArray.length &&
      chosenArray.every((val) => correctArray.includes(val));

    if (isExact) {
      return { score: marks, maxScore: marks, isCorrect: true, isPartial: false, isPendingReview: false };
    }

    if (config.scoringMethod === 'Partial scoring') {
      const correctHits = chosenArray.filter((val) => correctArray.includes(val)).length;
      const wrongHits = chosenArray.filter((val) => !correctArray.includes(val)).length;
      
      if (wrongHits === 0 && correctHits > 0) {
        const partialScore = Math.round((correctHits / correctArray.length) * marks * 100) / 100;
        return { score: partialScore, maxScore: marks, isCorrect: false, isPartial: true, isPendingReview: false };
      }
    }

    return { score: -negativeMarks, maxScore: marks, isCorrect: false, isPartial: false, isPendingReview: false };
  }

  // Fill in the Blank
  if (qType === 'Fill in the Blank' || qType === 'Code Completion' || qType === 'Code Output') {
    const rawVal = String(userAnswer || '').trim();
    if (!rawVal) {
      return { score: 0, maxScore: marks, isCorrect: false, isPartial: false, isPendingReview: false };
    }

    const accepted = config.acceptedAnswers && config.acceptedAnswers.length > 0
      ? config.acceptedAnswers
      : [question.correct_answer || config.expectedOutput || ''];

    const isMatch = accepted.some((acc) => {
      if (config.caseSensitive) {
        return rawVal === acc.trim();
      }
      return rawVal.toLowerCase() === acc.trim().toLowerCase();
    });

    if (isMatch) {
      return { score: marks, maxScore: marks, isCorrect: true, isPartial: false, isPendingReview: false };
    }
    return { score: -negativeMarks, maxScore: marks, isCorrect: false, isPartial: false, isPendingReview: false };
  }

  // Numeric Answer
  if (qType === 'Numeric Answer') {
    const val = parseFloat(String(userAnswer || ''));
    if (isNaN(val)) {
      return { score: 0, maxScore: marks, isCorrect: false, isPartial: false, isPendingReview: false };
    }

    const targetNum = typeof config.numericAnswer === 'number'
      ? config.numericAnswer
      : parseFloat(question.correct_answer || '0');

    const tol = Number(config.tolerance) || 0;
    const minVal = typeof config.minValue === 'number' ? config.minValue : targetNum - tol;
    const maxVal = typeof config.maxValue === 'number' ? config.maxValue : targetNum + tol;

    if (val >= minVal && val <= maxVal) {
      return { score: marks, maxScore: marks, isCorrect: true, isPartial: false, isPendingReview: false };
    }
    return { score: -negativeMarks, maxScore: marks, isCorrect: false, isPartial: false, isPendingReview: false };
  }

  // Match the Following
  if (qType === 'Match the Following') {
    const userMap: Record<string, string> = typeof userAnswer === 'object' ? userAnswer : {};
    const targetMap = config.correctMappings || {};
    const totalPairs = Object.keys(targetMap).length;

    if (totalPairs === 0) {
      return { score: marks, maxScore: marks, isCorrect: true, isPartial: false, isPendingReview: false };
    }

    let correctCount = 0;
    Object.entries(targetMap).forEach(([left, right]) => {
      if (String(userMap[left] || '').trim().toLowerCase() === String(right).trim().toLowerCase()) {
        correctCount++;
      }
    });

    if (correctCount === totalPairs) {
      return { score: marks, maxScore: marks, isCorrect: true, isPartial: false, isPendingReview: false };
    }
    if (correctCount > 0) {
      const partialScore = Math.round((correctCount / totalPairs) * marks * 100) / 100;
      return { score: partialScore, maxScore: marks, isCorrect: false, isPartial: true, isPendingReview: false };
    }
    return { score: -negativeMarks, maxScore: marks, isCorrect: false, isPartial: false, isPendingReview: false };
  }

  // Ordering / Sequence
  if (qType === 'Ordering / Sequence') {
    const userOrder: string[] = Array.isArray(userAnswer) ? userAnswer : [];
    const targetOrder = config.correctOrder || [];

    if (userOrder.length === 0) {
      return { score: 0, maxScore: marks, isCorrect: false, isPartial: false, isPendingReview: false };
    }

    const isMatch =
      userOrder.length === targetOrder.length &&
      userOrder.every((val, idx) => String(val).trim() === String(targetOrder[idx]).trim());

    if (isMatch) {
      return { score: marks, maxScore: marks, isCorrect: true, isPartial: false, isPendingReview: false };
    }
    return { score: -negativeMarks, maxScore: marks, isCorrect: false, isPartial: false, isPendingReview: false };
  }

  // Drag & Drop
  if (qType === 'Drag & Drop') {
    const userMap: Record<string, string> = typeof userAnswer === 'object' ? userAnswer : {};
    const targetMap = config.correctMappings || {};
    const totalItems = Object.keys(targetMap).length;

    if (totalItems === 0) {
      return { score: marks, maxScore: marks, isCorrect: true, isPartial: false, isPendingReview: false };
    }

    let correctCount = 0;
    Object.entries(targetMap).forEach(([itemId, targetZone]) => {
      if (String(userMap[itemId] || '').trim() === String(targetZone).trim()) {
        correctCount++;
      }
    });

    if (correctCount === totalItems) {
      return { score: marks, maxScore: marks, isCorrect: true, isPartial: false, isPendingReview: false };
    }
    if (correctCount > 0) {
      const partialScore = Math.round((correctCount / totalItems) * marks * 100) / 100;
      return { score: partialScore, maxScore: marks, isCorrect: false, isPartial: true, isPendingReview: false };
    }
    return { score: -negativeMarks, maxScore: marks, isCorrect: false, isPartial: false, isPendingReview: false };
  }

  // Subjective types: Short Answer, Long Answer, Code Debugging, Code Writing, Case Study, Table Based
  if (
    qType === 'Short Answer' ||
    qType === 'Long Answer' ||
    qType === 'Code Debugging' ||
    qType === 'Code Writing' ||
    qType === 'Case Study' ||
    qType === 'Table Based'
  ) {
    const textVal = String(userAnswer || '').trim();
    if (!textVal) {
      return { score: 0, maxScore: marks, isCorrect: false, isPartial: false, isPendingReview: false };
    }

    // Keyword auto-grading if mode is set
    if (config.evaluationMode === 'Keyword Based' && config.keywords && config.keywords.length > 0) {
      const hits = config.keywords.filter((kw) => textVal.toLowerCase().includes(kw.toLowerCase())).length;
      if (hits === config.keywords.length) {
        return { score: marks, maxScore: marks, isCorrect: true, isPartial: false, isPendingReview: false };
      }
      if (hits > 0) {
        const partialScore = Math.round((hits / config.keywords.length) * marks * 100) / 100;
        return { score: partialScore, maxScore: marks, isCorrect: false, isPartial: true, isPendingReview: false };
      }
    }

    if (config.evaluationMode === 'Exact' && question.correct_answer) {
      if (textVal.toLowerCase() === question.correct_answer.trim().toLowerCase()) {
        return { score: marks, maxScore: marks, isCorrect: true, isPartial: false, isPendingReview: false };
      }
    }

    // Otherwise flag for review
    return { score: 0, maxScore: marks, isCorrect: false, isPartial: false, isPendingReview: true };
  }

  return { score: 0, maxScore: marks, isCorrect: false, isPartial: false, isPendingReview: false };
}
