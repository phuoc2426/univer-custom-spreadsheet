/**
 * Sidebar Plugin
 * Injects a left sidebar with API data selection and template management
 */

import type { ICommand, Workbook, IObjectMatrixPrimitiveType, ICellData, IWorkbookData } from '@univerjs/core';
import type { ISetRangeValuesMutationParams } from '@univerjs/sheets';
import {
    CommandType,
    ICommandService,
    Inject,
    Injector,
    IUndoRedoService,
    IUniverInstanceService,
    LocaleType,
    Plugin,
    sequenceExecute,
    UniverInstanceType,
} from '@univerjs/core';
import {
    SetRangeValuesMutation,
    SetRangeValuesUndoMutationFactory,
} from '@univerjs/sheets';
import type { DropdownItem, TemplateData } from '../types';
import { createSidebar, SidebarCallbacks } from '../ui/sidebar';
import { getApiService } from '../services/api-service';

/**
 * Convert data items to cell matrix
 */
function convertToCellData(data: DropdownItem[], fields: string[], insertMode: 'row' | 'column'): IObjectMatrixPrimitiveType<ICellData> {
    const cellData: IObjectMatrixPrimitiveType<ICellData> = {};

    if (insertMode === 'row') {
        // First row = headers
        cellData[0] = {};
        fields.forEach((field, col) => {
            cellData[0][col] = { v: field };
        });
        // Data rows
        data.forEach((item, row) => {
            cellData[row + 1] = {};
            fields.forEach((field, col) => {
                cellData[row + 1][col] = { v: String(item[field] ?? '') };
            });
        });
    } else {
        // First column = headers
        fields.forEach((field, row) => {
            cellData[row] = { 0: { v: field } };
        });
        // Data columns
        data.forEach((item, col) => {
            fields.forEach((field, row) => {
                if (!cellData[row]) cellData[row] = {};
                cellData[row][col + 1] = { v: String(item[field] ?? '') };
            });
        });
    }

    return cellData;
}

export class SidebarPlugin extends Plugin {
    static override pluginName = 'univer-custom-sidebar-plugin';

    private _sidebarElement: HTMLElement | null = null;

    constructor(
        _config: null,
        @Inject(Injector) readonly _injector: Injector,
        @Inject(ICommandService) private readonly _commandService: ICommandService,
        @Inject(IUniverInstanceService) private readonly _univerInstanceService: IUniverInstanceService,
        @Inject(IUndoRedoService) private readonly _undoRedoService: IUndoRedoService
    ) {
        super();
    }

    override onReady(): void {
        // Delay sidebar injection to ensure Univer UI is fully rendered
        setTimeout(() => this._injectSidebar(), 100);
    }

    private _injectSidebar() {
        // Find the Univer container
        const univerContainer = document.querySelector('.univer-app-container') ||
            document.querySelector('[class*="univer"]') ||
            document.querySelector('#spreadsheet')?.firstElementChild;

        if (!univerContainer) {
            console.warn('[SidebarPlugin] Univer container not found, retrying...');
            setTimeout(() => this._injectSidebar(), 200);
            return;
        }

        const callbacks: SidebarCallbacks = {
            onInsertData: (items, fields, insertMode) => this._insertData(items, fields, insertMode),
            onLoadTemplate: (template) => this._loadTemplate(template),
            onLoadLocalFile: (data) => this._loadLocalFile(data),
            onSaveTemplateToServer: (name, data) => this._saveToServer(name, data),
            onExportTemplate: (data, filename) => this._exportTemplate(data, filename),
            getCurrentWorkbookData: () => this._getCurrentWorkbookData(),
        };

        this._sidebarElement = createSidebar(callbacks);

        // Create wrapper to contain sidebar + univer
        const wrapper = document.createElement('div');
        wrapper.className = 'ucp-main-wrapper';
        wrapper.style.cssText = 'display: flex; width: 100%; height: 100%;';

        // Clone univer's parent style
        const parent = univerContainer.parentElement;
        if (parent) {
            // Insert wrapper
            parent.insertBefore(wrapper, univerContainer);
            wrapper.appendChild(this._sidebarElement);
            wrapper.appendChild(univerContainer);

            // Ensure proper sizing
            (univerContainer as HTMLElement).style.flex = '1';
            (univerContainer as HTMLElement).style.minWidth = '0';
        }
    }

