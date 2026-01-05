/**
 * API Dropdown Modal UI
 */

import type { DropdownSourceConfig, DropdownItem, LocaleStrings } from '../types';
import { getApiService } from '../services/api-service';
import { configStore } from '../config-store';

export interface ApiDropdownResult {
    source: DropdownSourceConfig;
    items: DropdownItem[];
    selectedFields: string[];
    insertMode: 'row' | 'column';
}

/**
 * Show API dropdown selection modal
 */
export async function showApiDropdownModal(): Promise<ApiDropdownResult | null> {
    const apiService = getApiService();
    const locale = configStore.getLocale();
    const sources = apiService.getDropdownSources();

    if (sources.length === 0) {
        alert('No dropdown sources configured. Please configure dropdownSources in plugin options.');
        return null;
    }

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
            width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        `;

        modal.innerHTML = `
            <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #333;">${locale.apiDropdown.title}</h2>
            <div id="ucp-dropdown-content">
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">${locale.apiDropdown.selectSource}</label>
                    <select id="ucp-source-select" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">-- ${locale.apiDropdown.selectSource} --</option>
                        ${sources.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                    </select>
                </div>
                <div id="ucp-fields-section" style="display: none; margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">${locale.apiDropdown.selectFields}</label>
                    <div id="ucp-fields-container" style="max-height: 150px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 8px;"></div>
                </div>
                <div id="ucp-data-preview" style="display: none; margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">${locale.apiDropdown.preview}</label>
                    <div id="ucp-preview-container" style="max-height: 200px; overflow: auto; border: 1px solid #ddd; border-radius: 4px; padding: 8px; font-size: 12px;"></div>
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">${locale.apiDropdown.insertMode}</label>
                    <div>
                        <label style="margin-right: 16px;">
                            <input type="radio" name="ucp-insert-mode" value="row" checked> ${locale.apiDropdown.byRow}
                        </label>
                        <label>
                            <input type="radio" name="ucp-insert-mode" value="column"> ${locale.apiDropdown.byColumn}
                        </label>
                    </div>
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
                <button id="ucp-cancel-btn" style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;">${locale.apiDropdown.cancel}</button>
                <button id="ucp-insert-btn" style="padding: 8px 16px; border: none; border-radius: 4px; background: #1890ff; color: white; cursor: pointer;">${locale.apiDropdown.insert}</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        let currentData: DropdownItem[] = [];
        let selectedFields: string[] = [];
        let currentSource: DropdownSourceConfig | null = null;

        const sourceSelect = modal.querySelector('#ucp-source-select') as HTMLSelectElement;

        // Handle source change
        sourceSelect.addEventListener('change', async () => {
            const sourceId = sourceSelect.value;
            currentSource = sources.find(s => s.id === sourceId) || null;

            if (!currentSource) {
                modal.querySelector('#ucp-fields-section')!.setAttribute('style', 'display: none');
                modal.querySelector('#ucp-data-preview')!.setAttribute('style', 'display: none');
                return;
            }

            currentData = await apiService.fetchDropdownData(sourceId);
            if (currentData.length === 0) {
                modal.querySelector('#ucp-preview-container')!.innerHTML = `<div style="text-align: center; color: #999;">${locale.apiDropdown.noData}</div>`;
                return;
            }

            // Get fields from first item
            const fields = Object.keys(currentData[0]);
            selectedFields = [...fields];

            const fieldsContainer = modal.querySelector('#ucp-fields-container') as HTMLDivElement;
            fieldsContainer.innerHTML = fields.map(f => `
                <label style="display: block; padding: 4px 0;">
                    <input type="checkbox" class="ucp-field-checkbox" value="${f}" checked> ${f}
                </label>
            `).join('');

            modal.querySelector('#ucp-fields-section')!.setAttribute('style', 'display: block; margin-bottom: 16px;');

            // Handle field checkbox changes
            fieldsContainer.querySelectorAll('.ucp-field-checkbox').forEach(cb => {
                cb.addEventListener('change', updatePreview);
            });

            updatePreview();
        });

        function updatePreview() {
            const checkboxes = modal.querySelectorAll('.ucp-field-checkbox:checked') as NodeListOf<HTMLInputElement>;
            selectedFields = Array.from(checkboxes).map(cb => cb.value);

            if (currentData.length === 0 || selectedFields.length === 0) {
                modal.querySelector('#ucp-data-preview')!.setAttribute('style', 'display: none');
                return;
            }

            const previewContainer = modal.querySelector('#ucp-preview-container') as HTMLDivElement;
            const previewData = currentData.slice(0, 5);

            let tableHtml = '<table style="width: 100%; border-collapse: collapse;">';
            tableHtml += '<tr>' + selectedFields.map(f => `<th style="border: 1px solid #ddd; padding: 4px; background: #f5f5f5;">${f}</th>`).join('') + '</tr>';
            previewData.forEach(item => {
                tableHtml += '<tr>' + selectedFields.map(f => `<td style="border: 1px solid #ddd; padding: 4px;">${item[f] ?? ''}</td>`).join('') + '</tr>';
            });
            if (currentData.length > 5) {
                tableHtml += `<tr><td colspan="${selectedFields.length}" style="text-align: center; color: #999; padding: 8px;">... +${currentData.length - 5} more</td></tr>`;
            }
            tableHtml += '</table>';

            previewContainer.innerHTML = tableHtml;
            modal.querySelector('#ucp-data-preview')!.setAttribute('style', 'display: block; margin-bottom: 16px;');
        }

        // Handle cancel
        modal.querySelector('#ucp-cancel-btn')!.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(null);
        });

        // Handle insert
        modal.querySelector('#ucp-insert-btn')!.addEventListener('click', () => {
            const insertMode = (modal.querySelector('input[name="ucp-insert-mode"]:checked') as HTMLInputElement).value as 'row' | 'column';

            if (!currentSource || currentData.length === 0 || selectedFields.length === 0) {
                alert('Please select a data source and at least one field');
                return;
            }

            document.body.removeChild(overlay);
            resolve({
                source: currentSource,
                items: currentData,
                selectedFields,
                insertMode,
            });
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                resolve(null);
            }
        });
    });
}
