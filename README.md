# Univer Custom Spreadsheet

All-in-one spreadsheet solution built on top of Univer with powerful custom plugins. Just import and use - no complex setup needed!

## Features

✨ **API Dropdown Plugin** - Select and insert data directly from your API endpoints  
📋 **Template Loader Plugin** - Load predefined templates from server or local files  
🔄 **Dynamic Array Plugin** - Auto-expand spreadsheet when reaching edges  
🌍 **Multi-language Support** - English, Vietnamese, Chinese, Russian  
📦 **All-in-one Package** - All dependencies bundled, minimal configuration required

## Installation

```bash
npm install univer-custom-spreadsheet
```

Or install from GitHub:

```bash
npm install github:phuoc2426/univer-custom-spreadsheet
```

## Quick Start

### Basic Usage

```javascript
import { createSpreadsheet } from "univer-custom-spreadsheet";
import "@univerjs/design/lib/index.css";
import "@univerjs/ui/lib/index.css";
import "@univerjs/docs-ui/lib/index.css";
import "@univerjs/sheets-ui/lib/index.css";

const instance = createSpreadsheet({
  container: document.getElementById("spreadsheet"),
  locale: "en", // or "vi", "zh", "ru"
});
```

### Full Configuration Example

```javascript
import { createSpreadsheet } from "univer-custom-spreadsheet";

// Import required CSS
import "@univerjs/design/lib/index.css";
import "@univerjs/ui/lib/index.css";
import "@univerjs/docs-ui/lib/index.css";
import "@univerjs/sheets-ui/lib/index.css";

const instance = createSpreadsheet({
  // Required: Container element
  container: document.getElementById("spreadsheet"),

  // API Configuration
  apiBaseUrl: "http://localhost:8000",

  // Dropdown Sources Configuration
  dropdownSources: [
    {
      id: "products",
      name: "Products",
      endpoint: "/products",
      displayField: "name",
      valueField: "id",
    },
    {
      id: "customers",
      name: "Customers",
      endpoint: "/customers",
      displayField: "name",
      valueField: "id",
    },
  ],

  // Template Loader Configuration
  templateApi: {
    listEndpoint: "/templates",
    getEndpoint: "/templates/{id}",
  },

  // Dynamic Array Configuration
  dynamicArray: {
    enabled: true,
    rowsToAdd: 50,
    columnsToAdd: 10,
    threshold: 5,
  },

  // Language (en, vi, zh, ru)
  locale: "en",

  // Initial data (optional)
  initialData: {
    id: "workbook-1",
    name: "My Workbook",
    sheetOrder: ["sheet1"],
    sheets: {
      sheet1: {
        id: "sheet1",
        name: "Sheet1",
        cellData: {
          0: {
            0: { v: "Column A" },
            1: { v: "Column B" },
            2: { v: "Column C" },
          },
          1: {
            0: { v: "Data 1" },
            1: { v: "Data 2" },
            2: { v: "Data 3" },
          },
        },
      },
    },
  },
});

// Access Univer instance and workbook
console.log("Univer instance:", instance.univer);
console.log("Workbook:", instance.workbook);

// Cleanup when done
// instance.dispose();
```

## Configuration Options

### Container (Required)

```javascript
container: document.getElementById("spreadsheet");
```

The DOM element where the spreadsheet will be rendered.

### API Base URL

```javascript
apiBaseUrl: "http://localhost:8000";
```

Base URL for all API requests. Used by dropdown and template plugins.

### Dropdown Sources

```javascript
dropdownSources: [
  {
    id: "unique-id", // Unique identifier for this source
    name: "Display Name", // Name shown in UI
    endpoint: "/api/endpoint", // API endpoint (relative to apiBaseUrl)
    displayField: "name", // Field to display in dropdown
    valueField: "id", // Field to use as value
  },
];
```

Configure data sources for the API dropdown plugin.

### Template API

