/**
 * INFOTEC - SERVIDEERE
 * app.js
 * Compatible con GitHub Pages + móviles + PWA
 * Cloudinary: múltiples fotos y audios
 */

/* =========================================================
   CONFIGURACIÓN EMAILJS
========================================================= */

const EMAILJS_PUBLIC_KEY  = 'usISzyXbJH6rmsfGw';
const EMAILJS_SERVICE_ID  = 'service_ca8hppv';
const EMAILJS_TEMPLATE_ID = 'template_n7qw2gn';

/* =========================================================
   CONFIGURACIÓN CLOUDINARY
========================================================= */

const CLOUDINARY_CLOUD_NAME    = 'diacmwhor';
const CLOUDINARY_UPLOAD_PRESET = 'servideere_preset';

/* =========================================================
   VARIABLES GLOBALES
========================================================= */

let mediaRecorder  = null;
let audioChunks    = [];
let grabaciones    = [];
let grabacionIndex = 0;

/* =========================================================
   SUBIR ARCHIVO A CLOUDINARY
========================================================= */

async function subirACloudinary(blob, nombreArchivo, tipo) {

    const formData = new FormData();
    formData.append('file', blob, nombreArchivo);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${tipo}/upload`;

    const response = await fetch(url, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error(`Cloudinary error: ${response.status}`);
    }

    const data = await response.json();
    return data.secure_url;
}

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

    const form         = document.getElementById('form-servicio');
    const btnWhatsapp  = document.getElementById('btn-whatsapp');
    const btnEmail     = document.getElementById('btn-email');
    const inputFoto    = document.getElementById('foto');
    const previewFoto  = document.getElementById('preview-foto');
    const btnRecord    = document.getElementById('btn-record');
    const btnStop      = document.getElementById('btn-stop');
    const previewAudio = document.getElementById('preview-audio');

    /* =====================================================
       VALIDAR ELEMENTOS
    ===================================================== */

    if (!form || !btnWhatsapp || !btnEmail || !inputFoto ||
        !previewFoto || !btnRecord || !btnStop || !previewAudio) {

        console.error('Faltan elementos HTML.');
        return;
    }

    /* =====================================================
       PREVISUALIZACIÓN DE FOTOS (múltiples)
    ===================================================== */

    inputFoto.addEventListener('change', (event) => {

        const files = event.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {

            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();

            reader.onload = (e) => {

                const wrapper = document.createElement('div');
                wrapper.style.cssText =
                    'display:inline-block;margin:6px;position:relative;';

                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.cssText =
                    'width:100%;max-width:200px;border-radius:10px;display:block;';
                img.loading = 'lazy';

                const btnEliminar = document.createElement('button');
                btnEliminar.textContent = '✕';
                btnEliminar.type = 'button';
                btnEliminar.style.cssText =
                    'position:absolute;top:4px;right:4px;background:red;color:white;' +
                    'border:none;border-radius:50%;width:22px;height:22px;' +
                    'cursor:pointer;font-size:12px;line-height:22px;text-align:center;';

                btnEliminar.addEventListener('click', () => wrapper.remove());

                wrapper.appendChild(img);
                wrapper.appendChild(btnEliminar);
                previewFoto.appendChild(wrapper);
            };

            reader.readAsDataURL(file);
        });

        inputFoto.value = '';
    });

    /* =====================================================
       GRABACIÓN DE AUDIO (múltiples)
    ===================================================== */

    btnRecord.addEventListener('click', async () => {

        try {

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('El navegador no soporta grabación de audio.');
                return;
            }

            audioChunks = [];
            grabacionIndex++;

            const indicador = document.createElement('p');
            indicador.id = `grabando-${grabacionIndex}`;
            indicador.style.cssText = 'color:red;font-weight:bold;margin:4px 0;';
            indicador.textContent = `🔴 Grabando audio #${grabacionIndex}...`;
            previewAudio.appendChild(indicador);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {

                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                const url  = URL.createObjectURL(blob);
                const idx  = grabacionIndex;

                grabaciones.push({ blob, url, index: idx });

                const ind = document.getElementById(`grabando-${idx}`);
                if (ind) ind.remove();

                const wrapper = document.createElement('div');
                wrapper.id = `audio-wrapper-${idx}`;
                wrapper.style.cssText =
                    'display:flex;align-items:center;gap:8px;margin:6px 0;';

                const label = document.createElement('span');
                label.textContent = `🎙️ Audio #${idx}`;
                label.style.cssText = 'font-size:13px;min-width:70px;';

                const audio = document.createElement('audio');
                audio.controls = true;
                audio.src = url;
                audio.style.cssText = 'flex:1;';

                const btnEliminar = document.createElement('button');
                btnEliminar.textContent = '✕';
                btnEliminar.type = 'button';
                btnEliminar.style.cssText =
                    'background:red;color:white;border:none;border-radius:50%;' +
                    'width:24px;height:24px;cursor:pointer;font-size:13px;flex-shrink:0;';

                btnEliminar.addEventListener('click', () => {
                    grabaciones = grabaciones.filter(g => g.index !== idx);
                    wrapper.remove();
                });

                wrapper.appendChild(label);
                wrapper.appendChild(audio);
                wrapper.appendChild(btnEliminar);
                previewAudio.appendChild(wrapper);

                stream.getTracks().forEach(track => track.stop());

                btnRecord.disabled = false;
                btnStop.disabled   = true;
            };

            mediaRecorder.start();
            btnRecord.disabled = true;
            btnStop.disabled   = false;

        } catch (error) {

            console.error('Error micrófono:', error);
            previewAudio.innerHTML +=
                '<p style="color:orange;">⚠️ Micrófono no permitido o no compatible.</p>';
        }
    });

    /* =====================================================
       DETENER AUDIO
    ===================================================== */

    btnStop.addEventListener('click', () => {

        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            btnRecord.disabled = false;
            btnStop.disabled   = true;
        }
    });

    /* =====================================================
       ENVIAR WHATSAPP
    ===================================================== */

    btnWhatsapp.addEventListener('click', () => {

        const nombre        = document.getElementById('nombre').value.trim();
        const telefono      = document.getElementById('telefono').value.trim();
        const fecha         = document.getElementById('fecha').value;
        const serie         = document.getElementById('serie').value.trim();
        const observaciones = document.getElementById('observaciones').value.trim();

        if (!nombre || !telefono || !fecha || !serie || !observaciones) {
            alert('Por favor completa todos los campos.');
            return;
        }

        let telefonoLimpio = telefono.replace(/\D/g, '');
        if (!telefonoLimpio.startsWith('57')) {
            telefonoLimpio = `57${telefonoLimpio}`;
        }

        const totalFotos  = previewFoto.querySelectorAll('img').length;
        const totalAudios = grabaciones.length;

        const mensaje =
`*INFOTEC - SERVIDEERE*
*Registro Técnico*

👤 Cliente: ${nombre}
📞 Teléfono: ${telefonoLimpio}
📅 Fecha: ${fecha}
🔧 Serie: ${serie}

📝 Observaciones:
${observaciones}

📸 Fotos adjuntas: ${totalFotos}
🎙️ Notas de voz: ${totalAudios}
📧 Evidencias enviadas al correo técnico.`;

        const urlWhatsapp =
            `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;

        window.open(urlWhatsapp, '_blank', 'noopener,noreferrer');
    });

    /* =====================================================
       ENVÍO EMAILJS + CLOUDINARY
    ===================================================== */

    form.addEventListener('submit', async (event) => {

        event.preventDefault();

        btnEmail.disabled    = true;
        btnEmail.textContent = 'Subiendo archivos...';

        try {

            const nombre        = document.getElementById('nombre').value.trim();
            const telefono      = document.getElementById('telefono').value.trim();
            const fecha         = document.getElementById('fecha').value;
            const serie         = document.getElementById('serie').value.trim();
            const observaciones = document.getElementById('observaciones').value.trim();

            if (!nombre || !telefono || !fecha || !serie || !observaciones) {
                alert('Por favor completa todos los campos.');
                btnEmail.disabled    = false;
                btnEmail.textContent = 'Guardar y Enviar al Correo';
                return;
            }

            /* --- SUBIR FOTOS --- */

            const imgElements  = previewFoto.querySelectorAll('img');
            const enlacesFotos = [];

            for (let i = 0; i < imgElements.length; i++) {

                btnEmail.textContent = `Subiendo foto ${i + 1} de ${imgElements.length}...`;

                const res  = await fetch(imgElements[i].src);
                const blob = await res.blob();
                const url  = await subirACloudinary(blob, `foto_${i + 1}.jpg`, 'image');

                enlacesFotos.push(url);
            }

            /* --- SUBIR AUDIOS --- */

            const enlacesAudios = [];

            for (let i = 0; i < grabaciones.length; i++) {

                btnEmail.textContent =
                    `Subiendo audio ${i + 1} de ${grabaciones.length}...`;

                const url = await subirACloudinary(
                    grabaciones[i].blob,
                    `audio_${i + 1}.webm`,
                    'video'
                );

                enlacesAudios.push(url);
            }

            /* --- ENVIAR CORREO --- */

            btnEmail.textContent = 'Enviando correo...';

            const fotosTexto = enlacesFotos.length > 0
                ? enlacesFotos.map((url, i) => `Foto ${i + 1}: ${url}`).join('\n')
                : 'Sin fotos adjuntas';

            const audiosTexto = enlacesAudios.length > 0
                ? enlacesAudios.map((url, i) => `Audio ${i + 1}: ${url}`).join('\n')
                : 'Sin notas de voz';

            const templateParams = {
                nombre,
                telefono,
                fecha,
                serie,
                observaciones,
                fotos:  fotosTexto,
                audios: audiosTexto
            };

            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams,
                EMAILJS_PUBLIC_KEY
            );

            alert('✅ Reporte enviado correctamente con fotos y audios.');

            /* --- LIMPIAR --- */

            form.reset();
            previewFoto.innerHTML  = '';
            previewAudio.innerHTML = '';
            grabaciones    = [];
            grabacionIndex = 0;
            btnRecord.disabled = false;
            btnStop.disabled   = true;

        } catch (error) {

            console.error('Error:', error);
            alert('❌ Error enviando. Revisa la consola.');

        } finally {

            btnEmail.disabled    = false;
            btnEmail.textContent = 'Guardar y Enviar al Correo';
        }
    });

});
