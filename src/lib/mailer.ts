import 'server-only';

type SendMailInput = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  fromName?: string;
};

type SendMailResult =
  | { ok: true; mode: 'console' }
  | { ok: true; mode: 'smtp' }
  | { ok: false; mode: 'smtp'; error: string };

type NodeMailerLike = {
  default?: {
    createTransport: (config: {
      host: string;
      port: number;
      secure: boolean;
      auth: { user: string; pass: string };
    }) => {
      sendMail: (message: {
        from: string;
        to: string;
        subject: string;
        html?: string;
        text?: string;
      }) => Promise<unknown>;
    };
  };
  createTransport?: (config: {
    host: string;
    port: number;
    secure: boolean;
    auth: { user: string; pass: string };
  }) => {
    sendMail: (message: {
      from: string;
      to: string;
      subject: string;
      html?: string;
      text?: string;
    }) => Promise<unknown>;
  };
};

const URL_PATTERN = /https?:\/\/[^\s"'<>]+/gi;

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
};

function extractUrls(content?: string): string[] {
  if (!content) return [];
  const matches = content.match(URL_PATTERN);
  return matches ? Array.from(new Set(matches)) : [];
}

function extractEmailAddress(from: string): string {
  const bracketMatch = from.match(/<([^>]+)>/);
  if (bracketMatch?.[1]) {
    return bracketMatch[1].trim();
  }
  return from.trim();
}

function formatFromHeader(from: string, fromName?: string): string {
  if (!fromName?.trim()) return from;
  const address = extractEmailAddress(from);
  return `${fromName.trim()} <${address}>`;
}

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user;

  if (!host || !portRaw || !user || !pass || !from) {
    return null;
  }

  const port = Number(portRaw);
  if (!Number.isFinite(port)) {
    return null;
  }

  return {
    host,
    port,
    user,
    pass,
    from,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
  };
}

async function loadNodeMailer(): Promise<NodeMailerLike> {
  // Runtime-only import prevents Turbopack from trying to resolve nodemailer in Option D mode.
  const runtimeImport = new Function('specifier', 'return import(specifier)') as (
    specifier: string,
  ) => Promise<NodeMailerLike>;
  return runtimeImport('nodemailer');
}

export async function sendMail({
  to,
  subject,
  html,
  text,
  fromName,
}: SendMailInput): Promise<SendMailResult> {
  const smtpConfig = getSmtpConfig();

  if (!smtpConfig) {
    const urls = Array.from(new Set([...extractUrls(text), ...extractUrls(html)]));

    console.log('================ DEV MAIL FALLBACK ================');
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);

    if (text) {
      console.log('TEXT:');
      console.log(text);
    }

    if (urls.length > 0) {
      console.log('URLS:');
      for (const url of urls) {
        console.log(`- ${url}`);
      }
    }

    console.log('===================================================');

    return { ok: true, mode: 'console' };
  }

  try {
    console.log('MAILER: smtp mode enabled');

    const nodemailerModule = await loadNodeMailer();

    const createTransport =
      nodemailerModule.default?.createTransport ?? nodemailerModule.createTransport;

    if (!createTransport) {
      return { ok: false, mode: 'smtp', error: 'nodemailer is unavailable' };
    }

    const transport = createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    await transport.sendMail({
      from: formatFromHeader(smtpConfig.from, fromName),
      to,
      subject,
      html,
      text,
    });

    return { ok: true, mode: 'smtp' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SMTP send failed';
    console.error('Failed to send mail via SMTP:', error);
    return { ok: false, mode: 'smtp', error: message };
  }
}
