-- =====================================================
-- QUIZ DAW - Seed data
-- =====================================================

-- Bosses
insert into public.bosses (slug, name, title, description, max_hp, theme_color, taunts) values
  ('laura', 'Laura', 'La Profesora Exigente',
   'Joven, con gafas, exigente pero justa. No tolera el HTML mal formado ni los bucles infinitos.',
   1000, '#a78bfa',
   '["Eso no es semántico, lo sabes.","Vamos, esa la dimos en clase.","Ahora sí, demuestra que has estudiado.","¿Seguro que quieres entregarme eso?","Esa respuesta no la dirías en el examen final."]'::jsonb),
  ('lujan', 'Luján', 'El Profesor Pasota', 
   'Mayor, con aires de pasota. Aunque parezca que no, se entera de todo lo que pasa en clase.',
   1200, '#22c55e',
   '["Bah, eso es trivial.","¿En serio? Eso lo sabe cualquiera.","Mira, te lo explico una sola vez.","Llevo 20 años haciendo esta pregunta.","Si fallas esta, repites curso."]'::jsonb)
on conflict (slug) do nothing;

-- Subjects
insert into public.subjects (slug, name, description, color, icon, boss_id) values
  ('programacion', 'Programación (Java)',
   'Tipos, arrays, bucles, condicionales, métodos, POO básica.',
   '#a78bfa', '☕', (select id from public.bosses where slug='laura')),
  ('marcas', 'Lenguaje de Marcas',
   'HTML, XML, CSS, formularios, validación, semántica.',
   '#f472b6', '〈/〉', (select id from public.bosses where slug='laura')),
  ('basesdedatos', 'Bases de Datos',
   'SQL, modelo E/R, normalización, JOINs, agregados.',
   '#22c55e', '🗄', (select id from public.bosses where slug='lujan'))
on conflict (slug) do nothing;

-- =====================================================
-- QUESTIONS - PROGRAMACION (Java)
-- =====================================================

with s as (select id from public.subjects where slug = 'programacion')
insert into public.questions (subject_id, type, difficulty, statement, code_snippet, options, answer, explanation, tags) values

((select id from s), 'multiple_choice', 1,
 '¿Cuál de estos NO es un tipo primitivo en Java?',
 null,
 '["int","double","String","boolean"]'::jsonb,
 '2'::jsonb,
 'String es una clase, no un tipo primitivo. Los primitivos en Java son: byte, short, int, long, float, double, char y boolean.',
 ARRAY['tipos','basico']),

((select id from s), 'multiple_choice', 1,
 '¿Qué imprime el siguiente código?',
 'int[] nums = {1, 2, 3, 4, 5};
System.out.println(nums.length);',
 '["4","5","6","Error"]'::jsonb,
 '1'::jsonb,
 'La propiedad length devuelve el número de elementos del array. En este caso, 5.',
 ARRAY['arrays']),

((select id from s), 'code_output', 1,
 '¿Qué se imprime por consola?',
 'int x = 10;
int y = 3;
System.out.println(x / y);',
 null,
 '"3"'::jsonb,
 'En Java, la división de dos enteros es entera: 10/3 = 3 (se descarta el decimal).',
 ARRAY['operadores']),

((select id from s), 'fill_code', 2,
 'Completa el bucle for que recorre el array nums e imprime cada elemento. Escribe sólo lo que falta entre los paréntesis.',
 'int[] nums = {10, 20, 30};
for(______) {
    System.out.println(nums[i]);
}',
 null,
 '["int i = 0; i < nums.length; i++","int i=0;i<nums.length;i++","int i = 0; i < 3; i++"]'::jsonb,
 'Un bucle for clásico necesita inicialización, condición y actualización. Lo correcto es comparar contra nums.length.',
 ARRAY['bucles','arrays']),

((select id from s), 'multiple_choice', 1,
 '¿Qué palabra clave se usa para crear una nueva instancia de una clase?',
 null,
 '["create","new","make","instance"]'::jsonb,
 '1'::jsonb,
 'En Java se usa la palabra reservada "new" para instanciar objetos.',
 ARRAY['poo']),

((select id from s), 'true_false', 1,
 'En Java, los arrays tienen tamaño fijo una vez creados.',
 null,
 null,
 'true'::jsonb,
 'Cierto. Para tener tamaño dinámico se usa ArrayList u otras colecciones.',
 ARRAY['arrays']),

