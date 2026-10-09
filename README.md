# Mariday Cake

Сайт кондитерської **Mariday Cake** (Alkmaar) — структура та сценарій замовлення як у [bb-cake.ru](https://www.bb-cake.ru/), у брендовому стилі Mariday.

## Сторінки

- Головна
- Каталог тортів (фільтри за приводом)
- Картка товару (вага, начинка, кошик)
- Конструктор торта
- Бенто / міні-торти
- Карта смаків
- З чого складається ціна
- Десерти / candy bar (колекції, анатомія капкейка, пакети S/M/L, симулятор палітри, сезонне меню, тест «Який ви десерт?»)
- Про нас (історія в розділах, відео зі студії, кодекс студії, склад), доставка (зони, пакування, термометр торта), контакти (шпаргалка, партнерам, Instagram), FAQ (чат-помічник, база знань, калькулятор ваги, глосарій)
- Весільні торти, Відгуки, Подарунковий сертифікат (конструктор), Для бізнесу
- Журнал: головна + 6 статей (`journal-*.html`)
- Політика конфіденційності, публічна оферта

## Як влаштовано

- `css/main.css` — токени, шапка, футер, кошик і форма замовлення (спільні для всіх сторінок)
- `css/home.css`, `js/home*.js` — головна сторінка
- `css/pages.css`, `js/pages.js` — дизайн і анімації внутрішніх сторінок (GSAP + Lenis, з fallback без анімацій)
- `js/app.js` — логіка сторінок: каталог, конструктор, бенто, смаки, калькулятор, candy bar, FAQ тощо
- `css/editorial.css`, `css/editorial-pages.css`, `js/editorial.js` — редакційний шар: колаж-герої, секції, аккордеони, калькулятори, квіз, конструктор сертифіката, відгуки, чек-листи журналу
- `js/data.js` — торти, десерти, начинки, FAQ (41 питання — і для чат-бота, і для бази знань), **відгуки** (`MARIDAY.reviews`) і **контакти** (`MARIDAY.contacts` — номер WhatsApp і email)

Заявка з кошика формується на сайті й надсилається менеджеру через WhatsApp або email (бекенду немає).

## Відгуки («Пошта від гостей»)

- `js/reviews.js` + `css/reviews.css` — листівки на мотузці на головній (`#reviews`), стіна всіх відгуків `pages/reviews.html` і форма-листівка, якою гості пишуть відгук (на головній — у вікні, на сторінці відгуків — внизу)
- Стартові листівки — `MARIDAY.reviews` у `js/data.js` (`sample: true` = приклад; поки такі є, на стіні показується примітка). Замініть їх на реальні відгуки
- Без бекенду новий відгук зберігається **лише в браузері автора** (localStorage). Щоб його бачили всі відвідувачі й на обох сторінках, підключіть безкоштовний [Supabase](https://supabase.com):
  1. Створіть проєкт → SQL Editor → виконайте:

     ```sql
     create table public.reviews (
       id bigint generated always as identity primary key,
       created_at timestamptz not null default now(),
       name text not null check (char_length(name) between 2 and 40),
       text text not null check (char_length(text) between 10 and 400),
       city text not null default '' check (char_length(city) <= 30),
       rating int not null check (rating between 1 and 5),
       occasion text not null default 'justbecause',
       color text not null default 'pink',
       stamp text not null default 'roses',
       approved boolean not null default true
     );
     alter table public.reviews enable row level security;
     create policy "read approved" on public.reviews for select to anon using (approved);
     create policy "guests post" on public.reviews for insert to anon with check (true);
     ```

     Хочете спершу перевіряти відгуки? Поставте `approved ... default false` і замініть останню політику на `with check (approved = false)` — тоді листівка з'явиться для всіх, коли ви ввімкнете `approved` у Table Editor (автор бачить свою одразу).
  2. Project Settings → API: скопіюйте **Project URL** і **anon public key** у `MARIDAY.reviewsBackend` в `js/data.js`

## Адмін-панель (`/admin`)

Відкрийте `ваш-сайт/admin/` — тут редагується все, з чого зібраний сайт:

- **Торти, десерти, начинки** — назва, ціна, опис, фото (завантаження з телефона чи комп'ютера), теги, приводи, порядок (перетягуванням), «сховати з сайту», дублювання, видалення. Для вітрини на головній можна додати фото торта без фону (PNG/WebP)
- **Вага і порції, бенто, «з чого ціна», відгуки, FAQ, контакти, усі довідники** (приводи, розділи, настрої смаків)
- **Сторінки** — кнопка «Редагувати» відкриває будь-яку сторінку сайту в режимі правок: клік по тексту — пишете, клік по фото чи відео — замінюєте, у посилань змінюється адреса. Внизу «Зберегти»
- **Медіатека** — усі завантажені фото й відео; фото автоматично стискаються до ~1800 px

Як це влаштовано: стандартний вміст лишається в `js/data.js` і HTML-сторінках, а все, що ви змінили, зберігається в Supabase й накладається зверху (`js/content.js`). Кнопка «↺ Стандартні» в кожному розділі повертає вміст із файлів.

### Підключення (≈5 хвилин, безкоштовно)

1. Створіть проєкт на [supabase.com](https://supabase.com)
2. **SQL Editor** → вставте весь файл `supabase/setup.sql` → у останньому рядку замініть `your@email.com` на свій email → **Run**
3. **Authentication → Users → Add user** → той самий email і пароль (галочка «Auto Confirm User»)
4. **Authentication → Sign In / Providers** → вимкніть «Allow new users to sign up» (входити зможете лише ви)
5. **Project Settings → API**: скопіюйте **Project URL** і **anon public key** у `MARIDAY.backend` у `js/data.js` і опублікуйте сайт

Відгуки гостей (`MARIDAY.reviewsBackend`) автоматично використовують той самий проєкт — лишається виконати SQL для таблиці `reviews` з розділу вище.

Поки Supabase не підключено, адмінка працює в **пробному режимі**: зміни зберігаються лише у вашому браузері, їх ніхто, крім вас, не бачить.

Безпека: anon key — публічний (так задумано Supabase), писати в базу й у сховище фото може лише email із таблиці `admins`.

## Запуск

```bash
cd "~/Desktop/торты"
python3 -m http.server 7788
```

Відкрийте http://localhost:7788

## Перед публікацією перевірити

- `MARIDAY.reviews` у `js/data.js` — це **приклади** (`sample: true`). Замініть на справжні відгуки; поки є приклади, на сторінці відгуків видно позначку
- Тексти про процеси (збірка ярусів на місці, пакування, холодові акумулятори, листівка-пам'ятка, рахунок-фактура, правила сертифіката, час у дорозі по зонах) — звірте з реальною практикою

## Далі можна підключити

- Реальні фото з Instagram / студії
- Актуальний WhatsApp у `js/data.js`, `js/layout.js` і `pages/contacts.html` (зараз +31 6 00000000)
- Telegram/WhatsApp webhook або Formspree для заявок
- Онлайн-оплату (iDEAL)
