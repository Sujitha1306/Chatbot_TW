"""
Run once (and re-run whenever facility.csv is updated):
  python -m backend.scripts.load_facility_lookup
"""
import csv
import os
from backend.app.db.clickhouse import ClickHouseConnection

def load():
    db = ClickHouseConnection()
    
    # Create the table
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS ovitag_dw.dim_facility (
        facility_id   String,
        facility_name String,
        region_id     String,
        region_name   String,
        customer_id   String,
        customer_name String
    ) ENGINE = MergeTree() ORDER BY facility_id;
    """
    db.client.command(create_table_sql)
    
    rows = []
    csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "facility.csv")
    with open(csv_path) as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append((
                r["facility_id"], r["facility_name"],
                r["region_id"], r["region_name"],
                r["customer_id"], r["customer_name"],
            ))

    db.client.command("TRUNCATE TABLE ovitag_dw.dim_facility")
    db.client.insert(
        "ovitag_dw.dim_facility",
        rows,
        column_names=["facility_id", "facility_name", "region_id", "region_name", "customer_id", "customer_name"],
    )
    print(f"Loaded {len(rows)} facilities into dim_facility")

if __name__ == "__main__":
    load()
