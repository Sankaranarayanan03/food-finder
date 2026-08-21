import logging
import smtplib
import urllib.parse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

logger = logging.getLogger(__name__)

def build_confirmation_email_body(
    restaurant_name: str,
    booking_date: str,
    booking_time: str,
    guest_count: int,
    verification_code: str,
    booking_ref: str = "",
    restaurant_address: str = "",
    lat: float = None,
    lng: float = None,
    customer_name: str = ""
) -> str:
    """Exact required plain-text template including Restaurant Location & Google Maps Navigation link"""
    display_address = restaurant_address.strip() if restaurant_address and restaurant_address.strip() else f"{restaurant_name}, Tamil Nadu"
    
    has_coords = False
    try:
        if lat is not None and lng is not None:
            lat_f = float(lat)
            lng_f = float(lng)
            if lat_f != 0.0 or lng_f != 0.0:
                has_coords = True
    except (ValueError, TypeError):
        has_coords = False

    if has_coords:
        maps_link = f"https://www.google.com/maps?q={lat_f},{lng_f}"
        coords_str = f"GPS Coordinates   : {lat_f}, {lng_f}\n"
    else:
        maps_query = urllib.parse.quote(f"{restaurant_name}, {display_address}")
        maps_link = f"https://www.google.com/maps/search/?api=1&query={maps_query}"
        coords_str = ""

    greeting = f"Hello {customer_name},\n\n" if customer_name else ""

    return (
        "============================================================\n"
        "SMART RESTAURANT FINDER - TABLE RESERVATION CONFIRMATION\n"
        "============================================================\n\n"
        f"{greeting}"
        "Your table reservation has been successfully booked and confirmed!\n\n"
        "RESERVATION DETAILS:\n"
        "------------------------------------------------------------\n"
        f"Booking Reference : {booking_ref}\n"
        f"Verification Code : {verification_code} (Present at Check-In)\n"
        f"Restaurant Name   : {restaurant_name}\n"
        f"Address / Location: {display_address}\n"
        f"{coords_str}"
        f"Google Maps Link  : {maps_link}\n"
        f"Booking Date      : {booking_date}\n"
        f"Booking Time      : {booking_time}\n"
        f"Number of Guests  : {guest_count} Person(s)\n"
        "------------------------------------------------------------\n\n"
        "Please present this 6-digit verification code to the restaurant host upon arrival.\n"
        "============================================================"
    )

