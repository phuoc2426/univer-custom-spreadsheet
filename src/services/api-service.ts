/**
 * API Service for fetching dropdown data and templates
 */

import type {
    DropdownSourceConfig,
    TemplateApiConfig,
    TemplateData,
    DropdownItem,
    UniverCustomPluginsConfig,
} from '../types';

export class ApiService {
    private config: UniverCustomPluginsConfig;
    private fetchFn: typeof fetch;

    constructor(config: UniverCustomPluginsConfig) {
        this.config = config;
        this.fetchFn = config.customFetch || fetch.bind(window);
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<UniverCustomPluginsConfig>) {
        this.config = { ...this.config, ...config };
        if (config.customFetch) {
            this.fetchFn = config.customFetch;
        }
    }

    /**
     * Build full URL from endpoint
     */
    private buildUrl(endpoint: string, baseUrl?: string): string {
        const base = baseUrl || this.config.apiBaseUrl || '';
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            return endpoint;
        }
        return `${base}${endpoint}`;
    }

    /**
     * Get list of configured dropdown sources
     */
    getDropdownSources(): DropdownSourceConfig[] {
        return this.config.dropdownSources || [];
    }

    /**
     * Fetch dropdown data from a source
     */
    async fetchDropdownData(sourceId: string): Promise<DropdownItem[]> {
        const source = this.config.dropdownSources?.find((s: DropdownSourceConfig) => s.id === sourceId);
        if (!source) {
            console.error(`Dropdown source "${sourceId}" not found`);
            return [];
        }

        try {
            const url = this.buildUrl(source.endpoint);
            const response = await this.fetchFn(url, {
                method: source.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...source.headers,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Handle both array response and wrapped response
            if (Array.isArray(data)) {
                return data;
            }
            if (data.data && Array.isArray(data.data)) {
                return data.data;
            }
            if (data.items && Array.isArray(data.items)) {
                return data.items;
            }
            if (data.results && Array.isArray(data.results)) {
                return data.results;
            }

            return [];
        } catch (error) {
            console.error(`Error fetching dropdown data from "${sourceId}":`, error);
            return [];
        }
    }

    /**
     * Search within a dropdown source
     */
    async searchDropdownData(sourceId: string, query: string): Promise<DropdownItem[]> {
        const source = this.config.dropdownSources?.find((s: DropdownSourceConfig) => s.id === sourceId);
        if (!source) {
            return [];
        }

        // If search endpoint is configured, use it
        if (source.searchEndpoint) {
            try {
                const url = this.buildUrl(source.searchEndpoint.replace('{query}', encodeURIComponent(query)));
                const response = await this.fetchFn(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...source.headers,
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return Array.isArray(data) ? data : (data.data || data.items || data.results || []);
            } catch (error) {
                console.error('Error searching dropdown data:', error);
                return [];
            }
        }

        // Otherwise, fetch all data and filter locally
        const allData = await this.fetchDropdownData(sourceId);
        const queryLower = query.toLowerCase();
        return allData.filter(item =>
            Object.values(item).some(v =>
                String(v).toLowerCase().includes(queryLower)
            )
        );
    }

    /**
     * Fetch list of templates
     */
    async fetchTemplates(): Promise<TemplateData[]> {
        const templateApi = this.config.templateApi;
        if (!templateApi?.listEndpoint) {
            console.warn('Template API list endpoint not configured');
            return [];
        }

        try {
            const url = this.buildUrl(templateApi.listEndpoint);
            const response = await this.fetchFn(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...templateApi.headers,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const items = Array.isArray(data) ? data : (data.data || data.items || data.results || []);

            return this.mapTemplateData(items, templateApi.fieldMapping);
        } catch (error) {
            console.error('Error fetching templates:', error);
            return [];
        }
    }

    /**
     * Fetch a single template by ID
     */
    async fetchTemplate(templateId: string): Promise<TemplateData | null> {
        const templateApi = this.config.templateApi;
        if (!templateApi?.getEndpoint) {
            console.warn('Template API get endpoint not configured');
            return null;
        }

        try {
            const url = this.buildUrl(templateApi.getEndpoint.replace('{id}', templateId));
            const response = await this.fetchFn(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...templateApi.headers,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const mapped = this.mapTemplateData([data], templateApi.fieldMapping);
            return mapped[0] || null;
        } catch (error) {
            console.error('Error fetching template:', error);
            return null;
        }
    }

    /**
     * Save a template
     */
    async saveTemplate(template: Omit<TemplateData, 'id' | 'createdAt' | 'updatedAt'>): Promise<TemplateData | null> {
        const templateApi = this.config.templateApi;
        if (!templateApi?.saveEndpoint) {
            console.warn('Template API save endpoint not configured');
            return null;
        }

        try {
            const url = this.buildUrl(templateApi.saveEndpoint);
            const response = await this.fetchFn(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...templateApi.headers,
                },
                body: JSON.stringify(template),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error saving template:', error);
            return null;
        }
    }

    /**
     * Map template data using field mapping
     */
    private mapTemplateData(
        items: any[],
        fieldMapping?: TemplateApiConfig['fieldMapping']
    ): TemplateData[] {
        return items.map(item => ({
            id: item[fieldMapping?.id || 'id'],
            name: item[fieldMapping?.name || 'name'],
            category: item[fieldMapping?.category || 'category'],
            content: item[fieldMapping?.content || 'content'],
            createdAt: item[fieldMapping?.createdAt || 'created_at'] || item.createdAt,
            updatedAt: item[fieldMapping?.updatedAt || 'updated_at'] || item.updatedAt,
        }));
    }
}

// Singleton instance (will be initialized when plugins are registered)
let apiServiceInstance: ApiService | null = null;

export function getApiService(): ApiService {
    if (!apiServiceInstance) {
        throw new Error('ApiService not initialized. Call initializePlugins first.');
    }
    return apiServiceInstance;
}

export function initApiService(config: UniverCustomPluginsConfig): ApiService {
    apiServiceInstance = new ApiService(config);
    return apiServiceInstance;
}
