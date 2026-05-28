# Qarib - Neighborhood Services Platform

**Qarib** (Arabic: قريب, meaning "nearby") is a neighborhood services platform that connects service providers with beneficiaries in their local area. The platform enables community members to offer and discover services such as home maintenance, tutoring, home cooking, and more.

## Project Structure

```
qarib/
├── docker-compose.yml     # PostgreSQL + PostGIS database
├── backend/               # Node.js/Express API server (TypeScript)
│   ├── src/
│   │   ├── server.ts      # Express app entry point
│   │   ├── config/        # Database and app configuration
│   │   ├── db/
│   │   │   ├── migrations/ # Knex database migrations
│   │   │   └── seeds/     # Sample seed data
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Auth and validation middleware
│   │   ├── models/        # Data models
│   │   └── services/      # Business logic
│   ├── knexfile.ts        # Knex CLI configuration
│   ├── package.json
│   └── tsconfig.json
└── mobile/                # React Native Expo app (planned)
```

## Getting Started

### Prerequisites

- Node.js v22+
- Docker and Docker Compose
- npm

### Setup

1. Start the database:
```bash
docker compose up -d db
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Run database migrations:
```bash
npm run db:migrate
```

4. (Optional) Seed sample data:
```bash
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

### Available Scripts (backend)

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm test` | Run tests |
| `npm run db:migrate` | Run pending database migrations |
| `npm run db:seed` | Run seed files |
| `npm run db:rollback` | Rollback last migration batch |

---

# قريب - منصة خدمات الحي

**قريب** هي منصة خدمات حي تربط مقدمي الخدمات بالمستفيدين في منطقتهم المحلية. تتيح المنصة لأفراد المجتمع تقديم واكتشاف خدمات مثل صيانة المنازل والدروس الخصوصية والطبخ المنزلي والمزيد.

## هيكل المشروع

```
qarib/
├── docker-compose.yml     # قاعدة بيانات PostgreSQL + PostGIS
├── backend/               # خادم API باستخدام Node.js/Express (TypeScript)
│   ├── src/
│   │   ├── server.ts      # نقطة دخول التطبيق
│   │   ├── config/        # إعدادات قاعدة البيانات والتطبيق
│   │   ├── db/
│   │   │   ├── migrations/ # ترحيلات قاعدة البيانات
│   │   │   └── seeds/     # بيانات تجريبية
│   │   ├── routes/        # معالجات المسارات
│   │   ├── middleware/    # وسيط المصادقة والتحقق
│   │   ├── models/        # نماذج البيانات
│   │   └── services/      # منطق الأعمال
│   ├── knexfile.ts        # إعدادات Knex CLI
│   ├── package.json
│   └── tsconfig.json
└── mobile/                # تطبيق React Native Expo (مخطط)
```

## البدء

### المتطلبات

- Node.js v22+
- Docker و Docker Compose
- npm

### الإعداد

1. تشغيل قاعدة البيانات:
```bash
docker compose up -d db
```

2. تثبيت تبعيات الخادم:
```bash
cd backend
npm install
```

3. تشغيل ترحيلات قاعدة البيانات:
```bash
npm run db:migrate
```

4. (اختياري) إضافة بيانات تجريبية:
```bash
npm run db:seed
```

5. تشغيل خادم التطوير:
```bash
npm run dev
```

واجهة API ستكون متاحة على `http://localhost:3000`.
