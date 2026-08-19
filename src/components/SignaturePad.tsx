"use client";

// Touch-friendly digital signature pad. Draws on a canvas and reports a
// small PNG data-URL upward (stored inline in the Firestore submission —
// deliberately NOT in Storage, where member uploads are locked down).
import { useEffect, useRef, useState } from "react";

export default function SignaturePad({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(Boolean(value));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.offsetWidth;
    const height = 160;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e293b";
    // White background so the exported PNG is readable in any theme.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    // Restore a previously saved signature (e.g. editing a submission).
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, width, height);
      img.src = value;
    }
  }, [value]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    setHasInk(true);
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange(null);
  }

  return (
    <div className="app-chrome">
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className="h-40 w-full touch-none rounded-xl border border-dashed border-black/20 bg-white dark:border-white/25"
      />
      <div className="mt-1 flex items-center justify-between">
        <p className="text-[10px] opacity-50">
          {hasInk ? "✅ Signature captured" : "Sign above with your finger"}
        </p>
        <button
          type="button"
          onClick={clear}
          className="rounded-full px-3 py-1 text-[11px] font-bold text-red-500 active:bg-red-500/10"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
