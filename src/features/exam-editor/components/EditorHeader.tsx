import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useEditorStore } from '../store/editor.store';

interface EditorHeaderProps {
  onBack: () => void;
  onSave: () => void;
  saving?: boolean;
}

export function EditorHeader({ onBack, onSave, saving }: EditorHeaderProps) {
  const title = useEditorStore((s) => s.draft.title);
  const setTitle = useEditorStore((s) => s.setTitle);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 bg-[var(--surface)] px-4">
      <Button type="button" variant="ghost" size="icon" onClick={onBack} title="Quay lại">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tên bộ đề"
        className="flex-1"
      />
      <Button type="button" onClick={onSave} disabled={saving}>
        <Save className="h-4 w-4" />
        Lưu đề
      </Button>
    </header>
  );
}
