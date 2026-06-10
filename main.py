# main.py — entry point only
from config.settings import Config
from app.ui.streamlit_app import main

if __name__ == "__main__":
    Config.validate_config()
    main()
