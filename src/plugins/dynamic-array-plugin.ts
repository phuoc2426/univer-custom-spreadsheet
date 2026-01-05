/**
 * Dynamic Array Expansion Plugin
 * Automatically expands the sheet when user navigates to or scrolls near the edge
 */

import type { Workbook } from '@univerjs/core';
import type { ISetWorksheetColumnCountMutationParams, ISetWorksheetRowCountMutationParams } from '@univerjs/sheets';
import {
    Disposable,
    ICommandService,
    Inject,
    Injector,
    IUniverInstanceService,
    Plugin,
    UniverInstanceType,
    toDisposable,
} from '@univerjs/core';
import {
    SetWorksheetColumnCountMutation,
    SetWorksheetRowCountMutation,
    SheetsSelectionsService,
} from '@univerjs/sheets';
import { configStore } from '../config-store';

/**
 * Controller that handles dynamic array expansion logic
 */
class DynamicArrayController extends Disposable {
    private _scrollDebounceTimer: number | null = null;
    private _isExpanding = false;

    constructor(
        @Inject(ICommandService) private readonly _commandService: ICommandService,
        @Inject(IUniverInstanceService) private readonly _univerInstanceService: IUniverInstanceService,
        @Inject(SheetsSelectionsService) private readonly _selectionsService: SheetsSelectionsService
    ) {
        super();
        this._init();
    }

    private _init() {
        const config = configStore.getDynamicArrayConfig();
        if (!config.enabled) return;

        if (config.enableNavigationExpansion) {
            this._registerSelectionListener();
        }
        if (config.enableScrollExpansion) {
            this._registerScrollListener();
        }
        if (config.enableDataFillExpansion) {
            this._registerCellEditListener();
        }
    }

    /**
     * Listen for selection changes - expand when user navigates to edge
     */
    private _registerSelectionListener() {
        this.disposeWithMe(
            this._selectionsService.selectionMoveEnd$.subscribe((selections) => {
                if (!selections || selections.length === 0) return;

                const selection = selections[selections.length - 1];
                if (!selection?.range) return;

                const { endRow, endColumn } = selection.range;
                this._checkAndExpand(endRow, endColumn);
            })
        );
    }

    /**
     * Listen for scroll events - expand when user scrolls to edge
     */
    private _registerScrollListener() {
        const setupScrollListener = () => {
            const container = document.querySelector('.univer-render-container');
            if (!container) {
                setTimeout(setupScrollListener, 500);
                return;
            }

            const handleScroll = () => {
                if (this._scrollDebounceTimer) {
                    clearTimeout(this._scrollDebounceTimer);
                }

                this._scrollDebounceTimer = window.setTimeout(() => {
                    this._handleScrollExpansion(container);
                }, 200);
            };

            container.addEventListener('scroll', handleScroll, { passive: true });

            this.disposeWithMe(
                toDisposable(() => {
                    container.removeEventListener('scroll', handleScroll);
                    if (this._scrollDebounceTimer) {
                        clearTimeout(this._scrollDebounceTimer);
                    }
                })
            );
        };

        setTimeout(setupScrollListener, 1000);
    }

    /**
     * Listen for cell edit events - expand when data is filled at edge
     */
    private _registerCellEditListener() {
        this.disposeWithMe(
            this._commandService.onCommandExecuted((commandInfo) => {
                const { id, params } = commandInfo;

                if (id === 'sheet.mutation.set-range-values' && params) {
                    const { cellValue } = params as any;
                    if (!cellValue) return;

                    let maxRow = 0;
                    let maxCol = 0;

                    Object.keys(cellValue).forEach((rowStr) => {
                        const row = parseInt(rowStr, 10);
                        if (row > maxRow) maxRow = row;

                        const rowData = cellValue[rowStr];
                        Object.keys(rowData).forEach((colStr) => {
                            const col = parseInt(colStr, 10);
                            if (col > maxCol) maxCol = col;
                        });
                    });

                    this._checkAndExpand(maxRow, maxCol);
                }
            })
        );
    }

    /**
     * Handle scroll-based expansion
     */
    private _handleScrollExpansion(container: Element) {
        const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = container;

        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
        const isNearRight = scrollLeft + clientWidth >= scrollWidth - 100;

        if (isNearBottom || isNearRight) {
            const workbook = this._univerInstanceService.getCurrentUnitOfType<Workbook>(UniverInstanceType.UNIVER_SHEET);
            if (!workbook) return;

            const worksheet = workbook.getActiveSheet();
            if (!worksheet) return;

            const currentRowCount = worksheet.getRowCount();
            const currentColCount = worksheet.getColumnCount();

            const approxRow = isNearBottom ? currentRowCount - 1 : 0;
            const approxCol = isNearRight ? currentColCount - 1 : 0;

            this._checkAndExpand(approxRow, approxCol);
        }
    }

    /**
     * Check if expansion is needed and perform it
     */
    private _checkAndExpand(currentRow: number, currentColumn: number) {
        if (this._isExpanding) return;

        const config = configStore.getDynamicArrayConfig();
        const workbook = this._univerInstanceService.getCurrentUnitOfType<Workbook>(UniverInstanceType.UNIVER_SHEET);
        if (!workbook) return;

        const worksheet = workbook.getActiveSheet();
        if (!worksheet) return;

        const unitId = worksheet.getUnitId();
        const subUnitId = worksheet.getSheetId();
        const currentRowCount = worksheet.getRowCount();
        const currentColCount = worksheet.getColumnCount();

        const threshold = config.triggerThreshold || 5;
        const needsRowExpansion = currentRow >= currentRowCount - threshold;
        const needsColExpansion = currentColumn >= currentColCount - threshold;

        if (!needsRowExpansion && !needsColExpansion) return;

        this._isExpanding = true;

        try {
            if (needsRowExpansion) {
                const newRowCount = currentRowCount + (config.rowsToAdd || 50);
                const rowParams: ISetWorksheetRowCountMutationParams = {
                    unitId,
                    subUnitId,
                    rowCount: newRowCount,
                };
                this._commandService.syncExecuteCommand(SetWorksheetRowCountMutation.id, rowParams);
            }

            if (needsColExpansion) {
                const newColCount = currentColCount + (config.columnsToAdd || 10);
                const colParams: ISetWorksheetColumnCountMutationParams = {
                    unitId,
                    subUnitId,
                    columnCount: newColCount,
                };
                this._commandService.syncExecuteCommand(SetWorksheetColumnCountMutation.id, colParams);
            }
        } finally {
            setTimeout(() => {
                this._isExpanding = false;
            }, 100);
        }
    }
}

/**
 * Dynamic Array Expansion Plugin
 */
export class DynamicArrayPlugin extends Plugin {
    static override pluginName = 'univer-custom-dynamic-array-plugin';

    constructor(
        _config: null,
        @Inject(Injector) readonly _injector: Injector
    ) {
        super();
    }

    override onStarting() {
        this._injector.add([DynamicArrayController]);
    }

    override onReady() {
        const config = configStore.getDynamicArrayConfig();
        if (config.enabled) {
            this._injector.get(DynamicArrayController);
        }
    }
}
