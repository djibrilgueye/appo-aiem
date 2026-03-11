"""
AIEM Email Service - Service Python d'envoi d'emails via SMTP STARTTLS
Fonctionne avec mail.apposecretariat.com (port 587)
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify

app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Configuration
API_KEY   = os.environ.get("EMAIL_SERVICE_API_KEY") or os.environ.get("API_KEY", "aiem-email-service-key-2026")
SMTP_HOST = os.environ.get("SMTP_HOST", "mail.apposecretariat.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "online@apposecretariat.com")
SMTP_PASS = os.environ.get("SMTP_PASS", "mt3R=vzEbl7=")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "online@apposecretariat.com")
FROM_NAME  = os.environ.get("FROM_NAME", "AIEM - APPO")


def verify_api_key() -> bool:
    return request.headers.get("X-API-Key", "") == API_KEY


def send_email_smtp(to: str, subject: str, html: str = None, text: str = None) -> dict:
    """Send email using SMTP with STARTTLS."""
    try:
        msg = MIMEMultipart("alternative")
        msg["From"]     = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"]       = to
        msg["Subject"]  = subject
        msg["Reply-To"] = os.environ.get("REPLY_TO", "info@apposecretariat.org")

        if text:
            msg.attach(MIMEText(text, "plain", "utf-8"))
        if html:
            msg.attach(MIMEText(html, "html", "utf-8"))
        elif not text:
            return {"success": False, "error": "No content provided"}

        logger.info(f"Connecting to {SMTP_HOST}:{SMTP_PORT}...")
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(FROM_EMAIL, [to], msg.as_string())
        server.quit()

        logger.info(f"Email sent to {to} — {subject[:60]}")
        return {"success": True}

    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP auth error: {e}")
        return {"success": False, "error": f"Authentication failed: {e}"}
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error: {e}")
        return {"success": False, "error": f"SMTP error: {e}"}
    except Exception as e:
        logger.error(f"Email error: {e}")
        return {"success": False, "error": str(e)}


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "aiem-email-service"})


@app.route("/send", methods=["POST"])
def send():
    if not verify_api_key():
        return jsonify({"success": False, "error": "Invalid API key"}), 401

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400

    to      = data.get("to")
    subject = data.get("subject")
    html    = data.get("html")
    text    = data.get("text")

    if not to or not subject:
        return jsonify({"success": False, "error": "Missing 'to' or 'subject'"}), 400

    result      = send_email_smtp(to, subject, html, text)
    status_code = 200 if result["success"] else 500
    return jsonify(result), status_code


@app.route("/send-otp", methods=["POST"])
def send_otp():
    if not verify_api_key():
        return jsonify({"success": False, "error": "Invalid API key"}), 401

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400

    to        = data.get("to")
    code      = data.get("code")
    user_name = data.get("userName", "User")

    if not to or not code:
        return jsonify({"success": False, "error": "Missing 'to' or 'code'"}), 400

    spaced  = "  ".join(list(str(code)))
    subject = "Your AIEM Login Code"
    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background-color:#F4F7FB;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FB;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:12px;overflow:hidden;
               box-shadow:0 4px 20px rgba(27,79,114,.12);border:1px solid #D0E4F0;">
        <tr>
          <td style="background:#1B4F72;padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td>
                <div style="color:#F4B942;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">APPO</div>
                <div style="color:#fff;font-size:20px;font-weight:bold;">AIEM</div>
                <div style="color:#A3C4DC;font-size:12px;">Africa Interactive Energy Map</div>
              </td>
              <td align="right">
                <div style="background:#F4B942;color:#0D2840;font-size:10px;font-weight:bold;padding:4px 10px;border-radius:4px;letter-spacing:1px;">SECURE LOGIN</div>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 16px;color:#0D2840;font-size:15px;">Hello <strong>{user_name}</strong>,</p>
            <p style="margin:0 0 28px;color:#5B8FB9;font-size:14px;line-height:1.6;">
              Use the code below to complete your sign in to AIEM.<br/>
              Valid for <strong>5 minutes</strong> — single use only.
            </p>
            <div style="background:#EBF3FB;border:2px solid #1B4F72;border-radius:10px;text-align:center;padding:28px 20px;margin-bottom:28px;">
              <div style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#1B4F72;font-family:'Courier New',monospace;">{spaced}</div>
              <div style="color:#5B8FB9;font-size:12px;margin-top:10px;">One-Time Password — expires in 5 minutes</div>
            </div>
            <div style="background:#FFF8EC;border-left:3px solid #F4B942;padding:12px 16px;border-radius:0 6px 6px 0;margin-bottom:24px;">
              <p style="margin:0;color:#7A5C00;font-size:13px;"><strong>Security notice:</strong> If you did not attempt to log in, please ignore this email.</p>
            </div>
            <p style="margin:0;color:#A3C4DC;font-size:12px;">This is an automated message — please do not reply.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#EBF3FB;padding:16px 32px;border-top:1px solid #D0E4F0;">
            <p style="margin:0;color:#5B8FB9;font-size:11px;text-align:center;">APPO &copy; 2026 &mdash; African Petroleum Producers' Organization</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""
    text_body = f"Your AIEM one-time login code is: {code}\n\nThis code expires in 5 minutes. Do not share it."

    result      = send_email_smtp(to, subject, html, text_body)
    status_code = 200 if result["success"] else 500
    return jsonify(result), status_code


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5001"))
    logger.info(f"Starting AIEM Email Service on port {port}")
    logger.info(f"SMTP: {SMTP_HOST}:{SMTP_PORT} | User: {SMTP_USER}")
    app.run(host="0.0.0.0", port=port)
