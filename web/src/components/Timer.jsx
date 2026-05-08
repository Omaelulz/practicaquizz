import { useEffect, useRef, useState } from 'react';

// Temporizador con cuenta atras
// Se reinicia cuando cambia resetKey (nueva pregunta)
// Llama a onExpire cuando llega a 0
export default function Timer({ seconds, onExpire, paused = false, resetKey }) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);
  const onExpireRef = useRef(onExpire);
  const expiredRef = useRef(false);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemaining(seconds);
    expiredRef.current = false;
  }, [seconds, resetKey]);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [paused, resetKey]);

  // Llama a onExpire fuera del state updater para evitar side-effects
  useEffect(() => {
    if (remaining === 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpireRef.current?.();
    }
  }, [remaining]);

  const cls = remaining <= 5 ? 'timer danger' : remaining <= 10 ? 'timer warn' : 'timer';
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <div className={cls}>
      ⏱ {mm}:{ss}
    </div>
  );
}
