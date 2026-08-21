/**
 * Formats booking reservation & verification code details and opens WhatsApp
 * to share directly with the restaurant owner, staff, or contacts.
 */
export function shareBookingToWhatsApp(booking, restaurantObj, phoneNumber) {
  if (!booking) return;

  const restName = (typeof restaurantObj === "object" ? restaurantObj?.name : restaurantObj) || booking.restaurant_name || "Food Navigator Partner";
  const address = (typeof restaurantObj === "object" ? restaurantObj?.address : null) || booking.restaurant_address || booking.restaurant_city || "";
  const city = (typeof restaurantObj === "object" ? restaurantObj?.city : null) || booking.restaurant_city || "";
  const locationText = address ? `${address}${city && !address.includes(city) ? `, ${city}` : ""}` : city;

  const mapsLink = locationText 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restName + " " + locationText)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restName)}`;

  const ref = booking.booking_ref || "N/A";
  const code = booking.verification_code || "N/A";
  const date = booking.booking_date || "";
  const time = booking.booking_time || "";
  const guests = booking.guest_count || 1;
  const table = booking.table_number || "Auto-assigned";

  const messageText = 
    `🍽️ *FOOD NAVIGATOR - TABLE RESERVATION & CHECK-IN PASS* 🍽️\n\n` +
    `📍 *Restaurant:* ${restName}\n` +
    (locationText ? `🏢 *Location:* ${locationText}\n` : '') +
    `🗺️ *Google Maps:* ${mapsLink}\n\n` +
    `🔢 *Booking Ref:* ${ref}\n` +
    `🔑 *6-DIGIT CHECK-IN CODE:* *${code}*\n\n` +
    `📅 *Date:* ${date}\n` +
    `⏰ *Reserved Time:* ${time}\n` +
    `👥 *Guests:* ${guests} Person(s)\n` +
    `🪑 *Table:* ${table}\n\n` +
    `⚠️ *CHECK-IN DISCLAIMER:* Please check in on time. A 5-minute arrival grace period is provided. If check-in is delayed beyond 5 minutes of your reserved time (${time}), your table will automatically be released for other waiting diners.\n\n` +
    `⚡ *Instruction for Restaurant Owner/Manager:* Please enter code *${code}* in your Owner Check-In Terminal to verify arrival & complete check-in!`;

  const encodedText = encodeURIComponent(messageText);
  let whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;

  if (phoneNumber) {
    let cleanPhone = String(phoneNumber).replace(/\D/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    }
    if (cleanPhone) {
      whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    }
  }

  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
}