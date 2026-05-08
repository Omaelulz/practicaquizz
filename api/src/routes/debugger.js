// Minijuego: Debugger
// El jugador ve codigo con un bug y tiene que encontrar la linea con el error
const CHALLENGES = [
  {
    id: 'dbg-java-semicolon',
    title: 'Falta punto y coma',
    language: 'java',
    difficulty: 1,
    lines: [
      'public class Main {',
      '  public static void main(String[] args) {',
      '    int x = 10;',
      '    int y = 20',
      '    System.out.println(x + y);',
      '  }',
      '}'
    ],
    buggy_line: 3,
    explanation: 'Falta el punto y coma (;) al final de la declaracion de la variable y. En Java, cada sentencia debe terminar con ;'
  },
  {
    id: 'dbg-java-equals',
    title: 'Comparacion de Strings con ==',
    language: 'java',
    difficulty: 2,
    lines: [
      'public class Main {',
      '  public static void main(String[] args) {',
      '    String nombre = "Ana";',
      '    if (nombre == "Ana") {',
      '      System.out.println("Hola Ana");',
      '    }',
      '  }',
      '}'
    ],
    buggy_line: 3,
    explanation: 'En Java, los Strings se comparan con .equals(), no con ==. Se debe usar nombre.equals("Ana"). El operador == compara referencias, no contenido.'
  },
  {
    id: 'dbg-java-arrayindex',
    title: 'Indice fuera de rango',
    language: 'java',
    difficulty: 2,
    lines: [
      'public class Main {',
      '  public static void main(String[] args) {',
      '    int[] nums = {1, 2, 3, 4, 5};',
      '    for (int i = 0; i <= nums.length; i++) {',
      '      System.out.println(nums[i]);',
      '    }',
      '  }',
      '}'
    ],
    buggy_line: 3,
    explanation: 'La condicion del bucle usa <= en vez de <. Cuando i vale nums.length (5), se produce ArrayIndexOutOfBoundsException porque los indices van de 0 a 4.'
  },
  {
    id: 'dbg-java-infinite-loop',
    title: 'Bucle infinito',
    language: 'java',
    difficulty: 1,
    lines: [
      'public class Main {',
      '  public static void main(String[] args) {',
      '    int i = 0;',
      '    while (i < 10) {',
      '      System.out.println(i);',
      '    }',
      '  }',
      '}'
    ],
    buggy_line: 5,
    explanation: 'Falta incrementar la variable i dentro del bucle (i++). Sin ello, i siempre vale 0 y la condicion i < 10 siempre es true, creando un bucle infinito. Deberia haber un i++ tras el println.'
  },
  {
    id: 'dbg-java-return',
    title: 'Falta return en metodo',
    language: 'java',
    difficulty: 2,
    lines: [
      'public class Calculadora {',
      '  public static int sumar(int a, int b) {',
      '    int resultado = a + b;',
      '    System.out.println(resultado);',
      '  }',
      '}'
    ],
    buggy_line: 4,
    explanation: 'El metodo declara que devuelve int pero no tiene sentencia return. Despues del println deberia haber return resultado; El compilador dara error: "missing return statement".'
  },
  {
    id: 'dbg-html-unclosed',
    title: 'Etiqueta sin cerrar',
    language: 'html',
    difficulty: 1,
    lines: [
      '<!DOCTYPE html>',
      '<html>',
      '<body>',
      '  <h1>Bienvenido</h1>',
      '  <p>Este es un parrafo',
      '  <p>Este es otro parrafo</p>',
      '</body>',
      '</html>'
    ],
    buggy_line: 4,
    explanation: 'La primera etiqueta <p> no tiene su cierre </p>. Aunque algunos navegadores lo toleran, es HTML incorrecto y puede causar problemas de renderizado.'
  },
  {
    id: 'dbg-html-attribute',
    title: 'Atributo incorrecto',
    language: 'html',
    difficulty: 1,
    lines: [
      '<!DOCTYPE html>',
      '<html>',
      '<body>',
      '  <a href="https://example.com">Enlace</a>',
      '  <img source="foto.jpg" alt="Foto">',
      '</body>',
      '</html>'
    ],
    buggy_line: 4,
    explanation: 'El atributo correcto para la URL de una imagen es src, no source. Deberia ser <img src="foto.jpg" alt="Foto">.'
  },
  {
    id: 'dbg-css-colon',
    title: 'Falta dos puntos en CSS',
    language: 'css',
    difficulty: 1,
    lines: [
      'body {',
      '  background-color: #1a1a2e;',
      '  color #e6e6e6;',
      '  font-size: 16px;',
      '  margin: 0;',
      '}'
    ],
    buggy_line: 2,
    explanation: 'Falta los dos puntos (:) entre la propiedad color y su valor. Deberia ser color: #e6e6e6;'
  },
  {
    id: 'dbg-css-property',
    title: 'Propiedad CSS incorrecta',
    language: 'css',
    difficulty: 2,
    lines: [
      '.card {',
      '  padding: 20px;',
      '  border-radius: 8px;',
      '  text-color: white;',
      '  background: #2a2a3e;',
      '}'
    ],
    buggy_line: 3,
    explanation: 'La propiedad text-color no existe en CSS. La propiedad correcta para el color del texto es simplemente color. Deberia ser color: white;'
  },
  {
    id: 'dbg-sql-from',
    title: 'Palabra clave SQL mal escrita',
    language: 'sql',
    difficulty: 1,
    lines: [
      'SELECT nombre, apellido, edad',
      'FORM alumnos',
      'WHERE edad > 18',
      'ORDER BY apellido;'
    ],
    buggy_line: 1,
    explanation: 'Se ha escrito FORM en vez de FROM. La clausula correcta es FROM para indicar la tabla de la que se consultan los datos.'
  },
  {
    id: 'dbg-sql-comma',
    title: 'Falta coma en lista de columnas',
    language: 'sql',
    difficulty: 1,
    lines: [
      'SELECT nombre,',
      '       apellido',
      '       email',
      'FROM usuarios',
      'WHERE activo = 1;'
    ],
    buggy_line: 2,
    explanation: 'Falta una coma entre apellido y email en la lista de columnas del SELECT. Deberia ser: apellido, (con coma al final de la linea 2, o al inicio de la linea 3).'
  },
  {
    id: 'dbg-java-assign-cond',
    title: 'Asignacion en vez de comparacion',
    language: 'java',
    difficulty: 1,
    lines: [
      'public class Main {',
      '  public static void main(String[] args) {',
      '    int edad = 20;',
      '    if (edad = 18) {',
      '      System.out.println("Mayor de edad");',
      '    }',
      '  }',
      '}'
    ],
    buggy_line: 3,
    explanation: 'Se usa = (asignacion) en vez de == (comparacion) dentro del if. En Java esto da error de compilacion porque el resultado de una asignacion de int no es boolean.'
  },
  {
    id: 'dbg-java-null',
    title: 'NullPointerException',
    language: 'java',
    difficulty: 3,
    lines: [
      'public class Main {',
      '  public static void main(String[] args) {',
      '    String texto = null;',
      '    int longitud = texto.length();',
      '    System.out.println(longitud);',
      '  }',
      '}'
    ],
    buggy_line: 3,
    explanation: 'Se llama a .length() sobre una variable que es null. Esto produce NullPointerException en tiempo de ejecucion. Hay que comprobar que texto no sea null antes de llamar a sus metodos.'
  },
  {
    id: 'dbg-sql-join',
    title: 'Sintaxis JOIN incorrecta',
    language: 'sql',
    difficulty: 3,
    lines: [
      'SELECT a.nombre, p.nota',
      'FROM alumnos a',
      'JOIN parciales p',
      'WHERE a.id = p.alumno_id',
      'ORDER BY p.nota DESC;'
    ],
    buggy_line: 3,
    explanation: 'En un JOIN explicito se debe usar ON en vez de WHERE para la condicion de union. Deberia ser: JOIN parciales p ON a.id = p.alumno_id. WHERE se usa para filtrar resultados, no para definir la relacion del JOIN.'
  },
  {
    id: 'dbg-html-nesting',
    title: 'Anidamiento invalido',
    language: 'html',
    difficulty: 3,
    lines: [
      '<!DOCTYPE html>',
      '<html>',
      '<body>',
      '  <p>Texto con <a href="#">enlace',
      '    <div>Contenido extra</div>',
      '  </a></p>',
      '</body>',
      '</html>'
    ],
    buggy_line: 4,
    explanation: 'No se puede anidar un elemento de bloque (<div>) dentro de un elemento en linea (<a> dentro de <p>). Esto viola las reglas de anidamiento HTML y produce comportamiento impredecible en los navegadores.'
  }
];

