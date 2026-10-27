# Especificación: flashcards del glosario de ciberseguridad del NIST

## Estado

Implementada. Esta especificación documenta el MVP acordado.

## Contexto y fuente de datos

El proyecto contiene `data/nist_glossary.csv`, con las columnas `term`, `link`, `abbrSyn` y `definitions`, y un README que cita el glosario del NIST y Kaggle. El CSV existente será la única fuente de datos: se leerá sin editarlo ni regenerarlo.

La inspección local del CSV encontró 15.136 registros, 3.384.179 bytes y 15.136 filas completas distintas. Hay 2.082 términos repetidos, 469 campos con saltos de línea y 5.417 campos que contienen comas.

## Objetivo y alcance

Crear una aplicación de flashcards estática, gratuita, responsive y publicable en GitHub Pages. Al iniciar, cargará el CSV una vez y elegirá al azar un registro para estudiar. La persona podrá revelar la definición y los datos de apoyo y solicitar otra tarjeta aleatoria. La aplicación no guarda estados ni datos de estudio.

### Fuera de alcance

- Backend, base de datos, cuentas, analítica o servicios pagos.
- Edición, normalización, traducción, paráfrasis o corrección de las definiciones.
- Enriquecimiento externo o actualización automática de los datos.
- Garantía de uso sin conexión; la app estática requiere que sus archivos estén disponibles.
- Catálogo completo, filtros, historial de tarjetas, medición del progreso, repetición espaciada avanzada o gamificación.

## Requisitos funcionales

1. **Carga:** realizar una única carga inicial del CSV por sesión de la aplicación mediante una ruta relativa compatible con GitHub Pages; pedir otra tarjeta no vuelve a solicitar el archivo. Validar sus cuatro columnas esperadas.
2. **Procesamiento e integridad:** admitir comillas, comas, comillas escapadas y campos multilínea. Conservar literalmente `term`, `link`, `abbrSyn` y `definitions`; cada fila es un registro independiente, incluidos los términos duplicados.
3. **Identificación:** asignar a cada registro un identificador único que no dependa sólo de `term`. Derivarlo de todos los campos de la fila y desambiguar filas idénticas de forma determinista. Dos filas idénticas deben conservar identificadores distintos y estables mientras el archivo (incluido su orden) no cambie.
4. **Estudio aleatorio:** mostrar una única tarjeta a la vez. Al iniciar, seleccionar aleatoriamente un registro del conjunto completo. Mostrar `term` inicialmente y permitir revelar/ocultar `definitions`, `abbrSyn` y el enlace original a la fuente, cuando existan.
5. **Siguiente tarjeta:** permitir solicitar otra selección aleatoria del conjunto completo. No volver a seleccionar inmediatamente el registro actual si existe otro registro disponible. Si sólo hay un registro, indicarlo y evitar que la acción parezca haber cambiado de tarjeta.
6. **Sin estado persistente:** no ofrecer opciones para marcar tarjetas como conocidas o pendientes, no medir ni mostrar progreso y no usar `localStorage`, cookies u otro almacenamiento para datos de estudio.
7. **Búsqueda:** permitir buscar coincidencias parciales o exactas en `term` y `abbrSyn`, sin distinguir mayúsculas ni diacríticos. Seleccionar directamente una coincidencia única. Si la consulta coincide exactamente con un término presente en varios registros, mostrar una tarjeta con ese término y la lista completa de definiciones originales, sin pedir elegir una; paginar las definiciones dentro de la misma tarjeta, con un máximo de cuatro por página. En esa tarjeta, mostrar una sola vez cada valor repetido de `abbrSyn` y cada URL de fuente repetida, conservando el orden de su primera aparición; no omitir ni alterar definiciones. Las coincidencias exactas por sinónimo y las parciales múltiples continúan mostrando opciones accesibles para elegir; no truncar resultados exactos y limitar sólo coincidencias parciales amplias. Incluir vistas previas de definiciones y enlaces HTTPS válidos en esas opciones; ofrecer una acción para limpiar consulta y resultados.
8. **Errores recuperables:** si el CSV no carga o su encabezado es inválido, informar el problema y no presentar una pantalla de estudio vacía como si hubiera tenido éxito. Una búsqueda sin coincidencias debe informar el resultado sin interrumpir el estudio.
9. **Accesibilidad:** permitir usar las acciones principales con teclado; emplear controles semánticos, foco visible y mensajes/estados comprensibles para tecnologías de asistencia.

