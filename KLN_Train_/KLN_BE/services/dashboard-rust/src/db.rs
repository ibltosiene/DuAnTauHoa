use tiberius::{Client, Config, AuthMethod, Query};
use tokio::net::TcpStream;
use tokio_util::compat::TokioAsyncWriteCompatExt;

pub type DbClient = Client<tokio_util::compat::Compat<TcpStream>>;

pub struct AppState {
    pub db_config: Config,
}

/// Tạo config kết nối từ biến môi trường
pub fn build_config() -> Config {
    let mut config = Config::new();
    config.host(std::env::var("DB_HOST").unwrap_or("localhost".into()));
    config.port(std::env::var("DB_PORT").unwrap_or("1433".into()).parse().unwrap_or(1433));
    config.database(std::env::var("DB_NAME").unwrap_or("Trainn".into()));
    config.authentication(AuthMethod::sql_server(
        std::env::var("DB_USER").unwrap_or("sa".into()),
        std::env::var("DB_PASSWORD").unwrap_or_default(),
    ));
    config.trust_cert();
    config
}

/// Tạo connection mới tới SQL Server
pub async fn connect(cfg: &Config) -> Result<DbClient, String> {
    let tcp = TcpStream::connect(cfg.get_addr()).await
        .map_err(|e| format!("Không kết nối được SQL Server: {e}"))?;
    tcp.set_nodelay(true).ok();
    Client::connect(cfg.clone(), tcp.compat_write()).await
        .map_err(|e| format!("Lỗi đăng nhập SQL Server: {e}"))
}

/// Query trả về 1 giá trị f64
pub async fn query_f64(client: &mut DbClient, sql: &str) -> f64 {
    let result = match Query::new(sql).query(client).await {
        Ok(r) => r,
        Err(_) => return 0.0,
    };
    match result.into_row().await {
        Ok(Some(r)) => r.get::<f64, _>(0).unwrap_or(0.0),
        _ => 0.0,
    }
}

/// Query trả về 1 giá trị i32
pub async fn query_i32(client: &mut DbClient, sql: &str) -> i32 {
    let result = match Query::new(sql).query(client).await {
        Ok(r) => r,
        Err(_) => return 0,
    };
    match result.into_row().await {
        Ok(Some(r)) => r.get::<i32, _>(0).unwrap_or(0),
        _ => 0,
    }
}

/// Query trả về nhiều dòng
pub async fn query_rows(client: &mut DbClient, sql: &str) -> Result<Vec<tiberius::Row>, String> {
    let result = Query::new(sql).query(client).await
        .map_err(|e| format!("{e}"))?;
    result.into_first_result().await
        .map_err(|e| format!("{e}"))
}