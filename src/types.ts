/**
 * Univer Custom Plugins Configuration Types
 * 
 * Define all configuration interfaces for the plugins
 */

/**
 * Single dropdown data source configuration
 */
export interface DropdownSourceConfig {
    /** Unique identifier for this source */
    id: string;
    /** Display name for the source */
    name: string;
    /** API endpoint to fetch data from */
    endpoint: string;
    /** HTTP method (default: GET) */
    method?: 'GET' | 'POST';
    /** Field to use as display value */
    displayField: string;
    /** Field to use as actual value */
    valueField: string;
    /** Additional fields to show in dropdown */
    additionalFields?: string[];
    /** Search endpoint (optional) */
    searchEndpoint?: string;
    /** Custom headers for API requests */
    headers?: Record<string, string>;
}

/**
 * Template API configuration
 */
export interface TemplateApiConfig {
    /** API endpoint to list templates */
    listEndpoint: string;
    /** API endpoint to get single template (use {id} placeholder) */
    getEndpoint: string;
    /** API endpoint to save template (optional) */
    saveEndpoint?: string;
    /** API endpoint to delete template (optional) */
    deleteEndpoint?: string;
    /** HTTP headers for all template API requests */
    headers?: Record<string, string>;
    /** Field mapping for template data */
    fieldMapping?: {
        id?: string;
        name?: string;
        category?: string;
        content?: string;
        createdAt?: string;
        updatedAt?: string;
    };
}

/**
 * Dynamic array expansion configuration
 */
export interface DynamicArrayConfig {
    /** Enable/disable dynamic expansion */
    enabled?: boolean;
    /** Number of rows to add when expanding */
    rowsToAdd?: number;
    /** Number of columns to add when expanding */
    columnsToAdd?: number;
    /** Trigger expansion when within this many rows/cols of edge */
    triggerThreshold?: number;
    /** Enable scroll-based expansion */
    enableScrollExpansion?: boolean;
    /** Enable navigation-based expansion */
    enableNavigationExpansion?: boolean;
    /** Enable data-fill expansion */
    enableDataFillExpansion?: boolean;
}

/**
 * Main plugin configuration
 */
export interface UniverCustomPluginsConfig {
    /** Base URL for all API endpoints (can be overridden per-source) */
    apiBaseUrl?: string;

    /** Dropdown data sources configuration */
    dropdownSources?: DropdownSourceConfig[];

    /** Template API configuration */
    templateApi?: TemplateApiConfig;

    /** Allow loading templates from local JSON files */
    allowLocalTemplates?: boolean;

    /** Dynamic array expansion configuration */
    dynamicArray?: DynamicArrayConfig;

    /** Localization */
    locale?: 'en' | 'vi' | 'zh' | 'ja' | 'ko';

