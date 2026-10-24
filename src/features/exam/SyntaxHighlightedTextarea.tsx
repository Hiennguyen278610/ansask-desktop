import { useRef } from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export function SyntaxHighlightedTextarea({ value, onChange }: Props) {
  const preRef = useRef<HTMLPreElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const handleScroll = () => {
    if (preRef.current && taRef.current) {
      preRef.current.scrollTop = taRef.current.scrollTop;
      preRef.current.scrollLeft = taRef.current.scrollLeft;
    }
  };

  const highlightText = (text: string) => {
    if (!text) return '';
    return text.split('\n').map(line => {
      const trimmed = line.trimStart();
      if (/^ask\s*:/i.test(trimmed)) {
        const match = line.match(/^(\s*)(ask\s*:)(.*)$/i);
        if (match) return `${match[1]}<span class="text-rose-600 font-bold">${match[2]}</span>${match[3]}`;
      }
      if (/^ans\.\*/i.test(trimmed)) {
        const match = line.match(/^(\s*)(ans\.\*)(.*)$/i);
        if (match) return `${match[1]}<span class="text-blue-600 font-bold">${match[2]}</span>${match[3]}`;
      }
      if (/^ans\./i.test(trimmed)) {
        const match = line.match(/^(\s*)(ans\.)(.*)$/i);
        if (match) return `${match[1]}<span class="text-blue-600 font-bold">${match[2]}</span>${match[3]}`;
      }
      // Escape HTML for normal text
      return line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }).join('\n');
  };

  return (
    <div className="relative flex-1 w-full rounded-2xl neu-card-inset overflow-hidden flex">
      {/* Lớp dưới: Hiển thị text có màu. Sử dụng text-ink để kế thừa màu chữ chuẩn */}
      <pre
        ref={preRef}
        aria-hidden="true"
        className="absolute inset-0 p-4 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words text-ink pointer-events-none overflow-hidden"
        dangerouslySetInnerHTML={{ __html: highlightText(value) + '<br/>' }}
      />
      {/* Lớp trên: Textarea trong suốt, chỉ hiện con trỏ và vùng chọn */}
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
        className="relative z-10 w-full h-full p-4 font-mono text-xs sm:text-sm leading-relaxed bg-transparent text-transparent caret-ink focus:outline-none resize-none"
      />
    </div>
  );
}
