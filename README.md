# Partitassos

PWA para buscar e organizar partituras de violão. Feito para instalar num tablet Android.

## Estrutura
- `index.html`, `css/`, `js/` — front-end (vanilla JS, sem build, sem backend).
- Biblioteca pessoal fica salva no IndexedDB do navegador (offline).

## Como funciona a busca
Google e Bing bloqueiam busca automática feita por servidor (retornam resultados genéricos de propósito, como defesa anti-robô), então o app não faz scraping. Em vez disso:

1. Você digita o nome da música e toca em **"Abrir no MuseScore"** ou **"Abrir no Google Imagens"** — abre uma aba nova já com a busca pronta.
2. Encontrou a partitura? Segura o dedo na imagem → **"Baixar imagem"** (ela vai pra galeria do tablet, como qualquer imagem da internet).
3. Volta no Partitassos e toca em **"Adicionar da Galeria"** → escolhe a imagem baixada → preenche pasta/status → Salvar.

## Publicar (deploy)
O jeito mais simples é o [Vercel](https://vercel.com) (plano grátis):

```bash
npm i -g vercel
vercel --prod
```

Não precisa configurar nada (sem variáveis de ambiente, sem chave de API).

## Instalar no tablet do seu pai
1. Abra a URL publicada no Chrome do tablet.
2. Menu (⋮) → "Instalar app" ou "Adicionar à tela inicial".
3. O ícone do Partitassos aparece na tela como um app normal.

## Testando localmente
Service workers exigem `http://` (não funcionam abrindo o arquivo direto). Use qualquer servidor estático, por exemplo:

```bash
npx serve .
```

e abra `http://localhost:3000`.

## Uso
- **Buscar**: digite o nome da música (e opcionalmente o artista), ou use o botão 🎤. Abra o MuseScore ou o Google Imagens, baixe a imagem da partitura escolhida e depois use "Adicionar da Galeria".
- **Minhas Partituras**: busca por texto, filtro por pasta. Toque para abrir em tela cheia; toque e segure para favoritar/apagar.
- **Visualizador**: pinça para zoom, 🌙 alterna fundo claro/escuro, ▶️ ativa rolagem automática (modo teleprompter) com controle de velocidade.
