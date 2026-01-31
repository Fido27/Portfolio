"""
Import country data from REST Countries API into Appwrite.
Fetches comprehensive country information and populates the countries collection.
"""

import os
import sys
import time
import requests
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID
from appwrite.exception import AppwriteException
from appwrite.query import Query

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

print("🌍 Importing country data from REST Countries API...")
print()

def determine_climate_tags(lat, long_val, country_data):
    """Determine climate tags based on latitude and other data"""
    tags = []

    if lat is None:
        return tags

    # Temperature-based climate
    if abs(lat) > 66.5:  # Arctic/Antarctic circles
        tags.append('arctic')
        tags.append('cold')
    elif abs(lat) > 60:
        tags.append('cold')
    elif abs(lat) < 23.5:  # Tropics
        tags.append('tropical')
        tags.append('hot')
    else:
        tags.append('temperate')

    # Additional climate classifications
    name = country_data.get('name', {}).get('common', '').lower()
    region = country_data.get('region', '').lower()

    if 'desert' in name or region == 'middle east':
        tags.append('desert')
        tags.append('arid')

    return list(set(tags))  # Remove duplicates

def determine_feature_tags(country_data):
    """Determine geographic feature tags"""
    tags = []

    name = country_data.get('name', {}).get('common', '').lower()
    landlocked = country_data.get('landlocked', False)
    area = country_data.get('area', 0)

    # Island nations
    if 'island' in name or name in ['japan', 'united kingdom', 'philippines', 'indonesia',
                                      'new zealand', 'madagascar', 'sri lanka', 'iceland',
                                      'ireland', 'cuba', 'taiwan', 'singapore']:
        tags.append('island')

    # Landlocked
    if landlocked:
        tags.append('landlocked')
    else:
        tags.append('coastal')

    # Mountainous regions (approximation based on well-known countries)
    mountainous = ['nepal', 'switzerland', 'bhutan', 'tibet', 'afghanistan', 'kyrgyzstan',
                   'tajikistan', 'peru', 'bolivia', 'ecuador', 'colombia', 'chile', 'austria',
                   'georgia', 'armenia', 'lesotho', 'andorra', 'liechtenstein', 'san marino']
    if any(m in name for m in mountainous):
        tags.append('mountainous')

    # Fjords
    if 'norway' in name or 'iceland' in name or 'new zealand' in name:
        tags.append('fjords')

    # Archipelago
    if name in ['indonesia', 'philippines', 'maldives', 'japan', 'caribbean']:
        tags.append('archipelago')

    return tags

def determine_size_tags(population, area):
    """Determine size classification tags"""
    tags = []

    # Population-based
    if population and population > 100000000:
        tags.append('large_population')
    elif population and population < 1000000:
        tags.append('small_population')

    # Area-based
    if area and area > 1000000:  # > 1 million km²
        tags.append('large_area')
    elif area and area < 10000:  # < 10,000 km²
        tags.append('small_area')

    return tags

def determine_religion_tags(country_data):
    """Determine religious majority tags (approximation)"""
    tags = []

    name = country_data.get('name', {}).get('common', '').lower()
    region = country_data.get('region', '').lower()
    subregion = country_data.get('subregion', '').lower()

    # Muslim-majority countries (Middle East, North Africa, parts of Asia)
    muslim_regions = ['western asia', 'northern africa', 'middle east']
    muslim_countries = ['saudi arabia', 'iran', 'iraq', 'egypt', 'turkey', 'pakistan',
                        'bangladesh', 'indonesia', 'malaysia', 'morocco', 'algeria',
                        'afghanistan', 'sudan', 'uzbekistan', 'jordan', 'azerbaijan',
                        'united arab emirates', 'tunisia', 'somalia', 'senegal', 'mali',
                        'niger', 'mauritania', 'yemen', 'syria', 'tajikistan', 'libya']

    if any(subr in subregion for subr in muslim_regions) or any(c in name for c in muslim_countries):
        tags.append('muslim_majority')

    # Christian-majority (Americas, Europe, Sub-Saharan Africa)
    if region in ['americas', 'europe'] and name not in muslim_countries:
        tags.append('christian_majority')

    # Hindu-majority
    if 'india' in name or 'nepal' in name:
        tags.append('hindu_majority')

    # Buddhist-majority
    if name in ['thailand', 'myanmar', 'cambodia', 'laos', 'sri lanka', 'bhutan', 'mongolia']:
        tags.append('buddhist_majority')

    return tags