((select id from s), 'code_output', 2,
 '¿Qué imprime?',
 'String s = "Hola";
s.concat(" mundo");
System.out.println(s);',
 null,
 '"Hola"'::jsonb,
 'Los Strings en Java son inmutables. concat() devuelve un nuevo String pero no modifica el original. Para verlo habría que asignar: s = s.concat(" mundo").',
 ARRAY['strings','inmutabilidad']),

((select id from s), 'multiple_choice', 2,
 '¿Cuál es la diferencia entre == y .equals() para Strings?',
 null,
 '["No hay diferencia","== compara referencias, .equals() compara contenido","== compara contenido, .equals() compara referencias",".equals() sólo funciona con números"]'::jsonb,
 '1'::jsonb,
 '== compara si son el mismo objeto en memoria. .equals() compara el contenido carácter a carácter.',
 ARRAY['strings','poo']),

((select id from s), 'fill_code', 2,
 'Declara un método público que recibe dos enteros y devuelve su suma. Completa la firma del método.',
 'public ______ suma(int a, int b) {
    return a + b;
}',
 null,
 '["int"]'::jsonb,
 'El método devuelve un int (la suma de dos enteros).',
 ARRAY['metodos']),

((select id from s), 'multiple_choice', 2,
 '¿Qué tipo de bucle se debería usar si NO sabes cuántas veces hay que iterar pero sí cuándo parar?',
 null,
 '["for","for-each","while","switch"]'::jsonb,
 '2'::jsonb,
 'while es ideal cuando la iteración depende de una condición y no de un contador.',
 ARRAY['bucles']),

((select id from s), 'code_output', 2,
 '¿Qué imprime?',
 'int n = 5;
int resultado = 1;
for(int i = 1; i <= n; i++) {
    resultado *= i;
}
System.out.println(resultado);',
 null,
 '"120"'::jsonb,
 'Calcula el factorial de 5: 1*2*3*4*5 = 120.',
 ARRAY['bucles']),

((select id from s), 'multiple_choice', 1,
 '¿Cuál es el método de entrada estándar de un programa Java?',
 null,
 '["public void main()","public static main(String[] args)","public static void main(String[] args)","static void main()"]'::jsonb,
 '2'::jsonb,
 'La firma exacta es public static void main(String[] args).',
 ARRAY['basico']),

((select id from s), 'true_false', 2,
 'Una clase en Java puede heredar de varias clases a la vez (herencia múltiple).',
 null,
 null,
 'false'::jsonb,
 'Java NO permite herencia múltiple de clases (sólo extends de una). Sí se pueden implementar varias interfaces.',
 ARRAY['poo','herencia']),

((select id from s), 'multiple_choice', 2,
 '¿Cuál es el ámbito (scope) de una variable declarada dentro de un método?',
 null,
 '["Global","De la clase","Local al método","Del paquete"]'::jsonb,
 '2'::jsonb,
 'Las variables declaradas dentro de un método sólo existen mientras se ejecuta ese método.',
 ARRAY['variables']),

((select id from s), 'code_output', 3,
 '¿Qué imprime este código?',
 'int[] arr = {1, 2, 3};
int[] copia = arr;
copia[0] = 99;
System.out.println(arr[0]);',
 null,
 '"99"'::jsonb,
 'Los arrays son objetos, así que copia es una referencia al mismo array. Modificar copia[0] modifica también arr[0].',
 ARRAY['arrays','referencias']),

((select id from s), 'multiple_choice', 2,
 '¿Qué hace el modificador "static" en un método?',
 null,
 '["No se puede sobrescribir","Pertenece a la clase, no a una instancia","Es privado por defecto","Se ejecuta automáticamente"]'::jsonb,
 '1'::jsonb,
 'Los métodos static pertenecen a la clase y se invocan sin necesidad de crear una instancia.',
 ARRAY['poo','static']),

((select id from s), 'fill_code', 3,
 'Completa el código para que imprima los números pares del 2 al 10 (incluido).',
 'for(int i = 2; i <= 10; i ______) {
    System.out.println(i);
}',
 null,
 '["+= 2","= i + 2","+=2"]'::jsonb,
 'Hay que sumar 2 en cada iteración para saltarse los impares.',
 ARRAY['bucles']),

