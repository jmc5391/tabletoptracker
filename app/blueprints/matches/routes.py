# app/blueprints/matches/routes.py
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Match, MatchPlayer, Event
from . import matches_bp

@matches_bp.route("/<int:match_id>", methods=["GET"])
@jwt_required()
def get_match(match_id):
    m = Match.query.get_or_404(match_id)
    return jsonify({
        "id": m.id,
        "event_id": m.event_id,
        "scheduled_time": m.scheduled_time.isoformat() if m.scheduled_time else None,
        "status": m.status
    })

@matches_bp.route("/", methods=["POST"])
@jwt_required()
def create_match():
    data = request.get_json() or {}
    event_id = data.get("event_id")
    # very basic checks; expand in production
    ev = Event.query.get_or_404(event_id)
    # require admin to create matches:
    current = get_jwt_identity()
    if ev.admin_id != current:
        return jsonify({"msg":"forbidden"}), 403
    m = Match(event_id=event_id)
    db.session.add(m)
    db.session.commit()
    return jsonify({"id": m.id}), 201
