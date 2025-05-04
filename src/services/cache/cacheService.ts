import * as fs from 'fs/promises';
import path from 'path';
import * as vscode from 'vscode';
import { ensureDirectoryExists } from '../../utils';

// Cache file constants
const CACHE_FILENAME = "agentic-wiki.llm_cache.json";
let cacheFilePath: string = "";

export interface Cache {
    [key: string]: string;
}

/**
 * Initialize the cache file path using the extension context
 * This should be called during extension activation
 * @param context VS Code extension context
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeCachePath(context: vscode.ExtensionContext): Promise<void> {
    // Use the extension's global storage path for cache
    const storagePath = context.globalStorageUri.fsPath;
    cacheFilePath = path.join(storagePath, CACHE_FILENAME);

    try {
        // Ensure the storage directory exists
        await ensureDirectoryExists(storagePath);
        console.log("INFO", `Cache file path initialized: ${cacheFilePath}`);
    } catch (error) {
        console.error("ERROR", `Failed to create cache directory: ${error}`);
    }
}

/**
 * Read cache from file with proper error handling
 * @returns Cache object or empty object if file doesn't exist or is invalid
 */
export async function readCache(): Promise<Cache> {
    // Check if cache path is initialized
    if (!cacheFilePath) {
        console.warn("WARNING", "Cache file path not initialized, using empty cache");
        return {};
    }

    try {
        // Check if cache file exists using async access
        try {
            await fs.access(cacheFilePath);
        } catch {
            // File doesn't exist
            return {};
        }

        // Read file asynchronously
        const data = await fs.readFile(cacheFilePath, "utf-8");
        
        // Check if file is empty
        if (!data.trim()) {
            return {};
        }
        
        return JSON.parse(data);
    } catch (error) {
        console.warn("WARNING", `Failed to read cache file: ${error}`);
        return {};
    }
}

/**
 * Write cache to file with proper error handling
 * @param cache Cache object to write
 */
export async function writeCache(cache: Cache): Promise<void> {
    // Check if cache path is initialized
    if (!cacheFilePath) {
        console.warn("WARNING", "Cache file path not initialized, cannot write cache");
        return;
    }

    try {
        // Ensure the directory exists
        const cacheDir = path.dirname(cacheFilePath);
        await ensureDirectoryExists(cacheDir);

        // Write to a temporary file first (asynchronously)
        const tempFilePath = `${cacheFilePath}.tmp`;
        await fs.writeFile(tempFilePath, JSON.stringify(cache, null, 2));

        // Rename the temporary file to the actual cache file (atomic operation, asynchronously)
        await fs.rename(tempFilePath, cacheFilePath);
        
        console.log("INFO", "Cache updated successfully");
    } catch (error) {
        console.error("ERROR", `Failed to write cache file: ${error}`);
    }
}

/**
 * Get a value from the cache
 * @param key The cache key
 * @returns The cached value or null if not found
 */
export async function getCacheValue(key: string): Promise<string | null> {
    const cache = await readCache();
    return key in cache ? cache[key] : null;
}

/**
 * Set a value in the cache
 * @param key The cache key
 * @param value The value to cache
 */
export async function setCacheValue(key: string, value: string): Promise<void> {
    const cache = await readCache();
    cache[key] = value;
    await writeCache(cache);
}
