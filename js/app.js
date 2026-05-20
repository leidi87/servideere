// Inicialización de EmailJS (Asegúrate de colocar tu llave pública real si utilizas el servicio de correo)
emailjs.init("TU_USER_ID_DE_EMAILJS");

let mediaRecorder;
let audioChunks = [];
let audioUrl = null;
let imagenesBase64 = []; // Guardará las fotos convertidas a texto para enviarlas

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
            audioChunks = [];
            
            try {
                mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            } catch (e) {
                mediaRecorder = new MediaRecorder(stream);
            }

            mediaRecorder.start();

            btnRecord.disabled = true;
            btnStop.disabled = false;
            btnRecord.innerText = "🔴 Grabando Voz...";

            mediaRecorder.addEventListener('dataavailable', event => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            });

            mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
                audioUrl = URL.createObjectURL(audioBlob);
                
                previewAudio.innerHTML = `
                    <div style="margin-top: 10px; background: #e2e8f0; padding: 10px; border-radius: 6px;">
                        <span style="font-size: 0.75rem; font-weight: bold; display: block; margin-bottom: 4px; color: #212529;">▶ Nota de Voz Grabada:</span>
                        <audio src="${audioUrl}" controls style="width: 100%;"></audio>
                    </div>
                `;
                
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
   2. PREVISUALIZACIÓN MULTIPLE Y CONVERSIÓN DE FOTOGRAFÍAS
   ========================================================================== */
inputFoto.addEventListener('change', (e) => {
    previewFoto.innerHTML = ""; 
    imagenesBase64 = []; // Reiniciamos el contenedor de imágenes
    
    if (e.target.files.length === 0) return;

    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            // Guardamos la imagen convertida en texto plano (Base64) para EmailJS
            imagenesBase64.push(event.target.result);

            const container = document.createElement('div');
            container.style.position = 'relative';
            container.style.display = 'inline-block';
            container.style.marginRight = '5px';

            const img = document.createElement('img');
            img.src = event.target.result;
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
   3. ENVÍO DINÁMICO A WHATSAPP (Corregido para el Cliente y Alerta de Foto)
   ========================================================================== */
document.getElementById('btn-whatsapp').addEventListener('click', () => {
    const nombre = document.getElementById('nombre').value;
    const telefonoRaw = document.getElementById('telefono').value;
    const fecha = document.getElementById('fecha').value;
    const serie = document.getElementById('serie').value;
    const observaciones = document.getElementById('observaciones').value;
    const tieneFotos = inputFoto.files.length > 0;

    if (!nombre || !telefonoRaw || !serie) {
        alert("Por favor rellena los datos de Nombre, Teléfono y Serie de la máquina antes de enviar el WhatsApp.");
        return;
    }

    // Limpiamos el teléfono quitando espacios, guiones o símbolos
    const telefonoCliente = telefonoRaw.replace(/\D/g, '');

    // Estructuración del mensaje de texto adaptado para el cliente
    let textoMensaje = `*INFOTEC - SERVIDEERE*\n`;
    textoMensaje += `*Reporte Técnico de Servicio*\n\n`;
    textoMensaje += `• *Cliente:* ${nombre}\n`;
    textoMensaje += `• *Fecha:* ${fecha}\n`;
    textoMensaje += `• *Serie Máquina:* ${serie}\n\n`;
    textoMensaje += `*Observaciones:*\n${observaciones}\n\n`;
    
    if (tieneFotos) {
        textoMensaje += `📸 _Las fotos y el audio han sido cargados en la App. Recuerda adjuntar manualmente la foto del carrete en este chat para que el cliente la reciba instantáneamente._`;
    } else {
        textoMensaje += `_Nota: Reporte enviado sin evidencias adjuntas._`;
    }

    const mensajeCodificado = encodeURIComponent(textoMensaje);

    // Agregamos código de país 57 (Colombia). Si ya lo tiene escrito el usuario, evitamos duplicarlo.
    const numeroDestino = telefonoCliente.startsWith('57') ? telefonoCliente : `57${telefonoCliente}`;
    
    alert(`Redirigiendo al WhatsApp del cliente: ${nombre} (${numeroDestino})`);
    
    // Abrimos en una pestaña nueva para que el técnico no pierda los datos de la app
    const urlWhatsapp = `https://wa.me{numeroDestino}?text=${mensajeCodificado}`;
    window.open(urlWhatsapp, '_blank');
});


/* ==========================================================================
   4. ENVÍO DEL FORMULARIO COMPLETO POR EMAILJS (Incluye las fotos guardadas)
   ========================================================================== */
document.getElementById('form-servicio').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const serviceID = 'default_service';
    const templateID = 'TU_TEMPLATE_ID'; 

    alert("Enviando reporte detallado con fotos adjuntas al correo...");

    // Enviamos los datos estructurados incluyendo el array de fotos en Base64
    const parametrosCorreo = {
        nombre: document.getElementById('nombre').value,
        telefono: document.getElementById('telefono').value,
        fecha: document.getElementById('fecha').value,
        serie: document.getElementById('serie').value,
        observaciones: document.getElementById('observaciones').value,
        imagenes: imagenesBase64.join(' | ') // Pasa todas las fotos convertidas a texto
    };
    
    emailjs.send(serviceID, templateID, parametrosCorreo)
        .then(() => {
            alert('¡Reporte completo enviado al correo exitosamente con todas sus evidencias!');
        }, (err) => {
            alert('Error al procesar el envío de correo: ' + JSON.stringify(err));
        });
});
