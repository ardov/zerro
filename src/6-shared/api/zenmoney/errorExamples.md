# Примеры ошибок Zenmoney API

Примеры ответов `/v8/diff/`. Идентификаторы заменены шаблонами. Один `serverError` не указывает, какая запись вызвала ошибку.

## validationError: несуществующий тег в бюджете

```json
{
  "code": "validationError",
  "message": "Invalid Relation \"Tag\" in Object Budget {{budget_id}}. Tag {{tag_id}} Doesn't Exist",
  "details": {
    "object": "budget",
    "objectID": "{{budget_id}}",
    "relation": "tag",
    "relationID": "{{tag_id}}"
  }
}
```

## serverError: внутренняя ошибка сервера

```json
{
  "code": "serverError",
  "message": "Server Inner Error. Try Again After Some Time. if Error Occurs Again Please Connect Zenmoney Support service."
}
```

## validationError: неверный формат времени

```json
{
  "code": "validationError",
  "message": "Wrong Format of currentClientTimestamp. Please Check Your Local Time"
}
```

## validationError: некорректный перевод

```json
{
  "code": "validationError",
  "message": "Invalid Object Transaction {{transaction_id}}. Transfer Transaction Must Have Both Income and Outcome Positive"
}
```

## validationError: неверное значение свойства

```json
{
  "code": "validationError",
  "message": "Invalid Property \"Outcome\" in Object Transaction {{transaction_id}}. Wrong Value"
}
```

## validationError: чужой объект

```json
{
  "code": "validationError",
  "message": "Invalid Property \"User\" in Object Reminder {{reminder_id}}. Wrong User of Object"
}
```
