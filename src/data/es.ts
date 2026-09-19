/**
 * Espanhol dos textos que o sistema mesmo escreve (padrões dos formulários e
 * modelos) e do conteúdo do 1305C / Residencial DF Plaza. Chave = texto em
 * português exatamente como está gravado; valor = espanhol.
 *
 * O texto que o anfitrião digita nos formulários só existe em português
 * (o inglês é uma cópia do português), então só ganha espanhol se cair aqui
 * ou se vier com `es` no próprio conteúdo. Fora disso o guia mostra o inglês.
 */

const CHAT =
  '<a class="chatlink" href="https://www.airbnb.com/guest/messages" target="_blank" rel="noopener">chat</a>';

const ES: Record<string, string> = {
  // ── Padrões do sistema ─────────────────────────────────────────────────
  "Guia de boas-vindas": "Guía de bienvenida",
  "Check-in": "Check-in",
  "Wi-Fi": "Wi-Fi",
  "Regras": "Reglas",
  "Contatos": "Contactos",
  "A Casa": "La Casa",
  "Lazer": "Ocio",
  "Brasília": "Brasilia",
  "Onde Comer": "Dónde comer",
  "Instruções de chegada.": "Instrucciones de llegada.",
  "Antes de sair.": "Antes de salir.",
  "Regras da casa.": "Reglas de la casa.",
  "Contatos.": "Contactos.",
  "Garagem": "Garaje",
  "Capacidade máxima": "Capacidad máxima",
  "Proibido fumar": "Prohibido fumar",
  "Em todo o apartamento.": "En todo el apartamento.",
  "Fumo permitido": "Se permite fumar",
  "Não são permitidos animais": "No se permiten mascotas",
  "Animais são bem-vindos": "Las mascotas son bienvenidas",
  "Anfitrião · WhatsApp": "Anfitrión · WhatsApp",
  "Anfitriã · WhatsApp": "Anfitriona · WhatsApp",
  "Coanfitrião/gestor · WhatsApp": "Coanfitrión/gestor · WhatsApp",
  "Emergência médica": "Emergencia médica",
  "Incêndio e resgate": "Incendio y rescate",
  "Boa estadia!": "¡Buena estadía!",
  "Com carinho, ": "Con cariño, ",

  // ── Cartão "Antes de chegar" ───────────────────────────────────────────
  "Antes de chegar": "Antes de llegar",
  "Pré-requisito": "Requisito previo",
  "Para agilizar a liberação do seu acesso na portaria, envie ao anfitrião, com antecedência, uma foto do documento de identidade (RG ou CNH) de cada hóspede que vai ficar no apartamento. Se alguém do grupo vier de carro, inclua também modelo, marca, cor e placa do veículo.":
    "Para agilizar la autorización de tu acceso en la recepción, envía al anfitrión, con anticipación, una foto del documento de identidad (pasaporte o documento nacional) de cada huésped que se alojará en el apartamento. Si alguien del grupo llega en auto, incluye también modelo, marca, color y placa del vehículo.",

  // ── 1305C · hero e navegação ───────────────────────────────────────────
  '<strong>Residencial DF Plaza</strong> · Águas Claras, Brasília. Aqui está tudo sobre a chegada, o Wi-Fi e o dia a dia no apartamento.':
    "<strong>Residencial DF Plaza</strong> · Águas Claras, Brasilia. Aquí encontrarás todo sobre la llegada, el Wi-Fi y el día a día en el apartamento.",
  "Torre C": "Torre C",
  "13º andar": "Piso 13",
  "Portaria": "Recepción",
  "ao lado do Spoleto": "junto al Spoleto",
  "Vaga 269": "Plaza 269",
  "Subsolo −3": "Subsuelo −3",
  "600 Mega · ideal para streaming e home office": "600 Mega · ideal para streaming y home office",

  // ── Check-in ───────────────────────────────────────────────────────────
  "Da portaria até a porta do apartamento.": "Desde la recepción hasta la puerta del apartamento.",
  "Entrando no prédio": "Entrando al edificio",
  '<strong>De Uber/táxi?</strong> Desça no DF Plaza Shopping, entrada do restaurante <strong>Coco Bambu (2º piso)</strong>.<span class="hint">Essa entrada fica a poucos metros da portaria da Torre C.</span>':
    '<strong>¿En Uber/taxi?</strong> Bájate en el DF Plaza Shopping, en la entrada del restaurante <strong>Coco Bambu (2.º piso)</strong>.<span class="hint">Esa entrada está a pocos metros de la recepción de la Torre C.</span>',
  [`Vá à <strong>portaria 24h da Torre C</strong>, ao lado do restaurante <strong>Spoleto</strong>, e apresente seu <strong>documento</strong> (o mesmo enviado pelo ${CHAT}).`]:
    `Ve a la <strong>recepción 24 h de la Torre C</strong>, junto al restaurante <strong>Spoleto</strong>, y presenta tu <strong>documento</strong> (el mismo que enviaste por el ${CHAT}).`,
  "Suba ao <strong>13º andar</strong>, apartamento <strong>1305C</strong>.":
    "Sube al <strong>piso 13</strong>, apartamento <strong>1305C</strong>.",
  [`Digite na fechadura eletrônica a <strong>senha enviada pelo ${CHAT}</strong>. Pronto, pode entrar.`]:
    `Ingresa en la cerradura electrónica el <strong>código enviado por el ${CHAT}</strong>. Listo, ya puedes entrar.`,
  "Chegou de carro?": "¿Llegas en auto?",
  'Estacione primeiro no <strong>Carrefour</strong> para descarregar as malas.<span class="hint">Grátis por 30 min, ou com compra acima de R$ 50.</span>':
    'Estaciona primero en el <strong>Carrefour</strong> para descargar las maletas.<span class="hint">Gratis por 30 min, o con una compra superior a R$ 50.</span>',
  "Suba ao apartamento e pegue o <strong>Cartão Branco</strong> de acesso, deixado na sala de estar.":
    "Sube al apartamento y toma la <strong>Tarjeta Blanca</strong> de acceso, que está en la sala de estar.",
  "Retire o carro e use o cartão na entrada do estacionamento residencial: <strong>Subsolo −3, vaga nº 269</strong>.":
    "Saca el auto y usa la tarjeta en la entrada del estacionamiento residencial: <strong>Subsuelo −3, plaza n.º 269</strong>.",
  "<strong>Anote:</strong> o GPS oscila no subsolo. Subsolo −3, vaga 269, próxima ao elevador da torre.":
    "<strong>Anótalo:</strong> el GPS falla en el subsuelo. Subsuelo −3, plaza 269, cerca del ascensor de la torre.",
  "<strong>Não esqueça o Cartão Branco</strong> antes de descer para guardar o carro. Perda ou não devolução: taxa de <strong>R$ 300</strong>.":
    "<strong>No olvides la Tarjeta Blanca</strong> antes de bajar a guardar el auto. Pérdida o no devolución: cargo de <strong>R$ 300</strong>.",
  "▶ Tutorial em vídeo · como chegar e estacionar": "▶ Tutorial en video · cómo llegar y estacionar",

  // ── Saída ──────────────────────────────────────────────────────────────
  "Alguns passos rápidos antes de você sair. Boa viagem!": "Unos pasos rápidos antes de irte. ¡Buen viaje!",
  "O <strong>horário limite de saída é 11h</strong>. Precisa de late checkout? Fale com a anfitriã.":
    "La <strong>hora límite de salida es a las 11 h</strong>. ¿Necesitas late check-out? Habla con la anfitriona.",
  "Deixe o <strong>Cartão Branco</strong> de garagem sobre a mesa de jantar (a não devolução gera taxa de R$ 300).":
    "Deja la <strong>Tarjeta Blanca</strong> del garaje sobre la mesa del comedor (la no devolución genera un cargo de R$ 300).",
  "Ensaque o lixo e deixe na lixeira comum do corredor, perto dos elevadores.":
    "Pon la basura en una bolsa y déjala en el contenedor común del pasillo, cerca de los ascensores.",
  "Feche as janelas, desligue o ar-condicionado e confira se não esqueceu nada. É só fechar a porta ao sair.":
    "Cierra las ventanas, apaga el aire acondicionado y revisa que no olvides nada. Solo cierra la puerta al salir.",
  "Boa estadia. Qualquer coisa, é só chamar a gente.": "Que disfrutes tu estadía. Para lo que necesites, solo escríbenos.",

  // ── Regras ─────────────────────────────────────────────────────────────
  "Combinações simples para a boa convivência no prédio.": "Acuerdos sencillos para la buena convivencia en el edificio.",
  "Em todo o apartamento, inclusive na varanda.": "En todo el apartamento, incluida la terraza.",
  "Uso da varanda": "Uso de la terraza",
  "É terminantemente proibido estender roupas, toalhas ou objetos na sacada. O descumprimento gera multa de um salário mínimo aplicada pelo condomínio.":
    "Está terminantemente prohibido tender ropa, toallas u objetos en la terraza. El incumplimiento genera una multa de un salario mínimo aplicada por el condominio.",
  "Lei do silêncio · 22h às 08h": "Horario de silencio · 22 h a 8 h",
  "Respeite o sossego dos vizinhos.": "Respeta la tranquilidad de los vecinos.",
  "Lixo ensacado": "Basura en bolsa",
  "Deposite na lixeira comum do corredor, perto dos elevadores.": "Déjala en el contenedor común del pasillo, cerca de los ascensores.",
  "Passe roupa só na tábua": "Plancha solo en la tabla",
  "Nunca sobre a cama ou os móveis.": "Nunca sobre la cama ni los muebles.",
  "Somente hóspedes registrados": "Solo huéspedes registrados",
  "Sobre convidados, consulte a anfitriã antes.": "Si quieres recibir visitas, consulta antes con la anfitriona.",
  "Cartão de garagem · R$ 300": "Tarjeta de garaje · R$ 300",
  "Taxa em caso de perda ou não devolução.": "Cargo en caso de pérdida o no devolución.",

  // ── Contatos ───────────────────────────────────────────────────────────
  "Toque em um número para ligar.": "Toca un número para llamar.",
  "Interfone <b>*2</b> ou telefone": "Interfono <b>*2</b> o teléfono",

  // ── A Casa ─────────────────────────────────────────────────────────────
  "O que tem no apartamento e como usar.": "Lo que hay en el apartamento y cómo usarlo.",
  "Quarto premium": "Habitación premium",
  "Cama de casal com enxoval novo, cortina blackout dupla e ar-condicionado.":
    "Cama doble con ropa de cama nueva, cortina blackout doble y aire acondicionado.",
  "Cozinha equipada": "Cocina equipada",
  "Fogão de indução, micro-ondas, panelas, cafeteira elétrica e sanduicheira Oster.":
    "Cocina de inducción, microondas, ollas, cafetera eléctrica y sandwichera Oster.",
  "Lazer & home office": "Ocio y home office",
  'Smart TV 65" com os streamings liberados e mesa de trabalho.':
    'Smart TV de 65" con los servicios de streaming incluidos y escritorio de trabajo.',
  "Fogão de indução": "Cocina de inducción",
  "Pressione <strong>Power</strong> no painel touch.": "Presiona <strong>Power</strong> en el panel táctil.",
  "Use as <strong>panelas da casa</strong> (fundo magnético) sobre a boca. O fogão só ativa com o peso e o material corretos.":
    "Usa las <strong>ollas de la casa</strong> (fondo magnético) sobre la hornalla. La cocina solo se activa con el peso y el material correctos.",
  'Ajuste a potência com <strong>+ / −</strong> (0 a 9).<span class="hint">⚠️ O nível 9 é extremamente rápido.</span>':
    'Ajusta la potencia con <strong>+ / −</strong> (0 a 9).<span class="hint">⚠️ El nivel 9 calienta extremadamente rápido.</span>',
  "Se quiser, programe o <strong>timer</strong> no ícone de relógio.":
    "Si quieres, programa el <strong>temporizador</strong> en el ícono del reloj.",
  "Cafeteira elétrica": "Cafetera eléctrica",
  "Abra a tampa superior e adicione <strong>água filtrada</strong> no reservatório traseiro, sem passar do nível máximo.":
    "Abre la tapa superior y agrega <strong>agua filtrada</strong> en el depósito trasero, sin pasar el nivel máximo.",
  "Coloque o <strong>pó de café</strong> no filtro plástico lavável do suporte superior.":
    "Coloca el <strong>café molido</strong> en el filtro de plástico lavable del soporte superior.",
  "Centralize a <strong>jarra de inox</strong> na base de aquecimento.":
    "Centra la <strong>jarra de acero inoxidable</strong> sobre la base de calentamiento.",
  'Ligue na tomada <strong>(220V!)</strong> e pressione o botão lateral em <strong>“I”</strong>. A luz acende e o café começa a passar.':
    'Conéctala al enchufe <strong>(¡220 V!)</strong> y presiona el botón lateral en <strong>“I”</strong>. La luz se enciende y el café comienza a pasar.',
  "Tampa do reservatório": "Tapa del depósito",
  "Filtro lavável": "Filtro lavable",
  "Suporte do filtro": "Soporte del filtro",
  "Corta-pingo": "Corta gotas",
  "Reservatório de água": "Depósito de agua",
  "Marcador de nível": "Indicador de nivel",
  "Jarra": "Jarra",
  "Base de aquecimento": "Base de calentamiento",
  "Botão liga/desliga": "Botón de encendido/apagado",
  "Cabo de força": "Cable de alimentación",

  // ── Lazer ──────────────────────────────────────────────────────────────
  "Tudo no <strong>Andar M (Mezanino)</strong>, é só descer de elevador.":
    "Todo en el <strong>Piso M (Mezanine)</strong>, solo baja en el ascensor.",
  "Piscina infinita · 25 m": "Piscina infinita · 25 m",
  "Traje de banho obrigatório. Fechada para limpeza às segundas e terças pela manhã. Crianças sempre acompanhadas.":
    "Traje de baño obligatorio. Cerrada por limpieza los lunes y martes por la mañana. Los niños siempre acompañados.",
  "Academia": "Gimnasio",
  "Acesso pela digital cadastrada no check-in. Use calçado fechado.":
    "Acceso con la huella digital registrada en el check-in. Usa calzado cerrado.",
  "Home Cinema": "Home Cinema",
  "Agende com a anfitriã ou portaria com 48h de antecedência.":
    "Reserva con la anfitriona o la recepción con 48 h de anticipación.",
  "Lavanderia": "Lavandería",
  "Máquinas industriais. Funciona com fichas vendidas no local.":
    "Máquinas industriales. Funcionan con fichas que se venden en el lugar.",
  "Sala de jogos": "Sala de juegos",
  "Sinuca e jogos de mesa, uso rotativo e compartilhado.": "Billar y juegos de mesa, de uso rotativo y compartido.",
  "Espaço Mulher": "Espacio Mujer",
  "Área de autocuidado e beleza.": "Área de autocuidado y belleza.",
  "Coworking": "Coworking",
  "Silencioso e climatizado, ideal para home office e estudos.":
    "Silencioso y climatizado, ideal para home office y estudio.",

  // ── Guia de Brasília ───────────────────────────────────────────────────
  "Quatro paradas que valem o deslocamento.": "Cuatro paradas que valen el desplazamiento.",
  "Projeto de Oscar Niemeyer, com os vitrais de Marianne Peretti. O fim de tarde é a melhor hora para fotos.":
    "Proyecto de Oscar Niemeyer, con los vitrales de Marianne Peretti. El atardecer es la mejor hora para fotos.",
  "Na mesma praça ficam o Panteão da Pátria e o mastro da maior bandeira hasteada do mundo.":
    "En la misma plaza están el Panteón de la Patria y el mástil de la bandera izada más grande del mundo.",
  "Visita guiada de cerca de 50 minutos pelo Salão Verde, plenários e exposições. Os dias e horários mudam conforme a agenda legislativa, então confirme e reserve no site oficial.":
    "Visita guiada de unos 50 minutos por el Salón Verde, los plenarios y las exposiciones. Los días y horarios cambian según la agenda legislativa, así que confirma y reserva en el sitio oficial.",
  "Restaurantes, quiosques e um calçadão na beira do Lago Paranoá. O pôr do sol ali é o programa.":
    "Restaurantes, quioscos y un paseo a orillas del Lago Paranoá. El atardecer allí es el plan.",

  // ── Onde Comer ─────────────────────────────────────────────────────────
  "O shopping tem várias opções. Saindo dele, estas são as nossas preferidas.":
    "El shopping tiene varias opciones. Saliendo de él, estas son nuestras preferidas.",
  "Mexicano e tex-mex, com porções fartas para dividir.": "Mexicano y tex-mex, con porciones abundantes para compartir.",
  "Japonês com rodízio na esteira e também à la carte.": "Japonés con rodízio en cinta y también a la carta.",
  "Cozinha nordestina e carne de sol, com grelhados para dividir.":
    "Cocina nordestina y carne de sol, con parrilladas para compartir.",
};

/** Espanhol de um texto em português, se conhecido (`undefined` = usar o inglês). */
export function translateEs(pt: string): string | undefined {
  const hit = ES[pt];
  if (hit !== undefined) return hit;
  // "4 hóspedes" (gerado pelo formulário do apartamento).
  const guests = /^(\d+) hóspedes$/.exec(pt);
  if (guests) return `${guests[1]} huéspedes`;
  return undefined;
}
