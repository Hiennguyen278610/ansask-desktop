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
});
