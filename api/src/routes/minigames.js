import { supabaseAdmin } from '../lib/supabase.js';

// Minijuego: Ordena el Codigo
// El jugador recibe lineas desordenadas y tiene que ponerlas en orden
const CHALLENGES = [
  {
    id: 'java-for-loop',
    title: 'Bucle for en Java',
    language: 'java',
    difficulty: 1,
    lines: [
      'public class Main {',
      '  public static void main(String[] args) {',
      '    for (int i = 0; i < 5; i++) {',
      '      System.out.println(i);',
      '    }',
      '  }',
      '}'
    ]
  },
  {
    id: 'java-if-else',
    title: 'If-Else en Java',
    language: 'java',
    difficulty: 1,
    lines: [
      'public class Main {',
      '  public static void main(String[] args) {',
      '    int nota = 7;',
      '    if (nota >= 5) {',
      '      System.out.println("Aprobado");',
      '    } else {',
      '      System.out.println("Suspenso");',
      '    }',
      '  }',
      '}'
    ]
  },
  {
    id: 'java-array-iteration',
    title: 'Array y recorrido en Java',
    language: 'java',
    difficulty: 2,
    lines: [
      'public class Main {',
      '  public static void main(String[] args) {',
      '    int[] numeros = {1, 2, 3, 4, 5};',
      '    for (int i = 0; i < numeros.length; i++) {',
      '      System.out.println(numeros[i]);',
      '    }',
      '  }',
      '}'
    ]
  },
  {
    id: 'java-method',
    title: 'Definicion de metodo en Java',
    language: 'java',
    difficulty: 1,
    lines: [
      'public class Calculadora {',
      '  public static int sumar(int a, int b) {',
      '    int resultado = a + b;',
      '    return resultado;',
      '  }',
      '}'
    ]
  },
  {
    id: 'html-basic-page',
    title: 'Estructura basica HTML',
    language: 'html',
    difficulty: 1,
    lines: [
      '<!DOCTYPE html>',
      '<html lang="es">',
      '<head>',
      '  <title>Mi Pagina</title>',
      '</head>',
      '<body>',
      '  <h1>Hola Mundo</h1>',
      '</body>',
      '</html>'
    ]
  },
  {
    id: 'html-form',
    title: 'Formulario HTML con inputs',
    language: 'html',
    difficulty: 2,
    lines: [
      '<form action="/enviar" method="post">',
      '  <label for="nombre">Nombre:</label>',
      '  <input type="text" id="nombre" name="nombre">',
      '  <label for="email">Email:</label>',
      '  <input type="email" id="email" name="email">',
      '  <button type="submit">Enviar</button>',
      '</form>'
    ]
  },
  {
    id: 'html-table',
    title: 'Tabla HTML',
    language: 'html',
    difficulty: 2,
    lines: [
      '<table>',
      '  <thead>',
      '    <tr>',
      '      <th>Nombre</th>',
      '      <th>Edad</th>',
      '    </tr>',
      '  </thead>',
      '  <tbody>',
      '    <tr>',
      '      <td>Ana</td>',
      '      <td>22</td>',
      '    </tr>',
      '  </tbody>',
      '</table>'
    ]
  },
  {
    id: 'css-flexbox',
    title: 'Layout con Flexbox en CSS',
    language: 'css',
    difficulty: 2,
    lines: [
      '.contenedor {',
      '  display: flex;',
      '  flex-direction: row;',
      '  justify-content: center;',
      '  align-items: center;',
      '  gap: 16px;',
      '}'
    ]
  },
  {
    id: 'css-basic-selectors',
    title: 'Selectores y propiedades CSS',
    language: 'css',
    difficulty: 1,
    lines: [
      'body {',
      '  margin: 0;',
      '  font-family: Arial, sans-serif;',
      '}',
      'h1 {',
      '  color: #333;',
      '  font-size: 24px;',
      '}'
    ]
  },
  {
    id: 'sql-select-where',
    title: 'SELECT con WHERE en SQL',
    language: 'sql',
    difficulty: 1,
    lines: [
      'SELECT nombre, apellido, edad',
      'FROM alumnos',
      'WHERE edad >= 18',
      'ORDER BY apellido ASC;'
    ]
  },
  {
    id: 'sql-create-table',
    title: 'CREATE TABLE en SQL',
    language: 'sql',
    difficulty: 2,
    lines: [
      'CREATE TABLE alumnos (',
      '  id INT PRIMARY KEY AUTO_INCREMENT,',
      '  nombre VARCHAR(50) NOT NULL,',
      '  apellido VARCHAR(50) NOT NULL,',
      '  edad INT,',
      '  email VARCHAR(100) UNIQUE',
      ');'
    ]
  },
  {
    id: 'sql-insert',
    title: 'INSERT INTO en SQL',
    language: 'sql',
    difficulty: 1,
    lines: [
      'INSERT INTO alumnos',
      '  (nombre, apellido, edad, email)',
      'VALUES',
      "  ('Carlos', 'Garcia', 20, 'carlos@email.com');"
    ]
  },
  {
    id: 'java-switch',
    title: 'Switch en Java',
    language: 'java',
    difficulty: 2,
    lines: [
      'public class Main {',
      '  public static void main(String[] args) {',
      '    int dia = 3;',
      '    switch (dia) {',
      '      case 1: System.out.println("Lunes"); break;',
      '      case 2: System.out.println("Martes"); break;',
      '      case 3: System.out.println("Miercoles"); break;',
      '      default: System.out.println("Otro dia"); break;',
      '    }',
      '  }',
      '}'
    ]
  },
  {
    id: 'java-class-constructor',
    title: 'Clase con constructor en Java',
    language: 'java',
    difficulty: 3,
    lines: [
      'public class Alumno {',
      '  private String nombre;',
      '  private int edad;',
      '  public Alumno(String nombre, int edad) {',
      '    this.nombre = nombre;',
      '    this.edad = edad;',
      '  }',
      '  public String getNombre() {',
      '    return this.nombre;',
      '  }',
      '}'
    ]
  },
  {
    id: 'sql-join',
    title: 'JOIN en SQL',
    language: 'sql',
    difficulty: 3,
    lines: [
      'SELECT a.nombre, a.apellido, n.asignatura, n.nota',
      'FROM alumnos a',
      'INNER JOIN notas n',
      'ON a.id = n.alumno_id',
      'WHERE n.nota >= 5',
      'ORDER BY n.nota DESC;'
    ]
  }
];

