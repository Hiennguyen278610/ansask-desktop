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