## Requisitos no funcionales

- **Tecnología:** HTML, CSS y JavaScript nativos, sin backend ni dependencias de servicios pagos. Evitar dependencias externas necesarias para el funcionamiento.
- **Responsive:** diseño utilizable en móvil y escritorio, sin desplazamiento horizontal de la página a 320 CSS px.
- **Seguridad de representación:** tratar el contenido del CSV como dato, no como código ejecutable. No insertar sus valores mediante `innerHTML`; preservar el texto fuente literalmente y presentarlo sin ejecutar marcado incorporado.
- **Compatibilidad de publicación:** usar recursos y enlaces internos relativos para que el sitio funcione tanto en la raíz como bajo una ruta de proyecto de GitHub Pages.
- **Mantenibilidad:** separar presentación, carga/análisis de datos y selección aleatoria en módulos pequeños con responsabilidades claras.
- **Privacidad:** no guardar estados ni actividad de estudio y no enviar datos de estudio a ningún servidor.
- **Pruebas:** poder probar el parser con fixtures pequeños, incluidos casos CSV con comas, comillas escapadas, saltos de línea y campos vacíos.

## Criterios de aceptación verificables

1. El CSV original conserva exactamente el mismo contenido y la app carga el archivo del proyecto una sola vez al iniciar; reconoce sus 15.136 filas sin deduplicar por término.
2. El parser acepta un fixture con los cuatro encabezados, comas entrecomilladas, comillas escapadas y saltos de línea dentro de campos, y devuelve íntegros los valores.
3. Un encabezado faltante/inválido o un fallo de carga produce un mensaje de error identificable, no una pantalla de estudio vacía presentada como exitosa.
4. Cada fila recibe un identificador único; dos filas con el mismo término y también dos filas completamente idénticas no colisionan.
5. Al iniciar, se muestra una sola tarjeta elegida del conjunto completo. El término coincide con la fila seleccionada; revelar muestra sus valores originales de definición, abreviaturas/sinónimos y enlace sin interpretar HTML de los campos como marcado ejecutable.
6. Solicitar otra tarjeta selecciona un registro distinto al actual cuando el CSV contiene más de uno. Con un único registro, la interfaz informa que no hay otra tarjeta disponible.
7. Buscar un término único del CSV selecciona su tarjeta y la definición mostrada corresponde exactamente a esa fila.
8. Una búsqueda exacta de un término presente en varias filas muestra una sola tarjeta con el término y todas sus definiciones en el orden del CSV, sin pedir que se elija una definición ni omitir filas; la tarjeta abre las definiciones automáticamente, paginadas en grupos de hasta cuatro. Los controles permiten recorrer todas las páginas sin cambiar de tarjeta. Los valores repetidos de abreviaturas/sinónimos y las URLs de fuente repetidas aparecen una sola vez, sin alterar los registros ni las definiciones. Las coincidencias parciales múltiples y exactas por sinónimo siguen ofreciendo opciones individuales. Una búsqueda sin coincidencias informa el resultado y conserva la tarjeta actual.
9. La interfaz no muestra controles de estado de repaso ni escribe datos de estudio en almacenamiento local.
10. Buscar, elegir una coincidencia, revelar y solicitar otra tarjeta pueden operarse con teclado y tienen foco visible; la interfaz funciona a 320 CSS px sin desbordamiento horizontal de página.
11. Una búsqueda con varias coincidencias muestra un fragmento legible de su definición original en texto plano y el enlace a NIST sólo si es una URL HTTPS válida.
12. La acción «Limpiar» vacía el campo, cierra resultados y mensajes de búsqueda y devuelve el foco al campo de consulta.
13. Una publicación bajo una ruta de proyecto de GitHub Pages carga el CSV y los recursos mediante rutas relativas.
14. La prueba de rendimiento mide e informa el tiempo de carga y análisis inicial del CSV completo, sin un umbral que promueva optimizaciones anticipadas.

