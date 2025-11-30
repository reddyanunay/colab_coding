from fastapi import APIRouter
from app.schemas import AutocompleteRequest, AutocompleteResponse
from app.services.autocomplete_service import AutocompleteService

router = APIRouter()
autocomplete_service = AutocompleteService()

@router.post("", response_model=AutocompleteResponse)
async def autocomplete(request: AutocompleteRequest):
    return autocomplete_service.get_suggestion(request)
