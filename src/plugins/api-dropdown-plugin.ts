/**
 * API Dropdown Plugin
 * Allows selecting data from configured API endpoints and populating cells
 */

import type { ICommand, IMutationInfo, Workbook, IObjectMatrixPrimitiveType, ICellData } from '@univerjs/core';
import type { ISetRangeValuesMutationParams } from '@univerjs/sheets';
import {
    CommandType,
    ICommandService,
    Inject,
    Injector,
    IUndoRedoService,
    IUniverInstanceService,
    Plugin,
    sequenceExecute,
    UniverInstanceType,
} from '@univerjs/core';
import {
    SetRangeValuesMutation,
    SetRangeValuesUndoMutationFactory,
} from '@univerjs/sheets';
import {
    ComponentManager,
    IMenuManagerService,
    MenuItemType,
    RibbonOthersGroup,
} from '@univerjs/ui';
import { showApiDropdownModal } from '../ui/api-dropdown-modal';
import React from 'react';

/**
 * Convert 2D string array to cell data matrix
 */
function convertToCellData(data: string[][]): IObjectMatrixPrimitiveType<ICellData> {
    const cellData: IObjectMatrixPrimitiveType<ICellData> = {};
    for (let row = 0; row < data.length; row++) {
        cellData[row] = {};
        for (let col = 0; col < data[row].length; col++) {
            cellData[row][col] = { v: data[row][col] };
        }
    }
    return cellData;
}

// Simple icon component (React component)
const DataIcon = () =>
    React.createElement(
        'svg',
        { viewBox: '0 0 24 24', width: '16', height: '16', fill: 'currentColor' },
        React.createElement('path', {
            d: 'M12 2C6.48 2 2 4.02 2 6.5v11C2 19.98 6.48 22 12 22s10-2.02 10-4.5v-11C22 4.02 17.52 2 12 2zm0 2c4.42 0 8 1.57 8 3.5S16.42 11 12 11 4 9.43 4 7.5 7.58 4 12 4zm8 13.5c0 1.93-3.58 3.5-8 3.5s-8-1.57-8-3.5v-2.04c1.77 1.26 4.63 2.04 8 2.04s6.23-.78 8-2.04v2.04zm0-5c0 1.93-3.58 3.5-8 3.5s-8-1.57-8-3.5V10.46c1.77 1.26 4.63 2.04 8 2.04s6.23-.78 8-2.04v2.04z',
        })
    );

export class ApiDropdownPlugin extends Plugin {
    static override pluginName = 'univer-custom-api-dropdown-plugin';

    constructor(
        _config: null,
        @Inject(Injector) readonly _injector: Injector,
        @Inject(IMenuManagerService) private readonly _menuManagerService: IMenuManagerService,
        @Inject(ICommandService) private readonly _commandService: ICommandService,
        @Inject(ComponentManager) private readonly _componentManager: ComponentManager
    ) {
        super();
    }

    override onStarting() {
        // Register icon
        this.disposeWithMe(
            this._componentManager.register('UCPDataIcon', DataIcon)
        );

        const buttonId = 'ucp-api-dropdown-button';

        const command: ICommand = {
            type: CommandType.OPERATION,
            id: buttonId,
            handler: async (accessor) => {
                const univerInstanceService = accessor.get(IUniverInstanceService);
                const commandService = accessor.get(ICommandService);
                const undoRedoService = accessor.get(IUndoRedoService);

                const workbook = univerInstanceService.getCurrentUnitOfType<Workbook>(UniverInstanceType.UNIVER_SHEET);
                if (!workbook) return false;

                const worksheet = workbook.getActiveSheet();
                if (!worksheet) return false;

                const unitId = worksheet.getUnitId();
                const subUnitId = worksheet.getSheetId();

                // Show modal and get selection
                const result = await showApiDropdownModal();
                if (!result) return false;

                const { items, selectedFields, insertMode } = result;

                // Prepare data array
                let data: string[][];
                if (insertMode === 'row') {
                    // Header row + data rows
                    data = [selectedFields];
                    items.forEach(item => {
                        data.push(selectedFields.map(f => String(item[f] ?? '')));
                    });
                } else {
                    // Each field is a column, first cell is header
                    data = selectedFields.map(field => {
                        return [field, ...items.map(item => String(item[field] ?? ''))];
                    });
                }

                const rowsCount = insertMode === 'row' ? data.length : items.length + 1;
                const colsCount = insertMode === 'row' ? selectedFields.length : selectedFields.length;

                // Convert to cell values using our helper function
                const cellValue = convertToCellData(data);

                const redoMutations: IMutationInfo[] = [];
                const undoMutations: IMutationInfo[] = [];

                // Set range values
                const setRangeValuesMutationRedoParams: ISetRangeValuesMutationParams = {
                    unitId,
                    subUnitId,
                    cellValue,
                };
                const setRangeValuesMutationUndoParams: ISetRangeValuesMutationParams = SetRangeValuesUndoMutationFactory(
                    accessor,
                    setRangeValuesMutationRedoParams
                );
                redoMutations.push({ id: SetRangeValuesMutation.id, params: setRangeValuesMutationRedoParams });
                undoMutations.unshift({ id: SetRangeValuesMutation.id, params: setRangeValuesMutationUndoParams });

                const execResult = sequenceExecute(redoMutations, commandService);

                if (execResult.result) {
                    undoRedoService.pushUndoRedo({
                        unitID: unitId,
                        undoMutations,
                        redoMutations,
                    });
                    return true;
                }

                return false;
            },
        };

        const menuItemFactory = () => ({
            id: buttonId,
            title: 'API Data',
            tooltip: 'Insert data from API',
            icon: 'UCPDataIcon',
            type: MenuItemType.BUTTON,
        });

        this._menuManagerService.mergeMenu({
            [RibbonOthersGroup.OTHERS]: {
                [buttonId]: {
                    order: 20,
                    menuItemFactory,
                },
            },
        });

        this._commandService.registerCommand(command);
    }
}
