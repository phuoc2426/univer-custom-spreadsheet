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

    // Create Univer instance
    const univer = new Univer({
        theme: defaultTheme,
        locale: localeType,
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
