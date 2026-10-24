#!/bin/bash
set -e

# 1. Sửa lỗi HEX trong ExamEditorScreen
python3 - << 'PYEOF'
p = 'src/features/exam/ExamEditorScreen.tsx'
s = open(p).read()
s = s.replace("bg-[#262b33] text-white dark:bg-white dark:text-[#262b33]", "bg-ink-strong text-app")
open(p, 'w').write(s)
PYEOF

# 2. Sửa lỗi màu nút Preset trong QuizSetupDialog (Dark Mode bị chìm)
python3 - << 'PYEOF'
p = 'src/features/quiz/QuizSetupDialog.tsx'
s = open(p).read()
s = s.replace("bg-ink-strong text-white shadow-md", "bg-ink-strong text-app shadow-md")
open(p, 'w').write(s)
PYEOF

# 3. Sửa lỗi màu nút Period trong DashboardScreen (Dark Mode bị chìm)
python3 - << 'PYEOF'
p = 'src/features/dashboard/DashboardScreen.tsx'
s = open(p).read()
s = s.replace("bg-ink-strong text-white shadow-sm", "bg-ink-strong text-app shadow-sm")
open(p, 'w').write(s)
PYEOF

# 4. Sửa ESLint warning trong useQuiz.ts
python3 - << 'PYEOF'
p = 'src/hooks/useQuiz.ts'
s = open(p).read()
s = s.replace("}, [examId, navigate, showToast]);", "}, [examId, navigate, showToast, searchParams]);")
open(p, 'w').write(s)
PYEOF

echo "✅ Đã sửa xong toàn bộ!"
