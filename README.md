# EduFlow — O'quv Markazlari Uchun SaaS Platformasi

EduFlow — kichik o'quv markazlari, repetitorlar va xususiy o'qituvchilar uchun mo'ljallangan, to'liq funksional, ishlab chiqarishga tayyor (production-ready) ko'p ijarachili (Multi-tenant) ta'lim boshqaruv SaaS tizimi.

---

## 🏗 Arxitektura va Texnologiyalar

### Backend
* **Til & Platforma**: C# .NET 10 (ASP.NET Core Web API)
* **Arxitektura**: Clean Architecture (`Domain`, `Application`, `Infrastructure`, `WebApi`)
* **Ma'lumotlar bazasi**: PostgreSQL / EF Core Code First (Npgsql)
* **Xavfsizlik & Autentifikatsiya**: JWT Token, BCrypt Password Hashing, Role-based Authorization (`SuperAdmin`, `CenterAdmin`, `Teacher`)
* **Multi-Tenancy**: Global Query Filters orqali tashkilotlar ma'lumotlarini to'liq izolyatsiya qilish
* **Validatsiya**: FluentValidation
* **DTO Mapping**: AutoMapper
* **Integratsiya**: Telegram Bot API orqali avtomatik bildirishnomalar (`ITelegramService`)
* **Background Jobs**: To'lov eslatmalari uchun Background Hosted Service
* **API Hujjatlari**: OpenAPI / Scalar API Reference

### Frontend
* **Asos**: React 19 + TypeScript + Vite
* **Dizayn**: Tailwind CSS (zamonaviy premium SaaS dizayn tizimi)
* **Routing**: React Router
* **Ma'lumotlar almashinuvi**: Axios (Centralized API client with interceptors)
* **Ikonkalar**: Lucide React & Google Material Symbols
* **Til**: 100% tabiiy va tushunarli o'zbek tili

---

## 📂 Loyiha Tuzilishi

```
EduFlow/
├── EduFlow.slnx
├── docker-compose.yml
├── README.md
│
├── src/
│   ├── EduFlow.Domain/                 # Asosiy modellar, Enumlar va Entitylar
│   │   ├── Common/                     # BaseEntity, AuditableEntity, ITenantEntity
│   │   ├── Entities/                   # Organization, User, Teacher, Student, Group, Subject, Lesson, Attendance, Grade, Payment, Subscription
│   │   └── Enums/                      # UserRole, AttendanceStatus, PaymentStatus, LessonStatus, SubscriptionStatus
│   │
│   ├── EduFlow.Application/            # Biznes mantiq qatlami
│   │   ├── Common/                     # ApiResponse, PagedResult, Exceptions
│   │   ├── DTOs/                       # Barcha so'rov va javob DTO modellari
│   │   ├── Interfaces/                 # Xizmatlar interfeyslari (IStudentService, ITelegramService, va h.k.)
│   │   ├── Mapping/                    # AutoMapper profili
│   │   ├── Services/                   # Servis implementatsiyalari
│   │   └── Validators/                 # FluentValidation tekshiruvlari
│   │
│   ├── EduFlow.Infrastructure/         # Tashqi texnologiyalar va Ma'lumotlar bazasi
│   │   ├── Authentication/             # JwtTokenGenerator, CurrentUserService, TenantService
│   │   ├── BackgroundServices/         # To'lov eslatmalari background servisi
│   │   ├── Persistence/                # EduFlowDbContext, Migrations, DbInitializer (Seed Data)
│   │   └── Telegram/                   # Telegram Bot integratsiyasi
│   │
│   └── EduFlow.WebApi/                 # REST API Kontrollerlar va Middleware
│       ├── Controllers/                # Auth, Students, Teachers, Groups, Subjects, Lessons, Attendance, Grades, Payments, Reports, Settings, Admin
│       ├── Middleware/                 # GlobalExceptionHandlingMiddleware, TenantMiddleware
│       ├── Program.cs                  # Ilova sozlamalari va Startup
│       └── appsettings.json
│
└── frontend/
    └── eduflow-web/                    # React + TypeScript + Vite + Tailwind CSS Frontend
        ├── src/
        │   ├── components/             # Reusable UI modallar, badglar, pagination, spinner
        │   ├── context/                # AuthContext
        │   ├── layouts/                # DashboardLayout, AuthLayout
        │   ├── pages/                  # Dashboard, Students, Groups, Attendance, Grades, Payments, Reports, Settings, Admin
        │   ├── services/               # Typed Axios API xizmatlari
        │   ├── types/                  # TypeScript interfeyslari
        │   ├── App.tsx                 # Marshrutlar
        │   └── main.tsx
        └── package.json
```

