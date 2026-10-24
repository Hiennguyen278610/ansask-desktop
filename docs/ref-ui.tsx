import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  PanelLeft,
  Plus,
  Check,
  Copy,
  Clock,
  Award,
  TrendingUp,
  FileText,
  ChevronRight,
  Eye,
  EyeOff,
  Play,
  History,
  List,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Save,
  ExternalLink,
  Layers,
  HelpCircle,
  RotateCcw,
  Settings,
  Power,
  X
} from 'lucide-react';

// ==========================================
// HELPER: SERIALIZATION & PARSING (TXT <-> JSON <-> STATE)
// ==========================================

const questionsToJsonString = (questions) => {
  const formatted = questions.map((q) => ({
    ask: q.ask || '',
    answer: (q.options || []).map((opt) => ({
      [opt.isCorrect ? 'true' : 'false']: opt.text || ''
    }))
  }));
  return JSON.stringify(formatted, null, '\t');
};

const questionsToTxtString = (questions) => {
  return questions
    .map((q) => {
      const askLine = `ask : ${q.ask || ''}`;
      const ansLines = (q.options || []).map((opt) =>
        opt.isCorrect ? `ans.* ${opt.text || ''}` : `ans. ${opt.text || ''}`
      );
      return [askLine, ...ansLines].join('\n');
    })
    .join('\n\n');
};

