use unicode_normalization::UnicodeNormalization;

/// Canonical key theo ADR-001 §2: trim -> NFC -> to_lowercase
pub fn canonicalize(s: &str) -> String {
    s.trim().nfc().collect::<String>().to_lowercase()
}
