# Meu Treino — PWA

Aplicativo mobile para a ficha de treinos A/B/C.

## Como rodar
1. Coloque estes arquivos em um servidor HTTPS (Netlify, Vercel, GitHub Pages etc.).
2. Abra o endereço no Android.
3. No Chrome, use "Adicionar à tela inicial"/"Instalar app".

## Desenvolvimento local
Com Python:
python -m http.server 8080

Depois abra:
http://localhost:8080

Observação: o Service Worker/PWA funciona plenamente em HTTPS ou localhost.

## Dados
Os treinos e registros são salvos localmente no navegador. A tela Configurações permite exportar/importar um backup JSON.
