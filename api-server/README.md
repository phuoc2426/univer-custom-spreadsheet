# API Server for Univer Custom Plugins

A simple FastAPI server that provides mock data for dropdown sources and template management.

## Setup

```bash
cd api-server
pip install -r requirements.txt
```

## Run

```bash
# Development mode with auto-reload
uvicorn app:app --reload --port 8000

# Or run directly
python app.py
```

## Endpoints

### Health Check
- `GET /health` - Server health status

### Dropdown Data
- `GET /dropdown/sources` - List all available data sources
- `GET /dropdown/{source}` - Get all data from a source (products, employees, customers, categories)
- `GET /dropdown/{source}/search?q=query&field=name` - Search within a source

### Templates
- `GET /templates` - List all templates (mock + saved)
- `GET /templates/{id}` - Get a single template
- `POST /templates` - Create a new template
- `PUT /templates/{id}` - Update a template
- `DELETE /templates/{id}` - Delete a template

## API Documentation

When running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
