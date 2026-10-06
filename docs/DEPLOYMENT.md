# Inicio y vinculación de WhatsApp

El bot usa una sesión de WhatsApp vinculada por QR. No necesita acceso a Meta,
un token de Cloud API ni un webhook público para esta conexión.

## Uso local en Windows

1. Abrí `Iniciar Bot.cmd` con doble clic y dejá la ventana abierta.
2. Entrá a http://localhost:3000/admin.
3. Ingresá con el usuario de `ADMIN_EMAIL` y la contraseña de `ADMIN_PASSWORD`
   del archivo `.env`. El usuario inicial es `admin@aitue.net`.
4. En **Bot WhatsApp & QR**, esperá el código. Una sesión guardada válida se
   reutiliza automáticamente. Si hace falta volver a vincular, usá **Generar nuevo QR**.
5. En el teléfono, abrí WhatsApp → Dispositivos vinculados → Vincular un dispositivo
   y escaneá el código del panel.

La contraseña inicial se generó en `.env`. Podés cambiarla y reiniciar el bot.
Guardá ese archivo y los datos de sesión de forma privada.

La conexión reintenta automáticamente ante cortes temporales. Si WhatsApp cierra
la sesión o reemplaza la conexión, el panel solicita una nueva vinculación; no
borra credenciales por un corte de red. Reiniciar conserva la sesión guardada.
Desconectar cierra la sesión y no vuelve a conectar automáticamente.

La pausa general conserva los mensajes entrantes y detiene las respuestas
automáticas de WhatsApp. También existen pausas por conversación para atención humana.

## Comandos de inicio

Con Node.js y las dependencias ya instaladas:

```sh
npm run build
npm start
```

Este arranque sirve el sitio y la API en el puerto 3000, y el servicio interno en
el 3001. Para desarrollo, usá `npm run server` y `npm run dev` en dos terminales,
con `SERVE_FRONTEND=false` en `.env`.

## Configuración y datos

Los controles administrativos requieren iniciar sesión. Las claves de IA se
guardan en el servidor y no se devuelven al navegador. Dejar una clave vacía al
editar la configuración conserva la clave existente.

Los datos se guardan en `BOT_DATA_DIR` o, por defecto, en `server`. Incluyen
clientes, operadores, citas, conocimiento, configuración y pausas. Chats,
registros y contexto se guardan cada cinco segundos y al cerrar normalmente.
El historial visible se limita a 1000 conversaciones, 200 mensajes por conversación
y 1000 registros. Al alcanzar el límite se elimina del historial una conversación
antigua sin pausa; su ficha de cliente permanece en el CRM.

Las citas usan horario de Argentina y validan disponibilidad y superposición.
Los recordatorios pendientes reintentan al recuperar la conexión mientras todavía
no haya empezado la cita. El formulario de contacto guarda la consulta en el CRM;
no envía correos. Las respuestas de IA y el análisis de audio o imágenes requieren
las claves correspondientes. Sin clave de IA se usan las respuestas por reglas.

Las excepciones de números siempre pausados o activos están en
`server/always-paused-phones.js`. Operativa y Envíos conservan su atención por correo.

## Docker

Copiá `.env.example` a `.env` en una instalación nueva y completá la contraseña
administrativa, el secreto de sesión y las claves que uses. No reemplaces el archivo
de una instalación existente.

```sh
docker compose up -d --build
```

El sitio queda en el puerto 3000. Los volúmenes `bot-data` y `whatsapp-auth`
conservan los datos y la sesión. Preservalos durante las actualizaciones. Para
trasladar una instalación, transferí esos datos de forma privada antes del arranque.

Con un proxy HTTPS, configurá `COOKIE_SECURE=true`. Si el proxy cambia el host,
configurá el origen público en `ALLOWED_ORIGINS`. El puerto 3001 es interno.
`/api/health` comprueba el servicio; el estado de WhatsApp se consulta en el panel.

## Verificación

`npm test` comprueba clasificación, colas, reconexión, pausas, agenda, autenticación
y arranque del panel con datos de prueba. No conecta una cuenta ni envía mensajes
reales. `npm run build` prepara el sitio. La vinculación real requiere escanear el QR.
