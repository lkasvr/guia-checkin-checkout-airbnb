# Miniatura do vídeo achada por convenção de nome

Cada vídeo enviado ao Blob ganha uma Miniatura gravada no mesmo endereço, trocando a extensão por `.jpg` (`tour-AbC123.mp4` → `tour-AbC123.jpg`), e o guia deduz o endereço da miniatura a partir do endereço do vídeo, sem campo nos dados. Preferimos isso a um campo `poster` ao lado de cada vídeo porque o mesmo endereço de vídeo é copiado por vários caminhos (vídeo do cartão de check-in reaproveitado entre apartamentos, tour herdado do prédio, biblioteca de equipamentos), e um campo teria de ser propagado em cada um; pela convenção, a miniatura acompanha o vídeo sozinha.

## Consequences

- Se a miniatura não existir, o guia pede o `.jpg`, recebe 404 e mostra o player sem imagem.
- Quem copiar, renomear ou mover um vídeo no Blob precisa levar o `.jpg` junto.
- Um `poster` explícito nos dados, quando houver (vídeos estáticos em `/media`), tem precedência sobre o deduzido.
