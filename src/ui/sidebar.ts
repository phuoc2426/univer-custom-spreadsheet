/**
 * Sidebar UI Component
 * Left sidebar with API data selection and template management
 */

import type { DropdownSourceConfig, DropdownItem, TemplateData } from '../types';
import { getApiService } from '../services/api-service';
import { configStore } from '../config-store';

export interface SidebarCallbacks {
    onInsertData: (items: DropdownItem[], fields: string[], insertMode: 'row' | 'column') => void;
    onLoadTemplate: (template: TemplateData) => void;
    onLoadLocalFile: (data: any) => void;
    onSaveTemplateToServer: (name: string, data: any) => void;
    onExportTemplate: (data: any, filename: string) => void;
    getCurrentWorkbookData: () => any;
}

export function createSidebar(callbacks: SidebarCallbacks): HTMLElement {
    const locale = configStore.getLocale();
    const apiService = getApiService();
    const sources = apiService.getDropdownSources();
    const config = configStore.getConfig();

    const sidebar = document.createElement('div');
    sidebar.className = 'ucp-sidebar';
    sidebar.innerHTML = `
        <div class="ucp-sidebar-header">
            <h3>📊 Công cụ</h3>
        </div>
        
        <!-- API Data Section -->
        <div class="ucp-sidebar-section">
            <div class="ucp-section-title">
                <span class="ucp-section-icon">📂</span>
                Dữ liệu API
            </div>
            <div class="ucp-section-content">
                <div class="ucp-form-group">
                    <label>Chọn nguồn dữ liệu:</label>
                    <select id="ucp-sidebar-source" class="ucp-select">
                        <option value="">-- Chọn nguồn --</option>
                        ${sources.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                    </select>
                </div>
                <div id="ucp-sidebar-fields" class="ucp-form-group" style="display: none;">
                    <label>Chọn trường dữ liệu:</label>
                    <div id="ucp-sidebar-fields-list" class="ucp-checkbox-list"></div>
                </div>
                <div class="ucp-form-group">
                    <label>Chế độ chèn:</label>
                    <div class="ucp-radio-group">
                        <label class="ucp-radio-label">
                            <input type="radio" name="ucp-sidebar-insert-mode" value="row" checked>
                            <span>Theo hàng</span>
                        </label>
                        <label class="ucp-radio-label">
                            <input type="radio" name="ucp-sidebar-insert-mode" value="column">
                            <span>Theo cột</span>
                        </label>
                    </div>
                </div>
                <div id="ucp-sidebar-preview" class="ucp-data-preview" style="display: none;">
                    <label>Xem trước (<span id="ucp-preview-count">0</span> bản ghi):</label>
                    <div id="ucp-sidebar-preview-content" class="ucp-preview-content"></div>
                </div>
                <button id="ucp-sidebar-insert-btn" class="ucp-btn ucp-btn-primary ucp-btn-block" disabled>
                    ➕ Chèn dữ liệu
                </button>
            </div>
        </div>

        <!-- Template Section -->
        <div class="ucp-sidebar-section">
            <div class="ucp-section-title">
                <span class="ucp-section-icon">📄</span>
                Template
            </div>
            <div class="ucp-section-content">
                <div class="ucp-template-actions">
                    <button id="ucp-load-server-template" class="ucp-btn ucp-btn-block">
                        🌐 Tải từ Server
                    </button>
                    <button id="ucp-load-local-template" class="ucp-btn ucp-btn-block">
                        📁 Tải từ máy tính
                    </button>
                    <hr class="ucp-divider">
                    <button id="ucp-save-to-server" class="ucp-btn ucp-btn-block">
                        ☁️ Lưu lên Server
                    </button>
                    <button id="ucp-export-template" class="ucp-btn ucp-btn-block">
                        💾 Xuất file JSON
                    </button>
                </div>
            </div>
        </div>
    `;

    // State
    let currentData: DropdownItem[] = [];
    let selectedFields: string[] = [];
    let currentSource: DropdownSourceConfig | null = null;

    // Elements
    const sourceSelect = sidebar.querySelector('#ucp-sidebar-source') as HTMLSelectElement;
    const fieldsSection = sidebar.querySelector('#ucp-sidebar-fields') as HTMLDivElement;
    const fieldsList = sidebar.querySelector('#ucp-sidebar-fields-list') as HTMLDivElement;
    const previewSection = sidebar.querySelector('#ucp-sidebar-preview') as HTMLDivElement;
    const previewContent = sidebar.querySelector('#ucp-sidebar-preview-content') as HTMLDivElement;
    const previewCount = sidebar.querySelector('#ucp-preview-count') as HTMLSpanElement;
    const insertBtn = sidebar.querySelector('#ucp-sidebar-insert-btn') as HTMLButtonElement;

    // Source change handler
    sourceSelect.addEventListener('change', async () => {
        const sourceId = sourceSelect.value;
        currentSource = sources.find(s => s.id === sourceId) || null;

        if (!currentSource) {
            fieldsSection.style.display = 'none';
            previewSection.style.display = 'none';
            insertBtn.disabled = true;
            return;
        }

        // Show loading
        insertBtn.disabled = true;
        insertBtn.textContent = '⏳ Đang tải...';

        try {
            currentData = await apiService.fetchDropdownData(sourceId);

            if (currentData.length === 0) {
                previewContent.innerHTML = '<div class="ucp-no-data">Không có dữ liệu</div>';
                previewSection.style.display = 'block';
                fieldsSection.style.display = 'none';
                insertBtn.disabled = true;
                insertBtn.textContent = '➕ Chèn dữ liệu';
                return;
            }

            // Show fields
            const fields = Object.keys(currentData[0]);
            selectedFields = [...fields];
            fieldsList.innerHTML = fields.map(f => `
                <label class="ucp-checkbox-label">
                    <input type="checkbox" class="ucp-field-checkbox" value="${f}" checked>
                    <span>${f}</span>
                </label>
            `).join('');
            fieldsSection.style.display = 'block';

            // Add field change listeners
            fieldsList.querySelectorAll('.ucp-field-checkbox').forEach(cb => {
                cb.addEventListener('change', updatePreview);
            });

            updatePreview();
            insertBtn.disabled = false;
            insertBtn.textContent = '➕ Chèn dữ liệu';

        } catch (error) {
            console.error('Failed to fetch data:', error);
            previewContent.innerHTML = '<div class="ucp-error">Lỗi tải dữ liệu</div>';
            previewSection.style.display = 'block';
            insertBtn.disabled = true;
            insertBtn.textContent = '➕ Chèn dữ liệu';
        }
    });

    function updatePreview() {
        const checkboxes = fieldsList.querySelectorAll('.ucp-field-checkbox:checked') as NodeListOf<HTMLInputElement>;
        selectedFields = Array.from(checkboxes).map(cb => cb.value);

        if (currentData.length === 0 || selectedFields.length === 0) {
            previewSection.style.display = 'none';
            insertBtn.disabled = true;
            return;
        }

        previewCount.textContent = String(currentData.length);

        // Show first 3 items as preview
        const previewData = currentData.slice(0, 3);
        let html = '<table class="ucp-preview-table"><thead><tr>';
        html += selectedFields.map(f => `<th>${f}</th>`).join('');
        html += '</tr></thead><tbody>';
        previewData.forEach(item => {
            html += '<tr>';
            html += selectedFields.map(f => `<td>${item[f] ?? ''}</td>`).join('');
            html += '</tr>';
        });
        if (currentData.length > 3) {
            html += `<tr><td colspan="${selectedFields.length}" class="ucp-more">... và ${currentData.length - 3} bản ghi khác</td></tr>`;
        }
        html += '</tbody></table>';

        previewContent.innerHTML = html;
        previewSection.style.display = 'block';
        insertBtn.disabled = false;
    }

    // Insert button
    insertBtn.addEventListener('click', () => {
        if (currentData.length === 0 || selectedFields.length === 0) return;
        const insertMode = (sidebar.querySelector('input[name="ucp-sidebar-insert-mode"]:checked') as HTMLInputElement)?.value as 'row' | 'column';
        callbacks.onInsertData(currentData, selectedFields, insertMode);
    });

    // Template buttons
    sidebar.querySelector('#ucp-load-server-template')?.addEventListener('click', async () => {
        await showServerTemplateModal(callbacks);
    });

    sidebar.querySelector('#ucp-load-local-template')?.addEventListener('click', () => {
        loadLocalFile(callbacks);
    });

    sidebar.querySelector('#ucp-save-to-server')?.addEventListener('click', () => {
        showSaveToServerModal(callbacks);
    });

    sidebar.querySelector('#ucp-export-template')?.addEventListener('click', () => {
        exportTemplate(callbacks);
    });

    return sidebar;
}

