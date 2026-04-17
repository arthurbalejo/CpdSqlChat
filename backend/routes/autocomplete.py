from fastapi import APIRouter, Query
from constants import CURSOS

router = APIRouter()

@router.get("/autocomplete")
def autocomplete(term: str = Query(default="")):
    term_lower = term.lower()
    triggers = {"curso", "evasao", "evasão", "de", "do", "da"}
    
    words = term_lower.split()
    meaningful = [w for w in words if w not in triggers]
    search = meaningful[-1] if meaningful else ""
    
    suggestions = [c for c in CURSOS if search in c.lower()]
    return suggestions[:10]