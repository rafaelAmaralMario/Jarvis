import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvis } from '@/hooks/use-jarvis';

interface CameraPanelProps {
  onSendToChat?: (imageBase64: string) => void;
}

export function CameraPanel({ onSendToChat }: CameraPanelProps) {
  const bridge = useJarvis();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [active, setActive] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setCaptured(null);
      setDescription(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setActive(true);
    } catch (e) {
      setError('Camera access denied');
      setActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
    setCaptured(null);
    setDescription(null);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const b64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    setCaptured(b64);
    setDescription(null);
  }

  async function analyze() {
    if (!captured) return;
    setLoading(true);
    setError(null);
    try {
      const result = await bridge.cameraAnalyze('Describe what you see in this image');
      if (result.success && result.description) {
        setDescription(result.description);
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function sendToChat() {
    if (captured && onSendToChat) {
      onSendToChat(captured);
      stopCamera();
    }
  }

  return (
    <div className="border-t border-border bg-card p-3">
      {/* Toggle button */}
      <div className="flex items-center gap-2 mb-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={active ? stopCamera : startCamera}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            active
              ? 'bg-red-950/30 text-red-400 border border-red-900/40'
              : 'bg-muted text-muted-foreground border border-border hover:bg-accent'
          }`}
        >
          {active ? '■ Fechar Câmera' : '📷 Abrir Câmera'}
        </motion.button>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {/* Live preview */}
            <div className="relative bg-black rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-48 object-contain"
              />
              {!captured && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={capture}
                    className="px-4 py-1.5 rounded-lg bg-white/20 backdrop-blur text-white text-xs font-medium hover:bg-white/30 transition-colors"
                  >
                    📸 Capturar
                  </motion.button>
                </div>
              )}
            </div>

            {/* Captured preview */}
            {captured && (
              <div className="relative bg-black rounded-xl overflow-hidden">
                <img
                  src={`data:image/jpeg;base64,${captured}`}
                  alt="Captured"
                  className="w-full max-h-48 object-contain"
                />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setCaptured(null); setDescription(null); }}
                    className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur text-white text-xs font-medium hover:bg-white/30 transition-colors"
                  >
                    🔄 Re-capturar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={analyze}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg bg-primary/80 text-white text-xs font-medium hover:bg-primary transition-colors disabled:opacity-50"
                  >
                    {loading ? '⏳ Analisando...' : '👁 Analisar'}
                  </motion.button>
                  {onSendToChat && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={sendToChat}
                      className="px-3 py-1.5 rounded-lg bg-green-600/80 text-white text-xs font-medium hover:bg-green-600 transition-colors"
                    >
                      💬 Enviar
                    </motion.button>
                  )}
                </div>
              </div>
            )}

            {/* Description result */}
            {description && (
              <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground">
                <span className="font-semibold text-primary">👁 Análise:</span> {description}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="px-3 py-1.5 rounded-lg bg-red-950/20 border border-red-900/40 text-xs text-red-400">
                {error}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
