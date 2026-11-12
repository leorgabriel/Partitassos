# Partitassos

PWA para buscar e organizar partituras de violão. Feito para instalar num tablet Android.

## Estrutura
- `index.html`, `css/`, `js/` — front-end (vanilla JS, sem build).
- `api/search.js` — função serverless que consulta o Google Custom Search (imagens) e o MuseScore, junta e remove duplicados.
- `api/image.js` — proxy que baixa a imagem no servidor (evita bloqueio de CORS ao salvar na biblioteca).
- Biblioteca pessoal fica salva no IndexedDB do navegador (offline, sem backend).

## 1. Configurar o Google Custom Search (gratuito até 100 buscas/dia)
1. Crie uma chave de API em https://console.cloud.google.com/apis/credentials (ative "Custom Search API").
2. Crie um mecanismo de busca em https://cse.google.com/cse/all — ative "Buscar em toda a web" e "Busca de imagens".
3. Anote a **API key** e o **Search engine ID (cx)**.

## 2. Publicar (deploy)
O jeito mais simples é o [Vercel](https://vercel.com) (plano grátis), porque já roda `api/*.js` como função serverless automaticamente.

```bash
npm i -g vercel
vercel
```

Na Vercel, configure as variáveis de ambiente do projeto:
- `GOOGLE_CSE_KEY` = sua API key
- `GOOGLE_CSE_CX` = seu search engine ID

Depois do deploy, você terá uma URL como `https://partitassos.vercel.app`.

## 3. Ligar o app à função de busca
Abra `js/search.js` e defina:

```js
const SEARCH_API_URL = 'https://partitassos.vercel.app/api/search';
```

Publique de novo (`vercel --prod`).

## 4. Instalar no tablet do seu pai
1. Abra a URL publicada no Chrome do tablet.
2. Menu (⋮) → "Instalar app" ou "Adicionar à tela inicial".
3. O ícone do Partitassos aparece na tela como um app normal.

## Testando localmente antes do deploy
Service workers exigem `http://` (não funcionam abrindo o arquivo direto). Use qualquer servidor estático, por exemplo:

```bash
npx serve .
```

e abra `http://localhost:3000`. Sem a `SEARCH_API_URL` configurada, a aba Buscar mostra um aviso — a Biblioteca e o Visualizador já funcionam normalmente.

## Uso
- **Buscar**: digite o nome da música (e opcionalmente o artista), ou use o botão 🎤. Toque numa miniatura para salvar na biblioteca (define pasta/tag e status).
- **Minhas Partituras**: busca por texto, filtro por pasta. Toque para abrir em tela cheia; toque e segure para favoritar/apagar.
- **Visualizador**: pinça para zoom, 🌙 alterna fundo claro/escuro, ▶️ ativa rolagem automática (modo teleprompter) com controle de velocidade.
