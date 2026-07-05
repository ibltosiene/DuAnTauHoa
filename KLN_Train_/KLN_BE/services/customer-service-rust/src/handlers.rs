// Controller mỏng: đọc input → gọi db → trả response chuẩn hóa.
// Tương đương src/internal/passengers.routes.js + PassengerService.js bên Node.
use axum::{
    extract::{Path, State},
    Json,
};
use chrono::NaiveDate;
use serde_json::json;
use std::sync::Arc;

use crate::{db, models::FindOrCreateRequest, response, AppState};

pub async fn health() -> Json<serde_json::Value> {
    Json(json!({ "success": true, "message": "customer-service (Rust) đang hoạt động" }))
}

/// POST /internal/passengers/find-or-create
/// Tương đương PassengerService.findOrCreate: tìm theo họ tên+ngày sinh, có thì
/// dùng lại nguyên (không cập nhật CCCD/SĐT mới), chưa có thì tạo mới.
pub async fn find_or_create(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<FindOrCreateRequest>,
) -> Result<Json<serde_json::Value>, response::ApiError> {
    if payload.ho_ten.trim().is_empty() || payload.ngay_sinh.trim().is_empty() {
        return Err(response::bad_request("Thiếu ho_ten hoặc ngay_sinh"));
    }

    let ngay_sinh = NaiveDate::parse_from_str(&payload.ngay_sinh, "%Y-%m-%d")
        .map_err(|_| response::bad_request("ngay_sinh không đúng định dạng YYYY-MM-DD"))?;

    let mut client = state.db.lock().await;

    let existing = db::find_by_ho_ten_ngay_sinh(&mut client, &payload.ho_ten, ngay_sinh)
        .await
        .map_err(|e| response::server_error(&e.to_string()))?;

    let hk = match existing {
        Some(hk) => hk,
        None => db::create_passenger(&mut client, &payload, ngay_sinh)
            .await
            .map_err(|e| response::server_error(&e.to_string()))?,
    };

    // Chỉ trả 4 field, khớp đúng response cũ của route Node (không trả
    // loai_hanh_khach/la_chinh/so_dien_thoai/id_tai_khoan dù đã lưu CSDL).
    Ok(response::ok(json!({
        "id_hanh_khach": hk.id_hanh_khach,
        "ho_ten": hk.ho_ten,
        "ngay_sinh": hk.ngay_sinh,
        "cccd": hk.cccd,
    })))
}

/// GET /internal/passengers/:id
pub async fn get_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> Result<Json<serde_json::Value>, response::ApiError> {
    let mut client = state.db.lock().await;

    let hk = db::find_by_id(&mut client, id)
        .await
        .map_err(|e| response::server_error(&e.to_string()))?;

    match hk {
        Some(hk) => Ok(response::ok(serde_json::to_value(hk).unwrap())),
        None => Err(response::not_found("Không tìm thấy hành khách")),
    }
}
