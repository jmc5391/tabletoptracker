# app/blueprints/events/routes.py
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Event, EventPlayer, User
from . import events_bp
from datetime import datetime

def parse_iso(dt_str):
    if not dt_str:
        return None
    return datetime.fromisoformat(dt_str)

@events_bp.route("/", methods=["POST"])
@jwt_required()
def create_event():
    data = request.get_json() or {}
    title = data.get("title")
    if not title:
        return jsonify({"msg": "title required"}), 400
    admin_id = get_jwt_identity()
    ev = Event(
        title=title,
        start_date=parse_iso(data.get("start_date")),
        end_date=parse_iso(data.get("end_date")),
        admin_id=admin_id
    )
    db.session.add(ev)
    db.session.commit()
    return jsonify({"id": ev.id, "title": ev.title}), 201

@events_bp.route("/<int:event_id>/players", methods=["POST"])
@jwt_required()
def add_player(event_id):
    data = request.get_json() or {}
    email = data.get("email")
    if not email:
        return jsonify({"msg": "email required"}), 400
    ev = Event.query.get_or_404(event_id)
    current = get_jwt_identity()
    if ev.admin_id != current:
        return jsonify({"msg": "forbidden"}), 403
    user = User.query.filter_by(email=email).first()
    ep = EventPlayer(event_id=ev.id, user_id=(user.id if user else None), invited_email=(None if user else email))
    db.session.add(ep)
    db.session.commit()
    return jsonify({"id": ep.id, "user_id": ep.user_id, "invited_email": ep.invited_email}), 201
