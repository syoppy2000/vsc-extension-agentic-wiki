/**
 * Utility functions for handling language-related operations
 */

/**
 * Get language instruction for LLM prompts
 * @param language The target language
 * @param fieldNames Names of fields to be translated
 * @returns Language instruction string
 */
export function getLanguageInstruction(language: string, fieldNames: string[]): string {
    if (language.toLowerCase() === "english") {
        return "";
    }
    
    const capitalizedLanguage = capitalizeFirstLetter(language);
    const fieldsStr = fieldNames.map(field => `\`${field}\``).join(" and ");
    
    return `IMPORTANT: Generate the ${fieldsStr} for each abstraction in **${capitalizedLanguage}** language. Do NOT use English for these fields.\n\n`;
}

/**
 * Get language hint for field descriptions
 * @param language The target language
 * @param prefix Optional prefix text
 * @returns Language hint string
 */
export function getLanguageHint(language: string, prefix: string = ""): string {
    if (language.toLowerCase() === "english") {
        return "";
    }
    
    const capitalizedLanguage = capitalizeFirstLetter(language);
    return `${prefix} (in ${capitalizedLanguage})`;
}

/**
 * Get language note for lists
 * @param language The target language
 * @returns Language note string
 */
export function getLanguageListNote(language: string): string {
    if (language.toLowerCase() === "english") {
        return "";
    }
    
    const capitalizedLanguage = capitalizeFirstLetter(language);
    return ` (Names might be in ${capitalizedLanguage})`;
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
 * @param language The target language
 * @returns Object with various language context strings
 */
export function getChapterLanguageContext(language: string) {
    if (language.toLowerCase() === "english") {
        return {
            languageInstruction: "",
            conceptDetailsNote: "",
            structureNote: "",
            prevSummaryNote: "",
            instructionLangNote: "",
            mermaidLangNote: "",
            codeCommentNote: "",
            linkLangNote: "",
            toneNote: ""
        };
    }
    
    const langCap = capitalizeFirstLetter(language);
    
    return {
        languageInstruction: `IMPORTANT: Write the entire tutorial chapter in **${langCap}**. Some input context (like concept names, descriptions, chapter list, previous summaries) may already be in ${langCap}, but you must translate all other generated content (including explanations, examples, technical terms, and possible code comments) into ${langCap}. Do not use English except for code syntax, necessary proper nouns, or specifically designated content. The entire output must be in ${langCap}.\n\n`,
        conceptDetailsNote: ` (Note: ${langCap} version provided)`,
        structureNote: ` (Note: chapter names may be in ${langCap})`,
        prevSummaryNote: ` (Note: this summary may be in ${langCap})`,
        instructionLangNote: ` (in ${langCap})`,
        mermaidLangNote: ` (if appropriate, use ${langCap} for labels/text)`,
        codeCommentNote: ` (translate to ${langCap} if possible, otherwise keep minimal English for clarity)`,
        linkLangNote: ` (use ${langCap} chapter titles from the structure above)`,
        toneNote: ` (suitable for ${langCap} readers)`
    };
}
