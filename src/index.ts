/**
 * Univer Custom Spreadsheet
 * 
 * All-in-one spreadsheet solution with custom plugins.
 * Just import and use - no additional dependencies needed!
 * 
 * Features:
 * - API Dropdown: Select and insert data from API endpoints
 * - Template Loader: Load templates from server or local files
 * - Dynamic Array: Auto-expand sheet when reaching edges
 * 
 * @example
 * ```typescript
 * import { createSpreadsheet } from 'univer-custom-spreadsheet';
 * import 'univer-custom-spreadsheet/styles';
 * 
 * // Create spreadsheet with configuration
 * const { univer, workbook } = createSpreadsheet({
 *     container: document.getElementById('app')!,
 *     apiBaseUrl: 'https://api.example.com',
 *     dropdownSources: [
 *         {
 *             id: 'products',
 *             name: 'Products',
 *             endpoint: '/products',
 *             displayField: 'name',
 *             valueField: 'id',
 *         },
 *     ],
 *     templateApi: {
 *         listEndpoint: '/templates',
 *         getEndpoint: '/templates/{id}',
 *     },
 *     dynamicArray: {
 *         enabled: true,
 *         rowsToAdd: 50,
 *         columnsToAdd: 10,
 *     },
 *     locale: 'vi',
 * });
 * ```
 */

import type { IWorkbookData, Workbook } from '@univerjs/core';
import { LocaleType, Univer, UniverInstanceType } from '@univerjs/core';
import { defaultTheme } from '@univerjs/design';

// Import locale packages
import DesignEnUS from '@univerjs/design/locale/en-US';
import DocsUIEnUS from '@univerjs/docs-ui/locale/en-US';
import SheetsEnUS from '@univerjs/sheets/locale/en-US';
import SheetsUIEnUS from '@univerjs/sheets-ui/locale/en-US';
import UIEnUS from '@univerjs/ui/locale/en-US';
import SheetsFormulaEnUS from '@univerjs/sheets-formula/locale/en-US';

import DesignViVN from '@univerjs/design/locale/vi-VN';
import DocsUIViVN from '@univerjs/docs-ui/locale/vi-VN';
import SheetsViVN from '@univerjs/sheets/locale/vi-VN';
import SheetsUIViVN from '@univerjs/sheets-ui/locale/vi-VN';
import UIViVN from '@univerjs/ui/locale/vi-VN';
import SheetsFormulaViVN from '@univerjs/sheets-formula/locale/vi-VN';

import DesignZhCN from '@univerjs/design/locale/zh-CN';
import DocsUIZhCN from '@univerjs/docs-ui/locale/zh-CN';
import SheetsZhCN from '@univerjs/sheets/locale/zh-CN';
import SheetsUIZhCN from '@univerjs/sheets-ui/locale/zh-CN';
import UIZhCN from '@univerjs/ui/locale/zh-CN';
import SheetsFormulaZhCN from '@univerjs/sheets-formula/locale/zh-CN';

import DesignRuRU from '@univerjs/design/locale/ru-RU';
import DocsUIRuRU from '@univerjs/docs-ui/locale/ru-RU';
import SheetsRuRU from '@univerjs/sheets/locale/ru-RU';
import SheetsUIRuRU from '@univerjs/sheets-ui/locale/ru-RU';
import UIRuRU from '@univerjs/ui/locale/ru-RU';
import SheetsFormulaRuRU from '@univerjs/sheets-formula/locale/ru-RU';
import { UniverDocsPlugin } from '@univerjs/docs';
import { UniverDocsUIPlugin } from '@univerjs/docs-ui';
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula';
import { UniverRenderEnginePlugin } from '@univerjs/engine-render';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui';
import { UniverUIPlugin } from '@univerjs/ui';

import type { UniverCustomPluginsConfig } from './types';
import { configStore } from './config-store';
import { initApiService } from './services/api-service';
import { ApiDropdownPlugin } from './plugins/api-dropdown-plugin';
import { TemplateLoaderPlugin } from './plugins/template-loader-plugin';
import { DynamicArrayPlugin } from './plugins/dynamic-array-plugin';

// Re-export types
export * from './types';
export { ApiService, getApiService } from './services/api-service';
export { configStore } from './config-store';

// Re-export plugins for advanced use
export { ApiDropdownPlugin } from './plugins/api-dropdown-plugin';
export { TemplateLoaderPlugin } from './plugins/template-loader-plugin';
export { DynamicArrayPlugin } from './plugins/dynamic-array-plugin';

// Re-export Univer core for advanced use
export { Univer, UniverInstanceType, LocaleType } from '@univerjs/core';
export type { IWorkbookData, Workbook } from '@univerjs/core';

/**
 * Configuration for creating a spreadsheet
 */
export interface CreateSpreadsheetConfig extends UniverCustomPluginsConfig {
    /** Container element to render the spreadsheet */
    container: HTMLElement;
    /** Initial workbook data (optional) */
    initialData?: IWorkbookData;
    /** Header visibility (default: true) */
    showHeader?: boolean;
    /** Footer visibility (default: true) */
    showFooter?: boolean;
    /** Toolbar visibility (default: true) */
    showToolbar?: boolean;
}

/**
 * Result of creating a spreadsheet
 */
export interface SpreadsheetInstance {
    /** The Univer instance */
    univer: Univer;
    /** The workbook instance */
    workbook: Workbook;
    /** Dispose the spreadsheet */
    dispose: () => void;
}

