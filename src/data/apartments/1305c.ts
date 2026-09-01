import type { Apartment } from "@/data/types";

const CHAT =
  '<a class="chatlink" href="https://www.airbnb.com/guest/messages" target="_blank" rel="noopener">chat</a>';

export const ap1305c: Apartment = {
  slug: "1305c",
  lang: { default: "pt" },
  name: { pt: "Apartamento", en: "Apartment" },
  unit: "1305C",
  eyebrow: { pt: "Guia de boas-vindas", en: "Welcome guide" },
  building: "Residencial DF Plaza",

  hero: {
    img: "/media/hero.webp",
    sub: {
      pt: "<strong>Residencial DF Plaza</strong> · Águas Claras, Brasília. Aqui está tudo sobre a chegada, o Wi-Fi e o dia a dia no apartamento.",
      en: "<strong>DF Plaza Residence</strong> · Águas Claras, Brasília. Everything about your arrival, the Wi-Fi and daily life in the apartment.",
    },
    facts: [
      { k: { pt: "Torre C", en: "Tower C" }, v: { pt: "13º andar", en: "13th floor" } },
      { k: { pt: "Portaria", en: "Lobby" }, v: { pt: "ao lado do Spoleto", en: "next to Spoleto" } },
      { k: { pt: "Vaga 269", en: "Spot 269" }, v: { pt: "Subsolo −3", en: "Level −3" } },
    ],
  },

  nav: [
    { href: "#checkin", label: { pt: "Check-in", en: "Check-in" } },
    { href: "#wifi", label: { pt: "Wi-Fi", en: "Wi-Fi" } },
    { href: "#regras", label: { pt: "Regras", en: "Rules" } },
    { href: "#contatos", label: { pt: "Contatos", en: "Contacts" } },
    { href: "#casa", label: { pt: "A Casa", en: "The Home" } },
    { href: "#lazer", label: { pt: "Lazer", en: "Amenities" } },
    { href: "#turismo", label: { pt: "Brasília", en: "Brasília" } },
    { href: "#comer", label: { pt: "Onde Comer", en: "Dining" } },
  ],

  wifi: {
    network: "Camon Ap 1305",
    password: "Luanna1214@",
    speed: {
      pt: "600 Mega · ideal para streaming e home office",
      en: "600 Mbps · great for streaming and remote work",
    },
  },

  checkin: {
    sub: {
      pt: "Da portaria até a porta do apartamento.",
      en: "From the lobby to your apartment door.",
    },
    cards: [
      {
        title: { pt: "Entrando no prédio", en: "Entering the building" },
        steps: [
          {
            n: "1",
            body: {
              pt: '<strong>De Uber/táxi?</strong> Desça no DF Plaza Shopping, entrada do restaurante <strong>Coco Bambu (2º piso)</strong>.<span class="hint">Essa entrada fica a poucos metros da portaria da Torre C.</span>',
              en: '<strong>By Uber/taxi?</strong> Get off at DF Plaza Shopping, at the <strong>Coco Bambu restaurant entrance (2nd floor)</strong>.<span class="hint">This entrance is just a few meters from the Tower C lobby.</span>',
            },
          },
          {
            n: "2",
            body: {
              pt: `Vá à <strong>portaria 24h da Torre C</strong>, ao lado do restaurante <strong>Spoleto</strong>, e apresente seu <strong>documento</strong> (o mesmo enviado pelo ${CHAT}).`,
              en: `Go to the <strong>24h Tower C lobby</strong>, next to the <strong>Spoleto</strong> restaurant, and show your <strong>ID</strong> (the same one sent via ${CHAT}).`,
            },
          },
          {
            n: "3",
            body: {
              pt: "Suba ao <strong>13º andar</strong>, apartamento <strong>1305C</strong>.",
              en: "Go up to the <strong>13th floor</strong>, apartment <strong>1305C</strong>.",
            },
          },
          {
            n: "4",
            body: {
              pt: `Digite na fechadura eletrônica a <strong>senha enviada pelo ${CHAT}</strong>. Pronto, pode entrar.`,
              en: `Enter the <strong>code sent via ${CHAT}</strong> on the electronic lock. That's it, you're in.`,
            },
          },
        ],
      },
      {
        title: { pt: "Chegou de carro?", en: "Arriving by car?" },
        tag: { pt: "Vaga 269", en: "Spot 269" },
        banner: "/media/predio.webp",
        steps: [
          {
            n: "1",
            body: {
              pt: 'Estacione primeiro no <strong>Carrefour</strong> para descarregar as malas.<span class="hint">Grátis por 30 min, ou com compra acima de R$ 50.</span>',
              en: 'Park first at the <strong>Carrefour</strong> lot to unload your luggage.<span class="hint">Free for 30 min, or with a purchase over R$ 50.</span>',
            },
          },
          {
            n: "2",
            body: {
              pt: "Suba ao apartamento e pegue o <strong>Cartão Branco</strong> de acesso, deixado na sala de estar.",
              en: "Go up to the apartment and grab the <strong>White Card</strong> left in the living room.",
            },
          },
          {
            n: "3",
            body: {
              pt: "Retire o carro e use o cartão na entrada do estacionamento residencial: <strong>Subsolo −3, vaga nº 269</strong>.",
              en: "Drive to the residential parking entrance and use the card: <strong>Level −3, spot 269</strong>.",
            },
          },
        ],
        alerts: [
          {
            icon: "📍",
            body: {
              pt: "<strong>Anote:</strong> o GPS oscila no subsolo. Subsolo −3, vaga 269, próxima ao elevador da torre.",
              en: "<strong>Write it down:</strong> GPS is unreliable underground. Level −3, spot 269, near the tower elevator.",
            },
          },
          {
            icon: "💳",
            body: {
              pt: "<strong>Não esqueça o Cartão Branco</strong> antes de descer para guardar o carro. Perda ou não devolução: taxa de <strong>R$ 300</strong>.",
              en: "<strong>Don't forget the White Card</strong> before going down to park. Loss or non-return: <strong>R$ 300</strong> fee.",
            },
          },
        ],
        video: {
          src: "/media/como-estacionar.mp4",
          poster: "/media/como-estacionar-poster.jpg",
          label: {
            pt: "▶ Tutorial em vídeo · como chegar e estacionar",
            en: "▶ Video tutorial · arriving & parking",
          },
        },
      },
    ],
  },

  checkout: {
    sub: {
      pt: "Alguns passos rápidos antes de você sair. Boa viagem!",
      en: "A few quick steps before you go. Safe travels!",
    },
    steps: [
      {
        n: "1",
        body: {
          pt: "O <strong>horário limite de saída é 11h</strong>. Precisa de late checkout? Fale com a anfitriã.",
          en: "<strong>Check-out is until 11am</strong>. Need a late checkout? Message the host.",
        },
      },
      {
        n: "2",
        body: {
          pt: "Deixe o <strong>Cartão Branco</strong> de garagem sobre a mesa de jantar (a não devolução gera taxa de R$ 300).",
          en: "Leave the <strong>White garage Card</strong> on the dining table (non-return incurs a R$ 300 fee).",
        },
      },
      {
        n: "3",
        body: {
          pt: "Ensaque o lixo e deixe na lixeira comum do corredor, perto dos elevadores.",
          en: "Bag the trash and drop it in the shared hallway bin, near the elevators.",
        },
      },
      {
        n: "4",
        body: {
          pt: "Feche as janelas, desligue o ar-condicionado e confira se não esqueceu nada. É só fechar a porta ao sair.",
          en: "Close the windows, turn off the A/C and double-check for forgotten items. Just shut the door on your way out.",
        },
      },
    ],
  },

  // As regras gerais do prédio (varanda, silêncio, lixo, garagem...) saíram
  // daqui — vêm agora do `Building` ("Residencial DF Plaza", ver
  // prisma/seed.ts), somadas na hora de montar o guia
  // (`overlayBuildingLiveContent`). Só fica a regra específica desta unidade.
  rules: {
    sub: {
      pt: "Combinações simples para a boa convivência no prédio.",
      en: "Simple ground rules for getting along in the building.",
    },
    items: [
      {
        icon: "🚭",
        hot: true,
        title: { pt: "Proibido fumar", en: "No smoking" },
        text: {
          pt: "Em todo o apartamento, inclusive na varanda.",
          en: "Anywhere in the apartment, including the balcony.",
        },
      },
    ],
  },

  contacts: {
    sub: { pt: "Toque em um número para ligar.", en: "Tap a number to call." },
    items: [
      {
        icon: "💬",
        name: "Anna Júlia P. Oliveira",
        role: { pt: "Anfitriã · WhatsApp", en: "Host · WhatsApp" },
        phone: "(61) 98250-0188",
        tel: "+5561982500188",
      },
      {
        icon: "💬",
        name: "Anna Júlia · 2",
        role: { pt: "Anfitriã · WhatsApp", en: "Host · WhatsApp" },
        phone: "(61) 98608-5715",
        tel: "+5561986085715",
      },
      {
        icon: "🛎️",
        name: "",
        role: { pt: "Interfone <b>*2</b> ou telefone", en: "Intercom <b>*2</b> or phone" },
        phone: "(61) 99290-9099",
        tel: "+5561992909099",
      },
      {
        icon: "🚑",
        name: "SAMU",
        role: { pt: "Emergência médica", en: "Medical emergency" },
        phone: "192",
        tel: "192",
        sos: true,
      },
      {
        icon: "🚒",
        name: "",
        role: { pt: "Incêndio e resgate", en: "Fire and rescue" },
        phone: "193",
        tel: "193",
        sos: true,
      },
    ],
  },

  home: {
    sub: {
      pt: "O que tem no apartamento e como usar.",
      en: "What's in the apartment and how to use it.",
    },
    slides: [
      {
        img: "/media/cama.webp",
        title: { pt: "Quarto premium", en: "Premium bedroom" },
        text: {
          pt: "Cama de casal com enxoval novo, cortina blackout dupla e ar-condicionado.",
          en: "Double bed with fresh linens, double blackout curtains and air conditioning.",
        },
      },
      {
        img: "/media/cozinha.webp",
        title: { pt: "Cozinha equipada", en: "Full kitchen" },
        text: {
          pt: "Fogão de indução, micro-ondas, panelas, cafeteira elétrica e sanduicheira Oster.",
          en: "Induction cooktop, microwave, cookware, coffee maker and an Oster sandwich press.",
        },
      },
      {
        img: "/media/sala.webp",
        title: { pt: "Lazer & home office", en: "Leisure & home office" },
        text: {
          pt: 'Smart TV 65" com os streamings liberados e mesa de trabalho.',
          en: '65" smart TV with streaming included and a work desk.',
        },
      },
    ],
    accordions: [
      {
        icon: "🍳",
        title: { pt: "Fogão de indução", en: "Induction cooktop" },
        steps: [
          {
            n: "1",
            body: {
              pt: "Pressione <strong>Power</strong> no painel touch.",
              en: "Press <strong>Power</strong> on the touch panel.",
            },
          },
          {
            n: "2",
            body: {
              pt: "Use as <strong>panelas da casa</strong> (fundo magnético) sobre a boca. O fogão só ativa com o peso e o material corretos.",
              en: "Use the <strong>apartment's pans</strong> (magnetic bottom) on the burner. It only turns on with the right weight and material.",
            },
          },
          {
            n: "3",
            body: {
              pt: 'Ajuste a potência com <strong>+ / −</strong> (0 a 9).<span class="hint">⚠️ O nível 9 é extremamente rápido.</span>',
              en: 'Adjust power with <strong>+ / −</strong> (0 to 9).<span class="hint">⚠️ Level 9 heats extremely fast.</span>',
            },
          },
          {
            n: "4",
            body: {
              pt: "Se quiser, programe o <strong>timer</strong> no ícone de relógio.",
              en: "If you like, set the <strong>timer</strong> via the clock icon.",
            },
          },
        ],
      },
      {
        icon: "☕",
        title: { pt: "Cafeteira elétrica", en: "Coffee maker" },
        steps: [
          {
            n: "1",
            body: {
              pt: "Abra a tampa superior e adicione <strong>água filtrada</strong> no reservatório traseiro, sem passar do nível máximo.",
              en: "Open the top lid and add <strong>filtered water</strong> to the rear tank, without passing the max line.",
            },
          },
          {
            n: "2",
            body: {
              pt: "Coloque o <strong>pó de café</strong> no filtro plástico lavável do suporte superior.",
              en: "Add <strong>ground coffee</strong> to the washable plastic filter in the top holder.",
            },
          },
          {
            n: "3",
            body: {
              pt: "Centralize a <strong>jarra de inox</strong> na base de aquecimento.",
              en: "Center the <strong>steel carafe</strong> on the warming base.",
            },
          },
          {
            n: "4",
            body: {
              pt: 'Ligue na tomada <strong>(220V!)</strong> e pressione o botão lateral em <strong>“I”</strong>. A luz acende e o café começa a passar.',
              en: 'Plug it in <strong>(220V!)</strong> and flip the side switch to <strong>“I”</strong>. The light turns on and brewing starts.',
            },
          },
        ],
        diagram: {
          img: "/media/cafeteira.webp",
          alt: "Diagrama das partes da cafeteira",
          legend: [
            { n: "1", label: { pt: "Tampa do reservatório", en: "Water tank lid" } },
            { n: "2", label: { pt: "Filtro lavável", en: "Washable filter" } },
            { n: "3", label: { pt: "Suporte do filtro", en: "Filter holder" } },
            { n: "4", label: { pt: "Corta-pingo", en: "Drip-stop" } },
            { n: "5", label: { pt: "Reservatório de água", en: "Water reservoir" } },
            { n: "6", label: { pt: "Marcador de nível", en: "Level indicator" } },
            { n: "7", label: { pt: "Jarra", en: "Carafe" } },
            { n: "8", label: { pt: "Base de aquecimento", en: "Warming base" } },
            { n: "9", label: { pt: "Botão liga/desliga", en: "On/Off switch" } },
            { n: "10", label: { pt: "Cabo de força", en: "Power cord" } },
          ],
        },
      },
    ],
  },

  amenities: {
    sub: {
      pt: "Tudo no <strong>Andar M (Mezanino)</strong>, é só descer de elevador.",
      en: "All on <strong>Floor M (Mezzanine)</strong>, just take the elevator down.",
    },
    items: [
      {
        img: "/media/piscina.webp",
        wide: true,
        title: { pt: "Piscina infinita · 25 m", en: "Infinity pool · 25 m" },
        text: {
          pt: "Traje de banho obrigatório. Fechada para limpeza às segundas e terças pela manhã. Crianças sempre acompanhadas.",
          en: "Proper swimwear required. Closed for cleaning Monday and Tuesday mornings. Children must be supervised.",
        },
      },
      {
        img: "/media/academia.webp",
        title: { pt: "Academia", en: "Gym" },
        text: {
          pt: "Acesso pela digital cadastrada no check-in. Use calçado fechado.",
          en: "Access via the fingerprint registered at check-in. Closed shoes required.",
        },
      },
      {
        img: "/media/cinema.webp",
        title: { pt: "Home Cinema", en: "Home Cinema" },
        text: {
          pt: "Agende com a anfitriã ou portaria com 48h de antecedência.",
          en: "Book via the host or front desk 48h in advance.",
        },
      },
      {
        img: "/media/lavanderia.webp",
        title: { pt: "Lavanderia", en: "Laundry" },
        text: {
          pt: "Máquinas industriais. Funciona com fichas vendidas no local.",
          en: "Industrial machines. Works with tokens sold on site.",
        },
      },
      {
        img: "/media/jogos.webp",
        title: { pt: "Sala de jogos", en: "Game room" },
        text: {
          pt: "Sinuca e jogos de mesa, uso rotativo e compartilhado.",
          en: "Pool table and board games, shared rotating use.",
        },
      },
      {
        img: "/media/mulher.webp",
        title: { pt: "Espaço Mulher", en: "Beauty room" },
        text: {
          pt: "Área de autocuidado e beleza.",
          en: "A dedicated self-care and beauty area.",
        },
      },
      {
        img: "/media/cowork.webp",
        title: { pt: "Coworking", en: "Coworking" },
        text: {
          pt: "Silencioso e climatizado, ideal para home office e estudos.",
          en: "Quiet and air-conditioned, ideal for remote work and studying.",
        },
      },
    ],
  },

  tourism: {
    sub: { pt: "Quatro paradas que valem o deslocamento.", en: "Four stops worth the trip." },
    items: [
      {
        img: "/media/catedral.webp",
        title: "Catedral Metropolitana",
        text: {
          pt: "Projeto de Oscar Niemeyer, com os vitrais de Marianne Peretti. O fim de tarde é a melhor hora para fotos.",
          en: "Designed by Oscar Niemeyer, with stained glass by Marianne Peretti. Late afternoon is the best time for photos.",
        },
        meta: "Arquitetura",
      },
      {
        img: "/media/candangos.webp",
        title: "Praça dos Três Poderes",
        text: {
          pt: "Na mesma praça ficam o Panteão da Pátria e o mastro da maior bandeira hasteada do mundo.",
          en: "The Pantheon of the Fatherland and the mast of the world's largest flown flag share the same square.",
        },
        meta: "Arquitetura",
      },
      {
        img: "/media/congresso.webp",
        title: "Congresso Nacional",
        text: {
          pt: "Visita guiada de cerca de 50 minutos pelo Salão Verde, plenários e exposições. Os dias e horários mudam conforme a agenda legislativa, então confirme e reserve no site oficial.",
          en: "A guided tour of about 50 minutes through the Green Hall, chambers and exhibitions. Days and times follow the legislative calendar, so check and book on the official site.",
        },
        meta: "Tour",
        site: "https://www2.congressonacional.leg.br/visite",
      },
      {
        img: "/media/pontao.webp",
        title: "Pontão do Lago Sul",
        text: {
          pt: "Restaurantes, quiosques e um calçadão na beira do Lago Paranoá. O pôr do sol ali é o programa.",
          en: "Restaurants, kiosks and a promenade on the shore of Lake Paranoá. Sunset there is the whole point.",
        },
        meta: "Natureza & lazer",
      },
    ],
  },

  dining: {
    sub: {
      pt: "O shopping tem várias opções. Saindo dele, estas são as nossas preferidas.",
      en: "The mall has plenty of options. Beyond it, these are our favorites.",
    },
    items: [
      {
        img: "/media/elpaso.webp",
        title: "El Paso",
        text: {
          pt: "Mexicano e tex-mex, com porções fartas para dividir.",
          en: "Mexican and tex-mex, with generous plates to share.",
        },
        meta: "404 Sul · 110 Norte · Terraço Shopping",
        site: "https://elpaso.com.br/",
        maps: "El Paso Cocina Mexicana, Terraço Shopping, Brasília",
      },
      {
        img: "/media/nazo.webp",
        title: "Nazo Japanese Food",
        text: {
          pt: "Japonês com rodízio na esteira e também à la carte.",
          en: "Japanese with conveyor-belt rodízio and an à la carte menu.",
        },
        meta: "Av. das Araucárias, 635 · Águas Claras",
        site: "https://www.nazojapanesefood.com.br/",
        maps: "Nazo Japanese Food, Av. das Araucárias 635, Águas Claras, Brasília",
      },
      {
        img: "/media/mandaka.webp",
        title: "Mandaká",
        text: {
          pt: "Cozinha nordestina e carne de sol, com grelhados para dividir.",
          en: "Northeastern Brazilian cooking and carne de sol, with grilled dishes to share.",
        },
        meta: "Max Mall · R. 7 Norte, 01 · Águas Claras",
        site: "https://www.mandaka.com.br/",
        maps: "Mandaka, Max Mall, R. 7 Norte, Águas Claras, Brasília",
      },
    ],
  },

  footer: {
    msg: {
      pt: "Boa estadia. Qualquer coisa, é só chamar a gente.",
      en: "Enjoy your stay. Anything you need, just message us.",
    },
    whoPrefix: { pt: "Com carinho, ", en: "Warmly, " },
    whoName: "Anna Júlia P. Oliveira",
    phones: "(61) 98250-0188 · (61) 98608-5715",
  },
};
