# Univer Custom Spreadsheet

All-in-one spreadsheet solution với các tính năng tùy chỉnh. Chỉ cần import và sử dụng - không cần cài thêm bất kỳ dependency nào!

## ✨ Tính năng

- 📊 **API Dropdown**: Chọn và chèn dữ liệu từ API endpoints
- 📄 **Template Loader**: Tải templates từ server hoặc file JSON local
- 🔄 **Dynamic Array**: Tự động mở rộng sheet khi đến cạnh

## 📦 Cài đặt

### Từ GitHub

```bash
npm install github:your-username/univer-custom-spreadsheet
```

### Từ npm (sau khi publish)

```bash
npm install univer-custom-spreadsheet
```

## 🚀 Sử dụng

### Cách 1: All-in-one (Khuyên dùng)

Cách đơn giản nhất - tạo spreadsheet hoàn chỉnh chỉ với một hàm:

```typescript
import { createSpreadsheet } from 'univer-custom-spreadsheet';

// Import styles (bắt buộc)
import '@univerjs/design/lib/index.css';
import '@univerjs/ui/lib/index.css';
import '@univerjs/docs-ui/lib/index.css';
import '@univerjs/sheets-ui/lib/index.css';
import '@univerjs/sheets-formula/lib/index.css';

// Tạo spreadsheet
const instance = createSpreadsheet({
    // Container element
    container: document.getElementById('spreadsheet')!,
    
    // API cấu hình
    apiBaseUrl: 'https://api.example.com',
    
    // Nguồn dữ liệu dropdown
    dropdownSources: [
        {
            id: 'products',
            name: 'Sản phẩm',
            endpoint: '/products',
            displayField: 'name',
            valueField: 'id',
        },
        {
            id: 'customers',
            name: 'Khách hàng', 
            endpoint: '/customers',
        },
    ],
    
    // API để tải templates
    templateApi: {
        listEndpoint: '/templates',
        getEndpoint: '/templates/{id}',
    },
    
    // Cấu hình dynamic array
    dynamicArray: {
        enabled: true,
        rowsToAdd: 50,
        columnsToAdd: 10,
    },
    
    // Ngôn ngữ (en, vi, zh, ru)
    locale: 'vi',
});

// Sau này: dọn dẹp
instance.dispose();
```

### Cách 2: Với Univer có sẵn

Nếu bạn đã có Univer instance, chỉ cần đăng ký plugins:

```typescript
import { registerUniverCustomPlugins } from 'univer-custom-spreadsheet';

// Giả sử bạn đã có univer instance
registerUniverCustomPlugins(univer, {
    apiBaseUrl: 'https://api.example.com',
    dropdownSources: [
        { id: 'users', name: 'Users', endpoint: '/users' }
    ],
});
```

## 📝 Cấu hình chi tiết

### DropdownSourceConfig

```typescript
interface DropdownSourceConfig {
    id: string;              // ID duy nhất
    name: string;            // Tên hiển thị
    endpoint: string;        // API endpoint (sẽ nối với apiBaseUrl)
    displayField?: string;   // Field để hiển thị (mặc định: 'name')
    valueField?: string;     // Field để lấy giá trị (mặc định: 'id')
    headers?: Record<string, string>; // Custom headers
}
```

### TemplateApiConfig

```typescript
interface TemplateApiConfig {
    listEndpoint: string;    // Endpoint lấy danh sách templates
    getEndpoint: string;     // Endpoint lấy template theo ID ({id} sẽ được thay thế)
    headers?: Record<string, string>;
}
```

### DynamicArrayConfig

```typescript
interface DynamicArrayConfig {
    enabled?: boolean;       // Bật/tắt (mặc định: true)
    rowsToAdd?: number;      // Số hàng thêm khi mở rộng (mặc định: 50)
    columnsToAdd?: number;   // Số cột thêm khi mở rộng (mặc định: 10)
    triggerThreshold?: number; // Khoảng cách trigger (mặc định: 5)
    enableNavigationExpansion?: boolean; // Mở rộng khi di chuyển
    enableScrollExpansion?: boolean;     // Mở rộng khi cuộn
    enableDataFillExpansion?: boolean;   // Mở rộng khi điền dữ liệu
}
```

## 🔧 API Server mẫu

File `api-server/app.py` chứa FastAPI server mẫu:

```bash
cd api-server
pip install fastapi uvicorn
uvicorn app:app --reload --port 8000
```

Endpoints:
- `GET /dropdown/{source}` - Lấy dữ liệu dropdown
- `GET /templates` - Danh sách templates
- `GET /templates/{id}` - Lấy template theo ID

## 📁 Cấu trúc Project

```
univer-custom-spreadsheet/
├── dist/                    # Build output
│   ├── index.js            # CommonJS bundle (~14MB)
│   ├── index.mjs           # ESM bundle (~14MB)
│   └── index.d.ts          # TypeScript declarations
├── src/
│   ├── index.ts            # Main entry - createSpreadsheet()
│   ├── types.ts            # TypeScript interfaces
│   ├── config-store.ts     # Configuration singleton
│   ├── plugins/
│   │   ├── api-dropdown-plugin.ts
│   │   ├── template-loader-plugin.ts
│   │   └── dynamic-array-plugin.ts
│   ├── services/
│   │   └── api-service.ts
│   └── ui/
│       ├── api-dropdown-modal.ts
│       └── template-loader-modal.ts
├── api-server/
│   └── app.py              # FastAPI mock server
└── package.json
```

## 🌐 Hỗ trợ ngôn ngữ

- English (en)
- Tiếng Việt (vi)
- 中文 (zh)
- Русский (ru)

## ⚠️ Lưu ý

- Bundle size khá lớn (~14MB) vì đã bao gồm toàn bộ Univer
- Nếu dự án của bạn đã dùng Univer, hãy dùng cách 2 (registerUniverCustomPlugins) để tránh duplicate
- React là external dependency - dự án của bạn cần có React 18+

## 📄 License

MIT
