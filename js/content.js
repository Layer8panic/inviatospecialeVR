// Testi delle missioni: briefing, notizie da leggere in diretta e compito per la classe.
// Ogni notizia descrive esattamente quello che lo studente vede e sente nel mondo virtuale in quel momento.

export const COMMON_BRIEF =
  'Guardati intorno, ascolta e osserva i dettagli: ti serviranno per la diretta. ' +
  'Tra circa un minuto comparirà una telecamera e leggerai la notizia sul gobbo, il monitor accanto all\'obiettivo.';

export const WORLDS = {
  sport: {
    id: 'sport',
    category: 'SPORT',
    title: 'La notte della grande finale',
    place: 'MADRID – STADIO SANTIAGO BERNABÉU',
    color: '#1f8a3b',
    briefing:
      'Sei il nostro inviato speciale a bordo campo, allo stadio Santiago Bernabéu di Madrid. Stasera si gioca la finale internazionale tra Real Madrid e Barcellona ' +
      'e mancano pochi minuti al fischio d\'inizio. Devi documentare l\'evento.',
    news: {
      title: 'IL MONDO DEL CALCIO TRATTIENE IL RESPIRO: TRA POCHI MINUTI LA GRANDE FINALE',
      subtitle: 'Stadio gremito, cori e tamburi sugli spalti, milioni di spettatori davanti agli schermi. Real Madrid e Barcellona si giocano il trofeo.',
      body: [
        'Buonasera da bordo campo. Siamo al Santiago Bernabéu di Madrid, che questa sera ospita la finale internazionale tra Real Madrid e Barcellona. Mancano pochi minuti al fischio d\'inizio.',
        'I tre anelli dello stadio sono pieni in ogni settore. Quasi tutto il pubblico è vestito di bianco, mentre in alto, nel settore ospiti, si vedono i colori blaugrana del Barcellona. Sventolano bandiere e striscioni, i tamburi dettano il ritmo dei cori e sugli spalti parte la ola.',
        'In campo i giocatori stanno completando il riscaldamento: corse leggere, scatti e passaggi. Gli allenatori sono già davanti alle panchine e seguono ogni movimento.',
        'Sopra di noi la telecamera sospesa sui cavi sorvola il campo, mentre il grande schermo circolare sotto la copertura annuncia la sfida. I riflettori illuminano il prato come se fosse giorno.',
        'La tensione si sente nell\'aria: è una notte che promette emozioni. Da bordo campo è tutto, la linea torna in studio.'
      ]
    }
  },

  vesuvio: {
    id: 'vesuvio',
    category: 'CRONACA',
    title: 'Il Vesuvio si risveglia: Napoli in allerta',
    place: 'NAPOLI – VIA CARACCIOLO',
    color: '#c2410c',
    briefing:
      'Sei il nostro inviato speciale a Napoli. Il Vesuvio è entrato in eruzione ed è scattata l\'emergenza: ' +
      'la gente scappa, passano i soccorsi. Devi documentare ciò che sta accadendo.',
    news: {
      title: 'IL VESUVIO SI RISVEGLIA: UNA COLONNA DI FUMO E CENERE SOVRASTA NAPOLI',
      subtitle: 'Boati, colate di lava, sirene e gente in fuga. In città scatta il piano di emergenza.',
      body: [
        'Siamo a Napoli, in riva al mare. Davanti a noi, dall\'altra parte del golfo, il Vesuvio è in eruzione: una gigantesca colonna di fumo e cenere sale dal cratere e si allarga nel cielo, mentre la lava scende lungo i fianchi del vulcano.',
        'Ogni pochi secondi arriva un boato. Dentro la nube si vedono lampi e fulmini, e una cenere sottile sta già cadendo sulla città.',
        'Intorno a noi c\'è grande agitazione. Molte persone corrono verso ovest, altre camminano in fretta con le borse in mano. Ambulanze, vigili del fuoco, polizia e Protezione Civile attraversano la strada a sirene spiegate, mentre due elicotteri sorvolano la zona.',
        'I pannelli luminosi ripetono le istruzioni: allontanarsi dalla zona rossa e non avvicinarsi al vulcano. Accanto a noi una squadra di soccorritori aiuta chi ha bisogno.',
        'La priorità è una sola: proteggere la popolazione. Da Napoli è tutto, continueremo a seguire l\'evolversi dell\'emergenza.'
      ]
    }
  },

  marte: {
    id: 'marte',
    category: 'SCIENZA',
    title: 'Destinazione Marte: l\'umanità conquista lo spazio',
    place: 'A BORDO DELLA NAVICELLA AURORA',
    color: '#b45309',
    briefing:
      'Sei il nostro inviato speciale a bordo della navicella Aurora, diretta verso Marte. Non guarderai il lancio da lontano: ' +
      'partirai insieme agli astronauti. Ascolta il conto alla rovescia e osserva dai finestrini.',
    news: {
      title: 'DESTINAZIONE MARTE: SIAMO NELLO SPAZIO, UNA NUOVA FRONTIERA SI AVVICINA',
      subtitle: 'Il conto alla rovescia è finito, i motori si sono accesi. La navicella Aurora ha lasciato la Terra.',
      body: [
        'Siamo a bordo della navicella Aurora, diretta verso Marte. Pochi minuti fa abbiamo vissuto il conto alla rovescia, poi l\'accensione dei motori: un rombo fortissimo e le vibrazioni della partenza.',
        'Fuori dai finestrini il cielo è passato dall\'azzurro al nero. Ora vediamo la Terra: un\'immensa sfera blu e bianca che diventa sempre più piccola. Più lontano, dall\'altro finestrino, si vede la Luna.',
        'Qui in cabina due astronauti controllano gli strumenti. Sugli schermi di bordo abbiamo rivisto in diretta televisiva la nostra partenza dalla rampa di lancio, mentre i dati mostrano la distanza dalla Terra, che cresce di minuto in minuto.',
        'La missione ha un obiettivo ambizioso: studiare il pianeta rosso, analizzare il suo terreno e cercare tracce di acqua e condizioni che in passato potrebbero aver favorito la vita.',
        'L\'emozione è enorme, ma la responsabilità lo è ancora di più. Siamo lontani da casa e stiamo scrivendo una nuova pagina della storia dell\'umanità. Dalla navicella Aurora è tutto.'
      ]
    }
  },

  times: {
    id: 'times',
    category: 'BREAKING NEWS',
    title: 'Natale al buio a Times Square',
    place: 'NEW YORK – TIMES SQUARE',
    color: '#b91c1c',
    briefing:
      'Sei il nostro inviato speciale a New York. È la sera di Natale e ti trovi nel cuore di Times Square, tra luci, neve, musica e migliaia di persone a passeggio. ' +
      'Osserva bene: potrebbe succedere qualcosa all\'improvviso.',
    news: {
      title: 'NATALE AL BUIO A NEW YORK: BLACKOUT NEL CUORE DI TIMES SQUARE',
      subtitle: 'Si spengono all\'improvviso maxischermi, luci e decorazioni. Migliaia di persone restano al buio sotto la neve.',
      body: [
        'Siamo a Times Square, nel cuore di New York. Fino a pochi minuti fa la piazza era accesa da giganteschi schermi pubblicitari, dalle luci dell\'albero di Natale e dalle decorazioni sopra la strada. La musica natalizia accompagnava la neve che cadeva.',
        'Poi, all\'improvviso, il blackout. Gli schermi hanno tremolato e si sono spenti uno dopo l\'altro, la musica si è interrotta e l\'albero è rimasto al buio.',
        'La folla ha reagito con stupore. Molte persone camminano con la torcia del telefono accesa per vedere dove mettere i piedi. Le altre luci rimaste sono i fari dei taxi gialli, che continuano a passare lentamente.',
        'In fondo alla strada lampeggiano le auto della polizia e si sentono le sirene. Le prime informazioni parlano di un possibile guasto alla rete elettrica e le squadre tecniche sono già al lavoro.',
        'Le autorità invitano a mantenere la calma e a seguire le indicazioni di sicurezza. Da Times Square è tutto: vi aggiorneremo appena arriveranno nuove informazioni.'
      ]
    }
  }
};

export const WORLD_ORDER = ['sport', 'vesuvio', 'marte', 'times'];

export const STORY_TASK =
  'COMPITO PER LA CLASSE: togli il visore e racconta alla classe in 3 frasi che cosa hai visto, che cosa hai sentito e come ti sei sentito come inviato speciale.';
