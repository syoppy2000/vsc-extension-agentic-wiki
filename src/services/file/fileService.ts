import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ensureDirectoryExists } from '../../utils';

/**
 * Save content to a file, ensuring the directory exists
 * @param filePath Path to save the file
 * @param content Content to write to the file
 */
export async function saveFile(filePath: string, content: string): Promise<void> {
    try {
        // Ensure directory exists
        const dirPath = path.dirname(filePath);
        await ensureDirectoryExists(dirPath);
        
        // Write file
        await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
        console.error("ERROR", `Failed to save file ${filePath}: ${error}`);
        throw new Error(`Failed to save file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Read content from a file
 * @param filePath Path to read the file from
 * @returns File content as string
 */
export async function readFile(filePath: string): Promise<string> {
    try {
        // Check if file exists
        if (!existsSync(filePath)) {
            throw new Error(`File does not exist: ${filePath}`);
        }
        
        // Read file
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        console.error("ERROR", `Failed to read file ${filePath}: ${error}`);
        throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
}
