/* Mariday Cake — catalog, flavors, desserts */
window.MARIDAY = window.MARIDAY || {};

MARIDAY.flavors = [
  {
    id: "pistachio-raspberry",
    name: "Фісташка–малина",
    desc: "Вологий горіховий бісквіт, кремчиз з фісташковою пастою, малинове конфі та малинова намазка. Класика з яскравою кислинкою.",
  },
  {
    id: "snickers",
    name: "Снікерс",
    desc: "Шоколадний бісквіт, кремчиз з арахісовою пастою, м’яка карамель і смажений арахіс. Насичено й текстурно.",
  },
  {
    id: "berry-forest",
    name: "Лісові ягоди",
    desc: "Шифоновий бісквіт, кремчиз і ягідна начинка з малини, полуниці, вишні та смородини. Універсальний смак.",
  },
  {
    id: "banana-caramel",
    name: "Банан–карамель",
    desc: "Банановий бісквіт, кремчиз, м’яка карамель і шматочки свіжого банана. Домашній теплий смак.",
  },
  {
    id: "cherry-duo-choc",
    name: "Вишня і два шоколади",
    desc: "Шоколадний бісквіт, кремчиз з темним шоколадом, ганаш на молочному та білому шоколаді, вишневе конфі.",
  },
  {
    id: "vanilla-berry",
    name: "Ваніль–ягоди",
    desc: "Ванільний бісквіт з молочною просочкою, кремчиз і сезонна ягідна начинка. Легкий і святковий.",
  },
  {
    id: "kinder",
    name: "Kinder Bueno",
    desc: "Шоколадний бісквіт, кремчиз з фундучним праліне, нутелла-ганаш і хрусткий шар з вафельною крихтою.",
  },
  {
    id: "lemon-raspberry",
    name: "Малина–лимон",
    desc: "Шифоновий бісквіт з лимонним сиропом, кремчиз з малиною, малинове конфі та лимонний гель.",
  },
  {
    id: "plombir",
    name: "Пломбір з шоколадною крихтою",
    desc: "Шифоновий бісквіт, кремчиз із заварним кремом і ваніллю, темна шоколадна крихта. Смак морозива.",
  },
];

MARIDAY.sizes = [
  { id: "1.5", label: "1,5 кг", serves: "6–8 осіб", priceMult: 1 },
  { id: "2", label: "2 кг", serves: "10–12 осіб", priceMult: 1.25 },
  { id: "2.5", label: "2,5 кг", serves: "14–16 осіб", priceMult: 1.5 },
  { id: "3", label: "3 кг", serves: "18–20 осіб", priceMult: 1.8 },
  { id: "4", label: "4 кг", serves: "24–28 осіб", priceMult: 2.3 },
  { id: "tier", label: "Ярусний", serves: "від 30 осіб", priceMult: 3.2 },
];

