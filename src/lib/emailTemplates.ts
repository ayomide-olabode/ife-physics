import 'server-only';

type EmailTemplateInput = {
  link: string;
  expiresMinutes: number;
};

type EmailTemplateOutput = {
  subject: string;
  text: string;
  html: string;
};

function buildBaseTemplate({
  subject,
  heading,
  intro,
  actionLabel,
  link,
  expiresMinutes,
}: {
  subject: string;
  heading?: string;
  intro: string;
  actionLabel: string;
  link: string;
  expiresMinutes: number;
}): EmailTemplateOutput {
  const introHtml = intro.replace(/\n/g, '<br />');
  const text = [
    `${intro}`,
    '',
    `${actionLabel}: ${link}`,
    '',
    `This link expires in ${expiresMinutes} minutes.`,
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      ${heading ? `<h2>${heading}</h2>` : ''}
      <p>${introHtml}</p>
      <p>
        <a href="${link}" style="display:inline-block;padding:10px 14px;background:#0b5fff;color:#fff;text-decoration:none;border-radius:6px;">
          ${actionLabel}
        </a>
      </p>
      <p style="word-break: break-all;">
        If the button does not work, copy and open this link:<br />
        <a href="${link}">${link}</a>
      </p>
      <p>This link expires in ${expiresMinutes} minutes.</p>
    </div>
  `.trim();

  return { subject, text, html };
}

export function buildInviteEmail({
  link,
  expiresMinutes,
}: EmailTemplateInput): EmailTemplateOutput {
  return buildBaseTemplate({
    subject: 'Staff Account Invite Link',
    intro: 'Dear new user,\nKindly use the link below to finish setting up your account.',
    actionLabel: 'Complete account setup',
    link,
    expiresMinutes,
  });
}

export function buildResetEmail({ link, expiresMinutes }: EmailTemplateInput): EmailTemplateOutput {
  return buildBaseTemplate({
    subject: 'Staff Account password reset link',
    heading: 'Your Staff Account password reset link',
    intro: 'Use the link below to reset your password.',
    actionLabel: 'Reset password',
    link,
    expiresMinutes,
  });
}
