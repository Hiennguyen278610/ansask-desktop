use crate::db::DbPool;
use crate::dto::stats_dto::{SeriesPointDto, StatsOverviewDto};
use crate::error::AppError;
use crate::repositories::stats_repo;
use chrono::{Datelike, Duration, NaiveDate, TimeZone, Utc};
use chrono_tz::Asia::Ho_Chi_Minh;

pub fn get_overview(pool: &DbPool, period: &str) -> Result<StatsOverviewDto, AppError> {
    let now_utc = Utc::now();
    let now_hcm = now_utc.with_timezone(&Ho_Chi_Minh);

    let (from_hcm, to_hcm) = match period {
        "week" => {
            let wd = now_hcm.weekday().num_days_from_monday() as i64;
            let start_date = now_hcm.date_naive() - Duration::days(wd);
            let start = start_date.and_hms_opt(0, 0, 0).unwrap();
            let end = start + Duration::days(7) - Duration::milliseconds(1);
            (start, end)
        }
        "month" => {
            let start_date = NaiveDate::from_ymd_opt(now_hcm.year(), now_hcm.month(), 1).unwrap();
            let start = start_date.and_hms_opt(0, 0, 0).unwrap();
            let next_month = if now_hcm.month() == 12 {
                NaiveDate::from_ymd_opt(now_hcm.year() + 1, 1, 1).unwrap()
            } else {
                NaiveDate::from_ymd_opt(now_hcm.year(), now_hcm.month() + 1, 1).unwrap()
            };
            let end = next_month.and_hms_opt(0, 0, 0).unwrap() - Duration::milliseconds(1);
            (start, end)
        }
        "year" => {
            let start_date = NaiveDate::from_ymd_opt(now_hcm.year(), 1, 1).unwrap();
            let start = start_date.and_hms_opt(0, 0, 0).unwrap();
            let next_year = NaiveDate::from_ymd_opt(now_hcm.year() + 1, 1, 1).unwrap();
            let end = next_year.and_hms_opt(0, 0, 0).unwrap() - Duration::milliseconds(1);
            (start, end)
        }
        _ => return Err(AppError::Internal("Kỳ thống kê không hợp lệ".into())),
    };

    let from_utc = Ho_Chi_Minh
        .from_local_datetime(&from_hcm)
        .unwrap()
        .with_timezone(&Utc);
    let to_utc = Ho_Chi_Minh
        .from_local_datetime(&to_hcm)
        .unwrap()
        .with_timezone(&Utc);

    // Format giống hệt DB: `YYYY-MM-DDTHH:MM:SS.sssZ`
    let from_str = from_utc.to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    let to_str = to_utc.to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

    // Lấy danh sách attempt để vẽ biểu đồ series (FE có thể vẽ, nhưng BE tính sẵn cho chuẩn)
    let conn = pool.get()?;
    let mut stmt = conn.prepare(
        "SELECT submitted_at, score FROM attempts WHERE submitted_at >= ?1 AND submitted_at <= ?2 ORDER BY submitted_at ASC"
    )?;
    let rows = stmt.query_map([&from_str, &to_str], |r| {
        Ok((r.get::<_, String>(0)?, r.get::<_, f64>(1)?))
    })?;

    let mut attempts_data = Vec::new();
    for r in rows {
        attempts_data.push(r?);
    }

    let series = if period == "week" {
        let mut s = Vec::new();
        for i in 0..7 {
            let d = from_hcm.date() + Duration::days(i);
            let label = match d.weekday().num_days_from_monday() {
                0 => "T2",
                1 => "T3",
                2 => "T4",
                3 => "T5",
                4 => "T6",
                5 => "T7",
                6 => "CN",
                _ => "",
            };
            let day_str = d.format("%Y-%m-%d").to_string();
            let day_attempts: Vec<f64> = attempts_data
                .iter()
                .filter(|(ts, _)| ts.starts_with(&day_str))
                .map(|(_, s)| *s)
                .collect();
            let count = day_attempts.len() as i64;
            let avg = if count > 0 {
                day_attempts.iter().sum::<f64>() / count as f64
            } else {
                0.0
            };
            s.push(SeriesPointDto {
                label: label.into(),
                count,
                avg_score: (avg * 10.0).round() / 10.0,
            });
        }
        s
    } else if period == "month" {
        // Chia làm 4 tuần
        let mut s = Vec::new();
        for w in 0..4 {
            let start_w = from_hcm.date() + Duration::days(w * 7);
            let end_w = start_w + Duration::days(6);
            let week_attempts: Vec<f64> = attempts_data
                .iter()
                .filter(|(ts, _)| {
                    let d = ts[0..10].parse::<NaiveDate>().unwrap_or_default();
                    d >= start_w && d <= end_w
                })
                .map(|(_, s)| *s)
                .collect();
            let count = week_attempts.len() as i64;
            let avg = if count > 0 {
                week_attempts.iter().sum::<f64>() / count as f64
            } else {
                0.0
            };
            s.push(SeriesPointDto {
                label: format!("Tuần {}", w + 1),
                count,
                avg_score: (avg * 10.0).round() / 10.0,
            });
        }
        s
    } else {
        // Chia làm 6 tháng gần nhất (từ tháng hiện tại lùi về trước)
        let mut s = Vec::new();
        for i in (0..6).rev() {
            let mut m = now_hcm.month() as i32 - i;
            let mut y = now_hcm.year();
            if m <= 0 {
                m += 12;
                y -= 1;
            }
            let label = format!("T{}", m);
            let month_str = format!("{:04}-{:02}", y, m);
            let month_attempts: Vec<f64> = attempts_data
                .iter()
                .filter(|(ts, _)| ts.starts_with(&month_str))
                .map(|(_, s)| *s)
                .collect();
            let count = month_attempts.len() as i64;
            let avg = if count > 0 {
                month_attempts.iter().sum::<f64>() / count as f64
            } else {
                0.0
            };
            s.push(SeriesPointDto {
                label,
                count,
                avg_score: (avg * 10.0).round() / 10.0,
            });
        }
        s
    };

    stats_repo::get_overview(pool, &from_str, &to_str, series)
}
