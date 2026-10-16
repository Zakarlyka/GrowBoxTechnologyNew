# План: повний пакет передачі проекту Agro Hogwards (Grow Box)

Мета: створити набір документів, з якими будь-яка людина або будь-який ШІ-асистент (Claude, GPT, Gemini, Cursor тощо) зможе без попереднього контексту зрозуміти проект і продовжити роботу.

## Що буде створено

Нова папка `docs/handover/` у корені проекту + один головний вхідний файл.

```text
HANDOVER.md                  <- головна точка входу: "читай мене першим"
docs/handover/
  01-overview.md             <- що це за продукт, для кого, ключові сценарії
  02-architecture.md         <- схема: React SPA -> Supabase -> ESP8266 -> Telegram
  03-tech-stack.md           <- версії, залежності, обмеження (date-fns 3.6.0 і т.д.)
  04-project-structure.md    <- карта папок і всіх ключових файлів з поясненням
  05-database.md             <- усі таблиці, колонки, RLS, функції, тригери
  06-edge-functions.md       <- кожна функція: вхід, вихід, секрети, хто викликає
  07-hardware-protocol.md    <- контракт ESP8266: телеметрія, settings JSON, коди режимів
  08-business-rules.md       <- усі "не ламати": Master Plant, сушка, Pump Lock, reboot 6с
  09-features.md             <- кожна сторінка/модуль: що робить, де код
  10-notifications.md        <- повний потік сповіщень (watchdog -> bell -> Telegram)
  11-i18n.md                 <- uk/en/ru, захищені терміни, правила перекладу
  12-ui-design-system.md     <- тема, токени, мобільні правила, патерни карток
  13-auth-roles.md           <- авторизація, ролі user/admin/developer, адмінка
  14-deployment.md           <- Lovable publish, Supabase, змінні, секрети (лише назви)
  15-known-issues.md         <- відкриті баги, техборг, ризики безпеки
  16-roadmap.md              <- Tier 2 / Tier 3 з аудиту, що не зроблено
  17-changelog.md            <- хронологія рішень з історії розробки
  18-ai-prompt.md            <- готовий промпт-інструкція для нового ШІ
  19-glossary.md             <- терміни: VPD, Master Plant, lifecycle, soak time...
```

## Зміст ключових розділів

- **HANDOVER.md** — 1 сторінка: що це, як запустити, порядок читання, 10 найважливіших правил, контакти/доступи, які треба передати окремо (Supabase, Lovable, Telegram бот, GitHub).
- **05-database.md** — актуальний стан із живої БД (не зі старих гайдів): таблиці, ключі `id` (UUID) проти `device_id` (токен заліза), колонки `status` (online/offline) і `lifecycle` (active/archived), `is_demo`, усі тригери, включно з дублікатами, які варто прибрати.
- **07-hardware-protocol.md** — повна схема `devices.settings`: `pump_mode`, `pump_time_sec`, `soak_time_sec`, `light_mode`, `timezone` (POSIX) + `timezone_iana`, `reboot_cmd`, коди помилок `PUMP_DRY_LOCK`/`NO_WATER`.
- **08-business-rules.md** — перенос усіх правил з пам'яті проекту та `SYSTEM_LOGIC_STATE.md` в один список з поясненням "чому".
- **15-known-issues.md** — чесний список: дублікати тригерів на `devices`/`device_logs`/`auth.users` (подвійні сповіщення), `cascade_delete_device_data` суперечить архіву, жорстко прописаний URL у тригері Telegram, застарілі документи (`DEPLOYMENT_GUIDE.md`, `MIGRATION_GUIDE.md`), попередження лінтера безпеки.
- **18-ai-prompt.md** — блок для копіювання в будь-який ШІ: роль, стек, жорсткі правила, які файли читати першими, заборони (не редагувати `types.ts`, не робити hard delete пристроїв, не перекладати бренд-терміни).

## Прибирання

- Старі документи (`DEPLOYMENT_GUIDE.md`, `deployment-guide.md`, `README-DEPLOYMENT.md`, `DEPLOYMENT.md`, `MIGRATION_GUIDE.md`, `MASTER_PROMPT_FULL.md`) не видаляються, а позначаються вгорі як "застаріло, див. HANDOVER.md".
- `README.md` оновлюється коротким описом і посиланням на HANDOVER.md.
- `SYSTEM_LOGIC_STATE.md` оновлюється до поточного стану.
- Створюється `AGENTS.md` з архітектурними правилами для ШІ-агентів.

## Технічні деталі

- Стан БД збирається реальними read-only запитами (таблиці, колонки, RLS-політики, тригери), а не з застарілих файлів.
- Кожна сторінка, хук і edge-функція читається, щоб опис відповідав коду.
- Секрети описуються лише назвами, без значень.
- Код застосунку не змінюється — лише документація.
- Наприкінці: перевірка, що всі посилання між документами працюють, та копія архіву `handover.zip` у Files для зручної передачі.
