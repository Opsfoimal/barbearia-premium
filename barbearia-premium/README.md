# D'Quebrada Cortes — agendamento

React, Node.js + Express e SQLite. Interface preta, branca e dourada, com estilos responsivos.

## Iniciar no Windows

Requisito: Node.js 24.14 ou superior. Na pasta deste README:

```powershell
npm.cmd install
npm.cmd run setup
npm.cmd run dev
```

Site: http://localhost:5173
Painel: http://localhost:5173/admin
Backend: http://localhost:3001

O setup cria .env com senha aleatória somente se esse arquivo não existir. Consulte ADMIN_EMAIL e ADMIN_PASSWORD no .env para entrar. Configuração e credenciais existentes foram preservadas. Alterar .env depois da criação do administrador não redefine sua senha.

## Recursos

- Página pública com logo, serviços, barbeiros, avaliações ilustrativas, endereço, mapa e WhatsApp.
- Serviço → barbeiro → calendário → horários → cliente → confirmação, com mensagem pronta para WhatsApp.
- Calendário consulta dias disponíveis. Reservas respeitam duração, bloqueios e horário de São Paulo. Segunda a sábado, 09h–19h; domingos fechados.
- Transação BEGIN IMMEDIATE impede reservas sobrepostas para o mesmo barbeiro. Horários adjacentes são permitidos.
- Painel com agendamentos de hoje, próximos, total de clientes, faturamento estimado do período, agenda diária/semanal.
- Confirmar, cancelar, concluir, reagendar e criar agendamento manual. Reserva pública começa Agendado; manual começa Confirmada.
- Reagendar o mesmo serviço preserva preço e duração originais; trocar serviço usa os valores atuais.
- Bloqueios de horários, dias e folgas por profissional ou para toda a barbearia. Reservas conflitantes devem ser canceladas ou reagendadas primeiro.
- Cadastro/edição de serviços, preços, duração, barbeiros e fotos HTTPS. Sem foto, usa ilustração SVG local.
- Nome, endereço e WhatsApp configuráveis no painel.
- Senhas com scrypt, salt aleatório, sessões HttpOnly/SameSite de oito horas, validação Zod, rotas protegidas, SQL parametrizado e limite de requisições.

SQLite persistente: data/barbearia.sqlite. Tabelas: admins, customers, barbers, services, appointments, blocks, settings e sessions. Clientes são identificados pelo telefone. A migração preserva reservas existentes. Um banco novo recebe quatro serviços e dois barbeiros.

## Versão compilada

Pare o servidor de desenvolvimento antes de usar a mesma porta:

```powershell
npm.cmd run build
npm.cmd start
```

Site: http://localhost:3001. Painel: http://localhost:3001/admin.

## Testes

```powershell
npm.cmd test
npm.cmd run build
npm.cmd audit --omit=dev
```

O teste integrado usa banco em memória e credenciais aleatórias. Verifica reservas concorrentes, duração, calendário, status, bloqueios, CRUD, autenticação, cadastro de clientes, dashboard, agendamento manual, configurações e preservação de valores. Não grava reservas no banco local.

Com npm.cmd run dev aberto, em outro terminal:

```powershell
node tests/local-smoke.js
```

Valida as páginas, imagens, catálogo, proteção administrativa, login, dashboard e logout nas duas portas usando o .env, sem alterar reservas.

## Arquivos

- src/main.jsx: entrada e navegação.
- src/components/Customer.jsx: página pública e reservas.
- src/components/Calendar.jsx: calendário de disponibilidade.
- src/components/Admin.jsx: painel e dashboard.
- src/components/AppointmentForm.jsx: agendamento manual e reagendamento.
- src/components/Management.jsx: serviços e barbeiros.
- src/components/Field.jsx: campo reutilizável.
- src/lib/api.js: API e formatação.
- src/style.css: tema e responsividade.
- public/images/logo.svg e barber.svg: recursos locais.
- server/app.js: API, regras, autenticação e banco.
- server/index.js: inicialização.
- scripts/setup.js: configuração local.
- scripts/dev.js: execução conjunta.
- tests/flow.test.js e local-smoke.js: testes.

O servidor escuta apenas no computador local. Faturamento estimado soma reservas não canceladas do período e não representa pagamentos recebidos. Fotos reais são cadastradas pelo administrador; avaliações e dados iniciais são demonstrativos. Mapa e fontes online dependem de internet. WhatsApp abre conversa sem enviar mensagens automaticamente. Faça backup da pasta data com o servidor parado. Não publique .env nem o banco.
