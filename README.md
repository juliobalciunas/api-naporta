# naPorta - Desafio Backend

API desenvolvida para o desafio técnico da naPorta, focada no gerenciamento de pedidos de entrega para consumo pelo portal web.

## Tecnologias Escolhidas

- **Node.js com NestJS**: Escolhi o Nest pela organização em módulos, injeção de dependência e facilidade de manter o código limpo e tipado com TypeScript.
- **PostgreSQL + Prisma**: O Prisma facilita bastante o trabalho com o banco relacional, garantindo tipagem nos models, migrations simples de rodar e segurança nas queries.
- **JWT**: Autenticação implementada via Bearer Token. Todas as rotas de pedidos são protegidas por padrão, liberando apenas o login e o cadastro.
- **Docker**: Para facilitar a avaliação e garantir que o projeto rode de primeira sem depender de banco instalado na máquina.
- **Swagger**: Disponibilizei a documentação interativa para testar os endpoints direto pelo navegador.

## Decisões de Projeto

- **Soft Delete**: Em vez de deletar o pedido fisicamente do banco, usei o campo `deletedAt`. Quando um pedido é excluído, preencho esse campo com a data atual. As rotas de listagem e detalhes filtram automaticamente pedidos onde `deletedAt` é nulo. Caso alguém tente consultar ou editar um pedido deletado, a API retorna erro 404.
- **Filtros de Pedidos**: A listagem (`GET /api/orders`) aceita query params para filtrar por `orderNumber` (busca aproximada), `status` (PENDING, IN_TRANSIT, DELIVERED, CANCELLED) e intervalo de datas de criação (`startDate` e `endDate`), além de paginação básica (`page` e `limit`).
- **Endereço e Referência**: Pensando na operação da naPorta com entregas em comunidades e áreas com CEP genérico, incluí o campo opcional `referencePoint` no endereço, além do número e complemento.

## Como Rodar

### Com Docker (Recomendado)

Se tiver o Docker instalado, basta rodar:

```bash
docker compose up -d --build
```

Depois que subir o banco e a API, rode o seed para popular os pedidos de teste:

```bash
docker compose exec api yarn prisma:seed
```

A API estará rodando em `http://localhost:3000/api` e o Swagger em `http://localhost:3000/api/docs`.

---

### Rodando Localmente

Se preferir rodar direto na máquina:

1. Instale as dependências:
   ```bash
   yarn
   ```
   *(ou `npm install`)*

2. Configure o arquivo `.env` (já deixei um `.env.example` de modelo com valores padrão).

3. Rode as migrations e o seed:
   ```bash
   yarn prisma:migrate
   yarn prisma:seed
   ```

4. Inicie o servidor:
   ```bash
   yarn start:dev
   ```

## Acesso e Testes no Swagger

A documentação interativa fica em:
`http://localhost:3000/api/docs`

O seed já cadastra um usuário administrador padrão:
- **Email:** admin@naporta.com.br
- **Senha:** admin123

Para testar as rotas protegidas no Swagger:
1. Faça login na rota `POST /api/auth/login`.
2. Copie o `accessToken` retornado.
3. Clique em **Authorize** no canto superior do Swagger e cole o token.

## Testes Automatizados

Escrevi testes unitários para as regras de negócio dos services e testes E2E para validar o fluxo real da API:

```bash
# Testes unitários
yarn test

# Testes ponta a ponta (E2E)
yarn test:e2e
```
