const http = require('http');

const PORT = 3000;

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
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

async function runTests() {
  console.log('=== NEXO CREDENTIAL NETWORK RBAC & AUTH TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. University Login
    const univLogin = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({ email: 'admin@university.edu.in', password: 'Password@123' }));

    const univBody = JSON.parse(univLogin.body);
    assert(univLogin.statusCode === 200, 'University login returns 200');
    assert(univBody.user.role === 'issuer', 'University login assigned role is "issuer"');
    assert(univBody.portalPath === '/university', 'University login portalPath is "/university"');
    const univCookie = univLogin.headers['set-cookie'] ? univLogin.headers['set-cookie'][0] : '';
    assert(univCookie.includes('nexo_auth_token='), 'University login sets nexo_auth_token cookie');

    // 2. Student Login
    const studentLogin = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({ email: 'student@college.isu.ac.in', password: 'Password@123' }));

    const studentBody = JSON.parse(studentLogin.body);
    assert(studentLogin.statusCode === 200, 'Student login returns 200');
    assert(studentBody.user.role === 'student', 'Student login assigned role is "student"');
    assert(studentBody.portalPath === '/student', 'Student login portalPath is "/student"');
    const studentCookie = studentLogin.headers['set-cookie'] ? studentLogin.headers['set-cookie'][0] : '';
    assert(studentCookie.includes('nexo_auth_token='), 'Student login sets nexo_auth_token cookie');

    // 3. Company Reviewer Login
    const companyLogin = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({ email: 'hr@company.com', password: 'Password@123' }));

    const companyBody = JSON.parse(companyLogin.body);
    assert(companyLogin.statusCode === 200, 'Company login returns 200');
    assert(companyBody.user.role === 'reviewer', 'Company login assigned role is "reviewer"');
    assert(companyBody.portalPath === '/verify', 'Company login portalPath is "/verify"');
    const companyCookie = companyLogin.headers['set-cookie'] ? companyLogin.headers['set-cookie'][0] : '';
    assert(companyCookie.includes('nexo_auth_token='), 'Company login sets nexo_auth_token cookie');

    // 4. Unknown domain rejection
    const unknownLogin = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({ email: 'user@randomgmail.com', password: 'Password@123' }));

    const unknownBody = JSON.parse(unknownLogin.body);
    assert(unknownLogin.statusCode === 403, 'Unknown domain rejected with 403');
    assert(unknownBody.error === 'Access denied. Your email domain is not authorized to access this platform. Please contact your university or organization administrator.', 'Unknown domain rejected with exact required error message');

    // 5. Similar / spoofed domain rejection
    const spoofLogin = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({ email: 'attacker@college.isu.ac.in.attacker.com', password: 'Password@123' }));

    const spoofBody = JSON.parse(spoofLogin.body);
    assert(spoofLogin.statusCode === 403, 'Spoofed domain rejected with 403');
    assert(spoofBody.error.includes('Access denied. Your email domain is not authorized'), 'Spoofed domain error message confirmed');

    // 6. Invalid password rejection
    const badPwLogin = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({ email: 'admin@university.edu.in', password: 'WrongPassword' }));

    const badPwBody = JSON.parse(badPwLogin.body);
    assert(badPwLogin.statusCode === 401, 'Invalid password rejected with 401');
    assert(badPwBody.error.includes('Invalid email or password'), 'Invalid password error message confirmed');

    // 7. Session verification via /api/auth/me
    const meCheck = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Cookie: univCookie.split(';')[0] },
    });

    const meBody = JSON.parse(meCheck.body);
    assert(meCheck.statusCode === 200, '/api/auth/me returns 200 with valid session cookie');
    assert(meBody.authenticated === true, '/api/auth/me returns authenticated: true');
    assert(meBody.user.role === 'issuer', '/api/auth/me restores role "issuer"');

    // 8. Direct URL Middleware Access Protection: Unauthenticated -> /login
    const unauthAccess = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/university',
      method: 'GET',
    });
    assert(unauthAccess.statusCode === 307 || unauthAccess.statusCode === 308, 'Unauthenticated access to /university redirects (307/308)');
    assert((unauthAccess.headers['location'] || '').includes('/login'), 'Redirects unauthenticated user to /login');

    // 9. Cross-portal access: Student trying to open /university -> /unauthorized (403)
    const studentCrossAccess = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/university',
      method: 'GET',
      headers: { Cookie: studentCookie.split(';')[0] },
    });
    assert(studentCrossAccess.statusCode === 307 || studentCrossAccess.statusCode === 308, 'Student access to /university is blocked with redirect');
    assert((studentCrossAccess.headers['location'] || '').includes('/unauthorized'), 'Redirects student to /unauthorized?userRole=student');

    // 10. Cross-portal access: University trying to open /student -> /unauthorized (403)
    const univCrossAccess = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/student',
      method: 'GET',
      headers: { Cookie: univCookie.split(';')[0] },
    });
    assert(univCrossAccess.statusCode === 307 || univCrossAccess.statusCode === 308, 'University access to /student is blocked with redirect');
    assert((univCrossAccess.headers['location'] || '').includes('/unauthorized'), 'Redirects university to /unauthorized?userRole=issuer');

    // 11. Cross-portal access: Company trying to open /university -> /unauthorized (403)
    const companyCrossAccess = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/university',
      method: 'GET',
      headers: { Cookie: companyCookie.split(';')[0] },
    });
    assert(companyCrossAccess.statusCode === 307 || companyCrossAccess.statusCode === 308, 'Company access to /university is blocked with redirect');
    assert((companyCrossAccess.headers['location'] || '').includes('/unauthorized'), 'Redirects company to /unauthorized?userRole=reviewer');

    // 12. Cross-portal access: Student trying to open /verify -> /unauthorized (403)
    const studentVerifyCross = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/verify',
      method: 'GET',
      headers: { Cookie: studentCookie.split(';')[0] },
    });
    assert(studentVerifyCross.statusCode === 307 || studentVerifyCross.statusCode === 308, 'Student access to /verify is blocked with redirect');
    assert((studentVerifyCross.headers['location'] || '').includes('/unauthorized'), 'Redirects student to /unauthorized?userRole=student');

    // 13. Authorized route access: University opening /university -> 200
    const univValidAccess = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/university',
      method: 'GET',
      headers: { Cookie: univCookie.split(';')[0] },
    });
    assert(univValidAccess.statusCode === 200, 'University user can access /university (200 OK)');

    // 14. Authorized route access: Student opening /student -> 200
    const studentValidAccess = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/student',
      method: 'GET',
      headers: { Cookie: studentCookie.split(';')[0] },
    });
    assert(studentValidAccess.statusCode === 200, 'Student user can access /student (200 OK)');

    // 15. Authorized route access: Company opening /verify -> 200
    const companyValidAccess = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/verify',
      method: 'GET',
      headers: { Cookie: companyCookie.split(';')[0] },
    });
    assert(companyValidAccess.statusCode === 200, 'Company user can access /verify (200 OK)');

    // 16. API Backend Protection: University calling /api/student/consent -> 403
    const apiStudentBlock = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/student/consent',
      method: 'GET',
      headers: { Cookie: univCookie.split(';')[0] },
    });
    assert(apiStudentBlock.statusCode === 403, 'University access to /api/student/consent blocked with 403');

    // 17. API Backend Access: Student calling /api/student/consent -> 200
    const apiStudentAllow = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/student/consent',
      method: 'GET',
      headers: { Cookie: studentCookie.split(';')[0] },
    });
    assert(apiStudentAllow.statusCode === 200, 'Student access to /api/student/consent allowed (200 OK)');

    // 18. Logout terminates session
    const logoutRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/logout',
      method: 'POST',
      headers: { Cookie: univCookie.split(';')[0] },
    });
    assert(logoutRes.statusCode === 200, 'Logout endpoint returns 200');
    const logoutCookie = logoutRes.headers['set-cookie'] ? logoutRes.headers['set-cookie'][0] : '';
    assert(logoutCookie.includes('Max-Age=0'), 'Logout clears cookie with Max-Age=0');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
