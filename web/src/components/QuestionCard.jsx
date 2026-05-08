// Componente que muestra una pregunta y permite responderla
// Segun el tipo (multiple_choice, true_false, fill_code...) renderiza distinto
import { useMemo } from 'react';

// Parsea options que pueden venir como JSON string o como array
function parseOptions(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; }
    catch { return []; }
  }
  return [];
}

// Baraja las opciones de forma estable por pregunta usando el id como semilla
function shuffleWithSeed(arr, seed) {
  const indices = arr.map((_, i) => i);
  let s = seed;
  for (let i = indices.length - 1; i > 0; i--) {
    s = (s * 16807 + 11) % 2147483647;
    const j = s % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

export default function QuestionCard({ question, value, onChange, disabled = false }) {
  const options = parseOptions(question.options);

  // Orden aleatorio estable por pregunta: shuffled[displayIdx] = originalIdx
  const shuffled = useMemo(() => {
    if (options.length === 0) return [];
    const seed = typeof question.id === 'string'
      ? question.id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7)
      : question.id || 1;
    return shuffleWithSeed(options, Math.abs(seed));
  }, [question.id, options.length]);

  // Busca que displayIdx corresponde al originalIdx guardado en value
  const selectedDisplay = value !== null && value !== undefined
    ? shuffled.indexOf(Number(value))
    : -1;

  return (
    <div>
      <h2 className="question-statement">{question.statement}</h2>

      {question.code_snippet && (
        <pre className="code-block"><code>{question.code_snippet}</code></pre>
      )}

      {question.image_url && (
        <img src={question.image_url} alt="" style={{maxWidth: '100%', borderRadius: 8, marginBottom: 16}} />
      )}

      {question.type === 'multiple_choice' && (
        <div className="options">
          {shuffled.map((origIdx, displayIdx) => (
            <button
              key={origIdx}
              type="button"
              className={`option ${selectedDisplay === displayIdx ? 'selected' : ''}`}
              onClick={() => !disabled && onChange(origIdx)}
              disabled={disabled}
            >
              <span className="option-letter">{String.fromCharCode(65 + displayIdx)}</span>
              <span>{options[origIdx]}</span>
            </button>
          ))}
        </div>
      )}

      {question.type === 'true_false' && (
        <div className="tf-row">
          <button
            type="button"
            className={`option ${value === 'true' ? 'selected' : ''}`}
            onClick={() => !disabled && onChange('true')}
            disabled={disabled}
          >
            <span className="option-letter">V</span> Verdadero
          </button>
          <button
            type="button"
            className={`option ${value === 'false' ? 'selected' : ''}`}
            onClick={() => !disabled && onChange('false')}
            disabled={disabled}
          >
            <span className="option-letter">F</span> Falso
          </button>
        </div>
      )}

      {(question.type === 'fill_code' || question.type === 'code_output' || question.type === 'er_diagram') && (
        <input
          className="input mono"
          placeholder={question.type === 'code_output' ? 'Escribe el output exacto…' : 'Escribe tu respuesta…'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoFocus
        />
      )}
    </div>
  );
}
