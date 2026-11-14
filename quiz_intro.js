// quiz_intro.js — Quizfragen zu «Funktionen: Einführung» (wird von 116_quiz.js bei Bedarf geladen)
// Je Ansicht 30 Fragen: 12 × Stufe 1 (Grundwissen), 10 × Stufe 2 (Verständnis), 8 × Stufe 3 (Knacknuss).
// Die Reihenfolge hier ist die Reihenfolge im Quiz und auf dem Arbeitsblatt (Frage 1 bis 30).
// {l, q, a, e}: a[0] ist die richtige Antwort (Anzeige gemischt)   ·   {l, q, tf, e}: Aussage, tf = wahr/falsch
(function () {
  const r = String.raw;
  (window.QUIZ_DATA = window.QUIZ_DATA || {}).intro = {

    // ───────────────────────── Zuordnung und Wertetabelle ─────────────────────────
    map: [
      { l: 1, q: r`Was ordnet eine Funktion jeder Stelle $x$ zu?`, a: [r`Genau einen Wert $y=f(x)$.`, r`Mindestens einen Wert.`, r`Höchstens zwei Werte.`, r`Beliebig viele Werte.`], e: r`Das ist das Kennzeichen einer Funktion: Zu jedem $x$ gehört genau ein Funktionswert.` },
      { l: 1, q: r`$f(x)=2x+1$. Wie gross ist $f(3)$?`, a: [r`$7$`, r`$6$`, r`$5$`, r`$9$`], e: r`Einsetzen: $2\cdot3+1=7$.` },
      { l: 1, q: r`$f(x)=x^2$. Wie gross ist $f(-3)$?`, a: [r`$9$`, r`$-9$`, r`$6$`, r`$-6$`], e: r`$(-3)^2=(-3)\cdot(-3)=9$. Die negative Zahl gehört in Klammern.` },
      { l: 1, q: r`Was bedeutet die Schreibweise $f(2)=5$?`, a: [r`An der Stelle 2 hat die Funktion den Wert 5.`, r`$f$ mal 2 ergibt 5.`, r`An der Stelle 5 hat die Funktion den Wert 2.`, r`2 und 5 sind Nullstellen.`], e: r`In der Klammer steht die Stelle, rechts vom Gleichheitszeichen der Funktionswert.` },
      { l: 1, q: r`In der Wertetabelle steht die Zeile $x=2$, $f(x)=5$. Welcher Punkt des Graphen gehört dazu?`, a: [r`$(2\,|\,5)$`, r`$(5\,|\,2)$`, r`$(2\,|\,2)$`, r`$(5\,|\,5)$`], e: r`Zuerst die Stelle $x$, dann der Funktionswert: $(x\,|\,f(x))$.` },
      { l: 1, q: r`In einer Wertetabelle steht zu jeder gewählten Stelle $x$ der zugehörige Funktionswert $f(x)$.`, tf: true, e: r`Jede Zeile (oder Spalte) der Tabelle ist ein Punkt des Graphen.` },
      { l: 1, q: r`$f(x)=3x-2$. Wie gross ist $f(0)$?`, a: [r`$-2$`, r`$3$`, r`$0$`, r`$1$`], e: r`$3\cdot0-2=-2$.` },
      { l: 1, q: r`Wie nennt man die Zahl $x$, die man in $f(x)$ einsetzt?`, a: [r`Stelle (oder Argument)`, r`Funktionswert`, r`Steigung`, r`Graph`], e: r`Man setzt eine Stelle ein und erhält einen Funktionswert.` },
      { l: 1, q: r`Liegt der Punkt $P(1\,|\,4)$ auf dem Graphen von $f(x)=x+3$?`, a: [r`Ja, denn $f(1)=4$.`, r`Nein, denn $f(1)=3$.`, r`Nein, denn $f(4)=1$ müsste gelten.`, r`Ja, denn $1+4=5$.`], e: r`Ein Punkt liegt auf dem Graphen, wenn seine $y$-Koordinate der Funktionswert an seiner $x$-Koordinate ist.` },
      { l: 1, q: r`$f(x)=\frac{x}{2}$. Welcher Wert gehört zu $x=6$?`, a: [r`$3$`, r`$12$`, r`$4$`, r`$8$`], e: r`$\frac62=3$.` },
      { l: 1, q: r`Zwei verschiedene Stellen können denselben Funktionswert haben.`, tf: true, e: r`Zum Beispiel ist bei $f(x)=x^2$ sowohl $f(2)=4$ als auch $f(-2)=4$.` },
      { l: 1, q: r`Woraus besteht der Graph einer Funktion?`, a: [r`Aus allen Punkten $(x\,|\,f(x))$.`, r`Nur aus den Punkten der Wertetabelle.`, r`Aus den Stellen $x$ auf der $x$-Achse.`, r`Aus den Funktionswerten auf der $y$-Achse.`], e: r`Die Wertetabelle zeigt nur einige dieser Punkte; der Graph enthält alle.` },

      { l: 2, q: r`$f(x)=x^2-1$. Für welche $x$ ist $f(x)=3$?`, a: [r`Für $x=2$ und $x=-2$`, r`Nur für $x=2$`, r`Für $x=4$`, r`Für $x=8$`], e: r`$x^2-1=3$ heisst $x^2=4$, und das hat zwei Lösungen.` },
      { l: 2, q: r`Eine Funktion kann zu einer Stelle $x$ zwei verschiedene Werte haben.`, tf: false, e: r`Zu jeder Stelle gehört genau ein Wert. Umgekehrt dürfen aber mehrere Stellen denselben Wert haben.` },
      { l: 2, q: r`Zu den Stellen $0,\ 1,\ 2,\ 3$ gehören die Werte $1,\ 3,\ 5,\ 7$. Welche Vorschrift passt?`, a: [r`$f(x)=2x+1$`, r`$f(x)=x+1$`, r`$f(x)=3x$`, r`$f(x)=x^2+1$`], e: r`Die Werte wachsen jeweils um 2, und bei $x=0$ ist der Wert 1.` },
      { l: 2, q: r`$f(x)=2x+1$. Was ist $f(a+1)$?`, a: [r`$2a+3$`, r`$2a+1$`, r`$2a+2$`, r`$a+3$`], e: r`$2\cdot(a+1)+1=2a+2+1$. Die ganze Klammer wird für $x$ eingesetzt.` },
      { l: 2, q: r`Für $f(x)=x^2$ gilt $f(2)+f(3)=f(5)$.`, tf: false, e: r`$f(2)+f(3)=4+9=13$, aber $f(5)=25$.` },
      { l: 2, q: r`$f(x)=\frac1x$. Welche Stelle darf man nicht einsetzen?`, a: [r`$0$`, r`$1$`, r`$-1$`, r`Alle Stellen sind erlaubt.`], e: r`Durch 0 kann man nicht teilen.` },
      { l: 2, q: r`$f(x)=3x$. Wie ändert sich der Funktionswert, wenn $x$ um 1 wächst?`, a: [r`Er wächst um 3.`, r`Er wächst um 1.`, r`Er verdreifacht sich.`, r`Er bleibt gleich.`], e: r`$f(x+1)=3x+3=f(x)+3$.` },
      { l: 2, q: r`$f(x)=x^2$. Was geschieht mit dem Funktionswert, wenn man $x$ verdoppelt?`, a: [r`Er wird viermal so gross.`, r`Er wird doppelt so gross.`, r`Er wird um 2 grösser.`, r`Er bleibt gleich.`], e: r`$(2x)^2=4x^2$.` },
      { l: 2, q: r`Welche Zuordnung ist keine Funktion?`, a: [r`Jeder Zahl $x>0$ werden die Zahlen $y$ mit $y^2=x$ zugeordnet.`, r`Jeder Zahl wird ihr Doppeltes zugeordnet.`, r`Jeder Zahl wird ihr Quadrat zugeordnet.`, r`Jeder Zahl wird die Zahl 5 zugeordnet.`], e: r`Zu $x=4$ gehörten dann $y=2$ und $y=-2$, also zwei Werte.` },
      { l: 2, q: r`$f(x)=5$ für alle $x$. Wie gross ist $f(100)$?`, a: [r`$5$`, r`$100$`, r`$500$`, r`$0$`], e: r`Eine konstante Funktion hat an jeder Stelle denselben Wert.` },

      { l: 3, q: r`$f(x)=2x+1$. Wie gross ist $f(f(1))$?`, a: [r`$7$`, r`$5$`, r`$9$`, r`$4$`], e: r`Von innen nach aussen: $f(1)=3$, dann $f(3)=7$.` },
      { l: 3, q: r`$f(x)=x^2$. Was ergibt $f(x+1)-f(x)$?`, a: [r`$2x+1$`, r`$1$`, r`$2x$`, r`$x^2+1$`], e: r`$(x+1)^2-x^2=x^2+2x+1-x^2$.` },
      { l: 3, q: r`Die Stellen wachsen jeweils um 1, die Funktionswerte jeweils um denselben Betrag. Welcher Funktionstyp passt dazu?`, a: [r`Eine lineare Funktion.`, r`Eine quadratische Funktion.`, r`Eine Exponentialfunktion.`, r`Keiner; das ist Zufall.`], e: r`Gleiche Zunahme pro Schritt ist das Kennzeichen von $f(x)=mx+q$.` },
      { l: 3, q: r`Sind in einer Wertetabelle alle Funktionswerte verschieden, so nimmt die Funktion keinen Wert zweimal an.`, tf: false, e: r`Die Tabelle zeigt nur einzelne Stellen. Zwischen oder ausserhalb davon kann sich ein Wert wiederholen.` },
      { l: 3, q: r`$f(x)=x^2-4x$. An welcher anderen Stelle hat $f$ denselben Wert wie bei $x=1$?`, a: [r`Bei $x=3$`, r`Bei $x=-1$`, r`Bei $x=4$`, r`Bei $x=0$`], e: r`$f(1)=-3$ und $f(3)=9-12=-3$. Die Stellen liegen symmetrisch zu $x=2$.` },
      { l: 3, q: r`Für welche Funktion gilt $f(2x)=2\cdot f(x)$ für alle $x$?`, a: [r`$f(x)=3x$`, r`$f(x)=x+1$`, r`$f(x)=x^2$`, r`$f(x)=2^x$`], e: r`$3\cdot(2x)=2\cdot(3x)$. Das gilt nur für proportionale Funktionen $f(x)=mx$.` },
      { l: 3, q: r`Worin unterscheiden sich $f(x)=\frac{x^2-1}{x-1}$ und $g(x)=x+1$?`, a: [r`Sie stimmen überall überein, ausser bei $x=1$: Dort ist $f$ nicht definiert.`, r`Gar nicht.`, r`Sie stimmen nirgends überein.`, r`Sie stimmen nur bei $x=0$ überein.`], e: r`Für $x\neq1$ lässt sich kürzen: $\frac{(x-1)(x+1)}{x-1}=x+1$.` },
      { l: 3, q: r`Eine Wertetabelle läuft von 0 bis 3 mit dem Abstand $h=0.5$ (beide Ränder inbegriffen). Wie viele Stellen hat sie?`, a: [r`$7$`, r`$6$`, r`$5$`, r`$8$`], e: r`$0,\ 0.5,\ 1,\ 1.5,\ 2,\ 2.5,\ 3$: sechs Schritte, aber sieben Stellen.` }
    ],

    // ───────────────────────── Funktionsbegriff und Eigenschaften ─────────────────────────
    def: [
      { l: 1, q: r`Woran erkennt man am Bild, dass eine Kurve ein Funktionsgraph ist?`, a: [r`Jede senkrechte Gerade trifft sie höchstens einmal.`, r`Jede waagrechte Gerade trifft sie höchstens einmal.`, r`Jede senkrechte Gerade trifft sie mindestens einmal.`, r`Sie schneidet beide Achsen.`], e: r`Zu jedem $x$ darf es nur einen Punkt geben.` },
      { l: 1, q: r`Was ist der Definitionsbereich einer Funktion?`, a: [r`Alle Zahlen $x$, die man einsetzen darf.`, r`Alle Werte, die herauskommen.`, r`Alle Nullstellen.`, r`Der Abschnitt auf der $y$-Achse.`], e: r`Der Definitionsbereich gehört zur $x$-Achse.` },
      { l: 1, q: r`Was ist der Wertebereich einer Funktion?`, a: [r`Alle Funktionswerte, die vorkommen.`, r`Alle Zahlen, die man einsetzen darf.`, r`Der grösste Funktionswert.`, r`Alle Stellen mit $f(x)=0$.`], e: r`Der Wertebereich gehört zur $y$-Achse.` },
      { l: 1, q: r`Was ist eine Nullstelle?`, a: [r`Eine Stelle $x$ mit $f(x)=0$.`, r`Der Wert $f(0)$.`, r`Der höchste Punkt des Graphen.`, r`Die Stelle $x=0$.`], e: r`An einer Nullstelle trifft der Graph die $x$-Achse.` },
      { l: 1, q: r`Was ist der $y$-Achsenabschnitt?`, a: [r`Der Wert $f(0)$.`, r`Die Lösung von $f(x)=0$.`, r`Der grösste Funktionswert.`, r`Die Steigung des Graphen.`], e: r`Dort schneidet der Graph die $y$-Achse.` },
      { l: 1, q: r`Ein Kreis ist der Graph einer Funktion.`, tf: false, e: r`Eine senkrechte Gerade durch das Innere trifft den Kreis zweimal.` },
      { l: 1, q: r`Was ist ein Hochpunkt?`, a: [r`Ein Punkt, der höher liegt als alle Punkte in seiner Umgebung.`, r`Der Schnittpunkt mit der $y$-Achse.`, r`Eine Nullstelle.`, r`Der Punkt am rechten Rand des Bildes.`], e: r`Links davon steigt der Graph, rechts davon fällt er.` },
      { l: 1, q: r`Wann sagt man, ein Graph steigt?`, a: [r`Wenn die Funktionswerte grösser werden, während $x$ wächst.`, r`Wenn die Funktionswerte positiv sind.`, r`Wenn der Graph über der $x$-Achse liegt.`, r`Wenn $x$ positiv ist.`], e: r`Man liest den Graphen von links nach rechts.` },
      { l: 1, q: r`Welchen Wertebereich hat $f(x)=x^2$?`, a: [r`Alle $y\ge0$`, r`Alle reellen Zahlen`, r`Alle $y>0$`, r`Alle $y\le0$`], e: r`Ein Quadrat ist nie negativ, und 0 wird bei $x=0$ erreicht.` },
      { l: 1, q: r`Welchen Definitionsbereich hat $f(x)=\sqrt{x}$?`, a: [r`Alle $x\ge0$`, r`Alle reellen Zahlen`, r`Alle $x>0$`, r`Alle $x\le0$`], e: r`Aus negativen Zahlen lässt sich keine (reelle) Wurzel ziehen; $\sqrt0=0$ ist erlaubt.` },
      { l: 1, q: r`Welche Nullstelle hat $f(x)=x-3$?`, a: [r`$x=3$`, r`$x=-3$`, r`$x=0$`, r`Keine.`], e: r`$x-3=0$ für $x=3$.` },
      { l: 1, q: r`Jede Funktion hat mindestens eine Nullstelle.`, tf: false, e: r`Zum Beispiel ist $f(x)=x^2+1$ überall mindestens 1.` },

      { l: 2, q: r`Welchen Definitionsbereich hat $f(x)=\frac{1}{x-2}$?`, a: [r`Alle $x$ ausser 2`, r`Alle $x$ ausser 0`, r`Alle $x$ ausser $-2$`, r`Alle $x>2$`], e: r`Der Nenner darf nicht 0 sein.` },
      { l: 2, q: r`Kann ein Funktionsgraph die $y$-Achse zweimal schneiden?`, a: [r`Nein, zu $x=0$ gibt es höchstens einen Wert.`, r`Ja, beliebig oft.`, r`Ja, aber höchstens zweimal.`, r`Nur, wenn er eine Nullstelle hat.`], e: r`Die $y$-Achse ist selbst eine senkrechte Gerade.` },
      { l: 2, q: r`Kann ein Funktionsgraph die $x$-Achse mehrmals schneiden?`, a: [r`Ja, eine Funktion kann mehrere Nullstellen haben.`, r`Nein, nie.`, r`Höchstens zweimal.`, r`Nur, wenn er eine Gerade ist.`], e: r`Mehrere Stellen dürfen denselben Wert 0 haben.` },
      { l: 2, q: r`Wo fällt der Graph von $f(x)=x^2-4$?`, a: [r`Für $x<0$`, r`Für $x>0$`, r`Zwischen $-2$ und $2$`, r`Nirgends`], e: r`Die Parabel fällt bis zum Tiefpunkt bei $x=0$ und steigt danach.` },
      { l: 2, q: r`An einem Hochpunkt hat die Funktion ihren grössten Wert überhaupt.`, tf: false, e: r`Ein Hochpunkt ist nur in seiner Umgebung der höchste Punkt. Anderswo kann der Graph höher liegen.` },
      { l: 2, q: r`Welchen Wertebereich hat $f(x)=x^2+1$?`, a: [r`Alle $y\ge1$`, r`Alle $y\ge0$`, r`Alle reellen Zahlen`, r`Alle $y>1$`], e: r`Die Parabel ist um 1 nach oben verschoben; der kleinste Wert 1 wird bei $x=0$ erreicht.` },
      { l: 2, q: r`Die liegende Parabel $y^2=x$ ist kein Funktionsgraph, weil …`, a: [r`zu $x=4$ die beiden Werte $y=2$ und $y=-2$ gehören.`, r`sie die $y$-Achse nur einmal trifft.`, r`sie nur für $x\ge0$ existiert.`, r`sie keinen Hochpunkt hat.`], e: r`Eine senkrechte Gerade rechts der $y$-Achse trifft sie zweimal.` },
      { l: 2, q: r`Welchen Definitionsbereich hat $f(x)=\sqrt{x-3}$?`, a: [r`Alle $x\ge3$`, r`Alle $x\ge0$`, r`Alle $x>3$`, r`Alle $x\ge-3$`], e: r`Unter der Wurzel muss $x-3\ge0$ stehen.` },
      { l: 2, q: r`Welchen Tiefpunkt hat $f(x)=|x|$?`, a: [r`$(0\,|\,0)$`, r`Keinen.`, r`$(0\,|\,1)$`, r`$(1\,|\,0)$`], e: r`Der Betrag ist nie negativ und bei $x=0$ gleich 0.` },
      { l: 2, q: r`Eine waagrechte Gerade darf einen Funktionsgraphen mehrmals treffen.`, tf: true, e: r`Das bedeutet nur, dass mehrere Stellen denselben Funktionswert haben.` },

      { l: 3, q: r`Welchen Wertebereich hat $f(x)=\frac{1}{x^2+1}$?`, a: [r`$0<y\le1$`, r`$y\ge0$`, r`$y\le1$`, r`Alle reellen Zahlen`], e: r`Der Nenner ist mindestens 1, also ist der Bruch höchstens 1 und immer positiv; 0 wird nie erreicht.` },
      { l: 3, q: r`Welchen Definitionsbereich hat $f(x)=\sqrt{4-x^2}$?`, a: [r`$-2\le x\le2$`, r`$x\le2$`, r`$x\ge-2$`, r`Alle reellen Zahlen`], e: r`Es muss $4-x^2\ge0$ sein, also $x^2\le4$.` },
      { l: 3, q: r`Wann lässt sich aus dem Funktionswert eindeutig auf die Stelle zurückschliessen?`, a: [r`Wenn jede waagrechte Gerade den Graphen höchstens einmal trifft.`, r`Wenn jede senkrechte Gerade den Graphen höchstens einmal trifft.`, r`Wenn die Funktion eine Nullstelle hat.`, r`Immer.`], e: r`Dann gehört zu jedem Wert nur eine Stelle; die Funktion ist umkehrbar.` },
      { l: 3, q: r`Eine Funktion, deren Graph überall steigt, hat höchstens eine Nullstelle.`, tf: true, e: r`Nach einer Nullstelle sind alle Werte grösser als 0, davor alle kleiner.` },
      { l: 3, q: r`Wie viele Nullstellen kann $f(x)=x^2+c$ je nach $c$ haben?`, a: [r`Keine, eine oder zwei.`, r`Immer zwei.`, r`Keine oder zwei.`, r`Eine oder zwei.`], e: r`Für $c>0$ keine, für $c=0$ eine, für $c<0$ zwei.` },
      { l: 3, q: r`Worin unterscheiden sich $f(x)=\frac{x}{x}$ und $g(x)=1$?`, a: [r`$f$ ist bei $x=0$ nicht definiert.`, r`Gar nicht.`, r`$f$ hat überall den Wert 0.`, r`$f$ ist dasselbe wie $x$.`], e: r`Für $x\neq0$ ist $\frac xx=1$; bei 0 stünde $\frac00$ da.` },
      { l: 3, q: r`Welchen Wertebereich hat $f(x)=x^2-4x$?`, a: [r`Alle $y\ge-4$`, r`Alle $y\ge0$`, r`Alle $y\ge-2$`, r`Alle reellen Zahlen`], e: r`$x^2-4x=(x-2)^2-4$: Der Tiefpunkt ist $(2\,|\,-4)$.` },
      { l: 3, q: r`Ein Graph ohne Lücken und Sprünge hat zwei Hochpunkte. Dann liegt zwischen ihnen ein Tiefpunkt.`, tf: true, e: r`Nach dem ersten Hochpunkt fällt der Graph, vor dem zweiten steigt er wieder. Dazwischen liegt eine tiefste Stelle.` }
    ],

    // ───────────────────────── Anwendungen mit Einheiten ─────────────────────────
    app: [
      { l: 1, q: r`$s(t)=5t$ gibt den Weg in m nach $t$ Sekunden an. Was bedeutet $s(4)=20$?`, a: [r`Nach 4 s sind 20 m zurückgelegt.`, r`Nach 20 s sind 4 m zurückgelegt.`, r`Die Geschwindigkeit ist 20 m/s.`, r`4 m werden in 20 s zurückgelegt.`], e: r`In der Klammer steht die Zeit, das Ergebnis ist der Weg.` },
      { l: 1, q: r`$K(x)=10+2x$ gibt die Kosten in CHF für $x$ Minuten an. Was bedeutet die 10?`, a: [r`Die Grundgebühr (Kosten bei 0 Minuten).`, r`Den Preis pro Minute.`, r`Die Anzahl Minuten.`, r`Die höchsten Kosten.`], e: r`$K(0)=10$: Diese Kosten fallen an, auch wenn man nichts verbraucht.` },
      { l: 1, q: r`Was bedeutet die 2 in $K(x)=10+2x$?`, a: [r`Den Preis pro Minute.`, r`Die Grundgebühr.`, r`Die Anzahl Minuten.`, r`Die Kosten für 10 Minuten.`], e: r`Mit jeder zusätzlichen Minute steigen die Kosten um 2 CHF.` },
      { l: 1, q: r`$K(x)=10+2x$. Wie viel kosten 15 Minuten?`, a: [r`$40$ CHF`, r`$30$ CHF`, r`$27$ CHF`, r`$150$ CHF`], e: r`$10+2\cdot15=40$.` },
      { l: 1, q: r`$A(s)=s^2$ gibt die Fläche eines Quadrats mit der Seite $s$ in cm an. Was ist $A(6)$?`, a: [r`$36\ \text{cm}^2$`, r`$12\ \text{cm}^2$`, r`$36\ \text{cm}$`, r`$24\ \text{cm}^2$`], e: r`$6\cdot6=36$, und eine Fläche hat die Einheit $\text{cm}^2$.` },
      { l: 1, q: r`Im Weg-Zeit-Diagramm zu $s(t)$ steht die Zeit auf der waagrechten Achse.`, tf: true, e: r`Waagrecht steht die Grösse, die man vorgibt, senkrecht die Grösse, die davon abhängt.` },
      { l: 1, q: r`Welche Seitenlängen $s$ sind für das Quadrat sinnvoll?`, a: [r`Nur $s>0$`, r`Alle reellen Zahlen`, r`Nur ganze Zahlen`, r`Nur negative Zahlen`], e: r`Eine Länge ist positiv. Der Funktionsterm $s^2$ liesse auch negative Zahlen zu, die Situation nicht.` },
      { l: 1, q: r`$T(t)$ ist die Temperatur in °C um $t$ Uhr. Was bedeutet $T(15)=20.7$?`, a: [r`Um 15 Uhr sind es 20.7 °C.`, r`Bei 15 °C ist es 20.7 Uhr.`, r`Die Temperatur steigt um 20.7 °C.`, r`In 15 Stunden sind es 20.7 °C mehr.`], e: r`In der Klammer steht die Uhrzeit, das Ergebnis ist die Temperatur.` },
      { l: 1, q: r`Wie liest man am Graphen den Funktionswert zu einer Stelle $x$ ab?`, a: [r`Von $x$ senkrecht zum Graphen, dann waagrecht zur $y$-Achse.`, r`Von $x$ waagrecht zum Graphen, dann senkrecht zur $y$-Achse.`, r`Man liest ab, wo der Graph die $x$-Achse schneidet.`, r`Man misst die Länge des Graphen.`], e: r`Die Ablesehilfen im Bild zeigen genau diesen Weg.` },
      { l: 1, q: r`$s(t)=5t$ ($s$ in m, $t$ in s). Wie weit kommt man in 10 s?`, a: [r`$50$ m`, r`$15$ m`, r`$2$ m`, r`$500$ m`], e: r`$5\cdot10=50$.` },
      { l: 1, q: r`Der Funktionswert hat immer dieselbe Einheit wie $x$.`, tf: false, e: r`Bei $s(t)$ ist $t$ in Sekunden und $s$ in Metern.` },
      { l: 1, q: r`Ein Kaffee kühlt nach $T(t)=20+60\cdot0.9^t$ ab ($T$ in °C, $t$ in min). Wie heiss ist er am Anfang?`, a: [r`$80$ °C`, r`$20$ °C`, r`$60$ °C`, r`$74$ °C`], e: r`$T(0)=20+60\cdot1=80$, denn $0.9^0=1$.` },

      { l: 2, q: r`$K(x)=10+2x$. Für wie viele Minuten bezahlt man 50 CHF?`, a: [r`$20$`, r`$25$`, r`$30$`, r`$15$`], e: r`$10+2x=50$ ergibt $2x=40$.` },
      { l: 2, q: r`$s(t)=5t$ ($s$ in m, $t$ in s). Wie gross ist die Geschwindigkeit?`, a: [r`$5$ m/s`, r`$5$ m`, r`$5$ s`, r`$\frac15$ m/s`], e: r`Pro Sekunde kommen 5 m dazu.` },
      { l: 2, q: r`Kaffee: $T(t)=20+60\cdot0.9^t$. Welchem Wert nähert sich die Temperatur nach langer Zeit?`, a: [r`$20$ °C`, r`$0$ °C`, r`$60$ °C`, r`$80$ °C`], e: r`$0.9^t$ geht gegen 0, übrig bleibt die Raumtemperatur 20 °C.` },
      { l: 2, q: r`Im Weg-Zeit-Diagramm ist der Weg in m und die Zeit in s aufgetragen. Welche Einheit hat die Steigung?`, a: [r`m/s`, r`s/m`, r`m · s`, r`m`], e: r`Steigung = Änderung senkrecht durch Änderung waagrecht, also Meter durch Sekunden.` },
      { l: 2, q: r`In einer Anwendung kann der sinnvolle Definitionsbereich kleiner sein als beim Funktionsterm allein.`, tf: true, e: r`Zeiten vor dem Start oder negative Längen lässt der Term zu, die Situation aber nicht.` },
      { l: 2, q: r`Ein Quadrat hat den Umfang $U(s)=4s$ und die Fläche $A(s)=s^2$ ($s$ in cm). Für welches $s$ sind die beiden Masszahlen gleich?`, a: [r`$s=4$`, r`$s=2$`, r`$s=1$`, r`$s=16$`], e: r`$4s=s^2$ ergibt für $s>0$ die Lösung $s=4$: Umfang 16 cm, Fläche $16\ \text{cm}^2$.` },
      { l: 2, q: r`Ein Taxi kostet 6 CHF Grundtaxe und 3 CHF pro Kilometer. Welche Funktion beschreibt die Kosten für $x$ km?`, a: [r`$K(x)=6+3x$`, r`$K(x)=3+6x$`, r`$K(x)=9x$`, r`$K(x)=18x$`], e: r`Die Grundtaxe fällt einmal an, die 3 CHF für jeden Kilometer.` },
      { l: 2, q: r`In einem Tank sind 10 l; pro Minute fliessen 2 l dazu. Nach wie vielen Minuten sind 30 l im Tank?`, a: [r`$10$`, r`$15$`, r`$20$`, r`$5$`], e: r`$10+2t=30$ ergibt $t=10$.` },
      { l: 2, q: r`Der Graph des Füllstands verläuft ein Stück weit waagrecht. Was bedeutet das?`, a: [r`Der Füllstand ändert sich in dieser Zeit nicht.`, r`Der Tank ist leer.`, r`Der Tank ist voll.`, r`Die Zeit steht still.`], e: r`Waagrecht heisst: gleicher Funktionswert zu verschiedenen Zeiten.` },
      { l: 2, q: r`Schneidet der Kostengraph die senkrechte Achse auf der Höhe 10, so bezahlt man 10 CHF, auch wenn man nichts verbraucht.`, tf: true, e: r`Der $y$-Achsenabschnitt ist der Wert bei $x=0$, also die Grundgebühr.` },

      { l: 3, q: r`Kaffee: $T(t)=20+60\cdot0.9^t$. Wie heiss ist er nach 1 Minute?`, a: [r`$74$ °C`, r`$72$ °C`, r`$70$ °C`, r`$54$ °C`], e: r`$20+60\cdot0.9=20+54$.` },
      { l: 3, q: r`Kaffee: $T(t)=20+60\cdot0.9^t$. Um wie viel Prozent nimmt der Unterschied zur Raumtemperatur pro Minute ab?`, a: [r`Um 10 %`, r`Um 90 %`, r`Um 9 %`, r`Um 60 %`], e: r`Der Unterschied $60\cdot0.9^t$ wird jede Minute mit 0.9 multipliziert: Es bleiben 90 %.` },
      { l: 3, q: r`Ein Auto fährt 100 km in 2 h und danach 100 km in 1 h. Wie gross ist die Durchschnittsgeschwindigkeit?`, a: [r`Etwa $66.7$ km/h`, r`$75$ km/h`, r`$100$ km/h`, r`$50$ km/h`], e: r`Gesamtweg durch Gesamtzeit: $\frac{200}{3}$. Der Mittelwert der beiden Geschwindigkeiten (75) ist falsch.` },
      { l: 3, q: r`Abo A kostet $20+0.1x$ CHF, Abo B kostet $10+0.3x$ CHF für $x$ Minuten. Ab wie vielen Minuten ist A günstiger?`, a: [r`Ab mehr als 50 Minuten`, r`Ab mehr als 100 Minuten`, r`Ab mehr als 25 Minuten`, r`Nie`], e: r`$20+0.1x<10+0.3x$ ergibt $10<0.2x$, also $x>50$.` },
      { l: 3, q: r`Die Seite eines Quadrats wird um 10 % vergrössert. Um wie viel Prozent wächst die Fläche?`, a: [r`Um 21 %`, r`Um 10 %`, r`Um 20 %`, r`Um 100 %`], e: r`$(1.1\,s)^2=1.21\,s^2$.` },
      { l: 3, q: r`Verdoppelt man $x$, so verdoppeln sich bei $K(x)=10+2x$ auch die Kosten.`, tf: false, e: r`Nur der Anteil $2x$ verdoppelt sich, die Grundgebühr bleibt. Zum Beispiel $K(5)=20$ und $K(10)=30$.` },
      { l: 3, q: r`Ein Stein fällt nach $s(t)=5t^2$ ($s$ in m, $t$ in s). Welchen Weg legt er in der dritten Sekunde zurück?`, a: [r`$25$ m`, r`$15$ m`, r`$45$ m`, r`$5$ m`], e: r`Von $t=2$ bis $t=3$: $s(3)-s(2)=45-20$.` },
      { l: 3, q: r`Im Weg-Zeit-Diagramm (km und h) hat eine Gerade die Steigung 72. Wie schnell ist das in m/s?`, a: [r`$20$ m/s`, r`$72$ m/s`, r`$7.2$ m/s`, r`$259.2$ m/s`], e: r`$72$ km/h $=\frac{72\,000\ \text{m}}{3600\ \text{s}}=20$ m/s: durch 3.6 teilen.` }
    ]
  };
})();
