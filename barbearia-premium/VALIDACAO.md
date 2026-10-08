# Validação local — 07/10/2026

- Ambiente verificado antes da instalação: Node.js 24.20.0 e npm 11.19.0.
- npm.cmd install --no-fund --no-audit: dependências verificadas; nenhuma nova dependência necessária.
- npm.cmd run setup: configuração existente preservada.
- npm.cmd test: passou. Inclui fluxo completo pela API, concorrência, duração, calendário, barbeiros diferentes, domingos, bloqueios, status, CRUD, hash, acesso protegido, logout, telefone inválido, reserva manual, clientes, dashboard, configurações e preservação de preço/duração.
- npm.cmd run build: passou.
- npm.cmd audit --omit=dev: zero vulnerabilidades conhecidas nas dependências de produção no momento da execução.
- Backend iniciado na porta 3001 e frontend na porta 5173.
- node tests/local-smoke.js: passou nas duas portas. Site, painel, imagens, catálogo, proteção administrativa, login, dashboard e logout.
- Reservas de teste usam banco em memória; não foram inseridas no banco do usuário.
- Validação visual ficou pendente: a revisão automática bloqueou a captura da janela existente do Chrome por mostrar conversa privada do ChatGPT; o usuário interrompeu a tentativa de abrir uma aba separada com Escape. Testes visuais e em aparelhos móveis não foram concluídos.

Migração adicionou clientes, configurações e relação cliente/agendamento preservando dados anteriores e credenciais existentes.
