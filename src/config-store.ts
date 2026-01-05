/**
 * Configuration store for plugins
 */

import type { UniverCustomPluginsConfig, LocaleStrings } from './types';
import { DEFAULT_CONFIG, LOCALES } from './types';

class ConfigStore {
    private config: UniverCustomPluginsConfig = { ...DEFAULT_CONFIG };

    /**
     * Set configuration
     */
    setConfig(config: UniverCustomPluginsConfig): void {
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
            dynamicArray: {
                ...DEFAULT_CONFIG.dynamicArray,
                ...config.dynamicArray,
            },
        };
    }

    /**
     * Get configuration
     */
    getConfig(): UniverCustomPluginsConfig {
        return this.config;
    }

    /**
     * Get locale strings
     */
    getLocale(): LocaleStrings {
        const locale = this.config.locale || 'en';
        return LOCALES[locale] || LOCALES.en;
    }

    /**
     * Get dynamic array config
     */
    getDynamicArrayConfig() {
        return {
            ...DEFAULT_CONFIG.dynamicArray,
            ...this.config.dynamicArray,
        };
    }
}

// Singleton instance
export const configStore = new ConfigStore();