MARIDAY.cakes = [
  {
    id: "rose-waltz",
    bg: "#f6dbe0", // the colour of its room on the showcase
    accent: "#c9506d",
    name: "Трояндовий вальс",
    price: 280,
    img: "roses",
    cats: ["wedding", "loved", "all"],
    tags: ["весільні", "ярусні", "квіткові"],
    days: 14,
    desc: "Чотири яруси ніжного крему й живі троянди пудрових відтінків. Головна сцена весільного столу.",
  },
  {
    id: "berry-crown",
    bg: "#f4cfd3",
    accent: "#b8243f",
    name: "Ягідна корона",
    price: 240,
    img: "berries",
    cats: ["wedding", "parents", "all"],
    tags: ["ярусні", "ягоди"],
    days: 10,
    desc: "Ярусний торт з текстурним кремом і щедрою короною полуниці, лохини та малини.",
  },
  {
    id: "lilac-garden",
    bg: "#e5ddf3",
    accent: "#7b5ea7",
    name: "Ліловий сад",
    price: 185,
    img: "lilac",
    cats: ["wedding", "loved", "friends", "all"],
    tags: ["квіткові", "ожина"],
    days: 7,
    desc: "Білосніжний крем, стигла ожина й лілові квіти. Ніжний акцент для заручин чи ювілею.",
  },
  {
    id: "pink-icecream",
    bg: "#f9d6e3",
    accent: "#cf467f",
    name: "Рожеве морозиво",
    price: 165,
    img: "pink",
    cats: ["kids", "friends", "all"],
    tags: ["дитячі", "дріп", "посипка"],
    days: 5,
    desc: "Рожевий дріп, вафельний ріжок і конфеті-бісквіт усередині. Святковий настрій з першого шматочка.",
  },
  {
    id: "golden-macaron",
    bg: "#f6e6bf",
    accent: "#a3701a",
    name: "Золотий макарон",
    price: 195,
    img: "gold",
    cats: ["kids", "friends", "colleagues", "all"],
    tags: ["дріп", "макарони", "трендові"],
    days: 7,
    desc: "Шоколадний дріп, золоті макарони, ріжки й драже. Яскравий торт, який хочеться фотографувати.",
  },
  {
    id: "black-forest",
    bg: "#efd3cd",
    accent: "#8e2a22",
    name: "Вишневий ліс",
    price: 170,
    img: "forest",
    cats: ["parents", "friends", "dessert", "all"],
    tags: ["шоколад", "вишня", "naked"],
    days: 5,
    desc: "Відкритий шоколадний бісквіт, вершковий крем і п'яна вишня. Класика, яку люблять дорослі.",
  },
  {
    id: "choco-crown",
    bg: "#ecdccd",
    accent: "#7a4a2a",
    name: "Шоколадна корона",
    price: 160,
    img: "drip",
    cats: ["colleagues", "parents", "friends", "all"],
    tags: ["шоколад", "дріп"],
    days: 5,
    desc: "Глянцевий шоколадний дріп і корона з кремових розеток. Насичено, ефектно, без зайвого.",
  },
  {
    id: "choco-ruffles",
    bg: "#f2e3d4",
    accent: "#8c5634",
    name: "Шоколадні рюші",
    price: 175,
    img: "piping",
    cats: ["loved", "colleagues", "all"],
    tags: ["рюші", "омбре"],
    days: 6,
    desc: "Кремові рюші з переходом від молочного до темного шоколаду. Відсаджуємо кожну пелюстку вручну.",
  },
  {
    id: "three-chocolates",
    name: "Три шоколади",
    price: 155,
    img: "mousse",
    cats: ["dessert", "parents", "colleagues", "all"],
    tags: ["мусовий", "шоколад"],
    days: 5,
    desc: "Мусовий торт з трьох шоколадів, дзеркальний дріп і хрусткі перлини.",
  },
  {
    id: "cookies-cream",
    name: "Cookies & cream",
    price: 150,
    img: "oreo",
    cats: ["kids", "friends", "all"],
    tags: ["oreo", "дитячі"],
    days: 4,
    desc: "Шоколадні коржі, ванільний крем з крихтою печива та шапка з Oreo. Улюбленець підлітків.",
  },
  {
    id: "fraisier",
    name: "Фрезьє",
    price: 145,
    img: "fraisier",
    cats: ["loved", "dessert", "all"],
    tags: ["полуниця", "французький"],
    days: 4,
    desc: "Французька класика: мигдальний бісквіт, крем мусселін і ціла полуниця в розрізі.",
  },
  {
    id: "pistachio-raspberry-cake",
    name: "Фісташка–малина",
    price: 165,
    img: "slice",
    cats: ["loved", "friends", "dessert", "all"],
    tags: ["хіт", "горіхові", "ягоди"],
    days: 5,
    desc: "Наш бестселер: горіховий бісквіт, фісташковий кремчиз і яскраве малинове конфі.",
  },
  {
    id: "strawberry-chiffon",
    name: "Полуничний шифон",
    price: 145,
    img: "strawslice",
    cats: ["parents", "kids", "dessert", "all"],
    tags: ["легкий", "полуниця"],
    days: 4,
    desc: "Повітряний шифоновий бісквіт, вершки й свіжа полуниця. Легко, як літній ранок.",
  },
  {
    id: "tiramisu-cake",
    name: "Тірамісу",
    price: 155,
    img: "tiramisu",
    cats: ["colleagues", "parents", "dessert", "all"],
    tags: ["кава", "маскарпоне"],
    days: 4,
    desc: "Савоярді в еспресо, крем маскарпоне і какао. Торт-версія улюбленого десерту.",
  },
  {
    id: "lemon-meringue",
    name: "Лимонне безе",
    price: 145,
    img: "meringue",
    cats: ["friends", "parents", "dessert", "all"],
    tags: ["тарт", "цитрус"],
    days: 4,
    desc: "Пісочна основа, лимонний курд і підпалене італійське безе. Кислинка, що закохує.",
  },
];

