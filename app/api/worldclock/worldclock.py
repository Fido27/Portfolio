"""
FastAPI routes for WorldClock / Country Data API.
Provides endpoints to query country data with rich filtering capabilities.
"""

import os
import json
from typing import Optional, List
from fastapi import APIRouter, Query as QueryParam, HTTPException
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query
from appwrite.exception import AppwriteException

# Load environment variables
load_dotenv()

# Initialize Appwrite client
client = Client()
client.set_endpoint(os.getenv('APPWRITE_WORLDCLOCK_ENDPOINT'))
client.set_project(os.getenv('APPWRITE_WORLDCLOCK_PROJECT'))
client.set_key(os.getenv('APPWRITE_WORLDCLOCK_ADMIN_API_KEY'))

databases = Databases(client)
db_id = os.getenv('APPWRITE_WORLDCLOCK_DB_ID')
coll_id = os.getenv('APPWRITE_WORLDCLOCK_COLL_ID')

# Create router
api = APIRouter(prefix="/worldclock", tags=["worldclock"])


@api.get("/countries")
async def list_countries(
    region: Optional[str] = QueryParam(None, description="Filter by region (e.g., 'Europe', 'Asia')"),
    climate: Optional[str] = QueryParam(None, description="Filter by climate tag (e.g., 'cold', 'tropical')"),
    language: Optional[str] = QueryParam(None, description="Filter by language code (e.g., 'en', 'es')"),
    religion: Optional[str] = QueryParam(None, description="Filter by religion tag (e.g., 'muslim_majority')"),
    feature: Optional[str] = QueryParam(None, description="Filter by geographic feature (e.g., 'mountainous', 'island')"),
    size_tag: Optional[str] = QueryParam(None, description="Filter by size tag (e.g., 'large_area', 'small_population')"),
    limit: int = QueryParam(100, description="Maximum number of results", le=500),
    offset: int = QueryParam(0, description="Offset for pagination", ge=0),
):
    """
    List countries with optional filters.

    Returns a paginated list of countries with all their attributes.
    Use filters to find countries by region, climate, language, religion, or geographic features.
    """
    try:
        queries = []

        # Apply filters
        if region:
            queries.append(Query.equal('region', region))

        if climate:
            queries.append(Query.search('climate_tags', climate))

        if language:
            queries.append(Query.search('languages', language))

        if religion:
            queries.append(Query.search('religion_tags', religion))

        if feature:
            queries.append(Query.search('feature_tags', feature))

        if size_tag:
            queries.append(Query.search('size_tags', size_tag))

        # Pagination
        queries.append(Query.limit(limit))
        queries.append(Query.offset(offset))

        # Fetch from Appwrite
        result = databases.list_documents(db_id, coll_id, queries)

        # Parse indices JSON for each country
        countries = []
        for doc in result.get('documents', []):
            country = dict(doc)
            # Parse indices from JSON string
            if 'indices' in country and country['indices']:
                try:
                    country['indices'] = json.loads(country['indices'])
                except:
                    country['indices'] = {}
            countries.append(country)

        return {
            'total': result.get('total', 0),
            'countries': countries,
            'limit': limit,
            'offset': offset
        }

    except AppwriteException as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@api.get("/countries/{iso3}")
async def get_country(iso3: str):
    """
    Get a single country by its ISO3 code.

    Returns detailed information about a specific country including all attributes,
    time-series indices, and metadata.
    """
    try:
        # Search by ISO3 code
        result = databases.list_documents(db_id, coll_id, [
            Query.equal('iso3', iso3.upper()),
            Query.limit(1)
        ])

        if result.get('total', 0) == 0:
            raise HTTPException(status_code=404, detail=f"Country not found: {iso3}")

        country = dict(result['documents'][0])

        # Parse indices from JSON string
        if 'indices' in country and country['indices']:
            try:
                country['indices'] = json.loads(country['indices'])
            except:
                country['indices'] = {}

        return country

    except AppwriteException as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@api.get("/countries/{iso3}/neighbors")
async def get_neighbors(iso3: str):
    """
    Get all countries that border the specified country.

    Returns a list of neighboring countries with their basic information.
    """
    try:
        # Get the country
        country_result = databases.list_documents(db_id, coll_id, [
            Query.equal('iso3', iso3.upper()),
            Query.limit(1)
        ])

        if country_result.get('total', 0) == 0:
            raise HTTPException(status_code=404, detail=f"Country not found: {iso3}")

        country = country_result['documents'][0]
        border_iso3s = country.get('border_countries', [])

        if not border_iso3s:
            return {'neighbors': [], 'count': 0}

        # Fetch all neighboring countries
        # Note: Appwrite Query.equal with array doesn't work for multiple values,
        # so we need to fetch them one by one or use Query.search
        neighbors = []
        for border_iso3 in border_iso3s:
            try:
                neighbor_result = databases.list_documents(db_id, coll_id, [
                    Query.equal('iso3', border_iso3),
                    Query.limit(1)
                ])
                if neighbor_result.get('total', 0) > 0:
                    neighbor = dict(neighbor_result['documents'][0])
                    # Parse indices
                    if 'indices' in neighbor and neighbor['indices']:
                        try:
                            neighbor['indices'] = json.loads(neighbor['indices'])
                        except:
                            neighbor['indices'] = {}
                    neighbors.append(neighbor)
            except:
                continue

        return {
            'neighbors': neighbors,
            'count': len(neighbors)
        }

    except AppwriteException as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@api.get("/regions")
async def list_regions():
    """
    Get a list of all unique regions.

    Returns all distinct region values found in the database.
    """
    try:
        # Fetch all countries (we'll extract unique regions)
        result = databases.list_documents(db_id, coll_id, [
            Query.limit(500)
        ])

        regions = set()
        for doc in result.get('documents', []):
            region = doc.get('region')
            if region:
                regions.add(region)

        return {
            'regions': sorted(list(regions)),
            'count': len(regions)
        }

    except AppwriteException as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@api.get("/stats")
async def get_stats():
    """
    Get overall statistics about the database.

    Returns counts and summary information about the countries database.
    """
    try:
        # Get total count
        result = databases.list_documents(db_id, coll_id, [
            Query.limit(1)
        ])

        total_countries = result.get('total', 0)

        # Fetch all to calculate stats (for demo purposes)
        all_result = databases.list_documents(db_id, coll_id, [
            Query.limit(500)
        ])

        regions = set()
        languages = set()
        climates = set()

        for doc in all_result.get('documents', []):
            if doc.get('region'):
                regions.add(doc['region'])
            for lang in doc.get('languages', []):
                languages.add(lang)
            for climate in doc.get('climate_tags', []):
                climates.add(climate)

        return {
            'total_countries': total_countries,
            'regions': len(regions),
            'languages': len(languages),
            'climates': len(climates),
            'data_source': 'REST Countries API + Global Peace Index'
        }

    except AppwriteException as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
