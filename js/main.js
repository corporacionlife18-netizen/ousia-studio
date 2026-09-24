(function () {
  "use strict";
  const C = window.OUSIA_CONFIG;
  const I = window.OUSIA_I18N;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const pad = (n) => String(n).padStart(2, "0");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const PROVEEDOR = String(C.razonSocial || "").trim() || "Ousia Studio";
  const RUC = String(C.ruc || "").trim();
  const reduceMotion =window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Estado ---------- */
  const state = {
    lang: (() => { try { return localStorage.getItem("ousia-lang") || "es"; } catch (e) { return "es"; } })(),
    filter: "all", view: "grid", hover: 0,
    slide: 0, open: -1, tab: "photos", photo: 0,
    type: 0
  };
  const t = (path) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), I[state.lang]) ?? "";
  const L = (obj) => (obj && typeof obj === "object" ? obj[state.lang] ?? obj.es : obj);

  /* ---------- Dibujos placeholder ---------- */
  const SHAPES = {
    A: '<path d="M40 250H260M60 250V110H240V250M60 110L150 50L240 110M95 250V170H135V250M170 150H215V200H170Z"/>',
    B: '<path d="M30 250H270M50 250V60H250V250M50 150H250M90 250V220H120V190H150V160H180M200 60V150"/>',
    C: '<path d="M50 50H250V250H50ZM50 130H160M160 50V190M160 190H250M100 130V250M200 190V250"/><circle cx="205" cy="100" r="22"/>',
    P: '<path d="M40 40H260V260H40ZM40 140H130M130 40V100M130 120V200M130 200H260M180 200V260M200 40V120M200 140H260M60 60H110V110H60Z"/><circle cx="85" cy="200" r="24"/>'
  };
  const svg = (shape, op = 0.4) => `<svg viewBox="0 0 300 300" fill="none" stroke="currentColor" stroke-opacity="${op}" stroke-width="1.1" aria-hidden="true">${SHAPES[shape] || SHAPES.A}</svg>`;
  const media = (src, alt, shape, tone, label, op) =>
    src
      ? `<div class="ph" style="background:${tone}"><img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async"></div>`
      : `<div class="ph" style="background:${tone}">${svg(shape, op)}${label ? `<span class="ph__label">[${esc(label)}]</span>` : ""}</div>`;

  // Se llenan desde content/proyectos.json (ver loadProjects al final).
  // shape/tone solo se usan como placeholder cuando un proyecto no tiene imágenes.
  const TONES = ["#D9D1C4", "#E2DACD", "#D3CCC0", "#DCD4C8", "#D6CEC1", "#E0D9CE"];
  let projects = [];
  const prepProjects = (list) => list.map((p, i) => ({
    ...p, i, num: pad(i + 1),
    photos: p.photos || [], plans: p.plans || [],
    shape: p.shape || ["A", "C", "B"][i % 3], tone: p.tone || TONES[i % TONES.length]
  }));

  /* ---------- Contacto (content/contacto.json; si no carga, config.js) ---------- */
  let contact = null;
  const CT = (k) => String((contact && k in contact ? contact[k] : C[k]) ?? "").trim();
  const CTL = (k) => String((contact && contact[`${k}_${state.lang}`]) ?? "").trim();
  // tolera que en el CMS escriban "+51 990 650 813" o "@usuario" / la URL completa
  const waNumber = () => CT("whatsapp").replace(/\D/g, "");
  const igUser = () => CT("instagram").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/+$/, "");
  const waLink = (text) => `https://wa.me/${waNumber()}?text=${encodeURIComponent(text)}`;

  /* ---------- Datos fijos (contacto, legal) ---------- */
  function fillStatic() {
    $$("[data-wa]").forEach((a) => (a.href = waLink(t("contact.waMsg"))));
    $$("[data-email]").forEach((a) => { a.href = `mailto:${CT("email")}`; a.textContent = CT("email"); });
    $$("[data-ig]").forEach((a) => { a.href = `https://instagram.com/${igUser()}`; if (!a.textContent.trim() || a.textContent.startsWith("@")) a.textContent = a.closest(".footer__links") ? "Instagram" : "@" + igUser(); });
    $$("[data-address]").forEach((el) => (el.textContent = CT("direccion")));
    if (CTL("titulo")) $("#contactTitle").textContent = CTL("titulo");
    if (CTL("subtitulo")) $("#contactSub").textContent = CTL("subtitulo");
    $("#contactHours").textContent = CTL("horario");
    // filas opcionales: se ocultan si están vacías
    $$("[data-if-ct]").forEach((el) => (el.hidden = !(el.dataset.ifCt === "horario" ? CTL("horario") : CT(el.dataset.ifCt))));
    $$("[data-razon]").forEach((el) => (el.textContent = C.razonSocial));
    $$("[data-ruc]").forEach((el) => (el.textContent = C.ruc));
    $$("[data-proveedor]").forEach((el) => (el.textContent = PROVEEDOR));
    // oculta los datos legales que estén vacíos en config.js
    $$("[data-if]").forEach((el) => (el.hidden = !String(C[el.dataset.if] || "").trim()));
    $("#year").textContent = new Date().getFullYear();
  }

  /* ---------- El estudio (content/estudio.json) ---------- */
  // Si el JSON no carga o un campo está vacío, quedan los textos de i18n.js y el placeholder.
  let studio = {};
  const portrait = $("#portrait"), portraitPlaceholder = portrait.innerHTML;
  function renderStudio() {
    const v = (k) => String(studio[`${k}_${state.lang}`] || "").trim();
    if (v("bio")) $("#studioBio").textContent = v("bio");
    if (v("rol")) $("#studioRole").textContent = v("rol");
    if (v("pie_foto")) $("#portraitCaption").textContent = v("pie_foto");
    if (String(studio.formacion || "").trim()) $("#studioEdu").textContent = studio.formacion;
    if (studio.foto) {
      portrait.innerHTML = `<img src="${esc(studio.foto)}" alt="Arq. Milagros Mogollón" loading="lazy" decoding="async">`;
    } else if (!$("svg", portrait)) {
      portrait.innerHTML = portraitPlaceholder;
      $("[data-i18n]", portrait).textContent = t("studio.portrait");
    }
  }

  /* ---------- Idioma ---------- */
  function applyLang() {
    document.documentElement.lang = state.lang;
    $$("[data-i18n]").forEach((el) => { const v = t(el.dataset.i18n); if (v) el.textContent = v; });
    $$("[data-i18n-aria]").forEach((el) => { const v = t(el.dataset.i18nAria); if (v) el.setAttribute("aria-label", v); });
    $$("[data-i18n-ph]").forEach((el) => { const v = t(el.dataset.i18nPh); if (v) el.setAttribute("placeholder", v); });
    $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
    fillStatic();
    renderStudio();
    renderProjects();
    renderHeroText();
    syncPause();
    renderChips();
    if (state.open >= 0) renderModal();
  }
  $$("[data-lang]").forEach((b) => b.addEventListener("click", () => {
    state.lang = b.dataset.lang;
    try { localStorage.setItem("ousia-lang", state.lang); } catch (e) {}
    applyLang();
  }));

  /* ---------- Menú mobile ---------- */
  const menu = $("#menu"), burger = $("#burger");
  function openMenu() { menu.hidden = false; burger.setAttribute("aria-expanded", "true"); document.body.classList.add("lock"); $("#menuClose").focus(); }
  function closeMenu() { menu.hidden = true; burger.setAttribute("aria-expanded", "false"); document.body.classList.remove("lock"); }
  burger.addEventListener("click", openMenu);
  $("#menuClose").addEventListener("click", () => { closeMenu(); burger.focus(); });
  $$("#menu a").forEach((a) => a.addEventListener("click", closeMenu));

  /* ---------- Hero slider ---------- */
  let heroIdx = [];
  const heroTones = ["#CBC2B4", "#BDB4A5", "#C6BDAF", "#B5AC9E", "#C2B9AB"];
  const heroMedia = $("#heroMedia"), heroBars = $("#heroBars"), hero = $(".hero");
  const DUR = 6000;

  function buildHero() {
    heroIdx = (C.heroSlides || []).filter((i) => projects[i]);
    if (!heroIdx.length) heroIdx = projects.map((p) => p.i);
    heroMedia.innerHTML = heroIdx.map((pi, k) => {
      const p = projects[pi], src = p.photos[0];
      return `<div class="hero__slide-el${k === 0 ? " is-on" : ""}" style="background:${heroTones[k % heroTones.length]}">${src ? `<img src="${esc(src)}" alt="" ${k ? 'loading="lazy"' : 'fetchpriority="high"'}>` : svg(p.shape, 0.32)}</div>`;
    }).join("");
    heroBars.innerHTML = heroIdx.map((_, k) => `<button type="button" aria-label="Slide ${k + 1}"><span></span></button>`).join("");
    $$("button", heroBars).forEach((b, i) => b.addEventListener("click", () => goSlide(i)));
    $("#heroTotal").textContent = pad(heroIdx.length);
  }

  function renderHeroText() {
    const p = projects[heroIdx[state.slide]];
    if (!p) return;
    $("#heroCat").textContent = t("projects." + p.cat);
    $("#heroName").textContent = L(p.title);
  }
  function goSlide(k) {
    if (!heroIdx.length) return;
    state.slide = (k + heroIdx.length) % heroIdx.length;
    $$(".hero__slide-el", heroMedia).forEach((el, i) => el.classList.toggle("is-on", i === state.slide));
    const bars = $$("button", heroBars);
    // quitar is-on y forzar reflow reinicia la animación de la barra aunque sea la misma
    bars.forEach((b) => b.classList.remove("is-on"));
    heroBars.offsetWidth;
    bars.forEach((b, i) => {
      b.classList.toggle("is-on", i === state.slide);
      b.classList.toggle("is-done", i < state.slide);
      b.setAttribute("aria-current", i === state.slide ? "true" : "false");
    });
    $("#heroNum").textContent = pad(state.slide + 1);
    renderHeroText();
    syncPause();
  }
  // El avance lo marca el fin de la animación de la barra: al pausarla (CSS) se congela
  // y al reanudar sigue desde donde quedó. Con "reducir movimiento" empieza en pausa.
  let userPaused = reduceMotion;
  const autoPaused = () => document.hidden || !$("#pmodal").hidden || !$("#libro").hidden;
  function syncPause() {
    hero.classList.toggle("is-paused", userPaused || autoPaused());
    const btn = $("#heroPause");
    btn.classList.toggle("is-paused", userPaused);
    btn.setAttribute("aria-label", t(userPaused ? "hero.play" : "hero.pause"));
  }
  heroBars.addEventListener("animationend", (e) => { if (e.animationName === "bar") goSlide(state.slide + 1); });
  hero.style.setProperty("--dur", DUR + "ms");
  $("#heroNext").addEventListener("click", () => goSlide(state.slide + 1));
  $("#heroPrev").addEventListener("click", () => goSlide(state.slide - 1));
  $("#heroPause").addEventListener("click", () => { userPaused = !userPaused; syncPause(); });
  $("#heroSlideBtn").addEventListener("click", () => openModal(heroIdx[state.slide]));
  document.addEventListener("visibilitychange", syncPause);
  // swipe en celular
  let sx = null;
  hero.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
  hero.addEventListener("touchend", (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) goSlide(state.slide + (dx < 0 ? 1 : -1));
  });

  /* ---------- Proyectos ---------- */
  const FILTERS = ["all", "res", "com", "int"];
  function renderFilters() {
    $("#filters").innerHTML = FILTERS.map((k) => `<button type="button" class="chip" data-f="${k}" aria-pressed="${state.filter === k}">${esc(t("projects." + k))}</button>`).join("");
    $$("#filters button").forEach((b) => b.addEventListener("click", () => { state.filter = b.dataset.f; renderProjects(); }));
  }
  const LAYOUTS = {
    4: ["pcard--7", "pcard--5 pcard--offset", "pcard--5", "pcard--7"],
    6: ["pcard--7", "pcard--5 pcard--offset", "pcard--5", "pcard--7", "pcard--6", "pcard--6"]
  };
  function layoutClass(k, total) {
    return (LAYOUTS[total] || [])[k] || "";
  }
  function renderProjects() {
    renderFilters();
    const list = state.filter === "all" ? projects : projects.filter((p) => p.cat === state.filter);
    $("#projCount").textContent = `(${list.length} ${t("projects.count")})`;
    $("#projEmpty").hidden = list.length > 0;

    $("#pgrid").innerHTML = list.map((p, k) => `
      <button type="button" class="pcard ${layoutClass(k, list.length)}" data-open="${p.i}" aria-label="${esc(L(p.title))}, ${esc(t("projects." + p.cat))}">
        <div class="pcard__img">${media(p.photos[0], L(p.title), p.shape, p.tone, t("projects.photo"))}</div>
        <div class="pcard__row"><span class="pcard__title">${esc(L(p.title))}</span><span class="small muted">${p.num}</span></div>
        <div class="pcard__meta"><span>${esc(t("projects." + p.cat))}</span><span>${esc(p.location)} — ${esc(p.year)}</span></div>
      </button>`).join("");

    $("#plistRows").innerHTML = list.map((p) => `
      <button type="button" class="prow" data-open="${p.i}" data-hover="${p.i}">
        <span class="prow__m">${p.num}</span><span class="prow__t">${esc(L(p.title))}</span>
        <span class="prow__m">${esc(t("projects." + p.cat))}</span><span class="prow__m">${esc(p.year)}</span>
      </button>`).join("");

    $$("[data-open]").forEach((b) => b.addEventListener("click", () => openModal(+b.dataset.open)));
    $$("[data-hover]").forEach((b) => {
      const h = () => { state.hover = +b.dataset.hover; renderPreview(); };
      b.addEventListener("mouseenter", h); b.addEventListener("focus", h);
    });
    if (list.length && !list.some((p) => p.i === state.hover)) state.hover = list[0].i;
    renderPreview();
    applyView();
  }
  function renderPreview() {
    const p = projects[state.hover];
    if (!p) return;
    $("#plistPreview").innerHTML = media(p.photos[0], "", p.shape, p.tone, L(p.title) + " — " + t("projects.photo"));
  }
  const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;
  function applyView() {
    const list = state.view === "list" && isDesktop();
    $("#pgrid").hidden = list;
    $("#plist").hidden = !list;
    $$("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === state.view)));
  }
  $$("[data-view]").forEach((b) => b.addEventListener("click", () => { state.view = b.dataset.view; applyView(); }));
  window.addEventListener("resize", applyView);

  /* ---------- Modal proyecto ---------- */
  const pmodal = $("#pmodal");
  let lastFocus = null;
  function openModal(i) {
    lastFocus = document.activeElement;
    state.open = i; state.tab = "photos"; state.photo = 0;
    renderModal();
    pmodal.hidden = false; document.body.classList.add("lock");
    syncPause();
    $("#pmClose").focus();
  }
  function closeModal() {
    pmodal.hidden = true; state.open = -1; document.body.classList.remove("lock");
    syncPause();
    if (lastFocus) lastFocus.focus();
  }
  function items(p) {
    const list = state.tab === "plans" ? p.plans : p.photos;
    const n = Math.max(list.length, 4);
    return Array.from({ length: list.length || n }, (_, k) => ({ src: list[k] }));
  }
  function stageFor(p, k, small) {
    const it = items(p)[k] || {};
    if (state.tab === "plans") return media(it.src, `${L(p.title)} — ${t("modal.plan")} ${k + 1}`, "P", "#F1EDE6", small ? "" : `${t("modal.plan")} ${k + 1}`, 0.55);
    const order = ["A", "B", "C"];
    const shape = order[(order.indexOf(p.shape) + k) % 3];
    const tones = [p.tone, "#CFC7BA", "#D8D0C3", "#C9C1B4"];
    return media(it.src, `${L(p.title)} — ${t("modal.photo")} ${k + 1}`, shape, tones[k % 4], small ? "" : `${t("modal.photo")} ${k + 1}`, 0.42);
  }
  function renderModal() {
    const p = projects[state.open];
    const its = items(p);
    $("#pmCat").textContent = t("projects." + p.cat);
    $("#pmTitle").textContent = L(p.title);
    $("#pmChallenge").textContent = L(p.challenge);
    $("#pmAnswer").textContent = L(p.answer);
    $("#pmCount").textContent = `${p.num} / ${pad(projects.length)}`;
    const meta = [["modal.loc", p.location], ["modal.year", p.year], ["modal.area", p.area], ["modal.role", L(p.role)], ["modal.status", t("status." + p.status) || L(p.status)], ["modal.visual", p.visualization]];
    $("#pmMeta").innerHTML = meta.map(([k, v]) => `<div><dt>${esc(t(k))}</dt><dd>${esc(v)}</dd></div>`).join("");
    $("#pmStage").innerHTML = stageFor(p, state.photo) + `<span class="pm__count">${state.photo + 1} / ${its.length}</span>`;
    $("#pmThumbs").innerHTML = its.map((_, k) => `<button type="button" data-ph="${k}" aria-current="${k === state.photo}" aria-label="${esc((state.tab === "plans" ? t("modal.plan") : t("modal.photo")) + " " + (k + 1))}">${stageFor(p, k, true)}</button>`).join("");
    $$("#pmThumbs button").forEach((b) => b.addEventListener("click", () => { state.photo = +b.dataset.ph; renderModal(); }));
    $$(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === state.tab)));
  }
  $$(".tabs button").forEach((b) => b.addEventListener("click", () => { state.tab = b.dataset.tab; state.photo = 0; renderModal(); }));
  $("#pmClose").addEventListener("click", closeModal);
  $("#pmCta").addEventListener("click", () => { pmodal.hidden = true; state.open = -1; document.body.classList.remove("lock"); syncPause(); });
  $("#pmPrev").addEventListener("click", () => { state.open = (state.open - 1 + projects.length) % projects.length; state.photo = 0; renderModal(); });
  $("#pmNext").addEventListener("click", () => { state.open = (state.open + 1) % projects.length; state.photo = 0; renderModal(); });
  pmodal.addEventListener("click", (e) => { if (e.target === pmodal) closeModal(); });
  let psx = null;
  $("#pmStage").addEventListener("touchstart", (e) => (psx = e.touches[0].clientX), { passive: true });
  $("#pmStage").addEventListener("touchend", (e) => {
    if (psx === null) return;
    const dx = e.changedTouches[0].clientX - psx; psx = null;
    const n = items(projects[state.open]).length;
    if (Math.abs(dx) > 40) { state.photo = (state.photo + (dx < 0 ? 1 : -1) + n) % n; renderModal(); }
  });

  /* ---------- Teclado global ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!$("#libro").hidden) closeLibro();
      else if (!pmodal.hidden) closeModal();
      else if (!menu.hidden) { closeMenu(); burger.focus(); }
    }
    if (!pmodal.hidden && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      const n = items(projects[state.open]).length;
      state.photo = (state.photo + (e.key === "ArrowRight" ? 1 : -1) + n) % n; renderModal();
    }
    // mantener el foco dentro del modal abierto
    if (e.key === "Tab") {
      const box = !$("#libro").hidden ? $("#libro .lr") : !pmodal.hidden ? $("#pmodal .pm") : !menu.hidden ? menu : null;
      if (!box) return;
      const f = $$("a[href], button:not([disabled]), input, select, textarea", box).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ---------- FAQ: solo una abierta ---------- */
  $$("#faqList details").forEach((d) => d.addEventListener("toggle", () => {
    if (d.open) $$("#faqList details").forEach((o) => { if (o !== d) o.open = false; });
  }));

  /* ---------- EmailJS ---------- */
  const EJ = C.emailjs || {};
  const emailReady = !!(window.emailjs && EJ.publicKey && EJ.serviceId);
  if (emailReady) window.emailjs.init({ publicKey: EJ.publicKey });

  /* ---------- Formulario de contacto ---------- */
  function renderChips() {
    // tipos de proyecto desde content/contacto.json; si no hay, los de i18n.js
    const cms = contact && Array.isArray(contact.tipos) ? contact.tipos.map((x) => String((x && (x[state.lang] || x.es)) || "").trim()).filter(Boolean) : [];
    const types = cms.length ? cms : t("contact.types");
    $("#typeChips").innerHTML = types.map((x, i) => `<label class="chip"><input type="radio" name="tipo" value="${esc(x)}" ${state.type === i ? "checked" : ""}><span>${esc(x)}</span></label>`).join("");
    $$("#typeChips input").forEach((r, i) => r.addEventListener("change", () => (state.type = i)));
  }
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function setErr(input, errEl, msg) {
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (msg) input.setAttribute("aria-describedby", errEl.id); else input.removeAttribute("aria-describedby");
    errEl.textContent = msg || "";
  }
  $("#contactForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, name = $("#c-name"), mail = $("#c-email");
    let ok = true;
    setErr(name, $("#c-name-err"), name.value.trim() ? "" : (ok = false, t("contact.errName")));
    setErr(mail, $("#c-email-err"), EMAIL_RE.test(mail.value.trim()) ? "" : (ok = false, t("contact.errEmail")));
    if (!ok) { (name.value.trim() ? mail : name).focus(); return; }
    const data = Object.fromEntries(new FormData(f));
    data.presupuesto = String(data.presupuesto || "").trim() || t("contact.noBudget");
    $("#c-send-err").textContent = "";

    if (!emailReady || !EJ.templateContacto) {
      // Sin EmailJS: abre WhatsApp con el mensaje armado
      const msg = `${t("contact.waMsg")}\n\n${t("contact.name")}: ${data.nombre}\n${t("contact.email")}: ${data.correo}\n${t("contact.type")}: ${data.tipo || "-"}\n${t("contact.budget")}: ${data.presupuesto}\n\n${data.mensaje || ""}`;
      window.open(waLink(msg), "_blank", "noopener");
      return showContactDone();
    }
    const btn = $("#contactBtn"); btn.disabled = true; btn.textContent = t("contact.sending");
    try {
      await window.emailjs.send(EJ.serviceId, EJ.templateContacto, { ...data, idioma: state.lang, reply_to: data.correo });
      showContactDone();
    } catch (err) {
      console.error(err);
      $("#c-send-err").textContent = t("contact.errSend");
    } finally { btn.disabled = false; btn.textContent = t("contact.send"); }
  });
  function showContactDone() { $("#contactForm").hidden = true; const d = $("#contactDone"); d.hidden = false; d.focus(); }

  /* ---------- Libro de Reclamaciones ---------- */
  const libro = $("#libro"), lform = $("#libroForm");
  let libroData = null, libroLastFocus = null;
  function openLibro() {
    libroLastFocus = document.activeElement;
    lform.reset(); lform.hidden = false; $("#libroDone").hidden = true; $("#lr-apod-wrap").hidden = true;
    $("#lrSubmit").disabled = true; $("#lr-err").textContent = "";
    libro.hidden = false; document.body.classList.add("lock"); syncPause();
    $("#libroClose").focus();
  }
  function closeLibro() { libro.hidden = true; document.body.classList.remove("lock"); syncPause(); if (libroLastFocus) libroLastFocus.focus(); }
  $("#libroOpen").addEventListener("click", openLibro);
  $("#libroClose").addEventListener("click", closeLibro);
  $("#lrDoneClose").addEventListener("click", closeLibro);
  libro.addEventListener("click", (e) => { if (e.target === libro) closeLibro(); });
  $("#lr-menor").addEventListener("change", (e) => { $("#lr-apod-wrap").hidden = !e.target.checked; $("#lr-apod").required = e.target.checked; });
  $("#lr-conforme").addEventListener("change", (e) => ($("#lrSubmit").disabled = !e.target.checked));

  const LABELS = {
    codigo: "Código de registro", fecha: "Fecha y hora", nombre: "Nombres y apellidos", tipo_doc: "Tipo de documento", num_doc: "N° de documento",
    domicilio: "Domicilio", telefono: "Teléfono", email: "Correo electrónico", apoderado: "Padre, madre o apoderado",
    bien: "Bien contratado", monto: "Monto reclamado (S/)", descripcion: "Descripción", tipo: "Tipo", detalle: "Detalle", pedido: "Pedido del consumidor"
  };

  lform.addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#lr-err").textContent = "";
    const required = $$("[required]", lform).filter((x) => x.offsetParent !== null);
    const bad = required.find((x) => !x.value.trim() || (x.type === "email" && !EMAIL_RE.test(x.value.trim())));
    required.forEach((x) => x.setAttribute("aria-invalid", String(!x.value.trim())));
    if (bad) {
      bad.setAttribute("aria-invalid", "true");
      $("#lr-err").textContent = bad.type === "email" ? "Escribe un correo válido para enviarte la copia." : "Completa los campos marcados con *.";
      bad.focus(); return;
    }
    const d = new Date();
    const codigo = `OU-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const fecha = `${d.toLocaleDateString("es-PE")} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const raw = Object.fromEntries(new FormData(lform));
    delete raw.conforme; delete raw.menor;
    if (!$("#lr-menor").checked) delete raw.apoderado;
    libroData = { codigo, fecha, ...raw };
    const params = {
      ...libroData, to_email: raw.email, reply_to: raw.email,
      proveedor: PROVEEDOR, ruc: RUC, ruc_texto: RUC ? `— RUC ${RUC}` : "", domicilio_proveedor: CT("direccion"), correo_estudio: CT("email"),
      resumen: Object.entries(libroData).map(([k, v]) => `${LABELS[k] || k}: ${v || "-"}`).join("\n")
    };

    const btn = $("#lrSubmit");
    if (emailReady && EJ.templateLibroEstudio) {
      btn.disabled = true; btn.textContent = "Enviando…";
      try {
        await window.emailjs.send(EJ.serviceId, EJ.templateLibroEstudio, params);
        if (EJ.templateLibroCliente) await window.emailjs.send(EJ.serviceId, EJ.templateLibroCliente, params);
        $("#lrDoneMsg").textContent = "Enviamos una copia a tu correo. Guarda tu código para hacer seguimiento. Te responderemos en un plazo no mayor a 15 días hábiles.";
      } catch (err) {
        console.error(err);
        $("#lr-err").textContent = "No se pudo enviar la hoja. Revisa tu conexión e inténtalo de nuevo.";
        btn.disabled = false; btn.textContent = "Enviar hoja de reclamación"; return;
      }
      btn.textContent = "Enviar hoja de reclamación";
    } else {
      // Sin EmailJS: abre el correo del usuario con la hoja completa (copia al consumidor)
      const subject = `Hoja de Reclamación ${codigo} — ${PROVEEDOR}`;
      const body = `HOJA DE RECLAMACIÓN VIRTUAL\nProveedor: ${PROVEEDOR}${RUC ? ` — RUC ${RUC}` : ""}${CT("direccion") ? `\nDomicilio: ${CT("direccion")}` : ""}\n\n${params.resumen}`;
      window.location.href = `mailto:${CT("email")}?cc=${encodeURIComponent(raw.email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      $("#lrDoneMsg").textContent = "Se abrió tu aplicación de correo con la hoja completa. Envía ese correo para completar el registro. Guarda tu código y te responderemos en un plazo no mayor a 15 días hábiles.";
    }
    $("#lrCode").textContent = codigo;
    $("#lrDate").textContent = fecha;
    buildPrint();
    lform.hidden = true; const done = $("#libroDone"); done.hidden = false; done.focus();
  });

  function buildPrint() {
    if (!libroData) return;
    const rows = Object.entries(libroData).map(([k, v]) => `<tr><th>${esc(LABELS[k] || k)}</th><td>${esc(v || "-")}</td></tr>`).join("");
    $("#printSheet").innerHTML = `
      <h1>Libro de Reclamaciones — Hoja de Reclamación Virtual</h1>
      <p>${[PROVEEDOR, RUC && "RUC " + RUC, CT("direccion")].filter(Boolean).map(esc).join(" — ")}</p>
      <table>${rows}</table>
      <p style="margin-top:12px">La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el Indecopi. El proveedor deberá dar respuesta al reclamo en un plazo no mayor a quince (15) días hábiles.</p>`;
  }
  $("#lrPrint").addEventListener("click", () => window.print());

  /* ---------- WhatsApp flotante: aparece después del hero ---------- */
  const fab = $(".wa-fab");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => fab.classList.toggle("is-away", en.isIntersecting), { threshold: 0.35 }).observe(hero);
  } else fab.classList.remove("is-away");

  /* ---------- Inicio ---------- */
  // fetch necesita servidor (npx serve .); abriendo index.html directo no carga el contenido.
  const loadJSON = (url) => fetch(url, { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .catch((err) => { console.error("No se pudo cargar " + url, err); return null; });
  Promise.all([loadJSON("content/proyectos.json"), loadJSON("content/estudio.json"), loadJSON("content/contacto.json")]).then(([list, est, ct]) => {
    projects = prepProjects(Array.isArray(list) ? list : []);
    studio = est && typeof est === "object" ? est : {};
    contact = ct && typeof ct === "object" && !Array.isArray(ct) ? ct : null;
    buildHero(); applyLang(); goSlide(0);
  });
})();