MARIDAY.desserts = [
  { id: "macaron-set", name: "Набір макарон", price: 32, img: "macarons", cat: "macarons", unit: "12 шт", desc: "12 макаронів у сезонних смаках. Ідеально до candy bar." },
  { id: "pastel-macarons", name: "Пудрові макарони", price: 28, img: "pinkmac", cat: "macarons", unit: "10 шт", desc: "Ніжні макарони пудрових кольорів у подарунковій коробці." },
  { id: "cupcakes-6", name: "Капкейки ×6", price: 36, img: "cupcakes", cat: "cupcakes", unit: "6 шт", desc: "Шість капкейків з кремовою шапкою та ягідною начинкою." },
  { id: "unicorn-cupcakes", name: "Капкейки «Єдиноріг»", price: 39, img: "swirl", cat: "cupcakes", unit: "6 шт", desc: "Райдужний крем і посипка — хіт дитячих свят." },
  { id: "oreo-cupcakes", name: "Капкейки Oreo", price: 38, img: "blackoreo", cat: "cupcakes", unit: "6 шт", desc: "Шоколадні капкейки з кремом cookies & cream." },
  { id: "red-velvet-cupcakes", name: "Red velvet", price: 38, img: "redvelvet", cat: "cupcakes", unit: "6 шт", desc: "Оксамитовий бісквіт, кремчиз і малинова крихта." },
  { id: "cherry-cupcakes", name: "Вишневі капкейки", price: 36, img: "cherrycup", cat: "cupcakes", unit: "6 шт", desc: "Ванільний бісквіт, вишневе конфі та вершкова шапка з вишенькою." },
  { id: "donuts-6", name: "Донати ×6", price: 24, img: "donuts", cat: "sets", unit: "6 шт", desc: "Пухкі донати з глазур'ю та посипкою в кольорах вашого свята." },
  { id: "brownie-box", name: "Брауні-бокс", price: 26, img: "brownie", cat: "sets", unit: "9 шт", desc: "Вологі шоколадні брауні з тягучим центром." },
  { id: "cookie-box", name: "Печиво з посипкою", price: 18, img: "cookie", cat: "sets", unit: "8 шт", desc: "Хрустке зовні й м'яке всередині — з кольоровою посипкою." },
  { id: "tiramisu-box", name: "Tiramisu box", price: 28, img: "tiramisu", cat: "sets", unit: "1 бокс", desc: "Класичне тірамісу у фірмовій коробці Mariday." },
  { id: "trifle-set", name: "Дегустаційний сет", price: 45, img: "slice", cat: "sets", unit: "9 трайфлів", desc: "9 міні-трайфлів — усі начинки кондитерської в одній коробці." },
  { id: "candy-bar-s", name: "Candy bar S", price: 120, img: "pastel", cat: "candybar", unit: "10–15 гостей", desc: "Міні-сет десертів: капкейки, макарони, трайфли." },
  { id: "candy-bar-m", name: "Candy bar M", price: 220, img: "vanilla", cat: "candybar", unit: "20–30 гостей", desc: "Асорті десертів Mariday з декором під ваше свято." },
  { id: "candy-bar-l", name: "Candy bar L", price: 360, img: "gold", cat: "candybar", unit: "40–60 гостей", desc: "Солодкий стіл під ключ: торт-акцент, десерти, оформлення." },
];

MARIDAY.dessertCats = [
  { id: "all", label: "Усе" },
  { id: "cupcakes", label: "Капкейки" },
  { id: "macarons", label: "Макарони" },
  { id: "sets", label: "Сети й бокси" },
  { id: "candybar", label: "Candy bar" },
];

