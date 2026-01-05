"""
API Server for Univer Custom Plugins
Provides dropdown data and template management endpoints

Run with: uvicorn app:app --reload --port 8000
"""

from __future__ import annotations

import json
import os
import threading
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

STORE_PATH = os.environ.get("TEMPLATE_STORE_PATH", "templates_store.json")
_lock = threading.Lock()


# ============ MOCK DATA ============

MOCK_DATA = {
    "products": [
        {"id": "P001", "name": "Laptop", "price": 1200, "category": "Electronics"},
        {"id": "P002", "name": "Smartphone", "price": 800, "category": "Electronics"},
        {"id": "P003", "name": "Headphones", "price": 150, "category": "Electronics"},
        {"id": "P004", "name": "Desk Chair", "price": 350, "category": "Furniture"},
        {"id": "P005", "name": "Monitor", "price": 400, "category": "Electronics"},
        {"id": "P006", "name": "Keyboard", "price": 80, "category": "Electronics"},
        {"id": "P007", "name": "Mouse", "price": 45, "category": "Electronics"},
        {"id": "P008", "name": "Desk", "price": 500, "category": "Furniture"},
    ],
    "employees": [
        {"id": "E001", "name": "Nguyen Van A", "department": "IT", "salary": 2000},
        {"id": "E002", "name": "Tran Thi B", "department": "HR", "salary": 1800},
        {"id": "E003", "name": "Le Van C", "department": "Finance", "salary": 2200},
        {"id": "E004", "name": "Pham Thi D", "department": "IT", "salary": 2100},
        {"id": "E005", "name": "Hoang Van E", "department": "Sales", "salary": 1900},
        {"id": "E006", "name": "Vo Thi F", "department": "Marketing", "salary": 1850},
    ],
    "customers": [
        {"id": "C001", "name": "Company A", "country": "Vietnam", "revenue": 50000},
        {"id": "C002", "name": "Company B", "country": "Japan", "revenue": 75000},
        {"id": "C003", "name": "Company C", "country": "USA", "revenue": 120000},
        {"id": "C004", "name": "Company D", "country": "Korea", "revenue": 85000},
        {"id": "C005", "name": "Company E", "country": "Singapore", "revenue": 65000},
    ],
    "categories": [
        {"id": "CAT01", "name": "Electronics", "description": "Electronic devices"},
        {"id": "CAT02", "name": "Furniture", "description": "Office furniture"},
        {"id": "CAT03", "name": "Software", "description": "Software licenses"},
        {"id": "CAT04", "name": "Services", "description": "Professional services"},
    ],
}

MOCK_TEMPLATES = [
    {
        "id": "tpl-001",
        "name": "Sales Report Template",
        "category": "Sales",
        "content": {
            "sheetOrder": ["sheet1"],
            "sheets": {
                "sheet1": {
                    "id": "sheet1",
                    "name": "Sales Report",
                    "cellData": {
                        "0": {
                            "0": {"v": "Product ID"},
                            "1": {"v": "Product Name"},
                            "2": {"v": "Quantity"},
                            "3": {"v": "Unit Price"},
                            "4": {"v": "Total"},
                        },
                        "1": {
                            "0": {"v": "P001"},
                            "1": {"v": "Laptop"},
                            "2": {"v": 10},
                            "3": {"v": 1200},
                            "4": {"f": "=C2*D2"},
                        },
                        "2": {
                            "0": {"v": "P002"},
                            "1": {"v": "Smartphone"},
                            "2": {"v": 25},
                            "3": {"v": 800},
                            "4": {"f": "=C3*D3"},
                        },
                    },
                    "rowCount": 100,
                    "columnCount": 20,
                }
            }
        },
        "created_at": "2025-12-01T10:00:00Z",
        "updated_at": "2025-12-15T14:30:00Z",
    },
    {
        "id": "tpl-002",
        "name": "Employee Tracking",
        "category": "HR",
        "content": {
            "sheetOrder": ["sheet1"],
            "sheets": {
                "sheet1": {
                    "id": "sheet1",
                    "name": "Employees",
                    "cellData": {
                        "0": {
                            "0": {"v": "ID"},
                            "1": {"v": "Name"},
                            "2": {"v": "Department"},
                            "3": {"v": "Salary"},
                            "4": {"v": "Start Date"},
                        },
                    },
                    "rowCount": 100,
                    "columnCount": 10,
                }
            }
        },
        "created_at": "2025-11-20T09:00:00Z",
        "updated_at": "2025-12-10T11:00:00Z",
    },
    {
        "id": "tpl-003",
        "name": "Budget Planning",
        "category": "Finance",
        "content": {
            "sheetOrder": ["sheet1"],
            "sheets": {
                "sheet1": {
                    "id": "sheet1",
                    "name": "Budget",
                    "cellData": {
                        "0": {
                            "0": {"v": "Category"},
                            "1": {"v": "Q1"},
                            "2": {"v": "Q2"},
                            "3": {"v": "Q3"},
                            "4": {"v": "Q4"},
                            "5": {"v": "Total"},
                        },
                        "1": {
                            "0": {"v": "Marketing"},
                            "1": {"v": 10000},
                            "2": {"v": 12000},
                            "3": {"v": 15000},
                            "4": {"v": 18000},
                            "5": {"f": "=SUM(B2:E2)"},
                        },
                        "2": {
                            "0": {"v": "R&D"},
                            "1": {"v": 20000},
                            "2": {"v": 22000},
                            "3": {"v": 25000},
                            "4": {"v": 28000},
                            "5": {"f": "=SUM(B3:E3)"},
                        },
                    },
                    "rowCount": 50,
                    "columnCount": 15,
                }
            }
        },
        "created_at": "2025-10-15T08:00:00Z",
        "updated_at": "2025-12-01T16:00:00Z",
    },
]


