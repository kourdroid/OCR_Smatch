export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[OpenTelemetry] Initializing server-side instrumentation...');

    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    const { trace, SpanStatusCode } = require('@opentelemetry/api');

    // Use dedicated traces endpoint if available, otherwise fall back to base endpoint with path
    const tracesEndpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
      `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`;
    console.log('[OpenTelemetry] OTLP Traces Endpoint:', tracesEndpoint);
    console.log('[OpenTelemetry] Headers configured:', !!process.env.OTEL_EXPORTER_OTLP_HEADERS);

    const exporter = new OTLPTraceExporter({
      url: tracesEndpoint,
      headers: process.env.OTEL_EXPORTER_OTLP_HEADERS ?
        Object.fromEntries(new URLSearchParams(process.env.OTEL_EXPORTER_OTLP_HEADERS.replace(/,/g, '&')).entries()) :
        {},
    });

    const sdk = new NodeSDK({
      serviceName: 'smatch-ocr-dashboard',
      traceExporter: exporter,
      instrumentations: [getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: true },
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-fetch': { enabled: true },
      })],
    });

    sdk.start();
    console.log('[OpenTelemetry] ✅ SDK started successfully');
    console.log('[OpenTelemetry] Service: smatch-ocr-dashboard');
    console.log('[OpenTelemetry] Auto-instrumentations enabled');

    // Create a test span to verify connectivity
    const tracer = trace.getTracer('smatch-ocr-dashboard', '1.0.0');
    const testSpan = tracer.startSpan('otel_init_test', {
      attributes: {
        'test.type': 'initialization',
        'test.timestamp': new Date().toISOString(),
      },
    });

    testSpan.addEvent('test_event', { message: 'OpenTelemetry initialization test' });
    testSpan.setStatus({ code: SpanStatusCode.OK });
    testSpan.end();

    console.log('[OpenTelemetry] 📤 Test span created and ended: otel_init_test');

    // Graceful shutdown
    process.on('SIGTERM', () => {
      sdk.shutdown()
        .then(() => console.log('[OpenTelemetry] SDK shut down successfully'))
        .catch((error: Error) => console.error('[OpenTelemetry] Error shutting down SDK:', error))
        .finally(() => process.exit(0));
    });
  }
}
