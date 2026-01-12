# Forms Auth Starter V3

## Быстрый старт (с UI регистрации/логина)

- **Запуск**: `docker compose up --build`
- **UI**: `http://localhost:8081/index.html`
- **Keycloak админка**: `http://localhost:8080` (admin/admin)

### Что запускается:
- Keycloak (IAM) с импортом realm `forms-realm`.
- PostgreSQL базы: `kc_db` (Keycloak), `api_db` (API).
- API с UI для регистрации/логина и личным кабинетом.
- API логирует шаги аутентификации.

### Тестирование:
1. Открой `http://localhost:8081/index.html`.
2. Зарегистрируйся (email/пароль/имя).
3. Войди — перенаправишься в личный кабинет с email/ролями.
4. Логи: `docker compose logs -f auth_api`.

### Остановка:
`docker compose down`

## Аутентификация пользователей (регистрация и логин)

Проект включает UI для пользовательской регистрации и логина, интегрированный с Keycloak.

### Общая логика
- **Keycloak** — сервер аутентификации, хранит пользователей, пароли (hash), роли, выдаёт JWT-токены.
- **API** — бизнес-приложение, делегирует аутентификацию Keycloak, хранит ссылки на пользователей и бизнес-данные.
- **Интеграция** — API общается с Keycloak через REST API (создание пользователей, получение токенов), токены валидируются локально.

### Что хранится в базах
- **`kc_db` (Keycloak PostgreSQL)**: Полные данные пользователей (id, username=email, hash пароля, enabled, emailVerified, requiredActions, роли realm/client).
- **`api_db` (наша PostgreSQL)**: Минимальные данные (user_account: id, keycloak_user_id, email, full_name) + бизнес-данные (формы, черновики).

### Регистрация
1. Пользователь заходит на `http://localhost:8081/index.html` → `register.html`.
2. Вводит email, пароль (мин. 6 символов), имя (опционально).
3. JS отправляет POST `/public/api/register` с JSON.
4. API проверяет email на уникальность в `api_db`.
5. API получает админ-токен Keycloak (авторизуется как админ).
6. API создаёт пользователя в Keycloak (POST `/admin/realms/forms-realm/users` с email, username, password, enabled=true, emailVerified=true, requiredActions=[], roles=["user"]).
7. API сохраняет в `api_db` запись с keycloak_user_id + email + full_name.
8. Возвращает успех; пользователь может логиниться.

### OAuth 2.0 Authorization Code Flow with PKCE
- **Старт**: `loginWithKeycloak()` (`auth-api/src/main/resources/static/assets/auth.js`) генерирует `code_verifier`, сохраняет его в `localStorage`, строит `code_challenge` и редиректит пользователя на Keycloak `/protocol/openid-connect/auth`.
- **Авторизация**: после успешного ввода логина/пароля Keycloak возвращает браузер на `callback.html` с параметром `code`.
- **Обмен кода**: `handleCallback()` отправляет POST `/public/api/exchange-code` → `AuthService.exchangeCode()` (`auth-api/src/main/java/com/example/auth/auth/AuthService.java`) запрашивает токены у Keycloak (grant `authorization_code` + `code_verifier`).
- **Сохранение токена**: SPA кладёт `access_token` и `refresh_token` в `localStorage` и делает `window.location.replace('/dashboard.html')`.
- **Проверка авторизации**: `loadDashboard()` вызывает `GET /me` с заголовком `Authorization: Bearer <token>`. `SecurityConfig` (`auth-api/src/main/java/com/example/auth/SecurityConfig.java`) валидирует JWT (подпись, срок, issuer `http://keycloak:8080/...` или `http://localhost:8080/...`).
- **Дополнительно**: `/favicon.ico` и публичные страницы разрешены, `/public/api/exchange-code` открыт. Роли для новых пользователей назначаются через `assignRealmRole()` (тот же admin-токен).

