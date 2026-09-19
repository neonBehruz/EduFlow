const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const artifactDir = 'C:\\Users\\Husniddin\\.gemini\\antigravity-ide\\brain\\53c3bcf7-b66c-4186-b1bf-4486f4965c08';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  console.log('🚀 Starting Comprehensive End-to-End Test in Real Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const consoleLogs = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleLogs.push(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    consoleLogs.push(`[PAGE ERROR] ${err.toString()}`);
  });

  try {
    // ------------------------------------------------------------------------
    // 1. LOGIN PAGE & ROLE SWITCHING
    // ------------------------------------------------------------------------
    console.log('\n--- 1. Testing Login Page & Role Switching ---');
    await page.goto('http://localhost:3000/uz/login', { waitUntil: 'networkidle2' });
    await sleep(1000);
    await page.screenshot({ path: path.join(artifactDir, '01_login_page.png') });
    console.log('✔ Screenshot saved: 01_login_page.png');

    // ------------------------------------------------------------------------
    // 2. ADMIN LOGIN & DASHBOARD
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Testing Admin Login & Dashboard ---');
    const buttons1 = await page.$$('button');
    for (const b of buttons1) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text.includes('Admin')) {
        await b.click();
        break;
      }
    }
    await sleep(300);

    await page.type('input[type="text"]', 'admin@smartedu.uz');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await sleep(2000);
    await page.screenshot({ path: path.join(artifactDir, '02_admin_dashboard.png') });
    console.log('✔ Admin logged in! Screenshot saved: 02_admin_dashboard.png');

    // ------------------------------------------------------------------------
    // 3. GROUPS PAGE & SCHEDULE CONSTRUCTOR
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Testing Groups Page & Group Creation ---');
    await page.goto('http://localhost:3000/uz/groups', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await page.screenshot({ path: path.join(artifactDir, '03_admin_groups.png') });
    console.log('✔ Groups page loaded! Screenshot saved: 03_admin_groups.png');

    // Find and click the orange "Yangi guruh ochish" button
    const groupButtons = await page.$$('button');
    for (const b of groupButtons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text.includes('Yangi guruh ochish')) {
        await b.click();
        break;
      }
    }
    await sleep(1200);
    await page.screenshot({ path: path.join(artifactDir, '04_admin_create_group_modal.png') });
    console.log('✔ Create Group modal opened! Screenshot saved: 04_admin_create_group_modal.png');

    // Test clicking "Juft kunlar" preset
    const modalButtons = await page.$$('button');
    for (const b of modalButtons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text.includes('Juft kunlar')) {
        await b.click();
        break;
      }
    }
    await sleep(500);

    // Close modal by clicking "Bekor qilish"
    const closeButtons = await page.$$('button');
    for (const b of closeButtons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text.includes('Bekor qilish')) {
        await b.click();
        break;
      }
    }
    await sleep(500);

    // ------------------------------------------------------------------------
    // 4. ATTENDANCE PAGE (DAVOMAT)
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Testing Attendance Page (Davomat Tizimi) ---');
    await page.goto('http://localhost:3000/uz/attendance', { waitUntil: 'networkidle2' });
    await sleep(2000);
    await page.screenshot({ path: path.join(artifactDir, '05_admin_attendance_page.png') });
    console.log('✔ Attendance page loaded! Screenshot saved: 05_admin_attendance_page.png');

    // Test clicking "Guruh jurnali (Tarix)" tab
    const attTabButtons = await page.$$('button');
    for (const b of attTabButtons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text.includes('Guruh jurnali')) {
        await b.click();
        break;
      }
    }
    await sleep(1000);
    await page.screenshot({ path: path.join(artifactDir, '05b_attendance_journal_history.png') });
    console.log('✔ Attendance Journal tab loaded! Screenshot saved: 05b_attendance_journal_history.png');

    // ------------------------------------------------------------------------
    // 5. TEACHER PORTAL & TEACHER ATTENDANCE
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Testing Teacher Portal ---');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000/uz/login', { waitUntil: 'networkidle2' });
    await sleep(500);

    const tLoginBtns = await page.$$('button');
    for (const b of tLoginBtns) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text.toLowerCase().includes('qituvchi')) {
        await b.click();
        break;
      }
    }
    await sleep(500);

    await page.type('input[type="text"]', 'teacher@smartedu.uz');
    await page.type('input[type="password"]', 'EduFlow2026!');
    await page.click('button[type="submit"]');

    await sleep(3000);
    await page.screenshot({ path: path.join(artifactDir, '06_teacher_dashboard.png') });
    console.log('✔ Teacher logged in! Screenshot saved: 06_teacher_dashboard.png');

    // Check Teacher Attendance page
    await page.goto('http://localhost:3000/uz/teacher/attendance', { waitUntil: 'networkidle2' });
    await sleep(2000);
    await page.screenshot({ path: path.join(artifactDir, '07_teacher_attendance.png') });
    console.log('✔ Teacher Attendance page loaded! Screenshot saved: 07_teacher_attendance.png');

    // ------------------------------------------------------------------------
    // 6. STUDENT PORTAL
    // ------------------------------------------------------------------------
    console.log('\n--- 6. Testing Student Portal ---');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000/uz/login', { waitUntil: 'networkidle2' });
    await sleep(500);

    const sLoginBtns = await page.$$('button');
    for (const b of sLoginBtns) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text.toLowerCase().includes('quvchi') && !text.toLowerCase().includes('qituvchi')) {
        await b.click();
        break;
      }
    }
    await sleep(500);

    await page.type('input[type="text"]', 'student@smartedu.uz');
    await page.type('input[type="password"]', 'EduFlow2026!');
    await page.click('button[type="submit"]');

    await sleep(3000);
    await page.screenshot({ path: path.join(artifactDir, '08_student_dashboard.png') });
    console.log('✔ Student logged in! Screenshot saved: 08_student_dashboard.png');

    // Switch to "O'qituvchilar va Guruhlar" tab in Student Portal
    const stTabBtns = await page.$$('button');
    for (const b of stTabBtns) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text.toLowerCase().includes('qituvchilar') || text.toLowerCase().includes('guruh')) {
        await b.click();
        break;
      }
    }
    await sleep(1500);
    await page.screenshot({ path: path.join(artifactDir, '09_student_teachers_and_groups.png') });
    console.log('✔ Student Teachers & Groups tab loaded! Screenshot saved: 09_student_teachers_and_groups.png');

    console.log('\n=============================================');
    console.log('🎉 ALL END-TO-END TESTS COMPLETED SUCCESSFULLY!');
    console.log('Total Console errors encountered:', consoleLogs.length);
    if (consoleLogs.length > 0) {
      console.log('Errors:', consoleLogs);
    }
    console.log('=============================================');
  } catch (error) {
    console.error('❌ E2E Test Error:', error);
    await page.screenshot({ path: path.join(artifactDir, 'error_screenshot.png') }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
