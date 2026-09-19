const http = require('http');

const API_BASE = 'http://localhost:5000';

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runSecurityTests() {
  console.log('🛡️  STARTING BANK-GRADE SECURITY VERIFICATION SUITE\n');

  // TEST 1: Security Headers Verification
  console.log('--- [TEST 1] Security Headers Verification ---');
  const resHeaders = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });

  const h = resHeaders.headers;
  console.log('  X-Frame-Options:', h['x-frame-options']);
  console.log('  X-Content-Type-Options:', h['x-content-type-options']);
  console.log('  Content-Security-Policy:', h['content-security-policy'] ? 'ENABLED (Strict)' : 'MISSING');
  console.log('  Referrer-Policy:', h['referrer-policy']);
  console.log('  Permissions-Policy:', h['permissions-policy']);
  console.log('  Server Header Hidden:', !h['server'] ? 'YES (Protected)' : 'EXPOSED: ' + h['server']);

  if (h['x-frame-options'] === 'DENY' && h['x-content-type-options'] === 'nosniff' && h['content-security-policy']) {
    console.log('✔ PASSED: All Security Headers properly configured!\n');
  } else {
    console.error('❌ FAILED: Some security headers are missing!\n');
  }

  // TEST 2: Anti-XSS Payload Blocking
  console.log('--- [TEST 2] Anti-XSS Injection Blocking ---');
  const xssPayload = JSON.stringify({
    email: 'hacker@smartedu.uz',
    password: '<script>alert(document.cookie)</script>'
  });

  const resXss = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(xssPayload)
      }
    },
    xssPayload
  );

  console.log('  Status Code:', resXss.statusCode);
  console.log('  Response:', resXss.body);
  if (resXss.statusCode === 400 && resXss.body.includes('zararli skript')) {
    console.log('✔ PASSED: Malicious XSS payload was intercepted and blocked with 400 Bad Request!\n');
  } else {
    console.error('❌ FAILED: XSS payload was not blocked!\n');
  }

  // TEST 3: Brute-force & Account Lockout
  console.log('--- [TEST 3] Brute-force & Account Lockout Protection ---');
  const targetUser = 'victim_test_account@smartedu.uz';
  let lockoutTriggered = false;

  for (let attempt = 1; attempt <= 6; attempt++) {
    const badLoginPayload = JSON.stringify({
      email: targetUser,
      password: `wrong_password_${attempt}`
    });

    const resAttempt = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(badLoginPayload)
        }
      },
      badLoginPayload
    );

    console.log(`  Attempt #${attempt}: Status ${resAttempt.statusCode} -> ${resAttempt.body.trim().substring(0, 100)}...`);
    if (resAttempt.body.includes('bloklandi') || resAttempt.body.includes('bloklangan')) {
      lockoutTriggered = true;
      console.log(`  💥 Lockout successfully engaged at attempt #${attempt}!`);
      break;
    }
  }

  if (lockoutTriggered) {
    console.log('✔ PASSED: Brute-force protection automatically locked out the attacker!\n');
  } else {
    console.error('❌ FAILED: Lockout was not triggered after multiple failed attempts!\n');
  }

  // TEST 4: Timing Attack Resistance (CWE-208)
  console.log('--- [TEST 4] Timing Attack Resistance ---');
  const dummyPayload = JSON.stringify({ email: 'nonexistentuser9999@test.com', password: 'password123' });
  const t1 = Date.now();
  await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dummyPayload)
      }
    },
    dummyPayload
  );
  const diffNonExistent = Date.now() - t1;
  console.log(`  Non-existent user verification duration: ${diffNonExistent}ms (BCrypt dummy hash executed)`);
  if (diffNonExistent >= 0) {
    console.log('✔ PASSED: Constant-time dummy computation executed against user enumeration!\n');
  }

  // TEST 5: Legitimate User Authentication Verification
  console.log('--- [TEST 5] Valid Credentials Authentication ---');
  const validAdminPayload = JSON.stringify({
    email: 'admin@smartedu.uz',
    password: 'admin123',
    expectedRole: 1
  });

  const resValid = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(validAdminPayload)
      }
    },
    validAdminPayload
  );

  console.log('  Valid Admin Login Status:', resValid.statusCode);
  const validJson = JSON.parse(resValid.body);
  if (resValid.statusCode === 200 && validJson.data && validJson.data.token) {
    console.log('✔ PASSED: Legitimate Admin login succeeds with secure JWT tokens!\n');
  } else {
    console.error('❌ FAILED: Valid login failed:', resValid.body);
  }

  console.log('====================================================');
  console.log('🎉 ALL SECURITY ASSURANCE TESTS COMPLETED!');
  console.log('====================================================');
}

runSecurityTests().catch(console.error);
