/**
 * Base Email Template
 *
 * Shared styles and layout for all transactional emails.
 */

export interface EmailTemplate {
  subject: string;
  html: string;
}

/**
 * Wrap email content in a beautiful, responsive template
 */
export function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Studek</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }

    /* Base styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #09090b;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
    }

    /* Button styles */
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      transition: all 0.2s ease;
    }

    .button:hover {
      background: linear-gradient(135deg, #7c7ff2 0%, #9d72f7 100%);
    }

    /* Link styles */
    a {
      color: #8b5cf6;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    /* Responsive styles */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      .content-padding {
        padding: 24px !important;
      }
      .mobile-center {
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b;">
  <!-- Background wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #09090b;">
    <tr>
      <td style="padding: 40px 20px;">
        <!-- Email container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="email-container" style="max-width: 600px; margin: 0 auto;">

          <!-- Logo Header -->
          <tr>
            <td style="padding: 0 0 32px 0; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="color: #ffffff; font-size: 24px; font-weight: bold;">S</span>
                  </td>
                  <td style="padding-left: 12px;">
                    <span style="color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Studek</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #18181b; border-radius: 16px; border: 1px solid #27272a;">
                <tr>
                  <td class="content-padding" style="padding: 40px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 0 0 0; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                Studek - Smart flashcards with spaced repetition
              </p>
              <p style="margin: 0; color: #52525b; font-size: 12px; line-height: 1.6;">
                This email was sent by Studek. If you didn't expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
