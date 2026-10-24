use chrono::{DateTime, Duration, Utc};
use chrono_tz::Asia::Ho_Chi_Minh;
use chrono_tz::Tz;

#[allow(dead_code)]
pub fn now_utc() -> DateTime<Utc> {
    Utc::now()
}

#[allow(dead_code)]
pub fn now_iso_utc() -> String {
    now_utc().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}

#[allow(dead_code)]
pub fn to_hcm(dt: DateTime<Utc>) -> DateTime<Tz> {
    dt.with_timezone(&Ho_Chi_Minh)
}

#[allow(dead_code)]
#[derive(Debug, Clone, Copy)]
pub enum PeriodKind {
    Week,
    Month,
    Year,
}

/// Sprint 07 hoàn thiện biên tuần/tháng/năm theo Asia/Ho_Chi_Minh.
/// Sprint 00: cửa sổ 7 ngày gần nhất.
#[allow(dead_code)]
pub fn boundaries_of(_kind: PeriodKind, _anchor: DateTime<Utc>) -> (DateTime<Utc>, DateTime<Utc>) {
    let now = now_utc();
    (now - Duration::days(7), now + Duration::days(1))
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{Datelike, TimeZone};

    #[test]
    fn hcm_offset_is_seven_hours() {
        let utc = Utc.with_ymd_and_hms(2026, 10, 24, 0, 0, 0).unwrap();
        assert_eq!(to_hcm(utc).format("%H:%M").to_string(), "07:00");
    }

    #[test]
    fn hcm_wraps_to_next_day_after_17utc() {
        let utc = Utc.with_ymd_and_hms(2026, 10, 23, 20, 0, 0).unwrap();
        let hcm = to_hcm(utc);
        assert_eq!(hcm.day(), 24);
        assert_eq!(hcm.format("%H:%M").to_string(), "03:00");
    }

    #[test]
    fn now_iso_is_utc_millis() {
        let iso = now_iso_utc();
        assert!(iso.ends_with('Z'), "phải là UTC (Z)");
        assert!(iso.contains('.'), "phải có mili-giây");
    }
}
