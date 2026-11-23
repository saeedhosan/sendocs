curl -sS \
  -o /dev/null \
  -w "HTTP %{http_code} | Total: %{time_total}s\n" \
  -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "auth-benchmark@sendocs.local",
    "password": "LocalBenchmarkPass!2026"
  }'
