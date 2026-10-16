/* Mariday — the cake constructor (pages/constructor.html, css/constructor.css).
   A quiet studio: the cake stands in real 3D on a porcelain stand (js/cake3d.js) and turns all the way round,
   five steps sit next to it — size and shape (the top shows how it is cut for the guests), filling (the cake is
   cut open; filter by taste, sweetness and sourness), coating (six textures, 38 colours, your own colour,
   palettes, a drip in any colour, a backdrop for the studio), piped decor, last touches (toppings spread over the
   whole cake, as a wreath or in a bunch; an inscription in twelve hands and any size; idea and photos)
   — with the price and «Далі» at the bottom. The stage has undo, «Навмання», a day / evening light and
   candles to blow out; the last step makes a postcard of the cake.
   The design lives in the URL (?shape=…&size=…&flavor=…&step=…), so links from other pages open it ready;
   older links (?coat=ruffles, ?coat=drip, ?decor=medium…) are translated. Prices are in euro, the final one is
   confirmed by a manager. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const M = () => window.MARIDAY;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => window.escapeHTML(s);
  const eur = (n) => window.formatEUR(n);
  const params = new URLSearchParams(location.search);

  const plural = (n, one, few, many) => (n % 10 === 1 && n % 100 !== 11 ? one : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many);
  const pickOne = (a) => a[Math.floor(Math.random() * a.length)];

  /* ───────── what can be chosen ───────── */
  const OPT = {
    base: 95,
    shapes: {
      round: { name: "Коло", add: 0 },
      heart: { name: "Серце", add: 15 },
      square: { name: "Квадрат", add: 10 },
      flower: { name: "Квітка", add: 15 },
    },
    coats: {
      smooth: { name: "Гладке", add: 0, note: "рівні грані, як шовк" },
      strokes: { name: "Мазки", add: 0, note: "живі мазки шпателем" },
      ombre: { name: "Омбре", add: 15, note: "від насиченого до світлого" },
      velvet: { name: "Велюр", add: 20, note: "матовий, оксамитовий" },
      marble: { name: "Мармур", add: 25, note: "прожилки й нитка золота" },
      pearl: { name: "Перламутр", add: 20, note: "м’яке райдужне сяйво" },
    },
    // the cream colours, in families: whites, yellows, pinks, berries, purples, blues, greens, browns
    colors: {
      milk: { name: "Молочний", hex: "#fbf5ec" },
      snow: { name: "Білосніжний", hex: "#fffdfa" },
      vanilla: { name: "Ванільний", hex: "#f6e8c4" },
      butter: { name: "Вершковий", hex: "#f8dc9e" },
      lemon: { name: "Лимонний", hex: "#f6e27e" },
      peach: { name: "Персиковий", hex: "#f7c3a3" },
      apricot: { name: "Абрикосовий", hex: "#f4a46c" },
      powder: { name: "Ніжно-рожевий", hex: "#f3b9c6" },
      blush: { name: "Пудровий", hex: "#e9c9c3" },
      rose: { name: "Трояндовий", hex: "#ea94ad" },
      coral: { name: "Кораловий", hex: "#f08a7e" },
      fuchsia: { name: "Фуксія", hex: "#d6367f" },
      raspberry: { name: "Малиновий", hex: "#c2263f" },
      cherry: { name: "Вишневий", hex: "#7c0f16" },
      bordeaux: { name: "Бордо", hex: "#4f0c1e" },
      plum: { name: "Сливовий", hex: "#6b2850" },
      mauve: { name: "Ліловий", hex: "#a97c9f" },
      lilac: { name: "Бузковий", hex: "#d9c0ec" },
      lavender: { name: "Лавандовий", hex: "#b4a0de" },
      violet: { name: "Фіалковий", hex: "#6e4fa6" },
      sky: { name: "Небесний", hex: "#b5d0ef" },
      cornflower: { name: "Волошковий", hex: "#7f9fd6" },
      aqua: { name: "Бірюзовий", hex: "#7fcfc9" },
      teal: { name: "Морська хвиля", hex: "#2c7b7d" },
      navy: { name: "Нічний", hex: "#2c3e66" },
      ice: { name: "Мʼятний", hex: "#cde9e3" },
      pistachio: { name: "Фісташковий", hex: "#c5d89c" },
      sage: { name: "Шавлія", hex: "#a3b89c" },
      olive: { name: "Оливковий", hex: "#8c8f52" },
      emerald: { name: "Смарагдовий", hex: "#1d6a4e" },
      caramel: { name: "Карамельний", hex: "#c98a5a" },
      latte: { name: "Латте", hex: "#dcbf9e" },
      terracotta: { name: "Теракотовий", hex: "#c2673f" },
      mocha: { name: "Мокко", hex: "#8b5d47" },
      choco: { name: "Шоколадний", hex: "#5b3427" },
      graphite: { name: "Графіт", hex: "#2e2a2b" },
      black: { name: "Чорний", hex: "#171415" },
    },
    drips: {
      none: { name: "Без патьоків", hex: "", add: 0 },
      dark: { name: "Чорний шоколад", hex: "#3b1b13", add: 25 },
      milkc: { name: "Молочний шоколад", hex: "#7a4a32", add: 25 },
      white: { name: "Білий шоколад", hex: "#f6ebdc", add: 25 },
      caramel: { name: "Солона карамель", hex: "#c98a3c", add: 25 },
      berry: { name: "Ягідний", hex: "#b3173a", add: 25 },
      pink: { name: "Рожевий", hex: "#f08aa8", add: 25 },
      gold: { name: "Золото", hex: "#d8b25a", add: 35, gold: true },
    },
    palettes: [
      { name: "Полуниця з вершками", color: "powder", decor: "milk", drip: "none" },
      { name: "Лавандове поле", color: "lavender", decor: "milk", drip: "none" },
      { name: "Мʼятний шоколад", color: "ice", decor: "choco", drip: "dark" },
      { name: "Вишневий сад", color: "cherry", decor: "milk", drip: "white" },
      { name: "Персик і золото", color: "peach", decor: "milk", drip: "gold" },
      { name: "Чорнило", color: "navy", decor: "sky", drip: "none" },
      { name: "Фісташка", color: "pistachio", decor: "milk", drip: "none" },
      { name: "Графіт і золото", color: "graphite", decor: "graphite", drip: "gold" },
      { name: "Лимонний сорбет", color: "lemon", decor: "milk", drip: "white" },
      { name: "Карамель", color: "caramel", decor: "vanilla", drip: "caramel" },
      { name: "Барбі", color: "fuchsia", decor: "powder", drip: "pink" },
      { name: "Морський бриз", color: "aqua", decor: "snow", drip: "white" },
      { name: "Смарагд і золото", color: "emerald", decor: "milk", drip: "gold" },
      { name: "Бордо", color: "bordeaux", decor: "blush", drip: "gold" },
      { name: "Теракота", color: "terracotta", decor: "latte", drip: "caramel" },
      { name: "Фіалка", color: "violet", decor: "lilac", drip: "white" },
      { name: "Олива", color: "olive", decor: "vanilla", drip: "none" },
      { name: "Кава з молоком", color: "latte", decor: "mocha", drip: "milkc" },
      { name: "Абрикос", color: "apricot", decor: "snow", drip: "none" },
      { name: "Нуар", color: "black", decor: "snow", drip: "gold" },
    ],
    decor: {
      none: { name: "Без рюшів", note: "тільки обране покриття", add: 0 },
      dots: { name: "Рюші-пушинки", note: "кульки крему по верхньому краю", add: 10 },
      shells: { name: "Прості рюші", note: "кремові ракушки зверху й знизу", add: 15 },
      garland: { name: "Хвилі", note: "ракушки й гірлянди по боках", add: 30 },
      frills: { name: "Обʼємні рюші", note: "вінтаж — кілька рядів воланів", add: 45 },
    },
    toppings: {
      cherries: { name: "Вишні", note: "глянцеві, по бортику", add: 8 },
      strawberries: { name: "Полуниці", note: "цілі й половинки", add: 12 },
      berries: { name: "Ягоди", note: "малина й лохина", add: 12 },
      macarons: { name: "Макарони", note: "французькі, пастель", add: 14 },
      meringues: { name: "Безе", note: "поцілунки по краю", add: 8 },
      flowers: { name: "Квіти", note: "кремові квіточки", add: 18 },
      butterflies: { name: "Метелики", note: "вафельні, літають", add: 14 },
      bows: { name: "Бантики", note: "атласні, по боках", add: 6 },
      pearls: { name: "Перлинки", note: "цукрова нитка", add: 8 },
      shards: { name: "Шоколадні вітрила", note: "темний і білий", add: 12 },
      candles: { name: "Свічки", note: "смугасті, з вогником", add: 5 },
      sprinkles: { name: "Посипка", note: "кольорова, по низу", add: 6 },
      gold: { name: "Золото", note: "харчова поталь", add: 15 },
    },
    fonts: {
      script: { name: "Каліграфія", css: "font-family:var(--font-script);font-size:1.55rem" },
      hand: { name: "Від руки", css: "font-family:var(--font-hand);font-weight:700;font-size:1.35rem" },
      serif: { name: "Класика", css: "font-family:var(--font-display);font-style:italic;font-size:1.1rem" },
      block: { name: "Гротеск", css: "font-family:var(--font-wide);font-weight:600;font-size:0.78rem;letter-spacing:.04em", caps: true },
      lobster: { name: "Леттеринг", css: "font-family:'Lobster',cursive;font-size:1.25rem" },
      pacifico: { name: "Ретро", css: "font-family:'Pacifico',cursive;font-size:1rem" },
      marck: { name: "Листівка", css: "font-family:'Marck Script',cursive;font-size:1.4rem" },
      bad: { name: "Шкільний", css: "font-family:'Bad Script',cursive;font-size:1.15rem" },
      amatic: { name: "Тонкий", css: "font-family:'Amatic SC',sans-serif;font-weight:700;font-size:1.5rem" },
      comfortaa: { name: "Округлий", css: "font-family:'Comfortaa',sans-serif;font-weight:700;font-size:0.95rem" },
      cormorant: { name: "Вишуканий", css: "font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:600;font-size:1.3rem" },
      dela: { name: "Жирний", css: "font-family:'Dela Gothic One',sans-serif;font-size:0.82rem", caps: true },
    },
    // how the fruit, berries, flowers and macarons are laid out
    places: { all: "По всьому торту", ring: "Вінком", heap: "Букетом" },
    // the studio backdrop behind the cake (and on the postcard): the cake's own wash, a plain colour or a pattern
    bgs: {
      auto: { name: "Під колір торта" },
      linen: { name: "Льон", hex: "#f3ece3" },
      white: { name: "Білий", hex: "#fdfcfb" },
      blush: { name: "Пудра", hex: "#f5dcdc" },
      butter: { name: "Вершки", hex: "#f7ebc8" },
      sage: { name: "Шавлія", hex: "#dde6d5" },
      sky: { name: "Небо", hex: "#dbe7f3" },
      lilac: { name: "Бузок", hex: "#e7ddf1" },
      clay: { name: "Глина", hex: "#ecc9b4" },
      ink: { name: "Графіт", hex: "#2a2628", dark: true },
      gingham: { name: "Віші", hex: "#fbf4f2", pattern: "gingham", ink: "#f2bdc8" },
      stripes: { name: "Смужка", hex: "#fbf6ef", pattern: "stripes", ink: "#f4d6be" },
      dots: { name: "Горошок", hex: "#f9f4ef", pattern: "dots", ink: "#e8b3be" },
    },
    textColors: ["auto", "cherry", "choco", "milk", "gold", "rose", "navy", "graphite"],
    // radius and height of every tier (the cake is about 1 unit across)
    tiers: {
      "1.5": [[0.86, 0.98]],
      "2": [[0.96, 1.04]],
      "2.5": [[1.05, 1.08]],
      "3": [[1.13, 1.12]],
      "4": [[1.16, 0.9], [0.8, 0.82]],
      tier: [[1.2, 0.8], [0.9, 0.74], [0.62, 0.7]],
    },
    presets: [
      { name: "Вінтажне серце", st: { shape: "heart", size: "1.5", flavor: "vanilla-berry", coat: "smooth", color: "powder", drip: "none", decor: "shells", decorColor: "sky", toppings: ["cherries", "bows"], text: "Love you", font: "script" } },
      { name: "Весільна класика", st: { shape: "round", size: "tier", flavor: "vanilla-berry", coat: "pearl", color: "milk", drip: "none", decor: "frills", decorColor: "milk", toppings: ["flowers", "pearls"], text: "", font: "script" } },
      { name: "Дитяче свято", st: { shape: "round", size: "2", flavor: "berry-forest", coat: "smooth", color: "sky", drip: "pink", decor: "dots", decorColor: "milk", toppings: ["sprinkles", "macarons", "candles"], text: "Happy B-day", font: "block" } },
      { name: "Мармур і золото", st: { shape: "round", size: "2.5", flavor: "plombir", coat: "marble", color: "milk", drip: "gold", decor: "none", decorColor: "milk", toppings: ["shards", "gold"], text: "", font: "serif" } },
      { name: "Лавандове омбре", st: { shape: "round", size: "2", flavor: "lemon-raspberry", coat: "ombre", color: "lavender", drip: "none", decor: "shells", decorColor: "milk", toppings: ["butterflies", "pearls"], text: "", font: "script" } },
      { name: "Квітковий сад", st: { shape: "flower", size: "2", flavor: "pistachio-raspberry", coat: "velvet", color: "peach", drip: "none", decor: "garland", decorColor: "milk", toppings: ["flowers", "strawberries"], text: "", font: "hand" } },
      { name: "Шоколадний", st: { shape: "round", size: "2.5", flavor: "cherry-duo-choc", coat: "smooth", color: "cherry", drip: "dark", decor: "dots", decorColor: "milk", toppings: ["cherries", "gold"], text: "", font: "script" } },
      { name: "Графіт", st: { shape: "square", size: "2", flavor: "kinder", coat: "velvet", color: "graphite", drip: "gold", decor: "none", decorColor: "milk", toppings: ["shards", "strawberries"], text: "", font: "block" } },
      { name: "Мінімалізм", st: { shape: "square", size: "1.5", flavor: "pistachio-raspberry", coat: "strokes", color: "milk", drip: "none", decor: "none", decorColor: "milk", toppings: ["berries"], text: "", font: "serif" } },
    ],
  };
  // older links from other pages
  const LEGACY = {
    coat: { texture: "strokes", ruffles: "smooth", drip: "smooth" },
    decor: { light: "none", medium: "shells", complex: "garland", sculpt: "frills" },
  };

  const STEPS = [
    { tab: "Розмір", title: "Розмір і форма", lede: "Скільки гостей — стільки й торта. На торті видно, як його поріжуть." },
    { tab: "Начинка", title: "Найсмачніше — всередині", lede: "Оберіть начинку й подивіться на неї в розрізі." },
    { tab: "Покриття", title: "Покриття і колір", lede: "Фактура, відтінок і патьоки — як вам до смаку." },
    { tab: "Декор", title: "Декор торта", lede: "Рюші з крему — від легкого бортика до вінтажних воланів." },
    { tab: "Штрихи", title: "Останні штрихи", lede: "Ягідки, метелики, напис — і торт готовий." },
  ];

  const isDark = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return (n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
  };
  // a colour of your own travels as «x» + six hex digits
  const isCustom = (id) => /^x[0-9a-f]{6}$/i.test(String(id || ""));
  const colorOf = (id) => (isCustom(id) ? { name: "Свій колір", hex: "#" + id.slice(1).toLowerCase() } : OPT.colors[id] || OPT.colors.powder);
  const validColor = (id) => isCustom(id) || !!OPT.colors[id];
  const mix = (hex, to, k) => {
    const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
    const ch = (s) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k);
    return "#" + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
  };
  const flavorById = (id) => M().flavors.find((f) => f.id === id) || M().flavors[0];
  const metaOf = (id) => (M().flavorMeta || {})[id] || { img: "slice", layers: ["#f0dca0", "#f7efe6", "#c2263f"] };
  // sizes added in the admin get tiers by their weight
  const tiersFor = (id) => {
    if (OPT.tiers[id]) return OPT.tiers[id];
    const w = parseFloat(id) || 2;
    if (w > 3.5) return OPT.tiers["4"];
    const r = 0.86 + (Math.min(w, 3.5) - 1.5) * 0.18;
    return [[r, 0.98 + (Math.min(w, 3.5) - 1.5) * 0.07]];
  };
  const shortDesc = (s) => String(s || "").split(/[.,]/)[0];

  /* little line icons for the toppings, coats and the stage */
  const ICON = {
    cherries: '<circle cx="8" cy="16" r="4"/><circle cx="16.5" cy="17" r="3.5"/><path d="M8 12c1-4 4-7 8-8M16.5 13.5C16 10 16 7 16 4"/>',
    strawberries: '<path d="M12 21c-5-3-7-7-6-10 1-2 3-3 6-3s5 1 6 3c1 3-1 7-6 10Z"/><path d="M8.5 6 12 8l3.5-2M12 8V4"/><path d="M10 12h.01M14 12h.01M12 15h.01"/>',
    berries: '<circle cx="8" cy="9" r="3"/><circle cx="14" cy="8" r="3"/><circle cx="11" cy="14" r="3"/><circle cx="17" cy="15" r="3"/>',
    macarons: '<path d="M4 9a8 4 0 0 1 16 0Z"/><path d="M4 11h16"/><path d="M4 13a8 4 0 0 0 16 0Z"/>',
    meringues: '<path d="M6 19h12c0-4-2-6-4-7 1-2 0-5-2-7-2 2-3 5-2 7-2 1-4 3-4 7Z"/>',
    flowers: '<circle cx="12" cy="12" r="2"/><path d="M12 10c-2-3-1-6 0-6s2 3 0 6Zm2 2c3-2 6-1 6 0s-3 2-6 0Zm-2 2c2 3 1 6 0 6s-2-3 0-6Zm-2-2c-3 2-6 1-6 0s3-2 6 0Z"/>',
    butterflies: '<path d="M12 8v10"/><path d="M12 11C10 5 4 4 4 8s4 5 8 3Zm0 0c2-6 8-7 8-3s-4 5-8 3Zm0 2c-2 0-6 1-5 4s4 1 5-2Zm0 0c2 0 6 1 5 4s-4 1-5-2Z"/>',
    bows: '<path d="M12 12 5 8v8Zm0 0 7-4v8Z"/><path d="m11 13-2 7m4-7 2 7"/>',
    pearls: '<circle cx="5" cy="12" r="2"/><circle cx="10" cy="12" r="2.4"/><circle cx="15" cy="12" r="2"/><circle cx="20" cy="12" r="1.6"/>',
    shards: '<path d="m6 20 3-15 3 15Z"/><path d="m11 20 5-12 3 12Z"/>',
    candles: '<rect x="9" y="10" width="6" height="11" rx="1"/><path d="M12 10V8M12 3c-2 2-2 4 0 5 2-1 2-3 0-5Z"/>',
    sprinkles: '<path d="m5 7 2 2M15 5l-1 3M19 11l-3 1M8 15l-2 2M12 12l1 3M17 18l2 1M10 20l1-2"/>',
    gold: '<path d="M5 17c2-7 6-11 14-12-1 8-5 12-12 14Z"/><path d="M5 17l7-7"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    wind: '<path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h8"/>',
  };
  const ico = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;

  /* ───────── the studio ───────── */
  function studio() {
    const root = $("#maisternia");
    if (!root || !M()) return;
    const sizes = M().sizes;
    const flavors = M().flavors;
    const pick = (key, table, fallback) => {
      const raw = params.get(key);
      const v = (LEGACY[key] && LEGACY[key][raw]) || raw;
      return table[v] ? v : fallback;
    };
    const st = {
      shape: pick("shape", OPT.shapes, "round"),
      size: sizes.some((s) => s.id === params.get("size")) ? params.get("size") : (sizes.find((s) => s.id === "2") || sizes[0]).id,
      flavor: flavors.some((f) => f.id === params.get("flavor")) ? params.get("flavor") : flavors[0].id,
      coat: pick("coat", OPT.coats, "smooth"),
      color: validColor(params.get("color")) ? params.get("color") : "powder",
      drip: OPT.drips[params.get("drip")] ? params.get("drip") : params.get("coat") === "drip" ? "dark" : "none",
      decor: params.get("coat") === "ruffles" && !params.get("decor") ? "frills" : pick("decor", OPT.decor, "shells"),
      decorColor: validColor(params.get("dcolor")) ? params.get("dcolor") : "milk",
      toppings: (params.get("top") ?? "cherries").split(",").filter((t) => OPT.toppings[t]),
      text: (params.get("text") || "").slice(0, 24),
      font: OPT.fonts[params.get("font")] ? params.get("font") : "script",
      textColor: OPT.textColors.includes(params.get("tcolor")) ? params.get("tcolor") : "auto",
      textSize: Math.min(130, Math.max(60, parseInt(params.get("tsize"), 10) || 100)),
      place: OPT.places[params.get("place")] ? params.get("place") : "all",
      bg: OPT.bgs[params.get("bg")] ? params.get("bg") : "auto",
      idea: "",
      photos: [],
    };
    const IDEA_KEY = "mariday:ctor-idea";
    try { Object.assign(st, (({ idea = "", photos = [] }) => ({ idea: String(idea).slice(0, 1000), photos: photos.slice(0, 10) }))(JSON.parse(sessionStorage.getItem(IDEA_KEY)) || {})); } catch (e) { /* nothing kept */ }
    const keepIdea = () => { try { sessionStorage.setItem(IDEA_KEY, JSON.stringify({ idea: st.idea, photos: st.photos })); } catch (e) { /* storage off */ } };
    let board = null;
    const withIdeas = (fn) => (window.MaridayIdeas ? fn(window.MaridayIdeas) : document.addEventListener("mariday:ideas", () => fn(window.MaridayIdeas), { once: true }));
    withIdeas((I) => {
      board = I.board({ photos: st.photos, hint: "торт, який сподобався, кольори, настрій — що завгодно", onChange: (urls) => { st.photos = urls; keepIdea(); } });
      const host = $("[data-idea-photos]", root);
      if (host) board.mount(host);
    });

    let step = Math.min(4, Math.max(0, parseInt(params.get("step"), 10) || 0));
    let touched = false;
    let guests = null;
    let mood = "all";
    let night = false;

    const stage = $("[data-stage]", root);
    const canvasHost = $("[data-canvas]", root);
    const pane = $("[data-pane]", root);
    const stepsNav = $("[data-steps]", root);
    const priceEl = $("[data-price]", root);
    const nextBtn = $("[data-next]", root);
    const prevBtn = $("[data-prev]", root);

    const sizeObj = () => sizes.find((s) => s.id === st.size) || sizes[0];
    const sizePrice = (s) => Math.round(OPT.base * s.priceMult);
    const lines = () => [
      [`Основа ${sizeObj().label} · ${flavorById(st.flavor).name}`, sizePrice(sizeObj())],
      ...(OPT.shapes[st.shape].add ? [[`Форма: ${OPT.shapes[st.shape].name.toLowerCase()}`, OPT.shapes[st.shape].add]] : []),
      [`Покриття: ${OPT.coats[st.coat].name.toLowerCase()}, ${colorOf(st.color).name.toLowerCase()}`, OPT.coats[st.coat].add],
      ...(st.drip !== "none" ? [[`Патьоки: ${OPT.drips[st.drip].name.toLowerCase()}`, OPT.drips[st.drip].add]] : []),
      [`Декор: ${OPT.decor[st.decor].name.toLowerCase()}`, OPT.decor[st.decor].add],
      ...st.toppings.map((t) => [OPT.toppings[t].name, OPT.toppings[t].add]),
    ];
    const price = () => lines().reduce((s, [, v]) => s + v, 0);
    const rangeOf = (s) => (String(s.serves).match(/\d+/g) || ["10"]).map(Number);
    const guestsOf = (s) => { const n = rangeOf(s); return n.length > 1 ? Math.round((n[0] + n[1]) / 2) : n[0] + 4; };
    const sizeForGuests = (g) => {
      const list = sizes.filter((s) => rangeOf(s).length > 1);
      return (list.find((s) => rangeOf(s)[1] >= g) || sizes.find((s) => s.id === "tier") || sizes[sizes.length - 1]).id;
    };
    if (guests === null) guests = guestsOf(sizeObj());

    function syncURL(force) {
      if (!touched && !force) return location.href;
      const u = new URL(location.href);
      u.search = new URLSearchParams({
        shape: st.shape, size: st.size, flavor: st.flavor, coat: st.coat, color: st.color, drip: st.drip, decor: st.decor, dcolor: st.decorColor, top: st.toppings.join(","),
        ...(st.place !== "all" ? { place: st.place } : {}), ...(st.bg !== "auto" ? { bg: st.bg } : {}),
        ...(st.text ? { text: st.text, font: st.font, tcolor: st.textColor, ...(st.textSize !== 100 ? { tsize: String(st.textSize) } : {}) } : {}), step: String(step),
      }).toString();
      history.replaceState(null, "", u);
      return u.href;
    }

    /* ── undo / redo: every choice is a snapshot of the design ── */
    const KEYS = ["shape", "size", "flavor", "coat", "color", "drip", "decor", "decorColor", "toppings", "text", "font", "textColor", "textSize", "place", "bg"];
    const snap = () => JSON.stringify(KEYS.map((k) => st[k]));
    const past = [snap()];
    let at = 0;
    function commit() {
      const s = snap();
      if (s === past[at]) return;
      past.splice(at + 1);
      past.push(s);
      if (past.length > 60) past.shift();
      at = past.length - 1;
      paintHistory();
    }
    function travel(dir) {
      const to = at + dir;
      if (to < 0 || to >= past.length) return;
      const before = st.size;
      at = to;
      JSON.parse(past[at]).forEach((v, i) => (st[KEYS[i]] = Array.isArray(v) ? v.slice() : v));
      if (st.size !== before) guests = guestsOf(sizeObj());
      touched = true;
      paintAll({ grow: st.size !== before });
      refreshPane();
      paintHistory();
    }
    function paintHistory() {
      $("[data-undo]", root).disabled = at === 0;
      $("[data-redo]", root).disabled = at === past.length - 1;
    }

    /* ── the 3D cake ── */
    const cream = () => colorOf(st.color).hex;
    const textHex = () => {
      if (st.textColor === "gold") return "#c9a14a";
      if (st.textColor !== "auto") return colorOf(st.textColor).hex;
      return isDark(cream()) ? "#fff6ec" : st.decorColor !== "milk" && st.decorColor !== st.color ? colorOf(st.decorColor).hex : "#6d0809";
    };
    const design = () => ({
      shape: st.shape,
      tiers: tiersFor(st.size),
      coat: st.coat,
      color: cream(),
      drip: st.drip !== "none" ? OPT.drips[st.drip].hex : null,
      dripGold: !!OPT.drips[st.drip].gold,
      decor: st.decor,
      decorColor: colorOf(st.decorColor).hex,
      toppings: st.toppings.slice().sort(),
      text: st.text,
      textColor: textHex(),
      textFont: st.font,
      textSize: st.textSize / 100,
      place: st.place,
      layers: metaOf(st.flavor).layers,
      seed: 5,
    });
    let cake = null;
    try { cake = window.MaridayCake3D && window.MaridayCake3D.create(canvasHost); } catch (e) { cake = null; }
    if (!cake) {
      // no WebGL: a real photo of the chosen flavour stands in
      stage.classList.add("is-flat");
      canvasHost.innerHTML = `<img class="kc-flat" alt="" src="${esc(M().img(metaOf(st.flavor).img))}">`;
    }
    function paintCake(fx) {
      if (cake) cake.update(design(), fx);
      else { const im = $(".kc-flat", canvasHost); if (im) im.src = M().img(metaOf(st.flavor).img); }
    }

    /* ── the labels on the stage, its colour and the price ── */
    let shown = null;
    function paintMoney() {
      const to = price();
      const from = shown ?? to;
      shown = to;
      const g = window.gsap && !reduce ? window.gsap : null;
      const set = (v) => {
        priceEl.textContent = eur(v);
        const t = $("[data-total]", root);
        if (t) t.textContent = eur(v);
      };
      if (g && from !== to) {
        const o = { v: from };
        g.to(o, { v: to, duration: 0.5, ease: "power3.out", onUpdate: () => set(Math.round(o.v)) });
        priceEl.classList.remove("is-bump");
        void priceEl.offsetWidth;
        priceEl.classList.add("is-bump");
      } else set(to);
    }
    function paintLabels() {
      $("[data-your]", root).textContent = `${OPT.shapes[st.shape].name} · ${sizeObj().label}`;
      const cc = $("[data-chip-color]", root);
      $("i", cc).style.background = cream();
      $("span", cc).textContent = colorOf(st.color).name;
      $("[data-chip-coat]", root).textContent = `${OPT.coats[st.coat].name}${st.drip !== "none" ? " · патьоки" : ""} · ${OPT.decor[st.decor].name}`;
      // the studio takes a breath of the cake's colour — or wears the backdrop chosen for it
      const B = OPT.bgs[st.bg];
      stage.dataset.bg = st.bg;
      stage.style.setProperty("--kc-wash", B.hex ? (B.dark ? B.hex : mix(B.hex, "#3d0405", 0.05)) : mix(cream(), "#ffffff", isDark(cream()) ? 0.86 : 0.62));
      stage.style.setProperty("--kc-wash-2", B.hex ? mix(B.hex, "#ffffff", B.dark ? 0.1 : 0.55) : mix(cream(), "#ffffff", 0.9));
      if (B.ink) stage.style.setProperty("--kc-bg-ink", B.ink);
      $("[data-blow]", root).hidden = !st.toppings.includes("candles") || !cake;
    }
    function paintAll(fx = {}) {
      paintCake(fx);
      paintLabels();
      paintMoney();
      syncURL();
      commit();
    }

    /* ── the steps ── */
    stepsNav.innerHTML = `<span class="kc-steps__line" aria-hidden="true"><i></i></span>` + STEPS.map((S, i) => `
      <button type="button" class="kc-step" role="tab" data-step="${i}" id="kc-tab-${i}" aria-controls="kc-pane">
        <span class="kc-step__dot" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="m4 8.4 2.6 2.5L12 5.4" /></svg></span>
        <span class="kc-step__w">${S.tab}</span>
      </button>`).join("");
    function paintSteps() {
      $$("[data-step]", stepsNav).forEach((b) => {
        const i = +b.dataset.step;
        b.classList.toggle("is-on", i === step);
        b.classList.toggle("is-done", i < step);
        b.setAttribute("aria-selected", String(i === step));
        b.tabIndex = i === step ? 0 : -1;
      });
      stepsNav.style.setProperty("--p", (step / (STEPS.length - 1)).toFixed(3));
      pane.setAttribute("aria-labelledby", `kc-tab-${step}`);
      prevBtn.disabled = step === 0;
      $("[data-next-label]", nextBtn).textContent = step < 4 ? "Далі" : "У кошик";
      nextBtn.classList.toggle("is-final", step === 4);
      // on the size step the top of the cake shows the slices
      cake?.setPortions(step === 0 ? guests : 0);
    }

    const check = '<span class="kc-box" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="m4 8.4 2.6 2.5L12 5.4" /></svg></span>';
    const tick = (hex) => `<svg viewBox="0 0 16 16" aria-hidden="true" style="color:${isDark(hex) ? "#fff" : "#6d0809"}"><path d="m4 8.4 2.6 2.5L12 5.4" /></svg>`;
    const plus = (n) => (n ? `+${eur(n)}` : "включено");
    // the colour swatches, with a rainbow one that opens a colour picker for a colour of your own
    const swatches = (attr, cur, label) => `
      <div class="kc-sw" role="radiogroup" aria-label="${label}">${Object.entries(OPT.colors).map(([id, c]) => `
        <button type="button" class="kc-sw__b${id === cur ? " is-on" : ""}" role="radio" aria-checked="${id === cur}" ${attr}="${id}" style="--c:${c.hex}" title="${c.name}" aria-label="${c.name}">${tick(c.hex)}</button>`).join("")}
        <label class="kc-sw__b kc-sw__own${isCustom(cur) ? " is-on" : ""}" title="Свій колір" style="${isCustom(cur) ? `--c:${colorOf(cur).hex}` : ""}">
          <input type="color" value="${isCustom(cur) ? colorOf(cur).hex : "#f3b9c6"}" data-own="${attr}" aria-label="Свій колір">
          ${isCustom(cur) ? tick(colorOf(cur).hex) : '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4v8M4 8h8" /></svg>'}
        </label>
      </div>`;
    const shapeIcon = {
      round: '<circle cx="20" cy="20" r="14" />',
      heart: '<path d="M20 33C9 25 5 19 5 13.5 5 9 8.6 6 12.6 6c3 0 5.6 1.8 7.4 4.6C21.8 7.8 24.4 6 27.4 6 31.4 6 35 9 35 13.5 35 19 31 25 20 33Z" />',
      square: '<rect x="6.5" y="6.5" width="27" height="27" rx="5" />',
      flower: `<path d="${Array.from({ length: 65 }, (_, i) => { const t = (i / 64) * Math.PI * 2; const r = 13 * (1 + 0.1 * Math.cos(8 * t)); return `${i ? "L" : "M"}${(20 + r * Math.cos(t)).toFixed(2)} ${(20 + r * Math.sin(t)).toFixed(2)}`; }).join("")}Z" />`,
    };
    const dots = (n, max = 5) => `<span class="kc-dots" aria-hidden="true">${Array.from({ length: max }, (_, i) => `<i${i < n ? ' class="is-on"' : ""}></i>`).join("")}</span>`;

    function stepHTML() {
      const S = STEPS[step];
      let body = "";
      if (step === 0) {
        const g = guests;
        const max = 40;
        body = `
          <div class="kc-presets" role="group" aria-label="Готові ідеї">
            <span class="kc-presets__l">Почати з готового</span>
            <button type="button" class="kc-preset kc-preset--dice" data-surprise>${ico("dice")}Навмання</button>
            ${OPT.presets.filter((p) => flavors.some((f) => f.id === p.st.flavor)).map((p, i) => `<button type="button" class="kc-preset" data-preset="${i}"><i style="--c:${colorOf(p.st.color).hex};--d:${p.st.drip !== "none" ? OPT.drips[p.st.drip].hex : colorOf(p.st.decorColor).hex}"></i>${esc(p.name)}</button>`).join("")}
          </div>
          <p class="kc-label">Форма</p>
          <div class="kc-shapes" role="radiogroup" aria-label="Форма торта">${Object.entries(OPT.shapes).map(([id, s]) => `
            <button type="button" class="kc-card kc-shape${id === st.shape ? " is-on" : ""}" role="radio" aria-checked="${id === st.shape}" data-shape="${id}">
              <svg viewBox="0 0 40 40" aria-hidden="true">${shapeIcon[id]}</svg>
              <b>${s.name}</b><small>${s.add ? `+${eur(s.add)}` : "включено"}</small>
            </button>`).join("")}
          </div>
          <div class="kc-guests">
            <p class="kc-label">Кількість гостей <output data-guests-out>${g}</output></p>
            <div class="kc-range">
              <button type="button" class="kc-round" data-guest="-1" aria-label="Менше гостей">−</button>
              <input type="range" min="4" max="${max}" value="${Math.min(g, max)}" data-guests aria-label="Кількість гостей" style="--v:${((Math.min(g, max) - 4) / (max - 4)).toFixed(3)}">
              <button type="button" class="kc-round" data-guest="1" aria-label="Більше гостей">+</button>
            </div>
            <p class="kc-range__ends"><span>4</span><span>${max}+ ${plural(max, "гість", "гості", "гостей")}</span></p>
            <p class="kc-note">З розрахунку 150–200 г на гостя, щоб усім вистачило ♡${tiersFor(st.size).length === 1 ? " Пунктир на торті — шматочки." : ""}</p>
          </div>
          <p class="kc-label">Вага торта</p>
          <div class="kc-grid" role="radiogroup" aria-label="Вага торта">${sizes.map((s) => `
            <button type="button" class="kc-card kc-opt${s.id === st.size ? " is-on" : ""}" role="radio" aria-checked="${s.id === st.size}" data-size="${esc(s.id)}">
              ${check}<span class="kc-opt__t"><b>${esc(s.label)}</b><small>${esc(s.serves)}</small></span><span class="kc-opt__p">${eur(sizePrice(s))}</span>
            </button>`).join("")}
          </div>`;
      } else if (step === 1) {
        const moods = (M().moods || []).filter((m) => m.id === "all" || flavors.some((f) => (metaOf(f.id).moods || []).includes(m.id)));
        const cur = metaOf(st.flavor);
        body = `
          ${moods.length > 2 ? `<div class="kc-moods" role="group" aria-label="Смак">${moods.map((m) => `<button type="button" class="kc-mood${m.id === mood ? " is-on" : ""}" data-mood="${m.id}" aria-pressed="${m.id === mood}">${esc(m.label)}</button>`).join("")}</div>` : ""}
          ${cur.sweet ? `<div class="kc-taste" aria-label="Смак обраної начинки"><span>Солодкість ${dots(cur.sweet)}</span><span>Кислинка ${dots(cur.sour)}</span></div>` : ""}
          <div class="kc-flavors" role="radiogroup" aria-label="Начинка">${flavors.map((f) => {
            const fm = metaOf(f.id);
            const hide = mood !== "all" && !(fm.moods || []).includes(mood);
            return `
            <button type="button" class="kc-card kc-flavor${f.id === st.flavor ? " is-on" : ""}" role="radio" aria-checked="${f.id === st.flavor}" data-flavor="${esc(f.id)}"${hide ? " hidden" : ""}>
              <span class="kc-flavor__img"><img src="${esc(M().img(fm.img))}" alt="" loading="lazy" draggable="false">${check}</span>
              <span class="kc-flavor__layers" aria-hidden="true">${fm.layers.map((c) => `<i style="background:${c}"></i>`).join("")}</span>
              <b>${esc(f.name)}</b>
              <small>${esc(shortDesc(f.desc))}</small>
            </button>`;
          }).join("")}
          </div>`;
      } else if (step === 2) {
        body = `
          <div class="kc-coats" role="radiogroup" aria-label="Покриття" style="--c:${cream()}">${Object.entries(OPT.coats).map(([id, c]) => `
            <button type="button" class="kc-card kc-coat${id === st.coat ? " is-on" : ""}" role="radio" aria-checked="${id === st.coat}" data-coat="${id}">
              <span class="kc-coat__pv kc-coat__pv--${id}" aria-hidden="true"></span>
              <b>${c.name}</b><small>${c.note}</small><em>${plus(c.add)}</em>
            </button>`).join("")}
          </div>
          <p class="kc-label">Палітри</p>
          <div class="kc-palettes" role="group" aria-label="Палітри">${OPT.palettes.map((p, i) => {
            const on = st.color === p.color && st.decorColor === p.decor && st.drip === p.drip;
            return `<button type="button" class="kc-pal${on ? " is-on" : ""}" data-palette="${i}" aria-pressed="${on}">
              <span aria-hidden="true"><i style="background:${colorOf(p.color).hex}"></i><i style="background:${colorOf(p.decor).hex}"></i>${p.drip !== "none" ? `<i style="background:${OPT.drips[p.drip].hex}"></i>` : ""}</span>${esc(p.name)}</button>`;
          }).join("")}
          </div>
          <p class="kc-label">Колір покриття <span data-cname>${colorOf(st.color).name}</span></p>
          ${swatches("data-color", st.color, "Колір покриття")}
          <p class="kc-label">Патьоки <span>${st.drip === "none" ? "без патьоків" : `${OPT.drips[st.drip].name.toLowerCase()} · +${eur(OPT.drips[st.drip].add)}`}</span></p>
          <div class="kc-sw kc-drips" role="radiogroup" aria-label="Патьоки">${Object.entries(OPT.drips).map(([id, d]) => `
            <button type="button" class="kc-sw__b kc-drip kc-drip--${id}${id === st.drip ? " is-on" : ""}" role="radio" aria-checked="${id === st.drip}" data-drip="${id}" style="--c:${d.hex || "#fff"}" title="${d.name}" aria-label="${d.name}">${id === "none" ? '<svg class="kc-drip__no" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4" /></svg>' : tick(d.hex)}</button>`).join("")}
          </div>
          <p class="kc-label">Фон <span data-bgname>${OPT.bgs[st.bg].name.toLowerCase()}</span></p>
          <div class="kc-sw kc-bgs" role="radiogroup" aria-label="Фон студії">${Object.entries(OPT.bgs).map(([id, B]) => `
            <button type="button" class="kc-sw__b kc-bg${B.pattern ? ` kc-bg--${B.pattern}` : ""}${id === "auto" ? " kc-bg--auto" : ""}${id === st.bg ? " is-on" : ""}" role="radio" aria-checked="${id === st.bg}" data-bg="${id}" style="--c:${B.hex || mix(cream(), "#ffffff", 0.55)}${B.ink ? `;--k:${B.ink}` : ""}" title="${B.name}" aria-label="${B.name}">${id === "auto" && st.bg !== "auto" ? "A" : tick(B.dark ? "#000000" : "#ffffff")}</button>`).join("")}
          </div>`;
      } else if (step === 3) {
        body = `
          <div class="kc-list" role="radiogroup" aria-label="Рюші">${Object.entries(OPT.decor).map(([id, d]) => `
            <button type="button" class="kc-card kc-row${id === st.decor ? " is-on" : ""}" role="radio" aria-checked="${id === st.decor}" data-decor="${id}">
              ${check}<span class="kc-opt__t"><b>${d.name}</b><small>${d.note}</small></span><span class="kc-opt__p">${plus(d.add)}</span>
            </button>`).join("")}
          </div>
          <div class="kc-dcolor"${st.decor === "none" ? " hidden" : ""}>
            <p class="kc-label">Колір рюшів <span data-dname>${colorOf(st.decorColor).name}</span></p>
            ${swatches("data-dcolor", st.decorColor, "Колір рюшів")}
          </div>`;
      } else {
        body = `
          <div class="kc-tops" role="group" aria-label="Прикраси">${Object.entries(OPT.toppings).map(([id, t]) => `
            <button type="button" class="kc-card kc-top${st.toppings.includes(id) ? " is-on" : ""}" aria-pressed="${st.toppings.includes(id)}" data-top="${id}">
              <span class="kc-top__i">${ico(id)}</span>
              <span class="kc-opt__t"><b>${t.name}</b><small>${t.note}</small></span><span class="kc-opt__p">+${eur(t.add)}</span>
            </button>`).join("")}
          </div>
          <div class="kc-place"${SPREADS.some((t) => st.toppings.includes(t)) ? "" : " hidden"}>
            <p class="kc-label">Як розкласти <span>ягоди, квіти й макарони</span></p>
            <div class="kc-moods kc-place__row" role="radiogroup" aria-label="Як розкласти">${Object.entries(OPT.places).map(([id, n]) => `<button type="button" class="kc-mood${id === st.place ? " is-on" : ""}" role="radio" aria-checked="${id === st.place}" data-place="${id}">${n}</button>`).join("")}</div>
          </div>
          <label class="kc-field"><span class="kc-label">Напис на торті <span data-tcount>${st.text.length}/24</span></span><input type="text" maxlength="24" data-ctext value="${esc(st.text)}" placeholder="Happy birthday!" autocomplete="off"></label>
          <div class="kc-fonts" role="radiogroup" aria-label="Почерк напису">${Object.entries(OPT.fonts).map(([id, f]) => `
            <button type="button" class="kc-font${id === st.font ? " is-on" : ""}" role="radio" aria-checked="${id === st.font}" data-font="${id}"><span style="${f.css}">${esc(sample(f))}</span><small>${f.name}</small></button>`).join("")}
          </div>
          <div class="kc-tsize">
            <p class="kc-label">Розмір напису <output data-tsize-out>${st.textSize}%</output></p>
            <div class="kc-range">
              <button type="button" class="kc-round" data-tstep="-10" aria-label="Менший напис"><small>A</small></button>
              <input type="range" min="60" max="130" step="5" value="${st.textSize}" data-tsize aria-label="Розмір напису" style="--v:${((st.textSize - 60) / 70).toFixed(3)}">
              <button type="button" class="kc-round" data-tstep="10" aria-label="Більший напис">A</button>
            </div>
          </div>
          <p class="kc-label">Колір напису</p>
          <div class="kc-sw kc-tcolors" role="radiogroup" aria-label="Колір напису">${OPT.textColors.map((id) => {
            const hex = id === "gold" ? "#c9a14a" : id === "auto" ? textHexAuto() : colorOf(id).hex;
            const name = id === "auto" ? "Під торт" : id === "gold" ? "Золото" : colorOf(id).name;
            return `<button type="button" class="kc-sw__b kc-sw__b--sm${id === "auto" ? " kc-sw__auto" : ""}${id === st.textColor ? " is-on" : ""}" role="radio" aria-checked="${id === st.textColor}" data-tcolor="${id}" style="--c:${hex}" title="${name}" aria-label="${name}">${id === "auto" ? "A" : tick(hex)}</button>`;
          }).join("")}</div>
          <label class="kc-field"><span class="kc-label">Ваша ідея</span><textarea rows="3" maxlength="1000" data-idea placeholder="Тема свята, кольори, настрій — усе, що хочеться додати">${esc(st.idea)}</textarea></label>
          <div class="kc-photos" data-idea-photos></div>
          <div class="kc-sumcard">
            <p class="kc-label">Ваш торт</p>
            ${lines().map(([n, v]) => `<p class="kc-sumcard__row"><span>${esc(n)}</span><b>${v ? eur(v) : "вкл."}</b></p>`).join("")}
            ${st.text ? `<p class="kc-sumcard__row"><span>Напис «${esc(st.text)}», ${OPT.fonts[st.font].name.toLowerCase()}${st.textSize !== 100 ? `, ${st.textSize}%` : ""}</span><b>вкл.</b></p>` : ""}
            <p class="kc-sumcard__total"><span>Разом орієнтовно</span><b data-total>${eur(price())}</b></p>
            <p class="kc-note">Фінальну ціну підтвердить менеджер після уточнення деталей.</p>
            <div class="kc-actions">
              <a class="kc-link" data-wa target="_blank" rel="noopener">Обговорити у WhatsApp</a>
              <button type="button" class="kc-link" data-card>Листівка з тортом</button>
              <button type="button" class="kc-link" data-share>Скопіювати посилання</button>
            </div>
          </div>`;
      }
      return `
        <div class="kc-st">
          <h2 class="kc-h">${S.title}</h2>
          <p class="kc-lede">${S.lede}</p>
          ${body}
        </div>`;
    }
    // the hands are shown with the inscription itself, or with the bakery's name
    const sample = (f) => st.text || (f.caps ? "MARIDAY" : "Mariday");
    const SPREADS = ["strawberries", "berries", "flowers", "macarons"];
    function textHexAuto() {
      const keep = st.textColor;
      st.textColor = "auto";
      const h = textHex();
      st.textColor = keep;
      return h;
    }

    function waLink() {
      const msg = `Вітаю! Хочу торт з конструктора:\n${lines().map(([n, v]) => `• ${n}${v ? " — €" + v : ""}`).join("\n")}${st.text ? `\n• Напис: «${st.text}» (${OPT.fonts[st.font].name.toLowerCase()})` : ""}${st.idea ? `\n• Ідея: ${st.idea}` : ""}${st.photos.length ? `\n• Фото:\n${st.photos.join("\n")}` : ""}\nРазом орієнтовно: ${eur(price())}\n${syncURL(true)}`;
      return `https://wa.me/${M().contacts.whatsapp}?text=${encodeURIComponent(msg)}`;
    }

    function afterPaint() {
      const wa = $("[data-wa]", pane);
      if (wa) wa.href = waLink();
      if (board) { const h = $("[data-idea-photos]", pane); if (h) board.mount(h); }
    }
    let paneTok = 0;
    function paintPane(dir = 0) {
      const tok = ++paneTok;
      const put = () => {
        if (tok !== paneTok) return;
        pane.innerHTML = stepHTML();
        pane.style.setProperty("--dir", dir || 1);
        pane.classList.remove("is-leave", "is-enter");
        if (dir && !reduce) { void pane.offsetWidth; pane.classList.add("is-enter"); }
        afterPaint();
      };
      if (!dir || reduce || !pane.firstElementChild) return put();
      pane.style.setProperty("--dir", dir);
      pane.classList.add("is-leave");
      setTimeout(put, 170);
    }
    // a small re-render of the open step that keeps the scroll and focus (after a choice)
    const FOCUS_ATTRS = ["data-size", "data-shape", "data-flavor", "data-coat", "data-color", "data-drip", "data-palette", "data-decor", "data-dcolor", "data-top", "data-preset", "data-guest", "data-mood", "data-font", "data-tcolor", "data-surprise", "data-bg", "data-place", "data-tstep"];
    function refreshPane() {
      const f = document.activeElement;
      const sel = f && pane.contains(f) ? FOCUS_ATTRS.map((a) => (f.hasAttribute(a) ? `[${a}="${f.getAttribute(a)}"]` : "")).find(Boolean) : null;
      if (f && f.matches?.("[data-ctext], [data-idea], [data-guests], [data-own], [data-tsize]")) return;
      pane.innerHTML = stepHTML();
      afterPaint();
      if (sel) $(sel, pane)?.focus({ preventScroll: true });
    }

    // only the summary card follows the inscription: redrawing the whole step on blur would swallow the next click
    function refreshSum() {
      const card = $(".kc-sumcard", pane);
      if (!card) return;
      const tmp = document.createElement("div");
      tmp.innerHTML = stepHTML();
      card.replaceWith($(".kc-sumcard", tmp));
      const wa = $("[data-wa]", pane);
      if (wa) wa.href = waLink();
    }

    function goStep(i, opts = {}) {
      const to = Math.max(0, Math.min(4, i));
      if (to === step && !opts.force) return;
      const dir = to >= step ? 1 : -1;
      step = to;
      touched = true;
      cake?.setCut(step === 1);
      $("[data-cutbtn]", root).setAttribute("aria-pressed", String(step === 1));
      paintSteps();
      paintPane(dir);
      syncURL();
      // the step starts at its top (on a phone, under the cake riding at the top)
      if (opts.scroll !== false) {
        const phone = innerWidth < 900;
        const y = phone
          ? pane.getBoundingClientRect().top + scrollY - stage.offsetHeight - 16
          : $(".kc-head", root).getBoundingClientRect().top + scrollY - 24;
        if (phone ? Math.abs(scrollY - y) > 30 : scrollY > y + 10) window.MaridayLenis ? MaridayLenis.scrollTo(Math.max(0, y), { duration: 0.8 }) : scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" });
      }
    }

    // the inscription's size: live on the cake while dragging, the toppings make room for it once it is let go
    function setTextSize(v, settle) {
      st.textSize = Math.max(60, Math.min(130, Math.round(v / 5) * 5));
      touched = true;
      const out = $("[data-tsize-out]", pane);
      if (out) out.textContent = st.textSize + "%";
      const r = $("[data-tsize]", pane);
      if (r && +r.value !== st.textSize) r.value = st.textSize;
      if (r) r.style.setProperty("--v", ((st.textSize - 60) / 70).toFixed(3));
      cake?.setTextSize(st.textSize / 100);
      if (settle) { paintAll({ squash: false }); refreshSum(); }
    }
    function setGuests(g) {
      guests = Math.max(4, Math.min(60, g));
      const out = $("[data-guests-out]", pane);
      if (out) out.textContent = guests;
      const r = $("[data-guests]", pane);
      if (r) { r.value = Math.min(guests, 40); r.style.setProperty("--v", ((Math.min(guests, 40) - 4) / 36).toFixed(3)); }
      const id = sizeForGuests(guests);
      if (id !== st.size) {
        st.size = id;
        touched = true;
        paintAll({ grow: true });
        $$("[data-size]", pane).forEach((b) => { const on = b.dataset.size === id; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", String(on)); });
      }
      if (step === 0) cake?.setPortions(guests);
    }

    // «Навмання»: a random cake that still looks good — a palette or a colour pair, one coat, one to three toppings
    function surprise() {
      const pal = Math.random() < 0.6 ? pickOne(OPT.palettes) : null;
      const color = pal ? pal.color : pickOne(Object.keys(OPT.colors));
      const light = !isDark(colorOf(color).hex);
      const tops = Object.keys(OPT.toppings).filter((t) => t !== "candles" || Math.random() < 0.5);
      const n = 1 + Math.floor(Math.random() * 3);
      const chosen = [];
      while (chosen.length < n) { const t = pickOne(tops); if (!chosen.includes(t)) chosen.push(t); }
      const next = {
        shape: Math.random() < 0.55 ? "round" : pickOne(Object.keys(OPT.shapes)),
        flavor: pickOne(flavors).id,
        coat: pickOne(Object.keys(OPT.coats)),
        color,
        drip: pal ? pal.drip : Math.random() < 0.35 ? pickOne(Object.keys(OPT.drips).filter((d) => d !== "none")) : "none",
        decor: pickOne(Object.keys(OPT.decor)),
        decorColor: pal ? pal.decor : light ? pickOne(["milk", "milk", "vanilla", "sky", "powder", "lilac"]) : pickOne(["milk", "vanilla", "butter"]),
        toppings: chosen,
        place: Math.random() < 0.6 ? "all" : pickOne(Object.keys(OPT.places)),
        font: st.text ? pickOne(Object.keys(OPT.fonts)) : st.font,
      };
      Object.assign(st, next);
      touched = true;
      paintAll();
      refreshPane();
      cake?.spin();
      window.showToast?.(pickOne(["Як вам такий? ♡", "Ще разок? ✦", "Оце так торт!", "Смачно виглядає ♡"]));
    }

    // the cake as it is on the stand right now, cut out on transparency and cropped to it, small enough to keep in the
    // cart: the cart and the «додано» note show this instead of the cherries
    async function cartShot() {
      if (!cake) return "";
      try {
        const img = new Image();
        img.src = cake.snapshot({ clear: false });
        await img.decode();
        const t = document.createElement("canvas");
        t.width = img.width; t.height = img.height;
        const tg = t.getContext("2d", { willReadFrequently: true });
        tg.drawImage(img, 0, 0);
        const px = tg.getImageData(0, 0, t.width, t.height).data;
        let x0 = t.width, y0 = t.height, x1 = 0, y1 = 0;
        for (let y = 0; y < t.height; y += 2) for (let x = 0; x < t.width; x += 2) {
          if (px[(y * t.width + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        }
        if (x1 <= x0) return "";
        const cw = x1 - x0 + 2, ch = y1 - y0 + 2;
        const k = Math.min(1, 360 / Math.max(cw, ch));
        const o = document.createElement("canvas");
        o.width = Math.round(cw * k); o.height = Math.round(ch * k);
        o.getContext("2d").drawImage(t, x0, y0, cw, ch, 0, 0, o.width, o.height);
        const webp = o.toDataURL("image/webp", 0.86);
        return webp.startsWith("data:image/webp") ? webp : o.toDataURL("image/png");
      } catch (e) {
        return "";
      }
    }

    function pack() {
      const go = async () => {
        if (board && board.busy()) {
          window.showToast?.("Секундочку — фото ще завантажуються…");
          await board.idle();
        }
        const f = flavorById(st.flavor);
        const idea = st.idea.trim();
        const meta = [
          `${OPT.shapes[st.shape].name} · ${sizeObj().label}`, f.name,
          `${OPT.coats[st.coat].name.toLowerCase()}, ${colorOf(st.color).name.toLowerCase()}${isCustom(st.color) ? ` ${colorOf(st.color).hex}` : ""}`,
          st.drip !== "none" ? `патьоки: ${OPT.drips[st.drip].name.toLowerCase()}` : "",
          st.decor !== "none" ? `${OPT.decor[st.decor].name.toLowerCase()} (${colorOf(st.decorColor).name.toLowerCase()})` : "",
          ...st.toppings.map((x) => OPT.toppings[x].name.toLowerCase()),
          st.text ? `напис «${st.text}» (${OPT.fonts[st.font].name.toLowerCase()})` : "",
          idea ? `ідея: ${idea.length > 70 ? idea.slice(0, 68) + "…" : idea}` : "",
          st.photos.length ? `${st.photos.length} фото` : "",
        ].filter(Boolean).join(" · ");
        const link = syncURL(true);
        const extra = idea || st.photos.length ? "-i" + [...idea + st.photos.join()].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36) : "";
        const item = { id: "custom", name: "Торт за вашим дизайном", price: price(), size: st.size, flavor: st.flavor, variant: link, meta, ...(extra ? { uid: `custom-${st.size}-${st.flavor}-${link}${extra}`, idea, photos: st.photos.slice() } : {}) };
        cake?.setCut(false);
        const shot = await cartShot();
        if (shot) item.shot = shot;
        cake?.hop();
        setTimeout(() => {
          window.addToCartAndNotify?.(item, canvasHost);
          window.burstConfetti?.(canvasHost);
        }, reduce ? 0 : 420);
      };
      go();
    }

    // a postcard: the cake on its own colour, its name, what it is made of and the price
    async function postcard() {
      if (!cake) return;
      const W = 1080, H = 1350;
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const g = c.getContext("2d");
      const B = OPT.bgs[st.bg];
      const wash = B.hex || mix(cream(), "#ffffff", isDark(cream()) ? 0.82 : 0.55);
      const bg = g.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, B.dark ? mix(wash, "#ffffff", 0.08) : mix(wash, "#ffffff", 0.55));
      bg.addColorStop(1, wash);
      g.fillStyle = bg;
      g.fillRect(0, 0, W, H);
      // the patterned backdrops are drawn in too, softly
      if (B.pattern) {
        g.save();
        g.globalAlpha = 0.5;
        g.fillStyle = B.ink;
        const q = 54;
        if (B.pattern === "gingham") for (let i = 0; i < Math.max(W, H) / q; i += 2) { g.fillRect(i * q, 0, q, H); g.fillRect(0, i * q, W, q); }
        if (B.pattern === "stripes") for (let x = 0; x < W; x += q * 2) g.fillRect(x, 0, q * 0.8, H);
        if (B.pattern === "dots") for (let y = q / 2; y < H; y += q) for (let x = ((y / q) | 0) % 2 ? q : q / 2; x < W; x += q) { g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); }
        g.restore();
        const fog = g.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H * 0.42, W * 0.75);
        fog.addColorStop(0, "rgba(255,255,255,.8)");
        fog.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = fog;
        g.fillRect(0, 0, W, H);
      }
      const img = new Image();
      img.src = cake.snapshot({ clear: false });
      await img.decode().catch(() => {});
      // crop the render to the cake and its stand, then let it fill the card
      const t = document.createElement("canvas");
      t.width = img.width; t.height = img.height;
      const tg = t.getContext("2d", { willReadFrequently: true });
      tg.drawImage(img, 0, 0);
      const px = tg.getImageData(0, 0, t.width, t.height).data;
      let x0 = t.width, y0 = t.height, x1 = 0, y1 = 0;
      for (let y = 0; y < t.height; y += 2) for (let x = 0; x < t.width; x += 2) {
        if (px[(y * t.width + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      if (x1 <= x0) { x0 = 0; y0 = 0; x1 = t.width; y1 = t.height; }
      const cw = x1 - x0, ch = y1 - y0;
      const k = Math.min((W * 0.84) / cw, (H * 0.56) / ch);
      g.drawImage(t, x0, y0, cw, ch, (W - cw * k) / 2, 150 + (H * 0.56 - ch * k) / 2, cw * k, ch * k);
      const dark = !!B.dark;
      g.fillStyle = dark ? "#ffd6df" : "#6d0809";
      g.textAlign = "center";
      g.font = '600 30px "Unbounded", sans-serif';
      g.letterSpacing = "6px";
      g.fillText("MARIDAY CAKE", W / 2, 96);
      g.letterSpacing = "0px";
      g.font = '86px "Great Vibes", cursive';
      g.fillText(st.text || "Мій торт", W / 2, H - 330);
      g.font = '500 30px "Manrope", sans-serif';
      g.fillStyle = dark ? "#fff3f5" : "#3d0405";
      const about = [`${OPT.shapes[st.shape].name} · ${sizeObj().label} · ${flavorById(st.flavor).name}`, `${OPT.coats[st.coat].name}, ${colorOf(st.color).name.toLowerCase()}${st.drip !== "none" ? ` · ${OPT.drips[st.drip].name.toLowerCase()}` : ""}`, st.toppings.map((t) => OPT.toppings[t].name.toLowerCase()).join(" · ")].filter(Boolean);
      about.forEach((l, i) => g.fillText(l.length > 52 ? l.slice(0, 50) + "…" : l, W / 2, H - 240 + i * 46));
      g.font = '600 40px "Unbounded", sans-serif';
      g.fillStyle = dark ? "#ffd6df" : "#6d0809";
      g.fillText(`≈ ${eur(price())}`, W / 2, H - 70);
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = "mariday-cake.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.showToast?.("Листівку збережено ♡");
    }

    function blow() {
      if (!cake?.blow()) return;
      const b = $("[data-blow]", root);
      b.classList.add("is-blown");
      setTimeout(() => window.burstConfetti?.(canvasHost), reduce ? 0 : 520);
      setTimeout(() => window.showToast?.("Бажання загадано ♡"), 700);
      setTimeout(() => b.classList.remove("is-blown"), 3600);
    }

    /* ── choices ── */
    root.addEventListener("click", (e) => {
      const by = (s) => e.target.closest(s);
      let b;
      if ((b = by("[data-step]"))) return goStep(+b.dataset.step);
      if (by("[data-next]")) return step < 4 ? goStep(step + 1) : pack();
      if (by("[data-prev]")) return goStep(step - 1);
      if (by("[data-undo]")) return travel(-1);
      if (by("[data-redo]")) return travel(1);
      if (by("[data-surprise]")) return surprise();
      if (by("[data-blow]")) return blow();
      if ((b = by("[data-mood-light]"))) {
        night = !night;
        b.setAttribute("aria-pressed", String(night));
        b.innerHTML = ico(night ? "sun" : "moon") + `<span>${night ? "День" : "Вечір"}</span>`;
        stage.classList.toggle("is-night", night);
        cake?.setMood(night ? "night" : "day");
        return;
      }
      if ((b = by("[data-view]"))) {
        cake?.view(b.dataset.view);
        $$("[data-view]", root).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        return;
      }
      if ((b = by("[data-zoom]"))) {
        const z = cake ? cake.zoom(+b.dataset.zoom) : 1;
        $("[data-zoomout]", root).textContent = Math.round(z * 100) + "%";
        return;
      }
      if ((b = by("[data-cutbtn]"))) {
        const on = b.getAttribute("aria-pressed") !== "true";
        b.setAttribute("aria-pressed", String(on));
        cake?.setCut(on);
        return;
      }
      if ((b = by("[data-preset]"))) {
        const p = OPT.presets.filter((x) => flavors.some((f) => f.id === x.st.flavor))[+b.dataset.preset];
        if (!p) return;
        const grow = tiersFor(p.st.size).length !== tiersFor(st.size).length;
        Object.assign(st, { ...p.st, toppings: p.st.toppings.slice(), textColor: "auto" });
        guests = guestsOf(sizeObj());
        touched = true;
        paintAll({ grow });
        refreshPane();
        paintSteps();
        cake?.spin();
        return;
      }
      if ((b = by("[data-mood]"))) {
        mood = b.dataset.mood;
        return refreshPane();
      }
      if ((b = by("[data-shape]"))) {
        if (st.shape === b.dataset.shape) return;
        st.shape = b.dataset.shape;
      } else if ((b = by("[data-size]"))) {
        if (st.size === b.dataset.size) return;
        st.size = b.dataset.size;
        guests = guestsOf(sizeObj());
        touched = true;
        paintAll({ grow: true });
        paintSteps();
        return refreshPane();
      } else if ((b = by("[data-guest]"))) {
        return setGuests(guests + +b.dataset.guest);
      } else if ((b = by("[data-flavor]"))) {
        if (st.flavor === b.dataset.flavor) return;
        st.flavor = b.dataset.flavor;
        cake?.setCut(true);
        $("[data-cutbtn]", root).setAttribute("aria-pressed", "true");
        touched = true;
        paintAll({ squash: false });
        return refreshPane();
      } else if ((b = by("[data-coat]"))) {
        if (st.coat === b.dataset.coat) return;
        st.coat = b.dataset.coat;
      } else if ((b = by("[data-palette]"))) {
        const p = OPT.palettes[+b.dataset.palette];
        Object.assign(st, { color: p.color, decorColor: p.decor, drip: p.drip });
        touched = true;
        paintAll({ color: true });
        return refreshPane();
      } else if ((b = by("[data-color]"))) {
        if (st.color === b.dataset.color) return;
        st.color = b.dataset.color;
        touched = true;
        paintAll({ color: true });
        return refreshPane();
      } else if ((b = by("[data-drip]"))) {
        if (st.drip === b.dataset.drip) return;
        st.drip = b.dataset.drip;
      } else if ((b = by("[data-decor]"))) {
        if (st.decor === b.dataset.decor) return;
        st.decor = b.dataset.decor;
        touched = true;
        paintAll({ decor: true });
        return refreshPane();
      } else if ((b = by("[data-dcolor]"))) {
        if (st.decorColor === b.dataset.dcolor) return;
        st.decorColor = b.dataset.dcolor;
        touched = true;
        paintAll({ squash: false });
        return refreshPane();
      } else if ((b = by("[data-top]"))) {
        const id = b.dataset.top;
        const adding = !st.toppings.includes(id);
        st.toppings = adding ? [...st.toppings, id] : st.toppings.filter((x) => x !== id);
        touched = true;
        paintAll(adding ? { drop: id } : { squash: false });
        return refreshPane();
      } else if ((b = by("[data-font]"))) {
        if (st.font === b.dataset.font) return;
        st.font = b.dataset.font;
        touched = true;
        paintAll({ squash: false });
        return refreshPane();
      } else if ((b = by("[data-tstep]"))) {
        return setTextSize(st.textSize + +b.dataset.tstep, true);
      } else if ((b = by("[data-place]"))) {
        if (st.place === b.dataset.place) return;
        st.place = b.dataset.place;
        const show = SPREADS.find((t) => st.toppings.includes(t));
        touched = true;
        paintAll(show ? { drop: show } : { squash: false });
        return refreshPane();
      } else if ((b = by("[data-bg]"))) {
        if (st.bg === b.dataset.bg) return;
        st.bg = b.dataset.bg;
        touched = true;
        paintLabels();
        syncURL();
        commit();
        return refreshPane();
      } else if ((b = by("[data-tcolor]"))) {
        if (st.textColor === b.dataset.tcolor) return;
        st.textColor = b.dataset.tcolor;
        touched = true;
        paintAll({ squash: false });
        return refreshPane();
      } else if (by("[data-card]")) {
        return postcard();
      } else if (by("[data-share]")) {
        const url = syncURL(true);
        (navigator.clipboard?.writeText(url) || Promise.reject()).then(() => window.showToast?.("Посилання скопійовано ♡"), () => window.prompt("Посилання на ваш торт:", url));
        return;
      } else return;
      touched = true;
      paintAll();
      refreshPane();
    });

    // a colour of your own: the cake follows the picker live, the pane is redrawn once it is closed
    let ownRaf = 0;
    root.addEventListener("input", (e) => {
      const t = e.target;
      if (t.matches("[data-own]")) {
        const id = "x" + t.value.slice(1).toLowerCase();
        const key = t.dataset.own === "data-color" ? "color" : "decorColor";
        st[key] = id;
        touched = true;
        const sw = t.closest(".kc-sw__own");
        sw.style.setProperty("--c", t.value);
        cancelAnimationFrame(ownRaf);
        ownRaf = requestAnimationFrame(() => { paintCake({ squash: false }); paintLabels(); paintMoney(); syncURL(); });
        return;
      }
      if (t.matches("[data-guests]")) {
        t.style.setProperty("--v", ((+t.value - 4) / 36).toFixed(3));
        return setGuests(+t.value);
      }
      if (t.matches("[data-tsize]")) return setTextSize(+t.value, false);
      if (t.matches("[data-ctext]")) {
        st.text = t.value.slice(0, 24);
        touched = true;
        paintCake({ squash: false });
        syncURL();
        const c = $("[data-tcount]", pane);
        if (c) c.textContent = `${st.text.length}/24`;
        $$(".kc-font span", pane).forEach((s, i) => (s.textContent = sample(Object.values(OPT.fonts)[i])));
        return;
      }
      if (t.matches("[data-idea]")) {
        st.idea = t.value.slice(0, 1000);
        keepIdea();
        const wa = $("[data-wa]", pane);
        if (wa) wa.href = waLink();
      }
    });
    // the summary on the last step follows the inscription once the field is left; the picker settles on change
    root.addEventListener("change", (e) => {
      if (e.target.matches("[data-ctext]")) { commit(); refreshSum(); }
      if (e.target.matches("[data-tsize]")) { paintAll({ squash: false }); refreshSum(); }
      if (e.target.matches("[data-own]")) { e.target.blur(); paintAll({ color: true }); refreshPane(); }
    });
    root.addEventListener("keydown", (e) => {
      const tab = e.target.closest("[data-step]");
      if (!tab || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      e.preventDefault();
      goStep(step + (e.key === "ArrowRight" ? 1 : -1), { scroll: false });
      $(`[data-step="${step}"]`, stepsNav)?.focus();
    });
    // ⌘Z / Ctrl+Z and with Shift — outside the text fields
    document.addEventListener("keydown", (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z" || e.target.closest("input, textarea, [contenteditable]")) return;
      e.preventDefault();
      travel(e.shiftKey ? 1 : -1);
    });

    // the hint goes once the cake has been turned
    canvasHost.addEventListener("cake:turn", () => $("[data-hint]", root)?.classList.add("is-gone"), { once: true });

    // the stage sticks under the header, which hides on the way down
    const hdr = $(".hdr");
    const fitTop = () => document.documentElement.style.setProperty("--kc-top", (hdr && !hdr.classList.contains("hdr--hidden") ? Math.max(0, hdr.getBoundingClientRect().height) : 0) + "px");
    if (hdr) new MutationObserver(fitTop).observe(hdr, { attributes: true, attributeFilter: ["class"] });
    fitTop();

    $("[data-undo]", root).innerHTML = ico("undo");
    $("[data-redo]", root).innerHTML = ico("redo");
    $("[data-dice]", root).innerHTML = ico("dice");
    $("[data-mood-light]", root).innerHTML = ico("moon") + "<span>Вечір</span>";
    $("[data-blow]", root).innerHTML = ico("wind") + "<span>Задути свічки</span>";
    if (!cake) $$("[data-mood-light]", root).forEach((x) => (x.hidden = true));

    paintSteps();
    paintPane();
    paintAll({ squash: false });
    paintHistory();
    if (step === 1) cake?.setCut(true);
    $("[data-cutbtn]", root).setAttribute("aria-pressed", String(step === 1));
  }

  MARIDAY.onReady(() => {
    // the site header is drawn by layout.js; wait a frame for it
    requestAnimationFrame(studio);
  });
})();
