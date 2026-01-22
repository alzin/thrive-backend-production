export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  passed: boolean;
  answers: { questionId: string; correct: boolean }[];
}

export interface IQuizService {
  createQuiz(lessonId: string, questions: QuizQuestion[]): Promise<string>;
  submitQuiz(quizId: string, userId: string, answers: { questionId: string; answer: number }[]): Promise<QuizResult>;
  getQuizUrl(quizId: string): string;
}