def build_confirmation_email_html(
    customer_name: str,
    restaurant_name: str,
    booking_date: str,
    booking_time: str,
    guest_count: int,
    verification_code: str,
    booking_ref: str,
    restaurant_address: str = "",
    lat: float = None,
    lng: float = None
) -> str:
    """Rich responsive HTML email template for table booking confirmation featuring location details & Google Maps link"""
    display_address = restaurant_address.strip() if restaurant_address and restaurant_address.strip() else f"{restaurant_name}, Tamil Nadu"
    
    has_coords = False
    try:
        if lat is not None and lng is not None:
            lat_f = float(lat)
            lng_f = float(lng)
            if lat_f != 0.0 or lng_f != 0.0:
                has_coords = True
    except (ValueError, TypeError):
        has_coords = False

    if has_coords:
        maps_link = f"https://www.google.com/maps?q={lat_f},{lng_f}"
        coords_badge = f"<div style='color: #94a3b8; font-size: 12px; margin-top: 4px;'>📍 GPS: {lat_f}, {lng_f}</div>"
    else:
        maps_query = urllib.parse.quote(f"{restaurant_name}, {display_address}")
        maps_link = f"https://www.google.com/maps/search/?api=1&query={maps_query}"
        coords_badge = ""

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmed - {booking_ref}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 30px 10px;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 30px 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">SMART RESTAURANT FINDER</h1>
                            <p style="color: #fecdd3; margin: 6px 0 0 0; font-size: 14px; font-weight: 500;">Table Reservation Confirmation</p>
                        </td>
                    </tr>
                    
                    <!-- Content Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #ffffff; margin: 0 0 10px 0; font-size: 20px;">Reservation Confirmed! 🎉</h2>
                            <p style="color: #94a3b8; margin: 0 0 24px 0; font-size: 15px; line-height: 1.6;">
                                Hello <strong style="color: #f8fafc;">{customer_name}</strong>, your table reservation has been successfully booked and confirmed.
                            </p>

                            <!-- Verification Code Card -->
                            <div style="background-color: #0f172a; border: 2px dashed #f43f5e; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
                                <span style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">
                                    Check-In Verification Code
                                </span>
                                <span style="color: #f43f5e; font-size: 36px; font-weight: 900; letter-spacing: 6px; font-family: monospace;">
                                    {verification_code}
                                </span>
                                <p style="color: #cbd5e1; font-size: 13px; margin: 10px 0 0 0;">
                                    Present this 6-digit code to the restaurant host upon arrival.
                                </p>
                            </div>

                            <!-- Booking & Location Details Table -->
                            <table width="100%" border="0" cellspacing="0" cellpadding="12" style="background-color: #0f172a; border-radius: 10px; margin-bottom: 24px;">
                                <tr>
                                    <td style="color: #94a3b8; font-size: 14px; border-bottom: 1px solid #1e293b;" width="38%">Booking Ref:</td>
                                    <td style="color: #f8fafc; font-size: 14px; font-weight: 700; border-bottom: 1px solid #1e293b;">{booking_ref}</td>
                                </tr>
                                <tr>
                                    <td style="color: #94a3b8; font-size: 14px; border-bottom: 1px solid #1e293b;">Restaurant:</td>
                                    <td style="color: #f8fafc; font-size: 14px; font-weight: 700; border-bottom: 1px solid #1e293b;">{restaurant_name}</td>
                                </tr>
                                <tr>
                                    <td style="color: #94a3b8; font-size: 14px; border-bottom: 1px solid #1e293b;">Restaurant Location:</td>
                                    <td style="color: #f8fafc; font-size: 14px; font-weight: 700; border-bottom: 1px solid #1e293b;">
                                        📍 {display_address}
                                        {coords_badge}
                                        <div style="margin-top: 10px;">
                                            <a href="{maps_link}" target="_blank" style="background-color: #f43f5e; color: #ffffff; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(244, 63, 94, 0.3);">
                                                🗺️ Open Location in Google Maps
                                            </a>
                                        </div>
                                        <div style="margin-top: 6px; font-size: 12px; font-weight: 400; word-break: break-all;">
                                            <a href="{maps_link}" target="_blank" style="color: #38bdf8; text-decoration: underline;">{maps_link}</a>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color: #94a3b8; font-size: 14px; border-bottom: 1px solid #1e293b;">Date:</td>
                                    <td style="color: #f8fafc; font-size: 14px; font-weight: 700; border-bottom: 1px solid #1e293b;">{booking_date}</td>
                                </tr>
                                <tr>
                                    <td style="color: #94a3b8; font-size: 14px; border-bottom: 1px solid #1e293b;">Time:</td>
                                    <td style="color: #f8fafc; font-size: 14px; font-weight: 700; border-bottom: 1px solid #1e293b;">{booking_time}</td>
                                </tr>
                                <tr>
                                    <td style="color: #94a3b8; font-size: 14px;">Guests:</td>
                                    <td style="color: #f8fafc; font-size: 14px; font-weight: 700;">{guest_count} Person(s)</td>
                                </tr>
                            </table>

                            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
                                Thank you for using Smart Restaurant Finder! Enjoy your dining experience.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0f172a; padding: 20px 40px; text-align: center; border-top: 1px solid #334155;">
                            <p style="color: #475569; font-size: 12px; margin: 0;">
                                &copy; 2026 Smart Restaurant Finder. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""