// Mezcla un array de forma aleatoria (algoritmo Fisher-Yates)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function minigameRoutes(fastify) {
  // GET /minigame/code-order/start
  // Returns 5 random challenges with shuffled lines
  fastify.get('/minigame/code-order/start', { preHandler: [fastify.requireAuth] }, async (request, reply) => {
    const picked = shuffle(CHALLENGES).slice(0, 5);

    const challenges = picked.map((c) => ({
      id: c.id,
      title: c.title,
      language: c.language,
      difficulty: c.difficulty,
      lineCount: c.lines.length,
      lines: shuffle(c.lines)
    }));

    return { challenges };
  });

  // POST /minigame/code-order/submit
  // Body: { answers: [{ challenge_id, ordered_lines: [...] }] }
  fastify.post('/minigame/code-order/submit', { preHandler: [fastify.requireAuth] }, async (request, reply) => {
    const { answers } = request.body || {};
    if (!Array.isArray(answers)) {
      return reply.code(400).send({ error: 'answers must be an array' });
    }

    const challengeMap = new Map(CHALLENGES.map((c) => [c.id, c]));
    let totalScore = 0;
    const results = [];

    for (const ans of answers) {
      const challenge = challengeMap.get(ans.challenge_id);
      if (!challenge) {
        results.push({ challenge_id: ans.challenge_id, status: 'not_found', points: 0 });
        continue;
      }

      const correct = challenge.lines;
      const given = ans.ordered_lines;

      if (!Array.isArray(given) || given.length !== correct.length) {
        results.push({ challenge_id: ans.challenge_id, status: 'wrong', points: 0, correct_order: correct });
        continue;
      }

      // Count lines in correct position
      let correctCount = 0;
      for (let i = 0; i < correct.length; i++) {
        if (given[i] === correct[i]) correctCount++;
      }

      const ratio = correctCount / correct.length;
      let points = 0;
      let status = 'wrong';

      if (ratio === 1) {
        points = 200;
        status = 'perfect';
      } else if (ratio > 0.7) {
        points = 100;
        status = 'partial';
      }

      totalScore += points;
      results.push({
        challenge_id: ans.challenge_id,
        status,
        points,
        correct_positions: correctCount,
        total_lines: correct.length,
        correct_order: correct
      });
    }

    return { score: totalScore, max_score: answers.length * 200, results };
  });
}
