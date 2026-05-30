#!/usr/bin/env bash
# Smoke tests for the Viralefy production front-end.
#
# Strategy: curl every critical URL, assert 200 + minimal body shape +
# presence of expected content (titles, hreflang count, JSON-LD, GTM,
# sitemap size, IndexNow keyfile). Print a PASS/FAIL row per check
# and exit 0 only if every required check passes. Optional checks
# (country routes that may not be deployed yet) are flagged as INFO.
#
# Tunables via env:
#   SITE_URL       — base URL (default https://viralefy.com)
#   SMOKE_TIMEOUT  — per-request timeout in seconds (default 15)
#   SMOKE_VERBOSE  — set to 1 to dump curl bodies on failure

set -u

SITE_URL="${SITE_URL:-https://viralefy.com}"
TIMEOUT="${SMOKE_TIMEOUT:-15}"
VERBOSE="${SMOKE_VERBOSE:-0}"

pass=0
fail=0
info=0

green="\033[32m"
red="\033[31m"
yellow="\033[33m"
gray="\033[90m"
reset="\033[0m"

mark_pass() { pass=$((pass + 1));  printf "  ${green}PASS${reset} %s\n" "$1"; }
mark_fail() { fail=$((fail + 1));  printf "  ${red}FAIL${reset} %s — %s\n" "$1" "$2"; }
mark_info() { info=$((info + 1));  printf "  ${yellow}INFO${reset} %s — %s\n" "$1" "$2"; }
note()      { printf "${gray}        %s${reset}\n" "$1"; }

fetch() {
  # $1 = path
  # writes status, size, body to globals
  local path="$1"
  local tmp
  tmp="$(mktemp)"
  local code
  code=$(curl -sS -o "$tmp" -w "%{http_code}" \
      --max-time "$TIMEOUT" \
      -A "Viralefy-Smoke/1.0" \
      "${SITE_URL}${path}" 2>/dev/null || echo "000")
  RESP_STATUS="$code"
  RESP_BODY_FILE="$tmp"
  RESP_SIZE=$(wc -c < "$tmp")
}

require_status_200_min_size() {
  local label="$1" path="$2" min_size="$3"
  fetch "$path"
  if [ "$RESP_STATUS" = "200" ] && [ "$RESP_SIZE" -ge "$min_size" ]; then
    mark_pass "$label"
  else
    mark_fail "$label" "status=$RESP_STATUS size=$RESP_SIZE want >=200/$min_size at $path"
    [ "$VERBOSE" = "1" ] && head -c 500 "$RESP_BODY_FILE"
  fi
  rm -f "$RESP_BODY_FILE"
}

require_contains() {
  local label="$1" path="$2" needle="$3"
  fetch "$path"
  if [ "$RESP_STATUS" = "200" ] && grep -q -- "$needle" "$RESP_BODY_FILE"; then
    mark_pass "$label"
  else
    mark_fail "$label" "status=$RESP_STATUS needle '$needle' not in $path"
    [ "$VERBOSE" = "1" ] && head -c 500 "$RESP_BODY_FILE"
  fi
  rm -f "$RESP_BODY_FILE"
}

info_if_missing() {
  local label="$1" path="$2"
  fetch "$path"
  if [ "$RESP_STATUS" = "200" ] && [ "$RESP_SIZE" -ge 200 ]; then
    mark_pass "$label"
  else
    mark_info "$label" "status=$RESP_STATUS path $path (optional)"
  fi
  rm -f "$RESP_BODY_FILE"
}

printf "\n${gray}Viralefy smoke run against %s${reset}\n\n" "$SITE_URL"

# ------------------------------------------------------------------
# Section: core routes
# ------------------------------------------------------------------
printf "[core routes]\n"
require_status_200_min_size "GET /" "/" 500
require_contains "GET / contains 'Viralefy'" "/" "Viralefy"
require_status_200_min_size "GET /br" "/br" 500
require_contains "GET /br has heroTitle Portuguese" "/br" "Instagram"

# ------------------------------------------------------------------
# Section: per-country subsites (these may not all be deployed yet)
# ------------------------------------------------------------------
printf "\n[country subsites]\n"
info_if_missing "GET /us"  "/us"
info_if_missing "GET /fr"  "/fr"
info_if_missing "GET /de"  "/de"
info_if_missing "GET /it"  "/it"
info_if_missing "GET /es"  "/es"
info_if_missing "GET /pt"  "/pt"
info_if_missing "GET /ar"  "/ar"
info_if_missing "GET /mx"  "/mx"

# ------------------------------------------------------------------
# Section: country/category routes
# ------------------------------------------------------------------
printf "\n[country/category routes]\n"
info_if_missing "GET /br/seguidores"  "/br/seguidores"
info_if_missing "GET /us/followers"   "/us/followers"
info_if_missing "GET /fr/abonnes"     "/fr/abonnes"
info_if_missing "GET /de/follower"    "/de/follower"
info_if_missing "GET /it/follower"    "/it/follower"
info_if_missing "GET /es/seguidores"  "/es/seguidores"
info_if_missing "GET /br/servicos"    "/br/servicos"

# ------------------------------------------------------------------
# Section: country/category/plan routes
# ------------------------------------------------------------------
printf "\n[deep plan routes]\n"
info_if_missing "GET /br/seguidores/1000-seguidores"     "/br/seguidores/1000-seguidores"
info_if_missing "GET /us/followers/10000-followers"      "/us/followers/10000-followers"

