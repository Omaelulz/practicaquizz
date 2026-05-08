// Componente del avatar SVG de los jefes - Lujan y Laura con burbujas de dialogo
import { useState, useEffect } from 'react';

// Frases aleatorias que dicen los jefes durante la pelea
const LUJAN_PHRASES = [
  "Ciclo superior chavales...",
  "Ultimo sprint...",
  "Bah, eso es trivial.",
  "Llevo 20 anos haciendo esta pregunta.",
];

const LAURA_PHRASES = [
  "Examen de programacion el Lunes",
  "Para lenguaje podeis usar apuntes",
  "Eso no es semantico, lo sabes.",
  "Esa respuesta no la dirias en el examen final.",
];

function SpeechBubble({ text, position = 'right', color }) {
  return (
    <div className={`speech-bubble speech-bubble-${position}`} style={{ '--bubble-color': color }}>
      <span>{text}</span>
    </div>
  );
}

// Ojos en cruz (estilo KO de dibujo animado) que sustituyen los ojos normales.
function KOEyes({ left, right }) {
  const Cross = ({ cx, cy }) => (
    <g stroke="#1a1a1a" strokeWidth="3.5" strokeLinecap="round">
      <line x1={cx - 7} y1={cy - 7} x2={cx + 7} y2={cy + 7} />
      <line x1={cx - 7} y1={cy + 7} x2={cx + 7} y2={cy - 7} />
    </g>
  );
  return (
    <g>
      <ellipse cx={left.cx} cy={left.cy} rx="9" ry="8" fill="white" />
      <ellipse cx={right.cx} cy={right.cy} rx="9" ry="8" fill="white" />
      <Cross cx={left.cx} cy={left.cy} />
      <Cross cx={right.cx} cy={right.cy} />
    </g>
  );
}

// Radio cassette retro que sujeta Lujan en su pose de victoria.
function VintageRadio() {
  return (
    <g className="boss-prop boss-prop-radio">
      {/* Cuerpo del radiocassette */}
      <rect x="20" y="30" width="160" height="90" rx="10" fill="#3a2a1a" stroke="#222" strokeWidth="2" />
      <rect x="28" y="38" width="144" height="34" rx="4" fill="#1a1208" stroke="#666" strokeWidth="1.5" />
      {/* Carrete izquierdo */}
      <circle cx="58" cy="55" r="11" fill="#2a1a0a" stroke="#888" strokeWidth="1.5" />
      <circle cx="58" cy="55" r="3" fill="#888" />
      {/* Carrete derecho */}
      <circle cx="142" cy="55" r="11" fill="#2a1a0a" stroke="#888" strokeWidth="1.5" />
      <circle cx="142" cy="55" r="3" fill="#888" />
      {/* Asa */}
      <path d="M55 30 Q100 6 145 30" fill="none" stroke="#222" strokeWidth="4" strokeLinecap="round" />
      {/* Botones */}
      <rect x="34" y="86" width="14" height="22" rx="2" fill="#888" />
      <rect x="54" y="86" width="14" height="22" rx="2" fill="#888" />
      <rect x="74" y="86" width="14" height="22" rx="2" fill="#888" />
      <rect x="94" y="86" width="14" height="22" rx="2" fill="#888" />
      <rect x="114" y="86" width="14" height="22" rx="2" fill="#dc2626" />
      {/* Altavoz */}
      <circle cx="150" cy="98" r="14" fill="#1a1208" stroke="#666" strokeWidth="1.5" />
      <circle cx="150" cy="98" r="9" fill="#0a0805" />
    </g>
  );
}