```javascript
templateApi: {
  listEndpoint: "/templates",      // Endpoint to get template list
  getEndpoint: "/templates/{id}"   // Endpoint to get specific template
}
```

Configure template loader plugin endpoints.

### Dynamic Array

```javascript
dynamicArray: {
  enabled: true,        // Enable/disable auto-expansion
  rowsToAdd: 50,       // How many rows to add
  columnsToAdd: 10,    // How many columns to add
  threshold: 5         // Add more when this many rows/cols remain
}
```

Configure auto-expansion behavior when cursor reaches edge of spreadsheet.

### Locale

```javascript
locale: "en"; // Supported: "en", "vi", "zh", "ru"
```

Set the language for the spreadsheet interface.

### Initial Data

```javascript
initialData: {
  id: "workbook-1",
  name: "Workbook Name",
  sheetOrder: ["sheet1"],
  sheets: {
    sheet1: {
      id: "sheet1",
      name: "Sheet1",
      cellData: {
        // Row index
        0: {
          // Column index: cell data
          0: { v: "Hello" },
          1: { v: "World" },
        },
      },
    },
  },
};
```

Provide initial workbook data. If not provided, a blank workbook will be created.

## Using the Plugins

### API Dropdown Plugin

1. Configure dropdown sources in the `dropdownSources` array
2. Click the "API Dropdown" button in the toolbar
3. Select a data source and search/select items
4. Data will be inserted at the current cursor position

**API Response Format:**

```json
[
  {
    "id": 1,
    "name": "Product Name",
    "price": 100
  }
]
```

### Template Loader Plugin

1. Configure template endpoints in `templateApi`
2. Click the "Load Template" button in the toolbar
3. Select a template from the list
4. Template data will load into the current sheet

**Template List Response:**

```json
[
  {
    "id": "template-1",
    "name": "Invoice Template",
    "description": "Standard invoice"
  }
]
```

**Template Data Response:**

```json
{
  "id": "workbook-1",
  "sheets": {
    "sheet1": {
      "id": "sheet1",
      "name": "Invoice",
      "cellData": {}
    }
  }
}
```

### Dynamic Array Plugin

Automatically expands the spreadsheet when you work near the edges:

- Move cursor within 5 rows of bottom edge → adds 50 new rows
- Move cursor within 5 columns of right edge → adds 10 new columns
- Threshold and expansion amounts are configurable

## API Reference

### `createSpreadsheet(config)`

Creates a new spreadsheet instance.

**Returns:**

```typescript
{
  univer: Univer,           // Univer instance
  workbook: Workbook,       // Current workbook
  dispose: () => void       // Cleanup function
}
```

### `updatePluginConfig(config)`

Update plugin configuration at runtime:

```javascript
import { updatePluginConfig } from "univer-custom-spreadsheet";

updatePluginConfig({
  apiBaseUrl: "http://new-api.com",
  dropdownSources: [
    /* new sources */
  ],
});
```

## TypeScript Support

Full TypeScript support with type definitions included:

```typescript
import {
  createSpreadsheet,
  CreateSpreadsheetConfig,
  SpreadsheetInstance,
  UniverCustomPluginsConfig,
} from "univer-custom-spreadsheet";

const config: CreateSpreadsheetConfig = {
  container: document.getElementById("spreadsheet")!,
  locale: "en",
  // ... other config
};

const instance: SpreadsheetInstance = createSpreadsheet(config);
```

## HTML Template

Basic HTML setup:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Univer Spreadsheet</title>
    <style>
      #spreadsheet {
        width: 100%;
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <div id="spreadsheet"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

## Vite Configuration

If using Vite, add this to `vite.config.js`:

```javascript
import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    include: ["univer-custom-spreadsheet"],
  },
});
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Support

For issues and questions:

- GitHub Issues: https://github.com/phuoc2426/univer-custom-spreadsheet/issues
- Documentation: https://univer.ai

## Credits

Built on top of [Univer](https://univer.ai) - Open source alternative to Google Sheets/Excel