---

## 🔑 Demo Kirish Ma'lumotlari (Seed Data)

Tizim birinchi marta ishga tushganda avtomatik ravishda demo o'quv markazi, o'qituvchilar, guruhlar, darslar va o'quvchilar bilan to'ldiriladi:

| Rol | Email | Parol | Huquqlari |
|---|---|---|---|
| **Admin** | `admin@smartedu.uz` | `admin123` (yoki `EduFlow2026!`) | To'liq boshqaruv (O'quv markazi, o'quvchilar, guruhlar, to'lovlar, davomat, hisobotlar va platforma) |
| **O'qituvchi** | `teacher@smartedu.uz` | `admin123` (yoki `EduFlow2026!`) | Darslar, davomat belgilash, baholash |
| **O'quvchi** | `student@eduflow.uz` | `admin123` (yoki `EduFlow2026!`) | Dars jadvali, baholar, uy vazifalari |
| **Ota-ona** | `parent@eduflow.uz` | `admin123` (yoki `EduFlow2026!`) | Farzandlar davomati, to'lovlar, baholar |

---

## 🚀 Loyihani Ishga Tushirish

### 1. PostgreSQL ni ishga tushirish (Docker orqali)
```bash
docker-compose up -d
```

### 2. Backend API ni ishga tushirish
```bash
cd c:/Users/User/Desktop/EduFlow
dotnet restore
dotnet build
dotnet run --project src/EduFlow.WebApi
```
* Backend API manzili: **http://localhost:5000**
* Scalar API Hujjatlari: **http://localhost:5000/scalar/v1**

### 3. Frontend (React) ni ishga tushirish
```bash
cd c:/Users/User/Desktop/EduFlow/frontend/eduflow-web
npm install
npm run dev
```
* Frontend manzili: **http://localhost:3000**

---

## 📱 Asosiy Funksiyalar va Ish Oqimi

1. **Dashboard:**
   * Bugungi darslar, qatnashganlar, kelmaganlar, qarzdorliklar va oylik tushum statistikasi.
2. **Davomat:**
   * Mobil telefondan ham bir bosishda *Qatnashdi*, *Sababli*, *Kelmadi*, *Kechikdi* holatlarini belgilash.
   * *"Barchani qatnashdi deb belgilash"* va bir martalik saqlash.
   * Kelmagan o'quvchilar ota-onalariga avtomatik Telegram ogohlantirishi.
3. **Baholash:**
   * Dars bo'yicha guruh o'quvchilariga ballar qo'yish va o'rtacha ballni avtomatik hisoblash.
4. **To'lovlar va Eslatmalar:**
   * To'lov muddati o'tgan qarzdorliklarni avtomatik aniqlash va Telegram orqali eslatmalar yuborish.
5. **Guruhlar va O'quvchilar:**
   * Qidiruv, filter, o'quvchini guruhga biriktirish va chiqarish.
6. **Hisobotlar:**
   * Davomat dinamikasi, daromad o'sishi va o'quvchilar ko'rsatkichlari grafiklari.
7. **Tariflar va Cheklovlar (SaaS Limits):**
   * FREE, STARTER va PRO tariflari (o'quvchi va guruh limitlari nazorat qilinadi).