function LujanSVG({ variant = 'normal' }) {
  const isVictorious = variant === 'victorious';
  const isKO = variant === 'ko';
  return (
    <svg
      viewBox={isVictorious ? '0 0 260 240' : '0 0 200 200'}
      width={isVictorious ? '200' : '140'}
      height={isVictorious ? '180' : '140'}
      className="boss-avatar-svg"
    >
      <g transform={isVictorious ? 'translate(30, 0)' : ''}>
        {/* Background circle */}
        <circle cx="100" cy="100" r="96" fill="#1a2a1a" stroke="#22c55e" strokeWidth="3" />
        {/* Face */}
        <ellipse cx="100" cy="105" rx="52" ry="58" fill="#e8c9a0" />
        {/* Short white hair */}
        <ellipse cx="100" cy="68" rx="54" ry="32" fill="#d4d4d4" />
        <rect x="46" y="60" width="108" height="18" rx="6" fill="#d4d4d4" />
        {/* Hair sides */}
        <rect x="46" y="65" width="12" height="30" rx="6" fill="#c8c8c8" />
        <rect x="142" y="65" width="12" height="30" rx="6" fill="#c8c8c8" />
        {/* Eyebrows */}
        <path d={isVictorious ? 'M70 84 Q80 78 92 83' : 'M70 88 Q80 82 92 87'} stroke="#888" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d={isVictorious ? 'M108 83 Q120 78 130 84' : 'M108 87 Q120 82 130 88'} stroke="#888" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Eyes */}
        {isKO ? (
          <KOEyes left={{ cx: 82, cy: 98 }} right={{ cx: 118, cy: 98 }} />
        ) : (
          <>
            <ellipse cx="82" cy="98" rx="8" ry="6" fill="white" />
            <ellipse cx="118" cy="98" rx="8" ry="6" fill="white" />
            <circle cx="83" cy="99" r="4" fill="#3a3a2a" />
            <circle cx="119" cy="99" r="4" fill="#3a3a2a" />
            {!isVictorious && <path d="M74 94 Q82 90 90 94" fill="#e8c9a0" />}
            {!isVictorious && <path d="M110 94 Q118 90 126 94" fill="#e8c9a0" />}
          </>
        )}
        {/* Nose */}
        <path d="M100 102 L96 116 L104 116" fill="none" stroke="#c4a882" strokeWidth="2" strokeLinecap="round" />
        {/* Mouth */}
        {isKO
          ? <path d="M88 134 Q100 124 112 134" fill="none" stroke="#8a6a4a" strokeWidth="2.5" strokeLinecap="round" />
          : isVictorious
            ? <path d="M84 124 Q100 142 116 124" fill="none" stroke="#8a6a4a" strokeWidth="3" strokeLinecap="round" />
            : <path d="M86 128 Q100 136 114 126" fill="none" stroke="#8a6a4a" strokeWidth="2.5" strokeLinecap="round" />
        }
        {/* Wrinkles */}
        <path d="M66 96 L72 94" stroke="#c4a882" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M128 94 L134 96" stroke="#c4a882" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M76 78 Q100 74 124 78" fill="none" stroke="#c4a882" strokeWidth="1" opacity="0.6" />
        <path d="M80 73 Q100 70 120 73" fill="none" stroke="#c4a882" strokeWidth="1" opacity="0.4" />
        {/* Shirt collar */}
        <path d="M60 155 L80 145 L100 158 L120 145 L140 155" fill="#2a4a2a" stroke="#22c55e" strokeWidth="1" />
        <rect x="55" y="152" width="90" height="48" rx="8" fill="#2a4a2a" />
      </g>
      {/* Prop de victoria: radiocassete sostenido a un lado */}
      {isVictorious && (
        <g transform="translate(40, 110)">
          <VintageRadio />
        </g>
      )}
    </svg>
  );
}

// Espada que sujeta Laura cuando vence al jugador.
function VictorySword() {
  return (
    <g className="boss-prop boss-prop-sword">
      {/* Empuñadura */}
      <rect x="24" y="138" width="14" height="36" rx="2" fill="#6b3010" stroke="#3a1a08" strokeWidth="1.5" />
      <rect x="14" y="172" width="34" height="10" rx="2" fill="#a78bfa" stroke="#5a3aa0" strokeWidth="1.5" />
      <circle cx="31" cy="184" r="6" fill="#a78bfa" stroke="#5a3aa0" strokeWidth="1.5" />
      {/* Guarda */}
      <rect x="6" y="128" width="50" height="10" rx="3" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
      {/* Hoja */}
      <polygon points="22,128 40,128 38,4 24,4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="31" y1="10" x2="31" y2="124" stroke="#cbd5e1" strokeWidth="1" />
      {/* Brillo */}
      <polygon points="26,30 28,30 36,110 34,110" fill="#fafafa" opacity="0.7" />
    </g>
  );
}