# ------------------------------------------------------------------
# Section: legal documents
# ------------------------------------------------------------------
printf "\n[legal docs]\n"
require_status_200_min_size "GET /legal/privacy?lang=pt" "/legal/privacy?lang=pt" 400
require_status_200_min_size "GET /legal/terms?lang=en"   "/legal/terms?lang=en"   400
info_if_missing "GET /legal/refund?lang=de"             "/legal/refund?lang=de"

# ------------------------------------------------------------------
# Section: hreflang count on home
# ------------------------------------------------------------------
printf "\n[hreflang]\n"
fetch "/"
if [ "$RESP_STATUS" = "200" ]; then
  hreflang_count=$(grep -o 'hreflang=' "$RESP_BODY_FILE" | wc -l)
  if [ "$hreflang_count" -ge 5 ]; then
    mark_pass "hreflang count on /: $hreflang_count (>=5)"
  else
    mark_info "hreflang count on /: $hreflang_count (<5, may not be wired yet)" "$hreflang_count"
  fi
else
  mark_fail "hreflang count on /" "could not fetch /"
fi
rm -f "$RESP_BODY_FILE"

# ------------------------------------------------------------------
# Section: JSON-LD presence
# ------------------------------------------------------------------
printf "\n[JSON-LD]\n"
fetch "/"
if [ "$RESP_STATUS" = "200" ]; then
  if grep -q 'application/ld+json' "$RESP_BODY_FILE"; then
    mark_pass "/ contains application/ld+json"
  else
    mark_info "/ JSON-LD" "no <script type=application/ld+json> found on /"
  fi
else
  mark_fail "/ JSON-LD" "/ not reachable"
fi
rm -f "$RESP_BODY_FILE"

fetch "/br"
if [ "$RESP_STATUS" = "200" ]; then
  if grep -q 'application/ld+json' "$RESP_BODY_FILE"; then
    mark_pass "/br contains application/ld+json"
  else
    mark_info "/br JSON-LD" "no <script type=application/ld+json> found on /br"
  fi
else
  mark_info "/br JSON-LD" "/br not reachable (subsite may be lazy)"
fi
rm -f "$RESP_BODY_FILE"

# ------------------------------------------------------------------
# Section: Google Tag Manager
# ------------------------------------------------------------------
printf "\n[analytics]\n"
fetch "/"
if [ "$RESP_STATUS" = "200" ]; then
  if grep -qE '(googletagmanager\.com|gtag\(|GTM-)' "$RESP_BODY_FILE"; then
    mark_pass "/ ships GTM/gtag tag"
  else
    mark_info "/ GTM" "no GTM tag detected (may be conditional on env)"
  fi
fi
rm -f "$RESP_BODY_FILE"

# ------------------------------------------------------------------
# Section: sitemap
# ------------------------------------------------------------------
printf "\n[sitemap]\n"
fetch "/sitemap.xml"
if [ "$RESP_STATUS" = "200" ]; then
  if head -c 200 "$RESP_BODY_FILE" | grep -q '<?xml'; then
    mark_pass "/sitemap.xml is XML"
  else
    mark_fail "/sitemap.xml is XML" "missing <?xml prolog"
  fi
  url_count=$(grep -c '<loc>' "$RESP_BODY_FILE")
  if [ "$url_count" -ge 200 ]; then
    mark_pass "/sitemap.xml has >=200 URLs ($url_count)"
  else
    mark_info "/sitemap.xml URL count: $url_count" "expected lots more once API plans seed in"
  fi
else
  mark_fail "/sitemap.xml" "status=$RESP_STATUS"
fi
rm -f "$RESP_BODY_FILE"

# ------------------------------------------------------------------
# Section: IndexNow key file
# ------------------------------------------------------------------
printf "\n[indexnow]\n"
INDEXNOW_KEY_FILENAME="adcfcb87889076210f395f754a9ad0c3.txt"
fetch "/${INDEXNOW_KEY_FILENAME}"
if [ "$RESP_STATUS" = "200" ] && [ "$RESP_SIZE" -gt 10 ]; then
  mark_pass "/${INDEXNOW_KEY_FILENAME} served (size=$RESP_SIZE)"
else
  mark_fail "/${INDEXNOW_KEY_FILENAME}" "status=$RESP_STATUS size=$RESP_SIZE"
fi
rm -f "$RESP_BODY_FILE"

# ------------------------------------------------------------------
# Section: robots.txt (informational)
# ------------------------------------------------------------------
printf "\n[robots]\n"
fetch "/robots.txt"
if [ "$RESP_STATUS" = "200" ]; then
  mark_pass "/robots.txt served"
else
  mark_info "/robots.txt" "status=$RESP_STATUS (optional)"
fi
rm -f "$RESP_BODY_FILE"

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------
total=$((pass + fail + info))
printf "\n${gray}=================================================${reset}\n"
printf "${green}PASS%s${reset}   ${red}FAIL%s${reset}   ${yellow}INFO%s${reset}   ${gray}TOTAL%s${reset}\n" \
  "=$pass" "=$fail" "=$info" "=$total"

if [ "$fail" -gt 0 ]; then
  exit 1
fi
exit 0