    /** Custom HTTP fetch function (for custom auth, etc.) */
    customFetch?: typeof fetch;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: Required<UniverCustomPluginsConfig> = {
    apiBaseUrl: '',
    dropdownSources: [],
    templateApi: {
        listEndpoint: '/templates',
        getEndpoint: '/templates/{id}',
    },
    allowLocalTemplates: true,
    dynamicArray: {
        enabled: true,
        rowsToAdd: 50,
        columnsToAdd: 10,
        triggerThreshold: 5,
        enableScrollExpansion: true,
        enableNavigationExpansion: true,
        enableDataFillExpansion: true,
    },
    locale: 'en',
    customFetch: fetch,
};

/**
 * Template data interface
 */
export interface TemplateData {
    id: string;
    name: string;
    category?: string;
    content: any;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Dropdown item interface
 */
export interface DropdownItem {
    [key: string]: any;
}

/**
 * Localization strings
 */
export interface LocaleStrings {
    apiDropdown: {
        title: string;
        selectSource: string;
        selectFields: string;
        preview: string;
        insertMode: string;
        byRow: string;
        byColumn: string;
        cancel: string;
        insert: string;
        loading: string;
        noData: string;
        search: string;
    };
    templateLoader: {
        title: string;
        fromServer: string;
        fromFile: string;
        search: string;
        loading: string;
        noTemplates: string;
        selectFile: string;
        fileSelected: string;
        cancel: string;
        load: string;
        updated: string;
    };
    cellDropdown: {
        title: string;
        selectSource: string;
        selectField: string;
        search: string;
        loading: string;
        noData: string;
    };
}

export const LOCALES: Record<string, LocaleStrings> = {
    en: {
        apiDropdown: {
            title: '📊 Select Data from API',
            selectSource: 'Data Source:',
            selectFields: 'Select Fields:',
            preview: 'Preview:',
            insertMode: 'Insert Mode:',
            byRow: 'By Row',
            byColumn: 'By Column',
            cancel: 'Cancel',
            insert: 'Insert Data',
            loading: 'Loading...',
            noData: 'No data',
            search: 'Search...',
        },
        templateLoader: {
            title: '📁 Load Template',
            fromServer: '🌐 From Server',
            fromFile: '📄 From JSON File',
            search: 'Search templates...',
            loading: 'Loading templates...',
            noTemplates: 'No templates found',
            selectFile: 'Select File',
            fileSelected: '✓ File selected:',
            cancel: 'Cancel',
            load: 'Load Template',
            updated: 'Updated:',
        },
        cellDropdown: {
            title: '📊 Select Data',
            selectSource: '-- Select source --',
            selectField: 'Select field',
            search: 'Search...',
            loading: 'Loading...',
            noData: 'No data',
        },
    },
    vi: {
        apiDropdown: {
            title: '📊 Chọn dữ liệu từ API',
            selectSource: 'Nguồn dữ liệu:',
            selectFields: 'Chọn các trường:',
            preview: 'Xem trước:',
            insertMode: 'Chế độ chèn:',
            byRow: 'Theo hàng',
            byColumn: 'Theo cột',
            cancel: 'Hủy',
            insert: 'Chèn dữ liệu',
            loading: 'Đang tải...',
            noData: 'Không có dữ liệu',
            search: 'Tìm kiếm...',
        },
        templateLoader: {
            title: '📁 Tải Template',
            fromServer: '🌐 Từ Server',
            fromFile: '📄 Từ File JSON',
            search: 'Tìm kiếm template...',
            loading: 'Đang tải templates...',
            noTemplates: 'Không có template nào',
            selectFile: 'Chọn File',
            fileSelected: '✓ File đã chọn:',
            cancel: 'Hủy',
            load: 'Tải Template',
            updated: 'Cập nhật:',
        },
        cellDropdown: {
            title: '📊 Chọn dữ liệu',
            selectSource: '-- Chọn nguồn --',
            selectField: 'Chọn trường',
            search: 'Tìm kiếm...',
            loading: 'Đang tải...',
            noData: 'Không có dữ liệu',
        },
    },
    zh: {
        apiDropdown: {
            title: '📊 从API选择数据',
            selectSource: '数据源:',
            selectFields: '选择字段:',
            preview: '预览:',
            insertMode: '插入模式:',
            byRow: '按行',
            byColumn: '按列',
            cancel: '取消',
            insert: '插入数据',
            loading: '加载中...',
            noData: '没有数据',
            search: '搜索...',
        },
        templateLoader: {
            title: '📁 加载模板',
            fromServer: '🌐 从服务器',
            fromFile: '📄 从JSON文件',
            search: '搜索模板...',
            loading: '正在加载模板...',
            noTemplates: '没有找到模板',
            selectFile: '选择文件',
            fileSelected: '✓ 已选择文件:',
            cancel: '取消',
            load: '加载模板',
            updated: '更新于:',
        },
        cellDropdown: {
            title: '📊 选择数据',
            selectSource: '-- 选择数据源 --',
            selectField: '选择字段',
            search: '搜索...',
            loading: '加载中...',
            noData: '没有数据',
        },
    },
    ja: {
        apiDropdown: {
            title: '📊 APIからデータを選択',
            selectSource: 'データソース:',
            selectFields: 'フィールドを選択:',
            preview: 'プレビュー:',
            insertMode: '挿入モード:',
            byRow: '行ごと',
            byColumn: '列ごと',
            cancel: 'キャンセル',
            insert: 'データを挿入',
            loading: '読み込み中...',
            noData: 'データなし',
            search: '検索...',
        },
        templateLoader: {
            title: '📁 テンプレートを読み込む',
            fromServer: '🌐 サーバーから',
            fromFile: '📄 JSONファイルから',
            search: 'テンプレートを検索...',
            loading: 'テンプレートを読み込み中...',
            noTemplates: 'テンプレートが見つかりません',
            selectFile: 'ファイルを選択',
            fileSelected: '✓ ファイル選択済み:',
            cancel: 'キャンセル',
            load: 'テンプレートを読み込む',
            updated: '更新:',
        },
        cellDropdown: {
            title: '📊 データを選択',
            selectSource: '-- ソースを選択 --',
            selectField: 'フィールドを選択',
            search: '検索...',
            loading: '読み込み中...',
            noData: 'データなし',
        },
    },
    ko: {
        apiDropdown: {
            title: '📊 API에서 데이터 선택',
            selectSource: '데이터 소스:',
            selectFields: '필드 선택:',
            preview: '미리보기:',
            insertMode: '삽입 모드:',
            byRow: '행별',
            byColumn: '열별',
            cancel: '취소',
            insert: '데이터 삽입',
            loading: '로딩 중...',
            noData: '데이터 없음',
            search: '검색...',
        },
        templateLoader: {
            title: '📁 템플릿 로드',
            fromServer: '🌐 서버에서',
            fromFile: '📄 JSON 파일에서',
            search: '템플릿 검색...',
            loading: '템플릿 로딩 중...',
            noTemplates: '템플릿을 찾을 수 없습니다',
            selectFile: '파일 선택',
            fileSelected: '✓ 파일 선택됨:',
            cancel: '취소',
            load: '템플릿 로드',
            updated: '업데이트:',
        },
        cellDropdown: {
            title: '📊 데이터 선택',
            selectSource: '-- 소스 선택 --',
            selectField: '필드 선택',
            search: '검색...',
            loading: '로딩 중...',
            noData: '데이터 없음',
        },
    },
};
