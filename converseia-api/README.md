# ConverseIA Direito - Site de Parceiros + API

## Descrição

Este projeto contém o site aprimorado do programa de parceiros da ConverseIA Direito, incluindo:

- **Frontend React** com design moderno e responsivo
- **API Flask** para gerenciamento de parceiros e pagamentos
- **Integração completa** entre frontend e backend
- **Ícones personalizados** da marca ConverseIA

## Estrutura do Projeto

```
converseia-api/
├── src/
│   ├── static/          # Frontend React (build)
│   ├── models/          # Modelos de dados
│   │   ├── user.py
│   │   └── partner.py
│   ├── routes/          # Rotas da API
│   │   ├── user.py
│   │   └── partner.py
│   ├── database/        # Banco de dados SQLite
│   └── main.py          # Aplicação principal
├── venv/                # Ambiente virtual Python
├── requirements.txt     # Dependências Python
├── API_DOCUMENTATION.md # Documentação da API
└── README.md           # Este arquivo
```

## Funcionalidades Implementadas

### Frontend
- ✅ Design responsivo e moderno
- ✅ Integração dos ícones da marca ConverseIA
- ✅ Páginas: Home, Parceria, Cadastro, Dashboard
- ✅ Formulários de cadastro de parceiros
- ✅ Layout otimizado para conversão

### API Backend
- ✅ Cadastro e gerenciamento de parceiros
- ✅ Sistema de vendas e comissões
- ✅ Métodos de pagamento
- ✅ Cálculo automático de comissões (100% inicial + 35% recorrente)
- ✅ CORS habilitado para integração frontend

## Como Executar Localmente

### Pré-requisitos
- Python 3.11+
- Node.js 20+
- npm ou yarn

### Backend (API Flask)
```bash
cd converseia-api
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

pip install -r requirements.txt
python src/main.py
```

A API estará disponível em: http://localhost:5000

### Frontend (Desenvolvimento)
```bash
cd converseia-advogado-parceiro-main
npm install
npm run dev
```

O frontend estará disponível em: http://localhost:8080

## Deploy

O projeto está configurado para deploy automático. O frontend é buildado e servido pelo Flask.

**URL de Produção:** https://60h5imcyxd8l.manus.space

## Endpoints da API

Consulte o arquivo `API_DOCUMENTATION.md` para documentação completa da API.

### Principais endpoints:
- `POST /api/partners` - Criar parceiro
- `GET /api/partners/{id}` - Obter dados do parceiro
- `POST /api/partners/{id}/sales` - Registrar venda
- `POST /api/sales/{id}/confirm` - Confirmar venda
- `GET /api/partners/{id}/commissions` - Listar comissões

## Tecnologias Utilizadas

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/ui
- Lucide Icons
- Vite

### Backend
- Flask 3.1
- SQLAlchemy
- Flask-CORS
- SQLite (desenvolvimento)

## Melhorias Implementadas

1. **Ícones da Marca:** Integração completa dos logos fornecidos
2. **API Robusta:** Sistema completo de gerenciamento de parceiros
3. **Design Aprimorado:** Layout moderno e responsivo
4. **Funcionalidades de Pagamento:** Base para integração com gateways
5. **Documentação:** API totalmente documentada

## Próximos Passos Recomendados

1. **Autenticação:** Implementar JWT ou OAuth
2. **Gateway de Pagamento:** Integrar Stripe, PayPal ou similar
3. **Notificações:** Email/SMS para parceiros
4. **Dashboard Analytics:** Gráficos e relatórios
5. **Testes:** Cobertura de testes automatizados

## Suporte

Para dúvidas sobre a implementação, consulte:
- `API_DOCUMENTATION.md` - Documentação da API
- Código fonte comentado
- Logs da aplicação em `api.log`