def import_countries():
    """Import all countries from REST Countries API"""
    try:
        # Fetch all independent countries
        print("📥 Fetching countries from REST Countries API...")
        response = requests.get('https://restcountries.com/v3.1/independent?status=true', timeout=30)
        response.raise_for_status()
        countries = response.json()

        print(f"✅ Fetched {len(countries)} countries\n")

        # Check existing countries
        print("🔍 Checking for existing countries...")
        try:
            existing = databases.list_documents(db_id, coll_id, [Query.limit(500)])
            existing_iso3s = {doc.get('iso3') for doc in existing.get('documents', [])}
            print(f"   Found {len(existing_iso3s)} existing countries\n")
        except:
            existing_iso3s = set()

        # Import each country
        imported = 0
        skipped = 0
        errors = 0

        for country in countries:
            iso3 = country.get('cca3', '')
            if not iso3:
                print(f"  ⚠️  Skipping country without ISO3 code")
                skipped += 1
                continue

            name = country.get('name', {}).get('common', '')

            # Skip if already exists
            if iso3 in existing_iso3s:
                print(f"  ⏭️  Skipping {name} ({iso3}) - already exists")
                skipped += 1
                continue

            try:
                # Extract latitude/longitude
                latlng = country.get('latlng', [None, None])
                lat = latlng[0] if len(latlng) > 0 else None
                lng = latlng[1] if len(latlng) > 1 else None

                # Extract capital
                capitals = country.get('capital', [])
                capital = capitals[0] if capitals else ''

                # Extract currency
                currencies = country.get('currencies', {})
                currency_code = list(currencies.keys())[0] if currencies else ''
                currency_name = currencies.get(currency_code, {}).get('name', '') if currency_code else ''

                # Extract languages
                languages = list(country.get('languages', {}).keys())
                national_lang = list(country.get('languages', {}).values())[0] if country.get('languages') else ''

                # Extract timezones
                timezones = country.get('timezones', [])
                timezone = timezones[0] if timezones else ''

                # Determine tags
                climate_tags = determine_climate_tags(lat, lng, country)
                feature_tags = determine_feature_tags(country)
                size_tags = determine_size_tags(country.get('population'), country.get('area'))
                religion_tags = determine_religion_tags(country)

                # Regional tags
                region = country.get('region', '')
                subregion = country.get('subregion', '')
                region_tags = [region.lower(), subregion.lower()] if region and subregion else [region.lower()] if region else []

                # Create document
                # Note: area_km2 and population were created as strings earlier, so convert to string
                area = country.get('area')
                population = country.get('population')

                doc_data = {
                    'iso3': iso3,
                    'name': name,
                    'official_name': country.get('name', {}).get('official', ''),
                    'capital': capital,
                    'latitude': lat,
                    'longitude': lng,
                    'area_km2': str(int(area)) if area else '',
                    'region': region,
                    'subregion': subregion,
                    'population': str(int(population)) if population else '',
                    'currency': currency_code,
                    'currency_name': currency_name,
                    'national_language': national_lang,
                    'flag_emoji': country.get('flag', ''),
                    'flag_url': country.get('flags', {}).get('svg', ''),
                    'timezone': timezone,
                    'languages': languages[:10],  # Limit to 10 languages
                    'border_countries': country.get('borders', [])[:50],  # Limit array size
                    'climate_tags': climate_tags[:10],
                    'region_tags': region_tags[:10],
                    'feature_tags': feature_tags[:10],
                    'size_tags': size_tags[:10],
                    'religion_tags': religion_tags[:10],
                    'data_source': 'REST Countries API',
                }

                databases.create_document(db_id, coll_id, ID.unique(), doc_data)
                print(f"  ✅ Imported: {name} ({iso3})")
                imported += 1

                # Rate limiting
                time.sleep(0.2)

            except AppwriteException as e:
                print(f"  ❌ Error importing {name} ({iso3}): {e}")
                errors += 1
            except Exception as e:
                print(f"  ❌ Unexpected error for {name} ({iso3}): {e}")
                errors += 1

        print(f"\n📊 Import Summary:")
        print(f"   ✅ Imported: {imported}")
        print(f"   ⏭️  Skipped: {skipped}")
        print(f"   ❌ Errors: {errors}")
        print(f"   📦 Total: {imported + skipped + errors}")

        return imported > 0

    except requests.RequestException as e:
        print(f"❌ Failed to fetch from REST Countries API: {e}")
        return False
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        return False

if __name__ == "__main__":
    try:
        success = import_countries()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Import interrupted by user")
        sys.exit(1)
