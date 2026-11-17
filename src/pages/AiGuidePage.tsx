import { BookOpen, Braces } from 'lucide-react';
import { PromptCard } from '@/features/ai-guide/components/PromptCard';
import { StepCard } from '@/features/ai-guide/components/StepCard';
import { PROMPT_JSON, PROMPT_TEXT, STEPS } from '@/features/ai-guide/prompts';

export function AiGuidePage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <StepCard key={step.title} title={step.title} content={step.content} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PromptCard
          icon={<BookOpen className="h-4 w-4 text-[var(--primary)]" />}
          title="TEXT"
          content={PROMPT_TEXT}
        />
        <PromptCard
          icon={<Braces className="h-4 w-4 text-[var(--accent)]" />}
          title="JSON"
          content={PROMPT_JSON}
        />
      </div>
    </div>
  );
}
