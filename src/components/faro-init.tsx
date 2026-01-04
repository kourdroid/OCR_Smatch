'use client';

import { useEffect } from 'react';
import { initializeFaro, faro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

export function FaroInit() {
  useEffect(() => {
    console.log('[Faro] Initializing browser-side instrumentation...');

    const faroUrl = 'https://collect-eu-west-2.grafana.net/collect/f1c837e3c9327c216594e148c7d3e9ab';
    console.log('[Faro] Collector URL:', faroUrl);

    try {
      const faroInstance = initializeFaro({
        url: faroUrl,
        app: {
          name: 'smatch-ocr-dashboard',
          version: '1.0.0',
          environment: 'production',
        },
        instrumentations: [
          new TracingInstrumentation(),
        ],
        // DISABLE BATCHING - Send immediately for debugging
        batching: {
          enabled: false,
        },
      });

      console.log('[Faro] ✅ SDK initialized successfully');
      console.log('[Faro] App: smatch-ocr-dashboard');
      console.log('[Faro] Batching: DISABLED (immediate send)');

      // Force a test event to verify connectivity
      if (faroInstance && faroInstance.api) {
        faroInstance.api.pushEvent('faro_init_test', {
          source: 'manual_test',
          timestamp: new Date().toISOString(),
        });
        console.log('[Faro] 📤 Test event pushed: faro_init_test');

        // Also push a log
        faroInstance.api.pushLog(['[Faro] Test log message from smatch-ocr-dashboard']);
        console.log('[Faro] 📤 Test log pushed');
      }

    } catch (error) {
      console.error('[Faro] ❌ Failed to initialize:', error);
    }
  }, []);

  return null;
}
