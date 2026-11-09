# 🎡 Roleta de Sorteio

Site simples e moderno para realizar sorteios com uma roleta interativa.

**Funciona 100% no navegador** — sem backend, sem login. Os dados ficam salvos localmente no seu dispositivo.

## ✨ Funcionalidades

- **Roleta animada** com segmentos coloridos
- **Título editável** acima da roleta
- **Gerenciamento de itens**: adicionar, editar e remover
- **Histórico de sorteios** em ordem (mais recente primeiro)
- Persistência automática com `localStorage`
- Design responsivo (desktop e celular)
- Visual moderno com tema escuro

## 🚀 Como usar

1. Abra o arquivo `index.html` no navegador **ou**
2. Publique no **GitHub Pages** (veja abaixo)

### Adicionando itens
Digite o nome do item no campo à direita e clique em **+** (ou pressione Enter).

### Editando / Removendo
Use os botões ✏️ e 🗑️ ao lado de cada item.

### Girando a roleta
Clique no botão **GIRAR** no centro da roleta. É necessário ter pelo menos 2 itens.

## 📦 Publicar no GitHub Pages

1. Crie um repositório novo no GitHub (ex: `roleta-sorteio`)
2. Faça upload dos arquivos (`index.html`, `style.css`, `script.js`, `README.md`)
3. Vá em **Settings → Pages**
4. Em **Source**, escolha a branch `main` (ou `master`) e a pasta `/ (root)`
5. Salve. Em alguns minutos o site estará disponível em:
   `https://SEU-USUARIO.github.io/roleta-sorteio/`

> Dica: marque o repositório como **Public** para que qualquer pessoa possa usar e forkar.

## 🎨 Sugestões de melhorias estéticas / futuras

Aqui vão ideias que podem deixar o projeto ainda mais interessante:

| Ideia | Descrição |
|-------|-----------|
| **Sons** | Efeito sonoro de giro + “ta-dá” no resultado (com botão de mute) |
| **Confetti** | Explosão de confete quando sai o vencedor |
| **Temas** | Alternar entre tema escuro / claro / colorido |
| **Pesos** | Permitir que alguns itens tenham mais chance (peso) |
| **Exportar / Importar** | Baixar a lista de itens como `.txt` ou `.json` |
| **Modo “remover após sorteio”** | Opção para tirar o item da roleta depois de sorteado |
| **Compartilhar resultado** | Botão para copiar o resultado + histórico |
| **Múltiplas roletas** | Salvar diferentes listas (ex: “Almoço”, “Prêmios”) |
| **Ponteiro animado** | Pequeno “balanço” do ponteiro durante o giro |
| **Cores personalizadas** | Escolher a cor de cada segmento |

## 🛠 Tecnologias

- HTML5
- CSS3 (variáveis, Grid, animações)
- JavaScript puro (Canvas API + localStorage)
- Sem dependências externas

## 📄 Licença

MIT — use livremente, modifique e compartilhe.

---

Feito para ser simples, útil e bonito.
