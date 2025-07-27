import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Search, MessageCircle, LogOut, Image, Video, Music, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  content: string;
  timestamp: string;
  from_me: boolean;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document';
  media_url?: string;
  media_filename?: string;
}

interface Conversation {
  id: number;
  title: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface ChatHistoryViewerProps {
  currentUser: string;
  userId: number;
  onLogout: () => void;
}

const ChatHistoryViewer: React.FC<ChatHistoryViewerProps> = ({ currentUser, userId, onLogout }) => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mediaMessages, setMediaMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('messages');

  // Carregar conversas do usuário ao montar o componente
  useEffect(() => {
    loadUserConversations();
  }, [userId]);

  const loadUserConversations = async () => {
    try {
      const response = await fetch(`/api/conversations/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  const loadConversationMessages = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const loadConversationMedia = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/media`);
      if (response.ok) {
        const data = await response.json();
        setMediaMessages(data);
      }
    } catch (error) {
      console.error('Erro ao carregar mídias:', error);
    }
  };

  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setActiveTab('messages');
    await loadConversationMessages(conversation.id);
    await loadConversationMedia(conversation.id);
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo CSV.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId.toString());

      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Sucesso",
          description: data.message
        });
        
        // Recarregar conversas
        await loadUserConversations();
      } else {
        const errorData = await response.json();
        toast({
          title: "Erro",
          description: errorData.error || "Erro ao processar arquivo.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do arquivo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      // Limpar o input
      event.target.value = '';
    }
  }, [userId, toast]);

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    return conversations.filter(conv => 
      conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.phone_number.includes(searchTerm)
    );
  }, [conversations, searchTerm]);

  const formatTimestamp = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  }, []);

  const getMediaIcon = (messageType: string) => {
    switch (messageType) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const renderMediaContent = (message: Message) => {
    if (message.message_type === 'image' && message.media_url) {
      return (
        <div className="mt-2">
          <img 
            src={message.media_url} 
            alt={message.media_filename || 'Imagem'} 
            className="max-w-xs rounded-lg cursor-pointer"
            onClick={() => window.open(message.media_url, '_blank')}
          />
        </div>
      );
    }
    
    if (message.media_url) {
      return (
        <div className="mt-2">
          <a 
            href={message.media_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            {getMediaIcon(message.message_type)}
            {message.media_filename || 'Abrir mídia'}
            <Download className="h-3 w-3" />
          </a>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">TalkaHistory</h1>
              <p className="text-sm text-gray-600">Olá, {currentUser}</p>
            </div>
            <Button onClick={onLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Upload */}
          <div className="mb-4">
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Button 
                variant="default" 
                className="w-full" 
                disabled={isLoading}
                asChild
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {isLoading ? 'Processando...' : 'Importar CSV'}
                </span>
              </Button>
            </label>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Pesquisar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {conversations.length === 0 ? 'Nenhuma conversa encontrada. Importe um arquivo CSV.' : 'Nenhuma conversa encontrada.'}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationSelect(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-gray-900 truncate">{conversation.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {conversation.message_count}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">{conversation.phone_number}</p>
                <p className="text-xs text-gray-400">{formatTimestamp(conversation.updated_at)}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{selectedConversation.title}</h2>
              <p className="text-sm text-gray-600">{selectedConversation.phone_number}</p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-4 w-fit">
                <TabsTrigger value="messages" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Mensagens
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Mídias ({mediaMessages.length})
                </TabsTrigger>
              </TabsList>

              {/* Messages Tab */}
              <TabsContent value="messages" className="flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.from_me ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.from_me
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getMediaIcon(message.message_type)}
                          <span className="text-xs opacity-75">
                            {formatTimestamp(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        {renderMediaContent(message)}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Media Tab */}
              <TabsContent value="media" className="flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4">
                  {mediaMessages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      Nenhuma mídia encontrada nesta conversa.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mediaMessages.map((message) => (
                        <Card key={message.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                              {getMediaIcon(message.message_type)}
                              <CardTitle className="text-sm truncate">
                                {message.media_filename || message.message_type}
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs text-gray-600 mb-2">
                              {formatTimestamp(message.timestamp)}
                            </p>
                            <p className="text-sm text-gray-800 mb-2 line-clamp-2">
                              {message.content}
                            </p>
                            {message.message_type === 'image' && message.media_url && (
                              <img 
                                src={message.media_url} 
                                alt={message.media_filename || 'Imagem'} 
                                className="w-full h-32 object-cover rounded cursor-pointer"
                                onClick={() => window.open(message.media_url, '_blank')}
                              />
                            )}
                            {message.media_url && message.message_type !== 'image' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={() => window.open(message.media_url, '_blank')}
                              >
                                <Download className="h-3 w-3 mr-2" />
                                Abrir
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Selecione uma conversa para visualizar as mensagens</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistoryViewer;

