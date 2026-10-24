import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Upload, FileText, CheckCircle2 } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';
import { parseTxtToQuestions } from '../import/serialize'; // Hoặc dùng API backend nếu cần

export function MobileImportScreen() {
  const navigate = useNavigate();
  const showToast = useUiStore(s => s.showToast);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.json')) {
      showToast('Chỉ hỗ trợ file .txt hoặc .json!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setFileContent(content);
      setFileName(file.name);
      showToast('Đã đọc file thành công. Nhấn "Tạo bài" để bắt đầu.');
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  const handleProcess = () => {
    if (!fileContent) return;
    // Ở bản Mobile, ta không lưu vào DB mà chuyển thẳng sang màn làm bài
    // Gửi nội dung qua state của router
    navigate('/quiz-mobile', { state: { rawContent: fileContent, fileName } });
  };

  return (
    <div className="p-5 space-y-6">
      <div className="text-center space-y-2 mt-8">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
          <Upload className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-ink-strong">Nhập bài kiểm tra</h1>
        <p className="text-sm text-slate-500">Tải lên file .txt hoặc .json để tạo bài làm nhanh</p>
      </div>

      <label className="block neu-card rounded-2xl p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 text-center cursor-pointer active:scale-95 transition-transform">
        <input type="file" accept=".txt,.json" className="hidden" onChange={handleFileChange} />
        <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <span className="text-sm font-bold text-ink">Chạm để chọn file</span>
        {fileName && <p className="text-xs text-emerald-600 mt-2 font-medium">{fileName}</p>}
      </label>

      {fileContent && (
        <div className="space-y-3 animate-fade-in">
          <div className="neu-card-inset p-4 rounded-xl h-40 overflow-y-auto font-mono text-xs text-slate-600 whitespace-pre-wrap">
            {fileContent}
          </div>
          <button onClick={handleProcess} className="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold text-lg flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Bắt đầu làm bài
          </button>
        </div>
      )}
    </div>
  );
}
