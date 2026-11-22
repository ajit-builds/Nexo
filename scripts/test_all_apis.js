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

async function runAllApiTests() {
  console.log('====================================================');
  console.log('       NEXO API COMPREHENSIVE HEALTH CHECK          ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Auth APIs (/api/auth/*)
    // -------------------------------------------------------------------------
    console.log('--- [1] Auth APIs (/api/auth/*) ---');

    // 1.1 University Login
    const univLogin = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({ email: 'admin@university.edu.in', password: 'Password@123' }));
    const univData = JSON.parse(univLogin.body);
    assert(univLogin.statusCode === 200 && univData.user.role === 'issuer', 'POST /api/auth/login (University)', `Role: ${univData.user?.role}`);
    const univCookie = univLogin.headers['set-cookie'] ? univLogin.headers['set-cookie'][0].split(';')[0] : '';

    // 1.2 Student Login
    const studentLogin = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({ email: 'student@college.isu.ac.in', password: 'Password@123' }));
    const studentData = JSON.parse(studentLogin.body);
    assert(studentLogin.statusCode === 200 && studentData.user.role === 'student', 'POST /api/auth/login (Student)', `Role: ${studentData.user?.role}`);
    const studentCookie = studentLogin.headers['set-cookie'] ? studentLogin.headers['set-cookie'][0].split(';')[0] : '';

    // 1.3 Recruiter Login
    const reviewerLogin = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({ email: 'hr@company.com', password: 'Password@123' }));
    const reviewerData = JSON.parse(reviewerLogin.body);
    assert(reviewerLogin.statusCode === 200 && reviewerData.user.role === 'reviewer', 'POST /api/auth/login (Company)', `Role: ${reviewerData.user?.role}`);

    // 1.4 Unapproved Domain Rejection
    const unapprovedLogin = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({ email: 'attacker@random-unauthorized.com', password: 'Password@123' }));
    assert(unapprovedLogin.statusCode === 403, 'POST /api/auth/login (Reject Unapproved Domain)', 'Status 403 Forbidden');

    // 1.5 Session Inspection
    const meRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Cookie: studentCookie },
    });
    const meData = JSON.parse(meRes.body);
    assert(meRes.statusCode === 200 && meData.authenticated === true, 'GET /api/auth/me (Restore Session)', `Email: ${meData.user?.email}`);

    // 1.6 Register New Approved Domain User
    const testRegEmail = `test.student.${Date.now()}@college.isu.ac.in`;
    const regRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({ email: testRegEmail, password: 'Password@123', name: 'Test Scholar' }));
    const regData = JSON.parse(regRes.body);
    assert(regRes.statusCode === 200 && regData.success === true, 'POST /api/auth/register (Register Valid Domain User)', `Email: ${testRegEmail}`);

    // 1.7 Logout
    const logoutRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/logout',
      method: 'POST',
    });
    const logoutCookie = logoutRes.headers['set-cookie'] ? logoutRes.headers['set-cookie'][0] : '';
    assert(logoutRes.statusCode === 200 && logoutCookie.includes('Max-Age=0'), 'POST /api/auth/logout (Clear Auth Cookie)');

    // -------------------------------------------------------------------------
    // 2. Credentials API (/api/credentials)
    // -------------------------------------------------------------------------
    console.log('\n--- [2] Credentials API (/api/credentials) ---');
    const credsRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/credentials?studentId=IITB-2024-001',
      method: 'GET',
    });
    const credsData = JSON.parse(credsRes.body);
    assert(
      credsRes.statusCode === 200 && Array.isArray(credsData.credentials) && credsData.credentials.length > 0,
      'GET /api/credentials?studentId=IITB-2024-001',
      `Found ${credsData.credentials?.length} credentials`
    );

    // -------------------------------------------------------------------------
    // 3. Verifier Presentations API (/api/presentation)
    // -------------------------------------------------------------------------
    console.log('\n--- [3] Verifier Presentations API (/api/presentation) ---');
    const demoPresId = `pres_test_${Date.now()}`;
    const presPayload = {
      version: '1.0',
      presentationId: demoPresId,
      credentialId: 'cred-iitb-2024-001',
      credentialType: 'academic',
      issuerName: 'IIT Bombay',
      issuerAddress: '0x1234567890123456789012345678901234567890',
      batchId: '0x85638cca9a9df3e282e9c3646a5c2bd0aa1a79a4b26272a4f9d71facbd47e76c',
      merkleProof: ['0xa3479b017008e0eb0aae857b0648b6c1ebf7f9fe9416c3d26edc266e1a0bec68'],
      merkleRoot: '0xae0789d1a055d1dd765b820a44fcb2d881ef10',
      credentialHash: '0x426d3ded7d90b57e6c4e0613b386fc17644f7950f18fb4d30cf05476691cfc28',
      disclosedClaims: { student_name: 'Aarav Sharma', degree: 'B.Tech CS', cgpa_above_8: true },
      redactedKeys: ['cgpa'],
      holderAddress: '0x71C8A3d42B104E9C1b54aE7D685295B11C3D8b29',
      purpose: 'Job Interview Verification',
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      nonce: 'nonce123',
    };

    const storePresRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/presentation',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify(presPayload));
    const storePresData = JSON.parse(storePresRes.body);
    assert(storePresRes.statusCode === 200 && storePresData.success === true, 'POST /api/presentation (Create QR Payload)', `ID: ${demoPresId}`);

    const getPresRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/presentation?id=${demoPresId}`,
      method: 'GET',
    });
    const getPresData = JSON.parse(getPresRes.body);
    assert(getPresRes.statusCode === 200 && getPresData.presentation?.presentationId === demoPresId, 'GET /api/presentation?id=... (Fetch QR Payload)');

    // -------------------------------------------------------------------------
    // 4. Student Consent APIs (/api/student/consent) with Prisma DB
    // -------------------------------------------------------------------------
    console.log('\n--- [4] Student Consent APIs (/api/student/consent) ---');

    const consentEntryId = `consent_${Date.now()}`;
    const consentEntry = {
      id: consentEntryId,
      recipient: 'Google India Recruiting',
      purpose: 'Technical Interview Background Check',
      credentialTitle: 'Bachelor of Technology in Computer Science',
      disclosedClaims: { student_name: 'Aarav Sharma' },
      redactedClaims: { cgpa: '8.84' },
      status: 'active',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    const createConsentRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/student/consent',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: studentCookie 
      },
    }, JSON.stringify({ action: 'create', consentEntry, holderAddress: '0x71C8A3d42B104E9C1b54aE7D685295B11C3D8b29' }));
    const createConsentData = JSON.parse(createConsentRes.body);
    assert(createConsentRes.statusCode === 200 && createConsentData.success === true, 'POST /api/student/consent (Create DPDP Consent Entry in Prisma)', `ID: ${consentEntryId}`);

    const getConsentRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/student/consent',
      method: 'GET',
      headers: { Cookie: studentCookie },
    });
    const getConsentData = JSON.parse(getConsentRes.body);
    assert(
      getConsentRes.statusCode === 200 && Array.isArray(getConsentData.logs) && getConsentData.total > 0,
      'GET /api/student/consent (List DPDP Consent Entries from Prisma)',
      `Total logs: ${getConsentData.total}`
    );

    const revokeConsentRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/student/consent',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: studentCookie 
      },
    }, JSON.stringify({ action: 'revoke', presentationId: consentEntryId }));
    const revokeConsentData = JSON.parse(revokeConsentRes.body);
    assert(revokeConsentRes.statusCode === 200 && revokeConsentData.success === true, 'POST /api/student/consent (Revoke Consent in Prisma)');

    // -------------------------------------------------------------------------
    // 5. Backend SD-JWT Presentation API (/api/student/presentation)
    // -------------------------------------------------------------------------
    console.log('\n--- [5] Backend SD-JWT Presentation API (/api/student/presentation) ---');
    const sdjwtReqBody = {
      credential: {
        id: 'cred-demo-001',
        type: 'academic',
        issuerAddress: '0x1234567890123456789012345678901234567890',
        issuerName: 'Indian Institute of Technology Bombay',
        batchId: '0x85638cca9a9df3e282e9c3646a5c2bd0aa1a79a4b26272a4f9d71facbd47e76c',
        merkleProof: ['0xa3479b017008e0eb0aae857b0648b6c1ebf7f9fe9416c3d26edc266e1a0bec68'],
        merkleRoot: '0xae0789d1a055d1dd765b820a44fcb2d881ef10',
        credentialHash: '0x426d3ded7d90b57e6c4e0613b386fc17644f7950f18fb4d30cf05476691cfc28',
        claims: {
          student_name: 'Aarav Sharma',
          degree: 'Bachelor of Technology',
          cgpa: '8.84',
          graduation_year: '2024'
        }
      },
      keysToDisclose: { student_name: true, degree: true },
      holderAddress: '0x71C8A3d42B104E9C1b54aE7D685295B11C3D8b29',
      holderPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      purpose: 'Campus Placement Verification'
    };

    const sdjwtRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/student/presentation',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: studentCookie 
      },
    }, JSON.stringify(sdjwtReqBody));
    const sdjwtData = JSON.parse(sdjwtRes.body);
    assert(
      sdjwtRes.statusCode === 200 && sdjwtData.success === true && sdjwtData.payload?.disclosedClaims?.student_name === 'Aarav Sharma',
      'POST /api/student/presentation (Issue & Disclose SD-JWT)',
      `Disclosed: ${sdjwtData.disclosedCount}, Redacted: ${sdjwtData.redactedCount}`
    );

    // -------------------------------------------------------------------------
    // 6. Batches & Revocations APIs (/api/batches, /api/revocations)
    // -------------------------------------------------------------------------
    console.log('\n--- [6] Batches & Revocations APIs (/api/batches, /api/revocations) ---');

    const batchesRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/batches',
      method: 'GET',
    });
    const batchesData = JSON.parse(batchesRes.body);
    assert(batchesRes.statusCode === 200 && Array.isArray(batchesData.batches), 'GET /api/batches (Query On-Chain Anchored Batches)', `Total: ${batchesData.total || 0}`);

    const revocationsRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/revocations',
      method: 'GET',
    });
    const revocationsData = JSON.parse(revocationsRes.body);
    assert(revocationsRes.statusCode === 200 && Array.isArray(revocationsData.revocations), 'GET /api/revocations (Query Revocation Registry)', `Total: ${revocationsData.total || 0}`);

  } catch (err) {
    console.error('Fatal API test error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`TOTAL APIS TESTED: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runAllApiTests();
