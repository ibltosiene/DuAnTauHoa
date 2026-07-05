mod db;
mod handlers;

use actix_cors::Cors;
use actix_web::{App, HttpServer, web};
use std::sync::Arc;
use db::AppState;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    let port: u16 = std::env::var("PORT").unwrap_or("4017".into()).parse().unwrap_or(4017);

    let state = Arc::new(AppState { db_config: db::build_config() });
    println!("🚀 dashboard-rust đang chạy tại http://localhost:{port}");

    HttpServer::new(move || {
        App::new()
            .wrap(Cors::permissive())
            .app_data(web::Data::new(state.clone()))
            .service(handlers::get_stats)
            .service(handlers::get_revenue_by_month)
            .service(handlers::get_revenue_by_week)
            .service(handlers::get_popular_routes)
            .service(handlers::get_recent_orders)
            .service(handlers::get_upcoming_trains)
            .service(handlers::get_top_stations)
            .service(handlers::get_customer_distribution)
            .service(handlers::get_rates)
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}