((select id from s), 'multiple_choice', 1,
 '¿Qué operador se usa para el "AND lógico" en Java?',
 null,
 '["&","&&","and","AND"]'::jsonb,
 '1'::jsonb,
 'El AND lógico es && (con cortocircuito). El & sólo es AND a nivel de bits o sin cortocircuito.',
 ARRAY['operadores']),

((select id from s), 'true_false', 1,
 'En Java, los nombres de variables pueden empezar por un número.',
 null,
 null,
 'false'::jsonb,
 'Falso. Las variables deben empezar por letra, _ o $. Nunca por número.',
 ARRAY['variables']),

((select id from s), 'multiple_choice', 3,
 '¿Qué es un constructor en Java?',
 null,
 '["Un método que destruye el objeto","Un método especial que se llama al crear el objeto","Una variable de clase","Un tipo de bucle"]'::jsonb,
 '1'::jsonb,
 'El constructor inicializa el objeto. Tiene el mismo nombre que la clase y no devuelve tipo.',
 ARRAY['poo']);

-- =====================================================
-- QUESTIONS - LENGUAJE DE MARCAS
-- =====================================================

with s as (select id from public.subjects where slug = 'marcas')
insert into public.questions (subject_id, type, difficulty, statement, code_snippet, options, answer, explanation, tags) values

((select id from s), 'multiple_choice', 1,
 '¿Cuál es la etiqueta correcta para el encabezado más importante en HTML?',
 null,
 '["<head>","<header>","<h1>","<top>"]'::jsonb,
 '2'::jsonb,
 '<h1> es el encabezado de mayor jerarquía. <head> y <header> existen pero tienen otro propósito.',
 ARRAY['html','semantica']),

((select id from s), 'multiple_choice', 1,
 '¿Qué atributo HTML se usa para el texto alternativo de una imagen?',
 null,
 '["title","alt","src","desc"]'::jsonb,
 '1'::jsonb,
 'alt describe la imagen si no se puede mostrar. Es esencial para accesibilidad.',
 ARRAY['html','accesibilidad']),

((select id from s), 'true_false', 1,
 'Las etiquetas HTML son sensibles a mayúsculas y minúsculas.',
 null,
 null,
 'false'::jsonb,
 'Falso. HTML no distingue mayúsculas. <DIV> y <div> son lo mismo. XML/XHTML sí distingue.',
 ARRAY['html']),

((select id from s), 'multiple_choice', 2,
 '¿Cuál es la etiqueta semántica correcta para el menú de navegación principal?',
 null,
 '["<menu>","<navigation>","<nav>","<navbar>"]'::jsonb,
 '2'::jsonb,
 '<nav> es la etiqueta semántica de HTML5 para grupos de enlaces de navegación.',
 ARRAY['html','semantica']),

((select id from s), 'fill_code', 1,
 'Completa la etiqueta para crear un enlace a https://example.com con el texto "Ir":',
 '<a ____="https://example.com">Ir</a>',
 null,
 '["href"]'::jsonb,
 'href es el atributo del elemento <a> que indica el destino del hipervínculo.',
 ARRAY['html','enlaces']),

((select id from s), 'multiple_choice', 2,
 '¿Qué selector CSS tiene mayor especificidad?',
 null,
 '[".clase","#id","div","div.clase"]'::jsonb,
 '1'::jsonb,
 'El selector por id (#id) tiene la especificidad más alta de los listados (100). Las clases valen 10 y los elementos 1.',
 ARRAY['css','especificidad']),

((select id from s), 'multiple_choice', 1,
 '¿Cuál es la propiedad CSS para cambiar el color del texto?',
 null,
 '["text-color","font-color","color","foreground"]'::jsonb,
 '2'::jsonb,
 'La propiedad correcta es simplemente color.',
 ARRAY['css']),

((select id from s), 'true_false', 2,
 'En XML, cada documento debe tener exactamente un elemento raíz.',
 null,
 null,
 'true'::jsonb,
 'Cierto. Un documento XML bien formado debe tener UN único elemento raíz que englobe todo lo demás.',
 ARRAY['xml']),

