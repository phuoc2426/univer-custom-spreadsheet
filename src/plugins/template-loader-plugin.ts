/**
 * Template Loader Plugin
 * Load templates from server API or local JSON files
 */

import type { ICommand, IWorkbookData } from '@univerjs/core';
import {
    CommandType,
    ICommandService,
    Inject,
    Injector,
    IUniverInstanceService,
    LocaleType,
    Plugin,
    UniverInstanceType,
} from '@univerjs/core';
import {
    ComponentManager,
    IMenuManagerService,
    MenuItemType,
    RibbonOthersGroup,
} from '@univerjs/ui';
import { showTemplateLoaderModal } from '../ui/template-loader-modal';
import { getApiService } from '../services/api-service';

// Simple icon component
const TemplateIcon = () => {
    const span = document.createElement('span');
    span.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z"/>
    </svg>`;
    return span;
};

export class TemplateLoaderPlugin extends Plugin {
    static override pluginName = 'univer-custom-template-loader-plugin';

    constructor(
        _config: null,
        @Inject(Injector) readonly _injector: Injector,
        @Inject(IMenuManagerService) private readonly _menuManagerService: IMenuManagerService,
        @Inject(ICommandService) private readonly _commandService: ICommandService,
        @Inject(ComponentManager) private readonly _componentManager: ComponentManager,
        @Inject(IUniverInstanceService) private readonly _univerInstanceService: IUniverInstanceService
    ) {
        super();
    }

    override onStarting() {
        // Register icon
        this.disposeWithMe(
            this._componentManager.register('UCPTemplateIcon', TemplateIcon)
        );

        const buttonId = 'ucp-template-loader-button';

        const command: ICommand = {
            type: CommandType.OPERATION,
            id: buttonId,
            handler: async (accessor) => {
                const univerInstanceService = accessor.get(IUniverInstanceService);

                const result = await showTemplateLoaderModal();
                if (!result) return false;

                let workbookData: IWorkbookData;

                if (result.type === 'server' && result.template) {
                    // If template.content is already workbook data, use it directly
                    const content = result.template.content;

                    if (content.sheets) {
                        // Content is a valid workbook structure
                        workbookData = {
                            id: result.template.id,
                            name: result.template.name,
                            appVersion: '1.0.0',
                            locale: LocaleType.EN_US,
                            styles: content.styles || {},
                            sheetOrder: content.sheetOrder || Object.keys(content.sheets),
                            sheets: content.sheets,
                        };
                    } else {
                        // Content is the full workbook data
                        workbookData = content;
                    }
                } else if (result.type === 'file' && result.fileData) {
                    workbookData = result.fileData;
                } else {
                    return false;
                }

                // Create new workbook unit from template
                try {
                    univerInstanceService.createUnit(UniverInstanceType.UNIVER_SHEET, workbookData);
                    return true;
                } catch (error) {
                    console.error('Failed to create workbook from template:', error);
                    alert('Failed to load template');
                    return false;
                }
            },
        };

        const menuItemFactory = () => ({
            id: buttonId,
            title: 'Template',
            tooltip: 'Load Template',
            icon: 'UCPTemplateIcon',
            type: MenuItemType.BUTTON,
        });

        this._menuManagerService.mergeMenu({
            [RibbonOthersGroup.OTHERS]: {
                [buttonId]: {
                    order: 21,
                    menuItemFactory,
                },
            },
        });

        this._commandService.registerCommand(command);
    }
}
