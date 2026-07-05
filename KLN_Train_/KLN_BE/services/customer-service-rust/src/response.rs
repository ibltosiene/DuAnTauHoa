// Helper chuẩn hóa response — mirror đúng shape {success, message, data} của
// KLN_BE/shared/response.js bên Node, để phía gọi (booking-service) không
// thấy khác biệt gì khi customer-service đổi sang Rust.
use axum::{http::StatusCode, Json};
use serde_json::{json, Value};

pub type ApiError = (StatusCode, Json<Value>);

pub fn bad_request(message: &str) -> ApiError {
    (StatusCode::BAD_REQUEST, Json(json!({ "success": false, "message": message })))
}

pub fn not_found(message: &str) -> ApiError {
    (StatusCode::NOT_FOUND, Json(json!({ "success": false, "message": message })))
}

pub fn server_error(message: &str) -> ApiError {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(json!({ "success": false, "message": format!("Lỗi máy chủ nội bộ: {message}") })),
    )
}

pub fn ok(data: Value) -> Json<Value> {
    Json(json!({ "success": true, "message": "Thành công", "data": data }))
}
