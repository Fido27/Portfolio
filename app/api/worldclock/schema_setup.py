"""
Schema setup script for Appwrite Countries collection.
Creates all required attributes and indexes for the worldclock feature.
"""

import os
import sys
import time
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.databases import Databases
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

print(f"🚀 Setting up Appwrite collection schema...")
print(f"Database ID: {db_id}")
print(f"Collection ID: {coll_id}")
print()

def create_attribute(func, *args, **kwargs):
    """Helper to create attribute with error handling and delay"""
    try:
        result = func(*args, **kwargs)
        print(f"  ✅ Created: {args[2] if len(args) > 2 else 'attribute'}")
        time.sleep(1)  # Appwrite needs time between attribute creations
        return result
    except AppwriteException as e:
        if "already exists" in str(e).lower() or "attribute" in str(e).lower():
            print(f"  ⏭️  Skipped: {args[2] if len(args) > 2 else 'attribute'} (already exists)")
        else:
            print(f"  ❌ Error creating {args[2] if len(args) > 2 else 'attribute'}: {e}")
    except Exception as e:
        print(f"  ❌ Error: {e}")

def main():
    print("📋 Creating Core Attributes...")
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'iso3', 3, required=True)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'name', 255, required=True)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'official_name', 255, required=False)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'capital', 255, required=False)

    print("\n🌍 Creating Geographic Attributes...")
    create_attribute(databases.create_float_attribute, db_id, coll_id, 'latitude', required=False)
    create_attribute(databases.create_float_attribute, db_id, coll_id, 'longitude', required=False)
    create_attribute(databases.create_integer_attribute, db_id, coll_id, 'area_km2', required=False)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'region', 100, required=False)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'subregion', 100, required=False)

    print("\n👥 Creating Population & Political Attributes...")
    create_attribute(databases.create_integer_attribute, db_id, coll_id, 'population', required=False)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'government_type', 100, required=False)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'independence_date', 50, required=False)

    print("\n💰 Creating Economic Attributes...")
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'currency', 50, required=False)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'currency_name', 100, required=False)
    create_attribute(databases.create_integer_attribute, db_id, coll_id, 'gdp_usd', required=False)

    print("\n🎭 Creating Cultural Attributes...")
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'national_language', 100, required=False)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'famous_food', 500, required=False)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'famous_people', 1000, required=False)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'national_sport', 100, required=False)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'national_anthem', 200, required=False)

    print("\n🏁 Creating Visual Attributes...")
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'flag_emoji', 10, required=False)
    create_attribute(databases.create_url_attribute, db_id, coll_id, 'flag_url', required=False)

    print("\n🕐 Creating Timezone Attributes...")
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'timezone', 100, required=False)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'utc_offset', 10, required=False)

    print("\n🏷️  Creating Tag Arrays (for filtering)...")
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'languages', 10, required=False, array=True)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'climate_tags', 50, required=False, array=True)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'region_tags', 50, required=False, array=True)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'feature_tags', 50, required=False, array=True)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'size_tags', 50, required=False, array=True)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'religion_tags', 50, required=False, array=True)
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'border_countries', 3, required=False, array=True)

    print("\n📊 Creating Time-Series & Metadata Attributes...")
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'indices', 10000, required=False)  # JSON as string for now
    create_attribute(databases.create_string_attribute, db_id, coll_id, 'data_source', 100, required=False)
    create_attribute(databases.create_datetime_attribute, db_id, coll_id, 'last_updated', required=False)

    print("\n⏳ Waiting for attributes to be ready...")
    print("   (Appwrite needs time to process attributes)")
    time.sleep(10)

    print("\n🔍 Creating Indexes...")
    def create_index_safe(index_key, index_type, attributes):
        try:
            databases.create_index(db_id, coll_id, index_key, index_type, attributes)
            print(f"  ✅ Created index: {index_key}")
            time.sleep(1)
        except AppwriteException as e:
            if "already exists" in str(e).lower() or "index" in str(e).lower():
                print(f"  ⏭️  Skipped index: {index_key} (already exists)")
            else:
                print(f"  ❌ Error creating index {index_key}: {e}")
        except Exception as e:
            print(f"  ❌ Error: {e}")

    create_index_safe('iso3_idx', 'key', ['iso3'])
    create_index_safe('name_idx', 'fulltext', ['name'])
    create_index_safe('region_idx', 'key', ['region'])
    create_index_safe('population_idx', 'key', ['population'])
    create_index_safe('area_idx', 'key', ['area_km2'])

    print("\n✨ Schema setup complete!")
    print("\nNext steps:")
    print("  1. Run import_data.py to import countries from REST Countries API")
    print("  2. Run import_indices.py to import Peace Index data")
    print("  3. Start the API server and test endpoints")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        sys.exit(1)