# ============ HELPERS ============

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_store() -> List[Dict[str, Any]]:
    if not os.path.exists(STORE_PATH):
        return []
    with open(STORE_PATH, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
            return data if isinstance(data, list) else []
        except json.JSONDecodeError:
            return []


def save_store(items: List[Dict[str, Any]]) -> None:
    tmp_path = STORE_PATH + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, STORE_PATH)


def find_by_id(items: List[Dict[str, Any]], template_id: str) -> Optional[Dict[str, Any]]:
    for it in items:
        if it.get("id") == template_id:
            return it
    return None


# ============ MODELS ============

class TemplateCreate(BaseModel):
    name: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)
    content: Any = Field(...)


class TemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = Field(None, min_length=1)
    content: Optional[Any] = None


class TemplateOut(BaseModel):
    id: str
    name: str
    category: str
    content: Any
    created_at: str
    updated_at: str


# ============ APP ============

app = FastAPI(
    title="Univer Custom Plugins API",
    description="API server for dropdown data and template management",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ HEALTH ============

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": now_iso()}


# ============ DROPDOWN DATA API ============

@app.get("/dropdown/sources")
def list_dropdown_sources():
    """List all available dropdown data sources"""
    return {
        "sources": [
            {"id": key, "name": key.title(), "count": len(value)}
            for key, value in MOCK_DATA.items()
        ]
    }


@app.get("/dropdown/{source}")
def get_dropdown_data(source: str):
    """Get all data from a dropdown source"""
    if source not in MOCK_DATA:
        raise HTTPException(status_code=404, detail=f"Source '{source}' not found")
    return {"source": source, "data": MOCK_DATA[source]}


@app.get("/dropdown/{source}/search")
def search_dropdown_data(
    source: str,
    q: Optional[str] = Query(None, description="Search query"),
    field: Optional[str] = Query(None, description="Field to search"),
):
    """Search within a dropdown source"""
    if source not in MOCK_DATA:
        raise HTTPException(status_code=404, detail=f"Source '{source}' not found")
    
    data = MOCK_DATA[source]
    
    if q:
        q_lower = q.lower()
        if field:
            data = [item for item in data if q_lower in str(item.get(field, "")).lower()]
        else:
            data = [
                item for item in data 
                if any(q_lower in str(v).lower() for v in item.values())
            ]
    
    return {"source": source, "query": q, "data": data}


# ============ TEMPLATES API ============

@app.get("/templates", response_model=List[TemplateOut])
def list_templates(
    category: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
):
    """List all templates (mock + saved)"""
    # Combine mock templates and saved templates
    with _lock:
        saved = load_store()
    
    all_templates = MOCK_TEMPLATES + saved
    
    if category:
        all_templates = [t for t in all_templates if t.get("category") == category]
    if q:
        q_lower = q.lower()
        all_templates = [t for t in all_templates if q_lower in t.get("name", "").lower()]
    
    all_templates.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    return all_templates


@app.get("/templates/{template_id}", response_model=TemplateOut)
def get_template(template_id: str):
    """Get a single template by ID"""
    # Check mock templates first
    for tpl in MOCK_TEMPLATES:
        if tpl["id"] == template_id:
            return tpl
    
    # Check saved templates
    with _lock:
        items = load_store()
        it = find_by_id(items, template_id)
    
    if not it:
        raise HTTPException(status_code=404, detail="Template not found")
    return it


@app.post("/templates", response_model=TemplateOut)
def create_template(payload: TemplateCreate):
    """Create a new template"""
    with _lock:
        items = load_store()
        
        # Check for duplicates
        for it in items:
            if it["name"] == payload.name and it["category"] == payload.category:
                raise HTTPException(status_code=409, detail="Template already exists")
        
        tid = str(uuid4())
        ts = now_iso()
        record = {
            "id": tid,
            "name": payload.name,
            "category": payload.category,
            "content": payload.content,
            "created_at": ts,
            "updated_at": ts,
        }
        items.append(record)
        save_store(items)
        return record


@app.put("/templates/{template_id}", response_model=TemplateOut)
def update_template(template_id: str, payload: TemplateCreate):
    """Update a template"""
    with _lock:
        items = load_store()
        it = find_by_id(items, template_id)
        if not it:
            raise HTTPException(status_code=404, detail="Template not found")
        
        it["name"] = payload.name
        it["category"] = payload.category
        it["content"] = payload.content
        it["updated_at"] = now_iso()
        save_store(items)
        return it


@app.delete("/templates/{template_id}")
def delete_template(template_id: str):
    """Delete a template"""
    with _lock:
        items = load_store()
        before = len(items)
        items = [it for it in items if it.get("id") != template_id]
        if len(items) == before:
            raise HTTPException(status_code=404, detail="Template not found")
        save_store(items)
    return {"deleted": template_id}


# ============ MAIN ============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
