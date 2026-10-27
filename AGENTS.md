# Instrucciones permanentes del proyecto

## Objetivo

Este repositorio contiene una aplicación estática para estudiar el glosario de ciberseguridad del NIST. Mantenerla gratuita, accesible, responsive y apta para GitHub Pages.

## Fuente de datos

- `data/nist_glossary.csv` es el archivo fuente del producto. Leerlo, no modificarlo, sobrescribirlo, regenerarlo ni reemplazarlo.
- Usar sus columnas `term`, `link`, `abbrSyn` y `definitions` sin inventar, corregir, traducir, resumir o combinar definiciones.
- No deduplicar filas por `term`: términos repetidos son registros independientes.
- Tratar todos los campos de datos como texto no confiable al renderizar. No ejecutarlos ni interpolarlos en HTML.

## Implementación

- Priorizar HTML semántico, CSS y JavaScript nativos; no agregar backend, bases de datos, telemetría o servicios pagos.
- Mantener separados el análisis/carga de CSV y el estado de interfaz.
- Usar rutas relativas para recursos y datos, compatibles con publicaciones de GitHub Pages bajo una subruta.
- No guardar estados ni datos de estudio. No usar `localStorage`, cookies u otro almacenamiento para las tarjetas estudiadas.
- El flujo principal muestra una sola tarjeta por vez; puede ser aleatoria o seleccionada desde la búsqueda. Al solicitar otra aleatoria, excluir la tarjeta actual si hay más de un registro. Mantener la búsqueda limitada a coincidencias de términos/sinónimos, sin agregar filtros, catálogo, historial o medición de progreso.
- En los resultados de búsqueda, presentar previews de definiciones con `textContent`, sin transformar ni ejecutar el contenido fuente; sólo enlazar direcciones HTTPS válidas de NIST.
- Cuando una búsqueda coincide exactamente con varias filas del mismo término, mostrarlas juntas en una tarjeta con todas sus definiciones en orden de origen y revelar esa lista automáticamente, sin colapsar registros ni alterar textos. Mostrar abreviaturas/sinónimos y URLs de fuente repetidas una sola vez, conservando la primera aparición.
- Mantener disponible una acción de limpieza que vacíe el campo/resultados y devuelva el foco al campo.
- Cargar el CSV una sola vez durante el inicio de la aplicación; las selecciones aleatorias posteriores usan el conjunto mantenido en memoria.
- Generar IDs deterministas a partir de todos los campos de la fila y desambiguar duplicados idénticos de forma determinista. Garantizar que sean distintos y estables mientras el contenido y orden del archivo no cambien.
- Manejar explícitamente los errores de carga y parsing. Nunca convertir un fallo en una pantalla aparentemente vacía o exitosa.
- Diseñar para teclado, lectores de pantalla, foco visible y pantallas pequeñas.
- No introducir dependencias si las APIs estándar cubren el requisito.

## Cambios y validación

- Leer el contexto y el código existente antes de modificarlo; hacer cambios pequeños y directamente relacionados con el objetivo.
- No sobrescribir cambios previos del usuario ni revertir archivos ajenos a la tarea.
- Mantener y actualizar `SPEC.md` cuando cambien requisitos o criterios acordados.
- Añadir pruebas para parsing, identificadores únicos incluso en filas idénticas, búsqueda y selección aleatoria sin repetición inmediata, incluyendo comillas, comas y campos multilínea. Verificar que la app no incluya controles ni código de persistencia de estudio.
- Verificar el sitio bajo una subruta con `python3 tests/pages-smoke.py --site .` y comprobar el layout móvil a 320 CSS px cuando haya cambios en búsqueda o estilos.
- Medir e informar el tiempo de carga/análisis del CSV completo sin añadir optimizaciones anticipadas ni imponer un umbral no acordado.
- Ejecutar las pruebas más pequeñas que cubran el cambio y verificar que el CSV original permanezca intacto.
- No comenzar una implementación que contradiga la especificación sin solicitar primero la aprobación del usuario.
