export const PROMPT_JSON = `Bạn là một chuyên gia biên soạn đề kiểm tra trắc nghiệm học thuật chính xác.
Dựa trên tài liệu được đính kèm (hoặc nội dung tôi cung cấp bên dưới), hãy tạo danh sách câu hỏi trắc nghiệm khách quan (mỗi câu có 4 lựa chọn, trong đó chỉ có đúng 1 lựa chọn đúng là "true" và 3 lựa chọn sai là "false").

YÊU CẦU ĐỊNH DẠNG ĐẦU RA:
1. TUYỆT ĐỐI KHÔNG sử dụng markdown block (không bọc trong \`\`\`json ... \`\`\`).
2. KHÔNG có bất kỳ lời dẫn, chào hỏi hay giải thích nào.
3. Chỉ trả về duy nhất một mảng JSON hợp lệ theo đúng cấu trúc dưới đây:

[
	{
		"ask": "Nội dung câu hỏi thứ nhất?",
		"answer": [
			{"false": "Nội dung lựa chọn sai 1"},
			{"false": "Nội dung lựa chọn sai 2"},
			{"false": "Nội dung lựa chọn sai 3"},
			{"true": "Nội dung lựa chọn ĐÚNG"}
		]
	}
]`;

export const PROMPT_TXT = `Bạn là một chuyên gia biên soạn đề kiểm tra trắc nghiệm học thuật chính xác.
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
