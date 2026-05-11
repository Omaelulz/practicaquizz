// Generador de preguntas con IA (Groq por defecto, gratis y rápido).
// Devuelve preguntas en el mismo formato que la tabla "questions" de Supabase
// para poder insertarlas sin tocar el resto del flujo.
import 'dotenv/config';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const TYPES = ['multiple_choice', 'fill_code', 'code_output', 'true_false', 'er_diagram'];

export function isAIEnabled() {
  return Boolean(process.env.GROQ_API_KEY);
}

// Reparte la cuenta total en una distribución por dificultad razonable.
function difficultyMix(count) {
  const easy = Math.max(1, Math.round(count * 0.4));
  const hard = Math.max(1, Math.round(count * 0.2));
  const medium = Math.max(1, count - easy - hard);
  return { 1: easy, 2: medium, 3: hard };
}

// Reparte la cuenta total entre los tipos permitidos.
function typeMix(count, subjectSlug) {
  // er_diagram sólo tiene sentido en BD
  if (subjectSlug === 'basesdedatos') {
    return {
      multiple_choice: Math.round(count * 0.45),
      code_output:     Math.round(count * 0.15),
      fill_code:       Math.round(count * 0.15),
      true_false:      Math.round(count * 0.15),
      er_diagram:      Math.max(1, count - Math.round(count * 0.45) - Math.round(count * 0.15) * 3)
    };
  }
  return {
    multiple_choice: Math.round(count * 0.55),
    code_output:     Math.round(count * 0.20),
    fill_code:       Math.round(count * 0.15),
    true_false:      Math.max(1, count - Math.round(count * 0.55) - Math.round(count * 0.20) - Math.round(count * 0.15))
  };
}

function buildPrompt({ subjectSlug, subjectName, subjectDescription, count }) {
  const diff = difficultyMix(count);
  const types = typeMix(count, subjectSlug);

  const system = `Eres un profesor experto que diseña preguntas de quiz para alumnos de 1º de DAW (Desarrollo de Aplicaciones Web) en España.
Generas preguntas técnicas, precisas y en español de España.
Tus preguntas son originales, variadas y cubren temas distintos cada vez (no repitas siempre los mismos ejemplos).
Devuelves SIEMPRE JSON estricto válido, sin texto fuera del JSON.`;

  const user = `Genera EXACTAMENTE ${count} preguntas para la asignatura: "${subjectName}".
Temática: ${subjectDescription || subjectName}.

Distribución por dificultad (1=fácil, 2=media, 3=difícil):
- dificultad 1: ${diff[1]} preguntas
- dificultad 2: ${diff[2]} preguntas
- dificultad 3: ${diff[3]} preguntas

Distribución por tipo de pregunta:
${Object.entries(types).map(([t, n]) => `- ${t}: ${n}`).join('\n')}

Reglas del formato (MUY IMPORTANTES):
- "type" debe ser uno de: multiple_choice, fill_code, code_output, true_false, er_diagram.
- "difficulty" entero entre 1 y 3.
- "statement" es el enunciado en español, claro y autosuficiente.
- "code_snippet" es null o un string con código (Java para programación, HTML/CSS/XML para marcas, SQL para bases de datos). Sin comentarios HTML rotos.
- "options" SOLO para multiple_choice: array de EXACTAMENTE 4 strings, todos distintos, con UNA única correcta.
- "answer":
    * multiple_choice → entero 0..3 (índice 0-based de la opción correcta dentro de "options").
    * true_false → string "true" o "false".
    * fill_code / code_output / er_diagram → array de strings con todas las respuestas aceptables (variantes razonables de espacios o sintaxis). Mínimo 1, máximo 4.
- "explanation" string breve (1-3 frases) explicando por qué la respuesta es correcta.
- "tags" array de 1-3 strings cortos en minúsculas con la temática (p.ej. "bucles", "joins", "css").
- No incluyas campos extra.
- No uses Markdown ni triple backticks dentro de los strings.
- Las preguntas deben ser pedagógicamente útiles para un estudiante de DAW de 1er año.

Devuelve un único objeto JSON con esta forma exacta:
{
  "questions": [
    {
      "type": "multiple_choice",
      "difficulty": 1,
      "statement": "...",
      "code_snippet": null,
      "options": ["a","b","c","d"],
      "answer": 2,
      "explanation": "...",
      "tags": ["tag1"]
    }
  ]
}`;

  return { system, user };
}

