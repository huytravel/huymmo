# Công Cụ Sáng Tác Truyện Nhật Bản

Một công cụ mạnh mẽ được xây dựng bằng React và nhiều API LLM khác nhau để giúp các nhà văn và người sáng tạo nội dung nhanh chóng tạo ra các câu chuyện chi tiết, hấp dẫn theo phong cách Nhật Bản.

## Ý Tưởng Cốt Lõi

Công cụ này chuyên tạo ra những câu chuyện theo mô típ nhân vật bị đánh giá thấp nhưng sở hữu tài năng phi thường (từ "vịt con xấu xí" thành "thiên nga"), hoặc những câu chuyện về việc vượt qua định kiến xã hội để tỏa sáng. Mục tiêu là tạo ra những câu chuyện giàu cảm xúc, đầy bất ngờ, kịch tính và mang lại sự thỏa mãn cho người đọc.

## Cấu Trúc Câu Chuyện 5 Phần

Mọi câu chuyện được tạo ra sẽ tuân thủ nghiêm ngặt cấu trúc 5 phần đã được chứng minh là hiệu quả để thu hút độc giả:

1.  **Phần 1: Mở Đầu - Gây Sốc (The Hook):** Gợi sự tò mò của người đọc bằng cách hé lộ một chi tiết nhỏ về tài năng phi thường của nhân vật chính trong một bối cảnh hết sức bình thường.
2.  **Phần 2: Nâng Cao Mức Độ Nguy Hiểm - Áp Lực (The Pressure):** Đặt nhân vật chính vào một tình huống khó khăn với những hậu quả nghiêm trọng nếu thất bại, khiến khán giả phải hồi hộp và ủng hộ họ.
3.  **Phần 3: Móc Nối Lại - Cốt Truyện Bất Ngờ (The Twist):** Đưa ra một trở ngại hoặc sự thật bất ngờ, khiến tình hình trở nên khó khăn hơn và khó đoán hơn.
4.  **Phần 4: Cao Trào - Bùng Nổ Cảm Xúc (The Climax):** Nhân vật chính, bị dồn vào đường cùng, sử dụng toàn bộ tài năng của mình một cách ngoạn mục, gây sốc cho những người đã từng coi thường họ.
5.  **Phần 5: Kết Thúc - Bài Học Ý Nghĩa (The Resolution):** Mô tả cái kết tích cực và đúc kết một thông điệp sâu sắc về sự kiên trì, tự tin và giá trị thực sự của một con người.

## Tính Năng Nổi Bật

- **Hỗ trợ Đa Nền Tảng:** Tích hợp liền mạch với **Google Gemini**, **AIVND Hub**, **OpenAI (Chính thức)**, và **OpenRouter**.
- **Tạo Dàn Ý Tự Động:** Chỉ cần nhập ý tưởng, AI sẽ tạo ra một dàn ý chi tiết theo cấu trúc 5 phần.
- **Viết Truyện Từng Phần:** Toàn quyền kiểm soát quá trình sáng tạo bằng cách tạo nội dung cho từng phần một.
- **Quản lý Nhiều API Key:** Nhập nhiều API key cho mỗi nhà cung cấp để tự động luân phiên, tránh bị giới hạn yêu cầu (rate limiting).
- **Lưu Trữ An Toàn:** API key được lưu trữ an toàn ngay trên trình duyệt của bạn (`localStorage`).
- **Giao Diện Trực Quan:** Dễ dàng theo dõi tiến độ, sao chép và tải về sản phẩm cuối cùng.

## Hướng Dẫn Bắt Đầu

### 1. Lấy API Keys

Bạn cần có API key của riêng mình để sử dụng công cụ này từ các nhà cung cấp được hỗ trợ.

### 2. Thiết lập trong Ứng Dụng

- Mở ứng dụng lần đầu tiên, một trang cài đặt sẽ hiện ra.
- Chọn tab cho nhà cung cấp bạn muốn cấu hình.
- Dán các API key của bạn vào ô văn bản (mỗi key một dòng).
- (Tùy chọn) Nhấp vào nút **"Kiểm tra Keys"** để xác thực.
- Nhấp vào "**Lưu và Bắt đầu**".

### 3. Sáng Tác Câu Chuyện Của Bạn

1.  **Chọn Nhà Cung Cấp & Model:** Chọn nhà cung cấp AI và model bạn muốn sử dụng để tạo dàn ý.
2.  **Nhập Ý Tưởng:** Nhập ý tưởng hoặc chủ đề cho câu chuyện của bạn vào ô và nhấp "**Tạo dàn ý**".
3.  **Xem Lại Dàn Ý:** AI sẽ tạo ra một dàn ý chi tiết theo cấu trúc 5 phần.
4.  **Tạo Từng Phần:** Nhấp vào nút "**Bắt đầu tạo tự động**".
5.  **Hoàn Thành:** AI sẽ tự động viết từng phần cho đến khi hoàn thành câu chuyện.
6.  **Sử Dụng Tác Phẩm:** Bạn có thể sao chép từng phần, sao chép toàn bộ, hoặc tải xuống toàn bộ câu chuyện dưới dạng tệp `.txt`.
