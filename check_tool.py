try:
    from google.adk.tools import google_search
    print("Import successful")
    print(f"Type: {type(google_search)}")
except ImportError as e:
    print(f"Import failed: {e}")
except Exception as e:
    print(f"Error: {e}")
