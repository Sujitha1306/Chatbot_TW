import logging
from backend.app.db.clickhouse import ClickHouseConnection

logger = logging.getLogger(__name__)

class UserLookup:
    def __init__(self):
        self._by_id: dict[str, str] = {}
        self.refresh()

    def refresh(self) -> None:
        try:
            db = ClickHouseConnection()
            from backend.config.settings import Config
            df = db.client.query_df(f"SELECT id, first_name, last_name FROM {Config.CLICKHOUSE_DATABASE}.dim_user")
            if df.empty:
                raise ValueError("dim_user returned no rows")

            # Store the full name
            users = {}
            for _, row in df.iterrows():
                # Convert ID to string for safe dictionary lookup (since IDs from frontend could be strings or ints)
                uid = str(row["id"]) if not type(row["id"]) is float else str(int(row["id"]))
                
                import pandas as pd
                fname = "" if pd.isna(row["first_name"]) else str(row["first_name"]).strip()
                lname = "" if pd.isna(row["last_name"]) else str(row["last_name"]).strip()
                
                if fname == "None": fname = ""
                if lname == "None": lname = ""
                
                full_name = f"{fname} {lname}".strip()
                if full_name:
                    users[uid] = full_name

            self._by_id = users
            logger.info(f"User lookup loaded: {len(self._by_id)} users")
        except Exception as e:
            logger.warning(f"dim_user unavailable ({e})")
            self._by_id = {}

    def resolve(self, uid) -> str:
        import pandas as pd
        if uid is None or pd.isna(uid):
            return uid
        uid_str = str(int(uid)) if isinstance(uid, float) else str(uid)
        return self._by_id.get(uid_str, uid)

class LocationLookup:
    def __init__(self):
        self._by_id: dict[str, str] = {}
        self.refresh()

    def refresh(self) -> None:
        try:
            db = ClickHouseConnection()
            from backend.config.settings import Config
            df = db.client.query_df(f"SELECT id, name FROM {Config.CLICKHOUSE_DATABASE}.dim_location")
            if df.empty:
                raise ValueError("dim_location returned no rows")

            locations = {}
            for _, row in df.iterrows():
                lid = str(row["id"]) if not type(row["id"]) is float else str(int(row["id"]))
                import pandas as pd
                name = "" if pd.isna(row["name"]) else str(row["name"]).strip()
                if name and name != "None":
                    locations[lid] = name

            self._by_id = locations
            logger.info(f"Location lookup loaded: {len(self._by_id)} locations")
        except Exception as e:
            logger.warning(f"dim_location unavailable ({e})")
            self._by_id = {}

    def resolve(self, lid) -> str:
        import pandas as pd
        if lid is None or pd.isna(lid):
            return lid
        lid_str = str(int(lid)) if isinstance(lid, float) else str(lid)
        return self._by_id.get(lid_str, lid)


_user_lookup: UserLookup | None = None
_location_lookup: LocationLookup | None = None

def get_user_lookup() -> UserLookup:
    global _user_lookup
    if _user_lookup is None:
        _user_lookup = UserLookup()
    return _user_lookup

def get_location_lookup() -> LocationLookup:
    global _location_lookup
    if _location_lookup is None:
        _location_lookup = LocationLookup()
    return _location_lookup
