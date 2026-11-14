// quiz_lo.js — Quizfragen zur linearen Optimierung (wird von 116_quiz.js bei Bedarf geladen)
// Je Ansicht 30 Fragen: 12 × Stufe 1 (Grundwissen), 10 × Stufe 2 (Verständnis), 8 × Stufe 3 (Knacknuss).
// Die Reihenfolge hier ist die Reihenfolge im Quiz und auf dem Arbeitsblatt (Frage 1 bis 30).
// {l, q, a, e}: a[0] ist die richtige Antwort (Anzeige gemischt)   ·   {l, q, tf, e}: Aussage, tf = wahr/falsch
(function () {
  const r = String.raw;
  // Planungspolygon, das in mehreren Fragen vorkommt
  const SYS = r`$x\ge0$, $y\ge0$, $x+2y\le8$, $3x+y\le9$`;
  const PG = r`Ein Planungspolygon hat die Ecken $(0\,|\,0)$, $(3\,|\,0)$, $(2\,|\,3)$ und $(0\,|\,4)$. `;
  (window.QUIZ_DATA = window.QUIZ_DATA || {}).lo = {

    // ───────────────────────── Ungleichung mit einer Variablen ─────────────────────────
    ung1: [
      { l: 1, q: r`Welche Lösungen hat $x+3>5$?`, a: [r`$x>2$`, r`$x>8$`, r`$x<2$`, r`$x=2$`], e: r`Auf beiden Seiten 3 abziehen.` },
      { l: 1, q: r`Welche Lösungen hat $2x\le8$?`, a: [r`$x\le4$`, r`$x\le16$`, r`$x\ge4$`, r`$x\le6$`], e: r`Beide Seiten durch 2 teilen.` },
      { l: 1, q: r`Was geschieht, wenn man eine Ungleichung mit einer negativen Zahl multipliziert?`, a: [r`Das Ungleichheitszeichen kehrt sich um.`, r`Nichts Besonderes.`, r`Die Ungleichung wird zur Gleichung.`, r`Die Ungleichung hat keine Lösung mehr.`], e: r`Aus $2<3$ wird $-2>-3$.` },
      { l: 1, q: r`Welche Lösungen hat $-x<3$?`, a: [r`$x>-3$`, r`$x<-3$`, r`$x<3$`, r`$x>3$`], e: r`Mit $-1$ multiplizieren und das Zeichen umkehren.` },
      { l: 1, q: r`Wie sieht die Lösungsmenge einer linearen Ungleichung mit einer Variablen in der Regel aus?`, a: [r`Sie ist ein Intervall mit unendlich vielen Zahlen.`, r`Sie besteht aus genau einer Zahl.`, r`Sie besteht aus zwei Zahlen.`, r`Sie ist immer leer.`], e: r`Zum Beispiel alle Zahlen, die grösser als 2 sind.` },
      { l: 1, q: r`Ist $x=3$ eine Lösung von $2x-1>4$?`, a: [r`Ja, denn $5>4$.`, r`Nein, denn $5<4$.`, r`Nein, denn $6>4$.`, r`Das lässt sich nicht prüfen.`], e: r`Einsetzen: $2\cdot3-1=5$.` },
      { l: 1, q: r`Welche Lösungen hat $x-4\ge1$?`, a: [r`$x\ge5$`, r`$x\ge-3$`, r`$x\le5$`, r`$x\ge3$`], e: r`Auf beiden Seiten 4 addieren.` },
      { l: 1, q: r`Addiert man auf beiden Seiten einer Ungleichung dieselbe Zahl, so bleibt das Ungleichheitszeichen, wie es ist.`, tf: true, e: r`Beide Seiten werden gleich weit verschoben.` },
      { l: 1, q: r`Welche Lösungen hat $3x>12$?`, a: [r`$x>4$`, r`$x>36$`, r`$x<4$`, r`$x>9$`], e: r`Beide Seiten durch 3 teilen; 3 ist positiv, das Zeichen bleibt.` },
      { l: 1, q: r`Was bedeutet das Zeichen $\le$?`, a: [r`Kleiner oder gleich`, r`Kleiner`, r`Grösser oder gleich`, r`Ungleich`], e: r`Der Grenzwert selbst gehört dazu.` },
      { l: 1, q: r`Welche Lösungen hat $-2x\ge6$?`, a: [r`$x\le-3$`, r`$x\ge-3$`, r`$x\le3$`, r`$x\ge-12$`], e: r`Durch $-2$ teilen und das Zeichen umkehren.` },
      { l: 1, q: r`$x>2$ und $2<x$ bedeuten dasselbe.`, tf: true, e: r`Die Spitze zeigt beide Male zur kleineren Zahl.` },

      { l: 2, q: r`Welche Lösungen hat $-2x+5\ge1$?`, a: [r`$x\le2$`, r`$x\ge2$`, r`$x\le-2$`, r`$x\ge-3$`], e: r`$-2x\ge-4$; beim Teilen durch $-2$ kehrt sich das Zeichen um.` },
      { l: 2, q: r`Welche Lösungen hat $3x-4<2x+1$?`, a: [r`$x<5$`, r`$x<-3$`, r`$x>5$`, r`$x<1$`], e: r`$2x$ abziehen und 4 addieren.` },
      { l: 2, q: r`Welche Lösungen hat $2\,(x-1)\le5x+4$?`, a: [r`$x\ge-2$`, r`$x\le-2$`, r`$x\ge2$`, r`$x\le2$`], e: r`$2x-2\le5x+4$ ergibt $-6\le3x$.` },
      { l: 2, q: r`Welche Lösungen hat $\frac x2+3>1$?`, a: [r`$x>-4$`, r`$x>-1$`, r`$x<-4$`, r`$x>8$`], e: r`$\frac x2>-2$.` },
      { l: 2, q: r`Ein Handyabo kostet 20 Fr. Grundgebühr und 0.10 Fr. pro Minute. Ab wie vielen Minuten $x$ kostet es mehr als 35 Fr.?`, a: [r`Für $x>150$`, r`Für $x>15$`, r`Für $x>350$`, r`Für $x>550$`], e: r`$20+0.1\,x>35$ ergibt $0.1\,x>15$.` },
      { l: 2, q: r`Im Bild stehen die linke und die rechte Seite als Geraden. Wo liegen die Lösungen von «links > rechts»?`, a: [r`Dort, wo die Gerade der linken Seite oberhalb der anderen verläuft.`, r`Im Schnittpunkt der beiden Geraden.`, r`Dort, wo die Gerade der linken Seite unterhalb der anderen verläuft.`, r`Dort, wo beide Geraden über der $x$-Achse liegen.`], e: r`Im Schnittpunkt sind beide Seiten gleich; er begrenzt die Lösungsmenge.` },
      { l: 2, q: r`Die Ungleichung $2x+1>2x$ wird von allen reellen Zahlen erfüllt.`, tf: true, e: r`Es bleibt $1>0$, und das stimmt immer.` },
      { l: 2, q: r`Welche Lösungen hat $x+1<x$?`, a: [r`Keine`, r`Alle reellen Zahlen`, r`$x<0$`, r`$x<-1$`], e: r`Es bleibt $1<0$, und das stimmt nie.` },
      { l: 2, q: r`Welches ist die grösste ganze Zahl, die $3x+2<20$ erfüllt?`, a: [r`$5$`, r`$6$`, r`$7$`, r`$4$`], e: r`$x<6$; die 6 selbst gehört nicht dazu.` },
      { l: 2, q: r`Welche Lösungen hat $-3<2x+1\le7$?`, a: [r`$-2<x\le3$`, r`$-1<x\le4$`, r`$-2\le x<3$`, r`$-4<x\le6$`], e: r`Überall 1 abziehen, dann durch 2 teilen.` },

      { l: 3, q: r`Welche Lösungen hat $\frac{x-1}{-2}>3$?`, a: [r`$x<-5$`, r`$x>-5$`, r`$x<7$`, r`$x>-7$`], e: r`Mit $-2$ multiplizieren kehrt das Zeichen um: $x-1<-6$.` },
      { l: 3, q: r`Aus $a<b$ folgt $a^2<b^2$.`, tf: false, e: r`$-3<2$, aber $9>4$. Quadrieren erhält die Ordnung nur für nicht negative Zahlen.` },
      { l: 3, q: r`Welche Lösungen hat $\frac1x<\frac12$?`, a: [r`$x>2$ oder $x<0$`, r`Nur $x>2$`, r`$0<x<2$`, r`$x<2$`], e: r`Für negative $x$ ist $\frac1x$ negativ und damit sicher kleiner. Für positive $x$ kehrt der Kehrwert die Ordnung um.` },
      { l: 3, q: r`Für welche $a$ hat $a\,x>2$ die Lösungen $x<\frac2a$?`, a: [r`Für $a<0$`, r`Für $a>0$`, r`Für alle $a\ne0$`, r`Für kein $a$`], e: r`Nur beim Teilen durch eine negative Zahl kehrt sich das Zeichen um.` },
      { l: 3, q: r`Taxi A kostet 6 Fr. plus 2 Fr. pro km, Taxi B 3 Fr. plus 2.50 Fr. pro km. Für welche Strecken $x$ ist A günstiger?`, a: [r`Für $x>6$ km`, r`Für $x<6$ km`, r`Für $x>3$ km`, r`Immer`], e: r`$6+2x<3+2.5\,x$ ergibt $3<0.5\,x$.` },
      { l: 3, q: r`Welche Lösungen hat $|2x-1|\le5$?`, a: [r`$-2\le x\le3$`, r`$x\le3$`, r`$-3\le x\le2$`, r`$x\le-2$ oder $x\ge3$`], e: r`$-5\le2x-1\le5$.` },
      { l: 3, q: r`Wie viele natürliche Zahlen (ab 1) erfüllen $5-2x>-8$?`, a: [r`$6$`, r`$7$`, r`$5$`, r`Unendlich viele`], e: r`$-2x>-13$, also $x<6.5$: die Zahlen 1 bis 6.` },
      { l: 3, q: r`Welche Lösungen hat $x^2>4x$?`, a: [r`$x<0$ oder $x>4$`, r`$x>4$`, r`$0<x<4$`, r`$x>2$`], e: r`$x\,(x-4)>0$. Wer durch $x$ teilt, übersieht die negativen Zahlen.` }
    ],

    // ───────────────────────── Ungleichung mit zwei Variablen ─────────────────────────
    half: [
      { l: 1, q: r`Welche Form hat die Lösungsmenge einer linearen Ungleichung mit $x$ und $y$?`, a: [r`Eine Halbebene`, r`Eine Gerade`, r`Ein Punkt`, r`Ein Kreis`], e: r`Die Grenzgerade teilt die Ebene in zwei Hälften; eine davon ist die Lösungsmenge.` },
      { l: 1, q: r`Welche Grenzgerade gehört zu $y\le2x+1$?`, a: [r`$y=2x+1$`, r`$y=2x$`, r`$y=x+1$`, r`$x=2y+1$`], e: r`Das Ungleichheitszeichen durch ein Gleichheitszeichen ersetzen.` },
      { l: 1, q: r`Wie zeichnet man die Grenzgerade bei $\le$ oder $\ge$?`, a: [r`Durchgezogen: Sie gehört zur Lösungsmenge.`, r`Gestrichelt: Sie gehört nicht dazu.`, r`Gar nicht.`, r`Als dicken Punkt.`], e: r`«Oder gleich» schliesst die Grenze ein.` },
      { l: 1, q: r`Wie zeichnet man die Grenzgerade bei $<$ oder $>$?`, a: [r`Gestrichelt: Sie gehört nicht zur Lösungsmenge.`, r`Durchgezogen: Sie gehört dazu.`, r`Doppelt.`, r`Als Kurve.`], e: r`Punkte auf der Geraden erfüllen nur die Gleichung.` },
      { l: 1, q: r`Wozu dient ein Testpunkt?`, a: [r`Er zeigt, auf welcher Seite der Grenzgeraden die Lösungen liegen.`, r`Er ist der Schnittpunkt mit der $y$-Achse.`, r`Er ist die einzige Lösung.`, r`Er legt die Steigung fest.`], e: r`Erfüllt er die Ungleichung, gehört seine ganze Seite zur Lösungsmenge.` },
      { l: 1, q: r`Ist $(0\,|\,0)$ eine Lösung von $y\le2x+1$?`, a: [r`Ja, denn $0\le1$.`, r`Nein, denn $0\ne1$.`, r`Nein, der Ursprung ist nie eine Lösung.`, r`Nur wenn die Gerade durch den Ursprung geht.`], e: r`Einsetzen: $0\le2\cdot0+1$.` },
      { l: 1, q: r`Ist $(0\,|\,3)$ eine Lösung von $y\le2x+1$?`, a: [r`Nein, denn $3>1$.`, r`Ja, denn $3\le3$.`, r`Ja, denn $0\le1$.`, r`Das lässt sich nicht sagen.`], e: r`Einsetzen: $3\le1$ ist falsch.` },
      { l: 1, q: r`Bei $y<2x+1$ gehören die Punkte auf der Grenzgeraden zur Lösungsmenge.`, tf: false, e: r`Für sie gilt $y=2x+1$, und das ist nicht «kleiner».` },
      { l: 1, q: r`Wo liegen die Lösungen von $y>x$?`, a: [r`Oberhalb der Geraden $y=x$`, r`Unterhalb der Geraden $y=x$`, r`Auf der Geraden $y=x$`, r`Rechts der $y$-Achse`], e: r`Die $y$-Koordinate soll grösser sein als die $x$-Koordinate.` },
      { l: 1, q: r`Welcher Testpunkt ist meistens am bequemsten?`, a: [r`Der Ursprung $(0\,|\,0)$, wenn er nicht auf der Grenzgeraden liegt.`, r`Ein Punkt auf der Grenzgeraden.`, r`Ein möglichst weit entfernter Punkt.`, r`Der Schnittpunkt mit der $x$-Achse.`], e: r`Mit 0 rechnet es sich am leichtesten.` },
      { l: 1, q: r`Ist $(2\,|\,1)$ eine Lösung von $x+y\le4$?`, a: [r`Ja, denn $3\le4$.`, r`Nein, denn $3\ne4$.`, r`Nein, denn $2>1$.`, r`Nur auf der Grenzgeraden.`], e: r`Einsetzen: $2+1=3$.` },
      { l: 1, q: r`Eine lineare Ungleichung mit $x$ und $y$ hat unendlich viele Lösungen.`, tf: true, e: r`Alle Punkte einer Halbebene.` },

      { l: 2, q: r`Wo liegen die Lösungen von $2x+y\le6$?`, a: [r`Auf und unterhalb der Geraden $y=-2x+6$`, r`Auf und oberhalb der Geraden $y=-2x+6$`, r`Auf und unterhalb der Geraden $y=2x+6$`, r`Auf und oberhalb der Geraden $y=2x-6$`], e: r`Nach $y$ auflösen: $y\le-2x+6$.` },
      { l: 2, q: r`Wo liegen die Lösungen von $x-y<2$?`, a: [r`Oberhalb der Geraden $y=x-2$`, r`Unterhalb der Geraden $y=x-2$`, r`Oberhalb der Geraden $y=-x+2$`, r`Unterhalb der Geraden $y=x+2$`], e: r`$-y<2-x$ wird zu $y>x-2$: Das Zeichen kehrt sich um.` },
      { l: 2, q: r`Wo schneidet die Gerade $3x+2y=12$ die Achsen?`, a: [r`In $(4\,|\,0)$ und $(0\,|\,6)$`, r`In $(3\,|\,0)$ und $(0\,|\,2)$`, r`In $(6\,|\,0)$ und $(0\,|\,4)$`, r`In $(12\,|\,0)$ und $(0\,|\,12)$`], e: r`$y=0$ gibt $x=4$; $x=0$ gibt $y=6$.` },
      { l: 2, q: r`Welcher Punkt erfüllt $3x+2y\ge12$?`, a: [r`$(3\,|\,2)$`, r`$(1\,|\,1)$`, r`$(2\,|\,2)$`, r`$(0\,|\,5)$`], e: r`$9+4=13$; die anderen ergeben 5, 10 und 10.` },
      { l: 2, q: r`Welche Punkte erfüllen $x\ge0$?`, a: [r`Die $y$-Achse und alles rechts davon`, r`Die $x$-Achse und alles darüber`, r`Nur die $y$-Achse`, r`Alles links der $y$-Achse`], e: r`Die Grenzgerade $x=0$ ist die $y$-Achse.` },
      { l: 2, q: r`Welche Punkte erfüllen $y\le3$?`, a: [r`Die waagrechte Gerade $y=3$ und alles darunter`, r`Die senkrechte Gerade $x=3$ und alles links davon`, r`Nur die Gerade $y=3$`, r`Alles über der Geraden $y=3$`], e: r`$x$ ist frei, $y$ höchstens 3.` },
      { l: 2, q: r`Der Ursprung eignet sich immer als Testpunkt.`, tf: false, e: r`Liegt er auf der Grenzgeraden (zum Beispiel bei $y<2x$), so entscheidet er nichts.` },
      { l: 2, q: r`Welche Ungleichung beschreibt die Gerade $y=-x+5$ und alles darunter?`, a: [r`$x+y\le5$`, r`$x+y\ge5$`, r`$x-y\le5$`, r`$x+y<5$`], e: r`$y\le-x+5$, umgestellt.` },
      { l: 2, q: r`Liegt der Ursprung in der Lösungsmenge von $2x-3y>6$?`, a: [r`Nein, denn $0>6$ ist falsch.`, r`Ja, denn $0<6$.`, r`Ja, der Ursprung liegt immer darin.`, r`Er liegt auf der Grenzgeraden.`], e: r`Die Lösungen liegen auf der anderen Seite der Grenzgeraden.` },
      { l: 2, q: r`Ein Kinobesuch kostet 15 Fr. pro Erwachsenen ($x$) und 10 Fr. pro Kind ($y$); zusammen höchstens 120 Fr. Welche Ungleichung passt?`, a: [r`$15x+10y\le120$`, r`$15x+10y\ge120$`, r`$10x+15y\le120$`, r`$x+y\le120$`], e: r`Kosten der Erwachsenen plus Kosten der Kinder, «höchstens» heisst $\le$.` },

      { l: 3, q: r`Wie lautet $-2y\ge4x-6$, nach $y$ aufgelöst?`, a: [r`$y\le-2x+3$`, r`$y\ge-2x+3$`, r`$y\le2x-3$`, r`$y\ge2x+3$`], e: r`Durch $-2$ teilen und das Zeichen umkehren.` },
      { l: 3, q: r`Die Lösungen von $a\,x+b\,y\le c$ liegen immer unterhalb der Grenzgeraden.`, tf: false, e: r`Für negatives $b$ kehrt sich beim Auflösen nach $y$ das Zeichen um; dann liegen sie oberhalb.` },
      { l: 3, q: r`Bei welcher Ungleichung liegt $(1\,|\,2)$ auf der Grenzgeraden und der Ursprung in der Lösungsmenge?`, a: [r`$2x+y\le4$`, r`$2x+y\ge4$`, r`$x+y\le2$`, r`$x+2y<5$`], e: r`$2\cdot1+2=4$ und $0\le4$.` },
      { l: 3, q: r`Wie viele Punkte mit ganzzahligen, nicht negativen Koordinaten erfüllen $x+y\le2$?`, a: [r`$6$`, r`$3$`, r`$4$`, r`$9$`], e: r`$(0|0),(1|0),(2|0),(0|1),(1|1),(0|2)$.` },
      { l: 3, q: r`Welche Punkte erfüllen $y\ge|x|$?`, a: [r`Die Punkte auf und über dem «V» aus $y=x$ und $y=-x$`, r`Alle Punkte über der $x$-Achse`, r`Die Punkte unter dem «V»`, r`Die Punkte rechts der $y$-Achse`], e: r`$y$ muss mindestens so gross sein wie $x$ und wie $-x$.` },
      { l: 3, q: r`Welche Punkte erfüllen zugleich $y>x$ und $y<x$?`, a: [r`Keine`, r`Die Punkte der Geraden $y=x$`, r`Alle Punkte`, r`Nur der Ursprung`], e: r`Die beiden Halbebenen liegen auf verschiedenen Seiten der Geraden und haben keinen gemeinsamen Punkt.` },
      { l: 3, q: r`Es sind $a>0$ und $b>0$. Welche Punkte erfüllen $\frac xa+\frac yb\le1$?`, a: [r`Die Gerade durch $(a\,|\,0)$ und $(0\,|\,b)$ und die Seite mit dem Ursprung`, r`Die Gerade durch $(a\,|\,0)$ und $(0\,|\,b)$ und die Seite ohne den Ursprung`, r`Das Rechteck mit den Seiten $a$ und $b$`, r`Nur die beiden Achsenabschnitte`], e: r`Der Ursprung erfüllt $0\le1$.` },
      { l: 3, q: r`Welche Fläche hat der Bereich mit $x\ge0$, $y\ge0$ und $2x+y\le6$?`, a: [r`$9$`, r`$18$`, r`$6$`, r`$12$`], e: r`Ein rechtwinkliges Dreieck mit den Achsenabschnitten 3 und 6.` }
    ],

    // ───────────────────────── Ungleichungssystem und Planungspolygon ─────────────────────────
    poly: [
      { l: 1, q: r`Welche Punkte lösen ein System von Ungleichungen?`, a: [r`Die Punkte, die in allen Halbebenen zugleich liegen.`, r`Die Punkte, die in mindestens einer Halbebene liegen.`, r`Nur die Schnittpunkte der Grenzgeraden.`, r`Nur der Ursprung.`], e: r`Der Durchschnitt der Halbebenen.` },
      { l: 1, q: r`Wie heisst die Lösungsmenge eines solchen Systems?`, a: [r`Planungspolygon (zulässiger Bereich)`, r`Niveaulinie`, r`Zielfunktion`, r`Grenzgerade`], e: r`Ein Vieleck, wenn der Bereich beschränkt ist.` },
      { l: 1, q: r`Wann heisst ein Punkt zulässig?`, a: [r`Wenn er alle Ungleichungen erfüllt.`, r`Wenn er eine der Ungleichungen erfüllt.`, r`Wenn er auf einer Grenzgeraden liegt.`, r`Wenn seine Koordinaten ganzzahlig sind.`], e: r`Er liegt im Planungspolygon.` },
      { l: 1, q: r`Was sind die Eckpunkte des Planungspolygons?`, a: [r`Schnittpunkte von zwei Grenzgeraden`, r`Schnittpunkte mit dem Ursprung`, r`Die Mittelpunkte der Kanten`, r`Beliebige zulässige Punkte`], e: r`Dort stossen zwei Kanten zusammen.` },
      { l: 1, q: r`Welchen Bereich beschreiben $x\ge0$ und $y\ge0$ zusammen?`, a: [r`Den ersten Quadranten (mit den Achsen)`, r`Die ganze Ebene`, r`Nur den Ursprung`, r`Die obere Halbebene`], e: r`Rechts der $y$-Achse und über der $x$-Achse.` },
      { l: 1, q: r`Ist $(1\,|\,1)$ zulässig für $x\ge0$, $y\ge0$, $x+y\le4$?`, a: [r`Ja, alle drei Ungleichungen sind erfüllt.`, r`Nein, denn $1+1\ne4$.`, r`Nein, der Punkt liegt nicht auf einer Grenzgeraden.`, r`Nur für ganzzahlige Aufgaben.`], e: r`$1\ge0$, $1\ge0$ und $2\le4$.` },
      { l: 1, q: r`Ist $(3\,|\,2)$ zulässig für $x\ge0$, $y\ge0$, $x+y\le4$?`, a: [r`Nein, denn $3+2>4$.`, r`Ja, denn beide Koordinaten sind positiv.`, r`Ja, denn $3\le4$ und $2\le4$.`, r`Das hängt von der Zielfunktion ab.`], e: r`Eine verletzte Ungleichung genügt.` },
      { l: 1, q: r`Ein zulässiger Punkt muss nur eine der Ungleichungen erfüllen.`, tf: false, e: r`Er muss alle zugleich erfüllen.` },
      { l: 1, q: r`Wie berechnet man einen Eckpunkt?`, a: [r`Man löst das Gleichungssystem aus den beiden Grenzgeraden.`, r`Man setzt $x=0$ und $y=0$.`, r`Man addiert alle Ungleichungen.`, r`Man liest den grössten $x$-Wert ab.`], e: r`Der Eckpunkt liegt auf beiden Geraden.` },
      { l: 1, q: r`Warum stehen in Anwendungen fast immer $x\ge0$ und $y\ge0$?`, a: [r`Weil Stückzahlen und Mengen nicht negativ sein können.`, r`Weil negative Zahlen verboten sind.`, r`Weil die Zielfunktion sonst nicht linear ist.`, r`Weil man sonst nicht zeichnen kann.`], e: r`Die Nichtnegativitätsbedingungen.` },
      { l: 1, q: r`Welches Planungspolygon beschreiben $x\ge0$, $y\ge0$ und $x+y\le4$?`, a: [r`Das Dreieck mit den Ecken $(0\,|\,0)$, $(4\,|\,0)$ und $(0\,|\,4)$`, r`Das Quadrat mit der Seitenlänge 4`, r`Die Gerade von $(4\,|\,0)$ nach $(0\,|\,4)$`, r`Den ganzen ersten Quadranten`], e: r`Die Gerade $x+y=4$ schneidet vom ersten Quadranten ein Dreieck ab.` },
      { l: 1, q: r`Ein Planungspolygon hat keine einspringenden Ecken.`, tf: true, e: r`Als Durchschnitt von Halbebenen ist es konvex.` },

      { l: 2, q: r`In welchem Punkt schneiden sich die Grenzgeraden $x+y=4$ und $x=3$?`, a: [r`In $(3\,|\,1)$`, r`In $(3\,|\,4)$`, r`In $(1\,|\,3)$`, r`In $(3\,|\,7)$`], e: r`$3+y=4$.` },
      { l: 2, q: r`In welchem Punkt schneiden sich die Grenzgeraden $x+2y=8$ und $3x+y=9$?`, a: [r`In $(2\,|\,3)$`, r`In $(3\,|\,2)$`, r`In $(4\,|\,2)$`, r`In $(1\,|\,6)$`], e: r`$y=9-3x$ einsetzen: $x+18-6x=8$.` },
      { l: 2, q: r`Wie viele Ecken hat das Planungspolygon zu $x\ge0$, $y\ge0$, $x+y\le4$, $x\le3$?`, a: [r`$4$`, r`$3$`, r`$5$`, r`$6$`], e: r`$(0|0)$, $(3|0)$, $(3|1)$ und $(0|4)$.` },
      { l: 2, q: r`Ein Tisch ($x$) braucht 4 Stunden Arbeit, ein Stuhl ($y$) 2 Stunden; es stehen 40 Stunden zur Verfügung. Welche Ungleichung passt?`, a: [r`$4x+2y\le40$`, r`$4x+2y\ge40$`, r`$2x+4y\le40$`, r`$x+y\le40$`], e: r`Verbrauchte Stunden höchstens 40.` },
      { l: 2, q: r`Wie schreibt man «mindestens 3 Stühle» ($y$ ist die Anzahl Stühle)?`, a: [r`$y\ge3$`, r`$y\le3$`, r`$y>3$`, r`$y=3$`], e: r`«Mindestens» schliesst die 3 ein.` },
      { l: 2, q: r`Jeder Schnittpunkt von zwei Grenzgeraden ist ein Eckpunkt des Planungspolygons.`, tf: false, e: r`Nur, wenn er auch alle anderen Ungleichungen erfüllt. Manche Schnittpunkte liegen ausserhalb.` },
      { l: 2, q: r`Welche Fläche hat das Planungspolygon mit den Ecken $(0\,|\,0)$, $(3\,|\,0)$, $(3\,|\,1)$ und $(0\,|\,4)$?`, a: [r`$7.5$`, r`$12$`, r`$6$`, r`$8$`], e: r`Ein Trapez mit den parallelen Seiten 4 und 1 und der Höhe 3.` },
      { l: 2, q: r`Welche Lösungsmenge hat das System $x+y\le2$, $x+y\ge5$?`, a: [r`Sie ist leer.`, r`Ein Streifen`, r`Ein Dreieck`, r`Eine Gerade`], e: r`$x+y$ kann nicht zugleich höchstens 2 und mindestens 5 sein.` },
      { l: 2, q: r`Welches System hat einen unbeschränkten zulässigen Bereich?`, a: [r`$x\ge0$, $y\ge0$, $x+y\ge2$`, r`$x\ge0$, $y\ge0$, $x+y\le2$`, r`$x\ge0$, $y\ge0$, $x\le2$, $y\le2$`, r`$x\ge1$, $x\le2$, $y\ge1$, $y\le2$`], e: r`Nach rechts oben gibt es keine Grenze.` },
      { l: 2, q: r`Wie schreibt man «$x$ ist höchstens doppelt so gross wie $y$»?`, a: [r`$x\le2y$`, r`$x\ge2y$`, r`$2x\le y$`, r`$x\le y+2$`], e: r`Das Doppelte von $y$ ist die Obergrenze für $x$.` },

      { l: 3, q: r`Welche Ecken hat das Planungspolygon zu ` + SYS + r`?`, a: [r`$(0\,|\,0)$, $(3\,|\,0)$, $(2\,|\,3)$, $(0\,|\,4)$`, r`$(0\,|\,0)$, $(8\,|\,0)$, $(2\,|\,3)$, $(0\,|\,9)$`, r`$(0\,|\,0)$, $(3\,|\,0)$, $(0\,|\,4)$`, r`$(0\,|\,0)$, $(3\,|\,0)$, $(3\,|\,2.5)$, $(0\,|\,4)$`], e: r`Auf jeder Achse gilt der kleinere Achsenabschnitt; dazu der Schnittpunkt der beiden schrägen Geraden.` },
      { l: 3, q: r`Wie viele Punkte mit ganzzahligen Koordinaten liegen im Dreieck $x\ge0$, $y\ge0$, $x+y\le3$ (Rand mitgezählt)?`, a: [r`$10$`, r`$6$`, r`$9$`, r`$16$`], e: r`$4+3+2+1$.` },
      { l: 3, q: r`Fügt man einem System eine weitere Ungleichung hinzu, so kann der zulässige Bereich nicht grösser werden.`, tf: true, e: r`Jede zusätzliche Bedingung kann nur Punkte ausschliessen.` },
      { l: 3, q: r`Welche Ungleichung des Systems $x\ge0$, $y\ge0$, $x+y\le4$, $x+y\le10$ ist überflüssig?`, a: [r`$x+y\le10$`, r`$x+y\le4$`, r`$x\ge0$`, r`Keine`], e: r`Wer $x+y\le4$ erfüllt, erfüllt $x+y\le10$ von selbst.` },
      { l: 3, q: r`Im System ` + SYS + r` ist $(2\,|\,3)$ ein Eckpunkt. Welche Bedingungen sind dort genau ausgeschöpft?`, a: [r`$x+2y\le8$ und $3x+y\le9$`, r`$x\ge0$ und $y\ge0$`, r`Nur $x+2y\le8$`, r`Alle vier`], e: r`$2+6=8$ und $6+3=9$: In beiden gilt das Gleichheitszeichen.` },
      { l: 3, q: PG + r`Welche Fläche hat es?`, a: [r`$8.5$`, r`$12$`, r`$6$`, r`$17$`], e: r`Zerlegt in das Dreieck $(0|0),(3|0),(2|3)$ mit der Fläche 4.5 und das Dreieck $(0|0),(2|3),(0|4)$ mit der Fläche 4.` },
      { l: 3, q: r`Welchen Bereich beschreibt $10\le x+y\le15$ zusammen mit $x\ge0$, $y\ge0$?`, a: [r`Einen Streifen zwischen zwei parallelen Geraden im ersten Quadranten`, r`Ein Dreieck`, r`Einen unbeschränkten Bereich`, r`Die leere Menge`], e: r`Zwischen $x+y=10$ und $x+y=15$: ein Trapez.` },
      { l: 3, q: r`Wie viele Ecken kann ein Planungspolygon aus 5 Ungleichungen höchstens haben?`, a: [r`$5$`, r`$10$`, r`$4$`, r`$6$`], e: r`Jede Ungleichung liefert höchstens eine Kante, und ein Vieleck hat gleich viele Ecken wie Kanten.` }
    ],

    // ───────────────────────── Zielfunktion und Optimum ─────────────────────────
    opt: [
      { l: 1, q: r`Was ist die Zielfunktion?`, a: [r`Die Grösse $Z=p\,x+q\,y$, die möglichst gross oder möglichst klein werden soll.`, r`Eine der Ungleichungen.`, r`Die Fläche des Planungspolygons.`, r`Die längste Kante des Polygons.`], e: r`Zum Beispiel der Gewinn oder die Kosten.` },
      { l: 1, q: r`Was ist eine Niveaulinie?`, a: [r`Eine Gerade, auf der $Z$ überall denselben Wert hat.`, r`Eine Kante des Planungspolygons.`, r`Die $x$-Achse.`, r`Die Verbindung zweier Eckpunkte.`], e: r`Wie eine Höhenlinie auf der Landkarte.` },
      { l: 1, q: r`Wie liegen die Niveaulinien zu verschiedenen Werten von $Z$ zueinander?`, a: [r`Parallel`, r`Senkrecht`, r`Sie schneiden sich im Ursprung.`, r`Beliebig`], e: r`Sie haben alle dieselbe Steigung $-\frac pq$.` },
      { l: 1, q: r`Wo liegt das Optimum bei der linearen Optimierung?`, a: [r`In einem Eckpunkt des Planungspolygons (oder auf einer ganzen Kante)`, r`Immer im Innern des Polygons`, r`Immer im Ursprung`, r`Im Schwerpunkt des Polygons`], e: r`Die Niveaulinie verlässt das Polygon zuletzt in einer Ecke.` },
      { l: 1, q: r`Welchen Wert hat $Z=3x+2y$ im Punkt $(2\,|\,1)$?`, a: [r`$8$`, r`$7$`, r`$5$`, r`$6$`], e: r`$3\cdot2+2\cdot1$.` },
      { l: 1, q: r`Wie findet man das Optimum rechnerisch?`, a: [r`Man berechnet $Z$ in allen Eckpunkten und vergleicht.`, r`Man berechnet $Z$ im Ursprung.`, r`Man addiert alle Ungleichungen.`, r`Man nimmt den Eckpunkt mit dem grössten $x$.`], e: r`Der grösste (oder kleinste) Wert gewinnt.` },
      { l: 1, q: r`Was kennzeichnet eine lineare Optimierungsaufgabe?`, a: [r`Eine lineare Zielfunktion und lineare Ungleichungen als Bedingungen`, r`Eine quadratische Zielfunktion`, r`Genau eine Ungleichung`, r`Eine Gleichung mit einer Unbekannten`], e: r`Alles sind Geraden und Halbebenen.` },
      { l: 1, q: r`Das Maximum von $Z$ liegt immer im Innern des Planungspolygons.`, tf: false, e: r`Im Innern lässt sich die Niveaulinie immer noch weiterschieben. Das Optimum liegt am Rand.` },
      { l: 1, q: r`Ein Polygon hat die Ecken $(0\,|\,0)$, $(4\,|\,0)$ und $(0\,|\,4)$. Welches ist der grösste Wert von $Z=x+y$?`, a: [r`$4$`, r`$8$`, r`$0$`, r`$2$`], e: r`In $(4|0)$ und in $(0|4)$ ist $Z=4$.` },
      { l: 1, q: r`Wie verschiebt man die Niveaulinie, um das Maximum zu finden?`, a: [r`Parallel, bis sie das Polygon gerade noch berührt.`, r`Man dreht sie um den Ursprung.`, r`Bis sie durch den Ursprung geht.`, r`Bis sie senkrecht steht.`], e: r`Die letzte Berührung zeigt den optimalen Punkt.` },
      { l: 1, q: r`Was sind die Nebenbedingungen?`, a: [r`Die Ungleichungen, die den zulässigen Bereich festlegen.`, r`Die Werte von $Z$ in den Ecken.`, r`Die Niveaulinien.`, r`Die Koordinatenachsen.`], e: r`Zum Beispiel begrenzte Arbeitszeit oder begrenztes Material.` },
      { l: 1, q: r`Für $Z=p\,x+q\,y$ ist $Z$ im Ursprung immer 0.`, tf: true, e: r`$p\cdot0+q\cdot0$.` },

      { l: 2, q: PG + r`Wo ist $Z=2x+y$ maximal?`, a: [r`In $(2\,|\,3)$ mit $Z=7$`, r`In $(3\,|\,0)$ mit $Z=6$`, r`In $(0\,|\,4)$ mit $Z=4$`, r`In $(0\,|\,0)$ mit $Z=0$`], e: r`Werte in den Ecken: 0, 6, 7 und 4.` },
      { l: 2, q: PG + r`Wo ist $Z=x+3y$ maximal?`, a: [r`In $(0\,|\,4)$ mit $Z=12$`, r`In $(2\,|\,3)$ mit $Z=11$`, r`In $(3\,|\,0)$ mit $Z=3$`, r`In $(2\,|\,3)$ mit $Z=12$`], e: r`Werte in den Ecken: 0, 3, 11 und 12.` },
      { l: 2, q: r`Welche Steigung haben die Niveaulinien von $Z=3x+2y$?`, a: [r`$-\frac32$`, r`$\frac32$`, r`$-\frac23$`, r`$3$`], e: r`$y=-\frac32\,x+\frac Z2$.` },
      { l: 2, q: PG + r`Wo ist $Z=2x+y$ minimal?`, a: [r`In $(0\,|\,0)$ mit $Z=0$`, r`In $(0\,|\,4)$ mit $Z=4$`, r`In $(3\,|\,0)$ mit $Z=6$`, r`Es gibt kein Minimum.`], e: r`Der kleinste der vier Eckwerte.` },
      { l: 2, q: r`Die Niveaulinien sind parallel zu einer Kante des Polygons, und dort liegt das Optimum. Was folgt?`, a: [r`Alle Punkte dieser Kante sind optimal.`, r`Es gibt kein Optimum.`, r`Nur der Mittelpunkt der Kante ist optimal.`, r`Das Optimum liegt im Innern.`], e: r`Die Niveaulinie berührt das Polygon zuletzt entlang der ganzen Kante.` },
      { l: 2, q: r`Ändert man die Zielfunktion, so kann das Optimum in eine andere Ecke wandern.`, tf: true, e: r`Die Niveaulinien bekommen eine andere Steigung und verlassen das Polygon an einer anderen Stelle.` },
      { l: 2, q: r`Ein Tisch ($x$) bringt 30 Fr. Gewinn, ein Stuhl ($y$) 20 Fr. Wie lautet die Zielfunktion?`, a: [r`$Z=30x+20y$`, r`$Z=20x+30y$`, r`$Z=x+y$`, r`$Z=50\,x\,y$`], e: r`Gewinn pro Stück mal Stückzahl, addiert.` },
      { l: 2, q: r`Ein Polygon hat die Ecken $(0\,|\,0)$, $(4\,|\,0)$ und $(0\,|\,4)$. Wo ist $Z=2x+2y$ maximal?`, a: [r`Auf der ganzen Kante von $(4\,|\,0)$ nach $(0\,|\,4)$, mit $Z=8$`, r`Nur in $(4\,|\,0)$`, r`Nur in $(0\,|\,4)$`, r`Im Punkt $(4\,|\,4)$`], e: r`Die Niveaulinien sind parallel zu dieser Kante.` },
      { l: 2, q: r`Die Niveaulinie von $Z=5x+4y$ geht durch $(4\,|\,0)$. Wo schneidet sie die $y$-Achse?`, a: [r`Bei $y=5$`, r`Bei $y=4$`, r`Bei $y=20$`, r`Bei $y=1.25$`], e: r`Dort ist $Z=20$; mit $x=0$ folgt $4y=20$.` },
      { l: 2, q: r`Der zulässige Bereich ist $x\ge0$, $y\ge0$, $x+y\ge2$. Welches Maximum hat $Z=x+y$?`, a: [r`Es gibt keines; $Z$ kann beliebig gross werden.`, r`$2$`, r`$0$`, r`$4$`], e: r`Der Bereich ist nach rechts oben unbeschränkt. Ein Minimum gibt es: $Z=2$.` },

      { l: 3, q: r`Welches ist der grösste Wert von $Z=2x+3y$ unter ` + SYS + r`?`, a: [r`$13$`, r`$12$`, r`$6$`, r`$18$`], e: r`Ecken $(0|0)$, $(3|0)$, $(2|3)$, $(0|4)$ mit den Werten 0, 6, 13 und 12.` },
      { l: 3, q: PG + r`Für welche Zielfunktion ist $(3\,|\,0)$ optimal (Maximum)?`, a: [r`$Z=5x+y$`, r`$Z=x+y$`, r`$Z=x+3y$`, r`$Z=2x+y$`], e: r`$Z=5x+y$ hat die Eckwerte 0, 15, 13 und 4.` },
      { l: 3, q: r`Hat eine lineare Optimierungsaufgabe mit beschränktem Planungspolygon eine optimale Lösung, so gibt es auch eine in einem Eckpunkt.`, tf: true, e: r`Liegt das Optimum auf einer ganzen Kante, so gehören deren Endpunkte dazu.` },
      { l: 3, q: PG + r`Für welche $p$ ist $(2\,|\,3)$ ein Maximum von $Z=p\,x+y$?`, a: [r`Für $\frac12\le p\le3$`, r`Für $p\ge3$`, r`Für $p\le\frac12$`, r`Für alle $p>0$`], e: r`Die Niveaulinie (Steigung $-p$) muss zwischen den beiden Kanten bei $(2|3)$ liegen; diese haben die Steigungen $-\frac12$ und $-3$.` },
      { l: 3, q: r`Welches ist der kleinste Wert von $Z=2x+3y$ unter $x\ge0$, $y\ge0$, $x+y\ge4$, $x+3y\ge6$?`, a: [r`$9$`, r`$12$`, r`$8$`, r`$0$`], e: r`Ecken $(6|0)$, $(3|1)$ und $(0|4)$ mit den Werten 12, 9 und 12.` },
      { l: 3, q: r`Das Optimum liegt im Punkt $(2.5\,|\,3.5)$, gesucht sind aber ganze Stückzahlen. Dann ist der gerundete Punkt $(3\,|\,4)$ die beste ganzzahlige Lösung.`, tf: false, e: r`Der gerundete Punkt kann ausserhalb des Polygons liegen. Man prüft die zulässigen Gitterpunkte in der Nähe.` },
      { l: 3, q: r`Im Optimum ist eine der Bedingungen nicht ausgeschöpft. Man lockert sie ein wenig. Was geschieht mit dem Optimum?`, a: [r`Nichts.`, r`Es wird besser.`, r`Es wird schlechter.`, r`Es wandert in den Ursprung.`], e: r`Diese Bedingung begrenzt die Lösung gar nicht; es hat dort noch Reserve.` },
      { l: 3, q: r`Ein Polygon hat die Ecken $(0\,|\,0)$, $(4\,|\,0)$, $(4\,|\,2)$, $(2\,|\,4)$ und $(0\,|\,4)$. Welches ist der grösste Wert von $Z=3x+2y$?`, a: [r`$16$`, r`$14$`, r`$12$`, r`$20$`], e: r`Eckwerte 0, 12, 16, 14 und 8; das Maximum liegt in $(4|2)$.` }
    ]
  };
})();
