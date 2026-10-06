# Respuestas con RAG y memoria limitada

La integración usa la base de conocimiento existente y la configuración del panel.
No agrega servicios de embeddings, bases de datos externas ni dependencias nuevas.
Los artículos, protocolos, contactos, reglas de derivación y respuestas oficiales
existentes se conservaron sin cambios. La conexión de WhatsApp sigue siendo por QR.

## Recorrido de un mensaje

1. El servidor registra el mensaje del cliente y extrae declaraciones explícitas
   sobre equipo, producto de interés, uso e instalación.
2. El clasificador y el enrutador actuales deciden la intención y el área. Las
   respuestas fijas y derivaciones existentes tienen prioridad y no consultan IA.
3. Para las demás consultas, el recuperador busca la cantidad configurada de fragmentos relevantes
   entre los artículos existentes. Usa coincidencia de palabras, normalización del
   español y un índice local reutilizable; no usa búsqueda vectorial.
4. Se entrega a la IA el mensaje actual, un historial acotado, la memoria de ese
   cliente y los fragmentos seleccionados. Las reglas del servidor van separadas.
5. La IA devuelve un objeto estructurado. El servidor verifica su formato, sus
   fuentes y cada extracto. En modo conversacional revisa además la reformulación
   mediante una segunda consulta independiente al proveedor.
6. Si falta evidencia, falla el proveedor, se supera un límite o la validación
   rechaza el resultado, se conserva la respuesta existente o se pide aclaración.
   Una conversación pausada o cerrada no recibe la respuesta pendiente.

## Alcance de las respuestas de IA

OpenAI usa Responses API con un esquema JSON estricto y `store: false`. NVIDIA
conserva su conexión compatible y pasa por la misma validación local. Se usa la
clave y el modelo configurados en el panel; no se reemplazaron esos valores.

El panel permite elegir extractos literales o una respuesta conversacional. El
modo conversacional es el predeterminado y permite reformular el contenido con
tono cercano, neutral o formal y pautas editables. Cada reformulación debe citar
internamente extractos literales válidos. Los contactos, cifras y acciones pasan
por validación local; una segunda consulta contrasta el texto con la evidencia.
Sólo se entrega la reformulación si esta revisión responde que está respaldada.
Si falla o no alcanza la cuota, se usa la respuesta existente.

La revisión también usa IA, por lo que reduce errores sin garantizar veracidad
perfecta. El formato JSON estricto por sí solo no verifica el contenido. El modo
literal ofrece una comprobación directa de los hechos expresados en cada extracto.
Las respuestas oficiales y las derivaciones anteriores mantienen su recorrido
determinista: la reformulación nueva aplica a las respuestas basadas en RAG.

Se rechazan fuentes inexistentes, texto que no aparece en la fuente, contactos
no autorizados, instrucciones internas detectadas y confirmaciones de acciones
que no realizó el servidor. Las afirmaciones comerciales detectadas sobre precios
o stock requieren una fecha futura en `commercialValidUntil` del artículo. Las
respuestas oficiales anteriores mantienen su funcionamiento y no pasan por este
validador nuevo.

Los artículos anteriores sin metadatos de aprobación siguen disponibles como
conocimiento administrado. Los nuevos metadatos opcionales permiten excluir
`approved: false`, estados `draft`, `rejected` o `archived`, contenido con
`visibility: internal`, artículos de otro `clientId`/`customerId` y fechas fuera
de `validFrom`, `validUntil` o `expiresAt`. El editor de cada documento incorpora
estado, visibilidad, vigencia, vigencia comercial y asociación opcional a un cliente.
Las fechas del editor corresponden al día completo de Argentina.

## Memoria del cliente

La memoria nueva está en `customer-memory.json`, dentro de `BOT_DATA_DIR` o, por
defecto, `server`. Se guarda cada cinco segundos y al cerrar normalmente. No
reemplaza los archivos de clientes, el historial ni las notas del CRM existentes.
Estos últimos no se incorporan automáticamente como hechos confirmados al contexto
de IA. Los resúmenes comerciales del CRM siguen siendo información para el operador.

Cada dato declarado registra valor, evidencia, mensaje de origen, confirmación y
vencimiento. Los campos permitidos son `equipo`, `producto_interes`, `uso` y
`requiere_instalacion`. No se aceptan precios, contraseñas, permisos ni instrucciones
como hechos de memoria. Una propuesta del modelo debe coincidir exactamente con
una declaración reconocida del mensaje actual para guardarse.

En Memoria & RAG se pueden editar los cuatro campos y el resumen por cliente.
Las ediciones manuales registran origen de operador y una nueva confirmación.
Sólo se renueva el vencimiento de los campos realmente modificados. Si hubo un
mensaje nuevo mientras se editaba, el servidor rechaza el guardado desactualizado
para evitar sobrescribir esa información. Vaciar un campo lo elimina al guardar.
La cuota diaria se conserva incluso si se elimina o desplaza la memoria de un cliente.

