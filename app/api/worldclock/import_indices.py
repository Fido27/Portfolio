"""
Import Peace Index data from Excel file into Appwrite countries collection.
Updates the indices field with time-series data.
"""

import os
import sys
import json
import pandas as pd
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

print("📊 Importing Peace Index data...")
print()

def import_peace_index():
    """Import Global Peace Index data from Excel file"""
    try:
        # Read Excel file
        excel_path = 'public/assets/Global Peace Index Overall Scores 2008-2023.xlsx'

        if not os.path.exists(excel_path):
            print(f"❌ Excel file not found: {excel_path}")
            return False

        print(f"📥 Reading Excel file: {excel_path}")

        # Read the Overall Scores sheet, skipping header rows (skip 3 rows to get to data)
        df = pd.read_excel(excel_path, sheet_name='Overall Scores', skiprows=3)

        print(f"✅ Loaded {len(df)} rows from Excel\n")

        # Get column names
        print(f"Columns: {list(df.columns)[:10]}...\n")

        # Process each country
        updated = 0
        not_found = 0
        errors = 0

        for index, row in df.iterrows():
            # Get ISO3 code (column might be named 'iso3c' or similar)
            iso3 = None
            for col in ['iso3c', 'ISO3', 'iso3', 'cca3']:
                if col in df.columns and pd.notna(row.get(col)):
                    iso3 = str(row[col]).strip()
                    break

            if not iso3:
                print(f"  ⚠️  Row {index}: No ISO3 code found, skipping")
                continue

            # Build indices object with peace scores for all years
            peace_scores = {}

            for year in range(2008, 2024):
                # Column names are integers (2008, 2009, etc.)
                if year in df.columns and pd.notna(row.get(year)):
                    try:
                        year_value = float(row[year])
                        peace_scores[str(year)] = round(year_value, 3)
                    except (ValueError, TypeError):
                        continue

            if not peace_scores:
                print(f"  ⚠️  {iso3}: No peace index data found, skipping")
                continue

            # Create/update indices JSON
            indices_json = {
                'peace': peace_scores
            }

            try:
                # Find country document by iso3
                result = databases.list_documents(db_id, coll_id, [
                    Query.equal('iso3', iso3),
                    Query.limit(1)
                ])

                if result['total'] == 0:
                    print(f"  ⚠️  Country not found: {iso3}")
                    not_found += 1
                    continue

                doc_id = result['documents'][0]['$id']
                country_name = result['documents'][0].get('name', iso3)

                # Update document with indices
                # Note: indices is a string field, so we need to JSON stringify
                databases.update_document(db_id, coll_id, doc_id, {
                    'indices': json.dumps(indices_json)
                })

                print(f"  ✅ Updated: {country_name} ({iso3}) - {len(peace_scores)} years")
                updated += 1

            except AppwriteException as e:
                print(f"  ❌ Error updating {iso3}: {e}")
                errors += 1
            except Exception as e:
                print(f"  ❌ Unexpected error for {iso3}: {e}")
                errors += 1

        print(f"\n📊 Import Summary:")
        print(f"   ✅ Updated: {updated}")
        print(f"   ⚠️  Not found: {not_found}")
        print(f"   ❌ Errors: {errors}")
        print(f"   📦 Total processed: {updated + not_found + errors}")

        return updated > 0

    except FileNotFoundError:
        print(f"❌ Excel file not found: {excel_path}")
        return False
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    try:
        success = import_peace_index()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Import interrupted by user")
        sys.exit(1)
