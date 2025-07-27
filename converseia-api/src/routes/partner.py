from flask import Blueprint, request, jsonify
from src.models.partner import db, Partner, Sale, Commission, PaymentMethod
from datetime import datetime
import json

partner_bp = Blueprint('partner', __name__)

@partner_bp.route('/partners', methods=['POST'])
def create_partner():
    """Criar novo parceiro"""
    try:
        data = request.get_json()
        
        # Verificar se email já existe
        existing_partner = Partner.query.filter_by(email=data['email']).first()
        if existing_partner:
            return jsonify({'error': 'Email já cadastrado'}), 400
        
        partner = Partner(
            name=data['name'],
            email=data['email'],
            company_name=data['company_name'],
            company_type=data['company_type'],
            phone=data.get('phone', '')
        )
        
        db.session.add(partner)
        db.session.commit()
        
        return jsonify({
            'id': partner.id,
            'name': partner.name,
            'email': partner.email,
            'company_name': partner.company_name,
            'company_type': partner.company_type,
            'created_at': partner.created_at.isoformat()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@partner_bp.route('/partners/<int:partner_id>', methods=['GET'])
def get_partner(partner_id):
    """Obter dados do parceiro"""
    try:
        partner = Partner.query.get_or_404(partner_id)
        
        # Calcular estatísticas
        total_sales = db.session.query(db.func.sum(Sale.amount)).filter_by(
            partner_id=partner_id, status='confirmed'
        ).scalar() or 0
        
        total_commissions = db.session.query(db.func.sum(Commission.amount)).filter_by(
            partner_id=partner_id, status='paid'
        ).scalar() or 0
        
        pending_commissions = db.session.query(db.func.sum(Commission.amount)).filter_by(
            partner_id=partner_id, status='pending'
        ).scalar() or 0
        
        return jsonify({
            'id': partner.id,
            'name': partner.name,
            'email': partner.email,
            'company_name': partner.company_name,
            'company_type': partner.company_type,
            'phone': partner.phone,
            'created_at': partner.created_at.isoformat(),
            'stats': {
                'total_sales': total_sales,
                'total_commissions': total_commissions,
                'pending_commissions': pending_commissions,
                'sales_count': len(partner.sales)
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@partner_bp.route('/partners/<int:partner_id>/sales', methods=['POST'])
def create_sale(partner_id):
    """Registrar nova venda"""
    try:
        data = request.get_json()
        
        sale = Sale(
            partner_id=partner_id,
            client_name=data['client_name'],
            client_email=data['client_email'],
            amount=data['amount'],
            plan_type=data['plan_type']
        )
        
        db.session.add(sale)
        db.session.commit()
        
        return jsonify({
            'id': sale.id,
            'client_name': sale.client_name,
            'amount': sale.amount,
            'plan_type': sale.plan_type,
            'status': sale.status,
            'created_at': sale.created_at.isoformat()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@partner_bp.route('/partners/<int:partner_id>/sales', methods=['GET'])
def get_partner_sales(partner_id):
    """Listar vendas do parceiro"""
    try:
        sales = Sale.query.filter_by(partner_id=partner_id).order_by(Sale.created_at.desc()).all()
        
        return jsonify([{
            'id': sale.id,
            'client_name': sale.client_name,
            'client_email': sale.client_email,
            'amount': sale.amount,
            'plan_type': sale.plan_type,
            'status': sale.status,
            'created_at': sale.created_at.isoformat(),
            'confirmed_at': sale.confirmed_at.isoformat() if sale.confirmed_at else None
        } for sale in sales])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@partner_bp.route('/sales/<int:sale_id>/confirm', methods=['POST'])
def confirm_sale(sale_id):
    """Confirmar venda e gerar comissões"""
    try:
        sale = Sale.query.get_or_404(sale_id)
        
        if sale.status == 'confirmed':
            return jsonify({'error': 'Venda já confirmada'}), 400
        
        sale.status = 'confirmed'
        sale.confirmed_at = datetime.utcnow()
        
        # Verificar faturamento total do parceiro para determinar percentual
        partner = Partner.query.get(sale.partner_id)
        total_revenue = db.session.query(db.func.sum(Sale.amount)).filter_by(
            partner_id=sale.partner_id, status='confirmed'
        ).scalar() or 0
        
        # Determinar percentual de comissão (35% padrão, 50% após R$50.000)
        commission_rate = 0.50 if total_revenue >= 50000 else 0.35
        
        # Gerar comissão (35% ou 50% dependendo do faturamento)
        commission = Commission(
            partner_id=sale.partner_id,
            sale_id=sale.id,
            amount=sale.amount * commission_rate,
            commission_type='standard'
        )
        
        db.session.add(commission)
        db.session.commit()
        
        return jsonify({
            'message': 'Venda confirmada e comissão gerada',
            'commission_rate': f'{commission_rate * 100}%',
            'commission_amount': sale.amount * commission_rate
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@partner_bp.route('/partners/<int:partner_id>/commissions', methods=['GET'])
def get_partner_commissions(partner_id):
    """Listar comissões do parceiro"""
    try:
        commissions = Commission.query.filter_by(partner_id=partner_id).order_by(Commission.created_at.desc()).all()
        
        return jsonify([{
            'id': commission.id,
            'sale_id': commission.sale_id,
            'amount': commission.amount,
            'commission_type': commission.commission_type,
            'status': commission.status,
            'created_at': commission.created_at.isoformat(),
            'paid_at': commission.paid_at.isoformat() if commission.paid_at else None
        } for commission in commissions])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@partner_bp.route('/partners/<int:partner_id>/payment-methods', methods=['POST'])
def add_payment_method(partner_id):
    """Adicionar método de pagamento"""
    try:
        data = request.get_json()
        
        # Se for método padrão, remover padrão dos outros
        if data.get('is_default', False):
            PaymentMethod.query.filter_by(partner_id=partner_id, is_default=True).update({'is_default': False})
        
        payment_method = PaymentMethod(
            partner_id=partner_id,
            method_type=data['method_type'],
            details=json.dumps(data['details']),
            is_default=data.get('is_default', False)
        )
        
        db.session.add(payment_method)
        db.session.commit()
        
        return jsonify({
            'id': payment_method.id,
            'method_type': payment_method.method_type,
            'is_default': payment_method.is_default,
            'created_at': payment_method.created_at.isoformat()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@partner_bp.route('/partners/<int:partner_id>/payment-methods', methods=['GET'])
def get_payment_methods(partner_id):
    """Listar métodos de pagamento do parceiro"""
    try:
        methods = PaymentMethod.query.filter_by(partner_id=partner_id).all()
        
        return jsonify([{
            'id': method.id,
            'method_type': method.method_type,
            'details': json.loads(method.details),
            'is_default': method.is_default,
            'created_at': method.created_at.isoformat()
        } for method in methods])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@partner_bp.route('/commissions/<int:commission_id>/pay', methods=['POST'])
def pay_commission(commission_id):
    """Marcar comissão como paga"""
    try:
        commission = Commission.query.get_or_404(commission_id)
        
        if commission.status == 'paid':
            return jsonify({'error': 'Comissão já paga'}), 400
        
        commission.status = 'paid'
        commission.paid_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Comissão marcada como paga'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