// Cross-section colours (bottom → top), photo and mood tags for every flavour
MARIDAY.flavorMeta = {
  "pistachio-raspberry": { img: "slice", tone: "#b9cf8f", layers: ["#d8c48e", "#b9cf8f", "#c2263f"], moods: ["nut", "berry"], sweet: 3, sour: 4 },
  snickers: { img: "brownie", tone: "#c27a2c", layers: ["#4a2418", "#d9b48a", "#c27a2c"], moods: ["choc", "nut"], sweet: 5, sour: 1 },
  "berry-forest": { img: "raspberries", tone: "#c23a5a", layers: ["#f0dca0", "#f7efe6", "#8e1b36"], moods: ["berry", "light"], sweet: 2, sour: 4 },
  "banana-caramel": { img: "pour", tone: "#e3c26b", layers: ["#e3c26b", "#f7efe6", "#c27a2c"], moods: ["caramel"], sweet: 4, sour: 1 },
  "cherry-duo-choc": { img: "forest", tone: "#a3203f", layers: ["#3e1c14", "#6b3a2a", "#e8d3b8", "#7a0b1c"], moods: ["choc", "berry"], sweet: 3, sour: 3 },
  "vanilla-berry": { img: "strawslice", tone: "#e58aa0", layers: ["#f2dfa6", "#f7efe6", "#d2445e"], moods: ["light", "berry"], sweet: 3, sour: 2 },
  kinder: { img: "mousse", tone: "#c79a6b", layers: ["#4a2418", "#c79a6b", "#5b3020"], moods: ["choc", "nut"], sweet: 5, sour: 1 },
  "lemon-raspberry": { img: "fraisier", tone: "#f0d54a", layers: ["#f3e08a", "#f2a7b6", "#b3173a", "#f5d742"], moods: ["light", "berry"], sweet: 2, sour: 5 },
  plombir: { img: "blackoreo", tone: "#e9dcc0", layers: ["#f0dca0", "#fbf3dc", "#2b1610"], moods: ["light", "choc"], sweet: 4, sour: 1 },
};

MARIDAY.moods = [
  { id: "all", label: "Усі смаки" },
  { id: "choc", label: "Шоколадні" },
  { id: "berry", label: "Ягідні" },
  { id: "nut", label: "Горіхові" },
  { id: "light", label: "Легкі" },
  { id: "caramel", label: "Карамельні" },
];

// One place for contact details used across the site
MARIDAY.contacts = {
  instagram: "https://www.instagram.com/mariday.cake/",
  instagramHandle: "@mariday.cake",
  whatsapp: "31600000000",
  whatsappLabel: "+31 6 … (уточнити)",
  email: "hello@mariday.cake",
  city: "Alkmaar, Nederland",
  hours: { from: 9, to: 20 },
};

// Admin panel (/admin) and live content: the Supabase project that stores what you edit there.
// Порожньо = сайт показує дані з цього файлу. Як підключити — README, розділ «Адмін-панель».
MARIDAY.backend = {
  supabaseUrl: "",
  supabaseKey: "", // anon public key
  bucket: "media",
};

// Reviews ("Пошта від гостей"): js/reviews.js shows MARIDAY.reviews (below) plus reviews guests send from the site.
// Без бекенду нові відгуки зберігаються лише в браузері автора. Щоб їх бачили всі відвідувачі,
// заповніть supabaseUrl + supabaseKey (anon public key) — SQL для таблиці є в README.
MARIDAY.reviewsBackend = {
  supabaseUrl: "",
  supabaseKey: "",
  table: "reviews",
};

MARIDAY.reviewOccasions = [
  { id: "birthday", label: "День народження" },
  { id: "wedding", label: "Весілля" },
  { id: "bento", label: "Бенто" },
  { id: "kids", label: "Дитяче свято" },
  { id: "anniversary", label: "Річниця" },
  { id: "corporate", label: "Корпоратив" },
  { id: "desserts", label: "Candy bar" },
  { id: "justbecause", label: "Просто так" },
];

// Resolve photo paths for both the root page and /pages/
(function () {
  const base = location.pathname.includes("/pages/") ? "../img/cakes/" : "img/cakes/";
  MARIDAY.img = (name) => base + name + ".jpg";
  MARIDAY.cakes.forEach((c) => { c.image = MARIDAY.img(c.img); });
  MARIDAY.desserts.forEach((d) => { d.image = MARIDAY.img(d.img); });
})();

MARIDAY.bentoDecor = [
  { id: "light", name: "Легкий декор", price: 8, note: "короткий напис / простий малюнок" },
  { id: "medium", name: "Середній декор", price: 15, note: "малюнок середньої складності / фотодрук" },
  { id: "complex", name: "Складний декор", price: 25, note: "складний малюнок або об’ємний декор" },
];

