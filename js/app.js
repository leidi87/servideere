// 3. Acción del Botón WhatsApp (Optimizado para evitar bloqueos en celulares)
document.getElementById('btn-whatsapp').addEventListener('click', () => {
    const nombre = document.getElementById('nombre').value;
    const telefono = document.getElementById('telefono').value;
    const fecha = document.getElementById('fecha').value;
    const serie = document.getElementById('serie').value;
    const observaciones = document.getElementById('observaciones').value;

    // Validación de campos obligatorios antes de intentar abrir WhatsApp
    if (!nombre || !telefono || !serie) {
        alert("Por favor, rellena los campos de Nombre, Teléfono y Serie de la máquina.");
        return;
    }

    // Estructuramos el mensaje con texto limpio
    let textoMensaje = `*INFOTEC - SERVIDEERE*\n`;
    textoMensaje += `*Reporte Técnico de Servicio*\n\n`;
    textoMensaje += `• *Cliente:* ${nombre}\n`;
    textoMensaje += `• *Teléfono:* ${telefono}\n`;
    textoMensaje += `• *Fecha:* ${fecha}\n`;
    textoMensaje += `• *Serie Máquina:* ${serie}\n\n`;
    textoMensaje += `*Observaciones:*\n${observaciones}\n\n`;
    textoMensaje += `_Nota: Las evidencias multimedia se encuentran guardadas en el dispositivo._`;

    // Codificamos el texto correctamente para que acepte espacios, tildes y saltos de línea
    const mensajeCodificado = encodeURIComponent(textoMensaje);

    // Número del administrador (317 6677848) sin espacios ni símbolos
    const numAdmin = "573176677848"; 
    
    // Alerta informativa antes de redirigir
    alert("Redirigiendo a WhatsApp del Administrador de INFOTEC-SERVIDEERE...");
    
    // USAMOS location.href EN LUGAR DE window.open PARA EVITAR BLOQUEOS DEL NAVEGADOR MÓVIL
    window.location.href = `https://api.whatsapp.com/send?phone=${numAdmin}&text=${mensajeCodificado}`;
});
