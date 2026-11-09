# My Work observability (MOBL-65)

Telemetry contract and operational config for the personal work ("My Work") dashboard.
This repo contains configuration only; the web client, edge API gateway and task query
handlers must emit the signals described here.

## Metrics

OpenTelemetry instrument names are shown with the Prometheus series they produce through
the collector's Prometheus exporter (dots become underscores, units and `_total` are appended).

| OTel instrument | Type | Unit | Attributes | Prometheus series |
|---|---|---|---|---|
| `planner.my_work.query.latency` | Histogram | `ms` | `tenant_site_id`, `status_filter` | `planner_my_work_query_latency_milliseconds_{bucket,sum,count}` |
| `planner.my_work.status_update.latency` | Histogram | `ms` | `tenant_site_id` | `planner_my_work_status_update_latency_milliseconds_{bucket,sum,count}` |
| `planner.my_work.cache.hit_rate` | Counter | `1` | `result` = `hit` \| `miss` | `planner_my_work_cache_hit_rate_total` |
| `planner.my_work.mutation.errors` | Counter | `1` | `error_code`, `tenant_site_id` | `planner_my_work_mutation_errors_total` |

Notes:

- Record one `cache.hit_rate` increment per Redis lookup with `result=hit` or `result=miss`.
  The ratio is derived in Prometheus by the `planner:my_work_cache_hit_ratio:rate5m` recording rule.
- `status_filter` must come from a closed set (for example `open`, `in_progress`, `done`, `all`).
  Never put free-text filters or user IDs in attributes, to keep cardinality bounded.
- `error_code` must be a stable application error code, not an exception message.
- Histogram buckets (ms) are configured in the SDK view: `5, 10, 25, 50, 100, 150, 200, 300, 500, 1000, 2500`.
  Keep a bucket boundary at `200` so the SLA threshold is exact.

## Distributed tracing

Every hop uses W3C Trace Context (`traceparent`, `tracestate`) plus baggage.

| Hop | Requirement |
|---|---|
| Web client | Instrument `fetch`/XHR with the OTel web SDK; set `OTEL_PROPAGATORS=tracecontext,baggage`. |
| Edge API gateway | Forward `traceparent`, `tracestate` and `baggage` unchanged. Do not strip or regenerate them. Add them to CORS `Access-Control-Allow-Headers` and `Access-Control-Expose-Headers` for browser calls. |
| Task query handlers | Extract context from incoming headers, start server spans as children, and keep the context through async boundaries. |
| Database / Redis | Use the DB client instrumentation so each query is a child span of the handler span. |

All services export OTLP to the collector (`otel-collector.yaml`). Required environment:

```
OTEL_SERVICE_NAME=<service name>
OTEL_PROPAGATORS=tracecontext,baggage
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

## Synthetic monitoring

A Prometheus Blackbox Exporter probe hits the My Work query endpoint every 60 seconds
(`prometheus/prometheus.yml`, job `my-work-synthetic`). Alerts in
`prometheus/my-work-alerts.yml` fire when:

- the probe's P95 latency over 5 minutes exceeds 200 ms (`MyWorkSyntheticP95LatencyHigh`),
- availability over 30 days drops below 99.9% (`MyWorkSyntheticAvailabilityBelowSLA`),
- the probe fails for 3 minutes (`MyWorkSyntheticProbeDown`).

Server-side alerts cover the real-traffic query P95, the mutation error rate and the cache hit ratio.

`scripts/synthetic-probe.sh` is a dependency-free (curl) equivalent for environments without
Blackbox Exporter. It probes every 60 seconds, evaluates the same 200 ms P95 and 99.9%
availability thresholds, and posts to `ALERT_WEBHOOK_URL` on breach. Run `tests/synthetic-probe.test.sh` to test it.
GitHub Actions cron cannot schedule faster than every 5 minutes, so the probe is not run from a workflow.

## Setup placeholders

Replace before deploying:

- `https://my-work.example.com/api/my-work/query` in `prometheus/prometheus.yml`, and `PROBE_URL` for the script.
- `tempo:4317` in `otel-collector.yaml` with your trace backend.