Ejemplo: «Tengo un Starlink Mini y me interesa el AITUE Pro para mi camioneta»
guarda equipo, producto y uso. «Ya no tengo un Starlink Mini» elimina ese equipo
si coincide con el guardado. «No necesito instalación» registra la corrección.
Las frases ambiguas o contradictorias no agregan un hecho nuevo. El reconocimiento
es conservador y no cubre todas las formas posibles de expresar una preferencia.

La memoria se separa por identificador de conversación. El QR de WhatsApp usa el
chat del cliente; la web usa su sesión autenticada. No se mezclan automáticamente
identidades entre ambos canales. El vencimiento predeterminado es de 30 días y se
puede editar. El plazo nuevo se aplica a nuevas confirmaciones; los datos ya guardados
mantienen su fecha. Sólo confirmar o editar ese dato renueva su vencimiento.

El resumen de contexto contiene citas breves de los últimos tres mensajes del
cliente. Se trata como una declaración del cliente, no como información oficial
del negocio. El resumen enmascara patrones habituales de claves y contactos.

## Límites predeterminados de la nueva respuesta con RAG

Estos valores se editan en Memoria & RAG, dentro de rangos validados. El archivo
`assistant-settings.json` conserva estilo, límites y estado de memoria separados
de la configuración y los documentos anteriores. Guardar aplica los ajustes a
consultas nuevas sin reconectar WhatsApp. Desactivar la memoria conserva los datos
guardados pero no extrae hechos nuevos ni los envía como contexto a la IA.

| Recurso | Límite |
| --- | --- |
| Historial enviado | Hasta 8 mensajes y 4000 caracteres |
| Fragmentos recuperados | Hasta 4 y 6000 caracteres en total |
| Campos de memoria | 4 campos permitidos |
| Resumen declarado | Hasta 800 caracteres |
| Vencimiento de memoria | 30 días desde cada confirmación |
| Clientes en la memoria nueva | Hasta 1000; se elimina el más antiguo al incorporar otro |
| Solicitud al proveedor | Hasta 32768 bytes, incluyendo instrucciones y esquema |
| Salida del proveedor | El menor entre el límite del panel y 600 tokens |
| Respuesta validada de IA | Hasta 120 palabras |
| Tiempo de espera | 8 segundos |
| Solicitudes al proveedor por cliente | 60 por día |
| Solicitudes al proveedor totales | 1000 por día |

Las cuotas se guardan y se renuevan según el día de Argentina. Las solicitudes
fallidas al proveedor también cuentan. No se consume cuota si se utiliza una
respuesta fija, no hay clave o no se encuentran fuentes. Estos topes no equivalen
a un presupuesto monetario. Audio, visión, pruebas de conexión y resúmenes del CRM
conservan sus recorridos anteriores y no usan esta cuota de respuestas con RAG.
Generar y verificar una reformulación puede consumir dos solicitudes. La revisión
comparte el tiempo de espera de la consulta; no duplica la espera máxima.

Los límites de entrada se miden en bytes y caracteres, no en tokens exactos.
Si falta espacio se retira primero historial antiguo y luego fuentes de menor
relevancia. Nunca se recortan silenciosamente las reglas guardadas: si todavía
no cabe la solicitud se utiliza la respuesta existente.

## Revisión desde el panel

En Live Chat, abrí una conversación y desplegá **Memoria de esta conversación**.
Podés ver los datos y sus vencimientos, junto con las fuentes de la última consulta
de IA. Esta vista es sólo de lectura y requiere acceso administrativo. El cliente
web recibe sus mensajes; no recibe la memoria ni los datos internos de revisión.

En **Memoria & RAG** se editan estilo, límites, datos por cliente y metadatos de
documentos. **Probar una conversación** usa la API configurada y opcionalmente la
memoria del cliente seleccionado. No escribe hechos nuevos en esa memoria ni envía
mensajes de WhatsApp, pero cuenta sus solicitudes en la cuota. El botón usa una
identidad de prueba del administrador, separada de la cuota del cliente seleccionado.

Las rutas administrativas de diagnóstico son `GET /api/assistant/limits` y
`GET /api/chats/:id/memory`. Cada revisión de IA registra estado, fuentes, versión
del corpus y fecha. El registro se refiere a la última consulta de IA; una respuesta
fija posterior no significa que haya vuelto a consultar esas fuentes.

## Cargar y comprobar la actualización

Si el programa ya estaba abierto, cerrá su ventana de ejecución y volvé a abrir
`Iniciar Bot.cmd`. Reiniciar sólo la conexión de WhatsApp desde el panel no recarga
el código de Node. La clave de IA se administra en la configuración del panel.

Las pruebas locales usan datos temporales, un proveedor simulado y conexiones
falsas. Verifican preservación de respuestas, aislamiento, persistencia, vencimiento,
cuotas, validación de fuentes, pausas y arranque. No envían mensajes reales ni
realizan solicitudes pagas. La respuesta real del modelo y la sesión QR deben
comprobarse después de reiniciar el programa con su configuración habitual.

La separación entre formato y veracidad sigue la documentación oficial de
[Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).
El control de contexto toma como referencia la documentación de
[estado de conversación](https://developers.openai.com/api/docs/guides/conversation-state).
