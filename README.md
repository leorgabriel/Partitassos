# Partitassos

PWA para buscar e organizar partituras de violão. Feito para instalar num tablet Android.

## Estrutura
- `index.html`, `css/`, `js/` — front-end (vanilla JS, sem build).
- `api/search.js` — função serverless que busca no Google Imagens via [SerpApi](https://serpapi.com) (plano free: 250 buscas/mês).
- `api/usage.js` — consulta quantas buscas já foram usadas no mês, pro contador no app.
- `api/image.js` — proxy que baixa a imagem no servidor (evita bloqueio de CORS ao salvar na biblioteca).
- Biblioteca pessoal fica salva no IndexedDB do navegador (offline).

## Como funciona a busca
Google e Bing bloqueiam busca automática feita diretamente por um servidor (retornam resultados genéricos de propósito, como defesa anti-robô). Por isso a busca usa a **SerpApi**, um serviço que faz isso de forma autorizada. O plano gratuito tem 250 buscas/mês — o app mostra um contador ("Buscas usadas este mês: X/250") e desativa o botão de busca automaticamente se o limite for atingido.

Se preferir não gastar da cota (ou já tiver estourado o limite do mês), dá pra usar os botões **"Abrir no MuseScore"** / **"Abrir no Google Imagens"**: abrem a busca numa aba nova pra você escolher manualmente, baixar a imagem (segurar o dedo → "Baixar imagem") e depois usar **"Adicionar da Galeria"** pra trazer ela pro app — sem gastar nenhuma busca da API.

## Publicar (deploy)
O jeito mais simples é o [Vercel](https://vercel.com) (plano grátis):

```bash
npm i -g vercel
vercel --prod
```

Configure a variável de ambiente do projeto:
- `SERPAPI_KEY` = sua chave da [SerpApi](https://serpapi.com/manage-api-key)

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
- **Buscar**: digite o nome da música (e opcionalmente o artista), ou use o botão 🎤, e toque em "Buscar" — aparece uma grade de miniaturas, toque numa pra salvar. Se preferir, use "Abrir no MuseScore"/"Abrir no Google Imagens" + "Adicionar da Galeria" (não gasta cota da API).
- **Minhas Partituras**: busca por texto, filtro por pasta. Toque para abrir em tela cheia; toque e segure para favoritar/apagar.
- **Visualizador**: pinça para zoom, 🌙 alterna fundo claro/escuro, ▶️ ativa rolagem automática (modo teleprompter) com controle de velocidade.
