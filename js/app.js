/**
 * INFOTEC - SERVIDEERE
 * app.js
 * Compatible con GitHub Pages + móviles + PWA
 */

/* =========================================================
   CONFIGURACIÓN EMAILJS
========================================================= */

const EMAILJS_PUBLIC_KEY = 'usISzyXbJH6rmsfGw';
const EMAILJS_SERVICE_ID = 'service_ca8hppv';
const EMAILJS_TEMPLATE_ID = 'template_n7qw2gn';

/* =========================================================
   VARIABLES GLOBALES
========================================================= */

let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;

/* =========================================================
   INICIAR APP
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    /* =====================================================
       VALIDAR EMAILJS
    ===================================================== */

    if (typeof emailjs !== 'undefined') {

        emailjs.init(EMAILJS_PUBLIC_KEY);

    } else {

        console.error('EmailJS no cargó correctamente.');
    }

    /* =====================================================
       ELEMENTOS DOM
    ===================================================== */

    const form = document.getElementById('form-servicio');

    const btnWhatsapp = document.getElementById('btn-whatsapp');
    const btnEmail = document.getElementById('btn-email');

    const inputFoto = document.getElementById('foto');
    const previewFoto = document.getElementById('preview-foto');

    const btnRecord = document.getElementById('btn-record');
    const btnStop = document.getElementById('btn-stop');

    const previewAudio = document.getElementById('preview-audio');

    /* =====================================================
       VALIDAR ELEMENTOS
    ===================================================== */

    if (
        !form ||
        !btnWhatsapp ||
        !btnEmail ||
        !inputFoto ||
        !previewFoto ||
        !btnRecord ||
        !btnStop ||
        !previewAudio
    ) {

        console.error('Faltan elementos HTML.');

        return;
    }

    /* =====================================================
       PREVISUALIZACIÓN DE FOTOS
    ===================================================== */

    inputFoto.addEventListener('change', (event) => {

        previewFoto.innerHTML = '';

        const files = event.target.files;

        if (!files || files.length === 0) {

            return;
        }

        Array.from(files).forEach(file => {

            if (!file.type.startsWith('image/')) {

                return;
            }

            const reader = new FileReader();

            reader.onload = (e) => {

                const img = document.createElement('img');

                img.src = e.target.result;

                img.style.width = '100%';
                img.style.maxWidth = '250px';
                img.style.borderRadius = '10px';
                img.style.marginTop = '10px';
                img.style.display = 'block';
                img.loading = 'lazy';

                previewFoto.appendChild(img);
            };

            reader.readAsDataURL(file);

        });

    });

    /* =====================================================
       GRABACIÓN DE AUDIO
    ===================================================== */

    btnRecord.addEventListener('click', async () => {

        try {

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {

                alert('El navegador no soporta grabación de audio.');

                return;
            }

            audioChunks = [];

            previewAudio.innerHTML =
                '<p style="color:red;font-weight:bold;">🔴 Grabando audio...</p>';

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {

                if (event.data.size > 0) {

                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {

                audioBlob = new Blob(audioChunks, {
                    type: 'audio/webm'
                });

                const audioURL =
                    URL.createObjectURL(audioBlob);

                previewAudio.innerHTML = '';

                const audio =
                    document.createElement('audio');

                audio.controls = true;
                audio.src = audioURL;

                audio.style.width = '100%';
                audio.style.marginTop = '10px';

                previewAudio.appendChild(audio);

                stream.getTracks().forEach(track => {

                    track.stop();
                });

            };

            mediaRecorder.start();

            btnRecord.disabled = true;
            btnStop.disabled = false;

        } catch (error) {

            console.error('Error micrófono:', error);

            previewAudio.innerHTML =
                '<p style="color:orange;">⚠️ Micrófono no permitido o no compatible.</p>';
        }

    });

    /* =====================================================
       DETENER AUDIO
    ===================================================== */

    btnStop.addEventListener('click', () => {

        if (
            mediaRecorder &&
            mediaRecorder.state !== 'inactive'
        ) {

            mediaRecorder.stop();

            btnRecord.disabled = false;
            btnStop.disabled = true;
        }

    });

    /* =====================================================
       ENVIAR WHATSAPP
    ===================================================== */

    btnWhatsapp.addEventListener('click', () => {

        const nombre =
            document.getElementById('nombre').value.trim();

        const telefono =
            document.getElementById('telefono').value.trim();

        const fecha =
            document.getElementById('fecha').value;

        const serie =
            document.getElementById('serie').value.trim();

        const observaciones =
            document.getElementById('observaciones').value.trim();

        /* VALIDACIÓN */

        if (
            !nombre ||
            !telefono ||
            !fecha ||
            !serie ||
            !observaciones
        ) {

            alert('Por favor completa todos los campos.');

            return;
        }

        /* LIMPIAR TELÉFONO */

        let telefonoLimpio =
            telefono.replace(/\D/g, '');

        /* AGREGAR PREFIJO COLOMBIA */

        if (!telefonoLimpio.startsWith('57')) {

            telefonoLimpio = `57${telefonoLimpio}`;
        }

        /* MENSAJE */

        const mensaje =

`*INFOTEC - SERVIDEERE*
*Registro Técnico*

👤 Cliente: ${nombre}
📞 Teléfono: ${telefonoLimpio}
📅 Fecha: ${fecha}
🔧 Serie: ${serie}

📝 Observaciones:
${observaciones}

📸 Evidencias multimedia registradas correctamente.
`;

        /* URL WHATSAPP */

        const urlWhatsapp =
            `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;

        window.open(
            urlWhatsapp,
            '_blank',
            'noopener,noreferrer'
        );

    });

    /* =====================================================
       ENVÍO EMAILJS
    ===================================================== */

    form.addEventListener('submit', async (event) => {

        event.preventDefault();

        btnEmail.disabled = true;

        btnEmail.textContent = 'Enviando...';

        try {

            const templateParams = {

                nombre:
                    document.getElementById('nombre').value.trim(),

                telefono:
                    document.getElementById('telefono').value.trim(),

                fecha:
                    document.getElementById('fecha').value,

                serie:
                    document.getElementById('serie').value.trim(),

                observaciones:
                    document.getElementById('observaciones').value.trim()
            };

            /* ENVIAR EMAIL — ✅ Se agrega EMAILJS_PUBLIC_KEY como 4to parámetro */

            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams,
                EMAILJS_PUBLIC_KEY  // ✅ CORRECCIÓN: public key explícita en cada envío
            );

            alert('✅ Reporte enviado correctamente.');

            /* LIMPIAR FORMULARIO */

            form.reset();

            previewFoto.innerHTML = '';
            previewAudio.innerHTML = '';

            audioBlob = null;

            btnRecord.disabled = false;
            btnStop.disabled = true;

        } catch (error) {

            console.error('Error EmailJS:', error);

            alert(
                '❌ Error enviando correo. Verifica EmailJS.'
            );

        } finally {

            btnEmail.disabled = false;

            btnEmail.textContent =
                'Guardar y Enviar al Correo';
        }

    });

});
