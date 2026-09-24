/* =========================================================
   CONFIGURACIÓN DE OUSIA STUDIO
   Todo lo que hay que cambiar está AQUÍ.
   ========================================================= */
window.OUSIA_CONFIG = {
  // Contacto: RESPALDO. Los datos reales se editan en content/contacto.json (Pages CMS);
  // estos solo se usan si ese archivo no carga. (WhatsApp sin "+", sin espacios: 51 + número)
  whatsapp: "51990650813",
  email: "contacto@ousia-studio.pe",
  instagram: "ousiastudio.arch",
  direccion: "",

  // Datos legales (salen en el footer y en el Libro de Reclamaciones).
  // Si están vacíos no se muestran; en el libro el proveedor sale como "Ousia Studio".
  razonSocial: "",
  ruc: "",

  // EmailJS (https://www.emailjs.com). Si lo dejas vacío, la web usa
  // WhatsApp para el contacto y la app de correo para el libro.
  emailjs: {
    publicKey: "",
    serviceId: "",
    templateContacto: "",
    templateLibroEstudio: "",
    templateLibroCliente: ""
  },

  // Proyectos que salen en el slider de inicio (posición en content/proyectos.json, empieza en 0)
  heroSlides: [0, 1, 2, 3]

  // Los PROYECTOS están en content/proyectos.json (se editan desde Pages CMS).
};
