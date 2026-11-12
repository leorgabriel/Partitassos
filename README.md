# Partitassos

PWA para buscar e organizar partituras de violão. Feito para instalar num tablet Android.

## Estrutura
- `index.html`, `css/`, `js/` — front-end (vanilla JS, sem build).
- `api/search.js` — função serverless que consulta imagens do Bing e o MuseScore, junta e remove duplicados. Não precisa de nenhuma chave de API.
- `api/image.js` — proxy que baixa a imagem no servidor (evita bloqueio de CORS ao salvar na biblioteca).
- Biblioteca pessoal fica salva no IndexedDB do navegador (offline, sem backend).

## 1. Publicar (deploy)
O jeito mais simples é o [Vercel](https://vercel.com) (plano grátis), porque já roda `api/*.js` como função serverless automaticamente.

```bash
npm i -g vercel
vercel
```

Não é preciso configurar nenhuma variável de ambiente. Depois do deploy, você terá uma URL como `https://partitassos.vercel.app`.

## 2. Ligar o app à função de busca
Abra `js/search.js` e defina:

```js
const SEARCH_API_URL = 'https://partitassos.vercel.app/api/search';
```

Publique de novo (`vercel --prod`).

## 3. Instalar no tablet do seu pai
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
