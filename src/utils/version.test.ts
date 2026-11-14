import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareVersions } from './version.ts';

test('compareVersions orders release versions', () => {
  assert.ok(compareVersions('0.2.0', '0.1.0') > 0);
  assert.ok(compareVersions('v1.10.0', '1.9.2') > 0);
  assert.ok(compareVersions('1.0', '1.0.1') < 0);
  assert.equal(compareVersions('v0.1.0', '0.1.0'), 0);
  assert.ok(compareVersions('1.0.0', '1.0.0-beta.2') > 0);
  assert.ok(compareVersions('1.0.0-beta.2', '1.0.0-beta.10') < 0);
});
