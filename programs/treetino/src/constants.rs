pub const DAY: i64 = 86_400;
pub const INTERVALS: usize = 96;
pub const SCALE: u128 = 1_000_000_000_000_000_000;

pub mod seeds {
    pub const TREE: &[u8] = b"tree";
    pub const SHARES: &[u8] = b"shares";
    pub const FUNDING: &[u8] = b"funding";
    pub const REVENUE: &[u8] = b"revenue";
    pub const POSITION: &[u8] = b"position";
    pub const REPORT: &[u8] = b"report";
}
