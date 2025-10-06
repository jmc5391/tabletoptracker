from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, unset_jwt_cookies, set_access_cookies
from app.extensions import db, limiter
from app.models import User
from . import users_bp

@users_bp.route("/", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")

    if not email or not password or not name:
        return jsonify({"msg": "name, email, and password required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "user already exists"}), 409

    user = User(name=name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"id": user.user_id, "email": user.email, "name": user.name}), 201


@users_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"msg": "email and password required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"msg": "invalid credentials"}), 401

    token = create_access_token(identity=str(user.user_id))
    response = jsonify({"msg": "login successful"})
    set_access_cookies(response, token)
    print("Cookies received:", dict(request.cookies))
    
    return response, 200


@users_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    resp = jsonify({"logout": True})
    unset_jwt_cookies(resp)
    return resp, 200


@users_bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name
    }), 200


@users_bp.route("/<int:user_id>", methods=["POST"])
@jwt_required()
def update_user(user_id):
    current = get_jwt_identity()
    if current != user_id:
        return jsonify({"msg": "forbidden"}), 403

    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}

    if "name" in data:
        user.name = data["name"]

    if "password" in data and data["password"]:
        user.set_password(data["password"])

    db.session.commit()
    return jsonify({"id": user.user_id, "email": user.email, "name": user.name}), 200


@users_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    current = get_jwt_identity()
    user = User.query.get_or_404(int(current))
    return jsonify({"user_id": user.user_id, "email": user.email, "name": user.name}), 200
