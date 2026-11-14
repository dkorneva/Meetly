# Meetly — frontend

React Native, Expo, TypeScript.

Из этой папки: `npm ci`, затем `npm start`. Для браузера: `npm run web`. Настройки клиента — `.env`. Проверки: `npm run typecheck`, `npm test`, `npm run check:fsd`.

Полная инструкция: [README проекта](../README.md). Документация кода: `npm run docs` создаёт `docs/SIGNATURES.md` и `docs/api/index.html` внутри frontend.

`.env` и его локальные варианты исключены из Git. В `.env.example` находится только публичный адрес API. Любая переменная `EXPO_PUBLIC_*` встраивается в клиентскую сборку: секреты, строка подключения к БД и JWT_SECRET здесь недопустимы.
