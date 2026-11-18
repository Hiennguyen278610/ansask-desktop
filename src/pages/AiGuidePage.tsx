import { BookOpen, Braces } from 'lucide-react';
import { PromptCard } from '@/features/ai-guide/components/PromptCard';
import { StepCard } from '@/features/ai-guide/components/StepCard';
import { AI_PLATFORMS, PROMPT_JSON, PROMPT_TEXT, STEPS } from '@/features/ai-guide/prompts';
import { call } from '@/shared/api/client';

async function openExternalUrl(url: string) {
  try {
    await call('open_external_url', { url });
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

function AiPlatformLink({ name, url }: { name: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        void openExternalUrl(url);
      }}
      className="font-semibold text-[var(--primary-text)] underline decoration-[var(--primary-text)]/40 underline-offset-2 transition-colors hover:text-[var(--primary)] hover:decoration-[var(--primary)] cursor-pointer"
    >
      {name}
    </a>
  );
}

const STEP_ONE_CONTENT = (
  <>
    Mở các nền tảng AI hỗ trợ đọc tài liệu như{' '}
    <AiPlatformLink {...AI_PLATFORMS[0]} />, <AiPlatformLink {...AI_PLATFORMS[1]} />,{' '}
    <AiPlatformLink {...AI_PLATFORMS[2]} /> hoặc <AiPlatformLink {...AI_PLATFORMS[3]} />.
  </>
);

export function AiGuidePage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <StepCard
            key={step.title}
            title={step.title}
            content={index === 0 ? STEP_ONE_CONTENT : step.content}
          />
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