/**
 * Map locale string to LocaleType enum
 */
function getLocaleType(locale?: string): LocaleType {
    switch (locale) {
        case 'vi':
        case 'vi-VN':
            return LocaleType.VI_VN;
        case 'zh':
        case 'zh-CN':
            return LocaleType.ZH_CN;
        case 'zh-TW':
            return LocaleType.ZH_TW;
        case 'ru':
        case 'ru-RU':
            return LocaleType.RU_RU;
        case 'en':
        case 'en-US':
        default:
            return LocaleType.EN_US;
    }
}

/**
 * Create a fully configured spreadsheet instance
 * 
 * @param config - Spreadsheet configuration including API endpoints
 * @returns SpreadsheetInstance with univer, workbook, and dispose function
 * 
 * @example
 * ```typescript
 * import { createSpreadsheet } from 'univer-custom-spreadsheet';
 * 
 * const instance = createSpreadsheet({
 *     container: document.getElementById('spreadsheet')!,
 *     apiBaseUrl: 'https://api.example.com',
 *     dropdownSources: [
 *         { id: 'users', name: 'Users', endpoint: '/users' }
 *     ],
 * });
 * 
 * // Later: cleanup
 * instance.dispose();
 * ```
 */
export function createSpreadsheet(config: CreateSpreadsheetConfig): SpreadsheetInstance {
    const {
        container,
        initialData,
        showHeader = true,
        showFooter = true,
        showToolbar = true,
        ...pluginConfig
    } = config;

    const localeType = getLocaleType(pluginConfig.locale);

    // Prepare locales based on selected locale
    const locales: Record<string, any> = {};

    switch (localeType) {
        case LocaleType.VI_VN:
            locales[LocaleType.VI_VN] = {
                ...DesignViVN,
                ...DocsUIViVN,
                ...SheetsViVN,
                ...SheetsUIViVN,
                ...UIViVN,
                ...SheetsFormulaViVN,
            };
            break;
        case LocaleType.ZH_CN:
            locales[LocaleType.ZH_CN] = {
                ...DesignZhCN,
                ...DocsUIZhCN,
                ...SheetsZhCN,
                ...SheetsUIZhCN,
                ...UIZhCN,
                ...SheetsFormulaZhCN,
            };
            break;
        case LocaleType.RU_RU:
            locales[LocaleType.RU_RU] = {
                ...DesignRuRU,
                ...DocsUIRuRU,
                ...SheetsRuRU,
                ...SheetsUIRuRU,
                ...UIRuRU,
                ...SheetsFormulaRuRU,
            };
            break;
        case LocaleType.EN_US:
        default:
            locales[LocaleType.EN_US] = {
                ...DesignEnUS,
                ...DocsUIEnUS,
                ...SheetsEnUS,
                ...SheetsUIEnUS,
                ...UIEnUS,
                ...SheetsFormulaEnUS,
            };
            break;
    }

    // Create Univer instance with locales
    const univer = new Univer({
        theme: defaultTheme,
        locale: localeType,
        locales,
    });

    // Register core plugins
    univer.registerPlugin(UniverRenderEnginePlugin);
    univer.registerPlugin(UniverFormulaEnginePlugin);
    univer.registerPlugin(UniverUIPlugin, {
        container,
        header: showHeader,
        footer: showFooter,
    });
    univer.registerPlugin(UniverDocsPlugin);
    univer.registerPlugin(UniverDocsUIPlugin);
    univer.registerPlugin(UniverSheetsPlugin);
    univer.registerPlugin(UniverSheetsUIPlugin);
    univer.registerPlugin(UniverSheetsFormulaPlugin);

    // Store configuration and initialize API service
    configStore.setConfig(pluginConfig);
    initApiService(pluginConfig);

    // Register custom plugins
    univer.registerPlugin(ApiDropdownPlugin);
    univer.registerPlugin(TemplateLoaderPlugin);
    univer.registerPlugin(DynamicArrayPlugin);

    // Create workbook
    const defaultWorkbookData: IWorkbookData = initialData || {
        id: 'workbook-' + Date.now(),
        name: 'Workbook',
        appVersion: '1.0.0',
        locale: localeType,
        styles: {},
        sheetOrder: ['sheet-01'],
        sheets: {
            'sheet-01': {
                id: 'sheet-01',
                name: 'Sheet 1',
                cellData: {},
                rowCount: 100,
                columnCount: 26,
            },
        },
    };

    const workbook = univer.createUnit<IWorkbookData, Workbook>(
        UniverInstanceType.UNIVER_SHEET,
        defaultWorkbookData
    );

    return {
        univer,
        workbook,
        dispose: () => {
            univer.dispose();
        },
    };
}

/**
 * Register custom plugins with an existing Univer instance
 * Use this if you already have a Univer instance configured
 * 
 * @param univer - Existing Univer instance
 * @param config - Plugin configuration
 */
export function registerUniverCustomPlugins(
    univer: Univer,
    config: UniverCustomPluginsConfig
): void {
    configStore.setConfig(config);
    initApiService(config);
    univer.registerPlugin(ApiDropdownPlugin);
    univer.registerPlugin(TemplateLoaderPlugin);
    univer.registerPlugin(DynamicArrayPlugin);
}

/**
 * Update plugin configuration at runtime
 */
export function updatePluginConfig(config: Partial<UniverCustomPluginsConfig>): void {
    const currentConfig = configStore.getConfig();
    configStore.setConfig({ ...currentConfig, ...config });
}
