-- Quiz-Fragen für Kapsel-Standorte
-- Alle Fragen beziehen sich auf Fakten, die NICHT im Begleittext stehen.
-- Distraktoren sind plausibel gewählt.

INSERT INTO kapsel_quiz (standort_id, frage, antwort_a, antwort_b, antwort_c, antwort_d, richtig, punkte)
SELECT s.id, q.frage, q.a, q.b, q.c, q.d, q.richtig::CHAR(1), q.punkte
FROM kapsel_standorte s
JOIN (VALUES

  -- ── Svalbard Global Seed Vault ───────────────────────────────────────
  ('Svalbard Global Seed Vault',
   'Welches Land hat die meisten Saatgutproben im Svalbard-Tresor eingelagert?',
   'USA', 'Indien', 'Deutschland', 'China', 'b', 3),

  ('Svalbard Global Seed Vault',
   'Was passierte 2017, das den Tresor unerwarteterweise gefährdete?',
   'Ein Erdbeben beschädigte den Eingang', 'Schmelzwasser drang in den Tunnel ein', 'Ein Stromausfall taute die Proben auf', 'Ein Brand zerstörte den Serverraum', 'b', 4),

  -- ── IKRK Genf ────────────────────────────────────────────────────────
  ('Genf — Sitz des IKRK',
   'Wer gründete das Rote Kreuz nach der blutigen Vorlage der Schlacht von Solferino 1859?',
   'Louis Appia', 'Henry Dunant', 'Gustave Moynier', 'Henri Dufour', 'b', 3),

  ('Genf — Sitz des IKRK',
   'Was besagt das erste Genfer Abkommen von 1864?',
   'Verbot chemischer Waffen', 'Schutz verwundeter Soldaten und Sanitätspersonal', 'Schutz von Kriegsgefangenen', 'Verbot von Antipersonenminen', 'b', 4),

  -- ── ISS ──────────────────────────────────────────────────────────────
  ('Internationale Raumstation ISS',
   'Wie viele Sonnenauf- und -untergänge erleben ISS-Astronauten pro Tag?',
   '6', '10', '16', '24', 'c', 3),

  ('Internationale Raumstation ISS',
   'Was müssen Astronauten auf der ISS täglich tun, um Muskelschwund zu verhindern?',
   '3 Stunden Sport treiben', 'Spezielle Druckanzüge tragen', 'Medikamente injizieren', 'Unter Wasser schlafen', 'a', 3),

  -- ── Vatikanische Bibliothek ───────────────────────────────────────────
  ('Vatikanische Apostolische Bibliothek',
   'Für wie viele Jahre war die Vatikanische Bibliothek ab 2007 komplett geschlossen?',
   '1 Jahr', '2 Jahre', '3 Jahre', '5 Jahre', 'c', 4),

  ('Vatikanische Apostolische Bibliothek',
   'Welches berühmte Dokument befindet sich in der Vatikanischen Bibliothek, das eine erste Beziehung zwischen Christoph Kolumbus und Europa dokumentiert?',
   'Der Kolumbus-Brief von 1493', 'Das Tagebuch der ersten Reise', 'Vertrag von Tordesillas', 'Päpstliche Bulle Inter Caetera', 'a', 5),

  -- ── Südpolstation ────────────────────────────────────────────────────
  ('Amundsen-Scott-Südpolstation',
   'Wie viele Tage war Robert Falcon Scott dem Norwegers Amundsen unterlegen, als er den Südpol 1912 erreichte?',
   '5 Tage', '16 Tage', '33 Tage', '2 Monate', 'c', 4),

  ('Amundsen-Scott-Südpolstation',
   'Warum läuft der geographische Südpol langsam auf dem Eis „davon"?',
   'Tektonische Verschiebungen des Eises', 'Die Erdachse verschiebt sich jährlich', 'Das Eis fliesst über den Fels', 'Messgeräte-Fehler', 'c', 5),

  -- ── Challenger Deep ──────────────────────────────────────────────────
  ('Challenger Deep, Marianergraben',
   'Welches Tier wurde lebend im Challenger Deep in fast 11 km Tiefe gefunden?',
   'Tintenfisch', 'Tiefseegurke', 'Knochenfisch', 'Qualle', 'c', 4),

  ('Challenger Deep, Marianergraben',
   'Wer tauchte 2012 als erster Mensch solo zum tiefsten Punkt der Erde?',
   'Jacques Piccard', 'Don Walsh', 'James Cameron', 'Victor Vescovo', 'c', 3),

  -- ── British Library ──────────────────────────────────────────────────
  ('British Library',
   'Was ist das älteste Objekt in der British Library?',
   'Ein Manuskript aus dem Jahr 1 n. Chr.', 'Ein Fragment des Diamant-Sutra aus 868 n. Chr.', 'Eine Tontafel aus Babylon', 'Die Lindisfarne Gospels', 'b', 4),

  ('British Library',
   'Welche berühmte Figur liess sich jahrelang täglich in der British Library nieder, um sein Hauptwerk zu schreiben?',
   'Charles Darwin', 'Sherlock Holmes', 'Karl Marx', 'Oscar Wilde', 'c', 3),

  -- ── Kilimandscharo ───────────────────────────────────────────────────
  ('Kilimandscharo, Uhuru Peak',
   'Wie lange braucht ein durchschnittlicher Bergsteiger für den Aufstieg auf den Kilimandscharo?',
   '1–2 Tage', '3–4 Tage', '5–7 Tage', '10–14 Tage', 'c', 3),

  ('Kilimandscharo, Uhuru Peak',
   'Warum scheitern über 50 % aller Kilimandscharo-Besteigungen?',
   'Gefährliche Eisfelder', 'Höhenkrankheit wegen zu schnellem Aufstieg', 'Schlechte Wetterverhältnisse', 'Mangel an Trinkwasser', 'b', 4),

  -- ── Mont Blanc ───────────────────────────────────────────────────────
  ('Mont Blanc',
   'Wer bezwang den Mont Blanc als erster Mensch — und in welchem Jahr?',
   'Horace-Bénédict de Saussure, 1786', 'Jacques Balmat, 1786', 'Mont Blanc war schon vor 1800 bestiegen — unbekannter Bergbauer', 'Napoleon Bonaparte, 1800', 'b', 4),

  ('Mont Blanc',
   'Welche kuriose Grenzstreitigkeit verbindet Frankreich und Italien am Mont Blanc?',
   'Beide Länder beanspruchen den Gipfel als ihr Territorium', 'Der Tunnel gehört offiziell der EU', 'Der Gipfel ist seit 2007 offiziell «gipfellos»', 'Die Grenze verläuft mitten durch das Gipfelkreuz', 'a', 5),

  -- ── Bibliotheca Alexandrina ──────────────────────────────────────────
  ('Bibliotheca Alexandrina',
   'Wie viele Sprachen sind auf der Aussenmauer der modernen Bibliotheca Alexandrina eingraviert?',
   '22', '56', '120', '200', 'c', 4),

  ('Bibliotheca Alexandrina',
   'Was war das berühmteste verlorene Werk der antiken Bibliothek von Alexandria?',
   'Das Original des Alten Testaments', 'Aristoteles' vollständige Werke', 'Euklids «Elemente»', 'Die Schriften von Aristarchos über das Sonnensystem', 'b', 5),

  -- ── Jungfraujoch ─────────────────────────────────────────────────────
  ('Jungfraujoch — Top of Europe',
   'Wie viele Jahre dauerte der Bau der Jungfraubahn durch den Fels?',
   '5 Jahre', '10 Jahre', '16 Jahre', '25 Jahre', 'c', 3),

  ('Jungfraujoch — Top of Europe',
   'Was befindet sich seit 1934 im Inneren des Jungfrau-Massivs neben dem Bahnhof?',
   'Ein Luxushotel', 'Ein Atombunker', 'Ein Eispalast', 'Ein meteorologisches Labor', 'c', 3),

  -- ── Uluru ────────────────────────────────────────────────────────────
  ('Uluru (Ayers Rock)',
   'Was ist der Unterschied zwischen dem sichtbaren Teil von Uluru und dem Teil unter der Erde?',
   'Der sichtbare Teil ist grösser', 'Der sichtbare Teil macht weniger als ein Drittel aus', 'Beide Teile sind etwa gleich gross', 'Der Fels reicht nur 50 m tief', 'b', 4),

  ('Uluru (Ayers Rock)',
   'Seit welchem Jahr ist das Besteigen von Uluru offiziell verboten?',
   '2000', '2010', '2017', '2019', 'd', 3),

  -- ── Cheyenne Mountain ────────────────────────────────────────────────
  ('Cheyenne Mountain Complex',
   'Auf wie vielen riesigen Stahlfederlagern ruht der gesamte Bunker-Komplex?',
   '4', '15', '1.319', '2.000', 'c', 5),

  ('Cheyenne Mountain Complex',
   'Welche berühmte Science-Fiction-Serie nutzte Cheyenne Mountain als Schauplatz?',
   'Star Trek', 'Battlestar Galactica', 'Stargate SG-1', 'The X-Files', 'c', 3),

  -- ── Lascaux ──────────────────────────────────────────────────────────
  ('Höhlen von Lascaux',
   'Warum wurde die echte Höhle von Lascaux 1963 für Besucher geschlossen?',
   'Sie stürzte teilweise ein', 'Menschlicher Atem und Licht zerstörten die Gemälde', 'Sie wurde von Touristen mit Graffiti beschmiert', 'Militärisches Sperrgebiet', 'b', 4),

  ('Höhlen von Lascaux',
   'Wie wurden die Höhlen von Lascaux 1940 entdeckt?',
   'Ein Archäologe fiel beim Graben durch den Boden', 'Vier Teenager folgten ihrem Hund in ein Loch', 'Ein Erdbeben legte den Eingang frei', 'Bauarbeiter stiessen beim Strassenbau darauf', 'b', 5),

  -- ── Aletschgletscher ─────────────────────────────────────────────────
  ('Großer Aletschgletscher',
   'Wie schnell bewegt sich der Aletschgletscher pro Tag talwärts?',
   '1 cm', '20 cm', '2 m', '10 m', 'b', 3),

  ('Großer Aletschgletscher',
   'Um wie viele Meter ist der Aletschgletscher seit 1870 zurückgegangen?',
   '500 m', '1,5 km', '3 km', '5 km', 'c', 4),

  -- ── Bermudadreieck ───────────────────────────────────────────────────
  ('Bermudadreieck',
   'Was sagt die Lloyd's of London Versicherung über das Bermudadreieck?',
   'Es ist eine offizielle Hochrisikozone', 'Die Versicherungsprämien dort sind doppelt so hoch', 'Es ist nicht gefährlicher als andere Meeresgebiete', 'Schiffe werden ohne Erklärung nicht versichert', 'c', 4),

  ('Bermudadreieck',
   'Wer prägte 1964 den Begriff „Bermudadreieck" erstmals in einem Artikel?',
   'Charles Berlitz', 'Vincent Gaddis', 'Ivan Sanderson', 'Lawrence David Kusche', 'b', 5),

  -- ── Bundeshaus Bern ──────────────────────────────────────────────────
  ('Bundeshaus Bern',
   'Was befindet sich direkt unter der Kuppel des Bundeshauses, das 2010 entdeckt wurde?',
   'Ein geheimer Luftschutzraum', 'Ein mittelalterlicher Brunnen', 'Nichts — es war eine Falschmeldung', 'Eine Zeitkapsel von 1902', 'd', 5),

  ('Bundeshaus Bern',
   'Wie viele Stunden arbeitete ein Schweizer Parlamentarier im Jahr 2024 offiziell — und was sagt das über das System aus?',
   'Vollzeit wie Berufsparlamentarier', 'Nur 3 Wochen im Jahr — Schweiz ist ein Milizsystem', 'Mindestens 30 Stunden pro Woche', '6 Monate im Jahr in Bern', 'b', 4),

  -- ── Great Barrier Reef ───────────────────────────────────────────────
  ('Great Barrier Reef',
   'Wie viele Korallenarten leben im Great Barrier Reef?',
   '100', '400', '1.500', '3.000', 'b', 3),

  ('Great Barrier Reef',
   'Was ist Korallenbleiche und wann fand das bisher schlimmste Ereignis am Reef statt?',
   'Eine Algenart, die Korallen überwächst; 2000', 'Korallen verlieren ihre Farbalgen durch Hitzestress; 2016–2017', 'Ein Virus der Korallen tötet; 1998', 'Meeresboden­sediment überdeckt Riffe; 2010', 'b', 4),

  -- ── CERN ─────────────────────────────────────────────────────────────
  ('CERN, Teilchenbeschleuniger',
   'Was wurde 1989 am CERN erfunden und veränderte die Welt grundlegend?',
   'Das Internet', 'Das World Wide Web', 'Der USB-Standard', 'WLAN', 'b', 3),

  ('CERN, Teilchenbeschleuniger',
   'Welchen Spitznamen erhielt das Higgs-Boson in der Boulevardpresse — sehr zum Ärger von Peter Higgs selbst?',
   'Das Einstein-Teilchen', 'Das Urknall-Teilchen', 'Das Gottesteilchen', 'Das Weltall-Boson', 'c', 3),

  -- ── Machu Picchu ─────────────────────────────────────────────────────
  ('Machu Picchu',
   'Was war Machu Picchu wahrscheinlich — laut neuester Forschung?',
   'Eine Militärfestung der Inkas', 'Eine Sommerresidenz des Inka-Herrschers Pachacuti', 'Ein astronomisches Observatorium', 'Eine Begräbnisstätte für Adlige', 'b', 4),

  ('Machu Picchu',
   'Wie haben die Inka die tonnenschweren Steine für Machu Picchu transportiert — ohne Rad und ohne Zugtiere für schwere Lasten?',
   'Mit Flaschenzügen aus Lianenseilen', 'Mit Holzrollen und Menschenkraft auf Rampen', 'Per Schiff auf dem Urubamba-Fluss', 'Die genaue Methode ist bis heute unbekannt', 'd', 5),

  -- ── MIT ──────────────────────────────────────────────────────────────
  ('MIT — Massachusetts Institute of Technology',
   'Welcher berühmte Tech-Konzern wurde von einem MIT-Studienabbrecher gegründet?',
   'Apple', 'Microsoft', 'Google', 'Meta', 'b', 3),

  ('MIT — Massachusetts Institute of Technology',
   'Was ist der «MIT-Hack» — eine langjährige Tradition?',
   'Jährlicher Hacker-Wettbewerb mit echten Systemen', 'Kunst-Aktionen, bei denen Gebäude spektakulär umdekoriert werden', 'Ein geheimer Studentenclub für Informatiker', 'Ein illegaler Prüfungs-Tausch unter Studenten', 'b', 4),

  -- ── Oxford ───────────────────────────────────────────────────────────
  ('University of Oxford',
   'Welche TV-Serie spielt in Oxford und zeigt einen brillanten, aber schwierigen Inspektor?',
   'Sherlock', 'Inspector Morse', 'Midsomer Murders', 'Lewis', 'b', 3),

  ('University of Oxford',
   'Warum verliessen im 12. Jahrhundert viele Oxford-Dozenten die Stadt und gründeten Cambridge?',
   'Ein grosser Brand zerstörte Oxford', 'Nach einem Streit zwischen Stadtbewohnern und Studenten wurden Professoren erhängt', 'Die Universität wurde aufgelöst', 'Ein König befahl die Verlagerung', 'b', 5),

  -- ── Cambridge ────────────────────────────────────────────────────────
  ('University of Cambridge',
   'Welcher Cambridge-Absolvent entdeckte die Struktur der DNA?',
   'Charles Darwin', 'James Watson', 'Francis Crick', 'Rosalind Franklin', 'b', 4),

  ('University of Cambridge',
   'Was ist der «Cambridge Mathematical Bridge» — und was behauptet die Legende dazu?',
   'Eine Brücke, die ohne Nägel und Schrauben gebaut wurde — und die angeblich Newton konstruierte', 'Ein Matherätsel, das Studenten lösen müssen, um ihr Zeugnis zu erhalten', 'Der steilste Fahrradweg in Cambridge', 'Eine Prüfung, die jeden zweiten Studenten durchfallen lässt', 'a', 4),

  -- ── ETH Zürich ───────────────────────────────────────────────────────
  ('ETH Zürich',
   'Warum fiel Albert Einstein beim Aufnahmetest der ETH Zürich beim ersten Versuch durch?',
   'Mathematikkenntnisse ungenügend', 'Sein Französisch und Botanik reichten nicht', 'Er erschien zu spät zur Prüfung', 'Er bestand nur den Physikteil', 'b', 4),

  ('ETH Zürich',
   'Was entwickelten ETH-Forscher 2013, das seither in Millionen von iPhones verbaut ist?',
   'OLED-Display-Technologie', 'Face-ID-Kamera', 'Den MEMS-Gyroskop-Sensor', 'Lithium-Polymer-Akku', 'c', 5),

  -- ── Harvard ──────────────────────────────────────────────────────────
  ('Harvard University',
   'Was ist der «Harvard-Kurs» mit den meisten Anmeldungen aller Zeiten?',
   'Wirtschaft und Finanzen', 'Glück — eine Vorlesung über positive Psychologie', 'Informatik CS50', 'Einführung in die Rechtswissenschaft', 'b', 3),

  ('Harvard University',
   'Was passierte mit Mark Zuckerbergs ursprünglichem Studentenprojekt «FaceMash», bevor er Facebook gründete?',
   'Es wurde nie fertig', 'Harvard-Server brachen zusammen und er drohte relegiert zu werden', 'Es wurde von einem anderen Studenten geklaut', 'Es lief 10 Jahre und wurde dann abgeschaltet', 'b', 4),

  -- ── Kennedy Space Center ─────────────────────────────────────────────
  ('NASA Kennedy Space Center',
   'Welches Tier ist auf dem Gelände des Kennedy Space Center besonders zahlreich und schützt es mit seinem Leben?',
   'Adler', 'Alligatoren', 'Strandläufer', 'Manatees (Seekühe)', 'b', 3),

  ('NASA Kennedy Space Center',
   'Was geschah mit dem Saturn-V-Träger, der nie benutzt wurde und heute im Freien liegt?',
   'Er wurde als Ersatzteilelager ausgeschlachtet', 'Er wurde jahrelang draussen dem Regen ausgesetzt, bevor er ausgestellt wurde', 'Er wurde verschrottet', 'Er wartet auf eine Mondmission', 'b', 4),

  -- ── VLT Atacama ──────────────────────────────────────────────────────
  ('ESO Very Large Telescope',
   'Was macht die Atacama-Wüste zum idealen Ort für Teleskope?',
   'Keine Luftverschmutzung durch Industrie', 'Über 340 klare Nächte im Jahr und extrem trockene Luft', 'Nähe zum Äquator für bessere Sicht', 'Geringer Lichtsmog in der Wüste', 'b', 3),

  ('ESO Very Large Telescope',
   'Was ist der Name des Schwarzen Lochs, das 2019 das erste Mal fotografiert wurde — und wo war das Teleskopteam beteiligt?',
   'Sagittarius A*; Atacama war Teil des Event Horizon Telescope-Netzwerks', 'M87*; das VLT machte das Foto allein', 'IC 1101; mit Hubble', 'NGC 4889; ESO war Hauptbetreiber', 'a', 5),

  -- ── Fermilab ─────────────────────────────────────────────────────────
  ('Fermilab',
   'Welches Tier lebt in einer grossen Herde auf dem Fermilab-Gelände und soll Wissenschaftler inspirieren?',
   'Kojoten', 'Bisonherde', 'Präriehunde', 'Weisswedelhirsche', 'b', 3),

  ('Fermilab',
   'Was war das Top-Quark — und warum interessiert sich die Physik so sehr dafür?',
   'Es ist das leichteste aller Quarks', 'Es ist das schwerste bekannte Elementarteilchen — fast so schwer wie ein Goldatom', 'Es ist das einzige Quark, das stabil ist', 'Es ist das einzige Quark, das ohne Partner existiert', 'b', 5),

  -- ── ITER ─────────────────────────────────────────────────────────────
  ('ITER — Fusionsreaktor',
   'Was unterscheidet Kernfusion von Kernspaltung in Bezug auf radioaktiven Abfall?',
   'Fusion erzeugt gar keinen Abfall', 'Fusionsabfall ist innerhalb von 100 Jahren unschädlich; Spaltungsabfall bleibt Hunderttausende Jahre gefährlich', 'Fusion erzeugt mehr Abfall', 'Beide erzeugen gleich viel Abfall', 'b', 4),

  ('ITER — Fusionsreaktor',
   'Welches Scherz-Prinzip gilt in der Fusionsforschung seit Jahrzehnten?',
   '«Fusion ist schwieriger als gedacht»', '«Kommerzielle Fusion ist immer noch 30 Jahre entfernt»', '«Mehr Energie rein als raus — nie»', '«Tokamaks sind heisser als die Sonne — aber nutzlos»', 'b', 3),

  -- ── Paul Scherrer Institut ───────────────────────────────────────────
  ('Paul Scherrer Institut',
   'Welche besondere Krebstherapie wird am PSI seit den 1980er Jahren entwickelt und angewendet?',
   'Chemotherapie', 'Protonentherapie', 'Gentherapie', 'Immuntherapie', 'b', 4),

  ('Paul Scherrer Institut',
   'Wie hoch ist die Temperatur im Synchrotronring des PSI, die nötig ist, um Elektronen so zu beschleunigen?',
   'Raumtemperatur', 'Kälter als flüssiges Helium — unter −269 °C', 'So heiss wie die Sonne', 'Entspricht Raumtemperatur in einem Vakuum', 'b', 5),

  -- ── Max-Planck-Institut ──────────────────────────────────────────────
  ('Max-Planck-Institut',
   'Wer war Max Planck, und was ist die nach ihm benannte Konstante?',
   'Ein General; Masseinheit für militärische Schlagkraft', 'Ein Physiker; die kleinste Einheit von Energie in der Quantenmechanik', 'Ein Chemiker; eine Einheit für Molekülgrösse', 'Ein Mathematiker; der Goldene Schnitt in der Physik', 'b', 4),

  -- ── Salk Institute ───────────────────────────────────────────────────
  ('Salk Institute for Biological Studies',
   'Warum vergab Jonas Salk für den Polioimpfstoff kein Patent?',
   'Es war gesetzlich verboten', 'Er wollte, dass der Impfstoff für alle erschwinglich bleibt', 'Das Patent lief bereits ab', 'Er verkaufte es der WHO', 'b', 5),

  ('Salk Institute for Biological Studies',
   'Was antwortete Salk, als er gefragt wurde, wem der Polioimpfstoff gehöre?',
   '«Mir und meinen Forschern»', '«Dem Volk — gibt es ein Patent auf die Sonne?»', '«Den Vereinten Nationen»', '«Niemandem»', 'b', 5),

  -- ── Hubble ───────────────────────────────────────────────────────────
  ('Hubble-Weltraumteleskop',
   'Was war das peinlichste technische Versagen beim Start des Hubble-Teleskops 1990?',
   'Die Solarpanels lösten sich', 'Der Hauptspiegel war falsch geschliffen — um 2,2 Mikrometer', 'Die Kamera war falsch ausgerichtet', 'Es driftete unkontrolliert 3 Tage lang', 'b', 4),

  ('Hubble-Weltraumteleskop',
   'Wie wurde der Spiegelfehler des Hubble-Teleskops 1993 behoben?',
   'Hubble wurde zur Erde zurückgeholt', 'Astronauten bauten im Weltall eine Korrekturlinse ein', 'NASA ersetzte den Spiegel per Roboter', 'Softwarekorrektur glich den Fehler aus', 'b', 5),

  -- ── Deep Space Network ───────────────────────────────────────────────
  ('Deep Space Network — Goldstone',
   'Welches Raumfahrzeug ist das am weitesten entfernte von der Erde, mit dem Goldstone noch Kontakt hält?',
   'New Horizons', 'Pioneer 10', 'Cassini', 'Voyager 1', 'd', 3),

  ('Deep Space Network — Goldstone',
   'Mit wie viel Leistung sendet Voyager 1 seine Signale zur Erde — und trotzdem empfängt die Antenne sie?',
   '20 Watt — wie eine schwache Glühbirne', 'Kein Watt — Solarenergie reicht aus', '1 Kilowatt', '10 Megawatt', 'a', 5),

  -- ── Weizmann Institute ───────────────────────────────────────────────
  ('Weizmann Institute of Science',
   'Chaim Weizmann war Chemiker — welche strategisch wichtige Entdeckung machte er im Ersten Weltkrieg?',
   'Synthetisches Benzin', 'Aceton-Butanol-Fermentation für die Sprengstoffproduktion', 'Chlorgas als Waffe', 'Aluminium für Flugzeuge', 'b', 5),

  -- ── Camp Nou ─────────────────────────────────────────────────────────
  ('Camp Nou',
   'Was bedeutet „Camp Nou" auf Katalanisch?',
   'Grosses Lager', 'Neues Feld', 'Lager der Fans', 'Blauer Platz', 'b', 2),

  ('Camp Nou',
   'Wie viele Tore schoss Lionel Messi in Pflichtspielen für den FC Barcelona — offiziell?',
   '512', '672', '800', '1.024', 'b', 4),

  -- ── Wembley ──────────────────────────────────────────────────────────
  ('Wembley Stadium',
   'Was passierte beim EM-Finale 2021 im Wembley, das international für Empörung sorgte?',
   'Fans stürmten das Spielfeld nach dem Abpfiff', 'Tausende Fans ohne Tickets drangen gewaltsam ins Stadion ein', 'Die Flutlichter fielen aus', 'Das Spiel wurde wegen Drohnen abgebrochen', 'b', 3),

  -- ── Madison Square Garden ────────────────────────────────────────────
  ('Madison Square Garden',
   'Welche Nummer trägt Madison Square Garden eigentlich historisch — und wo sind die ersten drei?',
   'Es war der erste Bau dieser Art — die Nummerierung ist ein Marketingtrick', 'Drei frühere Gebäude trugen diesen Namen; das heutige ist bereits das vierte', 'Die Nummern beziehen sich auf Stadtblöcke, nicht auf Vorgänger', 'Es gibt nur diesen einen Garden', 'b', 5),

  -- ── Wimbledon ────────────────────────────────────────────────────────
  ('All England Club Wimbledon',
   'Wer gewann Wimbledon am häufigsten — und wie oft?',
   'Roger Federer, 8 Mal', 'Martina Navratilova, 9 Mal', 'Pete Sampras, 7 Mal', 'Steffi Graf, 7 Mal', 'b', 4),

  ('All England Club Wimbledon',
   'Warum ist die Rasenfarbe in Wimbledon nach einigen Runden deutlich weniger grün?',
   'UV-Strahlen bleichen das Gras', 'Das Gras wird zwischen Spielen gefärbt', 'Der Spielbetrieb schleift die Grasnarbe ab', 'Spezielle Düngemittel verändern die Farbe', 'c', 3),

  -- ── Roland Garros ────────────────────────────────────────────────────
  ('Roland Garros',
   'Nach wem ist das Stadion Roland Garros benannt — und was hat er mit Tennis zu tun?',
   'Einem französischen Tennismeister des 19. Jahrhunderts', 'Einem Ersten-Weltkrieg-Piloten, der nichts mit Tennis zu tun hatte', 'Dem Gründer des französischen Tennisverbands', 'Einem Sponsor aus Lyon', 'b', 4),

  -- ── Augusta National ─────────────────────────────────────────────────
  ('Augusta National Golf Club',
   'Was ist das «Amen Corner» in Augusta?',
   'Ein exklusiver VIP-Bereich für Mitglieder', 'Die Nummern 11, 12 und 13 — die gefürchtetsten und schönsten Löcher des Platzes', 'Die letzte Runde vor dem Finale', 'Ein Biergarten für Sponsoren', 'b', 4),

  -- ── Olympia ──────────────────────────────────────────────────────────
  ('Olympia, Griechenland',
   'Was erhielten Sieger der antiken Olympischen Spiele — kein Gold?',
   'Silber und Lorbeerkranz', 'Olivenkranz und lebenslanges Gratisverpflegung', 'Gold und Ehrenstatue', 'Einen Stallhengst', 'b', 4),

  ('Olympia, Griechenland',
   'Was war im antiken Griechenland strikt verboten bei den Olympischen Spielen?',
   'Frauen als Zuschauer', 'Ausländer als Wettkämpfer', 'Waffen auf dem Gelände', 'Alle drei', 'a', 4),

  -- ── Maracanã ─────────────────────────────────────────────────────────
  ('Maracanã',
   'Was ist der «Maracanazo» — eines der bekanntesten Ereignisse in der Fussballgeschichte?',
   'Pelés 1000stes Tor im Maracanã', 'Brasiliens 1-2-Niederlage gegen Uruguay im WM-Finale 1950 vor 200.000 Fans', 'Die WM 2014, wo Brasilien 1:7 gegen Deutschland verlor', 'Die erste WM nach dem Krieg 1954', 'b', 4),

  -- ── Allianz Arena ────────────────────────────────────────────────────
  ('Allianz Arena',
   'Aus wie vielen aufblasbaren Kunststoffkissen besteht die Fassade der Allianz Arena?',
   '1.056', '2.760', '5.000', '10.000', 'b', 4),

  -- ── Old Trafford ─────────────────────────────────────────────────────
  ('Old Trafford',
   'Wer baute Old Trafford, und was war der ursprüngliche Grund für seinen Bau?',
   'Manchester United kaufte ein Industriegelände', 'Clubbesitzer John Henry Davies liess es nach Streit über das alte Stadion bauen', 'Die Stadt Manchester schenkte es dem Verein', 'Eine Brauerei finanzierte es als Werbemassnahme', 'b', 5),

  -- ── Silverstone ──────────────────────────────────────────────────────
  ('Silverstone Circuit',
   'Was passierte beim British GP 1973, das zu einer der grössten Regeländerungen in der Formel 1 führte?',
   'Ein Zuschauer wurde von einem Wagen erfasst', 'Ein Streckenmarschall lief auf die Strecke; danach wurden Safety-Car-Regeln verschärft', 'Jody Scheckter verursachte ein Massenkarambolage im ersten Sektor', 'Es regnete und alle Autos schieden aus', 'c', 5)

) AS q(ort, frage, a, b, c, d, richtig, punkte)
ON s.ort = q.ort
WHERE s.id IS NOT NULL
ON CONFLICT DO NOTHING;
