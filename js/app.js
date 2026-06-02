/* =====================================================
   SERVIDEERE - APP PRINCIPAL
   Versión corregida: fotos múltiples, audios múltiples
===================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* =====================================================
       REFERENCIAS DOM
    ===================================================== */

    const form        = document.getElementById('form-servicio');
    const inputFoto   = document.getElementById('foto');
    const previewFoto = document.getElementById('preview-foto');
    const previewAudio = document.getElementById('preview-audio');
    const btnRecord   = document.getElementById('btn-record');
    const btnStop     = document.getElementById('btn-stop');
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    const btnEmail    = document.getElementById('btn-email');
    const estadoConexion = document.getElementById('estadoConexion');

    /* =====================================================
       ESTADO CONEXIÓN
    ===================================================== */

    function actualizarEstadoConexion() {
        if (navigator.onLine) {
            estadoConexion.textContent = '🟢 Conectado';
            estadoConexion.style.background = '#065f46';
        } else {
            estadoConexion.textContent = '🔴 Sin conexión (modo offline)';
            estadoConexion.style.background = '#7f1d1d';
        }
        setTimeout(() => {
            estadoConexion.style.opacity = '0';
            estadoConexion.style.transition = 'opacity 1s';
        }, 3000);
    }

    actualizarEstadoConexion();
    window.addEventListener('online',  actualizarEstadoConexion);
    window.addEventListener('offline', actualizarEstadoConexion);

    /* =====================================================
       FECHA ACTUAL POR DEFECTO
    ===================================================== */

    const inputFecha = document.getElementById('fecha');
    if (inputFecha && !inputFecha.value) {
        inputFecha.value = new Date().toISOString().split('T')[0];
    }

    /* =====================================================
       FOTOS — MÚLTIPLES + PREVIEW + BORRAR
       FIX: sin capture="" → el celular muestra menú
            (cámara / galería / archivos)
    ===================================================== */

    // Almacén de archivos acumulados (permite agregar de a lotes)
    let archivosSeleccionados = [];

    // El input en index.html NO debe tener capture="environment"
    // Solo: type="file" accept="image/*" multiple
    // (ya está corregido en el HTML que tienes)

    inputFoto.addEventListener('change', () => {

        const nuevos = Array.from(inputFoto.files);

        nuevos.forEach(file => {

            // Evitar duplicados por nombre+tamaño
            const existe = archivosSeleccionados.some(
                f => f.name === file.name && f.size === file.size
            );
            if (existe) return;

            archivosSeleccionados.push(file);

            const reader = new FileReader();

            reader.onload = (e) => {

                const wrapper = document.createElement('div');
                wrapper.className = 'preview-item';
                wrapper.style.cssText = `
                    position: relative;
                    display: inline-block;
                    margin: 6px;
                `;

                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.cssText = `
                    width: 90px;
                    height: 90px;
                    object-fit: cover;
                    border-radius: 8px;
                    border: 2px solid #334155;
                    display: block;
                `;

                const btnBorrar = document.createElement('button');
                btnBorrar.textContent = '✕';
                btnBorrar.type = 'button';
                btnBorrar.style.cssText = `
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 22px;
                    height: 22px;
                    font-size: 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                `;

                btnBorrar.addEventListener('click', () => {
                    archivosSeleccionados = archivosSeleccionados.filter(
                        f => !(f.name === file.name && f.size === file.size)
                    );
                    wrapper.remove();
                    actualizarContadorFotos();
                });

                wrapper.appendChild(img);
                wrapper.appendChild(btnBorrar);
                previewFoto.appendChild(wrapper);

                actualizarContadorFotos();
            };

            reader.readAsDataURL(file);
        });

        // Limpiar el input para permitir volver a seleccionar los mismos archivos
        inputFoto.value = '';
    });

    function actualizarContadorFotos() {
        const contador = previewFoto.querySelector('.contador-fotos');
        if (archivosSeleccionados.length > 0) {
            const texto = `📸 ${archivosSeleccionados.length} foto(s) seleccionada(s)`;
            if (contador) {
                contador.textContent = texto;
            } else {
                const div = document.createElement('div');
                div.className = 'contador-fotos';
                div.style.cssText = `
                    font-size: 13px;
                    color: #94a3b8;
                    margin-top: 6px;
                    width: 100%;
                `;
                div.textContent = texto;
                previewFoto.appendChild(div);
            }
        } else if (contador) {
            contador.remove();
        }
    }

    /* =====================================================
       AUDIO — MÚLTIPLES GRABACIONES + PREVIEW + BORRAR
       FIX: las grabaciones se acumulan en array,
            no se sobrescriben
    ===================================================== */

    let mediaRecorder = null;
    let chunksActuales = [];
    let grabaciones = [];       // Array de Blobs
    let contadorGrabacion = 0;

    btnRecord.addEventListener('click', async () => {

        try {

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            mediaRecorder = new MediaRecorder(stream);
            chunksActuales = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksActuales.push(e.data);
            };

            mediaRecorder.onstop = () => {

                const blob = new Blob(chunksActuales, { type: 'audio/webm' });
                grabaciones.push(blob);
                contadorGrabacion++;

                const url = URL.createObjectURL(blob);
                agregarPreviewAudio(url, contadorGrabacion, grabaciones.length - 1);

                // Detener el micrófono
                stream.getTracks().forEach(t => t.stop());
            };

            mediaRecorder.start();

            btnRecord.disabled = true;
            btnStop.disabled   = false;
            btnRecord.textContent = '🔴 Grabando...';

        } catch (err) {
            alert('No se pudo acceder al micrófono. Verifica los permisos.');
            console.error(err);
        }
    });

    btnStop.addEventListener('click', () => {

        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }

        btnRecord.disabled = false;
        btnStop.disabled   = true;
        btnRecord.textContent = 'Grabar Audio';
    });

    function agregarPreviewAudio(url, numero, indice) {

        const wrapper = document.createElement('div');
        wrapper.className = 'audio-item';
        wrapper.dataset.indice = indice;
        wrapper.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 8px 0;
            background: #1e293b;
            border-radius: 10px;
            padding: 8px 10px;
        `;

        const etiqueta = document.createElement('span');
        etiqueta.textContent = `🎙️ Nota ${numero}`;
        etiqueta.style.cssText = `
            font-size: 13px;
            color: #94a3b8;
            min-width: 70px;
        `;

        const audio = document.createElement('audio');
        audio.src = url;
        audio.controls = true;
        audio.style.cssText = `
            flex: 1;
            height: 36px;
            min-width: 0;
        `;

        const btnBorrar = document.createElement('button');
        btnBorrar.textContent = '✕';
        btnBorrar.type = 'button';
        btnBorrar.style.cssText = `
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 26px;
            height: 26px;
            font-size: 13px;
            cursor: pointer;
            flex-shrink: 0;
        `;

        btnBorrar.addEventListener('click', () => {
            const idx = parseInt(wrapper.dataset.indice);
            grabaciones[idx] = null;   // Marcar como eliminada
            URL.revokeObjectURL(url);
            wrapper.remove();
        });

        wrapper.appendChild(etiqueta);
        wrapper.appendChild(audio);
        wrapper.appendChild(btnBorrar);
        previewAudio.appendChild(wrapper);
    }

    /* =====================================================
       ENVIAR WHATSAPP A MÚLTIPLES NÚMEROS
    ===================================================== */

    btnWhatsapp.addEventListener('click', () => {

        const nombre        = document.getElementById('nombre').value.trim();
        const telefono      = document.getElementById('telefono').value.trim();
        const fecha         = document.getElementById('fecha').value;
        const serie         = document.getElementById('serie').value.trim();
        const observaciones = document.getElementById('observaciones').value.trim();

        if (!nombre || !telefono || !fecha || !serie || !observaciones) {
            alert('Por favor completa todos los campos antes de enviar.');
            return;
        }

        let telefonoCliente = telefono.replace(/\D/g, '');
        if (!telefonoCliente.startsWith('57')) {
            telefonoCliente = `57${telefonoCliente}`;
        }

        /* ===================================================
           ✏️  EDITA AQUÍ TUS NÚMEROS DESTINO
        =================================================== */
        const numerosDestino = [
            '573176677848',
            '573002222222',
            '573003333333'
        ];

        const totalFotos  = archivosSeleccionados.length;
        const totalAudios = grabaciones.filter(g => g !== null).length;

        const mensaje =
`*INFOTEC - SERVIDEERE*
*Registro Técnico*

👤 Cliente: ${nombre}
📞 Teléfono cliente: ${telefonoCliente}
📅 Fecha: ${fecha}
🔧 Serie: ${serie}

📝 Observaciones:
${observaciones}

📸 Fotos adjuntas: ${totalFotos}
🎙️ Notas de voz: ${totalAudios}
📧 Evidencias enviadas al correo técnico.`;

        numerosDestino.forEach((numero, index) => {
            const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
            setTimeout(() => {
                window.open(url, '_blank', 'noopener,noreferrer');
            }, index * 500);
        });
    });

    /* =====================================================
       ENVIAR POR CORREO (EmailJS)
       Configura tu SERVICE_ID, TEMPLATE_ID y PUBLIC_KEY
    ===================================================== */

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        const nombre        = document.getElementById('nombre').value.trim();
        const telefono      = document.getElementById('telefono').value.trim();
        const fecha         = document.getElementById('fecha').value;
        const serie         = document.getElementById('serie').value.trim();
        const observaciones = document.getElementById('observaciones').value.trim();

        const totalFotos  = archivosSeleccionados.length;
        const totalAudios = grabaciones.filter(g => g !== null).length;

        const datos = { nombre, telefono, fecha, serie, observaciones, totalFotos, totalAudios };

        if (navigator.onLine) {

            btnEmail.disabled = true;
            btnEmail.textContent = 'Enviando...';

            try {

                /* ================================================
                   ✏️  REEMPLAZA ESTOS VALORES CON LOS DE EMAILJS
                   SERVICE_ID  → tu servicio de email en EmailJS
                   TEMPLATE_ID → tu plantilla en EmailJS
                   PUBLIC_KEY  → tu clave pública de EmailJS
                ================================================ */
                await emailjs.init('uslSzyXbJH6rmsfGw');

                await emailjs.send('service_ca8hppv', 'template_n7qw2gn', {
                    nombre,
                    telefono,
                    fecha,
                    serie,
                    observaciones,
                    totalFotos,
                    totalAudios
                });

                alert('✅ Registro enviado al correo correctamente.');
                form.reset();
                previewFoto.innerHTML = '';
                previewAudio.innerHTML = '';
                archivosSeleccionados = [];
                grabaciones = [];
                contadorGrabacion = 0;

            } catch (err) {
                console.error('Error EmailJS:', err);
                alert('⚠️ No se pudo enviar el correo. Guardando offline...');
                await guardarOffline(datos);
            } finally {
                btnEmail.disabled = false;
                btnEmail.textContent = 'Guardar y Enviar al Correo';
            }

        } else {
            await guardarOffline(datos);
            alert('📴 Sin conexión. Registro guardado localmente. Se enviará cuando vuelva la conexión.');
        }
    });

});
