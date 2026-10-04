import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runFaceEnrollmentTests() {
  console.log('--- Starting Face Enrollment Feature Tests ---');

  const BASE_URL = 'http://localhost:5000/api';
  const TEST_UID = 'STU-COMP-052';
  const FACE_DB_PATH = path.resolve(__dirname, 'face_db');

  // Create a sample 1x1 base64 JPEG image
  const sampleBase64Jpeg =
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  // Create a dummy representation cache file to verify it gets deleted
  fs.mkdirSync(FACE_DB_PATH, { recursive: true });
  const dummyCacheFile = path.join(FACE_DB_PATH, 'representations_vgg_face.pkl');
  fs.writeFileSync(dummyCacheFile, 'dummy-embeddings-cache-data');
  console.log('1. Created dummy cache file:', dummyCacheFile, 'exists:', fs.existsSync(dummyCacheFile));

  // Test 1: Enroll a valid photo
  console.log('\n2. Testing POST /api/face/enroll with valid UID:', TEST_UID);
  const enrollRes = await fetch(`${BASE_URL}/face/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid: TEST_UID,
      image: sampleBase64Jpeg
    })
  });

  const enrollData = await enrollRes.json();
  console.log('Enroll response status:', enrollRes.status);
  console.log('Enroll response data:', enrollData);

  if (enrollRes.status !== 200 || !enrollData.success) {
    throw new Error('Enrollment test failed!');
  }

  // Check file saved on disk
  const studentFolder = path.join(FACE_DB_PATH, TEST_UID);
  console.log('\n3. Verifying file on disk in folder:', studentFolder);
  if (!fs.existsSync(studentFolder)) {
    throw new Error(`Folder ${studentFolder} was not created!`);
  }
  const savedFiles = fs.readdirSync(studentFolder);
  console.log(`Saved files in ${TEST_UID}:`, savedFiles);
  if (savedFiles.length === 0) {
    throw new Error('No files found in student folder!');
  }

  // Verify cache file was deleted
  console.log('\n4. Verifying cached embeddings were cleared:');
  const cacheStillExists = fs.existsSync(dummyCacheFile);
  console.log('Dummy representations cache exists after enrollment:', cacheStillExists);
  if (cacheStillExists) {
    throw new Error('Model cached embeddings were NOT cleared!');
  }
  console.log('✓ Model cached embeddings successfully deleted!');

  // Test 2: Check photo count endpoint
  console.log('\n5. Testing GET /api/face/count/:uid:');
  const countRes = await fetch(`${BASE_URL}/face/count/${TEST_UID}`);
  const countData = await countRes.json();
  console.log('Count response:', countData);
  if (countData.photoCount < 1) {
    throw new Error('Photo count is less than 1!');
  }
  console.log('✓ Photo count endpoint working!');

  // Test 3: Path Traversal Security Tests
  console.log('\n6. Testing Path Traversal Protections:');
  const maliciousUids = [
    '../../etc/passwd',
    '..\\..\\windows\\system32',
    'STU/COMP/001',
    'STU\\COMP\\001',
    'STU-COMP-001\0malicious',
    '..',
    '../../../test'
  ];

  for (const badUid of maliciousUids) {
    const badRes = await fetch(`${BASE_URL}/face/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: badUid,
        image: sampleBase64Jpeg
      })
    });
    console.log(`Payload UID "${badUid}" -> Status: ${badRes.status}`);
    if (badRes.status === 200) {
      throw new Error(`SECURITY ALERT: Path traversal succeeded for UID: ${badUid}`);
    }
  }
  console.log('✓ All Path Traversal attacks properly blocked (400 Bad Request)!');

  // Test 4: Missing image / missing UID validation
  console.log('\n7. Testing validation for missing fields:');
  const noUidRes = await fetch(`${BASE_URL}/face/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: sampleBase64Jpeg })
  });
  console.log('Missing UID status:', noUidRes.status);

  const noImageRes = await fetch(`${BASE_URL}/face/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: TEST_UID })
  });
  console.log('Missing image status:', noImageRes.status);

  if (noUidRes.status !== 400 || noImageRes.status !== 400) {
    throw new Error('Validation tests failed for missing fields!');
  }
  console.log('✓ Missing field validations passed!');

  console.log('\n=== ALL FACE ENROLLMENT TESTS PASSED SUCCESSFULLY! ===');
}

runFaceEnrollmentTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
