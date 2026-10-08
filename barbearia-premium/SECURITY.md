# Segurança do DQB STUDIO

O projeto usa validação no servidor, consultas SQL parametrizadas, senha com
scrypt, sessões HttpOnly/SameSite, limites de requisições e cabeçalhos Helmet.
Os identificadores de sessão são armazenados como hash no banco, e dados da
API são enviados com Cache-Control: no-store. Pedidos de alteração exigem
JSON e o cabeçalho X-Requested-With, com verificação da origem do navegador.
Nenhuma dessas medidas garante proteção absoluta ou impede todo abuso de reservas.

As compilações incluem uma política CSP para restringir scripts e conexões,
inclusive na página estática hospedada no GitHub Pages. Recursos externos
permitidos incluem fontes Google, mapas Google e imagens HTTPS. Não configure
uma API de produção sem HTTPS.

## Antes de colocar a agenda e o painel na internet

- Use HTTPS e NODE_ENV=production para ativar cookies Secure.
- Use uma senha administrativa exclusiva, longa e diferente da senha de demonstração.
  ADMIN_PASSWORD é usada apenas na criação inicial: mudar o .env não altera
  automaticamente a senha de um administrador já cadastrado.
- Hospede página, API e painel na mesma origem para manter as proteções atuais.
  VITE_API_URL permite definir uma API HTTPS, mas não configura CORS nem a
  autenticação entre domínios. Não libere origens indiscriminadamente.
- Mantenha .env e data fora do repositório e do diretório público.
- Faça backups protegidos do banco, limite acesso ao servidor e mantenha Node
  e dependências atualizados. Rode npm audit e npm test regularmente.
- Configure limites no provedor de hospedagem. Os limites de aplicação são
  locais ao processo e não substituem proteção contra ataques volumétricos.
- Ative autenticação de dois fatores na conta GitHub.

Os testes de segurança verificam acesso administrativo, falsificação de origem,
sessões, logout, cache, limites de login e tratamento de requisições inválidas.
Sessões criadas antes da mudança para hashes deixam de funcionar: faça login novamente.

O GitHub Pages não executa o servidor de reservas. Publicar arquivos estáticos
não publica o banco, o painel funcional ou integrações de WhatsApp.