MARIDAY.bentoBase = 35;

MARIDAY.categories = [
  { id: "all", label: "Усі" },
  { id: "friends", label: "Друзям" },
  { id: "kids", label: "Дітям" },
  { id: "parents", label: "Батькам" },
  { id: "colleagues", label: "Колегам" },
  { id: "loved", label: "Коханим" },
  { id: "wedding", label: "Весільні" },
  { id: "dessert", label: "Десертні" },
];

MARIDAY.priceFactors = [
  {
    title: "Вага",
    text: "Базова ціна залежить від ваги. Орієнтир — 150–200 г на гостя для бенкету.",
  },
  {
    title: "Складність декору",
    text: "Кремові квіти, скульптура, ручний розпис і фігурки впливають на фінальну вартість.",
  },
  {
    title: "Начинка",
    text: "Більшість начинок включені в базову ціну. Преміум-інгредієнти можуть додати доплату.",
  },
  {
    title: "Терміновість",
    text: "Замовлення «на завтра» — доплата +20% (крім бенто). Рекомендуємо 5–7 днів наперед.",
  },
  {
    title: "Доставка",
    text: "Самовивіз у Alkmaar — безкоштовно. Доставка по Нідерландах розраховується індивідуально.",
  },
];

MARIDAY.faq = [
  {
    cat: "order",
    q: "Як зробити замовлення?",
    a: "Оберіть торт у каталозі або зберіть його в конструкторі, додайте в кошик і заповніть заявку. Також можна написати в Instagram @mariday.cake або WhatsApp.",
  },
  {
    cat: "time",
    q: "За скільки днів потрібен торт?",
    a: "Бенто — від 1 дня. Торти від 1,5 кг — бажано за 5–7 днів. Скульптурні та весільні — за 2–3 тижні.",
  },
  {
    cat: "order",
    q: "Чи робите весільні торти?",
    a: "Так. Розрахуємо вагу за нормою 150–200 г на гостя, підберемо дизайн і начинки. Можлива дегустація.",
  },
  {
    cat: "order",
    q: "Чи можна зі своїм дизайном?",
    a: "Звісно. Надішліть референси менеджеру — адаптуємо під стиль Mariday і прорахуємо вартість.",
  },
  {
    cat: "delivery",
    q: "Де забрати замовлення?",
    a: "Самовивіз у Alkmaar. Доставка по регіону та Нідерландам — за домовленістю з менеджером.",
  },
  {
    cat: "pay",
    q: "Як оплатити?",
    a: "Заявка підтверджується менеджером після передоплати. Оплата — банківський переказ / iDEAL.",
  },
];

MARIDAY.faqMore = [
  { cat: "taste", q: "Чи можна дві начинки в одному торті?", a: "Так, у ярусних тортах кожен ярус може мати свою начинку. В одноярусних — одна начинка, щоб зберегти баланс смаку." },
  { cat: "taste", q: "Чи є дегустація перед весіллям?", a: "Так! Дегустаційний сет із 9 міні-трайфлів — усі смаки в одній коробці. Після дегустації — знижка на торт від 8 кг." },
  { cat: "taste", q: "Ви враховуєте алергії?", a: "Напишіть про алергії в коментарі до замовлення. Ми працюємо з горіхами, молоком, яйцями та глютеном, тож не можемо гарантувати повну відсутність слідів." },
  { cat: "time", q: "Чи можна замовити торт на завтра?", a: "Іноді так — залежить від завантаження. Термінове замовлення на наступний день має доплату +20% (крім бенто)." },
  { cat: "time", q: "Чи можна змінити замовлення?", a: "Деталі дизайну можна змінити до 4 днів до дати видачі. Вагу та начинку — до старту виробництва, уточнюйте в менеджера." },
  { cat: "delivery", q: "Як довезти торт додому?", a: "Тримайте коробку рівно на підлозі авто або на колінах пасажира, без різких гальмувань. Влітку — з кондиціонером." },
  { cat: "delivery", q: "Як зберігати торт?", a: "У холодильнику при +2…+6 °C до 72 годин. Діставайте за 30–40 хвилин до подачі — так смак розкриється найкраще." },
  { cat: "pay", q: "Яка передоплата?", a: "Зазвичай 50% для тортів і 100% для бенто та десертних сетів. Решта — при отриманні." },
  { cat: "order", q: "Чи можна напис на бенто?", a: "Так, коротка фраза до 25 символів входить у легкий декор. Малюнок за референсом — середній або складний декор." },
];

