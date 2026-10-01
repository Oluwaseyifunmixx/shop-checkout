import "server-only";

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function getMailgunConfig() {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const baseUrl = process.env.MAILGUN_API_BASE_URL ?? "https://api.mailgun.net";

  if (!apiKey || !domain) {
    throw new Error("Missing MAILGUN_API_KEY or MAILGUN_DOMAIN. Add them to .env.local.");
  }

  return { apiKey, domain, baseUrl };
}

export async function sendEmail({ to, subject, text, html }: SendEmailParams): Promise<void> {
  const { apiKey, domain, baseUrl } = getMailgunConfig();

  const body = new URLSearchParams({
    from: `Crafted <postmaster@${domain}>`,
    to,
    subject,
    text,
    html,
  });

  const credentials = Buffer.from(`api:${apiKey}`).toString("base64");

  const response = await fetch(`${baseUrl}/v3/${domain}/messages`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}` },
    body,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Mailgun request failed (${response.status}): ${details}`);
  }
}