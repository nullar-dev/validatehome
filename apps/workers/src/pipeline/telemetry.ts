interface LogEvent {
  readonly traceId: string;
  readonly sourceId: string;
  readonly stage: string;
  readonly durationMs?: number;
  readonly result: "ok" | "error";
  readonly details?: Record<string, unknown>;
}

export function logStructuredEvent(event: LogEvent): void {
  process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), ...event })}\n`);
}
