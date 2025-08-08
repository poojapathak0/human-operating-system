import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

export function QRCanvas({ text, size=224 }: { text: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCode.toCanvas(canvas, text, { width: size, margin: 1 }, (err) => {
      if (err) console.error(err);
    });
  }, [text, size]);
  return <canvas ref={canvasRef} width={size} height={size} aria-label="QR code" />;
}

export function QRScanner({ onResult }: { onResult: (value: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let raf = 0;
    let stream: MediaStream | null = null;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setActive(true);
          tick();
        }
      } catch (e) {
        console.error(e);
      }
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setActive(false);
    };
    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) { raf = requestAnimationFrame(tick); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx || video.readyState !== 4) { raf = requestAnimationFrame(tick); return; }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (code?.data) {
        onResult(code.data);
        stop();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    start();
    return stop;
  }, [onResult]);

  return (
    <div style={{ display:'grid', gap:8 }}>
      <video ref={videoRef} style={{ width:'100%', borderRadius:8 }} muted playsInline/>
      <canvas ref={canvasRef} style={{ display:'none' }} />
      {!active && <small>Camera not active or permission denied</small>}
    </div>
  );
}