    private _insertData(items: DropdownItem[], fields: string[], insertMode: 'row' | 'column') {
        const workbook = this._univerInstanceService.getCurrentUnitOfType<Workbook>(UniverInstanceType.UNIVER_SHEET);
        if (!workbook) {
            alert('Không tìm thấy workbook');
            return;
        }

        const worksheet = workbook.getActiveSheet();
        if (!worksheet) {
            alert('Không tìm thấy sheet');
            return;
        }

        const unitId = worksheet.getUnitId();
        const subUnitId = worksheet.getSheetId();

        const cellData = convertToCellData(items, fields, insertMode);

        // Calculate range
        let rowCount = 0;
        let colCount = 0;
        Object.keys(cellData).forEach(r => {
            rowCount = Math.max(rowCount, parseInt(r) + 1);
            Object.keys(cellData[parseInt(r)]).forEach(c => {
                colCount = Math.max(colCount, parseInt(c) + 1);
            });
        });

        const params: ISetRangeValuesMutationParams = {
            unitId,
            subUnitId,
            cellValue: cellData,
        };

        const undoParams = SetRangeValuesUndoMutationFactory(this._injector, params);

        const result = this._commandService.syncExecuteCommand(SetRangeValuesMutation.id, params);
        if (result) {
            this._undoRedoService.pushUndoRedo({
                unitID: unitId,
                undoMutations: [{ id: SetRangeValuesMutation.id, params: undoParams }],
                redoMutations: [{ id: SetRangeValuesMutation.id, params }],
            });
        }
    }

    private _loadTemplate(template: TemplateData) {
        try {
            const content = template.content;
            let workbookData: IWorkbookData;

            if (content.sheets) {
                workbookData = {
                    id: template.id,
                    name: template.name,
                    appVersion: '1.0.0',
                    locale: LocaleType.EN_US,
                    styles: content.styles || {},
                    sheetOrder: content.sheetOrder || Object.keys(content.sheets),
                    sheets: content.sheets,
                };
            } else {
                workbookData = content;
            }

            this._univerInstanceService.createUnit(UniverInstanceType.UNIVER_SHEET, workbookData);
        } catch (error) {
            console.error('Failed to load template:', error);
            alert('Lỗi khi tải template');
        }
    }

    private _loadLocalFile(data: any) {
        try {
            let workbookData: IWorkbookData;

            if (data.sheets) {
                workbookData = {
                    id: 'workbook-' + Date.now(),
                    name: data.name || 'Imported Template',
                    appVersion: '1.0.0',
                    locale: LocaleType.EN_US,
                    styles: data.styles || {},
                    sheetOrder: data.sheetOrder || Object.keys(data.sheets),
                    sheets: data.sheets,
                };
            } else {
                workbookData = data;
            }

            this._univerInstanceService.createUnit(UniverInstanceType.UNIVER_SHEET, workbookData);
        } catch (error) {
            console.error('Failed to load file:', error);
            alert('Lỗi khi tải file');
        }
    }

    private async _saveToServer(name: string, data: any) {
        const apiService = getApiService();
        try {
            await apiService.saveTemplate({ name, content: data });
            alert('Đã lưu template lên server thành công!');
        } catch (error) {
            console.error('Failed to save template:', error);
            alert('Lỗi khi lưu template lên server');
        }
    }

    private _exportTemplate(data: any, filename: string) {
        try {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export template:', error);
            alert('Lỗi khi xuất template');
        }
    }

    private _getCurrentWorkbookData(): any {
        const workbook = this._univerInstanceService.getCurrentUnitOfType<Workbook>(UniverInstanceType.UNIVER_SHEET);
        if (!workbook) return null;
        return workbook.getSnapshot();
    }

    onDispose(): void {
        if (this._sidebarElement) {
            this._sidebarElement.remove();
        }
    }
}
