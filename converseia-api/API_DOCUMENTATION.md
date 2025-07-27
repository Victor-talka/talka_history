# API ConverseIA Direito - Documentação

## Visão Geral

Esta API foi desenvolvida para gerenciar o programa de parceiros da ConverseIA Direito, incluindo funcionalidades para:

- Cadastro e gerenciamento de parceiros
- Registro e confirmação de vendas
- Cálculo e controle de comissões
- Gerenciamento de métodos de pagamento

## Base URL

**Produção:** https://60h5imcyxd8l.manus.space/api

## Endpoints Principais

### Parceiros

#### POST /partners
Criar novo parceiro

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "company_name": "Silva Consultoria",
  "company_type": "Consultoria de Gestão",
  "phone": "(11) 99999-9999"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "company_name": "Silva Consultoria",
  "company_type": "Consultoria de Gestão",
  "created_at": "2025-01-26T04:00:00"
}
```

#### GET /partners/{partner_id}
Obter dados do parceiro com estatísticas

**Response:**
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "company_name": "Silva Consultoria",
  "company_type": "Consultoria de Gestão",
  "phone": "(11) 99999-9999",
  "created_at": "2025-01-26T04:00:00",
  "stats": {
    "total_sales": 5000.00,
    "total_commissions": 1750.00,
    "pending_commissions": 500.00,
    "sales_count": 3
  }
}
```

### Vendas

#### POST /partners/{partner_id}/sales
Registrar nova venda

**Body:**
```json
{
  "client_name": "Escritório ABC",
  "client_email": "contato@escritorioabc.com",
  "amount": 2500.00,
  "plan_type": "Premium"
}
```

#### GET /partners/{partner_id}/sales
Listar vendas do parceiro

#### POST /sales/{sale_id}/confirm
Confirmar venda e gerar comissões automaticamente

### Comissões

#### GET /partners/{partner_id}/commissions
Listar comissões do parceiro

#### POST /commissions/{commission_id}/pay
Marcar comissão como paga

### Métodos de Pagamento

#### POST /partners/{partner_id}/payment-methods
Adicionar método de pagamento

**Body:**
```json
{
  "method_type": "pix",
  "details": {
    "pix_key": "joao@exemplo.com",
    "bank": "Banco do Brasil"
  },
  "is_default": true
}
```

#### GET /partners/{partner_id}/payment-methods
Listar métodos de pagamento do parceiro

## Estrutura de Comissões

- **Comissão Padrão:** 35% do valor de todas as vendas
- **Comissão Premium:** 50% para parceiros que atingem R$50.000 em faturamento
- **Desconto na Plataforma:** 70% de desconto para demonstrações aos clientes
- **Cross-sells:** Comissões aplicáveis a todos os novos produtos lançados

## Códigos de Status

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro de validação
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

## Autenticação

Atualmente a API não possui autenticação implementada. Para produção, recomenda-se implementar:

- JWT tokens
- API keys
- Rate limiting
- Validação de CORS mais restritiva

## Banco de Dados

A API utiliza SQLite para desenvolvimento. Para produção, recomenda-se migrar para PostgreSQL ou MySQL.

## Próximos Passos

1. Implementar autenticação e autorização
2. Adicionar validações mais robustas
3. Implementar logs de auditoria
4. Adicionar testes automatizados
5. Configurar monitoramento e alertas