// Valida y normaliza una pregunta. Devuelve la pregunta normalizada o null si es inválida.
function normalizeQuestion(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const type = raw.type;
  if (!TYPES.includes(type)) return null;

  const difficulty = Number(raw.difficulty);
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 3) return null;

  const statement = typeof raw.statement === 'string' ? raw.statement.trim() : '';
  if (!statement) return null;

  const code_snippet = raw.code_snippet ? String(raw.code_snippet) : null;
  const explanation = typeof raw.explanation === 'string' ? raw.explanation.trim() : '';
  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((t) => typeof t === 'string').slice(0, 5).map((t) => t.toLowerCase().trim())
    : [];

  let options = null;
  let answer;

  if (type === 'multiple_choice') {
    if (!Array.isArray(raw.options) || raw.options.length !== 4) return null;
    options = raw.options.map((o) => String(o));
    const idx = Number(raw.answer);
    if (!Number.isInteger(idx) || idx < 0 || idx > 3) return null;
    answer = idx;
  } else if (type === 'true_false') {
    const v = String(raw.answer).toLowerCase().trim();
    if (v !== 'true' && v !== 'false') return null;
    answer = v;
  } else {
    // fill_code, code_output, er_diagram
    let arr;
    if (Array.isArray(raw.answer)) arr = raw.answer;
    else if (raw.answer !== null && raw.answer !== undefined) arr = [raw.answer];
    else return null;
    answer = arr.map((a) => String(a).trim()).filter(Boolean).slice(0, 4);
    if (answer.length === 0) return null;
  }

  return {
    type,
    difficulty,
    statement,
    code_snippet,
    options,
    answer,
    explanation,
    tags: ['ai', ...tags]
  };
}

// Llama a Groq y devuelve el contenido JSON parseado.
async function callGroq({ system, user, model }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY no configurada');

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.85,
      max_tokens: 8000
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Groq API ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Respuesta vacía del modelo');

  return JSON.parse(content);
}

// Tamaño máximo por llamada al modelo. Cuentas mayores se dividen en lotes
// que se ejecutan en paralelo para no superar el timeout de funciones serverless.
const MAX_PER_CALL = 15;

async function generateBatch({ subjectSlug, subjectName, subjectDescription, count }) {
  const { system, user } = buildPrompt({ subjectSlug, subjectName, subjectDescription, count });
  const parsed = await callGroq({ system, user });
  const arr = Array.isArray(parsed?.questions) ? parsed.questions : [];
  return arr.map(normalizeQuestion).filter(Boolean);
}

// Genera N preguntas para una asignatura. Devuelve un array normalizado (sin id de DB).
// Si el modelo devuelve menos de las pedidas, se devuelven las que haya.
export async function generateAIQuestions({ subjectSlug, subjectName, subjectDescription, count }) {
  // Partimos en lotes para paralelizar y evitar timeouts.
  const batches = [];
  let remaining = count;
  while (remaining > 0) {
    const size = Math.min(MAX_PER_CALL, remaining);
    batches.push(size);
    remaining -= size;
  }

  const results = await Promise.all(
    batches.map((size) =>
      generateBatch({ subjectSlug, subjectName, subjectDescription, count: size })
        .catch((err) => {
          console.warn('[ai] batch falló:', err.message);
          return [];
        })
    )
  );

  const all = results.flat();
  if (all.length === 0) throw new Error('El modelo no devolvió preguntas válidas');
  return all.slice(0, count);
}
