# lgdetox — menu próprio para televisões LG (webOS)

Um menu rápido e sem publicidade: grelha de aplicações navegável com o telecomando, relógio e
atalhos para abrir as aplicações instaladas.

Usa o caminho oficial da LG (Developer Mode + ares-cli). Não precisa de root nem altera o sistema:
o ecrã inicial original da LG continua lá.

## Estrutura do projeto

```
app/                  ← tudo o que vai para a televisão
  appinfo.json          manifesto da aplicação (id: com.lgdetox.menu, permissões)
  index.html            estrutura do ecrã
  style.css             aspeto visual (pensado para 1920x1080)
  app.js                navegação, relógio, listar e abrir aplicações
  apps.config.js        lista de aplicações da grelha (é aqui que se edita)
  icons/                ícones SVG de cada aplicação
  icon.png              ícone do menu (80x80)
  largeIcon.png         ícone grande do menu (130x130)
scripts/
  deploy.sh             empacota, instala e abre na televisão
  debug.sh              abre as DevTools ligadas à aplicação na televisão
dist/                 ← pacote .ipk gerado (criado automaticamente)
```

## 1. Preparar o ambiente

### No computador (Linux)

1. Instale o **Node.js LTS**, pelo gestor de pacotes da distribuição ou pelo
   [nvm](https://github.com/nvm-sh/nvm) (dispensa `sudo` no passo seguinte):

   ```bash
   # Opção A — Debian/Ubuntu
   sudo apt install nodejs npm

   # Opção B — nvm
   nvm install --lts
   ```

2. No terminal:

   ```bash
   # Instala as ferramentas de linha de comandos da LG (ares-*)
   # (com o Node do apt é preciso sudo; com o nvm não)
   npm install -g @webos-tools/cli

   # Confirma que ficaram instaladas
   ares --version
   ```

### Na televisão

1. Crie uma conta em **webostv.developer.lge.com** e inicie sessão com ela na televisão.
2. Na LG Content Store, instale a aplicação **Developer Mode**.
3. Abra-a, inicie sessão e ative **Dev Mode Status**. A televisão reinicia.
4. Volte a abrir o Developer Mode e ative **Key Server**.
5. Tome nota do **IP** e da **Passphrase** que aparecem no ecrã.

> ⚠️ **A sessão do Developer Mode expira.** O tempo restante aparece na aplicação Developer Mode.
> Abra-a de vez em quando e carregue em **Extend**. Se a sessão expirar, a televisão **apaga as
> aplicações de programador** (incluindo este menu) e é preciso instalá-lo de novo.

### Ligar o computador à televisão

```bash
# Regista a televisão nas ferramentas ares.
# Escolha "add" e preencha:
#   Nome: tv   |  IP: o da televisão  |  Porta: 9922
#   Utilizador: prisoner  |  Palavra-passe: deixar em branco
ares-setup-device

# Descarrega a chave SSH da televisão (o Key Server tem de estar ativo).
# Vai pedir a Passphrase que aparece no Developer Mode.
ares-novacom --device tv --getkey

# Teste: deve mostrar o modelo e a versão do webOS da televisão
ares-device --device tv --system-info
```

## 2. Testar no computador (opcional)

Abra `app/index.html` no Chrome ou Chromium com a janela em 1920x1080 (ou use o modo de dispositivo das DevTools).
Fora da televisão aparece a lista de `apps.config.js`. As setas e o Enter funcionam, mas as
aplicações não abrem, porque os serviços da televisão não existem no computador.

## 3. Instalar e abrir na televisão

Na pasta do projeto:

```bash
# Faz tudo de uma vez: empacota, instala e abre
scripts/deploy.sh
```

O que o script faz, passo a passo:

```bash
# 1. Cria o pacote .ipk a partir da pasta app/
ares-package app -o dist

# 2. Envia e instala o pacote na televisão
ares-install --device tv dist/com.lgdetox.menu_1.0.0_all.ipk

# 3. Abre o menu na televisão
ares-launch --device tv com.lgdetox.menu
```

Outros comandos úteis:

```bash
# Abre as DevTools do Chrome ligadas ao menu que está a correr na televisão
scripts/debug.sh

# Desinstala o menu da televisão
ares-install --device tv --remove com.lgdetox.menu
```

Sempre que alterar algum ficheiro em `app/`, volte a correr `scripts/deploy.sh`.

## Teclas do telecomando

| Tecla | Ação |
|---|---|
| Setas | mover entre aplicações |
| OK | abrir a aplicação selecionada |
| 🔴 Vermelho | passar a aplicação selecionada para o início (a ordem fica guardada) |
| 🟢 Verde | atualizar a lista |
| Voltar | não faz nada (o menu não fecha por engano) |
| Magic Remote | apontar e clicar também funciona |

## Editar a lista de aplicações

Tudo se faz em `app/apps.config.js`. Cada linha é uma aplicação:

```js
{
  id: 'netflix',              // identificador da aplicação no webOS
  title: 'Netflix',           // nome que aparece por baixo do ícone
  color: '#b20710',           // cor de fundo do bloco
  icon: 'icons/netflix.svg'   // ícone (SVG ou PNG dentro de app/); opcional
}
```

- A grelha segue a ordem da lista, até reordenar com o botão vermelho.
- As aplicações que não estejam instaladas são escondidas automaticamente. Um `id` errado não
  estraga nada; a aplicação simplesmente não aparece.
- Sem `icon`, o bloco mostra a primeira letra do nome.
- Para esconder uma aplicação sem a apagar da lista, junte o `id` a `HIDDEN_IDS`.
- `ares-install --list` só mostra aplicações de programador, por isso **não** serve para descobrir
  os identificadores das aplicações da loja.

### Ícones

- **Netflix, YouTube, Spotify e HBO**: logótipos do [Simple Icons](https://simpleicons.org)
  (licença CC0), a branco sobre a cor da marca.
- **Prime Video e Disney+**: não existem no Simple Icons (as marcas pediram a remoção), por isso
  são o nome escrito.
- **TV ao vivo, HDMI, Navegador e Configurações**: ícones simples desenhados para este projeto.

Para usar um ícone seu, coloque a imagem em `app/icons/` e aponte o campo `icon` para ela.

## Como o menu encontra as aplicações

1. Tenta `luna://com.webos.applicationManager/listLaunchPoints`, que devolve todas as aplicações
   com ícones. Esta chamada **não está documentada** pela LG e pode ser recusada.
2. Se for recusada, usa a lista de `apps.config.js` e pergunta à televisão, através de
   `getAppLoadStatus` (API oficial), quais delas estão instaladas.

Para abrir as aplicações usa `luna://com.webos.applicationManager/launch` (API oficial).
As permissões estão declaradas em `requiredACG` no `appinfo.json`, que passa a ser obrigatório a
partir do webOS TV 27.

### Testado numa 55NANO796NE (webOS 5, firmware 04.64.00)

- `listLaunchPoints`, `listApps` e `getForegroundAppInfo` são **recusados** a aplicações de
  programador. Por isso, nesta televisão a grelha vem sempre de `apps.config.js`.
- O menu não consegue ler ficheiros nem ícones de outras aplicações; daí os ícones próprios.
- `getAppLoadStatus` e `launch` funcionam.
- O HBO Max está instalado com dois identificadores: `com.wbd.stream` (a aplicação atual, usada
  no menu) e `com.hbo.hbomax` (provavelmente a antiga).

## Usar como "menu principal"

Sem root não é possível mudar o que o botão **Home** abre. O mais próximo disso:

- **Acesso rápido**: mantenha premido um número do telecomando (por exemplo, o **1**) e associe-o
  à aplicação **Menu**. A partir daí, basta manter o **1** premido para abrir o menu.
- Na barra do ecrã inicial da LG, coloque o **Menu** em primeiro lugar (modo de edição da barra).
