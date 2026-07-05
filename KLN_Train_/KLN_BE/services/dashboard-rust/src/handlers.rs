use actix_web::{get, web, HttpResponse};
use serde::Serialize;
use std::sync::Arc;
use crate::db::{connect, query_f64, query_i32, query_rows, AppState};

// ─── Helpers ─────────────────────────────────────────────────────

fn ok_json<T: Serialize>(data: T) -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({ "success": true, "data": data }))
}

fn err_json(msg: &str) -> HttpResponse {
    HttpResponse::InternalServerError().json(serde_json::json!({ "success": false, "message": msg }))
}

macro_rules! get_client {
    ($state:expr) => {
        match connect(&$state.db_config).await {
            Ok(c) => c,
            Err(e) => return err_json(&e),
        }
    };
}

// ─── 1. Thống kê tổng quan ───────────────────────────────────────

#[derive(Serialize)]
struct Stats {
    total_revenue: f64,
    total_tickets: i32,
    total_customers: i32,
    total_trains: i32,
    avg_occupancy: i32,
}

#[get("/api/admin/dashboard/stats")]
pub async fn get_stats(state: web::Data<Arc<AppState>>) -> HttpResponse {
    let mut c = get_client!(state);
    let revenue   = query_f64(&mut c, "SELECT CAST(ISNULL(SUM(tong_tien),0) AS FLOAT) FROM DonDatVe WHERE trang_thai='da_thanh_toan'").await;
    let tickets   = query_i32(&mut c, "SELECT COUNT(*) FROM Ve").await;
    let customers = query_i32(&mut c, "SELECT COUNT(*) FROM TaiKhoan WHERE vai_tro='khach_hang'").await;
    let trains    = query_i32(&mut c, "SELECT COUNT(*) FROM Tau WHERE trang_thai='hoat_dong'").await;
    ok_json(Stats { total_revenue: revenue, total_tickets: tickets, total_customers: customers, total_trains: trains, avg_occupancy: 0 })
}

// ─── 2. Doanh thu theo tháng ─────────────────────────────────────

#[get("/api/admin/dashboard/revenue-by-month")]
pub async fn get_revenue_by_month(state: web::Data<Arc<AppState>>) -> HttpResponse {
    let mut c = get_client!(state);
    let rows = match query_rows(&mut c,
        "SELECT MONTH(ngay_xuat_ve) AS m, YEAR(ngay_xuat_ve) AS y, CAST(ISNULL(SUM(gia_ve),0) AS FLOAT) AS rev, COUNT(*) AS tix
         FROM Ve v JOIN DonDatVe d ON v.id_don_dat_ve=d.id_don_dat_ve
         WHERE d.trang_thai='da_thanh_toan' AND ngay_xuat_ve>=DATEADD(month,-12,GETDATE())
         GROUP BY YEAR(ngay_xuat_ve),MONTH(ngay_xuat_ve) ORDER BY y,m"
    ).await {
        Ok(r) => r,
        Err(e) => return err_json(&e),
    };
    let data: Vec<serde_json::Value> = rows.iter().map(|r| serde_json::json!({
        "month": r.get::<i32,_>("m").unwrap_or(0),
        "year": r.get::<i32,_>("y").unwrap_or(0),
        "revenue": r.get::<f64,_>("rev").unwrap_or(0.0),
        "tickets": r.get::<i32,_>("tix").unwrap_or(0),
    })).collect();
    ok_json(data)
}

// ─── 3. Doanh thu theo tuần ──────────────────────────────────────

#[get("/api/admin/dashboard/revenue-by-week")]
pub async fn get_revenue_by_week(state: web::Data<Arc<AppState>>) -> HttpResponse {
    let mut c = get_client!(state);
    let rows = match query_rows(&mut c,
        "SELECT DATEPART(weekday,ngay_xuat_ve) AS dow, CAST(ISNULL(SUM(gia_ve),0) AS FLOAT) AS rev, COUNT(*) AS tix
         FROM Ve v JOIN DonDatVe d ON v.id_don_dat_ve=d.id_don_dat_ve
         WHERE d.trang_thai='da_thanh_toan' AND ngay_xuat_ve>=DATEADD(day,-7,GETDATE())
         GROUP BY DATEPART(weekday,ngay_xuat_ve)"
    ).await {
        Ok(r) => r,
        Err(e) => return err_json(&e),
    };
    let data: Vec<serde_json::Value> = rows.iter().map(|r| serde_json::json!({
        "day_of_week": r.get::<i32,_>("dow").unwrap_or(0),
        "revenue": r.get::<f64,_>("rev").unwrap_or(0.0),
        "tickets": r.get::<i32,_>("tix").unwrap_or(0),
    })).collect();
    ok_json(data)
}

