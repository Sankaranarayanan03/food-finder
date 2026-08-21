import { useState } from "react";
import { Star, X, ShieldCheck, AlertCircle, Camera, CheckCircle2 } from "lucide-react";
import { api } from "../services/api";

export function ReviewModal({ booking, restaurant, onClose, onReviewSubmitted }) {
  const [rating, setRating] = useState(5.0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || comment.length < 3) {
      setError("Please provide a short comment about your meal.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.createVerifiedReview({
        booking_id: booking.id,
        rating: parseFloat(rating),
        comment: comment.trim(),
        photo_url: photoUrl || undefined
      });
      setSuccess(true);
      onReviewSubmitted?.(res);
    } catch (err) {
      setError(err.message || "Failed to submit review. Verified check-in is required.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "500px", padding: "2rem" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.75rem",
              fontWeight: 800,
              color: "var(--secondary)",
              backgroundColor: "var(--secondary-light)",
              padding: "0.2rem 0.55rem",
              borderRadius: "var(--radius-full)",
              marginBottom: "0.3rem"
            }}>
              <ShieldCheck size={14} />
              <span>VERIFIED VISIT ONLY</span>
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>
              Review {restaurant?.name || "Restaurant"}
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Reservation Ref: {booking?.booking_ref}
            </p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <CheckCircle2 size={48} style={{ color: "var(--success)", margin: "0 auto 1rem auto" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: 900, marginBottom: "0.3rem" }}>Thank you for your review!</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Your feedback with the Verified Visit badge is now live for all diners.
            </p>
            <button onClick={onClose} className="btn btn-primary" style={{ width: "100%" }}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                backgroundColor: "var(--danger-bg)",
                color: "var(--danger)",
                padding: "0.75rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.85rem",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Star Rating Selector */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem", display: "block" }}>
                YOUR DINING RATING
              </label>
              <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{ padding: "0.25rem" }}
                  >
                    <Star
                      size={32}
                      style={{
                        color: (hoverRating || rating) >= star ? "#F59E0B" : "#CBD5E1",
                        fill: (hoverRating || rating) >= star ? "#F59E0B" : "transparent",
                        transition: "all 0.15s ease"
                      }}
                    />
                  </button>
                ))}
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", marginTop: "0.3rem", display: "inline-block" }}>
                {rating} Out of 5 Stars
              </span>
            </div>

            {/* Comments */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.3rem", display: "block" }}>
                SHARE YOUR EXPERIENCE
              </label>
              <textarea
                rows={4}
                placeholder="What dishes did you try? How was the service and taste?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.9rem"
                }}
              />
            </div>

            {/* Photo URL (Optional) */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.3rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Camera size={14} />
                <span>PHOTO URL (OPTIONAL)</span>
              </label>
              <input
                type="url"
                placeholder="https://example.com/food-photo.jpg"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.85rem"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", padding: "0.85rem", fontWeight: 800 }}
            >
              {loading ? "POSTING..." : "SUBMIT VERIFIED REVIEW"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}