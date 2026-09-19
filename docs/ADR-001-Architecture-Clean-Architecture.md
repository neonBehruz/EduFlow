# ADR-001: Clean Architecture va Multi-Tenancy Arxitekturasi Tanlovi

## Holat (Status)
Qabul qilingan (Accepted) — Versiya 1.0 (2026-09-17)

## Kontekst (Context)
EduFlow — bu ko‘plab o‘quv markazlari, o‘qituvchilar va talabalarga xizmat ko‘rsatuvchi ko‘p ijarachili (Multi-tenant) SaaS platformasi. Tizim arxitekturasi quyidagi talablarga javob berishi zarur:
1. Biznes mantiq (Application va Domain) tashqi infratuzilma (Database, Framework, UI) ga bog‘liq bo‘lmasligi kerak.
2. Har bir o‘quv markazi (Tenant) o‘z ma’lumotlarini boshqa markazlardan mutlaqo mustaqil va xavfsiz holatda saqlashi kerak (Data Isolation).
3. Testlash (Unit, Integration, E2E) qulay va oson bo‘lishi lozim.

## Qaror (Decision)
1. **Clean Architecture (Onion Architecture)** tanlandi:
   - **EduFlow.Domain**: Tashqi bog‘liqliklardan xoli, markaziy qatlam. Barcha asosiy entitylar, enumlar va biznes qoidalari.
   - **EduFlow.Application**: Biznes operatsiyalari, xizmatlar (Services), DTO modellar, FluentValidation tekshiruvlari va Mapping profillari.
   - **EduFlow.Infrastructure**: Ma'lumotlar bazasi (EF Core), JWT generatori, fon xizmatlari (BackgroundServices), tashqi aloqa (Telegram API).
   - **EduFlow.WebApi**: Foydalanuvchi bilan aloqa qiluvchi REST Controllerlar, middlewarelar va Scalar/OpenAPI hujjatlari.
2. **Multi-Tenancy modeli**:
   - `ITenantEntity` interfeysi va `OrganizationId` orqali EF Core Global Query Filter tatbiq etildi.
   - `TenantMiddleware` har bir kiruvchi HTTP so‘rovdan joriy tashkilotni (JWT Claims orqali) aniqlaydi va avtomatik ravishda barcha SQL so‘rovlariga `WHERE OrganizationId = ...` filtrini qo‘shadi.

## Oqibatlar (Consequences)
- **Ijobiy**:
  - Biznes mantiq to‘liq izolyatsiya qilingan va unit-testlar bilan qamrab olinishi oson.
  - Ma’lumotlar bazasini almashtirish (masalan, SQLite dan PostgreSQL ga) biznes qatlamiga ta’sir qilmaydi.
  - Boshqa markaz ma’lumotlari tasodifan sizib chiqish xavfi (cross-tenant data leakage) Global Query Filters orqali to‘liq bartaraf etildi.
- **Salbiy**:
  - Bir nechta loyihalardan iborat qatlamli tuzilma dastlabki kod hajmini biroz oshiradi (lekin kengayuvchanlikni ta’minlaydi).
