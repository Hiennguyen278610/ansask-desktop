export const PROMPT_JSON = `Bạn là một chuyên gia biên soạn đề kiểm tra trắc nghiệm học thuật chính xác.
Dựa trên tài liệu được đính kèm (hoặc nội dung tôi cung cấp bên dưới), hãy tạo danh sách câu hỏi trắc nghiệm khách quan (mỗi câu có 4 lựa chọn, trong đó chỉ có đúng 1 lựa chọn đúng là "true" và 3 lựa chọn sai là "false").

YÊU CẦU ĐỊNH DẠNG ĐẦU RA:
Chỉ trả về duy nhất một mảng JSON hợp lệ theo đúng cấu trúc dưới đây (không giải thích thêm ngoài khối code):

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
Chỉ trả về duy nhất nội dung văn bản theo đúng cú pháp dưới đây (không giải thích thêm):

ask : <Nội dung câu hỏi>
ans. <Nội dung lựa chọn sai>
ans.* <Nội dung lựa chọn Đúng>
ans. <Nội dung lựa chọn sai>
ans. <Nội dung lựa chọn sai>`;
