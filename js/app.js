// Inicializar EmailJS correctamente
(function () {
    emailjs.init("26egLDQpcS@b@W5");
})();

// ENVÍO DEL FORMULARIO AL CORREO
document.getElementById("form-servicio").addEventListener("submit", function (e) {

    e.preventDefault();

    // Captura de datos
    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const fecha = document.getElementById("fecha").value;
    const serie = document.getElementById("serie").value.trim();
    const observaciones = document.getElementById("observaciones").value.trim();

    // Validación
    if (!nombre || !telefono || !fecha || !serie || !observaciones) {
        alert("Por favor completa todos los campos.");
        return;
    }

    // Parámetros para EmailJS
    const templateParams = {
        nombre: nombre,
        telefono: telefono,
        fecha: fecha,
        serie: serie,
        observaciones: observaciones
    };

    // Cambia estos datos por los tuyos reales de EmailJS
    const SERVICE_ID = "service_xxxxxxx";
    const TEMPLATE_ID = "template_xxxxxxx";

    // Envío
    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
        .then(function (response) {

            console.log("Correo enviado:", response);

            alert("Reporte enviado correctamente al correo.");

            // Limpiar formulario
            document.getElementById("form-servicio").reset();

            // Limpiar previews
            document.getElementById("preview-foto").innerHTML = "";
            document.getElementById("preview-audio").innerHTML = "";

        })
        .catch(function (error) {

            console.error("Error EmailJS:", error);

            alert("Error al enviar el correo.");
        });
});

// PREVISUALIZACIÓN DE IMÁGENES
document.getElementById("foto").addEventListener("change", function (event) {

    const preview = document.getElementById("preview-foto");

    preview.innerHTML = "";

    const files = event.target.files;

    for (let i = 0; i < files.length; i++) {

        const reader = new FileReader();

        reader.onload = function (e) {

            const img = document.createElement("img");

            img.src = e.target.result;

            img.style.width = "100px";
            img.style.margin = "5px";
            img.style.borderRadius = "10px";

            preview.appendChild(img);
        };

        reader.readAsDataURL(files[i]);
    }
});

// GRABACIÓN DE AUDIO
let mediaRecorder;
let audioChunks = [];

const btnRecord = document.getElementById("btn-record");
const btnStop = document.getElementById("btn-stop");

btnRecord.addEventListener("click", async function () {

    try {

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.start();

        audioChunks = [];

        mediaRecorder.addEventListener("dataavailable", event => {
            audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener("stop", () => {

            const audioBlob = new Blob(audioChunks);

            const audioUrl = URL.createObjectURL(audioBlob);

            const audio = document.createElement("audio");

            audio.controls = true;

            audio.src = audioUrl;

            const previewAudio = document.getElementById("preview-audio");

            previewAudio.innerHTML = "";

            previewAudio.appendChild(audio);
        });

        btnRecord.disabled = true;
        btnStop.disabled = false;

    } catch (error) {

        console.error(error);

        alert("No se pudo acceder al micrófono.");
    }
});

btnStop.addEventListener("click", function () {

    mediaRecorder.stop();

    btnRecord.disabled = false;
    btnStop.disabled = true;
});
