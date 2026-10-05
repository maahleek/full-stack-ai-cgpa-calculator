"use client";

import { useEffect, useState } from "react";

export function OverflowDebugger() {
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    function check() {
      const vw = window.innerWidth;
      const bodyScrollWidth = document.body.scrollWidth;

      const all = document.querySelectorAll("body *");
      let worstEl: Element | null = null;
      let worstRight = 0;

      for (let i = 0; i < all.length; i++) {
        const el = all[i];
        const rect = el.getBoundingClientRect();
        if (rect.right > vw + 1 && rect.right > worstRight) {
          worstEl = el;
          worstRight = rect.right;
        }
      }

      if (worstEl !== null) {
        const tag = worstEl.tagName.toLowerCase();
        const cls = (worstEl.getAttribute("class") || "").slice(0, 80);
        const rect = worstEl.getBoundingClientRect();
        setInfo(
          `OVERFLOW vw=${vw} bodyScroll=${bodyScrollWidth} | widest: <${tag}> right=${Math.round(
            rect.right
          )} width=${Math.round(rect.width)} class="${cls}"`
        );
      } else {
        setInfo(`OK: viewport=${vw} bodyScrollWidth=${bodyScrollWidth}`);
      }
    }

    const t = setTimeout(check, 800);
    return () => clearTimeout(t);
  }, []);

  if (!info) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: info.startsWith("OK") ? "#16a34a" : "#dc2626",
        color: "white",
        fontSize: "10px",
        padding: "6px 8px",
        wordBreak: "break-all",
        fontFamily: "monospace",
      }}
    >
      {info}
    </div>
  );
}