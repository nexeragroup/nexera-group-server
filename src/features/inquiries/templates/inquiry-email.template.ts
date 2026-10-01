import { NewInquiry } from '../dto/inquiries.dto';

export interface InquiryEmailContent {
  subject: string;
  text: string;
  html: string;
}

export function createInquiryEmail(
  inquiry: NewInquiry,
  subjectPrefix: string,
): InquiryEmailContent {
  const names = escapeHtml(inquiry.names);
  const email = escapeHtml(inquiry.email);
  const phone = escapeHtml(inquiry.phone ?? 'Not provided');
  const company = escapeHtml(inquiry.company ?? 'Not provided');
  const service = escapeHtml(inquiry.service);
  const budget = escapeHtml(inquiry.budget ?? 'Not specified');
  const projectDetails = escapeHtml(inquiry.projectDetails).replace(
    /\n/g,
    '<br>',
  );

  const subject = `[${subjectPrefix}] ${inquiry.service} — ${inquiry.names}`;

  const text = [
    'New Nexera website inquiry',
    '',
    `Name: ${inquiry.names}`,
    `Email: ${inquiry.email}`,
    `Phone: ${inquiry.phone ?? 'Not provided'}`,
    `Company: ${inquiry.company ?? 'Not provided'}`,
    `Service: ${inquiry.service}`,
    `Estimated budget: ${inquiry.budget ?? 'Not specified'}`,
    '',
    'Project details:',
    inquiry.projectDetails,
  ].join('\n');

  const html = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >
        <title>${escapeHtml(subject)}</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background: #f4f6f8;
          font-family: Arial, Helvetica, sans-serif;
          color: #17202a;
        "
      >
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          style="background: #f4f6f8; padding: 32px 16px;"
        >
          <tr>
            <td align="center">
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                style="
                  max-width: 680px;
                  background: #ffffff;
                  border-radius: 14px;
                  overflow: hidden;
                  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
                "
              >
                <tr>
                  <td
                    style="
                      padding: 28px 32px;
                      background: #111827;
                      color: #ffffff;
                    "
                  >
                    <div
                      style="
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 1.5px;
                        opacity: 0.75;
                      "
                    >
                      Nexera Group
                    </div>

                    <h1
                      style="
                        margin: 8px 0 0;
                        font-size: 24px;
                        line-height: 1.3;
                      "
                    >
                      New website inquiry
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 32px;">
                    <p
                      style="
                        margin: 0 0 24px;
                        font-size: 16px;
                        line-height: 1.7;
                      "
                    >
                      A potential client submitted a request through the
                      Nexera Group website.
                    </p>

                    ${createDetailRow('Full name', names)}
                    ${createDetailRow('Email address', email)}
                    ${createDetailRow('Phone number', phone)}
                    ${createDetailRow('Company', company)}
                    ${createDetailRow('Service required', service)}
                    ${createDetailRow('Estimated budget', budget)}

                    <div style="margin-top: 26px;">
                      <div
                        style="
                          margin-bottom: 8px;
                          color: #6b7280;
                          font-size: 12px;
                          font-weight: 700;
                          text-transform: uppercase;
                          letter-spacing: 0.8px;
                        "
                      >
                        Project details
                      </div>

                      <div
                        style="
                          padding: 18px;
                          border: 1px solid #e5e7eb;
                          border-radius: 10px;
                          background: #f9fafb;
                          font-size: 15px;
                          line-height: 1.7;
                        "
                      >
                        ${projectDetails}
                      </div>
                    </div>

                    <div
                      style="
                        margin-top: 28px;
                        padding-top: 22px;
                        border-top: 1px solid #e5e7eb;
                        color: #6b7280;
                        font-size: 13px;
                        line-height: 1.6;
                      "
                    >
                      Reply directly to this email to respond to
                      <strong>${names}</strong>.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return {
    subject,
    text,
    html,
  };
}

function createDetailRow(label: string, value: string): string {
  return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      style="
        margin-bottom: 10px;
        border-bottom: 1px solid #f0f1f3;
      "
    >
      <tr>
        <td
          width="190"
          style="
            padding: 12px 0;
            color: #6b7280;
            font-size: 13px;
            font-weight: 700;
          "
        >
          ${label}
        </td>

        <td
          style="
            padding: 12px 0;
            color: #111827;
            font-size: 14px;
          "
        >
          ${value}
        </td>
      </tr>
    </table>
  `;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character] ?? character,
  );
}
