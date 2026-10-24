#!/bin/bash
set -e

# 1. DTO cho Stats
cat > src-tauri/src/dto/stats_dto.rs << 'EOF'
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatsOverviewReq {
    pub period: String, // "week" | "month" | "year"
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SeriesPointDto {
    pub label: String,
    pub count: i64,
    pub avg_score: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScoreDistributionDto {
    pub excellent_pct: f64,
    pub good_pct: f64,
    pub average_pct: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StatsOverviewDto {
    pub total_attempts: i64,
    pub avg_score: f64,
    pub total_questions: i64,
    pub accuracy_rate: f64,
    pub series: Vec<SeriesPointDto>,
    pub distribution: ScoreDistributionDto,
}
EOF

# 2. Repo Thống kê
cat > src-tauri/src/repositories/stats_repo.rs << 'EOF'
use crate::db::DbPool;
use crate::dto::stats_dto::{SeriesPointDto, StatsOverviewDto, ScoreDistributionDto};
use crate::error::AppError;

pub fn get_overview(pool: &DbPool, from_utc: &str, to_utc: &str, series: Vec<SeriesPointDto>) -> Result<StatsOverviewDto, AppError> {
    let conn = pool.get()?;
    
    // Metrics
    let mut stmt = conn.prepare(
        "SELECT count(*), coalesce(avg(score), 0), coalesce(sum(total_questions), 0), coalesce(sum(correct_count), 0)
         FROM attempts WHERE submitted_at >= ?1 AND submitted_at <= ?2"
    )?;
    let (total_attempts, avg_score, total_q, total_correct): (i64, f64, i64, i64) = stmt.query_row([from_utc, to_utc], |r| {
        Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?))
    })?;
    let accuracy_rate = if total_q > 0 { (total_correct as f64 / total_q as f64) * 100.0 } else { 0.0 };

    // Distribution (Dựa trên score trong kỳ)
    let mut dist_stmt = conn.prepare(
        "SELECT
            count(case when score >= 8.5 then 1 end),
            count(case when score >= 7.0 and score < 8.5 then 1 end),
            count(case when score < 7.0 then 1 end)
         FROM attempts WHERE submitted_at >= ?1 AND submitted_at <= ?2"
    )?;
    let (excellent, good, average): (i64, i64, i64) = dist_stmt.query_row([from_utc, to_utc], |r| {
        Ok((r.get(0)?, r.get(1)?, r.get(2)?))
    })?;
    let total_dist = std::cmp::max(1, excellent + good + average) as f64;

    Ok(StatsOverviewDto {
        total_attempts,
        avg_score: (avg_score * 10.0).round() / 10.0,
        total_questions: total_q,
        accuracy_rate: (accuracy_rate * 10.0).round() / 10.0,
        series,
        distribution: ScoreDistributionDto {
            excellent_pct: ((excellent as f64 / total_dist) * 1000.0).round() / 10.0,
            good_pct: ((good as f64 / total_dist) * 1000.0).round() / 10.0,
            average_pct: ((average as f64 / total_dist) * 1000.0).round() / 10.0,
        },
    })
}
EOF

# 3. Service Thống kê (Tính toán ranh giới thời gian)
cat > src-tauri/src/services/stats_service.rs << 'EOF'
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

    let from_utc = Ho_Chi_Minh.from_local_datetime(&from_hcm).unwrap().with_timezone(&Utc);
    let to_utc = Ho_Chi_Minh.from_local_datetime(&to_hcm).unwrap().with_timezone(&Utc);
    
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
    for r in rows { attempts_data.push(r?); }

    let series = if period == "week" {
        let mut s = Vec::new();
        for i in 0..7 {
            let d = from_hcm.date_naive() + Duration::days(i);
            let label = match d.weekday().num_days_from_monday() {
                0 => "T2", 1 => "T3", 2 => "T4", 3 => "T5", 4 => "T6", 5 => "T7", 6 => "CN", _ => ""
            };
            let day_str = d.format("%Y-%m-%d").to_string();
            let day_attempts: Vec<f64> = attempts_data.iter().filter(|(ts, _)| ts.starts_with(&day_str)).map(|(_, s)| *s).collect();
            let count = day_attempts.len() as i64;
            let avg = if count > 0 { day_attempts.iter().sum::<f64>() / count as f64 } else { 0.0 };
            s.push(SeriesPointDto { label: label.into(), count, avg_score: (avg * 10.0).round() / 10.0 });
        }
        s
    } else if period == "month" {
        // Chia làm 4 tuần
        let mut s = Vec::new();
        for w in 0..4 {
            let start_w = from_hcm.date_naive() + Duration::days(w * 7);
            let end_w = start_w + Duration::days(6);
            let week_attempts: Vec<f64> = attempts_data.iter().filter(|(ts, _)| {
                let d = ts[0..10].parse::<NaiveDate>().unwrap_or_default();
                d >= start_w && d <= end_w
            }).map(|(_, s)| *s).collect();
            let count = week_attempts.len() as i64;
            let avg = if count > 0 { week_attempts.iter().sum::<f64>() / count as f64 } else { 0.0 };
            s.push(SeriesPointDto { label: format!("Tuần {}", w + 1), count, avg_score: (avg * 10.0).round() / 10.0 });
        }
        s
    } else {
        // Chia làm 6 tháng gần nhất (từ tháng hiện tại lùi về trước)
        let mut s = Vec::new();
        for i in (0..6).rev() {
            let mut m = now_hcm.month() as i32 - i;
            let mut y = now_hcm.year();
            if m <= 0 { m += 12; y -= 1; }
            let label = format!("T{}", m);
            let month_str = format!("{:04}-{:02}", y, m);
            let month_attempts: Vec<f64> = attempts_data.iter().filter(|(ts, _)| ts.starts_with(&month_str)).map(|(_, s)| *s).collect();
            let count = month_attempts.len() as i64;
            let avg = if count > 0 { month_attempts.iter().sum::<f64>() / count as f64 } else { 0.0 };
            s.push(SeriesPointDto { label, count, avg_score: (avg * 10.0).round() / 10.0 });
        }
        s
    };

    stats_repo::get_overview(pool, &from_str, &to_str, series)
}
EOF

