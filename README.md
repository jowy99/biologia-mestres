# Biología para maestros

Web de estudio interactiva para la asignatura de Biología del doble grado en Educación Infantil y Primaria. El contenido de la web está en catalán.

Cada tema tiene teoría con progreso, una célula interactiva con juegos, comparador de reinos, tarjetas de memoria, test, un juego de clasificar organismos, glosario y resumen de progreso. Ahora mismo está disponible el **tema 8: «Els cinc regnes»**.

## Características
- HTML, CSS y JavaScript sin dependencias ni proceso de compilación.
- Pensada primero para el móvil; tema claro y oscuro.
- Funciona sin conexión (service worker) y se puede instalar como app.
- El progreso se guarda en el navegador y se puede exportar e importar desde la portada.

## Estructura
```
index.html              Portada con el menú de temas
assets/                 Estilos, fuentes, iconos y código común
tema-08/                Tema 8
  manual.md             Texto del tema (fuente)
  contingut.js          Generado a partir de manual.md
  dades.js              Ideas clave, preguntas, mitos, organismos…
  app.js                Lógica de la web del tema
sw.js                   Service worker (modo sin conexión)
build.mjs               Regenera los contingut.js
publicar.mjs            Prepara la carpeta publicar/ para el hosting
```

## Probarla en local
La web necesita servirse desde un servidor (no funciona con doble clic). Por ejemplo:
```
npx serve .
```

## Si cambias el manual
Edita `tema-XX/manual.md` y ejecuta:
```
node build.mjs
```

## Añadir un tema nuevo (p. ej. el 3)
1. Copia la carpeta `tema-08` como `tema-03`.
2. Sustituye `tema-03/manual.md` por el manual del tema (mismo formato: `# N. Capítol`, `## N.M. Secció`) y ejecuta `node build.mjs`.
3. Cambia en `tema-03/dades.js` las ideas clave, preguntas, mitos y organismos, y el título en `tema-03/index.html`. En `tema-03/app.js` cambia `const T = 't8:'` por `const T = 't3:'`.
4. En `assets/temes.js`, en el tema 3, pon `actiu: true, clau: 't3', url: 'tema-03/'` y su título.

## Publicar
1. Ejecuta `node publicar.mjs`: regenera los `contingut.js` y copia en `publicar/` solo los archivos necesarios.
2. Sube el contenido de `publicar/` a tu hosting (debe ser **HTTPS** para que funcionen el modo sin conexión y la instalación).
3. Cada vez que publiques cambios, sube la versión de la caché en `sw.js` (`biologia-v17` → `biologia-v18…`) para que los navegadores descarguen la versión nueva.

El archivo `.htaccess` añade cabeceras de seguridad si el hosting usa Apache.
