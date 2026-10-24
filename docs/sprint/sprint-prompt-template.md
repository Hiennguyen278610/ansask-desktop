═══════════════════════════════════════════════════════
SPRINT [N] — [TÊN]
═══════════════════════════════════════════════════════

CONTEXT:
[2-3 dòng mô tả state hiện tại]

GOAL:
[1 câu duy nhất, measurable]

TASKS:
[Mỗi task mã SNN-TNN (ví dụ S03-T04), một action cụ thể; ghi rõ Thực thi bởi: subagent codex; mục tiêu, nhóm/phụ thuộc, file, truy vết, prompt, acceptance và lệnh kiểm tra. Task UI chỉ dùng token light/dark từ Sprint 00, không hex trực tiếp. Lệnh kiểm tra FE: pnpm build, pnpm lint, pnpm test theo hợp đồng Sprint 00.]

ACCEPTANCE:
[checklist verify được, KHÔNG subjective]

───────────────────────────────────────────────────────
🛑 STOP CONDITIONS (DỪNG NGAY khi đạt 1 trong các điều này)
───────────────────────────────────────────────────────
- Tất cả ACCEPTANCE pass → DỪNG, báo "SPRINT DONE"
- Retry 1 task quá 2 lần mà vẫn fail → DỪNG, escalate
- Phát hiện task cần design decision không có trong spec → DỪNG, hỏi
- Cần thêm dependency ngoài list đã cho → DỪNG, hỏi
- Task vượt quá 30 phút ước tính → DỪNG, chia nhỏ lại

───────────────────────────────────────────────────────
🔁 RETRY BUDGET (giới hạn số lần thử)
───────────────────────────────────────────────────────
- Mỗi task: tối đa 2 lần thử
- Mỗi lần thử: phải thay đổi approach, KHÔNG được lặp y hệt
- Sau lần 2 fail: DỪNG task đó, chuyển sang task khác
- Cuối sprint: list ra các task chưa xong + lý do

───────────────────────────────────────────────────────
🚨 ESCALATION TRIGGERS (khi nào hỏi user)
───────────────────────────────────────────────────────
DỪNG và hỏi user khi:
1. Lỗi không rõ nguyên nhân sau 2 lần debug
2. Cần chọn giữa 2 approach (A vs B) mà spec không nói
3. Cần thay đổi kiến trúc hiện tại (folder structure, store shape)
4. Phát hiện bug ở sprint trước ảnh hưởng sprint này
5. Cần user test thủ công (visual, UX, performance)

───────────────────────────────────────────────────────
🚫 OUT OF SCOPE (KHÔNG được làm)
───────────────────────────────────────────────────────
- KHÔNG refactor code ngoài file list ở TASKS
- KHÔNG thêm feature ngoài GOAL
- KHÔNG đổi UI/UX ngoài spec
- KHÔNG optimize premature (chỉ làm khi ACCEPTANCE yêu cầu)
- KHÔNG viết test (trừ khi task yêu cầu rõ)
- KHÔNG update README/docs (trừ khi task yêu cầu)

───────────────────────────────────────────────────────
📤 HANDOFF FORMAT (khi DỪNG, báo cáo theo format này)
───────────────────────────────────────────────────────

STATUS: [DONE | PARTIAL | BLOCKED | NEED_INPUT]
SPRINT: [N]

✅ COMPLETED:
- [task 1]: [file changed]
- [task 2]: [file changed]

❌ FAILED (nếu có):
- [task]: [lỗi gì] | [đã thử gì] | [cần gì từ user]

🤔 NEED_INPUT (nếu có):
- Câu hỏi 1: [mô tả] | Option A: [...] | Option B: [...]
- Câu hỏi 2: ...

📋 NEXT ACTION:
- Nếu DONE → "Ready for sprint N+1, paste next prompt"
- Nếu BLOCKED → "Waiting for user response on X"
- Nếu PARTIAL → "Continue task Y after user confirms"

═══════════════════════════════════════════════════════