function LauraSVG({ variant = 'normal' }) {
  const isVictorious = variant === 'victorious';
  const isKO = variant === 'ko';
  return (
    <svg
      viewBox={isVictorious ? '0 0 260 240' : '0 0 200 200'}
      width={isVictorious ? '200' : '140'}
      height={isVictorious ? '180' : '140'}
      className="boss-avatar-svg"
    >
      <g transform={isVictorious ? 'translate(30, 0)' : ''}>
        {/* Background circle */}
        <circle cx="100" cy="100" r="96" fill="#1a1a2a" stroke="#a78bfa" strokeWidth="3" />
        {/* Long dark hair behind */}
        <ellipse cx="100" cy="110" rx="62" ry="70" fill="#2a1a0a" />
        {/* Ponytail going right */}
        <path d="M145 80 Q170 85 168 120 Q166 145 155 160" stroke="#2a1a0a" strokeWidth="18" fill="none" strokeLinecap="round" />
        <circle cx="155" cy="163" r="8" fill="#2a1a0a" />
        {/* Hair tie */}
        <rect x="143" y="76" width="8" height="10" rx="3" fill="#a78bfa" />
        {/* Face */}
        <ellipse cx="100" cy="108" rx="48" ry="54" fill="#f0d0b0" />
        {/* Hair bangs on top */}
        <ellipse cx="100" cy="70" rx="52" ry="28" fill="#2a1a0a" />
        <path d="M52 75 Q65 85 75 72 Q85 60 95 75 Q105 60 115 72 Q125 85 148 75" fill="#2a1a0a" />
        {/* Hair sides */}
        <path d="M52 75 Q48 95 50 115" stroke="#2a1a0a" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M148 75 Q152 85 148 95" stroke="#2a1a0a" strokeWidth="14" fill="none" strokeLinecap="round" />
        {/* Glasses */}
        <rect x="66" y="92" width="28" height="22" rx="4" fill="none" stroke="#6a5acd" strokeWidth="2.5" />
        <rect x="106" y="92" width="28" height="22" rx="4" fill="none" stroke="#6a5acd" strokeWidth="2.5" />
        <line x1="94" y1="102" x2="106" y2="102" stroke="#6a5acd" strokeWidth="2" />
        <line x1="66" y1="100" x2="56" y2="97" stroke="#6a5acd" strokeWidth="2" />
        <line x1="134" y1="100" x2="144" y2="97" stroke="#6a5acd" strokeWidth="2" />
        {/* Eyes */}
        {isKO ? (
          <KOEyes left={{ cx: 80, cy: 103 }} right={{ cx: 120, cy: 103 }} />
        ) : (
          <>
            <ellipse cx="80" cy="103" rx="7" ry="7" fill="white" />
            <ellipse cx="120" cy="103" rx="7" ry="7" fill="white" />
            <circle cx="81" cy="104" r="4" fill="#3a2a1a" />
            <circle cx="121" cy="104" r="4" fill="#3a2a1a" />
            <circle cx="82" cy="103" r="1.5" fill="white" />
            <circle cx="122" cy="103" r="1.5" fill="white" />
          </>
        )}
        {/* Eyebrows */}
        <path d={isVictorious ? 'M68 86 Q78 80 92 84' : 'M68 90 Q78 85 92 88'} stroke="#2a1a0a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d={isVictorious ? 'M108 84 Q122 80 132 86' : 'M108 88 Q122 85 132 90'} stroke="#2a1a0a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Nose */}
        <path d="M100 108 L97 120 L103 120" fill="none" stroke="#d4b08a" strokeWidth="1.8" strokeLinecap="round" />
        {/* Mouth */}
        {isKO
          ? <path d="M88 134 Q100 124 112 134" fill="none" stroke="#c47a6a" strokeWidth="2.5" strokeLinecap="round" />
          : isVictorious
            ? <path d="M86 128 Q100 144 114 128" fill="none" stroke="#c47a6a" strokeWidth="3" strokeLinecap="round" />
            : <path d="M88 132 Q100 138 112 132" fill="none" stroke="#c47a6a" strokeWidth="2.5" strokeLinecap="round" />
        }
        {/* Shirt/collar */}
        <path d="M62 158 L82 148 L100 160 L118 148 L138 158" fill="#2a1a3a" stroke="#a78bfa" strokeWidth="1" />
        <rect x="58" y="155" width="84" height="45" rx="8" fill="#2a1a3a" />
      </g>
      {/* Prop de victoria: espada al lado */}
      {isVictorious && (
        <g transform="translate(0, 30)">
          <VictorySword />
        </g>
      )}
    </svg>
  );
}

export default function BossAvatar({ bossSlug, phase, variant = 'normal' }) {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [bubbleVisible, setBubbleVisible] = useState(true);

  const phrases = bossSlug === 'lujan' ? LUJAN_PHRASES : LAURA_PHRASES;
  const color = bossSlug === 'lujan' ? '#22c55e' : '#a78bfa';
  const showBubble = variant === 'normal';

  useEffect(() => {
    if (!showBubble) return;
    let timeoutId = null;
    const interval = setInterval(() => {
      setBubbleVisible(false);
      timeoutId = setTimeout(() => {
        setCurrentPhrase((prev) => (prev + 1) % phrases.length);
        setBubbleVisible(true);
      }, 400);
    }, 4000);
    return () => { clearInterval(interval); clearTimeout(timeoutId); };
  }, [phrases.length, showBubble]);

  return (
    <div className={`boss-avatar-container boss-avatar-phase-${phase} boss-avatar-variant-${variant}`}>
      <div className="boss-avatar-figure">
        {bossSlug === 'lujan' ? <LujanSVG variant={variant} /> : <LauraSVG variant={variant} />}
        <div className={`boss-avatar-aura`} style={{ '--aura-color': color }} />
      </div>
      {showBubble && (
        <div className={`speech-bubble-wrapper ${bubbleVisible ? 'visible' : ''}`}>
          <SpeechBubble text={phrases[currentPhrase]} color={color} />
        </div>
      )}
    </div>
  );
}