((select id from s), 'multiple_choice', 2,
 '¿Qué tipo de input HTML acepta sólo números?',
 null,
 '["<input type=\"text\">","<input type=\"number\">","<input type=\"int\">","<input type=\"numeric\">"]'::jsonb,
 '1'::jsonb,
 'type="number" valida que la entrada sea numérica y muestra controles spinner en muchos navegadores.',
 ARRAY['html','formularios']),

((select id from s), 'fill_code', 2,
 'Completa la declaración XML estándar al inicio del documento:',
 '<?xml ______="1.0" encoding="UTF-8"?>',
 null,
 '["version"]'::jsonb,
 'La declaración XML indica la versión y la codificación. version es obligatoria; encoding es opcional pero recomendable.',
 ARRAY['xml']),

((select id from s), 'multiple_choice', 1,
 '¿Cuál de estas etiquetas crea una lista NO ordenada?',
 null,
 '["<ol>","<ul>","<li>","<list>"]'::jsonb,
 '1'::jsonb,
 '<ul> = unordered list. <ol> = ordered list. <li> son los elementos.',
 ARRAY['html','listas']),

((select id from s), 'true_false', 1,
 'La etiqueta <br> en HTML5 puede escribirse como <br> o <br/>, ambas son válidas.',
 null,
 null,
 'true'::jsonb,
 'En HTML5 ambas formas son válidas. En XHTML sólo es válida la forma autocerrada <br/>.',
 ARRAY['html','xhtml']),

((select id from s), 'multiple_choice', 2,
 '¿Qué propiedad CSS controla el espacio EXTERIOR de un elemento?',
 null,
 '["padding","margin","border","spacing"]'::jsonb,
 '1'::jsonb,
 'margin es el espacio exterior. padding es el espacio interior (entre el contenido y el borde).',
 ARRAY['css','box-model']),

((select id from s), 'multiple_choice', 3,
 '¿Cuál es la diferencia entre un documento XML "bien formado" y uno "válido"?',
 null,
 '["No hay diferencia","Bien formado cumple sintaxis; válido cumple además un esquema/DTD","Válido es más rápido","Bien formado significa que tiene CSS"]'::jsonb,
 '1'::jsonb,
 'Bien formado = sintaxis correcta (etiquetas cerradas, un solo root, etc). Válido = bien formado Y respeta una gramática (DTD, XSD).',
 ARRAY['xml']),

((select id from s), 'fill_code', 2,
 'Crea un input requerido con name="email" y validación de email. Completa los atributos:',
 '<input type="______" name="email" ______>',
 null,
 '["email\" name=\"email\" required","email"]'::jsonb,
 'type="email" valida formato de correo y required indica que el campo es obligatorio.',
 ARRAY['html','formularios']),

((select id from s), 'multiple_choice', 1,
 '¿Qué etiqueta HTML5 representa el contenido principal de la página?',
 null,
 '["<content>","<main>","<body>","<article>"]'::jsonb,
 '1'::jsonb,
 '<main> indica el contenido principal único de la página. <body> contiene TODO el contenido visible.',
 ARRAY['html','semantica']),

((select id from s), 'multiple_choice', 2,
 '¿Cuál es el orden correcto de un selector CSS con pseudo-clase?',
 null,
 '["a:hover","hover:a","a.hover","hover(a)"]'::jsonb,
 '0'::jsonb,
 'La sintaxis es selector:pseudo-clase. Por ejemplo a:hover, button:focus, li:first-child.',
 ARRAY['css','pseudo-clases']),

((select id from s), 'true_false', 2,
 'En XML, los nombres de etiquetas pueden empezar por número.',
 null,
 null,
 'false'::jsonb,
 'Falso. En XML los nombres de elementos no pueden empezar por número, ni por la cadena "xml".',
 ARRAY['xml']),

((select id from s), 'multiple_choice', 2,
 '¿Cuál es el atributo HTML para asociar un <label> con su input?',
 null,
 '["name","id-link","for","target"]'::jsonb,
 '2'::jsonb,
 'El atributo for del <label> debe coincidir con el id del input.',
 ARRAY['html','accesibilidad']),

((select id from s), 'multiple_choice', 3,
 '¿Qué hace display: flex en un contenedor CSS?',
 null,
 '["Hace los hijos invisibles","Convierte el contenedor en un layout flexible 1D","Crea una cuadrícula 2D","Aplica posición absoluta"]'::jsonb,
 '1'::jsonb,
 'Flexbox crea un layout flexible en una dimensión (fila o columna). Para layout 2D se usa display: grid.',
 ARRAY['css','flexbox']);

