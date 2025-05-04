import { GlobalConfig } from "./types";

export const CONFIG_KEY = "agentic-wiki.config";
export const OUTPUT_DIR = "agentic-wiki";

// OpenRouter API related constants
export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";
export const OPENROUTER_DEFAULT_MODEL = "deepseek/deepseek-r1:free";
export const OPENROUTER_SIGNUP_URL = "https://openrouter.ai/keys";

// Default inclusion patterns
const DEFAULT_INCLUDE_PATTERNS = [
    "*.py",
    "*.js",
    "*.jsx",
    "*.ts",
    "*.tsx",
    "*.go",
    "*.java",
    "*.pyi",
    "*.pyx",
    "*.c",
    "*.cc",
    "*.cpp",
    "*.h",
    "*.md",
    "*.rst",
    "Dockerfile",
    "Makefile",
    "*.yaml",
    "*.yml",
];
// Default exclusion patterns
const DEFAULT_EXCLUDE_PATTERNS = [
    "assets/*",
    "data/*",
    "examples/*",
    "images/*",
    "public/*",
    "static/*",
    "temp/*",
    "docs/*",
    "*.env",
    "*.env.*",
    "*.lock",
    "venv/*",
    ".venv/*",
    "*test*",
    "tests/*",
    "docs/*",
    "examples/*",
    "v1/*",
    "dist/*",
    "build/*",
    "experimental/*",
    "deprecated/*",
    "misc/*",
    "legacy/*",
    ".git/*",
    ".github/*",
    ".next/*",
    ".vscode/*",
    "obj/*",
    "bin/*",
    "node_modules/*",
    "*.log",
];

export const DEFAULT_CONFIG: GlobalConfig = {
    llmApiKey: "",
    llmModel: OPENROUTER_DEFAULT_MODEL,
    localDir: "",
    projectName: null,
    outputDir: OUTPUT_DIR,
    includePatterns: DEFAULT_INCLUDE_PATTERNS,
    excludePatterns: DEFAULT_EXCLUDE_PATTERNS,
    maxFileSize: 100,
    language: "English",
    useCache: true,
    maxAbstractionNum: 10,
};
