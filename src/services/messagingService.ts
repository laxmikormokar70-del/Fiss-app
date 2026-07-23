export interface MessagingRecipient {
  studentId: string;
  name: string;
  rollNumber: string;
  phone: string;
  email?: string;
  className?: string;
  batchName?: string;
}

export interface AttachmentFile {
  name: string;
  type: 'image' | 'pdf' | 'document';
  url?: string;
  size?: string;
  fileObject?: File;
}

export type MessagingChannel = 'sms' | 'whatsapp' | 'email' | 'all';

export interface MessagingPayload {
  subject: string;
  message: string;
  recipients: MessagingRecipient[];
  attachments?: AttachmentFile[];
  channel: MessagingChannel;
  providerConfig?: {
    smsGatewayUrl?: string;
    smsApiKey?: string;
    whatsappApiToken?: string;
    whatsappPhoneNumberId?: string;
    emailSmtpHost?: string;
  };
}

export interface SendResult {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  channel: MessagingChannel;
  messageId: string;
  timestamp: string;
  logs: string[];
}

export interface MessageDraft {
  id: string;
  subject: string;
  message: string;
  selectedClass: string;
  selectedBatch: string;
  recipientIds: string[];
  updatedAt: string;
}

/**
 * Replace placeholders like {student_name}, {roll_number}, {class_name}, {batch_name}
 */
export function interpolateMessage(template: string, recipient: MessagingRecipient): string {
  if (!template) return '';
  return template
    .replace(/\{student_name\}/gi, recipient.name || 'Student')
    .replace(/\{name\}/gi, recipient.name || 'Student')
    .replace(/\{roll_number\}/gi, recipient.rollNumber || 'N/A')
    .replace(/\{class_name\}/gi, recipient.className || 'Class')
    .replace(/\{batch_name\}/gi, recipient.batchName || 'Batch');
}

/**
 * Modular Messaging Service Layer ready for future Gateway / WhatsApp / Email API integration.
 */
export class MessagingService {
  private static instance: MessagingService;

  public static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  /**
   * Dispatch Bulk Message across SMS Gateway, WhatsApp API, or Email API
   */
  public async sendBulkMessage(payload: MessagingPayload): Promise<SendResult> {
    const { recipients, subject, message, attachments, channel } = payload;
    const logs: string[] = [];

    logs.push(`[${new Date().toLocaleTimeString()}] Initializing ${channel.toUpperCase()} bulk dispatch...`);
    logs.push(`[Service] Total selected recipients: ${recipients.length}`);

    // Simulate API network handshake / Gateway payload formatting
    await new Promise((resolve) => setTimeout(resolve, 1200));

    let successCount = 0;
    let failCount = 0;

    recipients.forEach((rec, idx) => {
      const formattedText = interpolateMessage(message, rec);
      if (rec.phone || rec.email) {
        successCount++;
        if (idx < 5) {
          logs.push(`[OK] Queued to ${rec.name} (${rec.phone || rec.email}): "${formattedText.slice(0, 30)}..."`);
        }
      } else {
        failCount++;
        logs.push(`[WARN] Skipped ${rec.name} - missing phone/email`);
      }
    });

    if (attachments && attachments.length > 0) {
      logs.push(`[Attachments] Processed ${attachments.length} attachment file(s)`);
    }

    const messageId = `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    logs.push(`[${new Date().toLocaleTimeString()}] Dispatch complete. Message ID: ${messageId}`);

    return {
      success: true,
      totalSent: successCount,
      totalFailed: failCount,
      channel,
      messageId,
      timestamp: new Date().toISOString(),
      logs
    };
  }

  /**
   * Save Draft to Local Storage
   */
  public async saveDraft(draft: MessageDraft): Promise<void> {
    try {
      const existing = localStorage.getItem('coaching_sms_drafts');
      const drafts: MessageDraft[] = existing ? JSON.parse(existing) : [];
      const index = drafts.findIndex((d) => d.id === draft.id);
      if (index >= 0) {
        drafts[index] = draft;
      } else {
        drafts.push(draft);
      }
      localStorage.setItem('coaching_sms_drafts', JSON.stringify(drafts));
    } catch (e) {
      console.warn('Failed to save draft:', e);
    }
  }

  /**
   * Load Saved Drafts
   */
  public async loadDrafts(): Promise<MessageDraft[]> {
    try {
      const existing = localStorage.getItem('coaching_sms_drafts');
      return existing ? JSON.parse(existing) : [];
    } catch (e) {
      return [];
    }
  }
}

export const messagingService = MessagingService.getInstance();
