// Testi delle missioni: briefing, notizie (dal documento di progetto) e prova finale.

export const COMMON_BRIEF =
  'Guardati intorno a 360 gradi, ascolta i suoni e osserva i dettagli. ' +
  'Tra circa un minuto andrai in diretta: una telecamera ti riprenderà e leggerai la notizia sul gobbo, accanto all\'obiettivo.';

export const WORLDS = {
  sport: {
    id: 'sport',
    category: 'SPORT',
    title: 'La notte della grande finale',
    place: 'STADIO – FINALE INTERNAZIONALE',
    color: '#1f8a3b',
    briefing:
      'Sei il nostro inviato speciale. Ti stai recando allo stadio per seguire una finale internazionale: ' +
      'Real Madrid contro Barcellona. Tra pochi minuti inizierà la partita. Devi documentare l\'evento.',
    news: {
      title: 'IL MONDO DEL CALCIO TRATTIENE IL RESPIRO: LA FINALE È AL CARDIOPALMA',
      subtitle: 'Stadio gremito, cori assordanti e milioni di spettatori davanti agli schermi. È una notte che promette emozioni.',
      body: [
        'Siamo allo stadio, dove Real Madrid e Barcellona si stanno affrontando in una finale internazionale che tiene con il fiato sospeso milioni di tifosi.',
        'L\'atmosfera è elettrica. Le bandiere sventolano sugli spalti, i cori delle tifoserie si intrecciano e ogni azione viene accompagnata da urla e applausi.',
        'La partita è arrivata agli ultimi minuti e il risultato è ancora in bilico. I giocatori appaiono stanchi, ma nessuno sembra intenzionato ad arrendersi. Sugli spalti cresce la tensione: ogni passaggio potrebbe cambiare il destino della finale.',
        'Dalla nostra postazione a bordo campo osserviamo gli allenatori impartire le ultime indicazioni. Il pubblico è in piedi. Mancano pochi istanti al fischio finale.',
        'Da qui è tutto. Il calcio, questa sera, regala uno spettacolo che nessuno vuole perdere.'
      ]
    },
    quiz: [
      {
        q: 'Quali squadre si affrontano nella finale?',
        options: ['Real Madrid e Barcellona', 'Juventus e Milan', 'Real Madrid e Atletico Madrid'],
        correct: 0,
        explain: 'La notizia parla di una finale internazionale tra Real Madrid e Barcellona.'
      },
      {
        q: 'A che punto è la partita quando vai in diretta?',
        options: ['È appena iniziato il primo tempo', 'Agli ultimi minuti, con il risultato in bilico', 'La partita è già finita ai rigori'],
        correct: 1,
        explain: '«La partita è arrivata agli ultimi minuti e il risultato è ancora in bilico».'
      },
      {
        q: 'Da dove racconta la partita l\'inviato?',
        options: ['Dalla tribuna stampa in cima allo stadio', 'Dal divano di casa', 'Da una postazione a bordo campo'],
        correct: 2,
        explain: '«Dalla nostra postazione a bordo campo osserviamo gli allenatori…».'
      },
      {
        q: 'FAKE NEWS? Un sito scrive: «Finale sospesa per pioggia, stadio quasi vuoto». Secondo la tua notizia è…',
        options: ['Vera: è scritto su un sito', 'Falsa: lo stadio è gremito e la partita continua', 'Impossibile da capire'],
        correct: 1,
        explain: 'La notizia descrive uno stadio gremito, il pubblico in piedi e la partita agli ultimi minuti.'
      },
      {
        q: 'OSSERVAZIONE: quali suoni hai sentito allo stadio?',
        options: ['Cori, tamburi, fischi e la voce dello speaker', 'Sirene e annunci della Protezione Civile', 'Musica di Natale e clacson dei taxi'],
        correct: 0,
        explain: 'Allo stadio c\'erano cori, tamburi, fischi, applausi e lo speaker.'
      }
    ]
  },

  vesuvio: {
    id: 'vesuvio',
    category: 'CRONACA',
    title: 'Il Vesuvio si risveglia: Napoli in allerta',
    place: 'NAPOLI – EMERGENZA SIMULATA',
    color: '#c2410c',
    briefing:
      'Sei il nostro inviato speciale. Ti trovi a Napoli durante un\'emergenza vulcanica simulata: ' +
      'il Vesuvio si è risvegliato. Devi documentare ciò che sta accadendo.',
    news: {
      title: 'IL VESUVIO SI RISVEGLIA: UNA COLONNA DI FUMO SOVRASTA NAPOLI',
      subtitle: 'Boati, cenere e sirene. Scatta l\'emergenza dopo una violenta eruzione del vulcano.',
      body: [
        'Siamo a Napoli, dove uno scenario impressionante sta tenendo migliaia di persone con il fiato sospeso. Il Vesuvio è entrato in eruzione e una gigantesca colonna di fumo si sta alzando sopra il vulcano, oscurando parte del cielo.',
        'Dalle strade arrivano le sirene dei mezzi di soccorso. Le autorità hanno attivato il piano di emergenza e stanno organizzando l\'allontanamento delle persone dalle aree considerate a rischio.',
        'La Protezione Civile invita i cittadini a mantenere la calma, seguire le comunicazioni ufficiali e non avvicinarsi alla zona del vulcano.',
        'Sul posto sono presenti squadre di soccorritori e forze dell\'ordine. La situazione è in continua evoluzione.',
        'La priorità, in queste ore drammatiche, è una sola: proteggere la popolazione e mettere in sicurezza le persone.',
        'Da Napoli è tutto. Continueremo a seguire l\'evolversi dell\'emergenza.'
      ]
    },
    quiz: [
      {
        q: 'Che cosa si alza sopra il vulcano?',
        options: ['Un arcobaleno', 'Una gigantesca colonna di fumo', 'Una nuvola di neve'],
        correct: 1,
        explain: '«Una gigantesca colonna di fumo si sta alzando sopra il vulcano».'
      },
      {
        q: 'Che cosa chiede la Protezione Civile ai cittadini?',
        options: ['Di avvicinarsi al vulcano per fotografarlo', 'Di restare calmi, seguire le comunicazioni ufficiali e non avvicinarsi', 'Di uscire in strada e aspettare'],
        correct: 1,
        explain: 'La Protezione Civile invita a mantenere la calma, seguire le comunicazioni ufficiali e non avvicinarsi alla zona del vulcano.'
      },
      {
        q: 'Qual è la priorità in queste ore?',
        options: ['Proteggere la popolazione e mettere in sicurezza le persone', 'Salvare i negozi del centro', 'Fare più foto possibili'],
        correct: 0,
        explain: '«La priorità […] è una sola: proteggere la popolazione e mettere in sicurezza le persone».'
      },
      {
        q: 'FAKE NEWS? Ti arriva un messaggio: «Il Vesuvio esploderà stanotte alle 3, me l\'ha detto mio cugino. Condividi!». Cosa fai?',
        options: ['Lo inoltro a tutti, non si sa mai', 'Ci credo perché è scritto in maiuscolo', 'Non lo condivido e seguo solo le comunicazioni ufficiali'],
        correct: 2,
        explain: 'Le informazioni affidabili arrivano dalle fonti ufficiali, come la Protezione Civile. Le voci senza fonte creano panico.'
      },
      {
        q: 'OSSERVAZIONE: quali suoni hai sentito a Napoli?',
        options: ['Cori dei tifosi e tamburi', 'Boati, sirene e comunicazioni radio', 'Musica di Natale'],
        correct: 1,
        explain: 'Durante l\'emergenza si sentivano boati del vulcano, sirene, radio e annunci.'
      }
    ]
  },

  marte: {
    id: 'marte',
    category: 'SCIENZA',
    title: 'Destinazione Marte: l\'umanità conquista lo spazio',
    place: 'A BORDO DELLA NAVICELLA AURORA',
    color: '#b45309',
    briefing:
      'Sei il nostro inviato speciale. Questa volta non guarderai il lancio da lontano: sei a bordo della navicella ' +
      'diretta verso Marte, insieme agli astronauti. Devi raccontare la missione.',
    news: {
      title: 'DESTINAZIONE MARTE: SIAMO NELLO SPAZIO, UNA NUOVA FRONTIERA SI AVVICINA',
      subtitle: 'Il conto alla rovescia è terminato. La navicella è partita e la Terra si allontana lentamente alle nostre spalle.',
      body: [
        'Siamo a bordo della navicella spaziale diretta verso Marte. Pochi minuti fa, dopo un conto alla rovescia carico di tensione, i motori si sono accesi e abbiamo lasciato la Terra.',
        'Dal finestrino osserviamo il nostro pianeta diventare sempre più piccolo. Un\'immensa sfera blu sospesa nel buio dello spazio. Gli astronauti controllano gli strumenti, mentre dalla sala di controllo arrivano continue comunicazioni.',
        'La missione ha un obiettivo ambizioso: studiare il pianeta rosso, analizzare il suo terreno e cercare nuove tracce di acqua e condizioni che, in passato, potrebbero aver favorito la vita.',
        'Ogni dato raccolto potrebbe cambiare ciò che sappiamo sull\'universo.',
        'L\'emozione è enorme, ma la responsabilità lo è ancora di più.',
        'Siamo lontani da casa, ma stiamo scrivendo una nuova pagina della storia dell\'umanità.'
      ]
    },
    quiz: [
      {
        q: 'Dove si trova l\'inviato mentre racconta la notizia?',
        options: ['Nella sala di controllo sulla Terra', 'A bordo della navicella diretta verso Marte', 'Sulla Luna'],
        correct: 1,
        explain: '«Siamo a bordo della navicella spaziale diretta verso Marte».'
      },
      {
        q: 'Che cosa si vede dal finestrino durante la diretta?',
        options: ['La Terra che diventa sempre più piccola', 'Il Sole che tramonta sul mare', 'Una città su Marte'],
        correct: 0,
        explain: '«Dal finestrino osserviamo il nostro pianeta diventare sempre più piccolo».'
      },
      {
        q: 'Qual è l\'obiettivo della missione?',
        options: ['Costruire una città su Marte', 'Studiare il pianeta, analizzare il terreno e cercare tracce di acqua', 'Portare turisti nello spazio'],
        correct: 1,
        explain: 'La missione vuole studiare il pianeta rosso, analizzare il terreno e cercare tracce di acqua.'
      },
      {
        q: 'FAKE NEWS? Un titolo dice: «Gli astronauti hanno trovato una città aliena su Marte!». Secondo la tua notizia…',
        options: ['È vero, lo dice la missione', 'È falso: la missione cerca tracce di acqua e condizioni passate per la vita', 'È vero, ma è segreto'],
        correct: 1,
        explain: 'La notizia parla di ricerca scientifica, non di alieni. Un titolo sensazionale non è una prova.'
      },
      {
        q: 'OSSERVAZIONE: quali suoni hai sentito nella navicella?',
        options: ['Conto alla rovescia, allarmi e comunicazioni radio', 'Tamburi e cori', 'Clacson e musica di Natale'],
        correct: 0,
        explain: 'In cabina si sentivano il conto alla rovescia, i segnali della strumentazione e la radio con il centro di controllo.'
      }
    ]
  },

  times: {
    id: 'times',
    category: 'BREAKING NEWS',
    title: 'Natale al buio a Times Square',
    place: 'NEW YORK – TIMES SQUARE',
    color: '#b91c1c',
    briefing:
      'Sei il nostro inviato speciale. È Natale e ti trovi nel cuore di Times Square, a New York. ' +
      'Goditi la festa e osserva bene: potrebbe succedere qualcosa all\'improvviso.',
    news: {
      title: 'NATALE AL BUIO A NEW YORK: BLACKOUT NEL CUORE DI TIMES SQUARE',
      subtitle: 'Improvvisamente si spengono le luci della città. Migliaia di persone restano sorprese nel pieno delle festività natalizie.',
      body: [
        'Siamo a Times Square, nel cuore di New York, dove pochi minuti fa si è verificato un improvviso blackout. Fino a un momento prima, la piazza era illuminata da giganteschi schermi pubblicitari, decorazioni natalizie e luci colorate. Poi, all\'improvviso, il buio.',
        'La musica si è interrotta, i maxischermi sono diventati neri e la folla ha iniziato a reagire con stupore e preoccupazione. Si sentono voci, richieste di informazioni e sirene in lontananza.',
        'Le prime informazioni parlano di un possibile guasto alla rete elettrica. Le squadre tecniche sono già al lavoro per individuare il problema e ripristinare l\'energia.',
        'Intanto, le autorità invitano cittadini e turisti a mantenere la calma e a seguire le indicazioni di sicurezza.',
        'Questa sera, nel luogo simbolo delle luci e dello spettacolo, il Natale si è improvvisamente fermato.',
        'Da Times Square, New York, è tutto. Vi aggiorneremo appena arriveranno nuove informazioni.'
      ]
    },
    quiz: [
      {
        q: 'Che cosa è successo a Times Square?',
        options: ['Un grande concerto', 'Un improvviso blackout', 'Una nevicata che ha bloccato il traffico'],
        correct: 1,
        explain: '«Pochi minuti fa si è verificato un improvviso blackout».'
      },
      {
        q: 'Qual è la causa secondo le prime informazioni?',
        options: ['Un possibile guasto alla rete elettrica', 'Uno sciopero dei tecnici', 'Un fulmine sulla torre principale'],
        correct: 0,
        explain: '«Le prime informazioni parlano di un possibile guasto alla rete elettrica».'
      },
      {
        q: 'Che cosa chiedono le autorità?',
        options: ['Di lasciare subito la città', 'Di accendere le torce e filmare tutto', 'Di mantenere la calma e seguire le indicazioni di sicurezza'],
        correct: 2,
        explain: 'Le autorità invitano cittadini e turisti a mantenere la calma e seguire le indicazioni di sicurezza.'
      },
      {
        q: 'FAKE NEWS? Un post dice: «CONFERMATO: gli hacker hanno spento New York!». Secondo la tua notizia…',
        options: ['È confermato, lo dice il post', 'Non è confermato: si parla solo di un possibile guasto alla rete elettrica', 'È vero perché ha tanti like'],
        correct: 1,
        explain: 'La notizia usa la parola «possibile» e non parla di hacker. «CONFERMATO» in maiuscolo non rende vera un\'informazione.'
      },
      {
        q: 'OSSERVAZIONE: che cosa è cambiato quando è arrivato il blackout?',
        options: ['La musica si è fermata e i maxischermi sono diventati neri', 'È iniziata una partita', 'È arrivato un temporale estivo'],
        correct: 0,
        explain: 'Con il blackout si sono spenti schermi e luci e la musica di Natale si è interrotta.'
      }
    ]
  }
};

export const WORLD_ORDER = ['sport', 'vesuvio', 'marte', 'times'];

export const STORY_TASK =
  'ULTIMA PROVA: togli il visore e racconta alla classe in 3 frasi che cosa hai visto, che cosa hai sentito e come ti sei sentito come inviato speciale.';
