# Pruebas de calidad del sistema hospitalario

Proyecto académico de Gabriel Benjamin Valdez de León, carné 7590-22-11271.
Curso Aseguramiento de Calidad de Software. Docente Carlos Fontana.
Corte de resultados: 19 de octubre de 2026.

Este repositorio contiene las pruebas automatizadas y una instantánea mínima de código necesaria para la suite rápida. La aplicación completa y sus conexiones privadas permanecen fuera del repositorio.

## Ejecución rápida

Requiere Node 24. En `qa`:

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm test
```

Ejecuta 27 pruebas TypeScript y seis controles estáticos C#. El workflow de GitHub ejecuta este mismo conjunto, sin secretos ni servicios externos. No se afirma que CI ya haya corrido antes de publicar.

## API y PostgreSQL reales

Requiere el proyecto original corregido, .NET 8, PostgreSQL accesible y permisos de crear una base QA vacía. Las pruebas escriben y eliminan fixtures únicamente en una base cuyo nombre comienza con hospital_qa_FECHA_SUFIJO. La API debe iniciarse con esa misma base. Nunca apuntar a la base operativa.

En PowerShell, desde la raíz de este repositorio:

```powershell
$env:QA_PROJECT_ROOT = 'D:/ruta/Hospital Codigo'
$env:QA_WORK_DIR = 'D:/ruta/privada/qa'
$env:QA_DB_NAME = 'hospital_qa_20261019_ayu'
$env:QA_SESSION_FILE = "$env:QA_WORK_DIR/qa-session.json"
$env:QA_JWT_KEY_FILE = "$env:QA_WORK_DIR/qa-jwt.key"
$env:QA_MAIL_DIR = "$env:QA_WORK_DIR/qa-mail"
$env:QA_EVIDENCE_DIR = 'D:/ruta/resultados-nuevos'
dotnet build "$env:QA_PROJECT_ROOT/back"
dotnet run --project qa/launcher/pg-probe.csproj -- create
dotnet run --project qa/launcher/pg-probe.csproj -- launch
```

`create` se usa una sola vez para una base nueva y falla si ya existe. `launch` comprueba la base, genera una clave exclusiva de QA, captura correos localmente e inicia la API. El arranque aplica migraciones y el seeder con datos sintéticos. Esperar a que escuche en 5279. Si dotnet no está en PATH, definir QA_DOTNET con su ruta para el proceso hijo.

En una segunda terminal, conservar las mismas variables y ejecutar desde `qa`:

```powershell
npm run test:live
npm run test:supplement
```

La suite requiere fixtures clínicos inicialmente limpios. `npm run db:reset:qa` reinicia las tablas clínicas y dependientes exclusivamente en la base QA exacta configurada para esta evaluación. Esta operación es explícita, no se ejecuta al abrir el repositorio. No reiniciar una base QA compartida sin coordinar su uso.

## Navegador real

Después de la suite API y con el frontend de producción publicado en el wwwroot local:

```powershell
$env:QA_FRONTEND_DIST = "$env:QA_PROJECT_ROOT/back/wwwroot"
$env:QA_UI_FROM_SERVER = '1'
$env:QA_CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
npm run test:ui:real
```

Para Edge, cambiar QA_CHROME a la ruta de msedge.exe. El puente HTTP transmite peticiones y respuestas reales sin respuestas API simuladas. Los ocho escenarios cubren flujos representativos y un viewport móvil, no toda la aplicación.

## Carga y cobertura

Con sesión válida: `npm run db:prepare:load`, `npm run test:load:real` y `npm run db:cleanup:load`. La preparación agrega 1000 citas y hace cinco lecturas de calentamiento. Ejecutar sin navegador, compilación o cobertura. La carga usa 100 lecturas concurrentes de cinco en cinco y umbral p95 de 2000 ms. Limpiar incluso si falla la meta.

Para instrumentar el backend, usar dotnet-coverage con `qa/coverage.settings.xml` y lanzar el backend con las mismas variables aisladas. No ejecutar el launcher dentro del recolector y suponer que instrumentará automáticamente al proceso hijo. Registrar la herramienta, el alcance y las exclusiones.

## Resultados conservados

La evaluación local registró 33/33 comprobaciones rápidas, 50/50 HTTP y SQL, y 8/8 escenarios UI en Chrome y Edge. La carga registró p95 2475.32 ms y cero errores. La cobertura backend fue 53.68 % de líneas y 42.19 % de ramas. Tiempo y cobertura no alcanzaron las metas propuestas. El catálogo completo tiene 36 casos aprobados, 24 parciales, 20 no ejecutados y dos fallidos por una misma medición de carga.

Las credenciales se leen del appsettings privado del proyecto completo. No se publican conexiones, tokens, claves, correos capturados ni datos de pacientes. Las fuentes mínimas sirven a las pruebas rápidas y no constituyen una aplicación ejecutable completa.
