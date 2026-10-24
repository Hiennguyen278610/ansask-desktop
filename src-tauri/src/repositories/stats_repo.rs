use crate::db::DbPool;
use crate::dto::stats_dto::{ScoreDistributionDto, SeriesPointDto, StatsOverviewDto};
use crate::error::AppError;

pub fn get_overview(
    pool: &DbPool,
    from_utc: &str,
    to_utc: &str,
    series: Vec<SeriesPointDto>,
) -> Result<StatsOverviewDto, AppError> {
    let conn = pool.get()?;

    // Metrics
    let mut stmt = conn.prepare(
        "SELECT count(*), coalesce(avg(score), 0), coalesce(sum(total_questions), 0), coalesce(sum(correct_count), 0)
         FROM attempts WHERE submitted_at >= ?1 AND submitted_at <= ?2"
    )?;
    let (total_attempts, avg_score, total_q, total_correct): (i64, f64, i64, i64) = stmt
        .query_row([from_utc, to_utc], |r| {
            Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?))
        })?;
    let accuracy_rate = if total_q > 0 {
        (total_correct as f64 / total_q as f64) * 100.0
    } else {
        0.0
    };

    // Distribution (Dựa trên score trong kỳ)
    let mut dist_stmt = conn.prepare(
        "SELECT
            count(case when score >= 8.5 then 1 end),
            count(case when score >= 7.0 and score < 8.5 then 1 end),
            count(case when score < 7.0 then 1 end)
         FROM attempts WHERE submitted_at >= ?1 AND submitted_at <= ?2",
    )?;
    let (excellent, good, average): (i64, i64, i64) = dist_stmt
        .query_row([from_utc, to_utc], |r| {
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