### Личный кабинет
1. `/dashboard.html` загружается, JS вызывает GET `/me` с `Authorization: Bearer <token>`.
2. **Spring Security автоматически валидирует JWT** (подпись по JWK, срок действия, issuer=http://keycloak:8080/realms/forms-realm).
3. Если токен валиден — метод `me(@AuthenticationPrincipal Jwt jwt)` получает объект Jwt с claims.
4. API извлекает email, roles из токена (не запрашивает Keycloak).
5. Возвращает JSON: `{"sub": "<user_id>", "email": "...", "roles": {"roles": ["user", ...]}}`.
6. JS показывает приветствие и роли.

**Важно: проверки токена делает Spring Security перед методом `me`. Если токен невалиден/истёк — возвращается 401, метод не вызывается.**

### Запуск UI
```bash
docker compose down -v
docker compose up --build
```
- Keycloak: http://localhost:8080 (admin/admin)
- UI: http://localhost:8081/index.html
- Зарегистрируйтесь, войдите, проверьте личный кабинет.

### Логи
API логирует все шаги (входные данные, вызовы Keycloak, сохранение в БД):
```bash
docker compose logs -f auth_api
```

## Траблшутинг
* __401 invalid_token / issuer mismatch__: убедись, что переменная `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI` у `auth_api` = `http://keycloak:8080/realms/forms-realm`, и токен получен от host `keycloak`.
* __401 expired__: токен просрочен, возьми новый.
* __500 Form not found__: убедись, что применена миграция `V5__seed_demo_form.sql` (пересобери/перезапусти `auth_api`).
* __JSONB ошибки__: поле `payload` у `FormSubmission` аннотировано `@JdbcTypeCode(SqlTypes.JSON)`; пересобери `auth_api`, если меняли зависимости.
* __Регистрация/логин: Connection refused__: проверь, что Keycloak запущен и доступен по `http://keycloak:8080` (изнутри контейнера).
* __Регистрация: Account is not fully set up__: realm не переимпортирован, requiredActions не отключены — пересоздай с `docker compose down -v`.
* __Логин: invalid_grant__: проверь пароль, email, или requiredActions в Keycloak (должен быть пустой массив).
* __/me: 401__: токен истёк или невалиден — проверь issuer и подпись.

## Развёртывание на VPS (пример AWS EC2)
- **Инфраструктура**: EC2 с Docker/Compose, публичные DNS `forms.example.com` (UI/API) и `kc.example.com` (Keycloak).
- **HTTPS и reverse proxy**: Nginx + certbot. Прокси на `127.0.0.1:8081` и `127.0.0.1:8080`, сертификаты через `certbot --nginx -d forms.example.com -d kc.example.com`.
- **Переменные окружения**: в `docker-compose.yml` для `auth_api` и `keycloak` задайте `EXTERNAL_API_URL=https://forms.example.com`, `EXTERNAL_KEYCLOAK_URL=https://kc.example.com`.
- **Keycloak realm**: в `keycloak/realms/forms-realm.json` обновите `redirectUris`/`webOrigins` клиента `forms-spa` на `https://forms.example.com/callback.html` и `https://forms.example.com`. После правок перезапустите `docker compose down -v && docker compose up --build -d`.
- **Spring Boot конфигурация**: в `auth-api/src/main/resources/application.yml` установите `keycloak.base-url: https://kc.example.com` и `keycloak.login.redirect-uri: https://forms.example.com/callback.html`. При необходимости добавьте `app.cors.allowed-origins: "https://forms.example.com"`.
- **SecurityConfig**: `jwtDecoder()` (`auth-api/src/main/java/com/example/auth/SecurityConfig.java`) должен принимать issuer `https://kc.example.com/realms/forms-realm`.
- **Frontend**: `loginWithKeycloak()` использует `window.location.origin`, поэтому UI на HTTPS автоматически подставит корректный `redirect_uri`.
- **Пароли и роли**: убедитесь, что в master realm пользователь `admin` имеет роль `realm-admin`, клиент `admin-cli` включён и публичный (без client secret).
- **Проверка**: после деплоя откройте `https://forms.example.com/login.html`, выполните PKCE-вход, убедитесь, что `/me` возвращает данные. Логи: `docker compose logs -f auth_api`, `docker compose logs -f keycloak`.

### Маппинг доменов (пример `trievolve.com`)
- UI раздаётся с `https://trievolve.com` (или `https://app.trievolve.com`), Keycloak — с поддомена `https://kc.trievolve.com`.
- В Keycloak realm `forms-realm` → клиент `forms-spa`: `redirectUris = ["https://trievolve.com/callback.html"]`, `webOrigins = ["https://trievolve.com"]`.
- В `application.yml`: `keycloak.base-url: https://kc.trievolve.com`, `keycloak.login.redirect-uri: https://trievolve.com/callback.html`.
- `SecurityConfig.jwtDecoder()` должен принимать issuer `https://kc.trievolve.com/realms/forms-realm`.
- `loginWithKeycloak()` использует `window.location.origin`, поэтому при обслуживании UI с `trievolve.com` отправка PKCE-запроса и редирект происходят автоматически.

## Кастомизация страниц авторизации в Keycloak
- **Тема**: создайте каталог `keycloak/themes/trievolve/` с файлами `theme.properties`, `login/login.ftl`, `login/register.ftl`, CSS/JS в `login/resources/`. Смонтируйте в контейнер (`docker-compose.yml`: `./keycloak/themes:/opt/keycloak/themes`).
- **Подключение**: после старта зайдите в Keycloak (`Realm Settings → Themes`) и выберите новую тему в поле `Login Theme`.
- **Разработка**: для hot-reload используйте `kc.sh build` с отключённым кэшем (`kc.sh build --spi-theme-cache-themes=false ...`) и перезапустите контейнер.
- **Статика**: подключайте свои ресурсы через `${url.resourcesPath}` в шаблонах. Обязательно сохраняйте обязательные элементы (`username`, `password`, `kc-form`), иначе Keycloak отклонит форму.
- **Альтернативы**: если нужна полностью своя SPA, можно использовать Direct Grant (ROPC) или собственный backend, но это менее безопасно. Рекомендуемый подход — темизировать Keycloak и оставить логику проверки паролей внутри него.
