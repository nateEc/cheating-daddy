const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {
    getWhisperModelCachePath,
    isWhisperCacheCorruption,
    loadWhisperPipelineWithRecovery,
    normalizeWhisperDevice,
} = require('../src/utils/whisperRuntime');

test('uses CPU by default and only enables DirectML on Windows', () => {
    assert.equal(normalizeWhisperDevice('auto', 'win32'), 'cpu');
    assert.equal(normalizeWhisperDevice('dml', 'win32'), 'dml');
    assert.equal(normalizeWhisperDevice('dml', 'darwin'), 'cpu');
});

test('resolves valid model cache paths and rejects traversal', () => {
    assert.equal(getWhisperModelCachePath('/tmp/whisper-models', 'Xenova/whisper-small'), path.resolve('/tmp/whisper-models/Xenova/whisper-small'));
    assert.throws(() => getWhisperModelCachePath('/tmp/whisper-models', '../../private'), /Invalid Whisper model ID/);
});

test('recognizes nested ONNX protobuf corruption errors', () => {
    const error = new Error('Model initialization failed', { cause: new Error('Protobuf parsing failed for decoder_model.onnx') });
    assert.equal(isWhisperCacheCorruption(error), true);
    assert.equal(isWhisperCacheCorruption(new Error('Network request failed')), false);
});

test('clears a corrupt model cache and retries exactly once', async () => {
    let loadCount = 0;
    let clearCount = 0;
    let recoveryCount = 0;

    const result = await loadWhisperPipelineWithRecovery(
        async () => {
            loadCount += 1;
            if (loadCount === 1) throw new Error('Protobuf parsing failed');
            return 'pipeline';
        },
        async () => {
            clearCount += 1;
        },
        async () => {
            recoveryCount += 1;
        }
    );

    assert.equal(result, 'pipeline');
    assert.equal(loadCount, 2);
    assert.equal(clearCount, 1);
    assert.equal(recoveryCount, 1);
});

test('does not clear or retry for unrelated failures', async () => {
    let clearCount = 0;
    await assert.rejects(
        loadWhisperPipelineWithRecovery(
            async () => {
                throw new Error('Network request failed');
            },
            async () => {
                clearCount += 1;
            }
        ),
        /Network request failed/
    );
    assert.equal(clearCount, 0);
});

test('stops after one retry when the fresh model also fails', async () => {
    let loadCount = 0;
    await assert.rejects(
        loadWhisperPipelineWithRecovery(
            async () => {
                loadCount += 1;
                throw new Error('Protobuf parsing failed');
            },
            async () => {}
        ),
        /Protobuf parsing failed/
    );
    assert.equal(loadCount, 2);
});
