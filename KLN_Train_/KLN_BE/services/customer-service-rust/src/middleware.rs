// Bảo vệ route /internal/* — mirror đúng KLN_BE/shared/internalAuth.js:
// chỉ cho qua nếu header x-internal-key khớp biến môi trường INTERNAL_API_KEY.
use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

pub async fn require_internal_key(req: Request, next: Next) -> Response {
    let expected = std::env::var("INTERNAL_API_KEY").unwrap_or_default();
    let provided = req
        .headers()
        .get("x-internal-key")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if expected.is_empty() || provided != expected {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({ "success": false, "message": "Forbidden: internal endpoint" })),
        )
            .into_response();
    }

    next.run(req).await
}
