// Inicialización de EmailJS (Asegúrate de colocar tu llave pública real)
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
            alert("No se pudo activar el micrófono. Por favor, dale PERMITIR al Micrófono.");
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
    imagenesBase64 = []; 
    
    if (e.target.files.length === 0) return;

    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
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
   3. ENVÍO DEL FORMULARIO CON FUNCIÓN OFFLINE (Soporte sin cobertura)
   ========================================================================== */
document.getElementById('form-servicio').addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Estructuramos los datos recolectados en el formulario
    const parametrosCorreo = {
        nombre: document.getElementById('nombre').value,
        telefono: document.getElementById('telefono').value,
        fecha: document.getElementById('fecha').value,
        serie: document.getElementById('serie').value,
        observaciones: document.getElementById('observaciones').value,
        imagenes: imagenesBase64.join(' | ') // Une las fotos codificadas en una cadena de texto
    };

    // Verificamos si el dispositivo cuenta con acceso a internet en el momento
    if (navigator.onLine) {
        enviarReporteEmailJS(parametrosCorreo, this);
    } else {
        // Si no hay cobertura, lo guardamos localmente en el celular
        guardarReporteOffline(parametrosCorreo);
        this.reset(); // Limpiamos el formulario para el siguiente trabajo
        previewFoto.innerHTML = "";
        previewAudio.innerHTML = "";
        imagenesBase64 = [];
    }
});

// Función interna para el envío directo a EmailJS
function enviarReporteEmailJS(datos, formularioElemento) {
    const serviceID = 'default_service';
    const templateID = 'TU_TEMPLATE_ID'; // Recuerda reemplazar por tu ID real de plantilla

    alert("Conexión detectada. Enviando reporte detallado al correo...");

    emailjs.send(serviceID, templateID, datos)
        .then(() => {
            alert('¡Reporte completo enviado al correo exitosamente!');
            if(formularioElemento) {
                formularioElemento.reset();
                previewFoto.innerHTML = "";
                previewAudio.innerHTML = "";
                imagenesBase64 = [];
            }
        }, (err) => {
            alert('Error al enviar correo: ' + JSON.stringify(err));
        });
}

// Función interna para archivar datos dentro del teléfono sin internet
function guardarReporteOffline(datos) {
    // Obtenemos el listado de reportes ya existentes o creamos un arreglo vacío si es el primero
    let reportesGuardados = JSON.parse(localStorage.getItem('reportes_offline')) || [];
    
    // Añadimos el nuevo reporte al listado local
    reportesGuardados.push(datos);
    
    // Sobrescribimos el almacenamiento local del celular con la nueva lista
    localStorage.setItem('reportes_offline', JSON.stringify(reportesGuardados));
    
    alert("⚠️ SIN COBERTURA: El reporte técnico ha sido guardado de forma segura en la memoria de la aplicación. Se enviará automáticamente por correo cuando el teléfono recupere la señal de Internet.");
}


/* ==========================================================================
   4. DETECTOR Y SINCRONIZADOR AUTOMÁTICO DE DATOS PENDIENTES
   ========================================================================== */
function sincronizarReportesPendientes() {
    let reportesGuardados = JSON.parse(localStorage.getItem('reportes_offline')) || [];
    
    if (reportesGuardados.length === 0) return; // Si no hay nada archivado, no hace nada

    alert(`🔄 ¡Señal recuperada! Sincronizando ${reportesGuardados.length} reporte(s) pendiente(s) con el correo...`);

    const serviceID = 'default_service';
    const templateID = 'TU_TEMPLATE_ID'; // Recuerda reemplazar por tu ID real de plantilla

    // Recorremos y enviamos individualmente cada reporte archivado
    reportesGuardados.forEach((reporte, index) => {
        emailjs.send(serviceID, templateID, reporte)
            .then(() => {
                console.log(`Reporte técnico offline #${index + 1} enviado exitosamente.`);
                
                // Removemos el reporte enviado exitosamente de la cola de pendientes
                reportesGuardados.splice(index, 1);
                localStorage.setItem('reportes_offline', JSON.stringify(reportesGuardados));
            })
            .catch((err) => {
                console.error("Error reenviando reporte en segundo plano:", err);
            });
    });
}

// Escuchamos el evento nativo del celular cuando detecte que volvió el internet
window.addEventListener('online', sincronizarReportesPendientes);

// También revisamos si hay reportes guardados cada vez que el técnico abre la aplicación
window.addEventListener('load', () => {
    if (navigator.onLine) {
        sincronizarReportesPendientes();
    }
});
