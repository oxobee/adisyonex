export type TelephonyProviderType = "NETGSM" | "BULUTFON" | "GENERIC_SIP";

export type CallLifecycleEvent = "RINGING" | "ANSWERED" | "ENDED" | "MISSED";

export interface NormalizedTelephonyEvent {
  provider: TelephonyProviderType;
  providerCallId: string;
  fromNumber: string;
  normalizedFromNumber: string;
  toNumber?: string;
  sipExtension?: string;
  event: CallLifecycleEvent;
  timestamp: Date;
  rawPayload?: Record<string, unknown>;
}

export interface TelephonyCredentials {
  apiUsername?: string | null;
  apiPassword?: string | null;
  incomingNumber?: string | null;
  sipExtension?: string | null;
}

export interface TelephonyConnectionTestResult {
  success: boolean;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface ITelephonyProvider {
  readonly name: TelephonyProviderType;
  testConnection(credentials: TelephonyCredentials): Promise<TelephonyConnectionTestResult>;
  parseWebhook(
    body: Record<string, unknown>,
    query?: Record<string, string>
  ): NormalizedTelephonyEvent | null;
}
