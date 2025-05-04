import * as vscode from 'vscode';

/**
 * Log levels
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

/**
 * Logger service for consistent logging across the extension
 */
export class LoggerService {
    private static instance: LoggerService;
    private outputChannel: vscode.OutputChannel;
    private logLevel: LogLevel = LogLevel.INFO;

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel("Agentic Wiki");
    }

    /**
     * Get the logger instance (singleton)
     */
    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    /**
     * Set the minimum log level
     * @param level Minimum log level to display
     */
    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    /**
     * Log a debug message
     * @param message Message to log
     */
    public debug(message: string): void {
        if (this.logLevel <= LogLevel.DEBUG) {
            this.log('DEBUG', message);
        }
    }

    /**
     * Log an info message
     * @param message Message to log
     */
    public info(message: string): void {
        if (this.logLevel <= LogLevel.INFO) {
            this.log('INFO', message);
        }
    }

    /**
     * Log a warning message
     * @param message Message to log
     */
    public warn(message: string): void {
        if (this.logLevel <= LogLevel.WARN) {
            this.log('WARN', message);
            vscode.window.showWarningMessage(message);
        }
    }

    /**
     * Log an error message
     * @param message Message to log
     * @param error Optional error object
     */
    public error(message: string, error?: unknown): void {
        if (this.logLevel <= LogLevel.ERROR) {
            const errorMessage = error instanceof Error ? error.message : String(error || '');
            const fullMessage = error ? `${message}: ${errorMessage}` : message;
            this.log('ERROR', fullMessage);
            vscode.window.showErrorMessage(fullMessage);
        }
    }

    /**
     * Log a message with a specific level prefix
     * @param level Log level prefix
     * @param message Message to log
     */
    private log(level: string, message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] [${level}] ${message}`);
    }

    /**
     * Show the output channel
     */
    public show(): void {
        this.outputChannel.show();
    }
}
