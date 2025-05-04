import * as vscode from 'vscode';
import { CONFIG_KEY, DEFAULT_CONFIG } from '../../constants';
import { GlobalConfig } from '../../types';
import { LoggerService } from '../logger';

/**
 * Service for managing extension configuration
 */
export class ConfigService {
    private static instance: ConfigService;
    private context: vscode.ExtensionContext;
    private logger: LoggerService;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.logger = LoggerService.getInstance();
    }

    /**
     * Get the config service instance (singleton)
     * @param context VS Code extension context
     */
    public static getInstance(context?: vscode.ExtensionContext): ConfigService {
        if (!ConfigService.instance && context) {
            ConfigService.instance = new ConfigService(context);
        } else if (!ConfigService.instance && !context) {
            throw new Error('ConfigService not initialized. Provide context on first call.');
        }
        return ConfigService.instance;
    }

    /**
     * Get the current configuration
     * @returns Current configuration
     */
    public async getConfig(): Promise<GlobalConfig> {
        const savedConfig = this.context.globalState.get<GlobalConfig>(CONFIG_KEY);
        
        // Merge with default config
        return {
            ...DEFAULT_CONFIG,
            ...savedConfig,
        };
    }

    /**
     * Update the configuration
     * @param config New configuration
     */
    public async updateConfig(config: Partial<GlobalConfig>): Promise<void> {
        try {
            const currentConfig = await this.getConfig();
            const newConfig = { ...currentConfig, ...config };
            
            await this.context.globalState.update(CONFIG_KEY, newConfig);
            this.logger.info('Configuration updated successfully');
        } catch (error) {
            this.logger.error('Failed to update configuration', error);
            throw error;
        }
    }

    /**
     * Validate the configuration
     * @param config Configuration to validate
     * @returns Validation result with errors if any
     */
    public validateConfig(config: Partial<GlobalConfig>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check required fields
        if (config.localDir && !config.localDir.trim()) {
            errors.push('Local directory is required');
        }

        // Check numeric values
        if (config.maxFileSize !== undefined && (isNaN(config.maxFileSize) || config.maxFileSize <= 0)) {
            errors.push('Max file size must be a positive number');
        }

        if (config.maxAbstractionNum !== undefined && (isNaN(config.maxAbstractionNum) || config.maxAbstractionNum <= 0)) {
            errors.push('Max abstraction number must be a positive number');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}
