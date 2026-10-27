# Flashcards del glosario de ciberseguridad del NIST

Aplicación web estática para estudiar términos del glosario de ciberseguridad del National Institute of Standards and Technology (NIST). Permite explorar el glosario con tarjetas aleatorias o buscar términos y abreviaturas/sinónimos.

## Funcionalidades

- Muestra una tarjeta a la vez y permite revelar su definición y referencias.
- Selecciona otra tarjeta al azar sin repetir inmediatamente el mismo registro.
- Busca por término o abreviatura/sinónimo.
- Si una búsqueda exacta encuentra varias filas con el mismo término, las reúne en una tarjeta y muestra todas las definiciones en páginas de hasta cuatro.
- Evita repetir abreviaturas/sinónimos y enlaces de fuente iguales dentro de una tarjeta agrupada.
- Presenta los resultados como texto y enlaza las URLs de fuente del CSV cuando son HTTPS válidas.
- No requiere cuentas y no guarda datos ni progreso de estudio.

## Tecnologías

HTML, CSS y JavaScript nativos. No utiliza backend, base de datos, telemetría ni servicios pagos.

## Fuente de datos

La aplicación carga `data/nist_glossary.csv` una vez al iniciar. El CSV es la fuente acordada para el contenido; sus términos repetidos y definiciones se conservan como registros independientes. La aplicación no modifica el archivo. Los enlaces de fuente del CSV se presentan cuando son URLs HTTPS válidas.

Fuentes de referencia:

- [Glosario de ciberseguridad del NIST](https://csrc.nist.gov/glossary)
- [Conjunto de datos de NIST Terminology Glossary en Kaggle](https://www.kaggle.com/datasets/ronmallory/nist-terminology-glossary), publicado bajo la [licencia Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0).

El autor indica que el conjunto puede utilizarse con fines educativos, de investigación y para estandarizar terminología en trabajos, artículos o proyectos científicos. Esta aplicación tiene un propósito educativo. Al redistribuir el conjunto, conservá los avisos de copyright, la licencia y los avisos requeridos por Apache 2.0.

## Requisitos

- Un navegador moderno con soporte para módulos JavaScript.

## Publicar en GitHub Pages

El workflow de GitHub Actions incluido en `.github/workflows/pages.yml` ejecuta las verificaciones, prepara los archivos estáticos y publica el sitio. Se ejecuta al hacer push a `main` o `master`, o manualmente desde la pestaña **Actions**.

## Estructura del proyecto

```text
.
├── .github/
│   └── workflows/
│       └── pages.yml            # Publicación en GitHub Pages y validaciones
├── assets/
│   ├── css/
│   │   └── styles.css           # Estilos responsive y accesibilidad
│   └── js/
│       ├── app.js               # Estado e interacción de la interfaz
│       ├── csv.js               # Carga, parsing y generación de IDs
│       └── deck.js              # Búsqueda, aleatoriedad y agrupación de tarjetas
├── data/
│   └── nist_glossary.csv        # Fuente de datos del glosario
├── tests/
│   ├── csv.test.js              # Validaciones de parsing y IDs
│   ├── deck.test.js             # Búsqueda y selección sin repetición inmediata
│   ├── glossary.test.js         # Casos de términos, sinónimos y agrupación
│   └── pages-smoke.py           # Smoke test del sitio publicado
├── AGENTS.md                    # Instrucciones del repositorio para agentes
├── LICENSE                      # Licencia MIT del código
├── README.md                    # Documentación general del proyecto
├── SPEC.md                      # Requisitos y criterios de aceptación
├── index.html                   # Entrada principal de la aplicación
└── README.md                    # Documentación general del proyecto
```

## Accesibilidad y privacidad

La interfaz contempla uso con teclado, indicadores de foco, etiquetas semánticas y diseño adaptable a pantallas pequeñas. Los datos del CSV se renderizan como texto, no como HTML. La aplicación no guarda actividad de estudio ni envía consultas a un servidor.

## Licencia

El código de la aplicación está disponible bajo la [licencia MIT](./LICENSE), con copyright © 2026 Alexandra Baran.

El conjunto de datos se atribuye por separado y figura bajo [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0), según la información de su [página en Kaggle](https://www.kaggle.com/datasets/ronmallory/nist-terminology-glossary). La licencia MIT del código no reemplaza ni modifica las condiciones aplicables al CSV.
