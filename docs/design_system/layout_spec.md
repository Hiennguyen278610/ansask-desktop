body.layout[2 phần trái phải disable scroll
    sidebar.layout[
        header.layout[gồm 3 phần trái giữa phải
            logo bên trái
            component.layout[title và subtitle trên dưới] giữa
            icon side bên phải
        ]
        content.layout[danh sách thẻ dọc enable scroll]
        footer.layout[nằm ngang
            icon[setting]
            title.value["Cài đặt"]
        ].event[mở dialog cài đặt dialog.layout[nằm ngang
            component.layout[ các tab button điều hướng
                trước mắt chỉ cần "Cấu hình chung", "Thùng rác" và "Ủng hộ"
            ] bên trái
            component.layout[
                Hiện tại cấu hình chung chỉ có chủ đề với switch button light, dark, system 
                và có thể chỉnh sửa độ lớn "defaut(100%)|110,120" của chữ
            ]
        ]]
    ] bên trái
    main_content.layout[ 2 phần trên dưới disable scroll
        page[ enable scroll
            header.layout[
                directlink[<page title> > <child> > <child of child> ...] căn trái
                feature_components.layout[là các component nằm ngang] theo page căn phải
            ]
            dashboard.layout[tùy bạn recommend]
            exam.layout[
                feature_components.layout[
                    button.icon[dấu cộng].title[Tạo môn học].event[gọi dialog.layout[ 3 khối xếp chồng
                        header.layout[tiêu đề tạo môn học căn trái và nút x căn phải]
                        content.layout[2 khối component xếp chồng
                            component.layout[xếp chồng
                                tiêu đề "Tên môn học"
                                component input filed
                            ]
                            component.layout[nằm ngang
                                tiêu đề "Icon nhận diện" căn trái
                                component.[dialog chọn các icon nhận diện có sẵn trong docs/resource/icon_tag] căn phải
                            ]
                        ]
                    ]]
                ] phần xuất hiện ở header
                component.layout[ lưới 3 cột n dòng chứa các
                    component.layout[
                        header.layout[tên môn học căn trái và button xóa căn phải]
                        content.[Hiển thị tổng bộ đề và tổng số câu]
                        footer.[tiêu đề "Mở bộ đề" bên trái và icon ">" bên phải]
                    ].event[mở page exam_by_subject[
                        feature_components.layout[
                            button.icon[import].title["Nhập bộ đề"].event[mở browser lọc cứng txt và json]
                            button.icon[dấu cộng].title["Tạo đề"].event[mở page create_exam.layout[
                                header của main_content.page được thay hoàn toàn thành header.layout[các component nằm ngang
                                    button.icon[<-] căn trái
                                    input_field.placeholder[căn đầy]
                                    button.icon[save].title[Lưu đề] căn phải
                                ]
                                content.layout[2 component trái phải disable scroll
                                    component.layout[ disable scroll
                                        header.[xếp hàng ngang
                                            title.value["Danh sách câu hỏi"] căn trái
                                            component.layout[
                                                    button.icon[list].title["Danh sách câu hỏi"]
                                                    text.value[số câu <i với i bắt đầu từ 0>]
                                            ].event[Mở dialog.layout[
                                                header.layout[xếp ngang hàng
                                                    title.value["Danh sách câu hỏi"]
                                                    button.icon[x].event[Đóng dialog]
                                                ]
                                                content.layout[enable scroll grid view 5 cột 5 dòng
                                                    button.title[các số thứ tự các câu đang có].event[đóng dialog và focus vào câu được click]
                                                ]
                                            ]] căn phải
                                        ]
                                        content.layout[chứa các component display block
                                            component.layout[
                                                header.layout[các component ngang hàng
                                                    title.value["Câu" + <j với j bắt đầu từ 1>] căn trái
                                                    input_field.placeholderifnull["Nội dung câu hỏi"].customize[Xuống dòng và tăng chiều cao khi tràn nội dung] căn đầy
                                                    button.icon[remove] căn phải
                                                ]
                                                content.layout[ mặc định chứa 4 component khi khởi tạo (min=1, max=10)
                                                    component.laytout[các component ngang
                                                        radio_button[] căn trái
                                                        title.value[{"A","B","C","D"}] căn trái
                                                        input_field.placehoderifnull["Nội dung lựa chọn"].customize[Xuống dòng và tăng chiều cao khi tràn nội dung] căn đầy
                                                        text.value["Đúng" default display none] căn phải
                                                        button.icon[remove].event[xóa content] căn phải
                                                    ].event[khi radio được chọn thì text.value["Đúng" display nhé]]
                                                ]
                                                footer.layout[ căn trái
                                                    button.icon[plus].title["Thêm lựa chọn"]
                                                ]
                                            ]
                                            component.layout[ mặc định hiển thị ở câu cuối, nếu nằm giữa 2 câu thì holer vào mới thấy
                                                button.title["Thêm câu hỏi"].customize[border nét đứt].event[sẽ sinh ra component ở trên]
                                            ]
                                        ]
                                    ]
                                    component.layout[
                                        header.layout[  xếp hàng ngang
                                            title.value["editor"] căn trái
                                            switch_button[mặc định là TEXT, còn lại là JSON]
                                        ]
                                        content.layout[enable scroll chứa các text có hỗ trợ ctrl z cho quay lại kí tự và shift z cho tiến tới bước hiện tại]
                                    ]
                                ]
                            ]]
                        ] hiện ở header
                        component.layout[lưới 3 cột n dòng chứa các
                            component.layout[
                                header.layout[tên bộ đề căn trái và button xóa căn phải]
                                content.[Hiển thị số câu hỏi của bộ đề]
                                footer.[tiêu đề "Xem chi tiết đề" bên trái và icon ">" bên phải]
                            ].event[mở page exam_detail[
                                feature_components.layout[
                                    button.icon[eye/close eye].title[{"Hiện","Ẩn"} + "đáp án"].event[temp123 của tất cả các câu hiện ra]
                                    button.icon[export].title["Xuất txt"].event[Mở file explore để người dùng chọn đường dẫn xuất]
                                    button.icon[edit].title["Sửa đề"].event[mở page create_exam với dữ liệu đã fill]
                                    button.icon[play].title["Làm đề"].event[mở dialog.layout[xếp chồng
                                        header.layout[nằm ngang
                                            title.value["Cấu hình bài kiểm tra"]
                                            button.icon[x].event[đóng dialog]
                                        ]
                                        content.layout[xếp chồng
                                            component.layout[xếp chồng
                                                title.value["Chọn chế độ"] căn trái
                                                switch_button["Trắc nghiệm"|"Flash card"].event[] căn đầy
                                            ]
                                            component.layout[xếp chồng
                                                title.value["Số câu"] căn trái
                                                input_field.value[10 là mặc định] căn đầy
                                                title.value["Chọn nhanh"] căn trái
                                                component.layout[xếp ngang 4 button fix sẵn số nút để fill 25, 32, 40, tất cả với event ghi đè vào input_field trên các giá trị này, nhưng 3 giá trị được fix kia chỉ enable nếu tất cả số câu của đề đó lớn hơn số câu mà cả 3 có] căn đầy
                                                component.layout[nằm ngang
                                                    title.value["Xáo đáp án & câu hỏi"] căn trái
                                                    toggle_button.event[khi bật thì sẽ làm bài với câu hỏi và cả đáp án được xáo trộn] căn 
                                                ]
                                            ]
                                        ]
                                        footer.layout[nằm ngang
                                            button.title["Đóng"] căn phải
                                            button.icon[play].title["Làm bài"].event[
                                                # Nếu là mode "Trắc nghiệm"
                                                Mở page làm bài, chế độ full màn hình bật, sidebar bị ẩn mất chỉ còn main container. page exam_taking.layout[
                                                header.layout[ nằm ngang
                                                    component.layout[nằm ngang
                                                        component.layout[nằm ngang
                                                            icon[lock]
                                                            component bộ đếm thời gian format mm:ss
                                                        ]
                                                        component.layout[xếp chồng
                                                            title.value["Đã chọn" + <số câu đã chọn>/<tổng số câu bài làm>]
                                                            process_component
                                                        ]
                                                    ] căn trái
                                                    component.layout[
                                                            button.icon[list].title["Danh sách câu hỏi"]
                                                            text.value[số câu <i với i bắt đầu từ 0>]
                                                    ].event[Mở dialog.layout[
                                                        header.layout[xếp ngang hàng
                                                            title.value["Danh sách câu hỏi"]
                                                            button.icon[x].event[Đóng dialog]
                                                        ]
                                                        content.layout[enable scroll grid view 5 cột 5 dòng
                                                            button.title[các số thứ tự các câu đang có].event[đóng dialog và focus vào câu được click]
                                                        ]
                                                    ]]
                                                    button.title["Nộp bài"].event[
                                                        tắt full màn hình, hiện lại sidebar và mở page exam_result.layout[
                                                            header.layout[
                                                                component.layout[
                                                                    donut_process_component.layout[
                                                                        title.value[<số điểm thực tế lấy đến phần thập phân thứ 2>/10]
                                                                    ]
                                                                ] căn trái
                                                                component.layout[xếp chồng
                                                                    title.value[Tên bài kiểm tra vừa làm]
                                                                    title.value["Hoàn thành bài kiểm tra"]
                                                                ] căn trái
                                                                button.icon[<-].title[Về đề bài].event[quay trở lại page exam_detail] căn phải
                                                                component.layout[xếp chồng
                                                                    button.title.value["Làm lại (" + <số câu sai/chưa chọn> + ") câu sai"].event[mở exam_taking với flash card mode và load những câu đã sai]
                                                                    button.title.value["Luyện tập"].event[hiện dialog cấu hình để làm tiếp]
                                                                ] căn phải
                                                            ]
                                                        ]
                                                    ] căn phải
                                                ]
                                                content.layout[các component xếp dọc enable scroll
                                                    component.layout[
                                                        header.layout[các component ngang hàng
                                                            title.value["Câu" + <j với j bắt đầu từ 1>] căn trái
                                                            input_field.placeholderifnull["Nội dung câu hỏi"].customize[Xuống dòng và tăng chiều cao khi tràn nội dung] căn đầy
                                                            button.icon[remove] căn phải
                                                        ]
                                                        content.layout[
                                                            component.laytout[các component ngang
                                                                radio_button[] căn trái
                                                                title.value[{"A","B","C","D"}] căn trái
                                                                input_field.placehoderifnull["Nội dung lựa chọn"].customize[Xuống dòng và tăng chiều cao khi tràn nội dung] căn đầy
                                                            ].event[khi radio được chọn thì text.value["Đúng" display nhé]]
                                                        ]
                                                    ]
                                                ]
                                            ]
                                            # Nếu là mode "flash card"
                                            Mở page làm bài, chế độ full màn hình bật, sidebar bị ẩn mất chỉ còn main container. page exam_taking.layout[
                                                header.layout[nằm ngang
                                                    component.layout[nằm ngang
                                                        component.layout[nằm ngang
                                                            icon[lock]
                                                            component bộ đếm thời gian format mm:ss
                                                        ]
                                                        component.layout[xếp chồng
                                                            title.value["Đã chọn" + <số câu đã chọn>/<tổng số câu bài làm>]
                                                            process_component
                                                        ]
                                                    ] căn trái
                                                    button.title["Nộp bài"].event[
                                                        tắt full màn hình, hiện lại sidebar và mở page exam_result.layout[
                                                            header.layout[
                                                                component.layout[
                                                                    donut_process_component.layout[
                                                                        title.value[<số điểm thực tế lấy đến phần thập phân thứ 2>/10]
                                                                    ]
                                                                ] căn trái
                                                                component.layout[xếp chồng
                                                                    title.value[Tên bài kiểm tra vừa làm]
                                                                    title.value["Hoàn thành bài kiểm tra"]
                                                                ] căn trái
                                                                button.icon[<-].title[Về đề bài].event[quay trở lại page exam_detail] căn phải
                                                                component.layout[xếp chồng
                                                                    button.title.value["Làm lại (" + <số câu sai/chưa chọn> + ") câu sai"].event[mở exam_taking với flash card mode và load những câu đã sai]
                                                                    button.title.value["Luyện tập"].event[hiện dialog cấu hình để làm tiếp]
                                                                ] căn phải
                                                            ]
                                                        ]
                                                    ] căn phải
                                                ]
                                                content.layout[chỉ có 1 component câu hỏi
                                                    component.layout[
                                                        header.layout[các component ngang hàng
                                                            title.value["Câu" + <j với j bắt đầu từ 1>] căn trái
                                                            input_field.placeholderifnull["Nội dung câu hỏi"].customize[Xuống dòng và tăng chiều cao khi tràn nội dung] căn đầy
                                                            button.icon[remove] căn phải
                                                        ]
                                                        content.layout[
                                                            component.laytout[các component ngang
                                                                radio_button[] căn trái
                                                                title.value[{"A","B","C","D"}] căn trái
                                                                input_field.placehoderifnull["Nội dung lựa chọn"].customize[Xuống dòng và tăng chiều cao khi tràn nội dung] căn đầy
                                                            ].event[khi radio được chọn thì text.value["Đúng" display nhé]]
                                                        ]
                                                    ]
                                                ]
                                                footer.layout[nằm ngang
                                                    title.value["Sai rồi, thử lại lần nữa"] căn trái
                                                    button.title["Xác nhận"].event[mặc định title.value["Sai rồi, thử lại lần nữa"] display none, khi người dùng ấn xác nhận và kiểm tra nếu sai thì hiện ra còn đúng qua câu khác] căn phải
                                                ]
                                            ]

                                            ] căn phải
                                        ]
                                    ]]
                                ] hiện ở header
                                component.layout[Chứa các component xếp chồng
                                    component.layout[
                                        header.title[Câu <i với i là số tự nhiên từ 1>]
                                        content.layout[ nằm ngang
                                            radio_button[] căn trái
                                            title.value[{"A","B","C","D"}] căn trái
                                            input_field.placehoderifnull["Nội dung lựa chọn"].customize[Xuống dòng và tăng chiều cao khi tràn nội dung] căn đầy
                                            text.value["Đúng" default display none].id[temp123] căn phải
                                        ]
                                    ]
                                ]
                            ]]
                        ]
                    ]]
                ]
            ]
            ai_guide.layout[2 component xếp chồng
                component.layout[3 component nằm ngang
                    component.layout[
                        header.layout[tiêu đề "Bước 1:"]căn trái
                        content.value[Mở các nền tảng AI hỗ trợ đọc tài liệu như Gemini , ChatGPT , Claude  hoặc DeepSeek .]
                    ]
                    component.layout[
                        header.layout[tiêu đề "Bước 2:"]căn trái
                        content.value[Nhấn biểu tượng dấu cộng (+) trên khung chat của AI để đính kèm file tài liệu (PDF, DOCX, TXT hoặc ảnh chụp đề cương).]
                    ]
                    component.layout[
                        header.layout[tiêu đề "Bước 3:"]căn trái
                        content.value[Chọn định dạng bạn muốn (JSON hoặc TXT) bên dưới, bấm Sao chép, dán vào khung chat AI. Sau đó copy kết quả dán vào tab Editor của bộ đề tương ứng.]
                    ]
                ]
                component.layout[2 component nằm ngang
                    component.layout[
                        header.layout[2 component nằm ngang
                            component.layout[icon book và tiêu đề "TEXT"] căn trái
                            button.layout[icon sao chép và title "sao chép"] căn phải
                        ]
                        content.value["""Bạn là một chuyên gia biên soạn đề kiểm tra trắc nghiệm học thuật chính xác.
Dựa trên tài liệu được đính kèm (hoặc nội dung tôi cung cấp bên dưới), hãy tạo danh sách câu hỏi trắc nghiệm khách quan (mỗi câu có 4 lựa chọn, trong đó chỉ có đúng 1 lựa chọn đúng là "ans.*" và 3 lựa chọn sai là "ans.").

YÊU CẦU ĐỊNH DẠNG ĐẦU RA:
1. TUYỆT ĐỐI KHÔNG sử dụng markdown block (không bọc trong ```txt ... ```).
2. KHÔNG có bất kỳ lời dẫn, chào hỏi hay giải thích nào.
3. Chỉ trả về đúng cấu trúc văn bản dưới đây:

ask : <Nội dung câu hỏi>
ans. <Nội dung lựa chọn sai>
ans.* <Nội dung lựa chọn Đúng>
ans. <Nội dung lựa chọn sai>
ans. <Nội dung lựa chọn sai>"""]
                    ]
                    component.layout[
                        header.layout[2 component nằm ngang
                            component.layout[icon "{}" và tiêu đề "JSON"] căn trái
                            button.layout[icon sao chép và title "sao chép"] căn phải
                        ]
                        content.value["""Bạn là một chuyên gia biên soạn đề kiểm tra trắc nghiệm học thuật chính xác.
Dựa trên tài liệu được đính kèm (hoặc nội dung tôi cung cấp bên dưới), hãy tạo danh sách câu hỏi trắc nghiệm khách quan (mỗi câu có 4 lựa chọn, trong đó chỉ có đúng 1 lựa chọn đúng là "true" và 3 lựa chọn sai là "false").

YÊU CẦU ĐỊNH DẠNG ĐẦU RA:
1. TUYỆT ĐỐI KHÔNG sử dụng markdown block (không bọc trong ```json ... ```).
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
]"""]
                    ]
                ]
            ]
        ]
    ] bên phải
]