# 4. Commands
cat > src-tauri/src/commands/stats_cmds.rs << 'EOF'
use tauri::State;
use crate::state::AppState;
use crate::error::AppError;
use crate::dto::stats_dto::{StatsOverviewReq, StatsOverviewDto};
use crate::services::stats_service;

#[tauri::command]
pub fn stats_overview(state: State<'_, AppState>, req: StatsOverviewReq) -> Result<StatsOverviewDto, AppError> {
    stats_service::get_overview(&state.pool, &req.period)
}
EOF

# 5. Cập nhật Q-09: Giới hạn 200 câu trong quiz_service
python3 - << 'PYEOF'
p = 'src-tauri/src/services/quiz_service.rs'
s = open(p).read()
s = s.replace(
    'let n = std::cmp::min(req_count, exam.questions.len());',
    'let mut n = std::cmp::min(req_count, exam.questions.len());\n    if n > 200 { n = 200; }\n    if n == 0 { n = 1; }'
)
open(p, 'w').write(s)
PYEOF

# 6. Đăng ký modules
cat > src-tauri/src/dto/mod.rs << 'EOF'
pub mod subject_dto;
pub mod exam_dto;
pub mod import_dto;
pub mod quiz_dto;
pub mod attempt_dto;
pub mod trash_dto;
pub mod stats_dto;
EOF

cat > src-tauri/src/repositories/mod.rs << 'EOF'
pub mod setting_repo;
pub mod subject_repo;
pub mod exam_repo;
pub mod attempt_repo;
pub mod trash_repo;
pub mod stats_repo;
EOF

cat > src-tauri/src/services/mod.rs << 'EOF'
pub mod subject_service;
pub mod exam_service;
pub mod quiz_service;
pub mod attempt_service;
pub mod trash_service;
pub mod stats_service;
EOF

cat > src-tauri/src/commands/mod.rs << 'EOF'
pub mod settings_cmds;
pub mod subject_cmds;
pub mod exam_cmds;
pub mod import_cmds;
pub mod quiz_cmds;
pub mod attempt_cmds;
pub mod trash_cmds;
pub mod stats_cmds;
EOF

python3 - << 'PYEOF'
p = 'src-tauri/src/lib.rs'
s = open(p).read()
s = s.replace(
  'commands::trash_cmds::trash_empty,',
  'commands::trash_cmds::trash_empty,\n            commands::stats_cmds::stats_overview,'
)
open(p, 'w').write(s)
PYEOF

cd src-tauri && cargo fmt && cd ..
