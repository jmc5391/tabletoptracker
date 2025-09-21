from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User
from . import users_bp

@users_bp.route("/", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"msg": "email and password required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "user already exists"}), 409
    user = User(email=email, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return jsonify({"id": user.id, "email": user.email}), 201

@users_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    user = User.query.filter_by(email=data.get("email")).first()
    if not user or not check_password_hash(user.password_hash, data.get("password", "")):
        return jsonify({"msg": "invalid credentials"}), 401
    token = create_access_token(identity=user.id)
    return jsonify({"access_token": token}), 200

@users_bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    current = get_jwt_identity()
    if current != user_id:
        return jsonify({"msg": "forbidden"}), 403
    user = User.query.get_or_404(user_id)
    return jsonify({"id": user.id, "email": user.email, "display_name": user.display_name})
