import type { App } from '../../src/app.js';
import { buttonIds, buttonTitles, messageText, type FakeGraphApi, type SentMessage } from './fake-graph-api.js';
import type { Clock } from '../../src/shared/clock.js';
import { buttonReplyWebhook, mediaWebhook, nextWamid, signedRequest, templateButtonWebhook, textWebhook } from './webhooks.js';
import { TEST_APP_SECRET } from './test-app.js';

/**
 * Simulates a WhatsApp customer. In 'direct' mode the webhook payload goes to
 * the InboundService and the worker is drained synchronously (deterministic
 * integration tests). In 'http' mode payloads are signed and POSTed to the
 * listening server and replies are awaited from the running worker (E2E).
 */
export class CustomerSim {
  private seen = 0;

  constructor(
    private readonly app: App,
    private readonly graph: FakeGraphApi,
    private readonly clock: Clock,
    readonly phoneNumberId: string,
    readonly waId: string,
    private readonly mode: { kind: 'direct' } | { kind: 'http'; baseUrl: string } = { kind: 'direct' },
    readonly profileName = 'Cliente',
  ) {}

  /** All messages the business sent to this customer. */
  get inbox(): SentMessage[] {
    return this.graph.sent.filter((m) => m.body.to === this.waId);
  }

  get lastMessage(): SentMessage | undefined {
    return this.inbox[this.inbox.length - 1];
  }

  async say(text: string, wamid = nextWamid()): Promise<string[]> {
    return this.deliver(textWebhook({ phoneNumberId: this.phoneNumberId, from: this.waId, wamid, at: this.clock.now(), text, profileName: this.profileName }));
  }

  /** Taps a button (or list row) of the most recent interactive message by its visible title. */
  async tap(title: string): Promise<string[]> {
    const msg = [...this.inbox].reverse().find((m) => buttonTitles(m.body).includes(title));
    if (!msg) throw new Error(`no button "${title}" in messages to ${this.waId}: ${JSON.stringify(this.inbox.map((m) => buttonTitles(m.body)))}`);
    const idx = buttonTitles(msg.body).indexOf(title);
    const id = buttonIds(msg.body)[idx] as string;
    return this.deliver(buttonReplyWebhook({ phoneNumberId: this.phoneNumberId, from: this.waId, at: this.clock.now(), replyId: id, title, profileName: this.profileName }));
  }

  async tapTemplateButton(payload: string, text: string): Promise<string[]> {
    return this.deliver(templateButtonWebhook({ phoneNumberId: this.phoneNumberId, from: this.waId, at: this.clock.now(), payload, text, profileName: this.profileName }));
  }

  async sendAudio(): Promise<string[]> {
    return this.deliver(mediaWebhook({ phoneNumberId: this.phoneNumberId, from: this.waId, at: this.clock.now(), type: 'audio' }));
  }

  /** Delivers a raw payload (also used to replay duplicates). */
  async deliver(payload: unknown, expectReplies = true): Promise<string[]> {
    if (this.mode.kind === 'direct') {
      await this.app.services.inbound.handleWebhook(payload);
      await this.app.worker!.drain();
      return this.newReplies();
    }
    const { payload: body, headers } = signedRequest(payload, TEST_APP_SECRET);
    const res = await fetch(`${this.mode.baseUrl}/webhooks/whatsapp`, { method: 'POST', body, headers });
    if (res.status !== 200) throw new Error(`webhook POST failed: ${res.status} ${await res.text()}`);
    if (!expectReplies) return [];
    return this.waitForReplies();
  }

  /** E2E: waits until the running worker sends at least one new message (or times out). */
  async waitForReplies(timeoutMs = 10_000): Promise<string[]> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (this.inbox.length > this.seen) {
        // allow a short burst of follow-up messages to land
        await new Promise((r) => setTimeout(r, 150));
        return this.newReplies();
      }
      await new Promise((r) => setTimeout(r, 25));
    }
    return this.newReplies();
  }

  newReplies(): string[] {
    const fresh = this.inbox.slice(this.seen);
    this.seen = this.inbox.length;
    return fresh.map((m) => messageText(m.body));
  }
}
