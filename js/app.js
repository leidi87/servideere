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
        alert('Por favor completa todos los campos.');
        return;
    }

    /* =====================================================
       TELÉFONO CLIENTE
    ===================================================== */

    let telefonoCliente = telefono.replace(/\D/g, '');

    if (!telefonoCliente.startsWith('57')) {
        telefonoCliente = `57${telefonoCliente}`;
    }

    /* =====================================================
       NÚMEROS FIJOS DESTINO
       (AGREGA LOS QUE NECESITES)
    ===================================================== */

    const numerosDestino = [
        '573001111111',
        '573002222222',
        '573003333333'
    ];

    const totalFotos  = previewFoto.querySelectorAll('img').length;
    const totalAudios = grabaciones.length;

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

    /* =====================================================
       ABRIR WHATSAPP PARA CADA NÚMERO
    ===================================================== */

    numerosDestino.forEach((numero, index) => {

        const urlWhatsapp =
            `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

        setTimeout(() => {
            window.open(urlWhatsapp, '_blank', 'noopener,noreferrer');
        }, index * 500);
    });
});
