# EduFlow — Final Demo Ko‘rgazma Ssenariysi (Walkthrough Guide)

Ushbu qo‘llanma **EduFlow — amaliyot loyiha topshirig‘i** (8-bo‘lim: Final demo ssenariysi) talabiga muvofiq, loyihani to‘liq namoyish qilish bo‘yicha aniq qadamlar ketma-ketligini belgilaydi.

---

## 🔑 Demo Akkauntlar (Kirish ma'lumotlari)

| Rol | Email | Parol | Ruxsat doirasi |
|---|---|---|---|
| **Admin** | `admin@smartedu.uz` | `admin123` | Barcha boshqaruv, kurslar, guruhlar, to'lovlar, foydalanuvchilar |
| **O'qituvchi** | `teacher@smartedu.uz` | `admin123` | Darslar, o'z guruhiga davomat qo'yish, uy vazifasi va baholash |
| **O'quvchi** | `student@eduflow.uz` | `admin123` | Dars jadvali, vazifa topshirish, o'z baholari va to'lovlari |
| **Ota-ona** | `parent@eduflow.uz` | `admin123` | Farzandlar davomati, baholari va to'lov holati |

---

## 🎬 Bosqichma-bosqich Demo Ketma-ketligi

### 1-qadam: Admin Kirishi va Kurs Yaratish
1. Brauzerda [http://localhost:3000/uz/login](http://localhost:3000/uz/login) sahifasiga kiring.
2. `admin@smartedu.uz` / `admin123` bilan tizimga kiring.
3. Chap menyudan **Kurslar** bo‘limiga o‘ting (`/uz/courses`).
4. **Yangi Kurs Qo‘shish** tugmasini bosing:
   * *Nomi*: `Full-Stack .NET & React Bootcamp`
   * *Tavsifi*: `ASP.NET Core Web API va zamonaviy React texnologiyalari kursi.`
   * *Oylik Narxi*: `800,000` so‘m
   * *Davomiyligi*: `24` hafta
5. **Saqlash** tugmasini bosing. Yangi kurs ro‘yxatda paydo bo‘ladi.

---

### 2-qadam: Guruh Yaratish va Studentni Guruhga Qo‘shish
1. Chap menyudan **Guruhlar** bo‘limiga o‘ting (`/uz/groups`).
2. **Yangi Guruh** tugmasini bosing:
   * *Guruh nomi*: `FS-2026-A`
   * *Fan/Kurs*: `Full-Stack .NET & React Bootcamp` (yoki mavjud kurs)
   * *O‘qituvchi*: `Alisher Qodirov`
   * *Oylik to‘lov*: `800,000` so‘m
3. Guruh yaratilgach, guruh kartasini bosing yoki uning ichiga kiring (`/uz/groups/{id}`).
4. **O‘quvchi qo‘shish** tugmasini bosib, faol o‘quvchini (masalan: `Jasur Aliyev`) tanlang va guruhga biriktiring.
   *(Tekshiruv: Nofaol o‘quvchini qo‘shishga urinsangiz, tizim xatolik qaytaradi; dublikat qo‘shishga ruxsat berilmaydi).*

---

### 3-qadam: Dars Jadvalini Yaratish (Jadval Kesishuvi Tekshiruvi)
1. Chap menyudan **Darslar Jadvali** (`/uz/calendar` yoki `/uz/lessons`) sahifasiga o‘ting.
2. Yangi dars belgilang:
   * Guruh: `FS-2026-A`
   * Mavzu: `1-Dars: Clean Architecture asoslari`
   * Vaqt: Bugungi sana, `14:00 - 16:00`
3. Saqlang.
4. *(Xavfsizlik & Validatsiya demo)*: Ayni shu vaqtga (`14:00 - 16:00`) o‘sha o‘qituvchiga yana bir boshqa dars qo‘yishga urining. Tizim avtomatik ravishda:
   `"O'qituvchining ushbu vaqt oralig'ida boshqa darsi mavjud (darslar kesishuvi)!"` xatosini beradi va bloklaydi.

---

### 4-qadam: O‘qituvchi Kabineti — Davomat Qo‘yish va Uy Vazifasi Berish
1. Tizimdan chiqing va `teacher@smartedu.uz` / `admin123` bilan kiring.
2. Dashboardda o‘qituvchining darslari ko‘rinadi.
3. **Davomat** sahifasiga o‘ting (`/uz/teacher/attendance`).
4. Bugungi darsni tanlab, o‘quvchilar holatini belgilang (*Qatnashdi*, *Sababli*, *Kelmadi*).
5. **Uy Vazifalari** (`/uz/teacher/homework`) bo‘limiga o‘ting:
   * *Sarlavha*: `Domain va Application qatlamlarini sozlash`
   * *Topshirish muddati (Deadline)*: Ertaga kechki 20:00
   * *Maksimal ball*: 100 ball
6. Vazifani e’lon qiling.

---

### 5-qadam: Talaba Kabineti — Vazifa Topshirish va To‘lov Holatini Ko‘rish
1. Tizimdan chiqing va `student@eduflow.uz` / `admin123` bilan kiring.
2. Talaba portalida:
   * **Dars jadvali**: o‘zining darslarini ko‘radi.
   * **Uy vazifalari**: e’lon qilingan topshiriqni ochadi.
3. Topshiriqqa javob matni / GitHub havolasini yozib **"Topshirish"** tugmasini bosadi.
4. **To‘lovlar** bo‘limiga o‘tadi: faqat o‘ziga tegishli invoyslar va to‘lov holatini ko‘radi (begona talabalar ma’lumotiga kirish taqiqlangan).

---

### 6-qadam: O‘qituvchi Vazifani Tekshirishi va Baholashi
1. Qayta `teacher@smartedu.uz` bilan kiring.
2. Uy vazifasi yuborilgan topshiriqlar ro‘yxatini oching.
3. Talabaning topshirig‘iga baho bering (masalan, `95` ball) va izoh qoldiring: `"A'lo darajada bajarilgan!"`.
4. Saqlang. Talaba baholari hisoboti yangilanadi.

---

### 7-qadam: Admin To‘lovni Qayd Etishi va Dashboard Natijalari
1. Qayta `admin@smartedu.uz` bilan kiring.
2. **To‘lovlar** bo‘limiga o‘ting (`/uz/payments`).
3. Yangi to‘lov kiriting: Talabani tanlang, to‘langan summani kiriting (masalan, `800,000` so‘m), to‘lov usulini (Naqd, Payme, Click) tanlang va tasdiqlang.
4. **Bosh Sahifa (Dashboard)** ga qayting (`/uz/dashboard`):
   * Oylik tushum ko‘rsatkichi avtomatik yangilanganini ko‘ring.
   * Bugungi davomat foizi, faol talabalar soni va moliyaviy grafiklar real API dan kelgan ma’lumotlar bilan to‘lganligini namoyish eting.

---

### 8-qadam: Xatolik Sahifalarini Ko‘rsatish (404 va 403)
1. Brauzer manziliga ataylab mavjud bo‘lmagan URL yozing: [http://localhost:3000/uz/not-existing-path](http://localhost:3000/uz/not-existing-path).
   * Chiroyli va zamonaviy **404 — Sahifa topilmadi** ekrani namoyon bo‘ladi.
2. Talaba akkaunti bilan kirgan holda admin sahifasiga kirishga urinib ko‘ring: [http://localhost:3000/uz/users](http://localhost:3000/uz/users).
   * Avtomatik tarzda **403 — Ruxsat etilmagan** ekrani chiqadi.
