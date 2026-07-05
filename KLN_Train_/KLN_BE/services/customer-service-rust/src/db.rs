// Kết nối SQL Server + các câu truy vấn cho bảng HanhKhach.
// Tương đương KLN_BE/shared/db.js (kết nối) + PassengerRepository.js (truy vấn) bên Node.
use chrono::NaiveDate;
use tiberius::{Client, Config, AuthMethod, Query, Row};
use tokio::net::TcpStream;
use tokio_util::compat::{Compat, TokioAsyncWriteCompatExt};

use crate::models::{FindOrCreateRequest, HanhKhach};

pub type DbClient = Client<Compat<TcpStream>>;

/// Kết nối tới SQL Server, đọc cấu hình từ biến môi trường — cùng bộ biến với
/// các service Node còn lại (DB_SERVER/DB_NAME/DB_USER/DB_PASSWORD/DB_PORT).
///
/// LƯU Ý QUAN TRỌNG về named instance (VD "DESKTOP-5DF60PC\SQLEXPRESS"): khác
/// với driver `tedious` bên Node (tự dò cổng qua SQL Browser UDP 1434), ở đây
/// đang kết nối TCP thẳng tới DB_PORT khai báo (mặc định 1433). Nếu SQL Server
/// của bạn là named instance và đang chạy ở cổng động, hãy vào SQL Server
/// Configuration Manager đặt TCP Port CỐ ĐỊNH cho instance đó rồi điền đúng
/// cổng vào DB_PORT — cách này chắc chắn hoạt động, tránh phải tự dò cổng.
pub async fn connect() -> Result<DbClient, Box<dyn std::error::Error>> {
    let db_server = std::env::var("DB_SERVER").expect("Thiếu biến môi trường DB_SERVER");
    let db_name = std::env::var("DB_NAME").expect("Thiếu biến môi trường DB_NAME");
    let db_user = std::env::var("DB_USER").expect("Thiếu biến môi trường DB_USER");
    let db_password = std::env::var("DB_PASSWORD").expect("Thiếu biến môi trường DB_PASSWORD");
    let db_port: u16 = std::env::var("DB_PORT")
        .unwrap_or_else(|_| "1433".to_string())
        .parse()
        .unwrap_or(1433);

    // Tách "HOST\INSTANCE" giống cách db.js bên Node xử lý DB_SERVER.
    let (host, instance) = match db_server.split_once('\\') {
        Some((h, i)) => (h.to_string(), Some(i.to_string())),
        None => (db_server.clone(), None),
    };

    let mut config = Config::new();
    config.host(&host);
    config.port(db_port);
    if let Some(inst) = &instance {
        config.instance_name(inst);
    }
    config.authentication(AuthMethod::sql_server(&db_user, &db_password));
    config.database(&db_name);
    // Tương đương encrypt:false, trustServerCertificate:true bên Node (db.js).
    config.trust_cert();

    let tcp = TcpStream::connect(format!("{host}:{db_port}")).await?;
    tcp.set_nodelay(true)?;
    let client = Client::connect(config, tcp.compat_write()).await?;
    Ok(client)
}

fn row_to_hanhkhach(row: Row) -> HanhKhach {
    let ngay_sinh: NaiveDate = row.get("ngay_sinh").expect("ngay_sinh không được null trong CSDL");
    HanhKhach {
        id_hanh_khach: row.get("id_hanh_khach").unwrap_or_default(),
        id_tai_khoan: row.get("id_tai_khoan"),
        ho_ten: row.get::<&str, _>("ho_ten").unwrap_or_default().to_string(),
        ngay_sinh: ngay_sinh.format("%Y-%m-%d").to_string(),
        cccd: row.get::<&str, _>("cccd").map(|s| s.to_string()),
        loai_hanh_khach: row.get::<&str, _>("loai_hanh_khach").unwrap_or_default().to_string(),
        so_dien_thoai: row.get::<&str, _>("so_dien_thoai").map(|s| s.to_string()),
        la_chinh: row.get("la_chinh").unwrap_or(false),
    }
}

const SELECT_COLS: &str =
    "id_hanh_khach, id_tai_khoan, ho_ten, ngay_sinh, cccd, loai_hanh_khach, so_dien_thoai, la_chinh";

/// Tương đương PassengerRepository.findByHoTenNgaySinh — so khớp theo họ tên
/// + ngày sinh (KHÔNG so theo CCCD, giữ đúng hành vi cũ).
pub async fn find_by_ho_ten_ngay_sinh(
    client: &mut DbClient,
    ho_ten: &str,
    ngay_sinh: NaiveDate,
) -> Result<Option<HanhKhach>, tiberius::error::Error> {
    let sql = format!("SELECT {SELECT_COLS} FROM HanhKhach WHERE ho_ten = @P1 AND ngay_sinh = @P2");
    let mut q = Query::new(sql);
    q.bind(ho_ten);
    q.bind(ngay_sinh);

    let stream = q.query(client).await?;
    let row = stream.into_row().await?;
    Ok(row.map(row_to_hanhkhach))
}

/// Tương đương PassengerRepository.create — tạo mới 1 HanhKhach, dùng OUTPUT
/// để lấy lại đúng bản ghi vừa tạo (bao gồm id_hanh_khach tự tăng) trong 1 câu lệnh.
pub async fn create_passenger(
    client: &mut DbClient,
    payload: &FindOrCreateRequest,
    ngay_sinh: NaiveDate,
) -> Result<HanhKhach, tiberius::error::Error> {
    let sql = format!(
        "INSERT INTO HanhKhach (id_tai_khoan, ho_ten, ngay_sinh, cccd, loai_hanh_khach, so_dien_thoai, la_chinh)
         OUTPUT {}
         VALUES (@P1, @P2, @P3, @P4, @P5, @P6, @P7)",
        SELECT_COLS
            .split(", ")
            .map(|c| format!("INSERTED.{c}"))
            .collect::<Vec<_>>()
            .join(", ")
    );

    let mut q = Query::new(sql);
    q.bind(payload.id_tai_khoan);
    q.bind(payload.ho_ten.as_str());
    q.bind(ngay_sinh);
    q.bind(payload.cccd.as_deref());
    q.bind(payload.loai_hanh_khach.as_str());
    q.bind(payload.so_dien_thoai.as_deref());
    q.bind(payload.la_chinh.unwrap_or(false));

    let stream = q.query(client).await?;
    let row = stream
        .into_row()
        .await?
        .expect("INSERT ... OUTPUT phải trả về đúng 1 dòng vừa tạo");
    Ok(row_to_hanhkhach(row))
}

/// Tương đương PassengerRepository (findById/findByPk) — tra 1 hành khách theo id.
pub async fn find_by_id(client: &mut DbClient, id: i32) -> Result<Option<HanhKhach>, tiberius::error::Error> {
    let sql = format!("SELECT {SELECT_COLS} FROM HanhKhach WHERE id_hanh_khach = @P1");
    let mut q = Query::new(sql);
    q.bind(id);

    let stream = q.query(client).await?;
    let row = stream.into_row().await?;
    Ok(row.map(row_to_hanhkhach))
}