// ─── 4. Tuyến phổ biến ──────────────────────────────────────────

#[get("/api/admin/dashboard/popular-routes")]
pub async fn get_popular_routes(state: web::Data<Arc<AppState>>) -> HttpResponse {
    let mut c = get_client!(state);
    let rows = match query_rows(&mut c,
        "SELECT TOP 5 g1.ten_ga AS f, g2.ten_ga AS t, COUNT(v.id_ve) AS tix, CAST(ISNULL(SUM(v.gia_ve),0) AS FLOAT) AS rev
         FROM Ve v JOIN GaTau g1 ON v.id_ga_len=g1.id_ga JOIN GaTau g2 ON v.id_ga_xuong=g2.id_ga
         JOIN DonDatVe d ON v.id_don_dat_ve=d.id_don_dat_ve WHERE d.trang_thai='da_thanh_toan'
         GROUP BY g1.ten_ga,g2.ten_ga ORDER BY tix DESC"
    ).await {
        Ok(r) => r,
        Err(e) => return err_json(&e),
    };
    let data: Vec<serde_json::Value> = rows.iter().map(|r| serde_json::json!({
        "from_station": r.get::<&str,_>("f").unwrap_or(""),
        "to_station": r.get::<&str,_>("t").unwrap_or(""),
        "total_tickets": r.get::<i32,_>("tix").unwrap_or(0),
        "total_revenue": r.get::<f64,_>("rev").unwrap_or(0.0),
    })).collect();
    ok_json(data)
}

// ─── 5. Đơn hàng gần đây ────────────────────────────────────────

#[get("/api/admin/dashboard/recent-orders")]
pub async fn get_recent_orders(state: web::Data<Arc<AppState>>) -> HttpResponse {
    let mut c = get_client!(state);
    let rows = match query_rows(&mut c,
        "SELECT TOP 10 d.ma_don AS id, tk.ho_ten AS customer, t.so_hieu AS train,
         g1.ten_ga AS f, g2.ten_ga AS t2, FORMAT(d.thoi_gian_dat,'yyyy-MM-dd') AS dt,
         CAST(d.tong_tien AS FLOAT) AS amt, d.trang_thai AS st
         FROM DonDatVe d JOIN TaiKhoan tk ON d.id_tai_khoan=tk.id_tai_khoan
         LEFT JOIN Ve v ON d.id_don_dat_ve=v.id_don_dat_ve
         LEFT JOIN ChuyenTau ct ON v.id_chuyen=ct.id_chuyen
         LEFT JOIN LichChay lc ON ct.id_lich_chay=lc.id_lich_chay
         LEFT JOIN Tau t ON lc.id_tau=t.id_tau
         LEFT JOIN GaTau g1 ON v.id_ga_len=g1.id_ga LEFT JOIN GaTau g2 ON v.id_ga_xuong=g2.id_ga
         ORDER BY d.thoi_gian_dat DESC"
    ).await {
        Ok(r) => r,
        Err(e) => return err_json(&e),
    };
    let data: Vec<serde_json::Value> = rows.iter().map(|r| serde_json::json!({
        "id": r.get::<&str,_>("id").unwrap_or(""),
        "customer": r.get::<&str,_>("customer").unwrap_or(""),
        "train": r.get::<&str,_>("train").unwrap_or(""),
        "from_station": r.get::<&str,_>("f").unwrap_or(""),
        "to_station": r.get::<&str,_>("t2").unwrap_or(""),
        "date": r.get::<&str,_>("dt").unwrap_or(""),
        "amount": r.get::<f64,_>("amt").unwrap_or(0.0),
        "status": r.get::<&str,_>("st").unwrap_or(""),
    })).collect();
    ok_json(data)
}

// ─── 6. Chuyến tàu sắp chạy ─────────────────────────────────────

