import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { parseJson, parseText, toJson, toText, type ParseError } from '@/domain/exam-format';
import type { DraftExam, DraftQuestion } from '@/domain/types';

function createEmptyQuestion(): DraftQuestion {
  return {
    uid: nanoid(),
    content: '',
    options: Array.from({ length: 4 }, () => ({
      uid: nanoid(),
      content: '',
      isCorrect: false,
    })),
  };
}

function serialize(questions: DraftQuestion[], format: 'text' | 'json'): string {
  return format === 'text' ? toText(questions) : toJson(questions);
}

interface EditorState {
  draft: DraftExam;
  format: 'text' | 'json';
  editorText: string;
  lastEdited: 'form' | 'editor';
  parseErrors: ParseError[];
  isDirty: boolean;

  init: (draft: DraftExam) => void;
  markClean: () => void;
  setTitle: (t: string) => void;
  addQuestion: (afterIndex?: number) => void;
  removeQuestion: (uid: string) => void;
  setQuestionContent: (uid: string, v: string) => void;
  addOption: (qUid: string) => void;
  removeOption: (qUid: string, oUid: string) => void;
  setOptionContent: (qUid: string, oUid: string, v: string) => void;
  setCorrect: (qUid: string, oUid: string) => void;
  setFormat: (f: 'text' | 'json') => boolean;
  setEditorText: (raw: string) => void;
  syncFromForm: () => void;
  applyEditorParse: () => void;
}

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    draft: { title: '', questions: [] },
    format: 'text',
    editorText: '',
    lastEdited: 'form',
    parseErrors: [],
    isDirty: false,

    init: (draft) =>
      set((s) => {
        s.draft = draft;
        s.format = 'text';
        s.editorText = toText(draft.questions);
        s.lastEdited = 'form';
        s.parseErrors = [];
        s.isDirty = false;
      }),

    markClean: () =>
      set((s) => {
        s.isDirty = false;
      }),

    setTitle: (t) =>
      set((s) => {
        s.draft.title = t;
        s.isDirty = true;
      }),

    addQuestion: (afterIndex) =>
      set((s) => {
        const q = createEmptyQuestion();
        if (afterIndex === undefined || afterIndex < 0 || afterIndex >= s.draft.questions.length) {
          s.draft.questions.push(q);
        } else {
          s.draft.questions.splice(afterIndex + 1, 0, q);
        }
        s.lastEdited = 'form';
        s.isDirty = true;
      }),

    removeQuestion: (uid) =>
      set((s) => {
        s.draft.questions = s.draft.questions.filter((q) => q.uid !== uid);
        s.lastEdited = 'form';
        s.isDirty = true;
      }),

    setQuestionContent: (uid, v) =>
      set((s) => {
        const q = s.draft.questions.find((x) => x.uid === uid);
        if (q) {
          q.content = v;
          s.lastEdited = 'form';
          s.isDirty = true;
        }
      }),

    addOption: (qUid) =>
      set((s) => {
        const q = s.draft.questions.find((x) => x.uid === qUid);
        if (q && q.options.length < 10) {
          q.options.push({ uid: nanoid(), content: '', isCorrect: false });
          s.lastEdited = 'form';
          s.isDirty = true;
        }
      }),

    removeOption: (qUid, oUid) =>
      set((s) => {
        const q = s.draft.questions.find((x) => x.uid === qUid);
        if (q && q.options.length > 1) {
          q.options = q.options.filter((o) => o.uid !== oUid);
          s.lastEdited = 'form';
          s.isDirty = true;
        }
      }),

    setOptionContent: (qUid, oUid, v) =>
      set((s) => {
        const q = s.draft.questions.find((x) => x.uid === qUid);
        const o = q?.options.find((x) => x.uid === oUid);
        if (o) {
          o.content = v;
          s.lastEdited = 'form';
          s.isDirty = true;
        }
      }),

    setCorrect: (qUid, oUid) =>
      set((s) => {
        const q = s.draft.questions.find((x) => x.uid === qUid);
        if (q) {
          for (const o of q.options) {
            o.isCorrect = o.uid === oUid;
          }
          s.lastEdited = 'form';
          s.isDirty = true;
        }
      }),

    setFormat: (f) => {
      if (get().format === f) return false;
      if (get().lastEdited === 'editor') get().applyEditorParse();
      if (get().parseErrors.length > 0) return true;
      set((s) => {
        s.format = f;
        s.editorText = serialize(s.draft.questions, f);
        s.parseErrors = [];
        s.lastEdited = 'form';
      });
      return false;
    },

    setEditorText: (raw) =>
      set((s) => {
        s.editorText = raw;
        s.lastEdited = 'editor';
        s.isDirty = true;
      }),

    syncFromForm: () =>
      set((s) => {
        if (s.lastEdited !== 'form') return;
        s.editorText = serialize(s.draft.questions, s.format);
        s.parseErrors = [];
      }),

    applyEditorParse: () =>
      set((s) => {
        if (s.lastEdited !== 'editor') return;
        const res = s.format === 'text' ? parseText(s.editorText) : parseJson(s.editorText);
        if (!res.ok) {
          s.parseErrors = res.errors;
          return;
        }
        const prev = s.draft.questions;
        s.draft.questions = res.value.map((q, qi) => ({
          uid: prev[qi]?.uid ?? q.uid,
          content: q.content,
          options: q.options.map((o, oi) => ({
            uid: prev[qi]?.options[oi]?.uid ?? o.uid,
            content: o.content,
            isCorrect: o.isCorrect,
          })),
        }));
        s.parseErrors = [];
      }),
  })),
);
