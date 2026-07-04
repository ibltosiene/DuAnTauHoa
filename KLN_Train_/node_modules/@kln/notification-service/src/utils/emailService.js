const nodemailer = require('nodemailer')

// Tạo transporter 1 lần duy nhất khi module được require
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_APP_PASSWORD,
  },
})

/**
 * Format số tiền VND
 */
const fmtVND = (n) => new Intl.NumberFormat('vi-VN').format(n) + ' đ'

/**
 * Format ngày giờ
 */
const fmtDate = (d) => {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Tạo nội dung HTML email xác nhận đặt vé.
 */
const buildBookingEmailHTML = ({ maDatCho, soHoaDon, hoTen, tongThanhToan, veList }) => {
  const veRows = veList.map((v, i) => `
    <tr>
      <td style="padding:8px 12px; border:1px solid #e0e0e0;">${i + 1}</td>
      <td style="padding:8px 12px; border:1px solid #e0e0e0;">${v.hanhKhach || ''}</td>
      <td style="padding:8px 12px; border:1px solid #e0e0e0;">${v.gaDi} → ${v.gaDen}</td>
      <td style="padding:8px 12px; border:1px solid #e0e0e0;">Toa ${v.soToa} – Ghế ${v.soGhe}</td>
      <td style="padding:8px 12px; border:1px solid #e0e0e0;">${v.ngayChay || ''}</td>
      <td style="padding:8px 12px; border:1px solid #e0e0e0;">${v.gioKhoiHanh || ''}</td>
      <td style="padding:8px 12px; border:1px solid #e0e0e0; text-align:right;">${fmtVND(v.giaVe)}</td>
    </tr>
  `).join('')

  return `
  <!DOCTYPE html>
  <html lang="vi">
  <head><meta charset="UTF-8"></head>
  <body style="margin:0; padding:0; background:#f4f6f8; font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:640px; margin:20px auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1a6496,#2196F3); padding:24px 32px; text-align:center;">
        <h1 style="color:#fff; margin:0; font-size:22px;">KLN TRAIN</h1>
        <p style="color:#dce8f5; margin:6px 0 0; font-size:14px;">Xác nhận đặt vé thành công</p>
      </div>

      <!-- Body -->
      <div style="padding:24px 32px;">
        <p style="font-size:16px; color:#333;">Xin chào <strong>${hoTen}</strong>,</p>
        <p style="color:#555; line-height:1.6;">
          Cảm ơn bạn đã đặt vé tại <strong>KLN Train</strong>. Thanh toán của bạn đã được xác nhận thành công.
          Dưới đây là thông tin chi tiết đơn đặt vé:
        </p>

        <!-- Thông tin đơn -->
        <div style="background:#f0f7ff; border-left:4px solid #1a6496; padding:14px 18px; margin:16px 0; border-radius:0 6px 6px 0;">
          <p style="margin:4px 0;"><strong>Mã đặt chỗ:</strong> <span style="color:#1a6496; font-size:18px; font-weight:bold; letter-spacing:1px;">${maDatCho}</span></p>
          <p style="margin:4px 0;"><strong>Số hóa đơn:</strong> ${soHoaDon}</p>
          <p style="margin:4px 0;"><strong>Tổng thanh toán:</strong> <span style="color:#d32f2f; font-weight:bold;">${fmtVND(tongThanhToan)}</span></p>
        </div>

        <!-- Bảng vé -->
        <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:13px;">
          <thead>
            <tr style="background:#1a6496; color:#fff;">
              <th style="padding:10px 12px; text-align:left;">STT</th>
              <th style="padding:10px 12px; text-align:left;">Hành khách</th>
              <th style="padding:10px 12px; text-align:left;">Hành trình</th>
              <th style="padding:10px 12px; text-align:left;">Chỗ ngồi</th>
              <th style="padding:10px 12px; text-align:left;">Ngày</th>
              <th style="padding:10px 12px; text-align:left;">Giờ</th>
              <th style="padding:10px 12px; text-align:right;">Giá vé</th>
            </tr>
          </thead>
          <tbody>${veRows}</tbody>
        </table>

        <!-- Lưu ý -->
        <div style="background:#fff8e1; border:1px solid #ffe082; padding:14px 18px; border-radius:6px; margin-top:16px;">
          <p style="margin:0 0 6px; font-weight:bold; color:#f57f17;">Lưu ý quan trọng:</p>
          <ul style="margin:0; padding-left:18px; color:#555; line-height:1.7; font-size:13px;">
            <li>Vui lòng lưu lại <strong>mã đặt chỗ</strong> để tra cứu và lên tàu.</li>
            <li>Mang theo <strong>CCCD/CMND</strong> khi lên tàu để đối chiếu.</li>
            <li>Có mặt tại ga trước giờ khởi hành ít nhất <strong>30 phút</strong>.</li>
     
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#f4f6f8; padding:16px 32px; text-align:center; border-top:1px solid #e0e0e0;">
        <p style="color:#999; font-size:12px; margin:0;">
          Email này được gửi tự động từ hệ thống KLN Train. Vui lòng không trả lời email này.
        </p>
        <p style="color:#999; font-size:12px; margin:4px 0 0;">© 2025 KLN Train — Hệ thống quản lý vé tàu hỏa</p>
      </div>
    </div>
  </body>
  </html>`
}

/**
 * Gửi email xác nhận đặt vé.
 * @param {string} toEmail - Email hành khách
 * @param {object} bookingData - { maDatCho, soHoaDon, hoTen, tongThanhToan, veList }
 *   veList[]: { hanhKhach, gaDi, gaDen, soToa, soGhe, ngayChay, gioKhoiHanh, giaVe }
 * @returns {Promise<object>} Kết quả gửi mail từ nodemailer
 */
const sendBookingConfirmation = async (toEmail, bookingData) => {
  const mailOptions = {
    from: process.env.MAIL_FROM || `"KLN Train" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: `Xác nhận đặt vé thành công — Mã đặt chỗ: ${bookingData.maDatCho}`,
    html: buildBookingEmailHTML(bookingData),
  }

  const info = await transporter.sendMail(mailOptions)
  console.log(`[EMAIL] Đã gửi email xác nhận đến ${toEmail} — MessageId: ${info.messageId}`)
  return info
}

module.exports = { sendBookingConfirmation }