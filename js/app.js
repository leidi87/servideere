// Inicialización de EmailJS (Asegúrate de colocar tu llave pública real si utilizas el servicio de correo)
emailjs.init("TU_USER_ID_DE_EMAILJS");

let mediaRecorder;
let audioChunks = [];
let audioUrl = null;

// Referencias a los elementos del DOM
const btnRecord = document.getElementById('btn-record');
const btnStop = document.getElementById('btn-stop');
const previewAudio = document.getElementById('preview-audio');
const inputFoto = document.getElementById('foto');
const previewFoto = document.getElementById('preview-foto');

/* ==========================================================================
   1. CONTROL DE LA GRABADORA DE VOZ (Optimizado para Android/iOS y HTTPS)
   ========================================================================== */
btnRecord.addEventListener('click', async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Tu navegador o dispositivo no soporta la grabación de audio de forma segura. Asegúrate de estar ingresando mediante una dirección HTTPS://");
        return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            // Inicialización con formatos nativos estándar para evitar bloqueos en navegadores móviles
            audioChunks = [];
            
            // Intentamos usar audio/webm (estándar en Android) o dejamos que el navegador elija su formato por defecto (esencial para iOS/Safari)
            try {
                mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            } catch (e) {
                mediaRecorder = new MediaRecorder(stream);
            }

            mediaRecorder.start();

            // Cambios visuales de los estados de los botones
            btnRecord.disabled = true;
            btnStop.disabled = false;
            btnRecord.innerText = "🔴 Grabando Voz...";

            mediaRecorder.addEventListener('dataavailable', event => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            });

            mediaRecorder.addEventListener('stop', () => {
                // Creamos el Blob con el tipo exacto generado por la grabadora
                const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
                audioUrl = URL.createObjectURL(audioBlob);
                
                // Renderizamos el reproductor para escuchar el mensaje
                previewAudio.innerHTML = `
                    <div style="margin-top: 10px; background: #e2e8f0; padding: 10px; border-radius: 6px;">
                        <span style="font-size: 0.75rem; font-weight: bold; display: block; margin-bottom: 4px; color: #212529;">▶ Nota de Voz Grabada:</span>
                        <audio src="${audioUrl}" controls style="width: 100%;"></audio>
                    </div>
                `;
                
                // IMPORTANTE: Apagar físicamente el hardware del micrófono al detener la grabación
                stream.getTracks().forEach(track => track.stop());

                btnRecord.disabled = false;
                btnStop.disabled = true;
                btnRecord.innerText = "Grabar Audio";
            });

        }).catch(err => {
            console.error("Error capturando el micrófono:", err);
            alert("No se pudo activar el micrófono. Por favor, haz clic en el icono del candado (🔒) en la barra de direcciones y dale PERMITIR al Micrófono.");
        });
});

btnStop.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
});


/* ==========================================================================
   2. PREVISUALIZACIÓN MULTIPLE DE FOTOGRAFÍAS
   ========================================================================== */
inputFoto.addEventListener('change', (e) => {
    previewFoto.innerHTML = ""; // Limpiamos previsualizaciones anteriores
    
    if (e.target.files.length === 0) return;

    // Recorremos cada uno de los archivos seleccionados/capturados
    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const container = document.createElement('div');
            container.style.position = 'relative';
            container.style.display = 'inline-block';

            const img = document.createElement('img');
            img.src = event.target.result;
            // Estilos rápidos para encajar en el grid visual
            img.style.width = "75px";
            img.style.height = "75px";
            img.style.objectFit = "cover";
            img.style.borderRadius = "6px";
            img.style.border = "1px solid #cbd5e1";

            container.appendChild(img);
            previewFoto.appendChild(container);
        }
        
        reader.readAsDataURL(file);
    });
});


/* ==========================================================================
   3. ENVÍO DIRECTO A WHATSAPP (Evita bloqueadores de ventanas emergentes)
   ========================================================================== */
document.getElementById('btn-whatsapp').addEventListener('click', () => {
    const nombre = document.getElementById('nombre').value;
    const telefono = document.getElementById('telefono').value;
    const fecha = document.getElementById('fecha').value;
    const serie = document.getElementById('serie').value;
    const observaciones = document.getElementById('observaciones').value;

    if (!nombre || !telefono || !serie) {
        alert("Por favor rellena los datos de Nombre, Teléfono y Serie de la máquina antes de proceder.");
        return;
    }

    // Estructuración del mensaje de texto adaptado para el taller
    let textoMensaje = `*INFOTEC - SERVIDEERE*\n`;
    textoMensaje += `*Reporte Técnico de Servicio*\n\n`;
    textoMensaje += `• *Cliente:* ${nombre}\n`;
    textoMensaje += `• *Teléfono:* ${telefono}\n`;
    textoMensaje += `• *Fecha:* ${fecha}\n`;
    textoMensaje += `• *Serie Máquina:* ${serie}\n\n`;
    textoMensaje += `*Observaciones:*\n${observaciones}\n\n`;
    textoMensaje += `_Nota: Las evidencias de fotos y notas de voz se encuentran adjuntas localmente en el dispositivo._`;

    // Codificación segura para saltos de línea, tildes y espacios
    const mensajeCodificado = encodeURIComponent(textoMensaje);

    // Canal de destino oficial (Administración)
    const numAdmin = "573176677848"; 
    
    alert("Abriendo WhatsApp. Recuerda enviar el reporte al administrador y posteriormente podrás reenviar la misma plantilla al cliente desde tu chat.");
    
    // Redirección directa sobre la pestaña nativa para evitar bloqueos del sistema móvil
    window.location.href = `https://api.whatsapp.com/send?phone=${numAdmin}&text=${mensajeCodificado}`;
});


/* ==========================================================================
   4. ENVÍO DEL FORMULARIO COMPLETO POR EMAILJS (Copia de seguridad)
   ========================================================================== */
document.getElementById('form-servicio').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const serviceID = 'default_service';
    const templateID = 'TU_TEMPLATE_ID'; // Reemplazar con el ID de tu plantilla en el Dashboard de EmailJS

    alert("Enviando copia de respaldo al correo servideere@gmail.com...");
    
    emailjs.sendForm(serviceID, templateID, this)
        .then(() => {
            alert('¡Copia de respaldo enviada al correo exitosamente!');
        }, (err) => {
            alert('Error al procesar el envío de correo: ' + JSON.stringify(err));
        });
});
