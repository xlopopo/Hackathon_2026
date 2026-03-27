# 🧬 ПрофДНК — Платформа для профориентологов

<div align="center">

![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**Цифровой помощник психолога-профориентолога**

</div>

---

## 📌 О проекте

**ПрофДНК** — веб-платформа для психологов-профориентологов, которая автоматизирует процесс тестирования клиентов и формирования отчётов.

### Проблема
Психологи тратят огромное количество времени на рутину:
- Ручное создание и рассылка тестов
- Подсчёт результатов вручную
- Оформление отчётов в Word

### Решение
ПрофДНК берёт всю рутину на себя — психолог создаёт тест, отправляет ссылку клиенту, система автоматически считает результаты и формирует отчёт.

---

## ✨ Возможности

### 👑 Администратор
- Создание аккаунтов психологов
- Управление подписками (продление / блокировка / отзыв)
- Email-уведомления об истечении подписки
- Просмотр всех тестов и прохождений платформы

### 🧠 Психолог
- **Конструктор тестов** — 4 типа вопросов (одиночный, множественный, текст, шкала)
- **Поля клиента** — настройка какие данные собирать (ФИО, email, телефон и др.)
- **Уникальная ссылка** — клиент проходит тест без регистрации
- **Автоподсчёт** — система сама считает баллы по метрикам
- **Конструктор отчётов** — блоки (балл, метрики, интерпретация, рекомендации)
- **Интерпретации** — диапазоны баллов с автогенерацией
- **Отправка отчёта** — на email клиента прямо из личного кабинета
- **Предпросмотр** — HTML-отчёт прямо в браузере

### 👤 Клиент
- Прохождение теста по ссылке без регистрации
- Красивый интерфейс с поддержкой всех типов вопросов
- Результаты отправляет психолог (не показываются автоматически)

---

## 🛠 Технологии

| Слой | Стек |
|------|------|
| **Frontend** | React 19, Vite 8, React Router 7, Axios, TailwindCSS |
| **Backend** | FastAPI, SQLAlchemy 2.0 (async), Pydantic v2 |
| **База данных** | PostgreSQL 15 |
| **Авторизация** | JWT (python-jose), bcrypt |
| **Отчёты** | python-docx, Jinja2 |
| **Email** | fastapi-mail |
| **Инфраструктура** | Docker, Docker Compose |

---

## 🚀 Быстрый старт

### Требования

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 18+](https://nodejs.org/)
- Git

### 1. Клонировать репозиторий

```bash
git clone https://github.com/Haru1355/F12
cd F12
```

### 2. Запустить бэкенд + БД

```bash
docker-compose up -d
```

### 3. Применить миграции (только первый раз)

```bash
docker-compose exec db psql -U postgres -d profdnk -c "
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS education_level VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE tests ADD COLUMN IF NOT EXISTS client_fields JSONB;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS blocks JSONB;
"
```

### 4. Запустить фронтенд

```bash
cd frontend
npm install
npm run dev
```

### 5. Открыть в браузере

```
http://localhost:5173
```

---

## 🔑 Данные для входа

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@profdnk.ru | admin123 |

> ⚠️ Смените пароль администратора перед использованием в продакшене

---

## 📁 Структура проекта

```
F12/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   └── endpoints/   # auth, users, tests, sessions, reports...
│   │   ├── core/            # Конфигурация, БД, безопасность
│   │   ├── models/          # SQLAlchemy модели
│   │   ├── schemas/         # Pydantic схемы
│   │   └── services/        # Бизнес-логика
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/           # Страницы приложения
│       ├── services/        # API сервисы (axios)
│       ├── components/      # Компоненты
│       └── contexts/        # React contexts
├── docker-compose.yml
└── README.md
```

---

## 🌐 API документация

После запуска доступна по адресу:

```
http://localhost:8000/docs
```

---

## 📊 Архитектура

```
┌─────────────────┐         ┌──────────────────┐
│   React (Vite)  │ ──────► │  FastAPI Backend  │
│  localhost:5173 │  axios  │  localhost:8000   │
└─────────────────┘         └────────┬─────────┘
                                     │ SQLAlchemy async
                             ┌───────▼──────────┐
                             │  PostgreSQL 15   │
                             │  localhost:5432  │
                             └──────────────────┘
```

---

## 👥 Роли пользователей

```
Администратор
├── Создаёт психологов
├── Управляет подписками
└── Видит всю статистику платформы

Психолог
├── Создаёт тесты с конструктором
├── Отправляет ссылки клиентам
├── Просматривает результаты
└── Отправляет отчёты клиентам на email

Клиент (без регистрации)
├── Переходит по уникальной ссылке
├── Проходит тест
└── Получает отчёт на email от психолога
```

---

## 📧 Настройка Email (опционально)

Создай файл `backend/.env`:

```env
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=your_email@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
```

> Без настройки email — письма выводятся в логи Docker (dev режим)

---

## 🏆 Реализовано в рамках хакатона

| Функция | Статус |
|---------|--------|
| Полный цикл: тест → прохождение → отчёт | ✅ |
| Система ролей (admin / psychologist / client) | ✅ |
| Конструктор тестов с 4 типами вопросов | ✅ |
| Автоматический подсчёт баллов по метрикам | ✅ |
| Конструктор шаблонов отчётов (блоки) | ✅ |
| Интерпретации с автогенерацией диапазонов | ✅ |
| Отправка отчётов на email | ✅ |
| Управление подписками психологов | ✅ |
| Уведомления об истечении подписки | ✅ |

---

## 📄 Лицензия

MIT License — используйте свободно.