const parseJsonToQuestions = (jsonStr) => {
  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) throw new Error('JSON phải là một mảng [...]');
  return parsed.map((item, idx) => {
    const ask = typeof item.ask === 'string' ? item.ask : '';
    const rawAnswers = Array.isArray(item.answer) ? item.answer : [];
    const options = rawAnswers.map((ansObj, oIdx) => {
      const hasTrue = Object.prototype.hasOwnProperty.call(ansObj, 'true');
      const text = hasTrue ? ansObj['true'] : ansObj['false'] ?? '';
      return {
        id: `opt-${idx}-${oIdx}-${Math.random().toString(36).slice(2, 6)}`,
        text: String(text),
        isCorrect: Boolean(hasTrue)
      };
    });
    return {
      id: `q-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      ask,
      options:
        options.length > 0
          ? options
          : [
              { id: `opt-${idx}-0`, text: '', isCorrect: true },
              { id: `opt-${idx}-1`, text: '', isCorrect: false },
              { id: `opt-${idx}-2`, text: '', isCorrect: false },
              { id: `opt-${idx}-3`, text: '', isCorrect: false }
            ]
    };
  });
};

const parseTxtToQuestions = (txtStr) => {
  const lines = txtStr.split(/\r?\n/);
  const questions = [];
  let currentQ = null;

  lines.forEach((rawLine, lIdx) => {
    const line = rawLine.trim();
    if (!line) return;

    if (/^ask\s*:/i.test(line)) {
      if (currentQ) questions.push(currentQ);
      const askContent = line.replace(/^ask\s*:\s*/i, '');
      currentQ = {
        id: `q-${questions.length}-${lIdx}`,
        ask: askContent,
        options: []
      };
    } else if (/^ans\.\*/i.test(line)) {
      if (!currentQ) {
        currentQ = { id: `q-0-${lIdx}`, ask: '', options: [] };
      }
      const optText = line.replace(/^ans\.\*\s*/i, '');
      currentQ.options.push({
        id: `opt-${questions.length}-${currentQ.options.length}-${lIdx}`,
        text: optText,
        isCorrect: true
      });
    } else if (/^ans\./i.test(line)) {
      if (!currentQ) {
        currentQ = { id: `q-0-${lIdx}`, ask: '', options: [] };
      }
      const optText = line.replace(/^ans\.\s*/i, '');
      currentQ.options.push({
        id: `opt-${questions.length}-${currentQ.options.length}-${lIdx}`,
        text: optText,
        isCorrect: false
      });
    } else if (currentQ) {
      if (currentQ.options.length === 0) {
        currentQ.ask += (currentQ.ask ? ' ' : '') + line;
      } else {
        const lastOpt = currentQ.options[currentQ.options.length - 1];
        lastOpt.text += ' ' + line;
      }
    }
  });

  if (currentQ) questions.push(currentQ);
  return questions;
};

// ==========================================
// INITIAL MOCK DATA
// ==========================================

const SUBJECT_COLORS = [
  { id: 'charcoal', name: 'Than chì', hex: '#262b33', soft: '#dce2ec' },
  { id: 'royalblue', name: 'Xanh dương', hex: '#3b82f6', soft: '#dbeafe' },
  { id: 'emerald', name: 'Xanh ngọc', hex: '#10b981', soft: '#d1fae5' },
  { id: 'violet', name: 'Tím khói', hex: '#8b5cf6', soft: '#ede9fe' },
  { id: 'amber', name: 'Cam hổ phách', hex: '#f59e0b', soft: '#fef3c7' },
  { id: 'rose', name: 'Đỏ hồng', hex: '#f43f5e', soft: '#ffe4e6' },
  { id: 'cyan', name: 'Xanh lam', hex: '#06b6d4', soft: '#cffafe' },
  { id: 'indigo', name: 'Chàm', hex: '#6366f1', soft: '#e0e7ff' }
];

// Generate a 42-question bank for the flagship exam so 25, 32, 40 presets work seamlessly
const generateComputerNetworkQuestions = () => {
  const base = [
    {
      ask: 'Giao thức nào hoạt động ở tầng Transport (Tầng Giao vận) trong mô hình OSI?',
      options: [
        { text: 'HTTP và FTP', isCorrect: false },
        { text: 'TCP và UDP', isCorrect: true },
        { text: 'IP và ICMP', isCorrect: false },
        { text: 'ARP và RARP', isCorrect: false }
      ]
    },
    {
      ask: 'Địa chỉ IPv4 có độ dài bao nhiêu bit?',
      options: [
        { text: '16 bit', isCorrect: false },
        { text: '32 bit', isCorrect: true },
        { text: '64 bit', isCorrect: false },
        { text: '128 bit', isCorrect: false }
      ]
    },
    {
      ask: 'Cổng (Port) mặc định của giao thức HTTPS là bao nhiêu?',
      options: [
        { text: 'Port 80', isCorrect: false },
        { text: 'Port 21', isCorrect: false },
        { text: 'Port 443', isCorrect: true },
        { text: 'Port 22', isCorrect: false }
      ]
    },
    {
      ask: 'Thiết bị Switch hoạt động chủ yếu ở tầng nào của mô hình OSI?',
      options: [
        { text: 'Tầng 1 - Physical', isCorrect: false },
        { text: 'Tầng 2 - Data Link', isCorrect: true },
        { text: 'Tầng 3 - Network', isCorrect: false },
        { text: 'Tầng 7 - Application', isCorrect: false }
      ]
    },
    {
      ask: 'Giao thức DNS dùng để làm gì trong mạng máy tính?',
      options: [
        { text: 'Cấp phát địa chỉ IP động cho máy trạm', isCorrect: false },
        { text: 'Phân giải tên miền sang địa chỉ IP và ngược lại', isCorrect: true },
        { text: 'Truyền tải tập tin qua mạng an toàn', isCorrect: false },
        { text: 'Kiểm tra kết nối vật lý giữa hai router', isCorrect: false }
      ]
    },
    {
      ask: 'Trong quá trình bắt tay 3 bước (Three-way Handshake) của TCP, gói tin đầu tiên gửi đi có cờ gì?',
      options: [
        { text: 'ACK', isCorrect: false },
        { text: 'SYN', isCorrect: true },
        { text: 'FIN', isCorrect: false },
        { text: 'RST', isCorrect: false }
      ]
    },
    {
      ask: 'Subnet Mask mặc định của lớp C (Class C) là gì?',
      options: [
        { text: '255.0.0.0', isCorrect: false },
        { text: '255.255.0.0', isCorrect: false },
        { text: '255.255.255.0', isCorrect: true },
        { text: '255.255.255.128', isCorrect: false }
      ]
    },
    {
      ask: 'Giao thức DHCP sử dụng cơ chế gồm 4 bước viết tắt là gì?',
      options: [
        { text: 'FIFO', isCorrect: false },
        { text: 'DORA (Discover, Offer, Request, Acknowledge)', isCorrect: true },
        { text: 'CSMA/CD', isCorrect: false },
        { text: 'OSPF', isCorrect: false }
      ]
    }
  ];

  const list = [];
  for (let i = 0; i < 42; i++) {
    const template = base[i % base.length];
    const suffix = i >= base.length ? ` (Biến thể #${Math.floor(i / base.length) + 1}.${(i % base.length) + 1})` : '';
    list.push({
      id: `q-net-${i + 1}`,
      ask: `${template.ask}${suffix}`,
      options: template.options.map((o, oIdx) => ({
        id: `opt-net-${i + 1}-${oIdx}`,
        text: o.text,
        isCorrect: o.isCorrect
      }))
    });
  }
  return list;
};

const INITIAL_SUBJECTS = [
  {
    id: 'sub-1',
    name: 'Mạng Máy Tính',
    color: '#262b33',
    createdAt: '2026-10-01'
  },
  {
    id: 'sub-2',
    name: 'Cấu Trúc Dữ Liệu & GT',
    color: '#3b82f6',
    createdAt: '2026-10-05'
  },
  {
    id: 'sub-3',
    name: 'Hệ Quản Trị CSDL',
    color: '#10b981',
    createdAt: '2026-10-10'
  },
  {
    id: 'sub-4',
    name: 'Trí Tuệ Nhân Tạo',
    color: '#8b5cf6',
    createdAt: '2026-10-12'
  },
  {
    id: 'sub-5',
    name: 'Kỹ Thuật Phần Mềm',
    color: '#f59e0b',
    createdAt: '2026-10-15'
  },
  {
    id: 'sub-6',
    name: 'An Toàn Thông Tin',
    color: '#f43f5e',
    createdAt: '2026-10-18'
  }
];

const INITIAL_EXAMS = [
  {
    id: 'exam-1',
    subjectId: 'sub-1',
    title: 'Đề tổng hợp OSI, TCP/IP & Chia mạng con',
    createdAt: '2026-10-18 14:30',
    questions: generateComputerNetworkQuestions()
  },
  {
    id: 'exam-2',
    subjectId: 'sub-1',
    title: 'Ôn tập Routing & Switching cơ bản',
    createdAt: '2026-10-20 09:15',
    questions: [
      {
        id: 'q-r1',
        ask: 'Giao thức định tuyến OSPF sử dụng thuật toán nào để tìm đường đi ngắn nhất?',
        options: [
          { id: 'o-r1-1', text: 'Bellman-Ford', isCorrect: false },
          { id: 'o-r1-2', text: 'Dijkstra (SPF)', isCorrect: true },
          { id: 'o-r1-3', text: 'Distance Vector', isCorrect: false },
          { id: 'o-r1-4', text: 'Flooding', isCorrect: false }
        ]
      },
      {
        id: 'q-r2',
        ask: 'VLAN (Virtual LAN) giúp giải quyết vấn đề chính nào trong mạng LAN lớn?',
        options: [
          { id: 'o-r2-1', text: 'Tăng băng thông đường truyền Internet', isCorrect: false },
          { id: 'o-r2-2', text: 'Chia nhỏ miền quảng bá (Broadcast Domain)', isCorrect: true },
          { id: 'o-r2-3', text: 'Thay thế hoàn toàn thiết bị Router', isCorrect: false },
          { id: 'o-r2-4', text: 'Mã hóa dữ liệu tầng Application', isCorrect: false }
        ]
      },
      {
        id: 'q-r3',
        ask: 'Giá trị Administrative Distance (AD) mặc định của Static Route là bao nhiêu?',
        options: [
          { id: 'o-r3-1', text: '0', isCorrect: false },
          { id: 'o-r3-2', text: '1', isCorrect: true },
          { id: 'o-r3-3', text: '90', isCorrect: false },
          { id: 'o-r3-4', text: '110', isCorrect: false }
        ]
      }
    ]
  },
  {
    id: 'exam-3',
    subjectId: 'sub-2',
    title: 'Độ phức tạp thuật toán, Cây nhị phân & Đồ thị',
    createdAt: '2026-10-19 16:40',
    questions: [
      {
        id: 'q-ds1',
        ask: 'Độ phức tạp thời gian trung bình của thuật toán tìm kiếm nhị phân (Binary Search) là gì?',
        options: [
          { id: 'o-ds1-1', text: 'O(n)', isCorrect: false },
          { id: 'o-ds1-2', text: 'O(log n)', isCorrect: true },
          { id: 'o-ds1-3', text: 'O(n log n)', isCorrect: false },
          { id: 'o-ds1-4', text: 'O(1)', isCorrect: false }
        ]
      },
      {
        id: 'q-ds2',
        ask: 'Cấu trúc dữ liệu nào hoạt động theo nguyên tắc LIFO (Last In, First Out)?',
        options: [
          { id: 'o-ds2-1', text: 'Queue (Hàng đợi)', isCorrect: false },
          { id: 'o-ds2-2', text: 'Stack (Ngăn xếp)', isCorrect: true },
          { id: 'o-ds2-3', text: 'Linked List', isCorrect: false },
          { id: 'o-ds2-4', text: 'Heap', isCorrect: false }
        ]
      }
    ]
  },
  {
    id: 'exam-4',
    subjectId: 'sub-3',
    title: 'Truy vấn SQL, Chuẩn hóa CSDL & Giao dịch ACID',
    createdAt: '2026-10-21 10:00',
    questions: [
      {
        id: 'q-db1',
        ask: 'Tính chất nào trong ACID đảm bảo giao dịch thực hiện toàn bộ hoặc không thực hiện gì cả?',
        options: [
          { id: 'o-db1-1', text: 'Atomicity (Tính nguyên tố)', isCorrect: true },
          { id: 'o-db1-2', text: 'Consistency (Tính nhất quán)', isCorrect: false },
          { id: 'o-db1-3', text: 'Isolation (Tính cô lập)', isCorrect: false },
          { id: 'o-db1-4', text: 'Durability (Tính bền vững)', isCorrect: false }
        ]
      }
    ]
  }
];

const INITIAL_ATTEMPTS = [
  {
    id: 'att-1',
    examId: 'exam-1',
    examTitle: 'Đề tổng hợp OSI, TCP/IP & Chia mạng con',
    subjectId: 'sub-1',
    subjectName: 'Mạng Máy Tính',
    timestamp: '2026-10-23 19:40',
    periodTag: 'week',
    dayLabel: 'T6',
    monthLabel: 'T10',
    yearLabel: '2026',
    totalQuestions: 25,
    correctCount: 23,
    score: 9.2,
    durationSec: 410
  },
  {
    id: 'att-2',
    examId: 'exam-3',
    examTitle: 'Độ phức tạp thuật toán, Cây nhị phân & Đồ thị',
    subjectId: 'sub-2',
    subjectName: 'Cấu Trúc Dữ Liệu & GT',
    timestamp: '2026-10-22 21:15',
    periodTag: 'week',
    dayLabel: 'T5',
    monthLabel: 'T10',
    yearLabel: '2026',
    totalQuestions: 20,
    correctCount: 17,
    score: 8.5,
    durationSec: 520
  },
  {
    id: 'att-3',
    examId: 'exam-1',
    examTitle: 'Đề tổng hợp OSI, TCP/IP & Chia mạng con',
    subjectId: 'sub-1',
    subjectName: 'Mạng Máy Tính',
    timestamp: '2026-10-21 15:10',
    periodTag: 'week',
    dayLabel: 'T4',
    monthLabel: 'T10',
    yearLabel: '2026',
    totalQuestions: 32,
    correctCount: 26,
    score: 8.1,
    durationSec: 690
  },
  {
    id: 'att-4',
    examId: 'exam-4',
    examTitle: 'Truy vấn SQL, Chuẩn hóa CSDL & Giao dịch ACID',
    subjectId: 'sub-3',
    subjectName: 'Hệ Quản Trị CSDL',
    timestamp: '2026-10-20 10:05',
    periodTag: 'week',
    dayLabel: 'T3',
    monthLabel: 'T10',
    yearLabel: '2026',
    totalQuestions: 25,
    correctCount: 22,
    score: 8.8,
    durationSec: 480
  },
  {
    id: 'att-5',
    examId: 'exam-2',
    examTitle: 'Ôn tập Routing & Switching cơ bản',
    subjectId: 'sub-1',
    subjectName: 'Mạng Máy Tính',
    timestamp: '2026-10-19 18:22',
    periodTag: 'week',
    dayLabel: 'T2',
    monthLabel: 'T10',
    yearLabel: '2026',
    totalQuestions: 15,
    correctCount: 14,
    score: 9.3,
    durationSec: 310
  }
];

const FIXED_AI_PROMPT = `Bạn là một chuyên gia biên soạn đề kiểm tra trắc nghiệm học thuật chính xác.
Dựa trên tài liệu được đính kèm (hoặc nội dung tôi cung cấp bên dưới), hãy tạo danh sách câu hỏi trắc nghiệm khách quan (mỗi câu có 4 lựa chọn, trong đó chỉ có đúng 1 lựa chọn đúng là "true" và 3 lựa chọn sai là "false").

YÊU CẦU ĐỊNH DẠNG ĐẦU RA:
Chỉ trả về duy nhất một mảng JSON hợp lệ theo đúng cấu trúc dưới đây (không giải thích thêm ngoài khối code):

[
\t{
\t\t"ask": "Nội dung câu hỏi thứ nhất?",
\t\t"answer": [
\t\t\t{"false": "Nội dung lựa chọn sai 1"},
\t\t\t{"false": "Nội dung lựa chọn sai 2"},
\t\t\t{"false": "Nội dung lựa chọn sai 3"},
\t\t\t{"true": "Nội dung lựa chọn ĐÚNG"}
\t\t]
\t},
\t{
\t\t"ask": "Nội dung câu hỏi thứ hai?",
\t\t"answer": [
\t\t\t{"false": "Nội dung lựa chọn sai 1"},
\t\t\t{"true": "Nội dung lựa chọn ĐÚNG"},
\t\t\t{"false": "Nội dung lựa chọn sai 2"},
\t\t\t{"false": "Nội dung lựa chọn sai 3"}
\t\t]
\t}
]

Hoặc nếu tôi yêu cầu định dạng TXT ngắn gọn, hãy trả về đúng chuẩn:
ask : <Nội dung câu hỏi>
ans. <Nội dung lựa chọn sai>
ans.* <Nội dung lựa chọn Đúng>
ans. <Nội dung lựa chọn sai>
ans. <Nội dung lựa chọn sai>`;

// ==========================================
// REUSABLE QUESTION + RADIO OPTION COMPONENT
// ==========================================
// Used across:
// 1. Exam Set Overview (read-only + toggle showAnswers)
// 2. Split Editor Render View (interactive inline edit + radio toggle correct answer)
// 3. Quiz Taking View (interactive radio selection for user's answer)
// 4. Quiz Result Review (shows user's answer vs correct answer)

function QuestionCard({
  index,
  question,
  mode = 'preview', // 'preview' | 'editor' | 'quiz' | 'result'
  showAnswer = false,
  selectedOptionId = null,
  onSelectOption = () => {},
  onUpdateQuestion = () => {},
  onDeleteQuestion = () => {},
  isFocused = false,
  cardRef = null
}) {
  const [editingAsk, setEditingAsk] = useState(false);
  const [editingOptId, setEditingOptId] = useState(null);

  const handleAskChange = (val) => {
    onUpdateQuestion({ ...question, ask: val });
  };

  const handleOptionTextChange = (optId, val) => {
    const nextOptions = question.options.map((o) =>
      o.id === optId ? { ...o, text: val } : o
    );
    onUpdateQuestion({ ...question, options: nextOptions });
  };

  const handleSetCorrectOption = (optId) => {
    if (mode !== 'editor') return;
    const nextOptions = question.options.map((o) => ({
      ...o,
      isCorrect: o.id === optId
    }));
    onUpdateQuestion({ ...question, options: nextOptions });
  };

  const handleAddOption = () => {
    const newOpt = {
      id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      text: `Lựa chọn mới ${question.options.length + 1}`,
      isCorrect: question.options.length === 0
    };
    onUpdateQuestion({ ...question, options: [...question.options, newOpt] });
  };

  const handleRemoveOption = (optId) => {
    if (question.options.length <= 2) return;
    const filtered = question.options.filter((o) => o.id !== optId);
    if (!filtered.some((o) => o.isCorrect) && filtered.length > 0) {
      filtered[0].isCorrect = true;
    }
    onUpdateQuestion({ ...question, options: filtered });
  };

  return (
    <div
      ref={cardRef}
      className={`neu-card-inset p-5 rounded-2xl transition-all duration-300 ${
        isFocused ? 'ring-2 ring-[#262b33] shadow-lg scale-[1.005]' : ''
      }`}
    >
      {/* Question Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 flex-1">
          <span className="neu-pill px-3 py-1 rounded-xl text-xs font-bold text-[#262b33] shrink-0 mt-0.5">
            Câu {index + 1}
          </span>

          {mode === 'editor' ? (
            <div className="flex-1">
              {editingAsk ? (
                <textarea
                  autoFocus
                  rows={2}
                  value={question.ask}
                  onChange={(e) => handleAskChange(e.target.value)}
                  onBlur={() => setEditingAsk(false)}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full p-2.5 rounded-xl bg-white/90 text-[#1e232a] font-medium text-sm border border-slate-300 focus:outline-none focus:border-[#262b33]"
                />
              ) : (
                <div
                  onClick={() => setEditingAsk(true)}
                  title="Nhấn vào để sửa nội dung câu hỏi"
                  className="cursor-text p-1.5 -m-1.5 rounded-xl hover:bg-white/60 transition-colors text-[#1e232a] font-semibold text-sm sm:text-base leading-relaxed"
                >
                  {question.ask || (
                    <span className="italic text-slate-400">
                      (Chưa có nội dung câu hỏi - Nhấn vào để nhập)
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <h4 className="text-[#1e232a] font-semibold text-sm sm:text-base leading-relaxed flex-1">
              {question.ask || '(Câu hỏi trống)'}
            </h4>
          )}
        </div>

        {mode === 'editor' && (
          <button
            onClick={onDeleteQuestion}
            title="Xóa câu hỏi này"
            className="neu-icon-btn w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Options List with Radio Buttons */}
      <div className="space-y-2.5">
        {(question.options || []).map((opt, oIdx) => {
          const isCheckedInEditor = mode === 'editor' && opt.isCorrect;
          const isCheckedInPreview = mode === 'preview' && showAnswer && opt.isCorrect;
          const isCheckedInQuiz = mode === 'quiz' && selectedOptionId === opt.id;
          const isCheckedInResult = mode === 'result' && selectedOptionId === opt.id;

          const radioChecked =
            isCheckedInEditor || isCheckedInPreview || isCheckedInQuiz || isCheckedInResult;

          // Visual feedback styling
          let rowStyle = 'bg-[#eef2f6]/70 border-white/70 hover:bg-white/60';
          if (mode === 'preview' && showAnswer && opt.isCorrect) {
            rowStyle = 'bg-emerald-50/90 border-emerald-400/80 text-emerald-950 font-semibold';
          } else if (mode === 'editor' && opt.isCorrect) {
            rowStyle = 'bg-emerald-50/80 border-emerald-400/70';
          } else if (mode === 'quiz' && isCheckedInQuiz) {
            rowStyle = 'bg-white border-[#262b33]/40 shadow-sm font-medium';
          } else if (mode === 'result') {
            if (opt.isCorrect) {
              rowStyle = 'bg-emerald-50/90 border-emerald-400 text-emerald-900 font-semibold';
            } else if (isCheckedInResult && !opt.isCorrect) {
              rowStyle = 'bg-rose-50/90 border-rose-400 text-rose-900';
            }
          }

          return (
            <div
              key={opt.id || oIdx}
              onClick={() => {
                if (mode === 'quiz') onSelectOption(opt.id);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${rowStyle} ${
                mode === 'quiz' ? 'cursor-pointer' : ''
              }`}
            >
              {/* Radio Button */}
              <label
                onClick={(e) => {
                  e.stopPropagation();
                  if (mode === 'editor') handleSetCorrectOption(opt.id);
                  if (mode === 'quiz') onSelectOption(opt.id);
                }}
                className="flex items-center cursor-pointer shrink-0"
                title={
                  mode === 'editor'
                    ? 'Chọn làm đáp án ĐÚNG'
                    : mode === 'quiz'
                    ? 'Chọn đáp án này'
                    : ''
                }
              >
                <input
                  type="radio"
                  name={`radio-${question.id}-${mode}`}
                  checked={Boolean(radioChecked)}
                  onChange={() => {}}
                  className="sr-only"
                />
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    radioChecked
                      ? mode === 'result' && !opt.isCorrect
                        ? 'border-rose-600 bg-rose-600 text-white'
                        : (mode === 'preview' && showAnswer) ||
                          mode === 'editor' ||
                          (mode === 'result' && opt.isCorrect)
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-[#262b33] bg-[#262b33] text-white'
                      : 'border-slate-400 bg-[#eef2f6] shadow-inner'
                  }`}
                >
                  {radioChecked && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
              </label>

              {/* Option Label A, B, C, D */}
              <span className="text-xs font-bold text-slate-400 w-5 shrink-0">
                {String.fromCharCode(65 + oIdx)}.
              </span>

              {/* Option Text */}
              <div className="flex-1 text-sm text-[#262b33]">
                {mode === 'editor' ? (
                  editingOptId === opt.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={opt.text}
                      onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                      onBlur={() => setEditingOptId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingOptId(null);
                      }}
                      placeholder="Nhập nội dung lựa chọn..."
                      className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-300 focus:outline-none focus:border-[#262b33]"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingOptId(opt.id)}
                      title="Nhấn để sửa lựa chọn"
                      className="cursor-text py-0.5 px-1.5 -mx-1.5 rounded-lg hover:bg-white/80 transition-colors"
                    >
                      {opt.text || (
                        <span className="italic text-slate-400">(Nhấn để nhập lựa chọn)</span>
                      )}
                    </div>
                  )
                ) : (
                  <span>{opt.text}</span>
                )}
              </div>

              {/* Badges / Actions on Right */}
              {mode === 'editor' && (
                <div className="flex items-center gap-2 shrink-0">
                  {opt.isCorrect && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700">
                      Đúng
                    </span>
                  )}
                  {question.options.length > 2 && (
                    <button
                      onClick={() => handleRemoveOption(opt.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                      title="Xóa lựa chọn"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {mode === 'preview' && showAnswer && opt.isCorrect && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white shrink-0">
                  Đáp án đúng
                </span>
              )}

              {mode === 'result' && opt.isCorrect && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              {mode === 'result' && isCheckedInResult && !opt.isCorrect && (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {mode === 'editor' && (
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={handleAddOption}
            className="text-xs font-semibold text-slate-500 hover:text-[#262b33] flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/60 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm lựa chọn
          </button>
          <span className="text-[11px] text-slate-400">
            Mẹo: Nhấn vào nút tròn Radio để đổi đáp án đúng, nhấn vào chữ để sửa trực tiếp
          </span>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MAIN DASHBOARD APPLICATION
// ==========================================

export default function App() {
  // Sidebar states
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'exams' | 'guide'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [logoHovered, setLogoHovered] = useState(false);

  // Core Data States
  const [subjects, setSubjects] = useState(INITIAL_SUBJECTS);
  const [exams, setExams] = useState(INITIAL_EXAMS);
  const [attempts, setAttempts] = useState(INITIAL_ATTEMPTS);

  // Home Dashboard States
  const [statsPeriod, setStatsPeriod] = useState('week'); // 'week' | 'month' | 'year'
  const [chartMetric, setChartMetric] = useState('both'); // 'both' | 'count' | 'score'

  // Tab 2: Exam Navigation Hierarchy (root > subject > exam / editor / quiz)
  // viewMode: 'root' | 'subject' | 'examDetail' | 'examEditor' | 'quizActive' | 'quizResult'
  const [examViewMode, setExamViewMode] = useState('root');
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [viewResetCounter, setViewResetCounter] = useState(0);

  // Subject Creation States (in 'root')
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(SUBJECT_COLORS[0].hex);
  const [showCreateSubjectForm, setShowCreateSubjectForm] = useState(false);

  // Exam Detail States (in 'examDetail')
  const [showAnswersSwitch, setShowAnswersSwitch] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showQuizConfigModal, setShowQuizConfigModal] = useState(false);
  const [quizQuestionCountInput, setQuizQuestionCountInput] = useState('25');

  // Exam Split Editor States (in 'examEditor')
  const [editingExamTitle, setEditingExamTitle] = useState('');
  const [editorQuestions, setEditorQuestions] = useState([]);
  const [editorFormatTab, setEditorFormatTab] = useState('json'); // 'txt' | 'json'
  const [rawTextCode, setRawTextCode] = useState('');
  const [parseError, setParseError] = useState(null);
  const [showAllQuestionsDialog, setShowAllQuestionsDialog] = useState(false);
  const [focusedQuestionId, setFocusedQuestionId] = useState(null);
  const [isEditingExistingExam, setIsEditingExistingExam] = useState(false);
  const questionRefs = useRef({});

  // Active Quiz States (in 'quizActive' & 'quizResult')
  const [activeQuizQuestions, setActiveQuizQuestions] = useState([]);
  const [quizUserAnswers, setQuizUserAnswers] = useState({});
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [quizElapsedSec, setQuizElapsedSec] = useState(0);
  const [lastQuizResult, setLastQuizResult] = useState(null);
  const [showQuizAllDialog, setShowQuizAllDialog] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Timer for Active Quiz
  useEffect(() => {
    if (examViewMode !== 'quizActive' || !quizStartTime) return;
    const interval = setInterval(() => {
      setQuizElapsedSec(Math.floor((Date.now() - quizStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [examViewMode, quizStartTime]);

  // Selected Subject & Exam Objects
  const currentSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId) || null,
    [subjects, selectedSubjectId]
  );

  const currentExam = useMemo(
    () => exams.find((e) => e.id === selectedExamId) || null,
    [exams, selectedExamId]
  );

  // ==========================================
  // SYNCHRONIZE EDITOR (RENDER <-> TXT/JSON)
  // ==========================================

  const syncQuestionsToRawText = (nextQuestions, format = editorFormatTab) => {
    setEditorQuestions(nextQuestions);
    setParseError(null);
    if (format === 'json') {
      setRawTextCode(questionsToJsonString(nextQuestions));
    } else {
      setRawTextCode(questionsToTxtString(nextQuestions));
    }
  };

  const handleSwitchEditorTab = (targetTab) => {
    setEditorFormatTab(targetTab);
    setParseError(null);
    if (targetTab === 'json') {
      setRawTextCode(questionsToJsonString(editorQuestions));
    } else {
      setRawTextCode(questionsToTxtString(editorQuestions));
    }
  };

  const handleRawEditorChange = (val) => {
    setRawTextCode(val);
    try {
      if (editorFormatTab === 'json') {
        const parsed = parseJsonToQuestions(val);
        setEditorQuestions(parsed);
        setParseError(null);
      } else {
        const parsed = parseTxtToQuestions(val);
        setEditorQuestions(parsed);
        setParseError(null);
      }
    } catch (err) {
      setParseError(err.message || 'Cú pháp chưa hợp lệ, đang chờ bạn nhập tiếp...');
    }
  };

  const handleInsertQuestionAt = (insertIndex) => {
    const newQ = {
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ask: `Câu hỏi mới #${editorQuestions.length + 1}`,
      options: [
        { id: `opt-${Date.now()}-1`, text: 'Lựa chọn A (Sai)', isCorrect: false },
        { id: `opt-${Date.now()}-2`, text: 'Lựa chọn B (Đúng)', isCorrect: true },
        { id: `opt-${Date.now()}-3`, text: 'Lựa chọn C (Sai)', isCorrect: false },
        { id: `opt-${Date.now()}-4`, text: 'Lựa chọn D (Sai)', isCorrect: false }
      ]
    };
    const next = [...editorQuestions];
    next.splice(insertIndex, 0, newQ);
    syncQuestionsToRawText(next);
    setFocusedQuestionId(newQ.id);
    setTimeout(() => {
      const el = questionRefs.current[newQ.id];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const handleFocusQuestionFromAllDialog = (qId) => {
    setShowAllQuestionsDialog(false);
    setShowQuizAllDialog(false);
    setFocusedQuestionId(qId);
    setTimeout(() => {
      const el = questionRefs.current[qId];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    setTimeout(() => setFocusedQuestionId(null), 2200);
  };

  // ==========================================
  // NAVIGATION & RESET ACTIONS (BREADCRUMB)
  // ==========================================

  const handleResetRoot = () => {
    setExamViewMode('root');
    setSelectedSubjectId(null);
    setSelectedExamId(null);
    setShowCreateSubjectForm(false);
    setNewSubjectName('');
    setViewResetCounter((c) => c + 1);
    triggerToast('Đã làm mới trang danh sách môn (root)');
  };

  const handleNavigateToSubject = (subjectId, isReset = false) => {
    setSelectedSubjectId(subjectId);
    setSelectedExamId(null);
    setExamViewMode('subject');
    setViewResetCounter((c) => c + 1);
    if (isReset) {
      triggerToast('Đã đặt lại trang môn học');
    }
  };

  const handleNavigateToExamDetail = (examId, isReset = false) => {
    setSelectedExamId(examId);
    setExamViewMode('examDetail');
    setShowAnswersSwitch(false);
    setShowHistoryModal(false);
    setShowQuizConfigModal(false);
    setViewResetCounter((c) => c + 1);
    if (isReset) {
      triggerToast('Đã đặt lại trang bộ đề');
    }
  };

  const handleOpenCreateExam = () => {
    setIsEditingExistingExam(false);
    setEditingExamTitle('');
    const starterQuestions = [
      {
        id: `q-init-1`,
        ask: 'Nhập nội dung câu hỏi đầu tiên của bạn tại đây?',
        options: [
          { id: 'opt-init-1', text: 'Phương án lựa chọn sai 1', isCorrect: false },
          { id: 'opt-init-2', text: 'Phương án lựa chọn sai 2', isCorrect: false },
          { id: 'opt-init-3', text: 'Phương án lựa chọn sai 3', isCorrect: false },
          { id: 'opt-init-4', text: 'Phương án lựa chọn ĐÚNG', isCorrect: true }
        ]
      },
      {
        id: `q-init-2`,
        ask: 'Câu hỏi mẫu số 2 (Bạn có thể sửa trực tiếp hoặc dán TXT / JSON ở khung bên phải)?',
        options: [
          { id: 'opt-init-21', text: 'Lựa chọn sai A', isCorrect: false },
          { id: 'opt-init-22', text: 'Lựa chọn sai B', isCorrect: false },
          { id: 'opt-init-23', text: 'Lựa chọn sai C', isCorrect: false },
          { id: 'opt-init-24', text: 'Lựa chọn đúng D', isCorrect: true }
        ]
      }
    ];
    setEditorFormatTab('json');
    syncQuestionsToRawText(starterQuestions, 'json');
    setExamViewMode('examEditor');
  };

  const handleOpenEditExistingExam = () => {
    if (!currentExam) return;
    setIsEditingExistingExam(true);
    setEditingExamTitle(currentExam.title);
    const cloned = JSON.parse(JSON.stringify(currentExam.questions));
    setEditorFormatTab('json');
    syncQuestionsToRawText(cloned, 'json');
    setExamViewMode('examEditor');
  };

  const handleSaveExamFromEditor = () => {
    if (editorQuestions.length === 0) {
      triggerToast('Bộ đề cần có ít nhất 1 câu hỏi!');
      return;
    }
    const finalTitle = editingExamTitle.trim() || 'Chưa có tiêu đề';
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

    if (isEditingExistingExam && currentExam) {
      setExams((prev) =>
        prev.map((e) =>
          e.id === currentExam.id
            ? { ...e, title: finalTitle, questions: editorQuestions }
            : e
        )
      );
      setExamViewMode('examDetail');
      triggerToast(`Đã cập nhật bộ đề "${finalTitle}"`);
    } else {
      const newExam = {
        id: `exam-${Date.now()}`,
        subjectId: selectedSubjectId,
        title: finalTitle,
        createdAt: nowStr,
        questions: editorQuestions
      };
      setExams((prev) => [newExam, ...prev]);
      setSelectedExamId(newExam.id);
      setExamViewMode('examDetail');
      setShowAnswersSwitch(false);
      triggerToast(`Đã tạo bộ đề "${finalTitle}" thành công!`);
    }
  };

  // ==========================================
  // CREATE SUBJECT
  // ==========================================
  const handleCreateSubject = (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      triggerToast('Vui lòng nhập tên môn học!');
      return;
    }
    const newSub = {
      id: `sub-${Date.now()}`,
      name: newSubjectName.trim(),
      color: newSubjectColor,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setSubjects((prev) => [...prev, newSub]);
    setNewSubjectName('');
    setShowCreateSubjectForm(false);
    triggerToast(`Đã tạo môn "${newSub.name}"`);
  };

  // ==========================================
  // QUIZ START & SUBMIT
  // ==========================================
  const handleStartQuiz = () => {
    if (!currentExam || currentExam.questions.length === 0) return;
    const requestedCount = Math.max(1, parseInt(quizQuestionCountInput, 10) || 1);
    const pool = [...currentExam.questions];

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // If user requested more than available in a small exam, cycle questions or take up to requestedCount so 25/32/40 always works smoothly
    const selectedQuestions = [];
    for (let i = 0; i < requestedCount; i++) {
      const sourceQ = pool[i % pool.length];
      selectedQuestions.push({
        ...sourceQ,
        id: `quiz-q-${i}-${sourceQ.id}`,
        ask:
          i >= pool.length
            ? `${sourceQ.ask} (Lượt ôn #${Math.floor(i / pool.length) + 1})`
            : sourceQ.ask,
        options: sourceQ.options.map((o) => ({ ...o }))
      });
    }

    setActiveQuizQuestions(selectedQuestions);
    setQuizUserAnswers({});
    setQuizStartTime(Date.now());
    setQuizElapsedSec(0);
    setShowQuizConfigModal(false);
    setExamViewMode('quizActive');
  };

  const handleSubmitQuiz = () => {
    let correct = 0;
    activeQuizQuestions.forEach((q) => {
      const chosenId = quizUserAnswers[q.id];
      const chosenOpt = q.options.find((o) => o.id === chosenId);
      if (chosenOpt && chosenOpt.isCorrect) {
        correct += 1;
      }
    });

    const total = activeQuizQuestions.length;
    const score10 = Number(((correct / total) * 10).toFixed(1));
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(
      2,
      '0'
    )}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newAttempt = {
      id: `att-${Date.now()}`,
      examId: currentExam.id,
      examTitle: currentExam.title,
      subjectId: currentSubject?.id || 'sub-1',
      subjectName: currentSubject?.name || 'Môn học',
      timestamp,
      periodTag: 'week',
      dayLabel: 'H.Nay',
      monthLabel: `T${now.getMonth() + 1}`,
      yearLabel: `${now.getFullYear()}`,
      totalQuestions: total,
      correctCount: correct,
      score: score10,
      durationSec: quizElapsedSec
    };

    setAttempts((prev) => [newAttempt, ...prev]);
    setLastQuizResult(newAttempt);
    setExamViewMode('quizResult');
    triggerToast(`Hoàn thành bài kiểm tra! Điểm của bạn: ${score10}/10`);
  };

  // ==========================================
  // DASHBOARD ANALYTICS DATA (WEEK / MONTH / YEAR)
  // ==========================================
  const dashboardStats = useMemo(() => {
    const totalExamsTaken = attempts.length;
    const avgScore =
      totalExamsTaken > 0
        ? (attempts.reduce((acc, a) => acc + a.score, 0) / totalExamsTaken).toFixed(1)
        : '0.0';
    const totalQuestionsDone = attempts.reduce((acc, a) => acc + a.totalQuestions, 0);
    const totalCorrectDone = attempts.reduce((acc, a) => acc + a.correctCount, 0);
    const accuracyRate =
      totalQuestionsDone > 0
        ? ((totalCorrectDone / totalQuestionsDone) * 100).toFixed(1)
        : '0.0';

    // Series data based on statsPeriod ('week' | 'month' | 'year')
    let series = [];
    if (statsPeriod === 'week') {
      series = [
        { label: 'T2', count: 3, avgScore: 8.2 },
        { label: 'T3', count: 5, avgScore: 8.6 },
        { label: 'T4', count: 2, avgScore: 7.9 },
        { label: 'T5', count: 6, avgScore: 9.0 },
        { label: 'T6', count: 4, avgScore: 8.5 },
        { label: 'T7', count: 7, avgScore: 9.1 },
        {
          label: 'CN',
          count: Math.max(3, attempts.length - 2),
          avgScore: Number(avgScore)
        }
      ];
    } else if (statsPeriod === 'month') {
      series = [
        { label: 'Tuần 1', count: 12, avgScore: 8.1 },
        { label: 'Tuần 2', count: 18, avgScore: 8.4 },
        { label: 'Tuần 3', count: 15, avgScore: 8.8 },
        { label: 'Tuần 4', count: 19 + attempts.length, avgScore: Number(avgScore) }
      ];
    } else {
      series = [
        { label: 'T5', count: 28, avgScore: 7.8 },
        { label: 'T6', count: 35, avgScore: 8.1 },
        { label: 'T7', count: 42, avgScore: 8.3 },
        { label: 'T8', count: 38, avgScore: 8.5 },
        { label: 'T9', count: 50, avgScore: 8.7 },
        { label: 'T10', count: 54 + attempts.length, avgScore: Number(avgScore) }
      ];
    }

    // Score Distribution for Donut Chart
    const excellent = attempts.filter((a) => a.score >= 8.5).length;
    const good = attempts.filter((a) => a.score >= 7.0 && a.score < 8.5).length;
    const average = attempts.filter((a) => a.score < 7.0).length;
    const totalDist = Math.max(1, excellent + good + average);

    return {
      totalExamsTaken:
        statsPeriod === 'week'
          ? totalExamsTaken
          : statsPeriod === 'month'
          ? totalExamsTaken + 59
          : totalExamsTaken + 242,
      avgScore,
      totalQuestionsDone:
        statsPeriod === 'week'
          ? totalQuestionsDone
          : statsPeriod === 'month'
          ? totalQuestionsDone + 1420
          : totalQuestionsDone + 6150,
      accuracyRate,
      series,
      distribution: {
        excellentPct: ((excellent / totalDist) * 100).toFixed(1),
        goodPct: ((good / totalDist) * 100).toFixed(1),
        averagePct: ((average / totalDist) * 100).toFixed(1)
      }
    };
  }, [attempts, statsPeriod]);

  // Copy Prompt helper
  const handleCopyPrompt = () => {
    const textarea = document.createElement('textarea');
    textarea.value = FIXED_AI_PROMPT;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    triggerToast('Đã sao chép Prompt JSON vào bộ nhớ tạm!');
  };

  return (
    <div className="min-h-screen bg-[#e8edf4] text-[#262b33] flex flex-col md:flex-row p-3 sm:p-6 gap-5 sm:gap-7 selection:bg-[#262b33] selection:text-white">
      {/* GOOGLE SANS FONT & NEUMORPHIC DESIGN SYSTEM CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        * {
          font-family: 'Google Sans', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .neu-shell {
          background: #eef2f7;
          box-shadow: 14px 14px 32px #cfd6e2, -14px -14px 32px #ffffff;
          border: 1.5px solid rgba(255, 255, 255, 0.85);
        }

        .neu-card {
          background: #eef2f7;
          box-shadow: 7px 7px 16px #d0d8e4, -7px -7px 16px #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.8);
        }

        .neu-card-inset {
          background: #e9eef5;
          box-shadow: inset 4px 4px 9px #cfd7e3, inset -4px -4px 9px #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.65);
        }

        .neu-pill {
          background: #eef2f7;
          box-shadow: 5px 5px 11px #ced6e2, -5px -5px 11px #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.9);
        }

        .neu-pill-active {
          background: #f5f8fc;
          box-shadow: 6px 6px 14px #c9d2e0, -6px -6px 14px #ffffff;
          border: 1.5px solid #ffffff;
        }

        .neu-icon-btn {
          background: #eef2f7;
          box-shadow: 4px 4px 9px #ced6e2, -4px -4px 9px #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.85);
          transition: all 0.2s ease;
        }

        .neu-icon-btn:hover {
          box-shadow: 2px 2px 5px #ced6e2, -2px -2px 5px #ffffff;
          transform: translateY(1px);
        }

        .neu-icon-btn:active {
          box-shadow: inset 3px 3px 6px #ced6e2, inset -3px -3px 6px #ffffff;
        }

        .neu-dark-btn {
          background: linear-gradient(145deg, #2d333d, #1d2128);
          color: #ffffff;
          box-shadow: 5px 5px 12px #c5cdd9, -4px -4px 10px #ffffff;
          transition: all 0.2s ease;
        }

        .neu-dark-btn:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }

        /* Custom sleek scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd3e0;
          border-radius: 999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #9aa6b8;
        }
      `}</style>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 neu-dark-btn px-5 py-3 rounded-2xl flex items-center gap-2.5 text-sm font-medium animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================== */}
      {/* FLOATING NEUMORPHIC SIDEBAR                */}
      {/* ========================================== */}
      <aside
        className={`neu-shell rounded-[30px] shrink-0 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-full md:w-64 p-6' : 'w-full md:w-20 p-4 items-center'
        }`}
      >
        {/* Top: Brand Logo with Hover Side-Window Toggle */}
        <div className="w-full">
          <div
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            className={`flex items-center ${
              sidebarOpen ? 'justify-between' : 'justify-center'
            } mb-6`}
          >
            <div className="flex items-center gap-3">
              {/* Hovering the logo reveals the side-window icon; clicking it opens/toggles the sidebar */}
              <button
                onClick={() => setSidebarOpen((prev) => !prev)}
                title={sidebarOpen ? 'Thu gọn Sidebar' : 'Mở rộng Sidebar'}
                className="neu-icon-btn w-11 h-11 rounded-2xl flex items-center justify-center text-[#262b33] relative group overflow-hidden"
              >
                {logoHovered ? (
                  <PanelLeft className="w-5 h-5 text-[#262b33] animate-pulse" />
                ) : (
                  <div className="w-5 h-5 rounded-lg bg-[#262b33] text-white flex items-center justify-center font-bold text-xs">
                    Q
                  </div>
                )}
              </button>

              {sidebarOpen && (
                <div>
                  <h1 className="font-bold text-base tracking-tight text-[#1e232a]">
                    QUIZ Analysis
                  </h1>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Smart Exam Studio
                  </p>
                </div>
              )}
            </div>

            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                title="Thu gọn Sidebar"
                className="neu-icon-btn w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-[#262b33]"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Profile Avatar Card (Matches reference image aesthetic) */}
          <div
            className={`flex flex-col items-center text-center mb-7 ${
              sidebarOpen ? 'py-2' : 'py-1'
            }`}
          >
            <div className="w-16 h-16 rounded-full p-1 neu-pill mb-2.5 relative">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#262b33] to-slate-500 flex items-center justify-center text-white font-bold text-lg">
                MH
              </div>
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#eef2f7] absolute bottom-0.5 right-0.5" />
            </div>
            {sidebarOpen && (
              <>
                <h2 className="font-bold text-sm text-[#1e232a]">Matthew Hayes</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">ID: 308591433</p>
              </>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-3 w-full">
            {[
              { id: 'home', label: 'OVERVIEW', sub: 'Thống kê', icon: LayoutDashboard },
              { id: 'exams', label: 'ĐỀ KIỂM TRA', sub: 'Môn & Bộ đề', icon: BookOpen },
              { id: 'guide', label: 'AI GUIDE', sub: 'Prompt & HDSD', icon: Sparkles }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={`${item.label} - ${item.sub}`}
                  className={`w-full flex items-center ${
                    sidebarOpen ? 'px-4 py-3.5 gap-3.5 justify-start' : 'p-3.5 justify-center'
                  } rounded-full transition-all duration-200 ${
                    isActive
                      ? 'neu-pill-active text-[#1e232a] font-bold'
                      : 'text-slate-500 hover:text-[#1e232a] font-medium'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-[#262b33] text-white' : 'text-slate-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {sidebarOpen && (
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-xs tracking-wider">{item.label}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Utility Buttons (Matching reference image) */}
        <div
          className={`flex items-center ${
            sidebarOpen ? 'justify-around px-2' : 'flex-col gap-3'
          } pt-6 mt-6 border-t border-slate-200/70 w-full`}
        >
          <button
            onClick={() => triggerToast('Hệ thống đang ở chế độ giao diện Neumorphic Soft UI')}
            className="neu-icon-btn w-10 h-10 rounded-xl flex items-center justify-center text-[#262b33]"
            title="Cài đặt"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetRoot}
            className="neu-icon-btn w-10 h-10 rounded-xl flex items-center justify-center text-[#262b33]"
            title="Làm mới trạng thái"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* MAIN CONTENT CONTAINER                     */}
      {/* ========================================== */}
      <main className="flex-1 neu-shell rounded-[32px] p-5 sm:p-8 overflow-x-hidden flex flex-col gap-6">
        {/* ============================================================ */}
        {/* TAB 1: HOME DASHBOARD (THỐNG KÊ ĐA DẠNG BIỂU ĐỒ)              */}
        {/* ============================================================ */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Overall Data Section */}
            <section className="neu-card rounded-[26px] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#1e232a]">
                    Overall Data • Tổng quan Học tập
                  </h2>
                  <p className="text-xs text-slate-400">
                    Thống kê số bài kiểm tra đã hoàn thành và kết quả điểm số theo thời gian thực
                  </p>
                </div>

                {/* Period Filter: Week / Month / Year */}
                <div className="neu-card-inset p-1 rounded-full flex items-center gap-1">
                  {[
                    { id: 'week', label: 'Theo Tuần' },
                    { id: 'month', label: 'Theo Tháng' },
                    { id: 'year', label: 'Theo Năm' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setStatsPeriod(p.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                        statsPeriod === p.id
                          ? 'bg-[#262b33] text-white shadow-sm'
                          : 'text-slate-500 hover:text-[#262b33]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Metric Cards matching "Overall Data" */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="neu-card rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-1">Đã làm (Bài KT)</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-[#1e232a]">
                        {dashboardStats.totalExamsTaken}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">↑</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full neu-pill flex items-center justify-center text-[#1e232a]">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>

                <div className="neu-card rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-1">Điểm trung bình</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-[#1e232a]">
                        {dashboardStats.avgScore}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">/ 10 ↑</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full neu-pill flex items-center justify-center text-[#1e232a]">
                    <Award className="w-5 h-5" />
                  </div>
                </div>

                <div className="neu-card rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-1">Câu đã giải</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-[#1e232a]">
                        {dashboardStats.totalQuestionsDone}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">↑</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full neu-pill flex items-center justify-center text-[#1e232a]">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>

                <div className="neu-card rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-1">Tỉ lệ chính xác</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-[#1e232a]">
                        {dashboardStats.accuracyRate}%
                      </span>
                      <span className="text-xs font-bold text-emerald-600">↑</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full neu-pill flex items-center justify-center text-[#1e232a]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </section>

            {/* Middle Row: Capsule Bar + Line Chart & Donut Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Columns: Capsule Bar + Line Chart */}
              <section className="lg:col-span-2 neu-card rounded-[26px] p-5 sm:p-6 flex flex-col justify-between">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-[#1e232a]">
                      Biểu đồ Tiến độ & Điểm số
                    </h3>
                    <p className="text-xs text-slate-400">
                      Kết hợp biểu đồ cột (Số bài) và biểu đồ đường (Điểm TB)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setChartMetric('both')}
                      className={`neu-pill px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                        chartMetric === 'both' ? 'text-[#1e232a]' : 'text-slate-400'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <span>Số bài & Điểm</span>
                    </button>
                    <button
                      onClick={() =>
                        setChartMetric((m) => (m === 'score' ? 'both' : 'score'))
                      }
                      className={`neu-pill px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                        chartMetric === 'score' ? 'text-[#1e232a]' : 'text-slate-400'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#1e232a]" />
                      <span>Đường điểm số</span>
                    </button>
                  </div>
                </div>

                {/* SVG + Capsule Bar Hybrid Visualization */}
                <div className="relative pt-4 pb-2">
                  {/* Horizontal Grid Lines */}
                  <div className="space-y-9 text-[11px] text-slate-400 font-medium">
                    {[10, 7.5, 5.0, 2.5, 0].map((mark) => (
                      <div key={mark} className="flex items-center gap-3">
                        <span className="w-7 text-right">{mark}đ</span>
                        <div className="flex-1 border-b border-slate-200/80" />
                      </div>
                    ))}
                  </div>

                  {/* Overlay Bars + SVG Line */}
                  <div className="absolute inset-0 left-10 right-2 top-4 bottom-7 flex items-end justify-around">
                    {/* SVG Smooth Line for Score */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                      viewBox="0 0 600 180"
                      preserveAspectRatio="none"
                    >
                      <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={dashboardStats.series
                          .map((item, idx) => {
                            const x =
                              ((idx + 0.5) / dashboardStats.series.length) * 600;
                            const y = 180 - (item.avgScore / 10) * 165;
                            return `${x},${y}`;
                          })
                          .join(' ')}
                      />
                    </svg>

                    {dashboardStats.series.map((item, idx) => {
                      const scoreHeightPct = Math.min(100, (item.avgScore / 10) * 100);
                      const maxCount = Math.max(
                        ...dashboardStats.series.map((s) => s.count),
                        10
                      );
                      const countTrackPct = Math.min(
                        100,
                        Math.max(35, (item.count / maxCount) * 100)
                      );

                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center h-full justify-end group relative z-10"
                        >
                          {/* Hover Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-9 bg-[#1e232a] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
                            {item.count} đề • TB {item.avgScore}đ
                          </div>

                          {/* Outer Neumorphic Capsule Track (Matching reference image) */}
                          <div
                            style={{ height: `${countTrackPct}%` }}
                            className="w-3.5 sm:w-4 rounded-full bg-gradient-to-b from-slate-200/90 to-slate-300/60 shadow-inner p-0.5 flex items-end transition-all duration-500"
                          >
                            {/* Inner Dark Charcoal Fill Pill */}
                            <div
                              style={{ height: `${scoreHeightPct}%` }}
                              className="w-full rounded-full bg-gradient-to-t from-[#14171c] via-[#262b33] to-slate-600 transition-all duration-500"
                            />
                          </div>

                          <span className="text-[11px] font-semibold text-slate-400 mt-3">
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Right Column: Neumorphic Donut / Pie Chart */}
              <section className="neu-card rounded-[26px] p-5 sm:p-6 flex flex-col justify-between items-center">
                <div className="w-full flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-[#1e232a]">Phổ Điểm (Tỉ lệ)</h3>
                  <span className="neu-pill px-3 py-1 rounded-full text-[11px] font-bold text-slate-500">
                    All Time
                  </span>
                </div>

                {/* Neumorphic Ring Gauge */}
                <div className="relative my-3 w-44 h-44 rounded-full neu-pill flex items-center justify-center p-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    {/* Background Track */}
                    <circle
                      cx="60"
                      cy="60"
                      r="46"
                      fill="none"
                      stroke="#dce3ee"
                      strokeWidth="12"
                    />
                    {/* Segment 1: Xuất sắc (>= 8.5) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="46"
                      fill="none"
                      stroke="#1e232a"
                      strokeWidth="12"
                      strokeDasharray={`${
                        (Number(dashboardStats.distribution.excellentPct) / 100) * 289
                      } 289`}
                      strokeLinecap="round"
                    />
                    {/* Segment 2: Khá Giỏi (7.0 - 8.4) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="46"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="12"
                      strokeDasharray={`${
                        (Number(dashboardStats.distribution.goodPct) / 100) * 289
                      } 289`}
                      strokeDashoffset={`-${
                        (Number(dashboardStats.distribution.excellentPct) / 100) * 289
                      }`}
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="absolute inset-8 rounded-full neu-card-inset flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold text-[#1e232a]">
                      {dashboardStats.avgScore}đ
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Điểm TB
                    </span>
                  </div>
                </div>

                {/* Legend Breakdown */}
                <div className="w-full grid grid-cols-3 gap-2 pt-2 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                      <span className="w-2 h-2 rounded-sm bg-[#1e232a]" />
                      <span>Xuất sắc</span>
                    </div>
                    <p className="font-bold text-sm text-[#1e232a] mt-0.5">
                      {dashboardStats.distribution.excellentPct}%
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                      <span className="w-2 h-2 rounded-sm bg-slate-500" />
                      <span>Khá giỏi</span>
                    </div>
                    <p className="font-bold text-sm text-[#1e232a] mt-0.5">
                      {dashboardStats.distribution.goodPct}%
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                      <span className="w-2 h-2 rounded-sm bg-slate-300" />
                      <span>Cần cố gắng</span>
                    </div>
                    <p className="font-bold text-sm text-[#1e232a] mt-0.5">
                      {dashboardStats.distribution.averagePct}%
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Bottom Section: Overview of Recent Exam Works */}
            <section className="neu-card rounded-[26px] p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#1e232a]">
                  Overview of Works • Lịch sử Làm bài Gần đây
                </h3>
                <button
                  onClick={() => setActiveTab('exams')}
                  className="neu-pill px-3.5 py-1.5 rounded-full text-xs font-bold text-[#262b33] hover:underline"
                >
                  Làm đề mới →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[11px] text-slate-400 uppercase border-b border-slate-200/80">
                      <th className="py-3 px-3">STT</th>
                      <th className="py-3 px-3">Tên bộ đề</th>
                      <th className="py-3 px-3">Môn học</th>
                      <th className="py-3 px-3">Thời gian nộp</th>
                      <th className="py-3 px-3 text-center">Kết quả câu</th>
                      <th className="py-3 px-3 text-right">Điểm số</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 text-xs sm:text-sm">
                    {attempts.slice(0, 6).map((att, idx) => (
                      <tr
                        key={att.id}
                        className="hover:bg-white/40 transition-colors"
                      >
                        <td className="py-3.5 px-3 font-semibold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-[#1e232a]">
                          {att.examTitle}
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 font-medium">
                          {att.subjectName}
                        </td>
                        <td className="py-3.5 px-3 text-slate-400">
                          {att.timestamp}
                        </td>
                        <td className="py-3.5 px-3 text-center font-semibold text-slate-600">
                          {att.correctCount}/{att.totalQuestions} câu
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="neu-pill px-3 py-1 rounded-full font-bold text-[#1e232a]">
                            {att.score} đ
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: ĐỀ KIỂM TRA (BREADCRUMB: root > tên môn > tên bộ đề)  */}
        {/* ============================================================ */}
        {activeTab === 'exams' && (
          <div key={viewResetCounter} className="space-y-6 flex-1 flex flex-col">
            {/* INTERACTIVE BREADCRUMB HEADER */}
            <header className="neu-card rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center flex-wrap gap-1.5 text-sm sm:text-base font-bold">
                {/* 'root' link */}
                <button
                  onClick={handleResetRoot}
                  className="px-3 py-1 rounded-xl hover:bg-white/70 text-[#1e232a] transition-all flex items-center gap-1.5"
                  title="Nhấn vào root để về hoặc reset trang gốc"
                >
                  <span>root</span>
                </button>

                {/* '> tên môn' */}
                {currentSubject && examViewMode !== 'root' && (
                  <>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                    <button
                      onClick={() =>
                        handleNavigateToSubject(
                          currentSubject.id,
                          examViewMode === 'subject'
                        )
                      }
                      className="px-3 py-1 rounded-xl hover:bg-white/70 transition-all flex items-center gap-2"
                      title="Nhấn vào tên môn để về hoặc reset trang môn học"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: currentSubject.color }}
                      />
                      <span>{currentSubject.name}</span>
                    </button>
                  </>
                )}

                {/* '> tên bộ đề' (in examDetail, quizActive, quizResult) */}
                {currentExam &&
                  ['examDetail', 'quizActive', 'quizResult'].includes(examViewMode) && (
                    <>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                      <button
                        onClick={() =>
                          handleNavigateToExamDetail(
                            currentExam.id,
                            examViewMode === 'examDetail'
                          )
                        }
                        className="px-3 py-1 rounded-xl bg-white/60 hover:bg-white text-[#1e232a] transition-all truncate max-w-xs sm:max-w-md"
                        title="Nhấn vào tên bộ đề để reset trang tổng quan bộ đề"
                      >
                        {currentExam.title}
                      </button>
                    </>
                  )}

                {/* '> tên bộ đề mới ("Chưa có tiêu đề")' in examEditor */}
                {examViewMode === 'examEditor' && (
                  <>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                    <button
                      onClick={() => {
                        if (isEditingExistingExam) {
                          handleOpenEditExistingExam();
                        } else {
                          handleOpenCreateExam();
                        }
                        triggerToast('Đã đặt lại trình soạn thảo đề');
                      }}
                      className="px-3 py-1 rounded-xl bg-white/70 text-[#1e232a] transition-all truncate max-w-xs sm:max-w-md"
                    >
                      {editingExamTitle.trim() || 'Chưa có tiêu đề'}
                    </button>
                  </>
                )}
              </div>

              {/* Contextual Action on the Right of Header */}
              <div className="flex items-center gap-2.5">
                {examViewMode === 'root' && (
                  <button
                    onClick={() => setShowCreateSubjectForm((prev) => !prev)}
                    className="neu-dark-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo môn học</span>
                  </button>
                )}

                {examViewMode === 'subject' && (
                  <button
                    onClick={handleOpenCreateExam}
                    className="neu-dark-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo bộ đề</span>
                  </button>
                )}
              </div>
            </header>

            {/* ==================================================== */}
            {/* VIEW 1: ROOT - DANH SÁCH MÔN HỌC (LƯỚI 3 CỘT N DÒNG) */}
            {/* ==================================================== */}
            {examViewMode === 'root' && (
              <div className="space-y-6">
                {/* Create Subject Drawer / Panel */}
                {showCreateSubjectForm && (
                  <form
                    onSubmit={handleCreateSubject}
                    className="neu-card rounded-2xl p-5 space-y-4 border border-white"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm sm:text-base text-[#1e232a]">
                        Tạo môn học mới
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowCreateSubjectForm(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">
                          Tên môn học
                        </label>
                        <input
                          type="text"
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          placeholder="VD: Lập trình Hướng đối tượng..."
                          className="w-full px-4 py-2.5 rounded-xl neu-card-inset text-sm font-medium focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">
                          Chọn ô màu hiển thị theo môn
                        </label>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {SUBJECT_COLORS.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setNewSubjectColor(c.hex)}
                              title={c.name}
                              className={`w-8 h-8 rounded-xl transition-transform flex items-center justify-center ${
                                newSubjectColor === c.hex
                                  ? 'scale-110 ring-2 ring-offset-2 ring-[#262b33]'
                                  : 'opacity-80 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: c.hex }}
                            >
                              {newSubjectColor === c.hex && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateSubjectForm(false)}
                        className="neu-pill px-4 py-2 rounded-xl text-xs font-bold text-slate-600"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="neu-dark-btn px-5 py-2 rounded-xl text-xs font-bold"
                      >
                        Lưu môn học
                      </button>
                    </div>
                  </form>
                )}

                {/* 3-Column x N-Row Subject Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {subjects.map((sub) => {
                    const subExams = exams.filter((e) => e.subjectId === sub.id);
                    const totalQ = subExams.reduce(
                      (acc, e) => acc + e.questions.length,
                      0
                    );
                    return (
                      <div
                        key={sub.id}
                        onClick={() => handleNavigateToSubject(sub.id)}
                        className="neu-card rounded-[24px] p-5 cursor-pointer hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-md"
                              style={{ backgroundColor: sub.color }}
                            >
                              {sub.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="neu-pill px-3 py-1 rounded-full text-[11px] font-bold text-slate-500">
                              {subExams.length} bộ đề
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-[#1e232a] group-hover:text-black mb-1">
                            {sub.name}
                          </h3>
                          <p className="text-xs text-slate-400">
                            Tổng cộng {totalQ} câu hỏi trắc nghiệm
                          </p>
                        </div>

                        <div className="mt-5 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs font-bold text-[#262b33]">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: sub.color }}
                            />
                            Mở danh sách đề
                          </span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* VIEW 2: SUBJECT - DANH SÁCH CÁC BỘ ĐỀ ĐÃ TẠO         */}
            {/* ==================================================== */}
            {examViewMode === 'subject' && currentSubject && (
              <div className="space-y-5">
                {exams.filter((e) => e.subjectId === currentSubject.id).length ===
                0 ? (
                  <div className="neu-card rounded-3xl p-12 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl neu-pill mx-auto flex items-center justify-center text-slate-400">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-base text-[#1e232a]">
                      Môn {currentSubject.name} chưa có bộ đề nào
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Hãy nhấn nút "Tạo bộ đề" để soạn câu hỏi trực tiếp hoặc dán nhanh dữ liệu TXT / JSON.
                    </p>
                    <button
                      onClick={handleOpenCreateExam}
                      className="neu-dark-btn px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tạo bộ đề đầu tiên</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {exams
                      .filter((e) => e.subjectId === currentSubject.id)
                      .map((exam) => {
                        const examAttempts = attempts.filter(
                          (a) => a.examId === exam.id
                        );
                        return (
                          <div
                            key={exam.id}
                            onClick={() => handleNavigateToExamDetail(exam.id)}
                            className="neu-card rounded-[24px] p-5 cursor-pointer hover:-translate-y-1 transition-all flex flex-col justify-between group"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <span
                                  className="px-3 py-1 rounded-full text-[11px] font-bold text-white"
                                  style={{ backgroundColor: currentSubject.color }}
                                >
                                  {exam.questions.length} câu hỏi
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {exam.createdAt}
                                </span>
                              </div>

                              <h4 className="font-bold text-base text-[#1e232a] mb-2">
                                {exam.title}
                              </h4>
                              <p className="text-xs text-slate-400">
                                Đã làm {examAttempts.length} lượt • Nhấn để xem câu hỏi hoặc bắt đầu kiểm tra
                              </p>
                            </div>

                            <div className="mt-5 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs font-bold text-[#262b33]">
                              <span>Xem tổng quan & Làm đề</span>
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* ==================================================== */}
            {/* VIEW 3A: EXAM DETAIL (TỔNG QUAN BỘ ĐỀ & SWITCH ĐÁP ÁN)*/}
            {/* ==================================================== */}
            {examViewMode === 'examDetail' && currentExam && (
              <div className="space-y-6">
                {/* Overview Card */}
                <div className="neu-card rounded-[26px] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{
                          backgroundColor: currentSubject?.color || '#262b33'
                        }}
                      >
                        {currentSubject?.name}
                      </span>
                      <span className="neu-pill px-3 py-1 rounded-full text-xs font-bold text-[#1e232a]">
                        Tổng số: {currentExam.questions.length} câu
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#1e232a]">
                      {currentExam.title}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Mặc định đáp án được ẩn để bạn tự ôn tập. Bật công tắc "Hiện đáp án" nếu muốn tra cứu nhanh.
                    </p>
                  </div>

                  {/* Action Controls: Switch Show Answer, History, Edit, Start Quiz */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Switch Button Hiện đáp án (Default OFF) */}
                    <button
                      onClick={() => setShowAnswersSwitch((prev) => !prev)}
                      className={`neu-pill px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs font-bold transition-all ${
                        showAnswersSwitch ? 'text-emerald-700' : 'text-slate-600'
                      }`}
                    >
                      {showAnswersSwitch ? (
                        <Eye className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      )}
                      <span>Hiện đáp án</span>
                      <div
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                          showAnswersSwitch ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${
                            showAnswersSwitch ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </button>

                    {/* Xem lịch sử làm bài */}
                    <button
                      onClick={() => setShowHistoryModal((prev) => !prev)}
                      className="neu-pill px-4 py-2.5 rounded-2xl text-xs font-bold text-[#262b33] flex items-center gap-2 hover:bg-white/70"
                    >
                      <History className="w-4 h-4" />
                      <span>Lịch sử làm bài</span>
                    </button>

                    {/* Sửa bộ đề */}
                    <button
                      onClick={handleOpenEditExistingExam}
                      className="neu-pill px-4 py-2.5 rounded-2xl text-xs font-bold text-[#262b33] flex items-center gap-2 hover:bg-white/70"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Sửa đề</span>
                    </button>

                    {/* Nút Làm đề */}
                    <button
                      onClick={() => {
                        setQuizQuestionCountInput(
                          String(Math.min(25, currentExam.questions.length))
                        );
                        setShowQuizConfigModal(true);
                      }}
                      className="neu-dark-btn px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Làm bài kiểm tra</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible Attempt History Panel for this Exam */}
                {showHistoryModal && (
                  <div className="neu-card rounded-2xl p-5 space-y-3 border border-white">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-[#1e232a] flex items-center gap-2">
                        <History className="w-4 h-4" />
                        <span>Lịch sử làm bài của bộ đề này</span>
                      </h3>
                      <button
                        onClick={() => setShowHistoryModal(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {attempts.filter((a) => a.examId === currentExam.id).length ===
                    0 ? (
                      <p className="text-xs text-slate-400 py-3">
                        Bạn chưa làm bài kiểm tra nào thuộc bộ đề này.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {attempts
                          .filter((a) => a.examId === currentExam.id)
                          .map((att, i) => (
                            <div
                              key={att.id}
                              className="neu-card-inset px-4 py-2.5 rounded-xl flex items-center justify-between text-xs"
                            >
                              <span className="font-bold text-[#1e232a]">
                                Lần #{i + 1} • {att.timestamp}
                              </span>
                              <span className="text-slate-500">
                                Đúng {att.correctCount}/{att.totalQuestions} câu
                              </span>
                              <span className="neu-pill px-3 py-1 rounded-full font-bold text-[#1e232a]">
                                {att.score} điểm
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* List of Questions in Exam Overview */}
                <div className="space-y-4">
                  {currentExam.questions.map((q, idx) => (
                    <QuestionCard
                      key={q.id || idx}
                      index={idx}
                      question={q}
                      mode="preview"
                      showAnswer={showAnswersSwitch}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* VIEW 3B: CREATE / EDIT EXAM (SPLIT RENDER & EDITOR)   */}
            {/* ==================================================== */}
            {examViewMode === 'examEditor' && (
              <div className="space-y-5 flex-1 flex flex-col">
                {/* Top Title & Save Bar */}
                <div className="neu-card rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex-1 flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                    <input
                      type="text"
                      value={editingExamTitle}
                      onChange={(e) => setEditingExamTitle(e.target.value)}
                      placeholder="Nhập tên bộ đề mới (Mặc định: Chưa có tiêu đề)..."
                      className="w-full px-4 py-2 rounded-xl neu-card-inset text-sm font-bold text-[#1e232a] focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2.5 justify-end">
                    <span className="neu-pill px-3 py-2 rounded-xl text-xs font-bold text-slate-500">
                      {editorQuestions.length} câu
                    </span>
                    <button
                      onClick={handleSaveExamFromEditor}
                      className="neu-dark-btn px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Lưu bộ đề</span>
                    </button>
                  </div>
                </div>

                {/* SPLIT PANE: RENDER (LEFT) & TXT/JSON EDITOR (RIGHT) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                  {/* LEFT PANE: RENDER COMPONENT */}
                  <div className="neu-card rounded-[26px] p-5 flex flex-col h-[640px] relative">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-[#1e232a]">
                          Render • Trực quan Câu hỏi
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Click vào câu hỏi/đáp án để sửa, di chuột vào khoảng giữa để chèn (+)
                        </p>
                      </div>

                      {/* "All" Button to open Question Jump Dialog */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowAllQuestionsDialog((prev) => !prev)
                          }
                          className="neu-pill px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#1e232a] flex items-center gap-1.5 hover:bg-white"
                        >
                          <List className="w-3.5 h-3.5" />
                          <span>All ({editorQuestions.length})</span>
                        </button>

                        {/* Small Dialog listing all created questions */}
                        {showAllQuestionsDialog && (
                          <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto neu-shell rounded-2xl p-3.5 z-30 shadow-2xl border border-white">
                            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200">
                              <span className="text-xs font-bold text-[#1e232a]">
                                Danh sách câu hỏi ({editorQuestions.length})
                              </span>
                              <button
                                onClick={() => setShowAllQuestionsDialog(false)}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mb-3">
                              {editorQuestions.map((q, idx) => (
                                <button
                                  key={q.id}
                                  onClick={() =>
                                    handleFocusQuestionFromAllDialog(q.id)
                                  }
                                  className="neu-pill py-1.5 rounded-lg text-xs font-bold text-[#262b33] hover:bg-[#262b33] hover:text-white transition-colors"
                                >
                                  Câu {idx + 1}
                                </button>
                              ))}
                            </div>
                            <div className="space-y-1.5 border-t border-slate-200/70 pt-2">
                              {editorQuestions.map((q, idx) => (
                                <button
                                  key={`list-${q.id}`}
                                  onClick={() =>
                                    handleFocusQuestionFromAllDialog(q.id)
                                  }
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/80 text-xs truncate flex items-center gap-2"
                                >
                                  <span className="font-bold text-slate-500">
                                    #{idx + 1}
                                  </span>
                                  <span className="truncate text-[#1e232a]">
                                    {q.ask || '(Chưa có nội dung)'}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scrollable Questions List with Hover "+" Insertion Zones */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-1">
                      {/* Top Insert Zone */}
                      <div className="group py-1.5 flex items-center justify-center">
                        <button
                          onClick={() => handleInsertQuestionAt(0)}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#262b33] text-white text-[11px] font-bold shadow"
                          title="Chèn câu hỏi mới lên đầu"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Chèn câu hỏi vào vị trí đầu</span>
                        </button>
                      </div>

                      {editorQuestions.map((q, idx) => (
                        <React.Fragment key={q.id || idx}>
                          <QuestionCard
                            index={idx}
                            question={q}
                            mode="editor"
                            isFocused={focusedQuestionId === q.id}
                            cardRef={(el) => {
                              questionRefs.current[q.id] = el;
                            }}
                            onUpdateQuestion={(updatedQ) => {
                              const next = editorQuestions.map((item, i) =>
                                i === idx ? updatedQ : item
                              );
                              syncQuestionsToRawText(next);
                            }}
                            onDeleteQuestion={() => {
                              const next = editorQuestions.filter(
                                (_, i) => i !== idx
                              );
                              syncQuestionsToRawText(next);
                            }}
                          />

                          {/* Hover Gap Between Questions with "+" Button */}
                          <div className="group py-2 flex items-center justify-center relative">
                            <div className="w-full border-t border-dashed border-transparent group-hover:border-slate-300 transition-colors" />
                            <button
                              onClick={() => handleInsertQuestionAt(idx + 1)}
                              className="opacity-0 group-hover:opacity-100 focus:opacity-100 absolute transition-all duration-200 flex items-center gap-1 px-3 py-1 rounded-full bg-[#262b33] text-white text-[11px] font-bold shadow-md hover:scale-105"
                              title={`Chèn câu mới vào sau câu ${idx + 1}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Chèn câu mới tại đây</span>
                            </button>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* RIGHT PANE: RAW EDITOR (TXT / JSON TABS) */}
                  <div className="neu-card rounded-[26px] p-5 flex flex-col h-[640px]">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-[#1e232a]">
                          Editor • Đồng bộ Realtime
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Dán hoặc chỉnh sửa định dạng TXT hoặc JSON, Render sẽ cập nhật tức thì
                        </p>
                      </div>

                      {/* Small Header Tabs: TXT | JSON */}
                      <div className="neu-card-inset p-1 rounded-xl flex items-center gap-1">
                        <button
                          onClick={() => handleSwitchEditorTab('txt')}
                          className={`px-3.5 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                            editorFormatTab === 'txt'
                              ? 'bg-[#262b33] text-white shadow'
                              : 'text-slate-500 hover:text-[#262b33]'
                          }`}
                        >
                          txt
                        </button>
                        <button
                          onClick={() => handleSwitchEditorTab('json')}
                          className={`px-3.5 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                            editorFormatTab === 'json'
                              ? 'bg-[#262b33] text-white shadow'
                              : 'text-slate-500 hover:text-[#262b33]'
                          }`}
                        >
                          json
                        </button>
                      </div>
                    </div>

                    {/* Syntax Format Hint */}
                    <div className="mb-2.5 px-3 py-2 rounded-xl bg-white/50 text-[11px] text-slate-500 flex items-center justify-between">
                      {editorFormatTab === 'txt' ? (
                        <span>
                          Cú pháp: <code>ask : Câu hỏi</code> |{' '}
                          <code>ans. Sai</code> | <code>ans.* Đúng</code>
                        </span>
                      ) : (
                        <span>
                          Cú pháp mảng JSON: <code>{`[{"ask": "", "answer": [{"false": ""}, {"true": ""}]}]`}</code>
                        </span>
                      )}
                      {parseError ? (
                        <span className="text-amber-600 font-bold">
                          Đang chờ cú pháp chuẩn...
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Đồng bộ
                        </span>
                      )}
                    </div>

                    {/* Monospace Code Textarea */}
                    <textarea
                      value={rawTextCode}
                      onChange={(e) => handleRawEditorChange(e.target.value)}
                      spellCheck={false}
                      placeholder={
                        editorFormatTab === 'txt'
                          ? 'ask : Nội dung câu hỏi\nans. Lựa chọn sai\nans.* Lựa chọn Đúng\nans. Lựa chọn sai\nans. Lựa chọn sai'
                          : '[\n\t{\n\t\t"ask": "",\n\t\t"answer": [\n\t\t\t{"false": ""},\n\t\t\t{"true": ""}\n\t\t]\n\t}\n]'
                      }
                      className="flex-1 w-full p-4 rounded-2xl neu-card-inset font-mono text-xs sm:text-sm text-[#1e232a] leading-relaxed focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* VIEW 4: ACTIVE QUIZ TAKING REUSING QUESTION COMPONENT */}
            {/* ==================================================== */}
            {examViewMode === 'quizActive' && currentExam && (
              <div className="space-y-6">
                {/* Sticky Quiz Control Bar */}
                <div className="neu-card rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 sticky top-2 z-20">
                  <div className="flex items-center gap-4">
                    <div className="neu-pill px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-[#1e232a]">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>
                        {String(Math.floor(quizElapsedSec / 60)).padStart(2, '0')}:
                        {String(quizElapsedSec % 60).padStart(2, '0')}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1e232a]">
                        Đã chọn: {Object.keys(quizUserAnswers).length} /{' '}
                        {activeQuizQuestions.length} câu
                      </p>
                      <div className="w-36 sm:w-48 h-2 rounded-full bg-slate-200 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-[#262b33] transition-all"
                          style={{
                            width: `${
                              (Object.keys(quizUserAnswers).length /
                                Math.max(1, activeQuizQuestions.length)) *
                              100
                            }%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 relative">
                    <button
                      onClick={() => setShowQuizAllDialog((p) => !p)}
                      className="neu-pill px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <List className="w-4 h-4" />
                      <span>All ({activeQuizQuestions.length})</span>
                    </button>

                    {showQuizAllDialog && (
                      <div className="absolute right-28 top-12 w-64 neu-shell rounded-2xl p-3.5 z-30 shadow-xl">
                        <p className="text-xs font-bold mb-2">
                          Chuyển nhanh đến câu:
                        </p>
                        <div className="grid grid-cols-5 gap-1.5 max-h-56 overflow-y-auto">
                          {activeQuizQuestions.map((q, idx) => {
                            const answered = Boolean(quizUserAnswers[q.id]);
                            return (
                              <button
                                key={q.id}
                                onClick={() =>
                                  handleFocusQuestionFromAllDialog(q.id)
                                }
                                className={`py-1.5 rounded-lg text-xs font-bold ${
                                  answered
                                    ? 'bg-[#262b33] text-white'
                                    : 'neu-pill text-slate-600'
                                }`}
                              >
                                {idx + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleSubmitQuiz}
                      className="neu-dark-btn px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Nộp bài</span>
                    </button>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                  {activeQuizQuestions.map((q, idx) => (
                    <QuestionCard
                      key={q.id}
                      index={idx}
                      question={q}
                      mode="quiz"
                      selectedOptionId={quizUserAnswers[q.id] || null}
                      onSelectOption={(optId) =>
                        setQuizUserAnswers((prev) => ({
                          ...prev,
                          [q.id]: optId
                        }))
                      }
                      isFocused={focusedQuestionId === q.id}
                      cardRef={(el) => {
                        questionRefs.current[q.id] = el;
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* VIEW 5: QUIZ RESULT + ATTEMPT HISTORY                 */}
            {/* ==================================================== */}
            {examViewMode === 'quizResult' && lastQuizResult && (
              <div className="space-y-6">
                {/* Score Summary Banner */}
                <div className="neu-card rounded-[28px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-24 h-24 rounded-full neu-pill flex flex-col items-center justify-center border-4 border-[#262b33]">
                      <span className="text-2xl font-bold text-[#1e232a]">
                        {lastQuizResult.score}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Điểm / 10
                      </span>
                    </div>
                    <div>
                      <span className="neu-pill px-3 py-1 rounded-full text-xs font-bold text-emerald-700">
                        Hoàn thành bài kiểm tra
                      </span>
                      <h2 className="text-xl font-bold text-[#1e232a] mt-2">
                        {lastQuizResult.examTitle}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Trả lời đúng{' '}
                        <strong className="text-[#1e232a]">
                          {lastQuizResult.correctCount}/
                          {lastQuizResult.totalQuestions}
                        </strong>{' '}
                        câu • Thời gian: {lastQuizResult.durationSec} giây
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        handleNavigateToExamDetail(currentExam.id)
                      }
                      className="neu-pill px-4 py-2.5 rounded-xl text-xs font-bold text-[#262b33] flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Về tổng quan đề</span>
                    </button>
                    <button
                      onClick={() => setShowQuizConfigModal(true)}
                      className="neu-dark-btn px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Làm lại đề</span>
                    </button>
                  </div>
                </div>

                {/* Previous Attempt History Table for this Exam */}
                <div className="neu-card rounded-2xl p-5 space-y-3">
                  <h3 className="font-bold text-sm sm:text-base text-[#1e232a] flex items-center gap-2">
                    <History className="w-4 h-4" />
                    <span>Lịch sử làm bài của bộ đề này</span>
                  </h3>
                  <div className="space-y-2">
                    {attempts
                      .filter((a) => a.examId === currentExam?.id)
                      .map((att, idx) => (
                        <div
                          key={att.id}
                          className={`px-4 py-3 rounded-xl flex items-center justify-between text-xs sm:text-sm ${
                            att.id === lastQuizResult.id
                              ? 'bg-white font-bold border border-[#262b33]/30 shadow-sm'
                              : 'neu-card-inset text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>#{idx + 1}</span>
                            <span>{att.timestamp}</span>
                            {att.id === lastQuizResult.id && (
                              <span className="px-2 py-0.5 rounded-md bg-[#262b33] text-white text-[10px]">
                                Vừa xong
                              </span>
                            )}
                          </div>
                          <span>
                            Đúng {att.correctCount}/{att.totalQuestions} câu
                          </span>
                          <span className="font-bold text-[#1e232a]">
                            {att.score} điểm
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Detailed Answer Review */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm sm:text-base text-[#1e232a]">
                    Chi tiết đáp án bài làm
                  </h3>
                  {activeQuizQuestions.map((q, idx) => (
                    <QuestionCard
                      key={q.id}
                      index={idx}
                      question={q}
                      mode="result"
                      selectedOptionId={quizUserAnswers[q.id] || null}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: GUIDE (HƯỚNG DẪN SỬ DỤNG & PROMPT JSON CỐ ĐỊNH)        */}
        {/* ============================================================ */}
        {activeTab === 'guide' && (
          <div className="space-y-6 animate-fadeIn">
            <section className="neu-card rounded-[26px] p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl neu-pill flex items-center justify-center text-[#1e232a]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#1e232a]">
                    Hướng dẫn Tạo Bộ Đề Tự Động với AI
                  </h2>
                  <p className="text-xs text-slate-400">
                    Chỉ mất 30 giây để biến file PDF/Word/Slide bài giảng thành bộ đề trắc nghiệm tương tác
                  </p>
                </div>
              </div>

              {/* Step-by-Step Short Guide with Linked Text */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="neu-card-inset p-4 rounded-2xl space-y-2">
                  <span className="neu-pill px-2.5 py-1 rounded-lg text-xs font-bold">
                    Bước 1 • Truy cập AI
                  </span>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                    Mở các nền tảng AI hỗ trợ đọc tài liệu như{' '}
                    <a
                      href="https://gemini.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#1e232a] underline inline-flex items-center gap-0.5 hover:text-blue-600"
                    >
                      Google Gemini <ExternalLink className="w-3 h-3" />
                    </a>
                    ,{' '}
                    <a
                      href="https://chatgpt.com"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#1e232a] underline inline-flex items-center gap-0.5 hover:text-blue-600"
                    >
                      ChatGPT <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    hoặc{' '}
                    <a
                      href="https://claude.ai"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#1e232a] underline inline-flex items-center gap-0.5 hover:text-blue-600"
                    >
                      Claude AI <ExternalLink className="w-3 h-3" />
                    </a>
                    .
                  </p>
                </div>

                <div className="neu-card-inset p-4 rounded-2xl space-y-2">
                  <span className="neu-pill px-2.5 py-1 rounded-lg text-xs font-bold">
                    Bước 2 • Đính kèm File
                  </span>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                    Nhấn biểu tượng dấu cộng <strong>(+)</strong> trên khung chat của AI để{' '}
                    <strong>đính kèm file tài liệu</strong> (PDF, DOCX, TXT hoặc ảnh chụp đề cương) mà bạn muốn tạo câu hỏi.
                  </p>
                </div>

                <div className="neu-card-inset p-4 rounded-2xl space-y-2">
                  <span className="neu-pill px-2.5 py-1 rounded-lg text-xs font-bold">
                    Bước 3 • Dán Prompt & Nhập đề
                  </span>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                    Nhấn nút <strong>Sao chép Prompt</strong> bên dưới, dán vào khung chat AI. Sau đó copy kết quả JSON/TXT từ AI dán thẳng vào tab{' '}
                    <button
                      onClick={() => setActiveTab('exams')}
                      className="font-bold text-[#1e232a] underline"
                    >
                      Đề kiểm tra
                    </button>
                    .
                  </p>
                </div>
              </div>
            </section>

            {/* Fixed Prompt Box with Copy Button */}
            <section className="neu-card rounded-[26px] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-[#1e232a]">
                    Khung Prompt JSON Chuẩn Cố Định
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sao chép nguyên văn khung lệnh này và gửi kèm tài liệu của bạn cho AI
                  </p>
                </div>

                <button
                  onClick={handleCopyPrompt}
                  className="neu-dark-btn px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Sao chép Prompt</span>
                </button>
              </div>

              <pre className="neu-card-inset p-5 rounded-2xl text-xs sm:text-sm font-mono text-[#1e232a] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {FIXED_AI_PROMPT}
              </pre>
            </section>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* DIALOG CẤU HÌNH LÀM BÀI KIỂM TRA (25, 32, 40 PRESETS)         */}
      {/* ============================================================ */}
      {showQuizConfigModal && currentExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="neu-shell rounded-[28px] max-w-md w-full p-6 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base sm:text-lg text-[#1e232a]">
                Cấu hình Bài kiểm tra
              </h3>
              <button
                onClick={() => setShowQuizConfigModal(false)}
                className="neu-icon-btn w-8 h-8 rounded-xl flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Bộ đề: <strong className="text-[#1e232a]">{currentExam.title}</strong> (Hiện có{' '}
                {currentExam.questions.length} câu gốc)
              </p>
              <label className="block text-xs font-bold text-[#1e232a] pt-2">
                Nhập số câu muốn lấy ra để làm:
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={quizQuestionCountInput}
                onChange={(e) => setQuizQuestionCountInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl neu-card-inset text-base font-bold text-[#1e232a] focus:outline-none"
              />
            </div>

            {/* Quick-Select Fixed Number Buttons: 25, 32, 40 */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">
                Chọn nhanh số lượng câu cố định:
              </span>
              <div className="grid grid-cols-4 gap-2.5">
                {[25, 32, 40].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuizQuestionCountInput(String(num))}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                      Number(quizQuestionCountInput) === num
                        ? 'bg-[#262b33] text-white shadow-md'
                        : 'neu-pill text-[#1e232a] hover:bg-white'
                    }`}
                  >
                    {num} câu
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setQuizQuestionCountInput(String(currentExam.questions.length))
                  }
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    Number(quizQuestionCountInput) === currentExam.questions.length
                      ? 'bg-[#262b33] text-white shadow-md'
                      : 'neu-pill text-[#1e232a] hover:bg-white'
                  }`}
                >
                  Tất cả ({currentExam.questions.length})
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => setShowQuizConfigModal(false)}
                className="neu-pill px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleStartQuiz}
                className="neu-dark-btn px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Làm bài ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}