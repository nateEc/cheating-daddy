const WHISPER_LANGUAGE_CODES = Object.freeze({
    'en-US': 'en',
    'en-GB': 'en',
    'en-AU': 'en',
    'en-IN': 'en',
    'de-DE': 'de',
    'es-US': 'es',
    'es-ES': 'es',
    'fr-FR': 'fr',
    'fr-CA': 'fr',
    'hi-IN': 'hi',
    'pt-BR': 'pt',
    'ar-XA': 'ar',
    'id-ID': 'id',
    'it-IT': 'it',
    'ja-JP': 'ja',
    'tr-TR': 'tr',
    'vi-VN': 'vi',
    'bn-IN': 'bn',
    'gu-IN': 'gu',
    'kn-IN': 'kn',
    'ml-IN': 'ml',
    'mr-IN': 'mr',
    'ta-IN': 'ta',
    'te-IN': 'te',
    'nl-NL': 'nl',
    'ko-KR': 'ko',
    'cmn-CN': 'zh',
    'pl-PL': 'pl',
    'ru-RU': 'ru',
    'th-TH': 'th',
});

function toWhisperLanguageCode(language) {
    return WHISPER_LANGUAGE_CODES[language] || 'en';
}

module.exports = {
    toWhisperLanguageCode,
};