#[get("/api/admin/dashboard/upcoming-trains")]
pub async fn get_upcoming_trains(state: web::Data<Arc<AppState>>) -> HttpResponse {
    let mut c = get_client!(state);
    let rows = match query_rows(&mut c,
        "SELECT TOP 10 t.so_hieu AS id, g1.ten_ga AS f, g2.ten_ga AS t2,
         FORMAT(lc.gio_khoi_hanh,'HH:mm') AS dep, ct.trang_thai AS st
         FROM ChuyenTau ct JOIN LichChay lc ON ct.id_lich_chay=lc.id_lich_chay
         JOIN Tau t ON lc.id_tau=t.id_tau
         JOIN GaTau g1 ON lc.id_ga_di=g1.id_ga JOIN GaTau g2 ON lc.id_ga_den=g2.id_ga
         WHERE ct.ngay_chay=CAST(GETDATE() AS DATE)
         ORDER BY lc.gio_khoi_hanh ASC"
    ).await {
        Ok(r) => r,
        Err(e) => return err_json(&e),
    };
    let data: Vec<serde_json::Value> = rows.iter().map(|r| serde_json::json!({
        "id": r.get::<&str,_>("id").unwrap_or(""),
        "from_station": r.get::<&str,_>("f").unwrap_or(""),
        "to_station": r.get::<&str,_>("t2").unwrap_or(""),
        "departure": r.get::<&str,_>("dep").unwrap_or(""),
        "status": r.get::<&str,_>("st").unwrap_or(""),
    })).collect();
    ok_json(data)
}

// ─── 7. Ga có lượt khách cao nhất ────────────────────────────────

#[get("/api/admin/dashboard/top-stations")]
pub async fn get_top_stations(state: web::Data<Arc<AppState>>) -> HttpResponse {
    let mut c = get_client!(state);
    let rows = match query_rows(&mut c,
        "SELECT TOP 5 g.ten_ga AS name, COUNT(v.id_ve) AS traffic
         FROM Ve v JOIN GaTau g ON v.id_ga_len=g.id_ga GROUP BY g.ten_ga ORDER BY traffic DESC"
    ).await {
        Ok(r) => r,
        Err(e) => return err_json(&e),
    };
    let data: Vec<serde_json::Value> = rows.iter().map(|r| serde_json::json!({
        "name": r.get::<&str,_>("name").unwrap_or(""),
        "traffic": r.get::<i32,_>("traffic").unwrap_or(0),
    })).collect();
    ok_json(data)
}

// ─── 8. Phân bố loại hành khách ──────────────────────────────────

#[get("/api/admin/dashboard/customer-distribution")]
pub async fn get_customer_distribution(state: web::Data<Arc<AppState>>) -> HttpResponse {
    let mut c = get_client!(state);
    let rows = match query_rows(&mut c,
        "SELECT loai_hanh_khach AS name, COUNT(*) AS value FROM HanhKhach GROUP BY loai_hanh_khach"
    ).await {
        Ok(r) => r,
        Err(e) => return err_json(&e),
    };
    let data: Vec<serde_json::Value> = rows.iter().map(|r| serde_json::json!({
        "name": r.get::<&str,_>("name").unwrap_or(""),
        "value": r.get::<i32,_>("value").unwrap_or(0),
    })).collect();
    ok_json(data)
}

// ─── 9. Tỷ lệ đúng giờ / hủy vé ────────────────────────────────

#[get("/api/admin/dashboard/rates")]
pub async fn get_rates(state: web::Data<Arc<AppState>>) -> HttpResponse {
    let mut c = get_client!(state);
    let ontime = query_f64(&mut c,
        "SELECT CAST(COUNT(CASE WHEN trang_thai='dung_gio' THEN 1 END)*100.0/NULLIF(COUNT(*),0) AS FLOAT)
         FROM ChuyenTau WHERE ngay_chay>=DATEADD(day,-30,GETDATE())").await;
    let cancel = query_f64(&mut c,
        "SELECT CAST(COUNT(CASE WHEN trang_thai='da_huy' THEN 1 END)*100.0/NULLIF(COUNT(*),0) AS FLOAT)
         FROM Ve WHERE ngay_xuat_ve>=DATEADD(day,-30,GETDATE())").await;
    ok_json(serde_json::json!({ "ontime_rate": ontime, "cancel_rate": cancel }))
}