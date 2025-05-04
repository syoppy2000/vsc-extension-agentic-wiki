/**
 * Utility functions for handling language-related operations
 */

// Language code to display name mapping
const LANGUAGE_MAP: Record<string, string> = {
    en: "English",
    zh: "Chinese",
    ja: "Japanese",
    es: "Spanish",
    fr: "French",
    de: "German",
};

// Native language names for better LLM understanding
const NATIVE_LANGUAGE_NAMES: Record<string, string> = {
    en: "English",
    zh: "中文",
    ja: "日本語",
    es: "Español",
    fr: "Français",
    de: "Deutsch",
};

/**
 * Get language display name from language code
 * @param langCode The language code (e.g., 'en', 'zh')
 * @returns The display name of the language
 */
function getLanguageDisplayName(langCode: string): string {
    return LANGUAGE_MAP[langCode] || "English";
}

/**
 * Get native language name from language code
 * @param langCode The language code (e.g., 'en', 'zh')
 * @returns The native name of the language
 */
function getNativeLanguageName(langCode: string): string {
    return NATIVE_LANGUAGE_NAMES[langCode] || "English";
}

/**
 * Get language instruction for LLM prompts
 * @param langCode The target language code
 * @param fieldNames Names of fields to be translated
 * @returns Language instruction string
 */
export function getLanguageInstruction(langCode: string, fieldNames: string[]): string {
    if (langCode === "en") {
        return "";
    }

    const displayName = getLanguageDisplayName(langCode);
    const nativeName = getNativeLanguageName(langCode);
    const fieldsStr = fieldNames.map(field => `\`${field}\``).join(" and ");

    return `IMPORTANT: Generate the ${fieldsStr} for each abstraction in **${displayName} (${nativeName})** language. Do NOT use English for these fields.\n\n`;
}

/**
 * Get language hint for field descriptions
 * @param langCode The target language code
 * @param prefix Optional prefix text
 * @returns Language hint string
 */
export function getLanguageHint(langCode: string, prefix: string = ""): string {
    if (langCode === "en") {
        return "";
    }

    const displayName = getLanguageDisplayName(langCode);
    return `${prefix} (in ${displayName})`;
}

/**
 * Get language note for lists
 * @param langCode The target language code
 * @returns Language note string
 */
export function getLanguageListNote(langCode: string): string {
    if (langCode === "en") {
        return "";
    }

    const displayName = getLanguageDisplayName(langCode);
    return ` (Names might be in ${displayName})`;
}

/**
 * Capitalize the first letter of a string
 * @param str Input string
 * @returns String with first letter capitalized
 */
export function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get comprehensive language context for chapter writing
 * @param langCode The target language code
 * @returns Object with various language context strings
 */
export function getChapterLanguageContext(langCode: string) {
    if (langCode === "en") {
        return {
            languageInstruction: "",
            conceptDetailsNote: "",
            structureNote: "",
            prevSummaryNote: "",
            instructionLangNote: "",
            mermaidLangNote: "",
            codeCommentNote: "",
            linkLangNote: "",
            toneNote: "",
        };
    }

    const displayName = getLanguageDisplayName(langCode);
    const nativeName = getNativeLanguageName(langCode);

    return {
        languageInstruction: `IMPORTANT: Write the entire tutorial chapter in **${displayName} (${nativeName})**. Some input context (like concept names, descriptions, chapter list, previous summaries) may already be in ${displayName}, but you must translate all other generated content (including explanations, examples, technical terms, and possible code comments) into ${displayName}. Do not use English except for code syntax, necessary proper nouns, or specifically designated content. The entire output must be in ${displayName}.\n\n`,
        conceptDetailsNote: ` (Note: ${displayName} version provided)`,
        structureNote: ` (Note: chapter names may be in ${displayName})`,
        prevSummaryNote: ` (Note: this summary may be in ${displayName})`,
        instructionLangNote: ` (in ${displayName})`,
        mermaidLangNote: ` (if appropriate, use ${displayName} for labels/text)`,
        codeCommentNote: ` (translate to ${displayName} if possible, otherwise keep minimal English for clarity)`,
        linkLangNote: ` (use ${displayName} chapter titles from the structure above)`,
        toneNote: ` (suitable for ${displayName} readers)`,
    };
}
