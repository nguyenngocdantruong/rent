export default function GuidePage() {
  return (
    <div className="card-custom">
      <h2 className="card-title">Hướng dẫn sử dụng</h2>
      <div style={{ lineHeight: 2, color: '#495057' }}>
        <h5>1. Thuê số nhanh</h5>
        <p>Chọn <strong>Quốc gia</strong> và <strong>Dịch vụ</strong> bạn muốn nhận OTP, sau đó bấm <strong>Thuê số ngay</strong>.</p>

        <h5 className="mt-4">2. Nhận mã OTP</h5>
        <p>Sau khi thuê số, hệ thống sẽ tự động cập nhật OTP mỗi 5 giây. Bấm vào số điện thoại hoặc CODE để copy nhanh.</p>

        <h5 className="mt-4">3. Lưu ý quan trọng</h5>
        <ul>
          <li>Số sau khi mua nếu không nhận được code sẽ tự động hoàn số sau ~15 phút.</li>
          <li>Gmail, Facebook, Zalo... khi đăng ký &gt;5 tài khoản cần reset IP Internet.</li>
          <li>Shopee: kiểm tra tài khoản đã đăng ký chưa trước khi lấy code.</li>
          <li>Telegram: vào Contact &gt; Add contact — nếu không thêm được là số chưa sử dụng.</li>
        </ul>

        <h5 className="mt-4">4. Lịch sử thuê số</h5>
        <p>Xem lại các lần thuê số, lọc theo dịch vụ, trạng thái và khoảng thời gian tại trang <strong>Lịch sử thuê số</strong>.</p>
      </div>
    </div>
  );
}
