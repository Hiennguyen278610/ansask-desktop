export const STEPS = [
  {
    title: 'Bước 1:',
    content: 'Mở các nền tảng AI hỗ trợ đọc tài liệu như Gemini , ChatGPT , Claude  hoặc DeepSeek .',
  },
  {
    title: 'Bước 2:',
    content:
      'Nhấn biểu tượng dấu cộng (+) trên khung chat của AI để đính kèm file tài liệu (PDF, DOCX, TXT hoặc ảnh chụp đề cương).',
  },
  {
    title: 'Bước 3:',
    content:
      'Chọn định dạng bạn muốn (JSON hoặc TXT) bên dưới, bấm Sao chép, dán vào khung chat AI. Sau đó copy kết quả dán vào tab Editor của bộ đề tương ứng.',
  },
] as const;

export const PROMPT_TEXT = `Bạn là một chuyên gia biên soạn đề kiểm tra trắc nghiệm học thuật chính xác.
Dựa trên tài liệu được đính kèm (hoặc nội dung tôi cung cấp bên dưới), hãy tạo danh sách câu hỏi trắc nghiệm khách quan (mỗi câu có 4 lựa chọn, trong đó chỉ có đúng 1 lựa chọn đúng là "ans.*" và 3 lựa chọn sai là "ans.").

YÊU CẦU ĐỊNH DẠNG ĐẦU RA:
1. TUYỆT ĐỐI KHÔNG sử dụng markdown block (không bọc trong \`\`\`txt ... \`\`\`).
2. KHÔNG có bất kỳ lời dẫn, chào hỏi hay giải thích nào.
3. Chỉ trả về đúng cấu trúc văn bản dưới đây:

ask : <Nội dung câu hỏi>
ans. <Nội dung lựa chọn sai>
ans.* <Nội dung lựa chọn Đúng>
ans. <Nội dung lựa chọn sai>
ans. <Nội dung lựa chọn sai>`;

export const PROMPT_JSON = `Bạn là một chuyên gia biên soạn đề kiểm tra trắc nghiệm học thuật chính xác.
Dựa trên tài liệu được đính kèm (hoặc nội dung tôi cung cấp bên dưới), hãy tạo danh sách câu hỏi trắc nghiệm khách quan (mỗi câu có 4 lựa chọn, trong đó chỉ có đúng 1 lựa chọn đúng là "true" và 3 lựa chọn sai là "false").

YÊU CẦU ĐỊNH DẠNG ĐẦU RA:
1. TUYỆT ĐỐI KHÔNG sử dụng markdown block (không bọc trong \`\`\`json ... \`\`\`).
2. KHÔNG có bất kỳ lời dẫn, chào hỏi hay giải thích nào.
3. Chỉ trả về duy nhất một mảng JSON hợp lệ theo đúng cấu trúc dưới đây:

[
\t{
\t\t"ask": "Nội dung câu hỏi thứ nhất?",
\t\t"answer": [
\t\t\t{"false": "Nội dung lựa chọn sai 1"},
\t\t\t{"false": "Nội dung lựa chọn sai 2"},
\t\t\t{"false": "Nội dung lựa chọn sai 3"},
\t\t\t{"true": "Nội dung lựa chọn ĐÚNG"}
\t\t]
\t}
]`;
