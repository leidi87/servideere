/**
 * INFOTEC - SERVIDEERE
 * Archivo principal de lógica (app.js)
 * Totalmente adaptado para GitHub Pages y uso offline básico.
 */


// === CONFIGURACIÓN DE CREDENCIALES EMAILJS ===
const EMAILJS_SERVICE_ID = 'service_gmail'; // Cambia por tu Service ID si no usas el por defecto
const EMAILJS_TEMPLATE_ID = 'template_suegftj'; // Tomado de tu captura de pantalla


// Variables globales para la grabación de audio
let mediaRecorder;
let audioChunks = [];
let audioBlob = null;


document.addEventListener('DOMContentLoaded', () => {
    
    // === ELEMENTOS DEL DOM ===
    const form = document.getElementById('form-servicio');
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    const btnEmail = document.getElementById('btn-email');
    
    const inputFoto = document.getElementById('foto');
    const previewFoto = document.getElementById('preview-foto');
    
    const btnRecord = document.getElementById('btn-record');
    const btnStop = document.getElementById('btn-stop');
    const previewAudio = document.getElementById('preview-audio');


    // === 1. MANEJO DE EVIDENCIA: FOTOGRAFÍA ===
    inputFoto.addEventListener('change', (e) => {
        previewFoto.innerHTML = ''; // Limpiar previsualización anterior
        const file = e.target.files[0];
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.style.maxWidth = '100%';
                img.style.borderRadius = '8px';
                img.style.marginTop = '10px';
                previewFoto.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });


    // === 2. MANEJO DE EVIDENCIA: NOTA DE VOZ ===
    btnRecord.addEventListener('click', async () => {
        audioChunks = [];
        previewAudio.innerHTML = '<p style="color: #e11d48; font-weight: bold;">🔴 Grabando audio...</p>';
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunks.push(e.data);
                }
            };


            mediaRecorder.onstop = () => {
                audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Crear reproductor de audio nativo en el preview
                previewAudio.innerHTML = '';
                const audioEl = document.createElement('audio');
                audioEl.src = audioUrl;
                audioEl.controls = true;
                audioEl.style.marginTop = '10px';
                audioEl.style.width = '100%';
                previewAudio.appendChild(audioEl);
                
                // Detener todos los tracks del micrófono para liberar el hardware
                stream.getTracks().forEach(track => track.stop());
            };


            mediaRecorder.start();
            btnRecord.disabled = true;
            btnStop.disabled = false;
            
        } catch (err) {
            console.error('Error al acceder al micrófono:', err);
            previewAudio.innerHTML = '<p style="color: #84cc16;">⚠️ Permiso de micrófono denegado o no soportado.</p>';
        }
    });


    btnStop.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            btnRecord.disabled = false;
            btnStop.disabled = true;
        }
    });


    // === 3. ENVÍO DINÁMICO A WHATSAPP ===
    btnWhatsapp.addEventListener('click', () => {
        const nombre = document.getElementById('nombre').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const fecha = document.getElementById('fecha').value;
        const serie = document.getElementById('serie').value.trim();
        const observaciones = document.getElementById('observaciones').value.trim();


        // Validación estricta antes de redireccionar
        if (!nombre || !telefono || !fecha || !serie || !observaciones) {
            alert('Por favor, complete todos los campos requeridos en el formulario antes de generar el reporte de WhatsApp.');
            return;
        }


        // Limpieza del número telefónico (Deja solo dígitos)
        const telefonoLimpio = telefono.replace(/\D/g, '');
        // Valida e inserta el código de país Colombia (57) si no existe
        const numeroDestino = telefonoLimpio.startsWith('57') ? telefonoLimpio : `57${telefonoLimpio}`;


        // Estructura del Mensaje con formato profesional
        const mensaje = `*INFOTEC - SERVIDEERE*\n` +
                        `*Registro de Control Técnico*\n\n` +
                        `• *Cliente:* ${nombre}\n` +
                        `• *Teléfono:* ${telefonoLimpio}\n` +
                        `• *Fecha:* ${fecha}\n` +
                        `• *Serie Máquina:* ${serie}\n\n` +
                        `*Observaciones:* \n${observaciones}\n\n` +
                        `📸 _Nota: Las evidencias multimedia fueron capturadas y se procesarán en el reporte central de EmailJS._`;


        const urlWhatsapp = `https://wa.me/${numeroDestino}?text=${encodeURIComponent(mensaje)}`;
        
        // Abrir de forma segura en GitHub Pages sin perder el hilo de la app
        window.open(urlWhatsapp, '_blank', 'noopener,noreferrer');
    });


    // === 4. ENVÍO EN TIEMPO REAL A EMAILJS ===
    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Evita comportamiento de recarga clásico


        // Cambiar estado visual del botón de envío
        btnEmail.textContent = 'Guardando y Enviando...';
        btnEmail.disabled = true;


        // Construcción de parámetros mapeando exactamente las llaves de tu plantilla en EmailJS
        const templateParams = {
            nombre: document.getElementById('nombre').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            fecha: document.getElementById('fecha').value,
            serie: document.getElementById('serie').value.trim(),
            observaciones: document.getElementById('observaciones').value.trim()
        };


        // Disparo de correo vía SDK de EmailJS
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
            .then((response) => {
                alert('¡Perfecto! El reporte técnico ha sido guardado y enviado por correo de manera exitosa.');
                
                // Reset de controles y limpieza de formularios
                form.reset();
                previewFoto.innerHTML = '';
                previewAudio.innerHTML = '';
                audioBlob = null;
                
                btnEmail.textContent = 'Guardar y Enviar Correo';
                btnEmail.disabled = false;
            }, (error) => {
                console.error('Error crítico EmailJS:', error);
                alert('Hubo un error al sincronizar con EmailJS. Por favor verifica tu conexión a internet o los identificadores del servicio.')
                
                btnEmail.textContent = 'Guardar y Enviar Correo';
                btnEmail.disabled = false;
            });
    });
});
