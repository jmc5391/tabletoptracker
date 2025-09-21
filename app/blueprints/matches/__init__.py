from flask import Blueprint
matches_bp = Blueprint("matches", __name__)
from . import routes