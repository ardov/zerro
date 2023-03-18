Это неофициальный клиент для [Дзен-мани](http://zenmoney.ru/)

## Что внутри?

- Мощные бюджеты на основе конвертов, как в [YNAB](https://www.youneedabudget.com/)
- Планирование крупных трат с помощью целей
- Восстановление удалённых операций
- Групповые действия с операциями
  - Замена категории
  - Удаление
- Полный бэкап всех данных (пока без восстановления)

## Запускаем локально

1. Ставим [Yarn](https://yarnpkg.com/getting-started/install)
2. Клонируем репозиторий себе
3. Ставим зависимости `yarn`
4. Запускаем `yarn start` и идём на [http://localhost:3000](http://localhost:3000/)
5. Вы великолепны

## Запускаем локально в docker

1. `docker build -t zerro:dev .`
2. `docker run -it -d --rm -v ${PWD}:/app -v /app/node_modules -p 3000:3000 -e CHOKIDAR_USEPOLLING=true zerro:dev`

## Выкладываем на сервер

1. Получаем `Consumer Key` и `Consumer Secret` на [http://developers.zenmoney.ru](http://developers.zenmoney.ru/)
2. Заполняем поля в `/.env.production`
3. Запускаем `yarn build`

## Полезные ссылки

- [Официальная документация API Дзен-мани](https://github.com/zenmoney/ZenPlugins/wiki/ZenMoney-API)
