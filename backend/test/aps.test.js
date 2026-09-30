const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateAps } = require('../utils/aps');

test('calculateAps drops Life Orientation and takes the top six non-LO subjects', () => {
  const score = calculateAps([
    { name: 'English Home Language', percentage: 80 },
    { name: 'Mathematics', percentage: 90 },
    { name: 'Physical Sciences', percentage: 82 },
    { name: 'Life Orientation', percentage: 100 },
    { name: 'History', percentage: 75 },
    { name: 'Geography', percentage: 71 },
    { name: 'Accounting', percentage: 68 },
    { name: 'Economics', percentage: 66 }
  ]);

  assert.equal(score, 38);
});

test('calculateAps ignores invalid values and caps using top six eligible subjects', () => {
  const score = calculateAps([
    { name: 'English', percentage: 55 },
    { name: 'Maths', percentage: 79 },
    { name: 'Life Orientation', percentage: 90 },
    { name: 'Biology', percentage: 60 },
    { name: 'Geography', percentage: 40 },
    { name: 'History', percentage: 35 },
    { name: 'Art', percentage: 88 },
    { name: 'Business Studies', percentage: 72 },
    { name: 'Computer Science', percentage: 90 },
    { name: 'Music', percentage: 95 }
  ]);

  assert.equal(score, 38);
});

test('calculateAps gives zero APS points for a zero mark', () => {
  const score = calculateAps([
    { name: 'English', percentage: 0 },
    { name: 'Mathematics', percentage: 0 },
    { name: 'Life Sciences', percentage: 0 },
    { name: 'History', percentage: 0 },
    { name: 'Geography', percentage: 0 },
    { name: 'Accounting', percentage: 0 }
  ]);

  assert.equal(score, 0);
});
