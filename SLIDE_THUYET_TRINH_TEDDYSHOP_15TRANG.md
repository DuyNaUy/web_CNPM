# Slide 1 - Bìa
**TeddyShop - Hệ thống bán hàng gấu bông tích hợp AI tư vấn và thanh toán trực tuyến**

- Họ và tên: ...
- Lớp: ...
- GVHD: ...
- Thời gian: ...

---

# Slide 2 - Chương 1: Giới thiệu đề tài
**Bài toán dự án giải quyết là gì?**

- Xây dựng một website bán hàng gấu bông có đầy đủ chức năng mua sắm online.
- Hỗ trợ khách hàng tìm kiếm, xem chi tiết sản phẩm, đặt hàng và thanh toán.
- Tích hợp AI để tư vấn sản phẩm tự động, giảm thời gian hỗ trợ thủ công.
- Hỗ trợ quản trị sản phẩm, đơn hàng, người dùng và báo cáo doanh thu.

**Vấn đề thực tế:**

- Khách hàng khó chọn sản phẩm phù hợp khi catalog lớn.
- Việc tư vấn và xử lý đơn hàng tốn nhiều thao tác thủ công.
- Cần một hệ thống có thể kết hợp bán hàng, tư vấn và thanh toán trong một nền tảng.

---

# Slide 3 - Chương 2: Tổng quan giải pháp
**TeddyShop được xây dựng như thế nào?**

- Frontend: Next.js + React + TypeScript.
- Backend: Django REST Framework.
- Cơ sở dữ liệu: MySQL.
- AI tư vấn: Gemini, OpenAI dự phòng, ChromaDB cho tìm kiếm ngữ nghĩa.
- Thanh toán: MoMo, PayOS.

**Điểm chính của giải pháp:**

- Tách frontend và backend rõ ràng.
- Dữ liệu sản phẩm được đồng bộ thời gian thực từ cơ sở dữ liệu.
- Chatbot AI không chỉ trả lời chung mà có thể gợi ý sản phẩm cụ thể.

---

# Slide 4 - Chương 2: Kiến trúc hệ thống
**Kiến trúc triển khai của hệ thống**

- Tầng giao diện: Next.js/React hiển thị website cho khách hàng và quản trị.
- Tầng API: Django REST Framework xử lý nghiệp vụ.
- Tầng dữ liệu: MySQL lưu người dùng, sản phẩm, đơn hàng, hội thoại.
- Tầng AI: Gemini/OpenAI + ChromaDB phục vụ tư vấn và semantic search.
- Tầng thanh toán: MoMo/PayOS xử lý tạo link thanh toán và callback trạng thái.

**Luồng chạy:**

1. Người dùng thao tác ở frontend.
2. Frontend gọi API backend.
3. Backend xử lý nghiệp vụ, truy vấn MySQL.
4. AI hoặc cổng thanh toán được gọi khi cần.
5. Kết quả trả về lại giao diện.

---

# Slide 5 - Chương 3: Frontend
**Công nghệ và vai trò**

- Next.js: render trang, routing, tối ưu trải nghiệm người dùng.
- React: xây dựng component theo từng chức năng.
- TypeScript: giảm lỗi kiểu dữ liệu, dễ bảo trì.
- PrimeReact/PrimeFlex: tạo UI nhanh, đồng bộ.

**Vai trò của tầng frontend:**

- Hiển thị sản phẩm, giỏ hàng, đơn hàng, thanh toán.
- Gửi request đến backend qua REST API.
- Nhận phản hồi từ AI agent và hiển thị hội thoại.

---

# Slide 6 - Chương 3: Backend
**Công nghệ và vai trò**

- Django: nền tảng backend chính.
- Django REST Framework: xây dựng API.
- JWT: xác thực người dùng.
- CORS: cho phép frontend khác cổng truy cập API.

**Vai trò của tầng backend:**

- Xử lý đăng nhập, sản phẩm, giỏ hàng, đơn hàng, thống kê.
- Xác thực quyền truy cập của user/admin.
- Là trung tâm nghiệp vụ của hệ thống.

---

# Slide 7 - Chương 3: Cơ sở dữ liệu
**MySQL dùng để làm gì?**

- Lưu thông tin người dùng.
- Lưu sản phẩm, danh mục, ảnh, biến thể, tồn kho.
- Lưu đơn hàng, chi tiết đơn hàng, trạng thái thanh toán.
- Lưu lịch sử hội thoại AI và trạng thái hỗ trợ.

**Ưu điểm:**

- Dữ liệu có cấu trúc rõ ràng.
- Dễ truy vấn báo cáo và thống kê.
- Phù hợp với mô hình thương mại điện tử.

