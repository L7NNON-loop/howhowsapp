# NEXUS AI - BOT PROFISSIONAL DE SINAIS AVIATOR (WhatsApp)

Bot completo com **Node.js + Baileys + Firebase Realtime Database**, preparado para rodar no **Termux**.

## Recursos
- Conexão WhatsApp por **QR Code** e **Pairing Code**.
- Restrição para um único número autorizado (`+258867983175`).
- Sessão persistida automaticamente em `/auth`.
- Whitelist de grupos no Firebase (`grupos/`) com 5 slots iniciais.
- Comandos de grupo com controle de admin.
- Monitor de velas com detecção de nova vela sem repetição de sinal.
- Algoritmo de padrões/frequência/tendência (sem aleatoriedade).
- Envio de GREEN automático e contabilização interna de LOSS (sem enviar LOSS no grupo).
- Logs coloridos, reconexão automática, delay anti-spam e tratamento de erro.

## Estrutura
```
/auth
/config
/database
/services
/commands
/utils
index.js
package.json
README.md
```

## Configuração
As credenciais Firebase já estão em `config/firebase.js`.

Arquivo de ajustes em `config/settings.js`:
- número autorizado
- limites de alvo/proteção
- intervalo de consulta da API
- delay entre mensagens

## Firebase (dados usados)
- `grupos/` (whitelist)
- `statusGrupos/`
- `botStatus/`
- `estatisticas/global`
- `historico/`

### Exemplo de grupos
```json
{
  "grupos": {
    "slot1": { "id": "120000000000001@g.us", "ativo": false, "nome": "SLOT 1" },
    "slot2": { "id": "120000000000002@g.us", "ativo": false, "nome": "SLOT 2" },
    "slot3": { "id": "120000000000003@g.us", "ativo": false, "nome": "SLOT 3" },
    "slot4": { "id": "120000000000004@g.us", "ativo": false, "nome": "SLOT 4" },
    "slot5": { "id": "120000000000005@g.us", "ativo": false, "nome": "SLOT 5" }
  }
}
```

> Troque os IDs dos slots pelos seus grupos reais.

## Comandos
> `.id` pode ser usado normalmente no grupo para descobrir o ID.

Comandos admin:
- `.on`, `.ativar`, `.comecar` (autoriza o grupo na whitelist, ativa sinais e tenta enviar uma entrada imediata)
- `.off`, `.parar`, `.stop`, `.pausar`
- `.status`
- `.debug` (diagnóstico de whitelist/estado/última vela)

Comando livre:
- `.id`

## Instalação no Termux (passo a passo, sem erro)
> **Importante:** não use `< >` no comando `git clone`.

```bash
pkg update -y && pkg upgrade -y
pkg install nodejs git -y

cd ~
git clone https://github.com/SEU_USUARIO/howhowsapp.git
cd ~/howhowsapp

npm install
npm link
aviator start
```


### Comando rápido para atualizar do GitHub e iniciar
Depois de clonar e entrar na pasta do projeto, rode uma vez:
```bash
npm link
```
Isso cria o comando global `aviator`.

Sempre que alterar algo no GitHub (ex.: novo ID de grupo), use:
```bash
aviator start
```
Esse comando faz automaticamente:
1. `git pull --rebase`
2. `npm install`
3. `node index.js`



## Se `aviator start` não funcionar no Termux
Isso acontece quando o `npm link` não adicionou o binário ao PATH. Use uma destas opções:

```bash
cd ~/howhowsapp
npm run aviator:start
```

ou

```bash
cd ~/howhowsapp
./aviator start
```

A opção `./aviator start` funciona sempre dentro da pasta do projeto, mesmo sem `npm link`.

## Se aparecer erro "cd: howhowsapp: No such file or directory"
Use estes comandos:
```bash
cd ~
ls
```
Veja o nome exato da pasta clonada e entre nela com:
```bash
cd NOME_EXATO_DA_PASTA
```

## Se aparecer erro ENOENT no package.json
Você está fora da pasta do projeto. Rode:
```bash
cd ~/howhowsapp
npm install
npm link
aviator start
```

## Observações
- A API monitorada é: `https://app.sscashout.online/api/velas`
- A vela mais recente é sempre `valores[0]`.
- O bot só envia para grupos **ativos + autorizados** no Firebase.


## Funcionamento dos sinais
- O bot monitora a API continuamente.
- Sempre que chegar **nova vela** (`valores[0]` mudou), ele gera e envia novo sinal para grupos autorizados + ativos.
- Se você mandar `.comecar`, o grupo é adicionado/ativado automaticamente na whitelist.


## Reconexão inteligente (sessão removida)
- Se o bot já esteve conectado antes e ficar **30 segundos** sem reconectar, ele força reinício da conexão para gerar **novo QR e pairing code** automaticamente.
- Isso resolve o caso de sessão apagada no Termux/Firebase e loop infinito de reconexão sem novo QR.
