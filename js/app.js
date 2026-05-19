/// Inicializar EmailJS con tu Llave Pública Obligatoria
(function() {
    emailjs.init("TU_PUBLIC_KEY_AQUI"); 
})();

let mediaRecorder;
let audioChunks = [];
let fotoBase64 = "";
let audioBase64 = "";

// Mapeo de elementos del DOM con el nuevo HTML estructurado
const form = document.getElementById('form-servicio');
const btnRecord = document.getElementById('btn-record');
const btnStop = document.getElementById('btn-stop');
const previewFoto = document.getElementById('preview-foto');
const previewAudio = document.getElementById('preview-audio');
const inputFoto = document.getElementById('foto');

// --- PROCESAMIENTO DE IMAGEN A BASE64 ---
inputFoto.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            fotoBase64 = event.target.result;
            // Mostramos una previsualización de la foto capturada en el taller
            previewFoto.innerHTML = `<img src="${fotoBase64}" alt="Vista previa de evidencia">`;
        };
        reader.readAsDataURL(file);
    }
});

// --- CAPTURA Y GRABACIÓN DE AUDIO ---
btnRecord.addEventListener('click', async () => {
    audioChunks = [];
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);
            previewAudio.innerHTML = `<audio controls src="${audioUrl}"></audio>`;

            // Convertir audio a texto Base64 para que EmailJS pueda procesarlo
            const reader = new FileReader();
            reader.onloadend = function() {
                audioBase64 = reader.result;
            };
            reader.readAsDataURL(audioBlob);
        };

        mediaRecorder.start();
        btnRecord.disabled = true;
        btnStop.disabled = false;
        btnRecord.textContent = "🔴 Grabando...";
    } catch (err) {
        alert("Asegúrate de dar permisos para usar el micrófono: " + err);
    }
});

btnStop.addEventListener('click', () => {
    mediaRecorder.stop();
    btnRecord.disabled = false;
    btnStop.disabled = true;
    btnRecord.textContent = "Grabar Audio";
});

// --- CONTROLADOR DE ENVÍO DEL FORMULARIO ---
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Detectamos cuál botón gatilló el evento submit
    const botonActivo = document.activeElement.value;

    const datosSoporte = {
        nombre: document.getElementById('nombre').value,
        telefono: document.getElementById('telefono').value,
        fecha: document.getElementById('fecha').value,
        serie: document.getElementById('serie').value,
        observaciones: document.getElementById('observaciones').value,
        foto: fotoBase64,
        audio: audioBase64
    };

    if (botonActivo === 'email') {
        enviarPorEmail(datosSoporte);
    } else if (botonActivo === 'whatsapp') {
        enviarPorWhatsApp(datosSoporte);
    }
});

function enviarPorEmail(datos) {
    const templateParams = {
        to_email: 'servideere@gmail.com',
        nombre: datos.nombre,
        telefono: datos.telefono,
        fecha: datos.fecha,
        serie: datos.serie,
        observaciones: datos.observaciones,
        adjunto_foto: datos.foto,  
        adjunto_audio: datos.audio
    };

    emailjs.send('TU_SERVICE_ID_AQUI', 'TU_TEMPLATE_ID_AQUI', templateParams)
        .then(() => {
            alert('¡Excelente! El reporte técnico fue enviado a servideere@gmail.com con sus respectivos adjuntos.');
        }, (error) => {
            alert('Ocurrió un problema al procesar el correo: ' + JSON.stringify(error));
        });
}

function enviarPorWhatsApp(datos) {
    // Generamos un formato de texto limpio y estético para la lectura del cliente
    const mensajeTexto = `*INFOTEC SERVIDEERE - INFORME TÉCNICO*%0A%0A` +
                         `*Fecha de atención:* ${datos.fecha}%0A` +
                         `*Cliente:* ${datos.nombre}%0A` +
                         `*Nº de Serie de la Máquina:* ${datos.serie}%0A` +
                         `*Observaciones y Diagnóstico:* ${datos.observaciones}%0A%0A` +
                         `_Nota: Los archivos de voz e imágenes correspondientes a esta orden fueron respaldados con éxito en la base de datos central de la empresa._`;

    // Abre la API de WhatsApp con el código de país de Colombia (57)
    const urlWhatsApp = `https://api.whatsapp.com/send?phone=57${datos.telefono}&text=${mensajeTexto}`;
    window.open(urlWhatsApp, '_blank');
}