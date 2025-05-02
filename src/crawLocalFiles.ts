import fs from "fs";
import path from "path";
import { minimatch } from "minimatch";
import ignore from "ignore";
import debug from "debug";
import { FileInfo } from "./types";

const logger = debug("crawlLocalFiles");

interface CrawlResult {
    files: FileInfo[];
}

/**
 * 爬取本地目录中的文件，使用类似于 crawlGithubFiles 的接口
 * @param directory 本地目录路径
 * @param includePatterns 要包含的文件模式（例如 ["*.py", "*.js"]）
 * @param excludePatterns 要排除的文件模式（例如 ["tests/*"]）
 * @param maxFileSize 最大文件大小（字节）
 * @param useRelativePaths 是否使用相对于目录的路径
 * @returns {CrawlResult} 包含文件路径和内容的对象
 */
export function crawlLocalFiles(
    directory: string,
    includePatterns?: string[],
    excludePatterns?: string[],
    maxFileSize?: number,
    useRelativePaths: boolean = true,
): CrawlResult {
    if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
        throw new Error(`目录不存在: ${directory}`);
    }

    const filesList: FileInfo[] = [];

    // --- 加载 .gitignore ---
    const gitignorePath = path.join(directory, ".gitignore");
    let gitignoreSpec: ReturnType<typeof ignore> | null = null;

    if (fs.existsSync(gitignorePath)) {
        try {
            const gitignorePatterns = fs.readFileSync(gitignorePath, "utf-8").split("\n");
            gitignoreSpec = ignore().add(gitignorePatterns);
            logger(`已加载 .gitignore 模式，来自 ${gitignorePath}`);
        } catch (e) {
            logger(`警告: 无法读取或解析 .gitignore 文件 ${gitignorePath}: ${e}`);
        }
    }
    // --- 结束加载 .gitignore ---

    // 递归遍历目录
    function traverseDirectory(currentPath: string) {
        const items = fs.readdirSync(currentPath);

        for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const stats = fs.statSync(itemPath);

            // 获取相对路径
            const relPath = useRelativePaths ? path.relative(directory, itemPath) : itemPath;

            // --- 排除检查 ---
            let excluded = false;

            // 1. 首先检查 .gitignore
            if (gitignoreSpec && gitignoreSpec.ignores(relPath)) {
                excluded = true;
            }

            // 2. 如果没有被 .gitignore 排除，则检查标准排除模式
            if (!excluded && excludePatterns) {
                for (const pattern of excludePatterns) {
                    if (minimatch(relPath, pattern)) {
                        excluded = true;
                        break;
                    }
                }
            }

            // 如果是目录且未被排除，则递归遍历
            if (stats.isDirectory() && !excluded) {
                traverseDirectory(itemPath);
                continue;
            }

            // 如果不是文件或已被排除，则跳过
            if (!stats.isFile() || excluded) {
                continue;
            }

            // 检查包含模式
            let included = false;
            if (includePatterns) {
                for (const pattern of includePatterns) {
                    if (minimatch(relPath, pattern)) {
                        included = true;
                        break;
                    }
                }
            } else {
                // 如果没有包含模式，则包含所有未被排除的文件
                included = true;
            }

            // 如果未包含，则跳过
            if (!included) {
                continue;
            }

            // 检查文件大小
            if (maxFileSize && stats.size > maxFileSize) {
                continue;
            }

            // 读取文件内容
            try {
                const content = fs.readFileSync(itemPath, "utf-8");
                filesList.push({ path: relPath, content });
            } catch (e) {
                logger(`警告: 无法读取文件 ${itemPath}: ${e}`);
            }
        }
    }

    // 开始遍历
    traverseDirectory(directory);

    return { files: filesList };
}

// 示例用法
//     logger("--- 爬取父目录 ('..') ---");
//     const filesData = crawlLocalFiles("..", undefined, [
//         "*.pyc",
//         "__pycache__/*",
//         ".venv/*",
//         ".git/*",
//         "docs/*",
//         "output/*",
//     ]);
//     logger(`找到 ${Object.keys(filesData.files).length} 个文件:`);
//     for (const path in filesData.files) {
//         logger(`  ${path}`);
//     }
