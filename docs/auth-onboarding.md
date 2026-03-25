# Auth Onboarding and Password Reset

## Delivery Mode (Option D)

- SMTP is currently not configured.
- Email links are logged by the server mailer fallback (`src/lib/mailer.ts`) instead of being sent.
- For invite/reset flows, check the server console for the logged link block.

## APP_URL

- Set `APP_URL` in your environment to the public base URL used to build invite/reset links.
- Example:
  - local: `APP_URL=http://localhost:3000`
  - production: `APP_URL=https://physics.ife.edu.ng`

## Token Rules

- Invite link token (`INVITE`) expires after 60 minutes.
- Password reset token (`PASSWORD_RESET`) expires after 30 minutes.
- Resend throttling: a new email for the same token context can only be sent after 5 minutes.
