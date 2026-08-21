import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Camera, ZoomIn } from "lucide-react";

// Default gallery photos from seeded image URLs + supplementary stock shots
function buildGalleryPhotos(restaurant) {
  const base = restaurant?.image_url
    ? [{ url: restaurant.image_url, caption: `${restaurant.name} — Main View` }]
    : [];

  // Supplementary food/ambience stock photos (Unsplash)
  const supplementary = [
    { url: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&auto=format&fit=crop&q=80", caption: "Interior Ambience" },
    { url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&auto=format&fit=crop&q=80", caption: "Signature Dish" },
    { url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80", caption: "Biryani Platter" },
    { url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80", caption: "Restaurant Exterior" },
    { url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80", caption: "Dosa Station" },
    { url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80", caption: "Meals Spread" },
  ];

  const all = [...base, ...supplementary];
  return all.slice(0, 8);
}

export function PhotoGallery({ restaurant }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const photos = buildGalleryPhotos(restaurant);

  const openLightbox = (idx) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);
  const prev = () => setLightboxIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setLightboxIdx((i) => (i + 1) % photos.length);

  const handleKey = (e) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
    if (e.key === "Escape") closeLightbox();
  };

  return (
    <div>
      {/* Section Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem" }}>
        <Camera size={18} style={{ color: "var(--primary)" }} />
        <h3 style={{ fontSize: "1.05rem", fontWeight: 800 }}>Photos ({photos.length})</h3>
      </div>

      {/* Mosaic Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "160px 110px",
          gap: "6px",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
        }}
      >
        {photos.slice(0, 6).map((photo, idx) => (
          <div
            key={idx}
            onClick={() => openLightbox(idx)}
            style={{
              position: "relative",
              gridColumn: idx === 0 ? "1 / 3" : undefined,
              gridRow: idx === 0 ? "1 / 2" : undefined,
              overflow: "hidden",
              cursor: "zoom-in",
              backgroundColor: "#E2E8F0",
            }}
          >
            <img
              src={photo.url}
              alt={photo.caption}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.35s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />
            {/* Overlay on hover */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.2s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.35)")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0)")}
            >
              <ZoomIn size={22} style={{ color: "#FFFFFF", opacity: 0 }} />
            </div>

            {/* "View All" overlay on last visible tile */}
            {idx === 5 && photos.length > 6 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                }}
              >
                +{photos.length - 6} more
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.95)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={closeLightbox}
          onKeyDown={handleKey}
          tabIndex={0}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2001,
            }}
          >
            <X size={22} />
          </button>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            style={{
              position: "absolute",
              left: "1rem",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2001,
              backdropFilter: "blur(4px)",
            }}
          >
            <ChevronLeft size={26} />
          </button>

          {/* Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "85vh", textAlign: "center" }}
          >
            <img
              src={photos[lightboxIdx].url}
              alt={photos[lightboxIdx].caption}
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                borderRadius: "var(--radius-lg)",
                objectFit: "contain",
                boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
              }}
            />
            <div style={{ color: "#E2E8F0", fontSize: "0.85rem", fontWeight: 600, marginTop: "0.75rem" }}>
              {photos[lightboxIdx].caption} — {lightboxIdx + 1} / {photos.length}
            </div>
          </div>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            style={{
              position: "absolute",
              right: "1rem",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2001,
              backdropFilter: "blur(4px)",
            }}
          >
            <ChevronRight size={26} />
          </button>

          {/* Thumbnail Strip */}
          <div
            style={{
              position: "absolute",
              bottom: "1rem",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "0.4rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {photos.map((p, idx) => (
              <div
                key={idx}
                onClick={() => setLightboxIdx(idx)}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "6px",
                  overflow: "hidden",
                  cursor: "pointer",
                  border: `2px solid ${lightboxIdx === idx ? "var(--primary)" : "rgba(255,255,255,0.3)"}`,
                  opacity: lightboxIdx === idx ? 1 : 0.6,
                  transition: "all 0.15s ease",
                }}
              >
                <img src={p.url} alt={p.caption} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}