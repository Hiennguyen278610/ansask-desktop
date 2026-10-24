#!/usr/bin/env bash
# Nghiệm thu Sprint 00 — hạ tầng. Chạy bằng pnpm. Bất kỳ bước fail → dừng.
set -euo pipefail

say() { printf '\n\033[1;36m== %s ==\033[0m\n' "$*"; }

# ---------- Version gate ----------
command -v pnpm >/dev/null 2>&1 || {
  echo "FAIL: chưa cài pnpm. Chạy: corepack enable && corepack prepare pnpm@latest --activate" >&2
  exit 1
}
say "Version gate — node $(node --version)"
say "Version gate — pnpm $(pnpm --version)"
say "Version gate — rustc $(rustc --version)"

# ---------- FE ----------
say "FE · cài dependency"
# pnpm không có --no-audit/--no-fund. --prefer-offline tăng tốc lần sau.
pnpm install --prefer-offline

say "FE · lint"
pnpm run lint

say "FE · build (tsc + vite)"
pnpm run build

say "FE · test (vitest + jsdom)"
pnpm run test

# ---------- BE ----------
say "BE · fmt check"
(cd src-tauri && cargo fmt --check)

say "BE · clippy -D warnings"
(cd src-tauri && cargo clippy --all-targets -- -D warnings)

say "BE · test (migrations, pool, repo, time, error)"
(cd src-tauri && cargo test -- --nocapture)

say "BE · build dev profile"
(cd src-tauri && cargo build)

# ---------- Sanity checks ----------
say "Anti-flash script sanity"
if ! grep -q "prefers-color-scheme" index.html; then
  echo "FAIL: index.html không có fallback prefers-color-scheme" >&2
  exit 1
fi

say "Hex-token sanity: không hex ngoài tokens.css"
if grep -rnE "#[0-9a-fA-F]{3,8}\b" \
     src/styles/neumorphic.css src/index.css \
     src/components src/features src/lib src/theme src/hooks src/stores 2>/dev/null; then
  echo "FAIL: có hex ngoài tokens.css (xem output trên)" >&2
  exit 1
fi

say "Bảng DB sanity"
if ! grep -q "CREATE TABLE IF NOT EXISTS app_settings" \
     src-tauri/src/db/migrations/001_init.sql; then
  echo "FAIL: thiếu app_settings trong 001_init.sql" >&2
  exit 1
fi

say "Lockfile sanity — phải commit pnpm-lock.yaml"
if [ ! -f pnpm-lock.yaml ]; then
  echo "FAIL: thiếu pnpm-lock.yaml — chạy 'pnpm install' rồi commit" >&2
  exit 1
fi

say "pnpm-workspace.yaml sanity — phải có allowBuilds cho esbuild"
if [ ! -f pnpm-workspace.yaml ]; then
  echo "FAIL: thiếu pnpm-workspace.yaml (pnpm 11 cần cho allowBuilds)" >&2
  exit 1
fi
if ! grep -qE "^\s*esbuild:\s*true\s*$" pnpm-workspace.yaml; then
  echo "FAIL: pnpm-workspace.yaml thiếu 'esbuild: true' trong allowBuilds" >&2
  exit 1
fi
if ! grep -qE "^\s*packages:" pnpm-workspace.yaml; then
  echo "FAIL: pnpm-workspace.yaml thiếu field 'packages:'" >&2
  exit 1
fi

say "OK — Sprint 00 đạt DONE"
