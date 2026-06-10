# api.py — thin wrapper, stays at root for deploy.sh compatibility
from app.api.routes import app

if __name__ == "__main__":
    from config.settings import Config
    Config.validate_config()
    app.run(
        host=Config.FLASK_HOST,
        port=Config.FLASK_PORT,
        debug=Config.FLASK_DEBUG,
    )
