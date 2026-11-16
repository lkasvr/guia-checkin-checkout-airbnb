# Guia de check-in e check-out

Guias digitais que o anfitrião entrega ao hóspede de um apartamento de temporada: como chegar, as regras, a casa e a saída.

## Language

### Mídia do guia

**Capa**:
A foto no topo do guia, a primeira coisa que o hóspede vê. Sempre foto, nunca vídeo.
_Avoid_: hero, banner

**Tour**:
O vídeo de apresentação do apartamento, primeiro elemento de A Casa. É do apartamento ou, na falta dele, do prédio.
_Avoid_: vídeo de apresentação, home video

**Equipamento**:
Um item de A Casa que explica um aparelho ou recurso do apartamento, com passos e uma foto ou um vídeo opcional.
_Avoid_: acordeão, item da casa

**Cartão de check-in**:
Uma etapa da chegada do hóspede (portaria, estacionamento, fechadura...), com passos, alertas e um vídeo opcional.

**Vídeo do cartão de check-in**:
O vídeo opcional de um cartão de check-in, reaproveitável entre apartamentos do mesmo anfitrião. O texto padrão o apresenta como tutorial de como chegar e estacionar.
_Avoid_: vídeo do estacionamento (é só o uso mais comum)

**Miniatura**:
A imagem parada que ocupa o lugar de um vídeo até o hóspede apertar o play.
_Avoid_: poster, thumbnail, capa

### Apartamento no prédio

**Unidade**:
O que identifica o apartamento dentro do prédio ("2202", "1305C", "A2"), sem o "Ap" na frente: o guia já escreve "Apartamento" ou "Ap" antes dela.
_Avoid_: número do apartamento, apto

**Marcador**:
Um trecho entre chaves duplas no texto que o prédio dá a todos os seus apartamentos, como `{{UNIDADE}}` ou `{{ANDAR}}`, que o guia troca pelo valor de cada apartamento.
_Avoid_: placeholder, token

**Ajuste**:
Uma mudança que um apartamento faz num item do conteúdo herdado do prédio: o item editado, removido ou acrescentado. O que não tem ajuste segue o prédio ao vivo.
_Avoid_: patch, override

**Modo antigo**:
Um apartamento com prédio e sem ajustes: cada seção segue o prédio inteira ou é inteira do apartamento, e o check-in e o check-out ficam guardados como cópia, com os marcadores já preenchidos. Ao ser salvo pela edição, passa ao modo atual e guarda só os ajustes.
_Avoid_: modelo antigo, legado
