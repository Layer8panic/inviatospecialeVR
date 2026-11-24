// Registrazioni reali usate nei mondi (archive.org). Licenze e autori sono elencati anche nella pagina iniziale.
const IA = (id, file) => `https://archive.org/download/${id}/${encodeURIComponent(file)}`;

export const SND = {
  // SPORT
  stadioCurva: { url: IA('aporee_9357_11252', 'CityCountryMeMainzStadionAmBruchweg01.mp3'), credit: 'Stadio di Mainz, curva sud – Radio Aporee (CC BY-SA 3.0)' },
  stadioPartita: { url: IA('aporee_14231_16569', 'mariborStadion010812.mp3'), credit: 'Stadio di Maribor, partita – Radio Aporee (CC BY-SA 3.0)' },
  stadioGol: { url: IA('aporee_67254_77805', '2504140121.mp3'), credit: 'Napoli, esultanza per un gol – Radio Aporee (pubblico dominio)' },
  stadioTifosi: { url: IA('aporee_68707_79698', 'fanwall.mp3'), credit: 'Muro di tifosi – Radio Aporee (CC BY-NC 3.0)' },
  // CRONACA
  etna: { url: IA('aporee_63879_73648', 'AtnaGeofon02.mp3'), credit: 'Etna, cratere – Radio Aporee (pubblico dominio)' },
  eruzione: { url: IA('aporee_15469_18016', 'P1020464.mp3'), credit: 'Eruzione del Fimmvörðuháls – Radio Aporee (CC BY-SA 3.0)' },
  cittaSirene: { url: IA('aporee_63877_73646', 'CataniaStreetTrafficPiazzaSavoa1700.mp3'), credit: 'Catania, ambulanza e traffico – Radio Aporee (pubblico dominio)' },
  mareNapoli: { url: IA('aporee_67253_77804', 'zeetegenrotsen.mp3'), credit: 'Napoli, mare sugli scogli – Radio Aporee (pubblico dominio)' },
  elicottero: { url: IA('aporee_25260_29294', 'Hubschrauberstehtundstartet.mp3'), credit: 'Elicottero – Radio Aporee (pubblico dominio)' },
  elicotteroPolizia: { url: IA('aporee_6766_8436', 'CityCountryMeTempelhoferFeldpolizeihubschrauber.mp3'), credit: 'Elicottero della polizia – Radio Aporee (CC BY-SA 3.0)' },
  // SCIENZA
  apolloCountdown: { url: IA('49a64df7-16af-45bb-a3dc-9d01e212b3e5', 'apollo_space_missions_collection_1971-07-xx_15-01_launch_from_t-25_seconds_thru_t-1_20 - e1a3932de21bca52.mp3'), credit: 'Apollo 15, lancio da T-25 secondi – NASA (pubblico dominio)' },
  apolloRombo: { url: IA('219d9af0-afaf-4f98-8111-5950c84c9d92', 'apollo_space_missions_collection_1972-07-xx_17-03_apollo_17_launch_effect_only_-_no_commentary - 4191dd149656aa1a.mp3'), credit: 'Apollo 17, rombo del lancio – NASA (pubblico dominio)' },
  discesa: { url: IA('NasaLaunchAudio', '02-Nasa-Sts-86Landing.mp3'), credit: 'Space Shuttle STS-86, rientro – NASA (pubblico dominio)' },
  // BREAKING NEWS
  timesSquare: { url: IA('aporee_63738_73418', '1118BINEWYORKTimesSquare230908at1515.mp3'), credit: 'Times Square, New York – Radio Aporee (pubblico dominio)' },
  mercatino: { url: IA('aporee_55417_63325', 'PotsdamerStrae25122021.mp3'), credit: 'Mercatino di Natale, Berlino – Radio Aporee (pubblico dominio)' },
  jingle: { url: IA('jamendo-275507', '01-1185392-Milles-Jingle Bells.mp3'), credit: 'Milles, «Jingle Bells» – Jamendo (CC BY 3.0)' },
  blackout: { url: IA('aporee_23042_26783', '1405171272blackoutaporee.mp3'), credit: 'Blackout, sirena e ambiente – Radio Aporee (CC BY-NC-ND 3.0)' },
  sirenaNY: { url: IA('aporee_63719_73383', '1083XYNEWYORKclosePDsiren230905at0515117.mp3'), credit: 'Sirena della polizia di New York – Radio Aporee (pubblico dominio)' }
};
