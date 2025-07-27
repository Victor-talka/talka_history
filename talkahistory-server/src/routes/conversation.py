from flask import Blueprint, jsonify, request
from src.models.user import User, db
from src.models.conversation import Conversation, Message
from datetime import datetime
import csv
import io
import re

conversation_bp = Blueprint('conversation', __name__)

@conversation_bp.route('/conversations/<int:user_id>', methods=['GET'])
def get_user_conversations(user_id):
    """Buscar todas as conversas de um usuário"""
    conversations = Conversation.query.filter_by(user_id=user_id).order_by(Conversation.updated_at.desc()).all()
    return jsonify([conv.to_dict() for conv in conversations])

@conversation_bp.route('/conversations/<int:conversation_id>/messages', methods=['GET'])
def get_conversation_messages(conversation_id):
    """Buscar todas as mensagens de uma conversa"""
    messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp.asc()).all()
    return jsonify([msg.to_dict() for msg in messages])

@conversation_bp.route('/conversations/<int:conversation_id>/media', methods=['GET'])
def get_conversation_media(conversation_id):
    """Buscar todas as mídias de uma conversa"""
    media_messages = Message.query.filter_by(conversation_id=conversation_id).filter(
        Message.message_type.in_(['image', 'video', 'audio', 'document'])
    ).order_by(Message.timestamp.desc()).all()
    return jsonify([msg.to_dict() for msg in media_messages])

@conversation_bp.route('/upload-csv', methods=['POST'])
def upload_csv():
    """Upload e processamento de arquivo CSV"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    user_id = request.form.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'File must be CSV format'}), 400
    
    try:
        # Ler o arquivo CSV
        stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
        csv_input = csv.reader(stream)
        
        # Processar CSV e criar conversas/mensagens
        conversations_data = process_csv_data(csv_input, int(user_id))
        
        return jsonify({
            'success': True,
            'message': f'{len(conversations_data)} conversas processadas com sucesso',
            'conversations': conversations_data
        })
    
    except Exception as e:
        return jsonify({'error': f'Error processing CSV: {str(e)}'}), 500

def process_csv_data(csv_reader, user_id):
    """Processar dados do CSV e salvar no banco"""
    conversations_data = []
    
    # Pular cabeçalho se existir
    try:
        header = next(csv_reader)
        if not any(field.isdigit() for field in header):
            # É um cabeçalho, continuar
            pass
        else:
            # Não é cabeçalho, processar esta linha
            csv_reader = [header] + list(csv_reader)
    except StopIteration:
        return conversations_data
    
    # Agrupar mensagens por número de telefone
    phone_conversations = {}
    
    for row in csv_reader:
        if len(row) < 3:
            continue
            
        try:
            # Assumindo formato: timestamp, phone_number, message, from_me
            timestamp_str = row[0].strip()
            phone_number = row[1].strip()
            message_content = row[2].strip() if len(row) > 2 else ""
            from_me = len(row) > 3 and row[3].strip().lower() in ['true', '1', 'sim', 'você']
            
            # Parsear timestamp
            timestamp = parse_timestamp(timestamp_str)
            if not timestamp:
                continue
            
            # Detectar tipo de mídia
            message_type, media_url, media_filename = detect_media_type(message_content)
            
            if phone_number not in phone_conversations:
                phone_conversations[phone_number] = []
            
            phone_conversations[phone_number].append({
                'content': message_content,
                'timestamp': timestamp,
                'from_me': from_me,
                'message_type': message_type,
                'media_url': media_url,
                'media_filename': media_filename
            })
            
        except Exception as e:
            print(f"Error processing row: {e}")
            continue
    
    # Criar conversas no banco de dados
    for phone_number, messages in phone_conversations.items():
        if not messages:
            continue
            
        # Verificar se conversa já existe
        existing_conv = Conversation.query.filter_by(
            user_id=user_id, 
            phone_number=phone_number
        ).first()
        
        if existing_conv:
            # Atualizar conversa existente
            conversation = existing_conv
            # Limpar mensagens antigas
            Message.query.filter_by(conversation_id=conversation.id).delete()
        else:
            # Criar nova conversa
            conversation = Conversation(
                user_id=user_id,
                title=f"Conversa com {phone_number}",
                phone_number=phone_number
            )
            db.session.add(conversation)
            db.session.flush()  # Para obter o ID
        
        # Adicionar mensagens
        for msg_data in messages:
            message = Message(
                conversation_id=conversation.id,
                content=msg_data['content'],
                timestamp=msg_data['timestamp'],
                from_me=msg_data['from_me'],
                message_type=msg_data['message_type'],
                media_url=msg_data['media_url'],
                media_filename=msg_data['media_filename']
            )
            db.session.add(message)
        
        # Atualizar timestamp da conversa
        conversation.updated_at = max(msg['timestamp'] for msg in messages)
        
        conversations_data.append(conversation.to_dict())
    
    db.session.commit()
    return conversations_data

def parse_timestamp(timestamp_str):
    """Parsear diferentes formatos de timestamp"""
    formats = [
        '%d/%m/%Y, %H:%M:%S',
        '%d/%m/%Y %H:%M:%S',
        '%Y-%m-%d %H:%M:%S',
        '%d-%m-%Y %H:%M:%S',
        '%d/%m/%Y, %H:%M',
        '%d/%m/%Y %H:%M'
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(timestamp_str, fmt)
        except ValueError:
            continue
    
    return None

def detect_media_type(content):
    """Detectar tipo de mídia baseado no conteúdo da mensagem"""
    content_lower = content.lower()
    
    # Padrões para diferentes tipos de mídia
    if any(ext in content_lower for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']):
        return 'image', extract_url(content), extract_filename(content)
    elif any(ext in content_lower for ext in ['.mp4', '.avi', '.mov', '.webm']):
        return 'video', extract_url(content), extract_filename(content)
    elif any(ext in content_lower for ext in ['.mp3', '.wav', '.ogg', '.m4a']):
        return 'audio', extract_url(content), extract_filename(content)
    elif any(ext in content_lower for ext in ['.pdf', '.doc', '.docx', '.txt']):
        return 'document', extract_url(content), extract_filename(content)
    elif 'http' in content_lower and any(word in content_lower for word in ['imagem', 'foto', 'image']):
        return 'image', extract_url(content), None
    elif 'http' in content_lower and any(word in content_lower for word in ['video', 'vídeo']):
        return 'video', extract_url(content), None
    elif 'http' in content_lower and any(word in content_lower for word in ['audio', 'áudio']):
        return 'audio', extract_url(content), None
    
    return 'text', None, None

def extract_url(content):
    """Extrair URL do conteúdo"""
    url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    match = re.search(url_pattern, content)
    return match.group(0) if match else None

def extract_filename(content):
    """Extrair nome do arquivo do conteúdo"""
    filename_pattern = r'([^/\\]+\.[a-zA-Z0-9]+)(?:\s|$)'
    match = re.search(filename_pattern, content)
    return match.group(1) if match else None

