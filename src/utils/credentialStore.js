const CREDENTIAL_STORE_VERSION = 1;
const CREDENTIAL_KEYS = Object.freeze(['apiKey', 'groqApiKey', 'cloudToken', 'openaiKey']);
const DEFAULT_CREDENTIALS = Object.freeze({
    apiKey: '',
    groqApiKey: '',
});

function normalizeCredentials(credentials) {
    const normalized = { ...DEFAULT_CREDENTIALS };
    if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) {
        return normalized;
    }

    for (const key of CREDENTIAL_KEYS) {
        if (typeof credentials[key] === 'string') {
            normalized[key] = credentials[key];
        }
    }
    return normalized;
}

function validateCredentialUpdate(credentials) {
    if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) {
        throw new TypeError('Credentials must be an object');
    }

    for (const [key, value] of Object.entries(credentials)) {
        if (!CREDENTIAL_KEYS.includes(key) || typeof value !== 'string') {
            throw new TypeError(`Invalid credential field: ${key}`);
        }
    }
}

function hasStoredSecrets(credentials) {
    return Object.values(credentials).some(value => value.length > 0);
}

function isCredentialEnvelope(value) {
    return Boolean(
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.prototype.hasOwnProperty.call(value, 'version') &&
        Object.prototype.hasOwnProperty.call(value, 'encryptedData')
    );
}

function assertSecureStorage(safeStorage, platform) {
    if (!safeStorage || typeof safeStorage.isEncryptionAvailable !== 'function' || !safeStorage.isEncryptionAvailable()) {
        throw new Error('Secure credential storage is unavailable');
    }

    if (
        platform === 'linux' &&
        typeof safeStorage.getSelectedStorageBackend === 'function' &&
        safeStorage.getSelectedStorageBackend() === 'basic_text'
    ) {
        throw new Error('A secure system keyring is required to store credentials');
    }
}

function createCredentialEnvelope(credentials, safeStorage, platform = process.platform) {
    const normalized = normalizeCredentials(credentials);
    if (!hasStoredSecrets(normalized)) {
        return { version: CREDENTIAL_STORE_VERSION, encryptedData: null };
    }

    assertSecureStorage(safeStorage, platform);
    const encrypted = safeStorage.encryptString(JSON.stringify(normalized));
    return {
        version: CREDENTIAL_STORE_VERSION,
        encryptedData: encrypted.toString('base64'),
    };
}

function decryptCredentialEnvelope(envelope, safeStorage, platform = process.platform) {
    if (!isCredentialEnvelope(envelope) || envelope.version !== CREDENTIAL_STORE_VERSION) {
        throw new Error('Unsupported credential store format');
    }
    if (envelope.encryptedData === null) {
        return { ...DEFAULT_CREDENTIALS };
    }
    if (typeof envelope.encryptedData !== 'string' || envelope.encryptedData.length === 0) {
        throw new Error('Invalid encrypted credential data');
    }

    assertSecureStorage(safeStorage, platform);
    const decrypted = safeStorage.decryptString(Buffer.from(envelope.encryptedData, 'base64'));
    return normalizeCredentials(JSON.parse(decrypted));
}

module.exports = {
    createCredentialEnvelope,
    decryptCredentialEnvelope,
    isCredentialEnvelope,
    normalizeCredentials,
    validateCredentialUpdate,
};
