import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { after, test } from 'node:test';
import { db, getStudentBatch } from './database.js';

after(() => new Promise((resolve, reject) => {
  db.close((error) => error ? reject(error) : resolve());
}));

test('batch classification preserves suffix, boundary and fallback behavior', () => {
  const cases = [
    [1, undefined, 'Batch A'],
    [63, undefined, 'Batch A'],
    [64, undefined, 'Batch B'],
    ['STU-COMP-001', '246250307001', 'Batch A'],
    ['STU-COMP-063', '246250307077', 'Batch A'],
    ['STU-COMP-064', '246250307078', 'Batch B'],
    ['STU-COMP-099', '236250307037', 'Batch B'],
    ['STU-COMP-2026-0063', undefined, 'Batch A'],
    ['123prefix-001', undefined, 'Batch A'],
    ['001x', undefined, 'Batch B'],
    ['001\n', undefined, 'Batch B'],
    ['001\r', undefined, 'Batch B'],
    ['001\u2028', undefined, 'Batch B'],
    ['１２', undefined, 'Batch B'],
    ['', 'enrolment-063', 'Batch A'],
    [undefined, 'enrolment-064', 'Batch B'],
    [null, '001x', 'Batch B'],
    ['STU-000', 'enrolment-001', 'Batch A'],
    [0, 'enrolment-001', 'Batch A'],
    ['STU-064', 'enrolment-001', 'Batch B'],
    [undefined, undefined, 'Batch B'],
  ];
  for (const [uid, enrolment, expected] of cases) {
    assert.equal(getStudentBatch(uid, enrolment), expected, JSON.stringify([uid, enrolment]));
  }
});

test('hostile UID and enrolment suffixes finish within a bounded subprocess', () => {
  // A separate process lets the deadline stop a synchronous regex regression.
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import { db, getStudentBatch } from ${JSON.stringify(new URL('./database.js', import.meta.url).href)};
    db.close();
    const digits = '1'.repeat(1_000_000);
    assert.equal(getStudentBatch(digits + 'x'), 'Batch B');
    assert.equal(getStudentBatch(undefined, digits + 'x'), 'Batch B');
    assert.equal(getStudentBatch(digits + 'x', 'enrolment-063'), 'Batch A');
    assert.equal(getStudentBatch(digits), 'Batch B');
    assert.equal(getStudentBatch(undefined, digits), 'Batch B');
    assert.equal(getStudentBatch('0'.repeat(1_000_000) + '63'), 'Batch A');
    assert.equal(getStudentBatch(undefined, '0'.repeat(1_000_000) + '63'), 'Batch A');
  `], { timeout: 5000, encoding: 'utf8' });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});
