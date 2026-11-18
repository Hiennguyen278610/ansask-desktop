import { describe, expect, it } from 'vitest';
import { useEditorStore } from '@/features/exam-editor/store/editor.store';

describe('editor.store', () => {
  it('tracks isDirty on edits and resets on init/markClean', () => {
    const store = useEditorStore.getState();
    store.init({ title: 'Đề 1', questions: [] });
    expect(useEditorStore.getState().isDirty).toBe(false);

    store.setTitle('Đề 1 mới');
    expect(useEditorStore.getState().isDirty).toBe(true);

    store.markClean();
    expect(useEditorStore.getState().isDirty).toBe(false);

    store.addQuestion();
    expect(useEditorStore.getState().isDirty).toBe(true);
    expect(useEditorStore.getState().draft.questions).toHaveLength(1);
  });

  it('keeps invalid editor text when switching format is blocked', () => {
    const store = useEditorStore.getState();
    store.init({ title: 'Đề 1', questions: [] });
    store.setEditorText('invalid question');

    expect(store.setFormat('json')).toBe(true);
    expect(useEditorStore.getState().format).toBe('text');
    expect(useEditorStore.getState().editorText).toBe('invalid question');
    expect(useEditorStore.getState().parseErrors.length).toBeGreaterThan(0);
  });

  it('does not resurrect deleted question when an empty question causes validation errors', () => {
    const store = useEditorStore.getState();
    store.init({
      title: 'Đề 1',
      questions: [
        {
          uid: 'q-old',
          content: 'Câu cũ',
          options: [
            { uid: 'o1', content: 'A', isCorrect: true },
            { uid: 'o2', content: 'B', isCorrect: false },
          ],
        },
      ],
    });

    // Add a new empty question in form, sync to editor
    store.addQuestion();
    store.syncFromForm();
    expect(useEditorStore.getState().draft.questions).toHaveLength(2);

    // Delete the old question in editor text, leaving only the empty question
    store.setEditorText('ask :\nans. \nans. ');
    store.applyEditorParse();
    expect(useEditorStore.getState().draft.questions).toHaveLength(1);
    expect(useEditorStore.getState().draft.questions[0].content).toBe('');
    expect(useEditorStore.getState().parseErrors.length).toBeGreaterThan(0);

    // Delete the remaining empty question in form; old question must NOT come back
    const remainingUid = useEditorStore.getState().draft.questions[0].uid;
    store.removeQuestion(remainingUid);
    store.syncFromForm();
    expect(useEditorStore.getState().draft.questions).toHaveLength(0);
    expect(useEditorStore.getState().editorText).toBe('');
  });
});