-- =====================================================
-- QUESTIONS - BASES DE DATOS
-- =====================================================

with s as (select id from public.subjects where slug = 'basesdedatos')
insert into public.questions (subject_id, type, difficulty, statement, code_snippet, options, answer, explanation, tags) values

((select id from s), 'multiple_choice', 1,
 '¿Qué cláusula SQL se usa para filtrar filas?',
 null,
 '["FILTER","WHERE","HAVING","SELECT"]'::jsonb,
 '1'::jsonb,
 'WHERE filtra filas antes de la agrupación. HAVING filtra DESPUÉS de un GROUP BY.',
 ARRAY['sql','select']),

((select id from s), 'multiple_choice', 1,
 '¿Qué tipo de JOIN devuelve TODAS las filas de la tabla izquierda?',
 null,
 '["INNER JOIN","LEFT JOIN","RIGHT JOIN","CROSS JOIN"]'::jsonb,
 '1'::jsonb,
 'LEFT JOIN devuelve todas las filas de la tabla izquierda y las coincidentes de la derecha (NULL si no hay match).',
 ARRAY['sql','joins']),

((select id from s), 'code_output', 2,
 'Tienes la tabla productos(id, nombre, precio). ¿Qué devuelve esta consulta?',
 'SELECT COUNT(*) FROM productos WHERE precio > 100;',
 null,
 '"El número de productos con precio mayor a 100"'::jsonb,
 'COUNT(*) cuenta las filas que cumplen la condición del WHERE.',
 ARRAY['sql','agregados']),

((select id from s), 'multiple_choice', 2,
 '¿Cuál es la diferencia entre PRIMARY KEY y UNIQUE?',
 null,
 '["No hay diferencia","PRIMARY KEY no admite NULL y sólo puede haber una; UNIQUE admite NULL y puede haber varias","UNIQUE no admite NULL","PRIMARY KEY admite NULL"]'::jsonb,
 '1'::jsonb,
 'PRIMARY KEY: única, no NULL, sólo una por tabla. UNIQUE: única pero admite NULL y se pueden tener varias.',
 ARRAY['sql','claves']),

((select id from s), 'fill_code', 1,
 'Completa la consulta para obtener todos los nombres de la tabla "alumnos":',
 'SELECT ______ FROM alumnos;',
 null,
 '["nombre"]'::jsonb,
 'Para seleccionar una columna concreta se indica su nombre tras SELECT.',
 ARRAY['sql','select']),

((select id from s), 'true_false', 1,
 'En SQL, una clave primaria puede contener valores NULL.',
 null,
 null,
 'false'::jsonb,
 'Falso. Una clave primaria nunca puede ser NULL ni duplicada.',
 ARRAY['sql','claves']),

((select id from s), 'multiple_choice', 2,
 '¿Qué cláusula se usa para agrupar filas por valores comunes?',
 null,
 '["ORDER BY","GROUP BY","CLUSTER BY","UNIFY"]'::jsonb,
 '1'::jsonb,
 'GROUP BY agrupa filas que tienen los mismos valores en las columnas indicadas. Suele combinarse con funciones agregadas.',
 ARRAY['sql','agregados']),

((select id from s), 'er_diagram', 2,
 'En un diagrama E/R, ¿cómo se representa una relación uno-a-muchos entre Cliente y Pedido?',
 null,
 null,
 '["Un cliente tiene muchos pedidos, un pedido pertenece a un solo cliente","1:N","Cliente 1 -- N Pedido"]'::jsonb,
 'Una relación 1:N significa que una entidad del lado "1" se relaciona con varias del lado "N", pero cada entidad "N" pertenece sólo a una "1".',
 ARRAY['er','cardinalidad']),

((select id from s), 'multiple_choice', 2,
 'En un modelo E/R, ¿qué representa un rombo (diamante)?',
 null,
 '["Una entidad","Un atributo","Una relación","Una clave primaria"]'::jsonb,
 '2'::jsonb,
 'En el modelo Chen: rectángulo = entidad, óvalo = atributo, rombo = relación.',
 ARRAY['er','notacion']),

