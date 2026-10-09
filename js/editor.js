/* Mariday — editing a page right on the site (open any page with ?edit=1 while signed in to /admin).
   Click a text to retype it, click a photo or video to replace it; links get their address changed from the little menu.
   Cards, prices and lists drawn from data (cakes, desserts, FAQ…) are edited in the admin panel instead. */
(function () {
  const M = window.MARIDAY;
  const root = M.root;
  const page = M.pageKey;
  const pending = new Map(); // sel → { sel, kind, value, el, before }
  let current = null;

  function loadStore() {
    return M.store ? Promise.resolve() : new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = `${root}js/store.js?v=1`;
      s.onload = res;
      s.onerror = rej;
      document.head.append(s);
    });
  }

  const css = `
  html.mk-on [data-mk] { cursor: text; }
  html.mk-on [data-mk-kind="img"], html.mk-on [data-mk-kind="video"], html.mk-on [data-mk-kind="bg"] { cursor: copy; }
  html.mk-on [data-mk]:hover { outline: 2px dashed rgba(201, 80, 109, 0.85); outline-offset: 3px; }
  html.mk-on [data-mk].mk-changed { outline: 2px solid #2f8f83; outline-offset: 3px; }
  html.mk-on [data-mk][contenteditable="true"] { outline: 2px solid #c9506d; outline-offset: 4px; background: rgba(255, 255, 255, 0.55); caret-color: #c9506d; }
  html.mk-on .mk-data { outline: 1px dotted rgba(109, 8, 9, 0.35); }
  .mk-bar { position: fixed; z-index: 2147483000; left: 50%; bottom: 18px; translate: -50% 0; display: flex; align-items: center; gap: 10px; padding: 10px 10px 10px 18px; border-radius: 999px; background: #3d0305; color: #fbe6e9; font: 500 14px/1.2 Manrope, system-ui, sans-serif; box-shadow: 0 20px 50px rgba(30, 0, 2, 0.45); max-width: calc(100vw - 24px); flex-wrap: wrap; justify-content: center; }
  .mk-bar b { font-weight: 700; color: #fff; }
  .mk-bar small { opacity: 0.7; }
  .mk-bar button, .mk-bar a { appearance: none; border: 0; border-radius: 999px; padding: 9px 16px; font: 600 13px/1 Manrope, system-ui, sans-serif; cursor: pointer; text-decoration: none; }
  .mk-save { background: #f5bcc8; color: #3d0305; }
  .mk-save:disabled { opacity: 0.45; cursor: default; }
  .mk-ghost { background: rgba(255, 255, 255, 0.12); color: #fbe6e9; }
  .mk-pop { position: fixed; z-index: 2147483001; display: flex; gap: 4px; padding: 5px; border-radius: 14px; background: #3d0305; box-shadow: 0 12px 30px rgba(30, 0, 2, 0.4); }
  .mk-pop button { appearance: none; border: 0; border-radius: 10px; padding: 7px 10px; background: rgba(255, 255, 255, 0.1); color: #fbe6e9; font: 600 12px/1 Manrope, system-ui, sans-serif; cursor: pointer; white-space: nowrap; }
  .mk-pop button:hover { background: rgba(255, 255, 255, 0.22); }
  .mk-toast { position: fixed; z-index: 2147483002; left: 50%; top: 18px; translate: -50% 0; padding: 12px 18px; border-radius: 14px; background: #fff; color: #3d0305; font: 600 14px/1.3 Manrope, system-ui, sans-serif; box-shadow: 0 16px 40px rgba(30, 0, 2, 0.3); }
  .mk-toast.is-bad { background: #ffe1e1; }
  .mk-tip { position: fixed; z-index: 2147483001; max-width: 260px; padding: 8px 12px; border-radius: 10px; background: #3d0305; color: #fbe6e9; font: 500 12px/1.35 Manrope, system-ui, sans-serif; pointer-events: none; }
  `;

  function toast(msg, bad) {
    const t = document.createElement("div");
    t.className = "mk-toast" + (bad ? " is-bad" : "");
    t.textContent = msg;
    document.body.append(t);
    setTimeout(() => t.remove(), bad ? 6000 : 2600);
  }

  // ── the bar at the bottom
  const bar = document.createElement("div");
  bar.className = "mk-bar";
  bar.setAttribute("data-no-edit", "");
  bar.innerHTML = `<span>✎ <b>Редагування сторінки</b> <small data-mk-count>· клікніть текст або фото</small></span>
    <button type="button" class="mk-save" data-mk-save disabled>Зберегти</button>
    <button type="button" class="mk-ghost" data-mk-undo hidden>Скасувати</button>
    <a class="mk-ghost" href="${root}admin/">Адмінка</a>
    <a class="mk-ghost" data-mk-exit href="#">Вийти з режиму</a>`;
  const count = bar.querySelector("[data-mk-count]");
  const saveBtn = bar.querySelector("[data-mk-save]");
  const undoBtn = bar.querySelector("[data-mk-undo]");
  const refresh = () => {
    const n = pending.size;
    count.textContent = n ? `· ${n} ${n === 1 ? "зміна" : n < 5 ? "зміни" : "змін"} не збережено` : "· клікніть текст або фото";
    saveBtn.disabled = !n;
    undoBtn.hidden = !n;
  };

  // ── one change
  function record(el, kind, value, before) {
    const sel = el.dataset.mk;
    const prev = pending.get(sel);
    pending.set(sel, { sel, kind, value, el, before: prev ? prev.before : before });
    el.classList.add("mk-changed");
    refresh();
  }

  // ── text
  function startText(el) {
    if (current === el) return;
    stopText();
    current = el;
    el.dataset.mkBefore = el.innerHTML;
    el.contentEditable = "true";
    el.focus();
  }
  function stopText() {
    const el = current;
    if (!el) return;
    current = null;
    el.removeAttribute("contenteditable");
    const before = el.dataset.mkBefore;
    delete el.dataset.mkBefore;
    const html = M.cleanHTML(el.innerHTML).replace(/(<br>)+$/, "");
    if (html === before) return;
    const plain = !el.children.length;
    record(el, plain ? "text" : "html", plain ? el.textContent : html, before);
  }

  // ── pictures
  function pick(accept) {
    return new Promise((res) => {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = accept;
      inp.onchange = () => res(inp.files[0] || null);
      inp.click();
    });
  }
  async function replaceMedia(el) {
    const kind = el.dataset.mkKind;
    const file = await pick(kind === "video" ? "video/mp4,video/webm" : "image/*");
    if (!file) return;
    toast("Завантажую…");
    try {
      const url = await M.store.upload(file, "uploads");
      const before = kind === "bg" ? el.style.backgroundImage : el.getAttribute("src");
      if (kind === "img") { el.src = url; el.removeAttribute("srcset"); }
      else if (kind === "video") { el.src = url; el.removeAttribute("poster"); el.play && el.play().catch(() => {}); }
      else el.style.backgroundImage = `url("${url}")`;
      record(el, kind, url, before);
    } catch (e) { toast(e.message, true); }
  }

  // ── links
  function editLink(a) {
    const url = prompt("Адреса посилання (https://…, pages/cakes.html, mailto:…, tel:…):", a.getAttribute("href") || "");
    if (url == null) return;
    const target = a.dataset.mk ? a : null;
    if (!target) return toast("Це посилання створюється скриптом — його адреса задається в адмінці", true);
    // stored as its own row («…|href»), so a link's text and its address can both be changed
    const sel = target.dataset.mk + "|href";
    const prev = pending.get(sel);
    pending.set(sel, { sel, kind: "href", value: url, el: target, before: prev ? prev.before : a.getAttribute("href") });
    a.setAttribute("href", url);
    target.classList.add("mk-changed");
    refresh();
  }

  // ── the little menu over the chosen element
  const pop = document.createElement("div");
  pop.className = "mk-pop";
  pop.setAttribute("data-no-edit", "");
  pop.hidden = true;
  let popFor = null;
  function showPop(el) {
    popFor = el;
    const link = el.closest("a");
    const kind = el.dataset.mkKind;
    pop.innerHTML = [
      kind === "text" ? '<button type="button" data-a="text">✎ Текст</button>' : "",
      kind === "img" || kind === "bg" ? '<button type="button" data-a="media">🖼 Замінити фото</button>' : "",
      kind === "video" ? '<button type="button" data-a="media">🎬 Замінити відео</button>' : "",
      link ? '<button type="button" data-a="link">🔗 Посилання</button>' : "",
      '<button type="button" data-a="reset">↺ Як було</button>',
    ].join("");
    const r = el.getBoundingClientRect();
    pop.hidden = false;
    pop.style.left = Math.max(8, Math.min(innerWidth - pop.offsetWidth - 8, r.left)) + "px";
    pop.style.top = (r.top > 56 ? r.top - pop.offsetHeight - 8 : r.bottom + 8) + "px";
  }
  pop.addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b || !popFor) return;
    const el = popFor;
    pop.hidden = true;
    if (b.dataset.a === "text") startText(el);
    if (b.dataset.a === "media") replaceMedia(el);
    if (b.dataset.a === "link") editLink(el.closest("a"));
    if (b.dataset.a === "reset") {
      if (!confirm("Повернути цей елемент до початкового вигляду?")) return;
      try {
        await M.store.resetEdits(page, el.dataset.mk);
        await M.store.resetEdits(page, el.dataset.mk + "|href");
        pending.clear();
        location.reload();
      } catch (err) { toast(err.message, true); }
    }
  });

  // ── clicks: inside the page nothing navigates while editing
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-no-edit]")) return;
    const el = e.target.closest("[data-mk]");
    const a = e.target.closest("a");
    if (a) e.preventDefault();
    if (!el) {
      stopText();
      pop.hidden = true;
      if (a || e.target.closest("button")) toast("Цей блок будується з даних — редагуйте його в адмінці (Торти, Десерти, FAQ…)");
      return;
    }
    if (el === current) return;
    e.preventDefault();
    e.stopPropagation();
    stopText();
    const kind = el.dataset.mkKind;
    if (kind === "text" && !a) startText(el);
    else showPop(el);
  }, true);
  document.addEventListener("focusout", (e) => { if (e.target === current) setTimeout(() => { if (document.activeElement !== current) stopText(); }, 0); });
  document.addEventListener("keydown", (e) => {
    if (!current) return;
    if (e.key === "Escape") { current.innerHTML = current.dataset.mkBefore; stopText(); }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); current.blur(); }
  });
  // pasted text comes in plain, without someone else's styles
  document.addEventListener("paste", (e) => {
    if (!current) return;
    e.preventDefault();
    document.execCommand("insertText", false, (e.clipboardData || window.clipboardData).getData("text/plain"));
  });

  // ── save / undo / exit
  saveBtn.addEventListener("click", async () => {
    stopText();
    saveBtn.disabled = true;
    saveBtn.textContent = "Зберігаю…";
    try {
      await M.store.saveEdits(page, [...pending.values()].map(({ sel, kind, value }) => ({ sel, kind, value })));
      pending.forEach((v) => v.el.classList.remove("mk-changed"));
      pending.clear();
      toast(M.store.live && !M.store.session.demo ? "Збережено — зміни вже на сайті ✓" : "Збережено в пробному режимі (бачите лише ви) ✓");
    } catch (err) { toast(err.message, true); }
    saveBtn.textContent = "Зберегти";
    refresh();
  });
  undoBtn.addEventListener("click", () => {
    stopText();
    pending.forEach((v) => {
      if (v.kind === "text" || v.kind === "html") v.el.innerHTML = v.before;
      else if (v.kind === "img" || v.kind === "video") v.el.setAttribute("src", v.before || "");
      else if (v.kind === "bg") v.el.style.backgroundImage = v.before;
      else if (v.kind === "href") v.el.setAttribute("href", v.before || "");
      v.el.classList.remove("mk-changed");
    });
    pending.clear();
    refresh();
  });
  bar.querySelector("[data-mk-exit]").addEventListener("click", (e) => {
    e.preventDefault();
    if (pending.size && !confirm("Є незбережені зміни. Вийти без збереження?")) return;
    const u = new URL(location.href);
    u.searchParams.delete("edit");
    location.href = u.toString();
  });
  addEventListener("beforeunload", (e) => { if (pending.size) { e.preventDefault(); e.returnValue = ""; } });

  // hint over blocks that come from data
  const tip = document.createElement("div");
  tip.className = "mk-tip";
  tip.hidden = true;
  document.addEventListener("pointermove", (e) => {
    const t = e.target;
    const data = !t.closest("[data-mk], [data-no-edit]") && t.closest("a, article, li, figure");
    tip.hidden = !data;
    if (data) {
      tip.textContent = "Цей блок береться з даних — редагуйте в адмінці";
      tip.style.left = Math.min(innerWidth - 270, e.clientX + 14) + "px";
      tip.style.top = e.clientY + 16 + "px";
    }
  }, { passive: true });

  loadStore().then(() => {
    const st = document.createElement("style");
    st.textContent = css;
    document.head.append(st);
    document.documentElement.classList.add("mk-on");
    document.body.append(bar, pop, tip);
    refresh();
  }).catch(() => alert("Не вдалося завантажити редактор"));
})();
