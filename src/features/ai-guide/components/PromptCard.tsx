import type { ReactNode } from 'react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';

interface PromptCardProps {
  icon: ReactNode;
  title: string;
  content: string;
}

export function PromptCard({ icon, title, content }: PromptCardProps) {
  const handleCopy = async () => {
    try {
      await writeText(content);
    } catch {
      await navigator.clipboard.writeText(content);
    }
    toast.success(`Đã sao chép prompt ${title}`);
  };

  return (
    <div className="flex flex-col rounded-[var(--radius-lg)] bg-[var(--surface)] shadow-[var(--shadow-elevated)] overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
          {icon}
          <span>{title}</span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="h-3.5 w-3.5" />
          sao chép
        </Button>
      </div>
      <pre className="flex-1 overflow-x-auto whitespace-pre-wrap bg-[var(--surface-muted)] p-4 font-mono text-xs leading-relaxed text-[var(--text)]">
        {content}
      </pre>
    </div>
  );
}
