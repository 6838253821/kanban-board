import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client

STATUSES = {"todo", "doing", "done"}

class CardCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    status: str = "todo"

class CardUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    status: str | None = None

app = FastAPI(title="Kanban Board API")
origins = [s.strip() for s in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",") if s.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["GET", "POST", "PATCH", "DELETE"], allow_headers=["*"])

def db():
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise HTTPException(503, "Database not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
    return create_client(url, key)

def check_status(status):
    if status not in STATUSES:
        raise HTTPException(422, "status must be todo, doing or done")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/cards")
def list_cards():
    try:
        return db().table("cards").select("id,title,description,status,created_at").order("created_at").execute().data
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, "Unable to load cards") from exc

@app.post("/cards", status_code=201)
def create_card(card: CardCreate):
    check_status(card.status)
    try:
        return db().table("cards").insert(card.model_dump()).execute().data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, "Unable to create card") from exc

@app.patch("/cards/{card_id}")
def update_card(card_id: str, patch: CardUpdate):
    changes = patch.model_dump(exclude_unset=True)
    if "status" in changes:
        check_status(changes["status"])
    if not changes:
        raise HTTPException(400, "No fields to update")
    try:
        result = db().table("cards").update(changes).eq("id", card_id).execute().data
        if not result:
            raise HTTPException(404, "Card not found")
        return result[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, "Unable to update card") from exc

@app.delete("/cards/{card_id}", status_code=204)
def delete_card(card_id: str):
    try:
        result = db().table("cards").delete().eq("id", card_id).execute().data
        if not result:
            raise HTTPException(404, "Card not found")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, "Unable to delete card") from exc
