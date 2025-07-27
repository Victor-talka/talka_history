from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Partner(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    company_name = db.Column(db.String(200), nullable=False)
    company_type = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relacionamentos
    sales = db.relationship('Sale', backref='partner', lazy=True)
    commissions = db.relationship('Commission', backref='partner', lazy=True)

class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partner.id'), nullable=False)
    client_name = db.Column(db.String(200), nullable=False)
    client_email = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    plan_type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime)

class Commission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partner.id'), nullable=False)
    sale_id = db.Column(db.Integer, db.ForeignKey('sale.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    commission_type = db.Column(db.String(20), nullable=False)  # initial, recurring
    status = db.Column(db.String(20), default='pending')  # pending, paid, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    paid_at = db.Column(db.DateTime)

class PaymentMethod(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partner.id'), nullable=False)
    method_type = db.Column(db.String(20), nullable=False)  # pix, bank_transfer, paypal
    details = db.Column(db.Text)  # JSON string with payment details
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

