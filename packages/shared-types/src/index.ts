export interface Tenant {
  id: string;
  name: string;
  email: string;
  hashedApiKey: string;
  createdAt: Date;
}

export interface NotificationPayload {
  channel: 'email' | 'sms' | 'webhook';
  to: string;
  subject?: string;
  body: string;
  idempotencyKey?: string;
}

export type NotificationStatus = 'queued' | 'processing' | 'delivered' | 'failed' | 'dead';