def send_booking_confirmation_email(
    to_email: str,
    customer_name: str,
    restaurant_name: str,
    booking_date: str,
    booking_time: str,
    guest_count: int,
    verification_code: str,
    booking_ref: str,
    restaurant_address: str = "",
    lat: float = None,
    lng: float = None
) -> bool:
    """
    Sends transactional confirmation email (both plain-text and rich HTML).
    Includes exact restaurant location address, GPS coordinates, and Google Maps direct navigation link.
    """
    try:
        body_text = build_confirmation_email_body(
            restaurant_name=restaurant_name,
            booking_date=booking_date,
            booking_time=booking_time,
            guest_count=guest_count,
            verification_code=verification_code,
            booking_ref=booking_ref,
            restaurant_address=restaurant_address,
            lat=lat,
            lng=lng,
            customer_name=customer_name
        )

        logger.info(
            f"\n============================================================\n"
            f"[TRANSACTIONAL EMAIL DISPATCH]\n"
            f"To: {to_email} ({customer_name})\n"
            f"Subject: Booking Confirmed - Ref: {booking_ref}\n"
            f"------------------------------------------------------------\n"
            f"{body_text}\n"
            f"============================================================"
        )
        print(f"\n[EMAIL SENT to {to_email}]:\n{body_text}\n")
    except Exception as log_err:
        logger.warning(f"Email logging encountered encoding note: {log_err}")

    # Attempt real SMTP transmission if server is configured and not default example placeholder
    if settings.SMTP_SERVER and settings.SMTP_SERVER != "smtp.example.com" and settings.SMTP_USER:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"Booking Confirmed at {restaurant_name} (Code: {verification_code})"
            msg["From"] = settings.EMAIL_FROM
            msg["To"] = to_email

            body_html = build_confirmation_email_html(
                customer_name=customer_name,
                restaurant_name=restaurant_name,
                booking_date=booking_date,
                booking_time=booking_time,
                guest_count=guest_count,
                verification_code=verification_code,
                booking_ref=booking_ref,
                restaurant_address=restaurant_address,
                lat=lat,
                lng=lng
            )

            part_text = MIMEText(body_text, "plain")
            part_html = MIMEText(body_html, "html")
            msg.attach(part_text)
            msg.attach(part_html)

            if settings.SMTP_PORT == 465:
                with smtplib.SMTP_SSL(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=10) as server:
                    if settings.SMTP_USER and settings.SMTP_PASSWORD:
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(settings.EMAIL_FROM, [to_email], msg.as_string())
            else:
                with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=10) as server:
                    if settings.SMTP_PORT == 587:
                        server.starttls()
                    if settings.SMTP_USER and settings.SMTP_PASSWORD:
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(settings.EMAIL_FROM, [to_email], msg.as_string())
            
            logger.info(f"Live SMTP delivery succeeded for booking {booking_ref} to {to_email}")
            print(f"[OK] LIVE SMTP EMAIL DELIVERED TO {to_email}")
            return True
        except Exception as exc:
            logger.warning(
                f"SMTP delivery encountered an issue for booking {booking_ref} to {to_email}: {exc}. "
                f"Booking remains active and confirmed."
            )
            print(f"[SMTP Note]: {exc}")
            return False

    return True

def send_test_email(to_email: str) -> tuple[bool, str]:
    """
    Sends a test email to verify live SMTP configuration and connection.
    Returns (success: bool, detail_message: str).
    """
    if not settings.SMTP_SERVER or settings.SMTP_SERVER == "smtp.example.com":
        return False, "SMTP_SERVER is not configured or set to default example."
    if not settings.SMTP_USER:
        return False, "SMTP_USER is missing in configuration."

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Smart Restaurant Finder - Live Email Transmission Test"
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to_email

        plain_text = (
            "Smart Restaurant Finder - Test Email\n"
            "If you receive this email, live email transmission via SMTP is working successfully!"
        )
        html_text = f"""<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px;">
    <div style="background-color: #1e293b; padding: 30px; border-radius: 12px; border: 1px solid #334155; max-width: 500px; margin: auto;">
        <h2 style="color: #22c55e; margin-top: 0;">✅ SMTP Email Test Successful!</h2>
        <p style="color: #cbd5e1;">Live email transmission is active for <strong>Smart Restaurant Finder</strong>.</p>
        <p style="color: #94a3b8; font-size: 13px;">Sent to: <strong>{to_email}</strong> via {settings.SMTP_SERVER}:{settings.SMTP_PORT}</p>
    </div>
</body>
</html>"""

        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_text, "html"))

        if settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=10) as server:
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAIL_FROM, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=10) as server:
                if settings.SMTP_PORT == 587:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAIL_FROM, [to_email], msg.as_string())

        return True, f"Live test email successfully transmitted to {to_email}"
    except Exception as exc:
        return False, f"SMTP Error: {str(exc)}"

