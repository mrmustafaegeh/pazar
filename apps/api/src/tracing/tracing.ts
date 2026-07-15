import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | null = null;

/**
 * OpenTelemetry bootstrap — call before NestFactory.create in main.ts.
 * Enable with OTEL_ENABLED=true and optionally OTEL_EXPORTER_OTLP_ENDPOINT.
 */
export function initTracing(): void {
  if (process.env.OTEL_ENABLED !== 'true' || sdk) return;

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const exporter = endpoint ? new OTLPTraceExporter({ url: endpoint }) : undefined;

  sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'turkiye-pazaryeri-api',
    }),
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  process.on('SIGTERM', () => sdk?.shutdown());
}