MARIDAY.faqCats = [
  { id: "all", label: "Усі", emoji: "✦" },
  { id: "order", label: "Замовлення", emoji: "🎂" },
  { id: "time", label: "Терміни", emoji: "⏳" },
  { id: "taste", label: "Смаки", emoji: "🍒" },
  { id: "delivery", label: "Доставка", emoji: "📦" },
  { id: "pay", label: "Оплата", emoji: "💳" },
];

// More answers for the FAQ page and its chat bot
MARIDAY.faqMore.push(
  { cat: "order", q: "Чи можна замовити торт без дизайну, просто смачний?", a: "Так! Мінімалістичний торт з кремом і ягодами — найшвидший варіант. Достатньо обрати вагу й начинку, а декор менеджер підбере під сезон." },
  { cat: "order", q: "Чи робите торти з фотодруком?", a: "Робимо їстівний фотодрук на бенто й тортах. Надішліть фото в хорошій якості — воно входить у середній декор." },
  { cat: "order", q: "Чи можна замовити candy bar без торта?", a: "Так. Candy bar S, M і L збираються з капкейків, макаронів, трайфлів та брауні, а торт-акцент додається за бажанням." },
  { cat: "order", q: "Чи є подарункові сертифікати?", a: "Так, від €20 до €1000 — електронні або друковані в конверті. Зібрати сертифікат можна на сторінці «Подарунковий сертифікат»." },
  { cat: "order", q: "Чи працюєте з компаніями?", a: "Так: торти з логотипом, брендовані бокси капкейків, печиво для конференцій і candy bar для офісу. Для компаній — рахунок-фактура та корпоративні умови від 50 осіб." },
  { cat: "time", q: "Коли найкраще бронювати дату?", a: "Вихідні у травні–вересні та грудні розлітаються першими. Для весіль радимо бронювати за 1–2 місяці, для звичайних свят — за 1–2 тижні." },
  { cat: "time", q: "О котрій можна забрати торт?", a: "Час самовивозу в Alkmaar погоджуємо під вас — зазвичай з 10:00 до 20:00. Точну адресу й годину надсилаємо після підтвердження." },
  { cat: "taste", q: "Який смак найпопулярніший?", a: "Беззаперечний бестселер — фісташка–малина. Слідом ідуть «Вишня і два шоколади» та «Снікерс». Якщо сумніваєтесь — беріть дегустаційний сет." },
  { cat: "taste", q: "Чи є торти без глютену або без лактози?", a: "Окремого безглютенового цеху в нас немає, тому гарантувати відсутність слідів не можемо. Напишіть менеджеру — підкажемо найбезпечніший варіант." },
  { cat: "taste", q: "Наскільки солодкі ваші торти?", a: "Ми балансуємо солодкість кислинкою ягід і кремчизом, тож торти не «приторні». На карті смаків для кожної начинки є шкала солодкості та кислинки." },
  { cat: "taste", q: "Чи використовуєте мастику?", a: "Ні, ми працюємо з кремом, ганашем, живими квітами, ягодами та шоколадним декором. Мастику використовуємо лише для дрібних фігурок за запитом." },
  { cat: "wedding", q: "За скільки замовляти весільний торт?", a: "Ідеально — за 1–2 місяці, мінімум за 2–3 тижні. Так ми встигнемо дегустацію, ескіз і погодження з вашим декоратором." },
  { cat: "wedding", q: "Скільки ярусів потрібно на весілля?", a: "Орієнтуйтеся на 150–200 г на гостя: до 25 гостей — 1–2 яруси, 40–60 гостей — 3 яруси, понад 70 — 4 і більше. Калькулятор є на сторінці «Весільні торти»." },
  { cat: "wedding", q: "Чи привозите торт на локацію весілля?", a: "Так, ярусні торти ми доставляємо самі й збираємо на місці: встановлюємо на стійку, додаємо живі квіти й перевіряємо, щоб усе стояло ідеально." },
  { cat: "wedding", q: "Чи можна живі квіти на торті?", a: "Так, ми використовуємо безпечні їстівні або оброблені квіти й ізолюємо стебла. Квіти можна узгодити з вашим флористом, щоб усе було в одній гамі." },
  { cat: "wedding", q: "Чи є дегустація для пар?", a: "Так — дегустаційний сет із 9 міні-трайфлів (€45). Після дегустації діє знижка на весільний торт від 8 кг." },
  { cat: "delivery", q: "Скільки коштує доставка?", a: "Самовивіз у Alkmaar безкоштовний. Доставку рахуємо індивідуально за відстанню та складністю торта — менеджер назве точну суму до передоплати." },
  { cat: "delivery", q: "Чи можна доставити торт сюрпризом?", a: "Так! Вкажіть адресу, час і номер людини, яка прийме торт. Можемо додати листівку з вашим текстом." },
  { cat: "delivery", q: "Чи доставляєте в Амстердам, Гарлем, Утрехт?", a: "Так, доставляємо по всій Північній Голландії та в інші провінції. На сторінці «Доставка» є карта міст із орієнтовним часом у дорозі." },
  { cat: "care", q: "Як перевозити торт в авто?", a: "Ставте коробку на рівну поверхню — підлогу авто або багажник без нахилу, не на сидіння. Їдьте плавно, влітку вмикайте кондиціонер." },
  { cat: "care", q: "Чи можна заморозити торт?", a: "Можна заморозити залишки без декору, щільно загорнувши в плівку, до 1 місяця. Розморожуйте в холодильнику протягом ночі." },
  { cat: "care", q: "Як правильно нарізати торт?", a: "Беріть довгий ніж, змочуйте в гарячій воді й витирайте після кожного розрізу. Ярусні торти ріжте з верхнього ярусу, попередньо знявши стійки й дюбелі." },
  { cat: "care", q: "Скільки торт може стояти на столі?", a: "Кремові торти — до 1–2 годин при кімнатній температурі. Влітку й на вулиці — менше, тому подавайте ближче до кінця свята." },
  { cat: "pay", q: "Чи можна оплатити повністю при отриманні?", a: "Ні, дату ми бронюємо тільки після передоплати. Решту суми за торт можна внести при отриманні." },
  { cat: "pay", q: "Чи можна отримати рахунок-фактуру?", a: "Так, для компаній і замовлень на захід — виставляємо рахунок. Вкажіть реквізити в коментарі до заявки." },
  { cat: "pay", q: "Що буде, якщо я скасую замовлення?", a: "Скасування більш ніж за 7 днів — повертаємо передоплату. Пізніше — частину вже витрачено на продукти та декор, умови описані в публічній оферті." }
);

