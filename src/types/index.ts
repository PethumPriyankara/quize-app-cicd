
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Quiz {
  id: string;
  createdBy: string;
  title: string;
  description: string;
  createdAt: Date;
  questions: Question[];
  isPublished: boolean;
  responses: number;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  submittedAt: Date;
  studentName: string;
  answers: StudentAnswer[];
  score: number;
  totalQuestions: number;
}

export interface StudentAnswer {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
}

export interface QuizStats {
  totalResponses: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  questionPerformance: {
    [questionId: string]: {
      correctCount: number;
      totalAnswers: number;
    };
  }
}
