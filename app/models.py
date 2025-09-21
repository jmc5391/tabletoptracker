from .extensions import db

class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    pw = db.Column(db.String, nullable=False)

    # relationships
    event_players = db.relationship("EventPlayer", back_populates="user")
    event_roles = db.relationship("EventRole", back_populates="user")
    match_players = db.relationship("MatchPlayer", back_populates="user")


class Event(db.Model):
    __tablename__ = "events"

    event_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)

    # relationships
    event_players = db.relationship("EventPlayer", back_populates="event")
    event_roles = db.relationship("EventRole", back_populates="event")
    matches = db.relationship("Match", back_populates="event")


class EventPlayer(db.Model):
    __tablename__ = "event_players"

    ep_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey("events.event_id"), nullable=False)
    score = db.Column(db.Integer, default=0)

    # relationships
    user = db.relationship("User", back_populates="event_players")
    event = db.relationship("Event", back_populates="event_players")


class EventRole(db.Model):
    __tablename__ = "event_roles"

    eo_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey("events.event_id"), nullable=False)
    role = db.Column(db.String, nullable=False)

    # relationships
    user = db.relationship("User", back_populates="event_roles")
    event = db.relationship("Event", back_populates="event_roles")


class Match(db.Model):
    __tablename__ = "matches"

    match_id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.event_id"), nullable=False)
    round = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String, nullable=False)

    # relationships
    event = db.relationship("Event", back_populates="matches")
    match_players = db.relationship("MatchPlayer", back_populates="match")


class MatchPlayer(db.Model):
    __tablename__ = "match_players"

    mp_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    match_id = db.Column(db.Integer, db.ForeignKey("matches.match_id"), nullable=False)
    score = db.Column(db.Integer, default=0)
    result = db.Column(db.String)

    # relationships
    user = db.relationship("User", back_populates="match_players")
    match = db.relationship("Match", back_populates="match_players")
