from fastapi import APIRouter, Depends, Query
from backend.app.api.deps import require_api_key
from backend.app.core.facility_lookup import get_facility_lookup

router = APIRouter(prefix="/facilities", tags=["facilities"])


@router.get("")
def list_facilities(_=Depends(require_api_key)):
    """Returns all facilities for the filter dropdown, grouped for display."""
    lookup = get_facility_lookup()
    facilities = lookup.list_all()
    return {
        "facilities": [
            {
                "facility_id":   f["facility_id"],
                "facility_name": f["facility_name"],
                "region_id":     f["region_id"],
                "region_name":   f["region_name"],
                "customer_id":   f["customer_id"],
                "customer_name": f["customer_name"],
                # Display label matches your example: "Aster CMI Hospital, Bangalore, Aster"
                "label": f"{f['facility_name']}, {f['region_name']}, {f['customer_name']}",
            }
            for f in facilities
        ]
    }


@router.get("/search")
def search_facilities(q: str = Query(..., min_length=1), _=Depends(require_api_key)):
    lookup = get_facility_lookup()
    results = lookup.search(q)
    return {
        "facilities": [
            {
                "facility_id":   f["facility_id"],
                "label": f"{f['facility_name']}, {f['region_name']}, {f['customer_name']}",
            }
            for f in results[:20]
        ]
    }
