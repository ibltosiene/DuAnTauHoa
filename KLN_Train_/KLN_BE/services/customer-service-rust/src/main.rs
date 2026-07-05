mod db;
mod handlers;
mod middleware;
mod models;
mod response;

use axum::{
    middleware as axum_middleware,
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tokio::sync::Mutex;

/// State dùng chung cho mọi handler — 1 kết nối SQL Server bọc Mutex.
/// Đơn giản, đủ dùng cho service tần suất thấp như customer-service (chỉ được
/// gọi lúc booking-service tạo đơn đặt vé) — mọi truy vấn chạy tuần tự qua
/// cùng 1 connection. Muốn xử lý đồng thời nhiều hơn, có thể thay bằng pool
/// (VD crate bb8-tiberius) mà không phải đổi gì ở tầng handler/db phía trên.
pub struct AppState {
    pub db: Mutex<db::DbClient>,
}

#[tokio::main]
async fn main() {
    // Nạp .env theo đường dẫn thư mục crate này (CARGO_MANIFEST_DIR, cố định
    // lúc build) — KHÔNG dùng dotenvy::dotenv() vì nó chỉ tìm ".env" theo thư
    // mục làm việc hiện tại (cwd) lúc chạy. Root package.json khởi động service
    // này bằng `cargo run --manifest-path .../Cargo.toml` từ thư mục gốc
    // monorepo, nên cwd lúc đó KHÔNG phải thư mục của service này — nếu dùng
    // dotenv() mặc định sẽ không thấy file .env và thiếu hết biến môi trường.
    let env_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join(".env");
    dotenvy::from_path(&env_path).ok();
    tracing_subscriber::fmt::init();

    let service_name = std::env::var("SERVICE_NAME").unwrap_or_else(|_| "customer-service".to_string());
    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "4005".to_string())
        .parse()
        .expect("PORT không hợp lệ");

    let client = db::connect().await.expect("Không kết nối được SQL Server");
    let state = Arc::new(AppState { db: Mutex::new(client) });

    // Router /internal/passengers/* — bảo vệ bằng X-Internal-Key, chỉ service
    // khác (qua serviceClient) gọi được, không đi qua Gateway.
    let internal_routes = Router::new()
        .route("/find-or-create", post(handlers::find_or_create))
        .route("/:id", get(handlers::get_by_id))
        .layer(axum_middleware::from_fn(middleware::require_internal_key));

    let app = Router::new()
        .route("/health", get(handlers::health))
        .nest("/internal/passengers", internal_routes)
        .with_state(state);

    let addr = format!("0.0.0.0:{port}");
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap_or_else(|e| panic!("Không bind được cổng {port}: {e}"));

    println!("🧑‍🤝‍🧑 {service_name} (Rust) đang chạy tại http://localhost:{port}");
    axum::serve(listener, app).await.expect("Server dừng bất thường");
}
