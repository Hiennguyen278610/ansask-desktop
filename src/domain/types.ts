export type Id = string;
export type AttemptMode = 'quiz' | 'flashcard';

export interface Subject {
  id: Id;
  name: string;
  icon: string;
  examCount: number;
  questionCount: number;
  createdAt: number;
}

export interface ExamSummary {
  id: Id;
  subjectId: Id;
  title: string;
  questionCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Option {
  id: Id;
  content: string;
  isCorrect: boolean;
}

export interface Question {
  id: Id;
  content: string;
  options: Option[];
}

export interface ExamInput {
  title: string;
  questions: {
    content: string;
    options: { content: string; isCorrect: boolean }[];
  }[];
}

export interface DraftOption {
  uid: string;
  content: string;
  isCorrect: boolean;
}

export interface DraftQuestion {
  uid: string;
  content: string;
  options: DraftOption[];
}

export interface DraftExam {
  title: string;
  questions: DraftQuestion[];
}

export interface AnswerRecord {
  selectedOptionId: Id | null;
  correct: boolean;
}

export interface AttemptDetail {
  id: Id;
  examId: Id;
  subjectId: Id;
  examTitle: string;
  mode: AttemptMode;
  total: number;
  correct: number;
  score: number;
  elapsedSec: number;
  submittedAt: number;
  questions: Question[];
  answers: Record<Id, AnswerRecord>;
}

export interface TimeCursor {
  createdAt: number;
  id: Id;
}

export interface TrashCursor {
  deletedAt: number;
  id: Id;
}

export interface TrashItem {
  id: Id;
  kind: 'subject' | 'exam';
  name: string;
  parentName?: string;
  deletedAt: number;
}

export interface StatsTotals {
  subjects: number;
  exams: number;
  questions: number;
  attempts: number;
}

export interface RecentAttemptItem {
  id: Id;
  examTitle: string;
  subjectName: string;
  mode: AttemptMode;
  score: number;
  submittedAt: number;
}

export interface AttemptCursor {
  submittedAt: number;
  id: Id;
}

export interface AttemptListItem {
  id: Id;
  examId: Id;
  subjectId: Id;
  examTitle: string;
  subjectName: string;
  mode: AttemptMode;
  score: number;
  total: number;
  correct: number;
  submittedAt: number;
}

export interface SessionDraft {
  id: Id;
  examId: Id;
  mode: AttemptMode;
  questions: Question[];
  answers: Record<Id, Id | null>;
  firstTry: Record<Id, boolean>;
  currentIndex: number;
  startedAt: number;
  elapsedSec: number;
  updatedAt: number;
}

export interface AvgBySubjectItem {
  subjectId: Id;
  subjectName: string;
  avgScore: number;
  attempts: number;
}
