import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

export function PromoBannerCarousel({ onOpenPrime }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const BANNERS = [
    {
      id: 1,
      tag: "SPECIAL EAZYDINER OFFER",
      title: "Up to ₹500 Off on Dining Bill",
      subtitle: "Buy one get one FREE movie tickets on bookmyshow",
      ctaText: "Apply Now",
      bgGradient: "linear-gradient(135deg, #FFFFFF 0%, #FFF7ED 100%)",
      accentColor: "#FF541E",
      cardColor: "#FF541E",
      cardTitle: "Prime Platinum",
      icon: "💳"
    },
    {
      id: 2,
      tag: "TAMIL NADU DINING SPECIAL",
      title: "Flat 50% OFF on Top Spots",
      subtitle: "Instant 6-Digit WhatsApp Pass • Zero Waiting Time",
      ctaText: "Reserve Table",
      bgGradient: "linear-gradient(135deg, #FFFFFF 0%, #F0FDFA 100%)",
      accentColor: "#0D9488",
      cardColor: "#0D9488",
      cardTitle: "VIP Pass",
      icon: "🔑"
    },
    {
      id: 3,
      tag: "VIP REWARDS & LOYALTY",
      title: "Earn +10 EazyPoints per Visit",
      subtitle: "Unlock Gold & Platinum Diner Tiers for Free Voucher Redemptions",
      ctaText: "Explore Loyalty",
      bgGradient: "linear-gradient(135deg, #FFFFFF 0%, #FEF3C7 100%)",
      accentColor: "#D97706",
      cardColor: "#F59E0B",
      cardTitle: "Gold Diner",
      icon: "🏆"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [BANNERS.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);

  const banner = BANNERS[currentSlide];

  return (
    <div className="container" style={{ margin: "1.5rem auto 1rem auto" }}>
      <div style={{
        position: "relative",
        background: banner.bgGradient,
        borderRadius: "var(--radius-xl)",
        border: "1.5px solid var(--border)",
        boxShadow: "var(--shadow-md)",
        padding: "2.25rem 3rem",
        overflow: "hidden",
        minHeight: "230px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      }}>
        {/* Left Content */}
        <div style={{ maxWidth: "580px", zIndex: 2 }}>
          <div style={{
            fontSize: "0.75rem",
            fontWeight: 900,
            letterSpacing: "0.08em",
            color: banner.accentColor,
            marginBottom: "0.4rem"
          }}>
            {banner.tag}
          </div>

          <h2 style={{
            fontSize: "2.1rem",
            fontWeight: 900,
            color: "#0F172A",
            lineHeight: 1.2,
            marginBottom: "0.6rem"
          }}>
            {banner.title}
          </h2>

          <p style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "#475569",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <span>{banner.subtitle}</span>
          </p>

          <button
            onClick={() => onOpenPrime?.()}
            style={{
              backgroundColor: banner.accentColor,
              color: "#FFFFFF",
              border: "none",
              padding: "0.7rem 1.6rem",
              borderRadius: "var(--radius-full)",
              fontSize: "0.95rem",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              transition: "transform 0.2s"
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <span>{banner.ctaText}</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Right Card Graphic */}
        <div style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            width: "240px",
            height: "140px",
            borderRadius: "18px",
            background: `linear-gradient(135deg, ${banner.cardColor} 0%, #0F172A 100%)`,
            color: "#FFFFFF",
            padding: "1.2rem",
            boxShadow: "var(--shadow-xl)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transform: "rotate(-4deg)",
            transition: "transform 0.3s ease"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 900, letterSpacing: "0.05em" }}>eazydiner</span>
              <span style={{ fontSize: "1.4rem" }}>{banner.icon}</span>
            </div>

            <div>
              <div style={{ fontSize: "0.7rem", opacity: 0.8, fontWeight: 700 }}>PRIME CARD</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>{banner.cardTitle}</div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "var(--shadow-md)",
            zIndex: 3
          }}
        >
          <ChevronLeft size={20} style={{ color: "#0F172A" }} />
        </button>

        <button
          onClick={nextSlide}
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "var(--shadow-md)",
            zIndex: 3
          }}
        >
          <ChevronRight size={20} style={{ color: "#0F172A" }} />
        </button>

        {/* Pagination Dots */}
        <div style={{
          position: "absolute",
          bottom: "12px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "0.4rem",
          zIndex: 3
        }}>
          {BANNERS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              style={{
                width: currentSlide === idx ? "20px" : "8px",
                height: "8px",
                borderRadius: "4px",
                backgroundColor: currentSlide === idx ? banner.accentColor : "#CBD5E1",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}