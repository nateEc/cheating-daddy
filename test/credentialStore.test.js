const test = require('node:test');
const assert = require('node:assert/strict');
const {
    createCredentialEnvelope,
    decryptCredentialEnvelope,
    isCredentialEnvelope,
    normalizeCredentials,
    validateCredentialUpdate,
} = require('../src/utils/credentialStore');

function createFakeSafeStorage({ available = true, backend = 'keychain' } = {}) {
    return {
        isEncryptionAvailable: () => available,
        getSelectedStorageBackend: () => backend,
        encryptString: value => Buffer.from([...value].reverse().join('')),
        decryptString: value => [...value.toString()].reverse().join(''),
    };
}

test('round-trips all supported credentials without plaintext in the envelope', () => {
    const safeStorage = createFakeSafeStorage();
    const credentials = {
        apiKey: 'gemini-secret',
        groqApiKey: 'groq-secret',
        cloudToken: 'cloud-secret',
        openaiKey: 'openai-secret',
    };

    const envelope = createCredentialEnvelope(credentials, safeStorage, 'darwin');

    assert.equal(isCredentialEnvelope(envelope), true);
    assert.equal(JSON.stringify(envelope).includes('gemini-secret'), false);
    assert.deepEqual(decryptCredentialEnvelope(envelope, safeStorage, 'darwin'), credentials);
});

test('stores empty credentials without requiring an encryption backend', () => {
    const envelope = createCredentialEnvelope({ apiKey: '', groqApiKey: '' }, null, 'darwin');

    assert.deepEqual(envelope, { version: 1, encryptedData: null });
    assert.deepEqual(decryptCredentialEnvelope(envelope, null, 'darwin'), { apiKey: '', groqApiKey: '' });
});

test('rejects secrets when secure storage is unavailable or insecure', () => {
    assert.throws(() => createCredentialEnvelope({ apiKey: 'secret' }, createFakeSafeStorage({ available: false }), 'win32'));
    assert.throws(() => createCredentialEnvelope({ apiKey: 'secret' }, createFakeSafeStorage({ backend: 'basic_text' }), 'linux'));
});

test('validates updates and removes unsupported legacy fields', () => {
    assert.throws(() => validateCredentialUpdate({ unexpected: 'secret' }), /Invalid credential field/);
    assert.deepEqual(normalizeCredentials({ apiKey: 'secret', unexpected: 'ignored' }), { apiKey: 'secret', groqApiKey: '' });
});