function withoutAnswer(challenge) {
  const { buggy_line, explanation, ...rest } = challenge;
  return rest;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function debuggerRoutes(fastify) {
  // GET /minigame/debugger/start
  // Returns 8 random challenges without revealing the buggy line
  fastify.get('/minigame/debugger/start', async (_request, reply) => {
    const picked = shuffleArray(CHALLENGES).slice(0, 8);
    return { challenges: picked.map(withoutAnswer) };
  });

  // POST /minigame/debugger/submit
  // Body: { answers: [{ challenge_id, selected_line }] }
  fastify.post('/minigame/debugger/submit', async (request, reply) => {
    const { answers } = request.body || {};
    if (!Array.isArray(answers)) {
      return reply.code(400).send({ error: 'answers must be an array' });
    }

    const challengeMap = new Map(CHALLENGES.map(c => [c.id, c]));
    const POINTS_PER_CORRECT = 150;
    let score = 0;
    const results = [];

    for (const ans of answers) {
      const challenge = challengeMap.get(ans.challenge_id);
      if (!challenge) continue;

      const correct = ans.selected_line === challenge.buggy_line;
      if (correct) score += POINTS_PER_CORRECT;

      results.push({
        challenge_id: challenge.id,
        selected_line: ans.selected_line,
        buggy_line: challenge.buggy_line,
        correct,
        explanation: challenge.explanation
      });
    }

    return {
      score,
      total: results.length,
      correct: results.filter(r => r.correct).length,
      max_score: results.length * POINTS_PER_CORRECT,
      results
    };
  });
}
