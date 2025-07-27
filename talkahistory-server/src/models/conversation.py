from flask_sqlalchemy import SQLAlchemy
from src.models.user import db
import json

class Conversation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    phone_number = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # Relacionamento com mensagens
    messages = db.relationship('Message', backref='conversation', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Conversation {self.title}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'phone_number': self.phone_number,
            'created_at': self.created_at.strftime('%d/%m/%Y, %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%d/%m/%Y, %H:%M') if self.updated_at else None,
            'message_count': len(self.messages)
        }

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversation.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    from_me = db.Column(db.Boolean, nullable=False, default=False)
    message_type = db.Column(db.String(20), nullable=False, default='text')  # text, image, video, audio, document
    media_url = db.Column(db.String(500), nullable=True)  # Para armazenar URLs de mídia
    media_filename = db.Column(db.String(200), nullable=True)  # Nome original do arquivo

    def __repr__(self):
        return f'<Message {self.id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'content': self.content,
            'timestamp': self.timestamp.strftime('%d/%m/%Y, %H:%M:%S') if self.timestamp else None,
            'from_me': self.from_me,
            'message_type': self.message_type,
            'media_url': self.media_url,
            'media_filename': self.media_filename
        }