---

# Slide 8 - Chương 3: AI tư vấn
**AI và chatbot được áp dụng như thế nào?**

- Gemini là mô hình AI chính để tư vấn sản phẩm.
- OpenAI được giữ làm phương án dự phòng.
- Backend xây dựng system prompt theo catalog sản phẩm thực tế.
- AI agent dùng dữ liệu realtime để giảm trả lời sai ngữ cảnh.

**Ý nghĩa:**

- Khách hàng hỏi nhu cầu, AI gợi ý sản phẩm phù hợp.
- Có thể chuyển sang hỗ trợ người thật khi cần.

---

# Slide 9 - Chương 3: ChromaDB
**ChromaDB dùng để làm gì?**

- Lưu embeddings của sản phẩm.
- Tìm kiếm ngữ nghĩa, không chỉ tìm theo từ khóa.
- Hỗ trợ chatbot hiểu câu hỏi gần nghĩa như “gấu hồng mềm cho bé gái”.

**Vai trò trong hệ thống:**

- Là lớp tìm kiếm thông minh cho AI.
- Chạy ở backend, không hiển thị trực tiếp trên giao diện.
- Giúp tăng độ liên quan của sản phẩm được gợi ý.

---

# Slide 10 - Chương 3: Thanh toán
**Thanh toán trực tuyến và xử lý đơn hàng**

- MoMo: tạo link thanh toán, nhận callback trạng thái.
- PayOS: tạo payment link và webhook xác nhận thanh toán.
- COD: thanh toán khi nhận hàng.
- Chuyển khoản ngân hàng: hỗ trợ thủ công theo quy trình admin.

**Sau khi hủy đơn đã thanh toán:**

- Hệ thống hiện thông báo hoàn tiền.
- Khách có thể chuyển sang chat với admin để gửi thông tin hoàn tiền.

---

# Slide 11 - Chương 3: Tính năng chính
**Các chức năng đã hoàn thiện**

- Xem danh mục và chi tiết sản phẩm.
- Tìm kiếm sản phẩm.
- Giỏ hàng và đặt hàng.
- Thanh toán online.
- Quản lý đơn hàng.
- Chatbot AI tư vấn sản phẩm.
- Chuyển sang tư vấn viên/admin khi cần.

---

# Slide 12 - Chương 3: Kết quả đạt được
**Kế thừa và phần mới**

**Kế thừa:**

- Kiến trúc web bán hàng truyền thống.
- Luồng đặt hàng, thanh toán, quản lý đơn.

**Phần mới trong sản phẩm của mình:**

- AI tư vấn sản phẩm theo catalog thực tế.
- ChromaDB cho tìm kiếm ngữ nghĩa.
- Chuyển ngữ cảnh đơn hàng sang chatbot để xử lý hoàn tiền/hỗ trợ.

**Ưu điểm:**

- Tư vấn nhanh hơn.
- Trải nghiệm mua hàng liền mạch.
- Dễ mở rộng chức năng sau này.

---

# Slide 13 - Chương 4: Kiểm thử và hiệu năng
**Cần trình bày rõ khi được hỏi về hiệu năng**

- Hệ thống đã được kiểm thử chức năng qua các script/test nội bộ như API test, MoMo test, stats test.
- Đã kiểm tra các luồng chính: đăng nhập, giỏ hàng, đặt hàng, thanh toán, hủy đơn, AI tư vấn.
- Backend có phân tách API rõ ràng nên dễ kiểm thử từng phần.

**Nếu chưa có benchmark tải chính thức, nên nói đúng:**

- Hiện tại mới có kiểm thử chức năng và tích hợp.
- Chưa thực hiện load test quy mô lớn nên chưa công bố số liệu RPS/latency tổng quát.

**Nếu cần nói về thời gian đáp ứng:**

- Nên đo trực tiếp trên môi trường chạy thực tế trước khi trình bày số cụ thể.

---

# Slide 14 - Kết quả và hướng phát triển
**Hướng phát triển tiếp theo**

- Bổ sung dashboard đo hiệu năng và log thời gian phản hồi API.
- Tối ưu tìm kiếm sản phẩm và gợi ý cá nhân hóa.
- Hoàn thiện hoàn tiền tự động với cổng thanh toán phù hợp.
- Nâng cấp chatbot để ghi nhận yêu cầu refund rõ ràng hơn.
- Tối ưu triển khai production và giám sát hệ thống.

---

# Slide 15 - Cảm ơn
**Xin cảm ơn thầy/cô và các bạn đã lắng nghe**

- Sẵn sàng trả lời câu hỏi.
- Cảm ơn!