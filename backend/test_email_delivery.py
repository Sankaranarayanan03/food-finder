import sys
import argparse
from app.config import settings
from app.services.email import send_test_email, send_booking_confirmation_email

if __name__ == "__main__":
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    parser = argparse.ArgumentParser(description="Test Live Email Transmission for Smart Restaurant Finder")
    parser.add_argument("--to", type=str, help="Recipient email address to send test email to", default=None)
    parser.add_argument("--type", type=str, choices=["test", "booking"], default="test", help="Type of email to test")
    
    args = parser.parse_args()

    recipient = args.to or settings.SMTP_USER or settings.EMAIL_FROM

    print("============================================================")
    print("LIVE EMAIL SMTP TRANSMISSION TESTER")
    print("============================================================")
    print(f"SMTP Server : {settings.SMTP_SERVER}:{settings.SMTP_PORT}")
    print(f"SMTP User   : {settings.SMTP_USER or '(Not set)'}")
    print(f"Sender      : {settings.EMAIL_FROM}")
    print(f"Recipient   : {recipient}")
    print("------------------------------------------------------------")

    if not recipient or "example" in recipient or not settings.SMTP_USER or "xxxx" in settings.SMTP_PASSWORD:
        print("⚠️ NOTE: SMTP credentials appear to be using placeholder values in backend/.env!")
        print("To send actual emails to an inbox:")
        print("1. For Gmail: Enable 2-Step Verification & generate an App Password at https://myaccount.google.com/apppasswords")
        print("2. Set SMTP_USER=your_email@gmail.com and SMTP_PASSWORD=your_16_char_app_password in backend/.env")
        print("------------------------------------------------------------")

    if args.type == "booking":
        print("Sending sample Rich HTML Booking Confirmation Email...")
        success = send_booking_confirmation_email(
            to_email=recipient,
            customer_name="Arun Kumar",
            restaurant_name="Anjappar Chettinad Restaurant",
            booking_date="2026-08-21",
            booking_time="19:30",
            guest_count=4,
            verification_code="849201",
            booking_ref="TN-CHK-8492",
            restaurant_address="7/2, Nungambakkam High Road, Chennai, Tamil Nadu 600034",
            lat=13.0604,
            lng=80.2496
        )
        if success:
            print(f"✅ Success! Sample booking email sent to {recipient}")
        else:
            print(f"❌ Failed to deliver email to {recipient}")
    else:
        print("Sending SMTP Connectivity Test Email...")
        success, message = send_test_email(recipient)
        print(f"Result: {'✅ SUCCESS' if success else '❌ FAILED'}")
        print(f"Detail: {message}")

    print("============================================================")
