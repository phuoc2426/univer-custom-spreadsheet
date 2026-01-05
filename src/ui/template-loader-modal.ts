/**
 * Template Loader Modal UI
 */

import type { TemplateData, LocaleStrings } from '../types';
import { getApiService } from '../services/api-service';
import { configStore } from '../config-store';

export interface TemplateLoaderResult {
    type: 'server' | 'file';
    template?: TemplateData;
    fileData?: any;
}

/**
 * Load JSON file and parse content
 */
function loadJsonFile(): Promise<any | null> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.click();

        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) {
                resolve(null);
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const content = reader.result as string;
                    const data = JSON.parse(content);
                    resolve(data);
                } catch (error) {
                    console.error('Failed to parse JSON file:', error);
                    alert('Invalid JSON file');
                    resolve(null);
                }
            };
            reader.readAsText(file);
        };
    });
}

/**
 * Show template loader modal
 */
export async function showTemplateLoaderModal(): Promise<TemplateLoaderResult | null> {
    const apiService = getApiService();
    const locale = configStore.getLocale();
    const config = configStore.getConfig();

    return new Promise(async (resolve) => {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'ucp-modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const modal = document.createElement('div');
        modal.className = 'ucp-modal';
        modal.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 24px;
            width: 700px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        `;

        const hasServerApi = !!(config.templateApi?.listEndpoint);
        const allowLocalTemplates = config.allowLocalTemplates !== false;

        modal.innerHTML = `
            <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #333;">${locale.templateLoader.title}</h2>
            ${(hasServerApi && allowLocalTemplates) ? `
            <div style="display: flex; gap: 16px; margin-bottom: 20px;">
                <button id="ucp-tab-server" class="ucp-tab-btn active" style="flex: 1; padding: 12px; border: 2px solid #1890ff; border-radius: 4px; background: #e6f7ff; cursor: pointer; font-weight: 500;">
                    ${locale.templateLoader.fromServer}
                </button>
                <button id="ucp-tab-file" class="ucp-tab-btn" style="flex: 1; padding: 12px; border: 2px solid #ddd; border-radius: 4px; background: white; cursor: pointer; font-weight: 500;">
                    ${locale.templateLoader.fromFile}
                </button>
            </div>
            ` : ''}
            
            <div id="ucp-server-panel" style="${hasServerApi ? '' : 'display: none;'}">
                <div style="margin-bottom: 16px;">
                    <input type="text" id="ucp-search-input" placeholder="${locale.templateLoader.search}" 
                        style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div id="ucp-templates-list" style="max-height: 400px; overflow-y: auto;">
                    <div style="text-align: center; padding: 20px; color: #999;">${locale.templateLoader.loading}</div>
                </div>
            </div>
            
            <div id="ucp-file-panel" style="${hasServerApi ? 'display: none;' : ''}">
                <div style="border: 2px dashed #ddd; border-radius: 8px; padding: 40px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📄</div>
                    <p style="margin: 0 0 16px 0; color: #666;">${locale.templateLoader.selectFile}</p>
                    <button id="ucp-select-file-btn" style="padding: 10px 24px; border: none; border-radius: 4px; background: #1890ff; color: white; cursor: pointer; font-size: 14px;">
                        ${locale.templateLoader.selectFile}
                    </button>
                    <div id="ucp-file-info" style="margin-top: 16px; display: none;">
                        <span id="ucp-file-name" style="color: #52c41a; font-weight: 500;"></span>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
                <button id="ucp-cancel-btn" style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;">${locale.templateLoader.cancel}</button>
                <button id="ucp-load-btn" style="padding: 8px 16px; border: none; border-radius: 4px; background: #1890ff; color: white; cursor: pointer;">${locale.templateLoader.load}</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        let activeTab: 'server' | 'file' = hasServerApi ? 'server' : 'file';
        let selectedTemplate: TemplateData | null = null;
        let selectedFileData: any | null = null;
        let allTemplates: TemplateData[] = [];

        // Tab switching (only if both options available)
        if (hasServerApi && allowLocalTemplates) {
            const tabServer = modal.querySelector('#ucp-tab-server') as HTMLButtonElement;
            const tabFile = modal.querySelector('#ucp-tab-file') as HTMLButtonElement;
            const serverPanel = modal.querySelector('#ucp-server-panel') as HTMLDivElement;
            const filePanel = modal.querySelector('#ucp-file-panel') as HTMLDivElement;

            function switchTab(tab: 'server' | 'file') {
                activeTab = tab;
                if (tab === 'server') {
                    tabServer.style.borderColor = '#1890ff';
                    tabServer.style.background = '#e6f7ff';
                    tabFile.style.borderColor = '#ddd';
                    tabFile.style.background = 'white';
                    serverPanel.style.display = 'block';
                    filePanel.style.display = 'none';
                } else {
                    tabFile.style.borderColor = '#1890ff';
                    tabFile.style.background = '#e6f7ff';
                    tabServer.style.borderColor = '#ddd';
                    tabServer.style.background = 'white';
                    serverPanel.style.display = 'none';
                    filePanel.style.display = 'block';
                }
            }

            tabServer.addEventListener('click', () => switchTab('server'));
            tabFile.addEventListener('click', () => switchTab('file'));
        }

        // Load templates from server
        async function loadTemplates() {
            const templatesList = modal.querySelector('#ucp-templates-list') as HTMLDivElement;

            try {
                allTemplates = await apiService.fetchTemplates();
                renderTemplates(allTemplates);
            } catch (error) {
                templatesList.innerHTML = `<div style="text-align: center; padding: 20px; color: #f5222d;">Failed to load templates</div>`;
            }
        }

        function renderTemplates(templates: TemplateData[]) {
            const templatesList = modal.querySelector('#ucp-templates-list') as HTMLDivElement;

            if (templates.length === 0) {
                templatesList.innerHTML = `<div style="text-align: center; padding: 20px; color: #999;">${locale.templateLoader.noTemplates}</div>`;
                return;
            }

            templatesList.innerHTML = templates.map(tpl => `
                <div class="ucp-template-item" data-id="${tpl.id}" style="
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin-bottom: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 500; color: #333;">${tpl.name}</div>
                            <div style="font-size: 12px; color: #999; margin-top: 4px;">
                                ${tpl.category ? `<span style="background: #f0f0f0; padding: 2px 8px; border-radius: 4px; margin-right: 8px;">${tpl.category}</span>` : ''}
                                ${tpl.updatedAt ? `<span>${locale.templateLoader.updated} ${new Date(tpl.updatedAt).toLocaleDateString()}</span>` : ''}
                            </div>
                        </div>
                        <div style="color: #1890ff;">→</div>
                    </div>
                </div>
            `).join('');

            // Add click handlers
            templatesList.querySelectorAll('.ucp-template-item').forEach(item => {
                item.addEventListener('click', () => {
                    // Remove previous selection
                    templatesList.querySelectorAll('.ucp-template-item').forEach(i => {
                        (i as HTMLElement).style.borderColor = '#ddd';
                        (i as HTMLElement).style.background = 'white';
                    });

                    // Mark as selected
                    (item as HTMLElement).style.borderColor = '#1890ff';
                    (item as HTMLElement).style.background = '#e6f7ff';

                    const id = item.getAttribute('data-id');
                    selectedTemplate = templates.find(t => t.id === id) || null;
                });

                item.addEventListener('mouseover', () => {
                    if (selectedTemplate?.id !== item.getAttribute('data-id')) {
                        (item as HTMLElement).style.background = '#fafafa';
                    }
                });

                item.addEventListener('mouseout', () => {
                    if (selectedTemplate?.id !== item.getAttribute('data-id')) {
                        (item as HTMLElement).style.background = 'white';
                    }
                });
            });
        }

        // Search functionality
        const searchInput = modal.querySelector('#ucp-search-input') as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const query = searchInput.value.toLowerCase();
                const filtered = allTemplates.filter(t =>
                    t.name.toLowerCase().includes(query) ||
                    (t.category && t.category.toLowerCase().includes(query))
                );
                renderTemplates(filtered);
            });
        }

        // File selection
        const selectFileBtn = modal.querySelector('#ucp-select-file-btn') as HTMLButtonElement;
        const fileInfo = modal.querySelector('#ucp-file-info') as HTMLDivElement;
        const fileName = modal.querySelector('#ucp-file-name') as HTMLSpanElement;

        if (selectFileBtn) {
            selectFileBtn.addEventListener('click', async () => {
                const data = await loadJsonFile();
                if (data) {
                    selectedFileData = data;
                    fileInfo.style.display = 'block';
                    fileName.textContent = `${locale.templateLoader.fileSelected} ${data.name || 'Unnamed'}`;
                }
            });
        }

        // Cancel button
        modal.querySelector('#ucp-cancel-btn')!.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(null);
        });

        // Load button
        modal.querySelector('#ucp-load-btn')!.addEventListener('click', () => {
            if (activeTab === 'server') {
                if (!selectedTemplate) {
                    alert('Please select a template');
                    return;
                }
                document.body.removeChild(overlay);
                resolve({ type: 'server', template: selectedTemplate });
            } else {
                if (!selectedFileData) {
                    alert('Please select a JSON file');
                    return;
                }
                document.body.removeChild(overlay);
                resolve({ type: 'file', fileData: selectedFileData });
            }
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                resolve(null);
            }
        });

        // Load templates initially if server API is configured
        if (hasServerApi) {
            loadTemplates();
        }
    });
}
