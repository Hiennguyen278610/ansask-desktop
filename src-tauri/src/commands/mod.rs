mod attempt;
mod exam;
mod session;
mod stats;
mod subject;
mod trash;

pub use attempt::*;
pub use exam::*;
pub use session::*;
pub use stats::*;
pub use subject::*;
pub use trash::*;

pub(crate) fn limit(value: i64) -> usize {
    value.clamp(1, 100) as usize
}

#[tauri::command]
pub fn open_external_url(url: String) -> Result<(), crate::error::AppError> {
    if !url.starts_with("https://") && !url.starts_with("http://") {
        return Err(crate::error::AppError::Validation(
            "Chỉ hỗ trợ mở liên kết http/https".into(),
        ));
    }

    #[cfg(target_os = "linux")]
    std::process::Command::new("xdg-open").arg(&url).spawn()?;

    #[cfg(target_os = "macos")]
    std::process::Command::new("open").arg(&url).spawn()?;

    #[cfg(target_os = "windows")]
    std::process::Command::new("rundll32")
        .args(["url.dll,FileProtocolHandler", &url])
        .spawn()?;

    Ok(())
}