MARIDAY.faqCats.splice(4, 0, { id: "wedding", label: "Весілля", emoji: "💍" });
MARIDAY.faqCats.push({ id: "care", label: "Зберігання", emoji: "🧊" });

// Reviews wall. sample:true marks placeholder texts — replace them with real reviews
// from Instagram / Google (then the "приклади" note on the page disappears by itself).
MARIDAY.reviews = [
  { name: "Олена К.", city: "Alkmaar", occasion: "День народження", product: "Фісташка–малина, 2 кг", stars: 5, img: "slice", text: "Найсмачніший торт, який я куштувала в Нідерландах. Фісташка не перебиває малину, крем легкий — гості просили добавки, а потім рецепт 😅", sample: true },
  { name: "Sanne V.", city: "Heerhugowaard", occasion: "Весілля", product: "Трояндовий вальс, 4 яруси", stars: 5, img: "roses", text: "Mariday зробили наш весільний торт мрії. Привезли, зібрали на місці, квіти — точно під букет. Фотограф сказав, що це найкрасивіший торт сезону.", sample: true },
  { name: "Ірина та Макс", city: "Haarlem", occasion: "Весілля", product: "Дегустаційний сет + торт 8 кг", stars: 5, text: "Почали з дегустації — 9 трайфлів, сперечались два вечори 😄 Обрали два смаки на різні яруси. Усе пройшло спокійно, менеджер відповідала навіть пізно ввечері.", sample: true },
  { name: "Марта Л.", city: "Castricum", occasion: "Дитяче свято", product: "Рожеве морозиво", stars: 5, img: "pink", text: "Донька була в захваті від ріжка зверху! Усередині конфеті-бісквіт — діти верещали, коли розрізали. Торт ще й не надто солодкий, що для мене важливо.", sample: true },
  { name: "Thomas B.", city: "Amsterdam", occasion: "Корпоратив", product: "Бокси капкейків з логотипом", stars: 5, img: "cupcakes", text: "Замовляли 80 капкейків з нашим логотипом на запуск продукту. Все приїхало вчасно, кожен бокс — ідеальний. Команда досі згадує.", sample: true },
  { name: "Наталія Р.", city: "Zaandam", occasion: "Бенто", product: "Бенто з написом", stars: 5, img: "mint", text: "Замовила бенто ввечері — наступного дня вже забирала. Напис рівненький, коробочка як подарунок. Чоловік був дуже здивований ♥", sample: true },
  { name: "Lisa M.", city: "Bergen", occasion: "Candy bar", product: "Candy bar M", stars: 5, img: "macarons", text: "Candy bar на хрестини в пудрових тонах — макарони, капкейки, трайфли. Нічого не залишилось, а оформлення гості фотографували весь вечір.", sample: true },
  { name: "Андрій С.", city: "Hoorn", occasion: "День народження", product: "Снікерс, 1,5 кг", stars: 5, text: "Брав дружині на 30-річчя. Карамель тягнеться, арахіс хрусткий, крем не жирний. Вже замовив наступний — на річницю.", sample: true },
  { name: "Emma de J.", city: "Alkmaar", occasion: "День народження", product: "Ліловий сад", stars: 5, img: "lilac", text: "So pretty I almost didn't want to cut it. The blackberries were fresh and the cream wasn't too sweet. Mariday is now our family's go-to.", sample: true },
  { name: "Катерина П.", city: "Purmerend", occasion: "Дитяче свято", product: "Капкейки «Єдиноріг» ×12", stars: 5, img: "swirl", text: "Брали капкейки замість торта на день народження в садочку — зручно роздати, ніхто не забруднився. Вихователі теж просили контакти 🙂", sample: true },
  { name: "Олег та Віра", city: "Utrecht", occasion: "Весілля", product: "Ягідна корона, 3 яруси", stars: 5, img: "berries", text: "Везли торт аж до Утрехта, і він приїхав ідеальний. Ягоди свіжі, яруси рівні. Дякуємо за спокій у найважливіший день!", sample: true },
  { name: "Mila K.", city: "Den Helder", occasion: "Бенто", product: "Бенто з фотодруком", stars: 4, text: "Фото на бенто вийшло яскравим, смак — чудовий. Єдине: хотілося б більше вибору коробочок. Але замовлю ще!", sample: true },
  { name: "Юлія Б.", city: "Alkmaar", occasion: "Candy bar", product: "Candy bar L", stars: 5, img: "gold", text: "Ювілей мами на 50 гостей. Торт-акцент із золотими макаронами плюс десерти — усе в одній палітрі. Мама плакала від радості.", sample: true },
  { name: "Daan H.", city: "Heiloo", occasion: "Корпоратив", product: "Торт з логотипом", stars: 5, img: "drip", text: "Taart voor het 10-jarig jubileum van ons bedrijf. Strak, smaakvol en precies op tijd. Echte aanrader.", sample: true },
  { name: "Світлана Г.", city: "Haarlem", occasion: "День народження", product: "Вишня і два шоколади", stars: 5, img: "forest", text: "Для чоловіка-шоколадоголіка — саме те. Вишня дає кислинку, ганаш як оксамит. Тепер це наш сімейний торт.", sample: true },
  { name: "Аліна Ш.", city: "Alkmaar", occasion: "Бенто", product: "Два бенто на гендер-паті", stars: 5, img: "pastel", text: "Дві коробочки, а всередині — рожевий крем 💗 Ефект був неймовірний, усі кричали. Дякую за ідею й таємницю!", sample: true },
  { name: "Roos P.", city: "Schagen", occasion: "Candy bar", product: "Донати й печиво", stars: 5, img: "donuts", text: "Donuts in de kleuren van ons feest — de kinderen waren dol op ze. Mooi verpakt en heel vriendelijk contact.", sample: true },
  { name: "Валерія Т.", city: "Amsterdam", occasion: "Весілля", product: "Candy bar + торт", stars: 5, img: "vanilla", text: "Замовляли повний солодкий стіл на камерне весілля. Mariday підлаштували все під наш декор, навіть таблички підписали від руки.", sample: true },
];
