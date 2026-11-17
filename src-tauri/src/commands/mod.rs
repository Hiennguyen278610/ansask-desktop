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
