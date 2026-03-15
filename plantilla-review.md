# Protocolo de Review de Código Generado por IA

## Introducción
Breve checklist fijo y reproducible para revisar PRs con código generado por IA antes de commit.

## Checklist mínimo (5 puntos)
1. Imports / librerías
   - Pregunta clave: ¿Ese import realmente existe?
   - Revisar: documentación oficial y repositorio del paquete.
   - Detectar alucinaciones de librerías o APIs inexistentes.

2. Lógica de negocio y cálculos
   - Pregunta clave: ¿las reglas se alinean con el brief?
   - Revisar: fórmulas, redondeos, casos límite, reglas de negocio especializadas.

3. Seguridad
   - Pregunta clave: ¿hay inyección SQL, validación de inputs y manejo de credenciales?
   - Revisar: sanitización, permisos, no exponer datos sensibles.

4. Pérdida de contexto del brief
   - Pregunta clave: ¿se respetaron todos los constraints y requisitos?
   - Revisar: inputs/outputs esperados, restricciones de stack, flujos definidos.

5. Punto específico del stack
   - Personalizar según entorno (por ejemplo):
     - Ejecutar tests nuevos en pipeline.
     - Confirmar que no hay logging de datos sensibles.
     - Verificar que el código respeta la arquitectura del proyecto.

## Procedimiento de revisión
- `git diff` para ver cambios exactos.
- Ejecutar suite de tests localmente.
- Revisar documentación y comentarios generados.
- Marcar cada punto con  o  y notas de acción.

## Resultado esperado
- PR aprobado solo cuando todos los puntos críticos estén resueltos o mitigados.
- Si un punto falla, agregar comentario e indicar corrección requerida.
