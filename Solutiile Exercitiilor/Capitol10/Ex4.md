Ex4. Dashboard Grafana: request rate, p95 latency, error rate + alertă

-----

Metrici tipice (Prometheus)
-> http_requests_total (counter)
-> http_request_duration_seconds (histogram)
-> http_responses_total{status="5xx"} sau similar

-----

Query‑uri pentru Grafana
```
Request rate:
sum(rate(http_requests_total[1m]))
```
-----

p95 latency:
```
histogram_quantile(
  0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)
```
-----

Error rate:
```sum(rate(http_responses_total{status_code=~"5.."}[1m]))```

-----


Alertă p95 > 800ms timp de 5 minute
În Grafana (Alerting):
```
Query: p95 latency (cel de mai sus)
Condition: WHEN last() OF query > 0.8
For: 5m
Severity: critical
```