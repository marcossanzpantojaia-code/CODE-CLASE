/**
 * Outbound message content. Builders enforce WhatsApp limits up-front so an
 * invalid message never reaches the provider (where it would fail permanently).
 */

export interface ButtonOption {
  id: string;
  title: string;
}

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

export type OutboundContent =
  | { type: 'text'; text: string }
  | { type: 'buttons'; text: string; buttons: ButtonOption[] }
  | { type: 'list'; text: string; buttonLabel: string; rows: ListRow[] }
  | {
      type: 'template';
      name: string;
      language: string;
      bodyParams: string[];
      /** One payload per quick-reply button, in template button order. */
      quickReplyPayloads: string[];
      /** Human-readable rendering stored for audit / staff view. */
      fallbackText: string;
    };

export const WA_LIMITS = {
  textBody: 4096,
  interactiveBody: 1024,
  buttonTitle: 20,
  buttonId: 256,
  maxButtons: 3,
  listButtonLabel: 20,
  listRowTitle: 24,
  listRowDescription: 72,
  listRowId: 200,
  maxListRows: 10,
  templateParam: 1024,
} as const;

function clip(text: string, max: number): string {
  const chars = [...text];
  return chars.length <= max ? text : `${chars.slice(0, max - 1).join('')}…`;
}

export function textMessage(text: string): OutboundContent {
  return { type: 'text', text: clip(text.trim(), WA_LIMITS.textBody) };
}

export function buttonsMessage(text: string, buttons: ButtonOption[]): OutboundContent {
  if (buttons.length === 0 || buttons.length > WA_LIMITS.maxButtons) {
    throw new Error(`buttons message needs 1-${WA_LIMITS.maxButtons} buttons, got ${buttons.length}`);
  }
  const ids = new Set<string>();
  const titles = new Set<string>();
  const safe = buttons.map((b) => {
    if (b.id.length === 0 || b.id.length > WA_LIMITS.buttonId) throw new Error('invalid button id');
    if (ids.has(b.id)) throw new Error('duplicate button id');
    ids.add(b.id);
    const title = clip(b.title.trim(), WA_LIMITS.buttonTitle);
    if (titles.has(title)) throw new Error('duplicate button title');
    titles.add(title);
    return { id: b.id, title };
  });
  return { type: 'buttons', text: clip(text.trim(), WA_LIMITS.interactiveBody), buttons: safe };
}

export function listMessage(text: string, buttonLabel: string, rows: ListRow[]): OutboundContent {
  if (rows.length === 0 || rows.length > WA_LIMITS.maxListRows) throw new Error(`list needs 1-${WA_LIMITS.maxListRows} rows`);
  return {
    type: 'list',
    text: clip(text.trim(), WA_LIMITS.interactiveBody),
    buttonLabel: clip(buttonLabel, WA_LIMITS.listButtonLabel),
    rows: rows.map((r) => {
      if (r.id.length === 0 || r.id.length > WA_LIMITS.listRowId) throw new Error('invalid row id');
      return {
        id: r.id,
        title: clip(r.title, WA_LIMITS.listRowTitle),
        ...(r.description ? { description: clip(r.description, WA_LIMITS.listRowDescription) } : {}),
      };
    }),
  };
}

/** Template parameters cannot contain newlines/tabs or more than 4 consecutive spaces. */
export function sanitizeTemplateParam(value: string): string {
  return clip(value.replace(/[\n\r\t]+/g, ' ').replace(/ {4,}/g, '   ').trim(), WA_LIMITS.templateParam) || '-';
}

export function templateMessage(params: {
  name: string;
  language: string;
  bodyParams: string[];
  quickReplyPayloads?: string[];
  fallbackText: string;
}): OutboundContent {
  return {
    type: 'template',
    name: params.name,
    language: params.language,
    bodyParams: params.bodyParams.map(sanitizeTemplateParam),
    quickReplyPayloads: params.quickReplyPayloads ?? [],
    fallbackText: params.fallbackText,
  };
}

/** Plain-text rendering for storage, staff view and logs-free audit. */
export function renderPlainText(content: OutboundContent): string {
  switch (content.type) {
    case 'text':
      return content.text;
    case 'buttons':
      return `${content.text}\n${content.buttons.map((b) => `[${b.title}]`).join(' ')}`;
    case 'list':
      return `${content.text}\n${content.rows.map((r) => `• ${r.title}`).join('\n')}`;
    case 'template':
      return content.fallbackText;
  }
}