## Arquitectura mínima propuesta

- `index.html`: estructura semántica de la app y puntos de montaje.
- `assets/css/styles.css`: diseño responsive, estados de foco y estilos de tarjetas.
- `assets/js/csv.js`: carga única y análisis CSV, validación del encabezado e identificación única de filas.
- `assets/js/deck.js`: selección aleatoria sin repetición inmediata y búsqueda de registros.
- `assets/js/app.js`: estado de pantalla, selección de tarjeta, revelado y conexión de interfaz con los módulos.
- `data/nist_glossary.csv`: archivo fuente existente, sólo lectura.

La identificación debe derivarse del contenido original de la fila y distinguir duplicados completos mediante una huella de campos con desambiguación determinista para filas idénticas. Los identificadores son estables mientras el contenido y orden del CSV no cambien. No usar sólo `term`. Al elegir otra tarjeta, seleccionar uniformemente entre todas las filas excepto la actual; no construir un mazo ni un historial. El CSV se solicita una sola vez durante la carga inicial de la página; las selecciones posteriores usan los registros ya cargados en memoria.

## Plan de implementación

1. **Preparar estructura y HTML:** crear la estructura semántica para una sola tarjeta y sus acciones.
2. **Implementar y probar carga/parser:** cargar una vez desde ruta relativa, validar encabezados, preservar campos multilínea y asignar identificadores únicos.
3. **Implementar el flujo aleatorio:** seleccionar una tarjeta al inicio, revelar sus datos y elegir otra sin repetir la actual cuando hay más de una.
4. **Implementar búsqueda:** buscar por término o abreviatura/sinónimo, agrupar las definiciones de términos exactos duplicados y permitir elegir entre coincidencias parciales con vista previa y enlaces validados.
5. **Completar controles de búsqueda:** permitir limpiar consulta/resultados y anunciar el total de coincidencias.
6. **Completar experiencia:** diseñar en forma responsive y accesible, con mensajes para errores de carga y búsqueda sin resultados.
7. **Verificar y publicar:** ejecutar pruebas unitarias y smoke test bajo una subruta de Pages, revisar móvil a 320 CSS px y desplegar con GitHub Pages. Medir e informar la duración de la carga y análisis inicial como observación, no como umbral de optimización.

## Riesgos y mitigaciones

### CSV

- **Comas, comillas y saltos de línea:** pueden corromper las tarjetas si se usa un parser improvisado. Mitigación: parser que cumpla las reglas de CSV y fixtures que comprueben esos casos.
- **Términos o filas repetidos:** usar sólo el término como clave colisionaría; filas completamente iguales también necesitan identificadores separados. Mitigación: derivar la identidad de todos los campos y desambiguar filas idénticas.
- **Valores con HTML:** podrían producir inyección de marcado o scripts si se renderizan como HTML. Mitigación: tratar todos los campos como texto y usar APIs de texto del DOM.
- **Tamaño inicial:** el CSV ocupa aproximadamente 3,4 MB. Mitigación: medir carga y análisis en la etapa de implementación; si afecta la experiencia, proponer optimización que no edite ni transforme el original sin aprobación.
- **Licencia y atribución:** el README cita una fuente de Kaggle y el NIST, pero no especifica una licencia de redistribución. Mitigación: conservar la atribución y verificar condiciones antes de publicar o redistribuir los datos.
