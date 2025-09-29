from flask import Flask, jsonify
from .config import Config
from .extensions import db, migrate, jwt, cors, ma, limiter

def create_app(config_class=None):
    app = Flask(__name__, static_folder=None)
    app.config.from_object(config_class or Config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},supports_credentials=True)

    ma.init_app(app)
    limiter.init_app(app)

    from .blueprints.users import users_bp
    from .blueprints.events import events_bp
    from .blueprints.matches import matches_bp

    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(events_bp, url_prefix="/api/events")
    app.register_blueprint(matches_bp, url_prefix="/api/matches")

    @app.route("/health")
    def health():
        return jsonify({"status": "ok"})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "not found"}), 404

    return app
