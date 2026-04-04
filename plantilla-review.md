# Protocolo de Review de Codigo Generado por IA

## Introduccion
Breve checklist fijo y reproducible para revisar PRs con codigo generado por IA antes de commit.

## Checklist minimo (5 puntos)
1. Imports / librerias
   - Pregunta clave: Ese import realmente existe? eoeoe
   - Revisar: documentacion oficial y repositorio del paquete.
   - Detectar alucinaciones de librerias o APIs inexistentes.

2. Logica de negocio y calculos
   - Pregunta clave: las reglas se alinean con el brief?
   - Revisar: formulas, redondeos, casos limite, reglas de negocio especializadas.

3. Seguridad
   - Pregunta clave: hay inyeccion SQL, validacion de inputs y manejo de credenciales?
   - Revisar: sanitizacion, permisos, no exponer datos sensibles.

4. P�rdida de contexto del brief
   - Pregunta clave: se respetaron todos los constraints y requisitos?
   - Revisar: inputs/outputs esperados, restricciones de stack, flujos definidos.

5. Punto especifico del stack
   - Personalizar segun entorno (por ejemplo):
     - Ejecutar tests nuevos en pipeline.
     - Confirmar que no hay logging de datos sensibles.
     - Verificar que el codigo respeta la arquitectura del proyecto.

## Procedimiento de revision
- `git diff` para ver cambios exactos.
- Ejecutar suite de tests localmente.
- Revisar documentacion y comentarios generados.
- Marcar cada punto con  o  y notas de accion.

## Resultado esperado
- PR aprobado solo cuando todos los puntos criticos estan resueltos o mitigados.
- Si un punto falla, agregar comentario e indicar correccion requerida.
