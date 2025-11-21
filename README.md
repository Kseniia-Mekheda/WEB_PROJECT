# Веб застосунок для обробки трудомістких запитів користувача
<span>* в якості трудомісткої операції використовується "симуляція" - обчислення кількості простих чисел в діапазоні [1, n], де n - число введене користувачем</span>

### :computer: Технології
* React (Vite)
* Node.js
* BullMQ
* WebSockets
* MongoDB
* Mongoose
* MUI

### :triangular_ruler: Архітектура 
```mermaid
architecture-beta
    group docker(cloud)[Docker Network]

    service user(internet)[User]

    service frontend(server)[Frontend] in docker
    service backend(server)[Backend API] in docker
    service redis(disk)[Redis Queue] in docker
    service worker(server)[Workers] in docker
    service db(database)[MongoDB] in docker

    user:R -- L:frontend
    frontend:R -- L:backend
    backend:R -- L:redis
    redis:R -- L:worker
    backend:B -- T:db
    worker:B -- T:backend
```
### :loop: Sequence diagram
```mermaid
sequenceDiagram
    autonumber
    actor User as Користувач
    participant Client as React Client
    participant API as Backend API
    participant DB as MongoDB
    participant Redis as Redis Queue
    participant Worker as Worker Service

    Note over User, Client: Створення задачі
    User->>Client: Вводить число та натискає Create
    Client->>API: POST /api/tasks
    
    activate API
    API->>DB: Перевірка лімітів та створення Task
    DB-->>API: Task Document Created
    API->>Redis: Add Job to Queue
    Redis-->>API: Job ID
    API-->>Client: 201 Created
    deactivate API

    Note over Client, Worker: Асинхронна обробка
    Redis->>Worker: Worker забирає задачу
    activate Worker
    Worker->>DB: Оновлення статусу -> processing
    
    loop Обчислення
        Worker->>Worker: Розрахунок простих чисел
        Worker->>Redis: Update Progress
        Redis->>API: Event: progress
        API->>Client: WebSocket: progress update
        Client->>User: Оновлення Progress Bar
    end

    Worker->>DB: Оновлення статусу -> completed
    Worker->>Redis: Завершення роботи
    deactivate Worker

    Redis->>API: Event: completed
    API->>Client: WebSocket: task completed
    Client->>User: Відображення результату
```

### :rocket: Швидкий запуск 
#### 1. Клонування репозиторію
```bash
git clone <repository_link>
cd WEB_PROJECT
```
#### 2. Запуск через Docker
```bash
docker-compose up --build
```
 Якщо бажаєте вказати явно кількість контейнерів з worker (по дефолту запускається 1):
 ```bash
docker-compose up --build --scale=кількість_воркерів
```
#### 3. Перегляд проекту в браузері
Головна сторінка: http://localhost:3000

### :round_pushpin: Доступні ендпоінти
Для звичайного користувача (після логіну/реєстрації):
```bash
POST tasks/ - створити завдання
GET tasks/ - переглянути усі завдання
GET tasks/:jobId - отримати статус конкретного завдання
POST tasks/:jobId/cancel - скасувати завдання
```
Для адміністратора:
```bash
GET /overview - загальні дані про систему, кількість завдань за статусами і тд
GET /tasks - усі завдання в системі
GET /users - усі користувачі системи
POST /tasks/:jobId/cancel - скасування задачі (будь-якої)
```

