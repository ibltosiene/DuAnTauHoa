use serde::{Deserialize, Serialize};

/// Body của POST /internal/passengers/find-or-create — khớp đúng field JSON
/// mà booking-service (CustomerClient.js) đang gửi sang, không đổi tên/kiểu.
#[derive(Debug, Deserialize)]
pub struct FindOrCreateRequest {
    pub id_tai_khoan: Option<i32>,
    pub ho_ten: String,
    /// Giữ dạng chuỗi "YYYY-MM-DD" để khớp định dạng JSON hiện có (Sequelize
    /// DATEONLY cũng serialize y hệt) — parse sang NaiveDate khi truy vấn CSDL.
    pub ngay_sinh: String,
    pub cccd: Option<String>,
    pub loai_hanh_khach: String,
    pub so_dien_thoai: Option<String>,
    pub la_chinh: Option<bool>,
}

/// Khớp đúng shape bảng HanhKhach — trả ra JSON y hệt bản Node cũ.
#[derive(Debug, Serialize, Clone)]
pub struct HanhKhach {
    pub id_hanh_khach: i32,
    pub id_tai_khoan: Option<i32>,
    pub ho_ten: String,
    pub ngay_sinh: String,
    pub cccd: Option<String>,
    pub loai_hanh_khach: String,
    pub so_dien_thoai: Option<String>,
    pub la_chinh: bool,
}
