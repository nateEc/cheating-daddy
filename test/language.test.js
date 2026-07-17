const test = require('node:test');
const assert = require('node:assert/strict');
const { toWhisperLanguageCode } = require('../src/utils/language');

test('maps regional speech locales to Whisper language codes', () => {
    assert.equal(toWhisperLanguageCode('en-GB'), 'en');
    assert.equal(toWhisperLanguageCode('ru-RU'), 'ru');
});

test('maps Mandarin to the Whisper Chinese language code', () => {
    assert.equal(toWhisperLanguageCode('cmn-CN'), 'zh');
});

test('falls back to English for unsupported values', () => {
    assert.equal(toWhisperLanguageCode('unsupported'), 'en');
    assert.equal(toWhisperLanguageCode(null), 'en');
});
