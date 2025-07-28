from flask import Blueprint, jsonify, request
from src.models.user import User, db

user_bp = Blueprint('user', __name__)

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    user = User.query.filter_by(username=username, password=password, status='active').first()
    
    if user:
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

@user_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users', methods=['POST'])
def create_user():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    user_type = data.get('user_type', 'user')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    # Verificar se usuário já existe
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({'error': 'Username already exists'}), 400
    
    user = User(username=username, password=password, user_type=user_type)
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    
    user.username = data.get('username', user.username)
    user.password = data.get('password', user.password)
    user.user_type = data.get('user_type', user.user_type)
    user.status = data.get('status', user.status)
    
    db.session.commit()
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    
    # Não permitir exclusão do admin padrão
    if user.username == 'admin':
        return jsonify({'error': 'Cannot delete default admin user'}), 400
    
    db.session.delete(user)
    db.session.commit()
    return '', 204

@user_bp.route('/init-admin', methods=['POST'])
def init_admin():
    # Verificar se admin já existe
    admin_user = User.query.filter_by(username='admin').first()
    if not admin_user:
        admin_user = User(username='admin', password='admin123', user_type='admin')
        db.session.add(admin_user)
        db.session.commit()
        return jsonify({'message': 'Admin user created'}), 201
    else:
        return jsonify({'message': 'Admin user already exists'}), 200

