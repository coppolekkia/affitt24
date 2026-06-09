import { useEffect, useRef } from "react";

export function AdSenseBanner({ className }: { className?: string }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    if (typeof window !== "undefined" && (window as any).adsbygoogle) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(
          {}
        );
        pushed.current = true;
      } catch {
        // silently ignore AdSense push errors
      }
    }
  }, []);

  return (
    <ins
      className={`adsbygoogle ${className ?? ""}`}
      style={{ display: "inline-block", width: "300px", height: "250px" }}
      data-ad-client="ca-pub-5738943819550045"
      data-ad-slot="4411407627"
    />
  );
}
