# ADR-002: JWT + Refresh Token va Role-Based Access Control (RBAC)

## Holat (Status)
Qabul qilingan (Accepted) — Versiya 1.0 (2026-09-17)

## Kontekst (Context)
EduFlow platformasida 5 xil foydalanuvchi roli mavjud:
- `SuperAdmin` (Tizim boshqaruvchisi)
- `CenterAdmin` (O‘quv markazi administratori)
- `Teacher` (O‘qituvchi)
- `Parent` (Ota-ona)
- `Student` (O‘quvchi)

Xavfsizlik talablari:
1. Parollar hech qachon ochiq saqlanmasligi kerak.
2. Noto‘g‘ri kirishda `401 Unauthorized`, boshqa rol sahifasiga kirishda `403 Forbidden` qaytishi kerak.
3. Sessiya boshqaruvi token muddatiga ega bo‘lishi va Refresh Token orqali avtomatik yangilanishi kerak.

## Qaror (Decision)
1. **Parol xavfsizligi**: BCrypt hashing algoritmi (Work Factor: 11) tanlandi.
2. **Autentifikatsiya**: JSON Web Token (JWT) + Refresh Token:
   - Access Token: Qisqa muddatli (120 daqiqa), Claims ichida `UserId`, `Email`, `Role`, `OrganizationId` saqlanadi.
   - Refresh Token: Kriptografik xavfsiz tasodifiy satr bo‘lib, ma’lumotlar bazasida saqlanadi va yangi Access Token olishda ishlatiladi.
3. **Avtorizatsiya (RBAC)**:
   - Backendda ASP.NET Core `[Authorize(Roles = "...")]` atributlari va controller darajasidagi tekshiruvlar.
   - Frontendda `ProtectedRoleRoute` komponenti orqali ruxsat etilmagan foydalanuvchilarni `/403` xatolik sahifasiga yo‘naltirish.
   - Dars davomati bo‘yicha qo‘shimcha biznes qoida: O‘qituvchi faqat o‘ziga biriktirilgan guruh darslariga davomat qo‘ya oladi.
   - To‘lovlar bo‘yicha qo‘shimcha biznes qoida: O‘quvchi faqat o‘zining to‘lov ma’lumotlarini ko‘ra oladi.

## Oqibatlar (Consequences)
- **Ijobiy**:
  - Stateless arxitektura sababli yuqori tezlik va gorizontal kengayish imkoniyati.
  - Rol va ruxsatlar API va UI darajasida to‘liq himoyalangan.
  - OWASP Top 10 talablariga muvofiq xavfsizlik ta’minlangan.
