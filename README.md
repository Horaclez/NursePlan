# Q-PLAN — Planes de Mejora Continua en Salud (Android APK + Windows EXE + Web)

Aplicación multiplataforma para diseñar, colaborar en tiempo real y auditar **Planes de Mejora Continua en Salud** bajo metodología de 8 etapas con trazabilidad horizontal y vertical.

## Cómo generar automáticamente el APK de Android y el Instalador de Windows (.exe) en GitHub

1. Crea un repositorio nuevo en GitHub (por ejemplo `q-plan`).
2. Sube **todos los archivos y carpetas** de este ZIP al repositorio (asegúrate de incluir la carpeta oculta `.github/workflows/build-native.yml`).
3. Ve a la pestaña **Actions** en tu repositorio de GitHub:
   - Se ejecutará automáticamente el flujo **Compilar Q-PLAN (Android APK + Instalador Windows EXE)**.
   - En ~3 minutos tendrás listos para descargar en la sección **Artifacts**:
     - `Q-PLAN-Android-APK` (archivo `.apk` listo para instalar en Android)
     - `Q-PLAN-Windows-Installer` (instalador `.exe` para Windows x64)