async function showServerTemplateModal(callbacks: SidebarCallbacks) {
    const apiService = getApiService();

    try {
        const templates = await apiService.fetchTemplates();

        if (templates.length === 0) {
            alert('Không có template trên server');
            return;
        }

        // Create modal
        const overlay = document.createElement('div');
        overlay.className = 'ucp-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'ucp-modal';
        modal.innerHTML = `
            <div class="ucp-modal-header">
                <h3 class="ucp-modal-title">Chọn Template từ Server</h3>
                <button class="ucp-modal-close">&times;</button>
            </div>
            <div class="ucp-modal-body">
                <div class="ucp-template-list">
                    ${templates.map(t => `
                        <div class="ucp-template-item" data-id="${t.id}">
                            <div class="ucp-template-name">${t.name}</div>
                            ${t.category ? `<div class="ucp-template-category">${t.category}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="ucp-modal-footer">
                <button class="ucp-btn ucp-btn-cancel">Hủy</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        modal.querySelector('.ucp-modal-close')?.addEventListener('click', close);
        modal.querySelector('.ucp-btn-cancel')?.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        modal.querySelectorAll('.ucp-template-item').forEach(item => {
            item.addEventListener('click', async () => {
                const id = item.getAttribute('data-id')!;
                const template = await apiService.fetchTemplateById(id);
                if (template) {
                    callbacks.onLoadTemplate(template);
                    close();
                }
            });
        });
    } catch (error) {
        console.error('Failed to load templates:', error);
        alert('Lỗi khi tải danh sách template');
    }
}

function loadLocalFile(callbacks: SidebarCallbacks) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            callbacks.onLoadLocalFile(data);
        } catch (error) {
            console.error('Failed to load file:', error);
            alert('Lỗi khi đọc file. Vui lòng kiểm tra định dạng JSON.');
        }
    };
    input.click();
}

function showSaveToServerModal(callbacks: SidebarCallbacks) {
    const overlay = document.createElement('div');
    overlay.className = 'ucp-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'ucp-modal';
    modal.innerHTML = `
        <div class="ucp-modal-header">
            <h3 class="ucp-modal-title">Lưu Template lên Server</h3>
            <button class="ucp-modal-close">&times;</button>
        </div>
        <div class="ucp-modal-body">
            <div class="ucp-form-group">
                <label>Tên template:</label>
                <input type="text" id="ucp-template-name" class="ucp-input" placeholder="Nhập tên template...">
            </div>
        </div>
        <div class="ucp-modal-footer">
            <button class="ucp-btn ucp-btn-cancel">Hủy</button>
            <button class="ucp-btn ucp-btn-primary ucp-btn-save">Lưu</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    modal.querySelector('.ucp-modal-close')?.addEventListener('click', close);
    modal.querySelector('.ucp-btn-cancel')?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    modal.querySelector('.ucp-btn-save')?.addEventListener('click', () => {
        const nameInput = modal.querySelector('#ucp-template-name') as HTMLInputElement;
        const name = nameInput.value.trim();
        if (!name) {
            alert('Vui lòng nhập tên template');
            return;
        }
        const data = callbacks.getCurrentWorkbookData();
        callbacks.onSaveTemplateToServer(name, data);
        close();
    });
}

function exportTemplate(callbacks: SidebarCallbacks) {
    const data = callbacks.getCurrentWorkbookData();
    const filename = `template_${Date.now()}.json`;
    callbacks.onExportTemplate(data, filename);
}
