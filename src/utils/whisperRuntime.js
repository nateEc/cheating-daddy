const path = require('path');

const HUGGING_FACE_MODEL_ID = /^(?:[\w.-]+\/)?[\w.-]{1,96}$/;
const CACHE_CORRUPTION_PATTERNS = [
    /protobuf parsing failed/i,
    /invalid (?:protobuf|wire type)/i,
    /onnx.*(?:corrupt|invalid|parsing failed)/i,
    /(?:corrupt|invalid).*onnx/i,
];

function normalizeWhisperDevice(device, platform = process.platform) {
    return device === 'dml' && platform === 'win32' ? 'dml' : 'cpu';
}

function getWhisperModelCachePath(cacheDir, modelName) {
    if (
        typeof modelName !== 'string' ||
        !HUGGING_FACE_MODEL_ID.test(modelName) ||
        modelName.includes('..') ||
        modelName.includes('--') ||
        modelName.endsWith('.git') ||
        modelName.endsWith('.ipynb')
    ) {
        throw new Error('Invalid Whisper model ID');
    }

    const resolvedCacheDir = path.resolve(cacheDir);
    const modelCachePath = path.resolve(resolvedCacheDir, ...modelName.split('/'));
    if (!modelCachePath.startsWith(`${resolvedCacheDir}${path.sep}`)) {
        throw new Error('Whisper model cache path is outside the cache directory');
    }
    return modelCachePath;
}

function isWhisperCacheCorruption(error) {
    let current = error;
    const messages = [];
    while (current) {
        if (typeof current.message === 'string') {
            messages.push(current.message);
        }
        current = current.cause;
    }
    const combinedMessage = messages.join(' ');
    return CACHE_CORRUPTION_PATTERNS.some(pattern => pattern.test(combinedMessage));
}

async function loadWhisperPipelineWithRecovery(loadPipeline, clearModelCache, onRecovery = () => {}) {
    try {
        return await loadPipeline();
    } catch (error) {
        if (!isWhisperCacheCorruption(error)) {
            throw error;
        }

        await onRecovery(error);
        await clearModelCache();
        return loadPipeline();
    }
}

module.exports = {
    getWhisperModelCachePath,
    isWhisperCacheCorruption,
    loadWhisperPipelineWithRecovery,
    normalizeWhisperDevice,
};
