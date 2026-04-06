import { Resend } from 'resend'
import { formatDateGR } from './coupon-logic'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not configured')
  return new Resend(key)
}

export async function sendCouponEmail({
  customerName,
  customerEmail,
  couponCode,
  discountAmount,
  expiresAt,
}: {
  customerName: string
  customerEmail: string
  couponCode: string
  discountAmount: number
  expiresAt: string
}) {
  const expiryFormatted = formatDateGR(expiresAt)
  const year = new Date().getFullYear()

  const html = `
<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Κουπόνι ΤΑΚΗΣ</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#b91c1c,#dc2626);padding:40px 30px;text-align:center;">
              <div style="width:70px;height:70px;background:#ffffff;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="font-size:32px;font-weight:900;color:#b91c1c;">T</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:900;letter-spacing:-0.5px;">ΤΑΚΗΣ</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Fast Food · Λάρισα</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 30px 0;">
              <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Γεια σου, ${customerName}! 🎉</h2>
              <p style="margin:0;color:#6b7280;font-size:15px;line-height:1.6;">
                Σκάναρες επιτυχώς την απόδειξή σου και κέρδισες κουπόνι έκπτωσης για την επόμενη παραγγελία σου στον <strong>ΤΑΚΗ</strong>!
              </p>
            </td>
          </tr>

          <!-- Coupon Box -->
          <tr>
            <td style="padding:24px 30px;">
              <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border:2px dashed #f59e0b;border-radius:16px;padding:28px;text-align:center;">
                <p style="margin:0 0 6px;font-size:13px;color:#92400e;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Κουπόνι Έκπτωσης</p>
                <div style="font-size:52px;font-weight:900;color:#b91c1c;margin:8px 0;">€${discountAmount}</div>
                <p style="margin:0 0 20px;color:#78350f;font-size:14px;">έκπτωση στην επόμενη παραγγελία σου</p>
                
                <!-- QR Code Image -->
                <div style="background:#ffffff;border-radius:12px;padding:16px;display:inline-block;margin-bottom:12px;">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?data=${couponCode}&size=160x160&margin=4&color=111827"
                    alt="QR Κωδικός Κουπονιού"
                    width="160"
                    height="160"
                    style="display:block;"
                  />
                </div>
                <br/>
                <!-- 6-digit Code -->
                <div style="background:#ffffff;border-radius:10px;padding:14px 28px;display:inline-block;">
                  <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Κωδικός Κουπονιού</p>
                  <p style="margin:0;font-family:monospace;font-size:32px;font-weight:900;color:#b91c1c;letter-spacing:8px;">${couponCode}</p>
                </div>

                <p style="margin:16px 0 0;font-size:12px;color:#92400e;">
                  ⏰ Ισχύει έως: <strong>${expiryFormatted}</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding:0 30px 24px;">
              <div style="background:#f9fafb;border-radius:12px;padding:20px;">
                <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#374151;">Πώς να το εξαργυρώσεις:</p>
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:5px 0;">
                      <span style="background:#b91c1c;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-block;text-align:center;line-height:22px;font-size:12px;font-weight:700;margin-right:10px;">1</span>
                      <span style="font-size:13px;color:#6b7280;">Πήγαινε στο κατάστημα ΤΑΚΗΣ στη Λάρισα</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;">
                      <span style="background:#b91c1c;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-block;text-align:center;line-height:22px;font-size:12px;font-weight:700;margin-right:10px;">2</span>
                      <span style="font-size:13px;color:#6b7280;">Κάνε την παραγγελία σου</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;">
                      <span style="background:#b91c1c;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-block;text-align:center;line-height:22px;font-size:12px;font-weight:700;margin-right:10px;">3</span>
                      <span style="font-size:13px;color:#6b7280;">Δείξε τον κωδικό <strong style="color:#b91c1c;font-size:16px;letter-spacing:3px;">${couponCode}</strong> ή το QR στον ταμία</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Warning -->
          <tr>
            <td style="padding:0 30px 32px;">
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 16px;">
                <p style="margin:0;font-size:12px;color:#dc2626;">
                  ⚠️ Το κουπόνι χρησιμοποιείται μόνο <strong>μία φορά</strong> και ισχύει αποκλειστικά στο κατάστημα ΤΑΚΗΣ στη Βόλου 75, Λάρισα.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">ΤΑΚΗΣ Fast Food · Βόλου 75, Λάρισα</p>
              <p style="margin:4px 0 0;font-size:11px;color:#d1d5db;">© ${year} ΤΑΚΗΣ. Loyalty Program.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const resend = getResend()

  await resend.emails.send({
    from: 'ΤΑΚΗΣ Loyalty <noreply@resend.dev>',
    to: customerEmail,
    subject: `🎉 Κουπόνι €${discountAmount} έκπτωση - ΤΑΚΗΣ Λάρισα`,
    html,
  })
}