((select id from s), 'fill_code', 2,
 'Completa la consulta para obtener los productos ordenados por precio descendente:',
 'SELECT * FROM productos ORDER BY precio ______;',
 null,
 '["DESC"]'::jsonb,
 'DESC ordena de mayor a menor. ASC (por defecto) ordena de menor a mayor.',
 ARRAY['sql','order']),

((select id from s), 'multiple_choice', 3,
 '¿En qué forma normal se elimina la dependencia transitiva?',
 null,
 '["1FN","2FN","3FN","BCNF"]'::jsonb,
 '2'::jsonb,
 '3FN exige que ningún atributo no clave dependa de otro atributo no clave (sin dependencias transitivas).',
 ARRAY['normalizacion']),

((select id from s), 'multiple_choice', 1,
 '¿Qué hace la cláusula DISTINCT?',
 null,
 '["Ordena los resultados","Elimina filas duplicadas","Cuenta filas","Filtra por una condición"]'::jsonb,
 '1'::jsonb,
 'DISTINCT elimina las filas duplicadas del resultado.',
 ARRAY['sql','select']),

((select id from s), 'code_output', 2,
 '¿Qué hace esta consulta?',
 'SELECT departamento, AVG(salario)
FROM empleados
GROUP BY departamento;',
 null,
 '"Calcula el salario medio por departamento"'::jsonb,
 'AVG es la función agregada de media. Combinada con GROUP BY, calcula la media por cada grupo.',
 ARRAY['sql','agregados']),

((select id from s), 'true_false', 2,
 'En el modelo E/R, una entidad débil depende de la existencia de otra entidad.',
 null,
 null,
 'true'::jsonb,
 'Cierto. Una entidad débil no puede existir sin otra entidad fuerte (ej: Línea_Pedido depende de Pedido).',
 ARRAY['er']),

((select id from s), 'multiple_choice', 2,
 '¿Qué representa una clave foránea (FOREIGN KEY)?',
 null,
 '["La clave principal de la tabla","Un valor único","Una referencia a la clave primaria de otra tabla","Un índice"]'::jsonb,
 '2'::jsonb,
 'Una clave foránea es un campo (o conjunto) que apunta a la clave primaria de otra tabla, garantizando integridad referencial.',
 ARRAY['sql','claves']),

((select id from s), 'fill_code', 2,
 'Completa la sentencia para borrar todas las filas de la tabla "logs" SIN borrar la tabla:',
 '______ FROM logs;',
 null,
 '["DELETE"]'::jsonb,
 'DELETE FROM borra filas. DROP TABLE borra la tabla entera. TRUNCATE también borra todas las filas pero no se considera DML estándar.',
 ARRAY['sql','dml']),

((select id from s), 'multiple_choice', 1,
 '¿Cuál NO es un tipo de dato común en SQL?',
 null,
 '["VARCHAR","INT","DATE","STRING"]'::jsonb,
 '3'::jsonb,
 'STRING no es un tipo SQL estándar. Para texto se usa VARCHAR, CHAR o TEXT según el SGBD.',
 ARRAY['sql','tipos']),

((select id from s), 'er_diagram', 3,
 'Una relación N:M (muchos a muchos) entre Alumno y Asignatura. ¿Cómo se implementa físicamente en una BD relacional?',
 null,
 null,
 '["Tabla intermedia (alumno_asignatura) con dos claves foráneas","Tabla puente","Tabla de unión"]'::jsonb,
 'Las relaciones N:M se resuelven creando una tabla intermedia que contiene las dos claves foráneas. No se pueden representar directamente.',
 ARRAY['er','relacional']),

((select id from s), 'multiple_choice', 2,
 '¿Qué función agregada devuelve el valor máximo de una columna?',
 null,
 '["TOP","MAX","MAYOR","MOST"]'::jsonb,
 '1'::jsonb,
 'MAX(columna) devuelve el valor máximo. Otras funciones agregadas: MIN, AVG, SUM, COUNT.',
 ARRAY['sql','agregados']),

((select id from s), 'true_false', 1,
 'La sentencia SELECT modifica los datos de la tabla.',
 null,
 null,
 'false'::jsonb,
 'Falso. SELECT sólo consulta. Las que modifican son INSERT, UPDATE y DELETE.',
 ARRAY['sql']);
