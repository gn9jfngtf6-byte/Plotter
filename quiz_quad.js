// quiz_quad.js — Quizfragen zu den quadratischen Funktionen (wird von 116_quiz.js bei Bedarf geladen)
// Je Ansicht 30 Fragen: 12 × Stufe 1 (Grundwissen), 10 × Stufe 2 (Verständnis), 8 × Stufe 3 (Knacknuss).
// Die Reihenfolge hier ist die Reihenfolge im Quiz und auf dem Arbeitsblatt (Frage 1 bis 30).
// {l, q, a, e}: a[0] ist die richtige Antwort (Anzeige gemischt)   ·   {l, q, tf, e}: Aussage, tf = wahr/falsch
(function () {
  const r = String.raw;
  (window.QUIZ_DATA = window.QUIZ_DATA || {}).quad = {

    // ───────────────────────── Parameter und drei Formen ─────────────────────────
    par: [
      { l: 1, q: r`Welche Form hat der Graph von $f(x)=ax^2+bx+c$ mit $a\neq0$?`, a: [r`Eine Parabel.`, r`Eine Gerade.`, r`Eine Hyperbel.`, r`Einen Kreis.`], e: r`Der Graph jeder quadratischen Funktion ist eine Parabel.` },
      { l: 1, q: r`Wie ist die Parabel für $a>0$ geöffnet?`, a: [r`Nach oben.`, r`Nach unten.`, r`Nach rechts.`, r`Nach links.`], e: r`Für grosse $|x|$ wird $ax^2$ gross und positiv.` },
      { l: 1, q: r`Für $a<0$ ist die Parabel nach unten geöffnet.`, tf: true, e: r`Das negative Vorzeichen spiegelt die Parabel an der $x$-Achse.` },
      { l: 1, q: r`Was bedeutet $c$ in $f(x)=ax^2+bx+c$?`, a: [r`Den $y$-Achsenabschnitt.`, r`Den Scheitel.`, r`Eine Nullstelle.`, r`Die Steigung.`], e: r`$f(0)=c$.` },
      { l: 1, q: r`Wie lautet die Scheitelform?`, a: [r`$f(x)=a\,(x-x_s)^2+y_s$`, r`$f(x)=a\,(x-x_1)(x-x_2)$`, r`$f(x)=ax^2+bx+c$`, r`$f(x)=mx+q$`], e: r`An ihr liest man den Scheitel $S(x_s\,|\,y_s)$ direkt ab.` },
      { l: 1, q: r`Wie lautet die Nullstellenform?`, a: [r`$f(x)=a\,(x-x_1)(x-x_2)$`, r`$f(x)=a\,(x-x_s)^2+y_s$`, r`$f(x)=ax^2+bx+c$`, r`$f(x)=a\,x_1x_2$`], e: r`Ein Produkt ist null, wenn ein Faktor null ist: bei $x_1$ und $x_2$.` },
      { l: 1, q: r`Welchen Scheitel hat $f(x)=2\,(x-3)^2+1$?`, a: [r`$S(3\,|\,1)$`, r`$S(-3\,|\,1)$`, r`$S(3\,|\,-1)$`, r`$S(1\,|\,3)$`], e: r`In der Klammer steht $x-x_s$, also $x_s=3$; dahinter $y_s=1$.` },
      { l: 1, q: r`Welche Nullstellen hat $f(x)=(x-1)(x-5)$?`, a: [r`$1$ und $5$`, r`$-1$ und $-5$`, r`$1$ und $-5$`, r`Nur $5$`], e: r`Jeder Faktor wird für sich null gesetzt.` },
      { l: 1, q: r`Wie verändert $|a|>1$ die Normalparabel?`, a: [r`Sie wird gestreckt und damit schmaler.`, r`Sie wird breiter.`, r`Sie wird verschoben.`, r`Sie wird gespiegelt.`], e: r`Alle $y$-Werte werden mit $a$ multipliziert.` },
      { l: 1, q: r`Welche Funktion hat die Normalparabel als Graph?`, a: [r`$f(x)=x^2$`, r`$f(x)=2x$`, r`$f(x)=x^2+1$`, r`$f(x)=-x^2$`], e: r`Die Normalparabel hat den Scheitel im Ursprung und $a=1$.` },
      { l: 1, q: r`Was ist der Scheitel einer Parabel?`, a: [r`Ihr höchster oder tiefster Punkt.`, r`Ihr Schnittpunkt mit der $y$-Achse.`, r`Eine ihrer Nullstellen.`, r`Der Ursprung.`], e: r`Durch den Scheitel geht die Symmetrieachse.` },
      { l: 1, q: r`Jede Parabel $f(x)=ax^2+bx+c$ schneidet die $y$-Achse genau einmal.`, tf: true, e: r`Im Punkt $(0\,|\,c)$.` },

      { l: 2, q: r`Welchen Scheitel hat $f(x)=(x+2)^2-3$?`, a: [r`$S(-2\,|\,-3)$`, r`$S(2\,|\,-3)$`, r`$S(-2\,|\,3)$`, r`$S(2\,|\,3)$`], e: r`$(x+2)=(x-(-2))$, also $x_s=-2$.` },
      { l: 2, q: r`Bei welchem $x$ liegt der Scheitel von $f(x)=ax^2+bx+c$?`, a: [r`$x_s=-\frac{b}{2a}$`, r`$x_s=\frac{b}{2a}$`, r`$x_s=-\frac{b}{a}$`, r`$x_s=-\frac{c}{a}$`], e: r`Das folgt aus der quadratischen Ergänzung.` },
      { l: 2, q: r`Welchen Scheitel hat $f(x)=x^2-6x+5$?`, a: [r`$S(3\,|\,-4)$`, r`$S(-3\,|\,32)$`, r`$S(3\,|\,5)$`, r`$S(6\,|\,5)$`], e: r`$x_s=\frac62=3$ und $f(3)=9-18+5$.` },
      { l: 2, q: r`Eine Parabel hat die Nullstellen 1 und 5. Bei welchem $x$ liegt ihr Scheitel?`, a: [r`Bei $x=3$`, r`Bei $x=2$`, r`Bei $x=4$`, r`Bei $x=6$`], e: r`Die Parabel ist symmetrisch: Der Scheitel liegt in der Mitte zwischen den Nullstellen.` },
      { l: 2, q: r`Jede quadratische Funktion lässt sich in der Nullstellenform schreiben.`, tf: false, e: r`Nur wenn sie Nullstellen hat. $f(x)=x^2+1$ hat keine.` },
      { l: 2, q: r`Wie lautet $f(x)=2\,(x-1)(x+3)$ in der Standardform?`, a: [r`$2x^2+4x-6$`, r`$2x^2-4x-6$`, r`$2x^2+2x-3$`, r`$x^2+2x-3$`], e: r`$(x-1)(x+3)=x^2+2x-3$, dann mal 2.` },
      { l: 2, q: r`Welche Nullstellen hat $f(x)=-(x-2)^2+4$?`, a: [r`$0$ und $4$`, r`$-2$ und $2$`, r`Nur $2$`, r`$-2$ und $6$`], e: r`$(x-2)^2=4$ ergibt $x-2=\pm2$.` },
      { l: 2, q: r`Welche Symmetrieachse hat $f(x)=x^2+4x$?`, a: [r`$x=-2$`, r`$x=2$`, r`$x=4$`, r`Die $y$-Achse`], e: r`Nullstellen 0 und $-4$; die Achse liegt in der Mitte.` },
      { l: 2, q: r`Was bleibt gleich, wenn man in $f(x)=ax^2+bx+c$ nur $b$ ändert?`, a: [r`Die Form der Parabel und ihr $y$-Achsenabschnitt.`, r`Der Scheitel.`, r`Die Nullstellen.`, r`Die Symmetrieachse.`], e: r`$a$ bestimmt die Form, $c$ den Punkt auf der $y$-Achse. Der Scheitel wandert.` },
      { l: 2, q: r`Zwei Parabeln mit gleichem $a$ sind deckungsgleich: Sie lassen sich durch Verschieben zur Deckung bringen.`, tf: true, e: r`In der Scheitelform unterscheiden sie sich nur in $x_s$ und $y_s$.` },

      { l: 3, q: r`Welche Parabel hat den Scheitel $S(1\,|\,-8)$ und geht durch $(3\,|\,0)$?`, a: [r`$f(x)=2\,(x-1)^2-8$`, r`$f(x)=(x-1)^2-8$`, r`$f(x)=2\,(x+1)^2-8$`, r`$f(x)=4\,(x-1)^2-8$`], e: r`$a\cdot(3-1)^2-8=0$ ergibt $a=2$.` },
      { l: 3, q: r`Welche Parabel hat die Nullstellen $-1$ und $3$ und geht durch $(0\,|\,-6)$?`, a: [r`$f(x)=2\,(x+1)(x-3)$`, r`$f(x)=(x+1)(x-3)$`, r`$f(x)=-2\,(x+1)(x-3)$`, r`$f(x)=2\,(x-1)(x+3)$`], e: r`$a\cdot1\cdot(-3)=-6$ ergibt $a=2$.` },
      { l: 3, q: r`Für welches $b>0$ liegt der Scheitel von $f(x)=x^2+bx+4$ auf der $x$-Achse?`, a: [r`$b=4$`, r`$b=2$`, r`$b=8$`, r`$b=16$`], e: r`Dann ist $f(x)=(x+2)^2$, also $b=4$. Oder: $D=b^2-16=0$.` },
      { l: 3, q: r`Man ändert in $f(x)=x^2+bx+c$ nur $b$. Auf welcher Kurve wandert der Scheitel?`, a: [r`Auf der Parabel $y=c-x^2$`, r`Auf einer Geraden`, r`Auf der Parabel $y=x^2+c$`, r`Auf einem Kreis`], e: r`$x_s=-\frac b2$ und $y_s=c-\frac{b^2}{4}=c-x_s^2$.` },
      { l: 3, q: r`Verdoppelt man $a$, $b$ und $c$, so bleiben die Nullstellen gleich.`, tf: true, e: r`$2\,f(x)=0$ hat dieselben Lösungen wie $f(x)=0$.` },
      { l: 3, q: r`Für eine quadratische Funktion gilt $f(1)=f(5)$. Bei welchem $x$ liegt der Scheitel?`, a: [r`Bei $x=3$`, r`Bei $x=1$`, r`Bei $x=5$`, r`Das lässt sich nicht sagen.`], e: r`Gleich hohe Punkte liegen symmetrisch zur Achse durch den Scheitel.` },
      { l: 3, q: r`Welchen Wertebereich hat $f(x)=-2x^2+8x-3$?`, a: [r`Alle $y\le5$`, r`Alle $y\ge5$`, r`Alle $y\le-3$`, r`Alle reellen Zahlen`], e: r`Scheitel bei $x=2$ mit $f(2)=-8+16-3=5$; die Parabel ist nach unten geöffnet.` },
      { l: 3, q: r`Welche $y$-Koordinate hat der Scheitel von $f(x)=a\,(x-x_1)(x-x_2)$?`, a: [r`$-\frac{a\,(x_2-x_1)^2}{4}$`, r`$\frac{a\,(x_2-x_1)^2}{4}$`, r`$-\frac{a\,(x_1+x_2)^2}{4}$`, r`$a\,x_1x_2$`], e: r`In der Mitte sind die Faktoren $\frac{x_2-x_1}{2}$ und $-\frac{x_2-x_1}{2}$.` }
    ],

    // ───────────────────────── Scheitelpunkt und quadratische Ergänzung ─────────────────────────
    vtx: [
      { l: 1, q: r`In welche Form bringt die quadratische Ergänzung die Standardform?`, a: [r`In die Scheitelform.`, r`In die Nullstellenform.`, r`In eine lineare Form.`, r`In die Normalform.`], e: r`Aus $ax^2+bx+c$ wird $a\,(x-x_s)^2+y_s$.` },
      { l: 1, q: r`Mit welcher Zahl ergänzt man $x^2+6x$ zu einem Binom?`, a: [r`$9$`, r`$6$`, r`$3$`, r`$36$`], e: r`Die Hälfte von 6 ist 3, und $3^2=9$.` },
      { l: 1, q: r`Was ist $x^2+6x+9$?`, a: [r`$(x+3)^2$`, r`$(x+9)^2$`, r`$(x+6)^2$`, r`$(x-3)^2$`], e: r`Binomische Formel: $(x+3)^2=x^2+2\cdot3x+9$.` },
      { l: 1, q: r`Wie lautet $x^2-4x+7$ in der Scheitelform?`, a: [r`$(x-2)^2+3$`, r`$(x-2)^2+7$`, r`$(x-4)^2+3$`, r`$(x+2)^2+3$`], e: r`$x^2-4x+4-4+7=(x-2)^2+3$.` },
      { l: 1, q: r`Welchen Scheitel hat $f(x)=(x-2)^2+3$?`, a: [r`$S(2\,|\,3)$`, r`$S(-2\,|\,3)$`, r`$S(2\,|\,7)$`, r`$S(4\,|\,3)$`], e: r`Der kleinste Wert 3 wird erreicht, wenn die Klammer null ist.` },
      { l: 1, q: r`Wie lautet die binomische Formel für $(x+d)^2$?`, a: [r`$x^2+2dx+d^2$`, r`$x^2+d^2$`, r`$x^2+dx+d^2$`, r`$x^2+2dx+d$`], e: r`Das gemischte Glied $2dx$ wird oft vergessen.` },
      { l: 1, q: r`Die Normalparabel wird um 3 nach rechts verschoben. Welche Funktion entsteht?`, a: [r`$f(x)=(x-3)^2$`, r`$f(x)=(x+3)^2$`, r`$f(x)=x^2-3$`, r`$f(x)=x^2+3$`], e: r`Der Scheitel liegt dort, wo die Klammer null ist: bei $x=3$.` },
      { l: 1, q: r`Die Normalparabel wird um 2 nach oben verschoben. Welche Funktion entsteht?`, a: [r`$f(x)=x^2+2$`, r`$f(x)=(x+2)^2$`, r`$f(x)=(x-2)^2$`, r`$f(x)=2x^2$`], e: r`Zu jedem Funktionswert kommt 2 dazu.` },
      { l: 1, q: r`$f(x)=(x+1)^2$ ist die um 1 nach links verschobene Normalparabel.`, tf: true, e: r`Die Klammer ist null bei $x=-1$.` },
      { l: 1, q: r`Welche Zahl ergänzt man allgemein bei $x^2+bx$?`, a: [r`$\left(\frac{b}{2}\right)^2$`, r`$b^2$`, r`$\frac{b}{2}$`, r`$2b$`], e: r`Halbieren, dann quadrieren.` },
      { l: 1, q: r`Wie entsteht $f(x)=3x^2$ aus der Normalparabel?`, a: [r`Durch Strecken mit dem Faktor 3 in $y$-Richtung.`, r`Durch Verschieben um 3 nach oben.`, r`Durch Spiegeln.`, r`Durch Verschieben um 3 nach rechts.`], e: r`Jeder Funktionswert wird verdreifacht.` },
      { l: 1, q: r`Beim quadratischen Ergänzen ändert sich die Funktion nicht, nur ihre Schreibweise.`, tf: true, e: r`Man addiert eine Zahl und zieht sie gleich wieder ab.` },

      { l: 2, q: r`Wie lautet $x^2+8x+10$ in der Scheitelform?`, a: [r`$(x+4)^2-6$`, r`$(x+4)^2+10$`, r`$(x+8)^2-54$`, r`$(x+4)^2+6$`], e: r`$x^2+8x+16-16+10$.` },
      { l: 2, q: r`Wie lautet $2x^2-12x+10$ in der Scheitelform?`, a: [r`$2\,(x-3)^2-8$`, r`$2\,(x-3)^2+1$`, r`$2\,(x-6)^2-62$`, r`$(2x-3)^2+1$`], e: r`$2\,(x^2-6x)+10=2\,\big((x-3)^2-9\big)+10$.` },
      { l: 2, q: r`Welchen Scheitel hat $f(x)=-x^2+4x-1$?`, a: [r`$S(2\,|\,3)$`, r`$S(-2\,|\,3)$`, r`$S(2\,|\,-5)$`, r`$S(2\,|\,-1)$`], e: r`$-(x^2-4x)-1=-\big((x-2)^2-4\big)-1=-(x-2)^2+3$.` },
      { l: 2, q: r`Wie entsteht $f(x)=2\,(x-3)^2-8$ aus der Normalparabel?`, a: [r`Mit 2 strecken, 3 nach rechts und 8 nach unten verschieben.`, r`Mit 2 strecken, 3 nach links und 8 nach unten verschieben.`, r`Mit 2 strecken, 3 nach rechts und 8 nach oben verschieben.`, r`Auf die Hälfte stauchen, 3 nach rechts und 8 nach unten verschieben.`], e: r`Der Scheitel wandert vom Ursprung nach $(3\,|\,-8)$.` },
      { l: 2, q: r`Bei $f(x)=2x^2+8x$ klammert man 2 aus und ergänzt in der Klammer mit 16.`, tf: false, e: r`In der Klammer steht $x^2+4x$; ergänzt wird mit $2^2=4$.` },
      { l: 2, q: r`Welchen kleinsten Wert nimmt $f(x)=x^2-10x+30$ an?`, a: [r`$5$`, r`$30$`, r`$-5$`, r`$25$`], e: r`$(x-5)^2+5$: Das Quadrat ist mindestens 0.` },
      { l: 2, q: r`Wie lautet $x^2+x$ in der Scheitelform?`, a: [r`$\left(x+\frac12\right)^2-\frac14$`, r`$(x+1)^2-1$`, r`$\left(x+\frac12\right)^2+\frac14$`, r`$\left(x+\frac12\right)^2$`], e: r`Ergänzt wird mit $\left(\frac12\right)^2=\frac14$.` },
      { l: 2, q: r`$f(x)=(x-2)^2+3$ wird um 5 nach links und um 4 nach unten verschoben. Welche Funktion entsteht?`, a: [r`$(x+3)^2-1$`, r`$(x-7)^2-1$`, r`$(x+3)^2+7$`, r`$(x-7)^2+7$`], e: r`Der Scheitel wandert von $(2\,|\,3)$ nach $(-3\,|\,-1)$.` },
      { l: 2, q: r`Welche Parabel hat den Scheitel $S(-1\,|\,4)$ und ist nach unten geöffnet?`, a: [r`$f(x)=-(x+1)^2+4$`, r`$f(x)=-(x-1)^2+4$`, r`$f(x)=(x+1)^2+4$`, r`$f(x)=-(x+1)^2-4$`], e: r`$x_s=-1$ ergibt die Klammer $(x+1)$, das Minus davor öffnet nach unten.` },
      { l: 2, q: r`Wo der Scheitel von $f(x)=a\,(x-x_s)^2+y_s$ liegt, hängt nicht von $a$ ab.`, tf: true, e: r`$a$ ändert nur die Form und die Öffnung, der Scheitel bleibt $(x_s\,|\,y_s)$.` },

      { l: 3, q: r`Was ergibt die quadratische Ergänzung von $ax^2+bx+c$ allgemein?`, a: [r`$a\left(x+\frac{b}{2a}\right)^2+c-\frac{b^2}{4a}$`, r`$a\left(x+\frac{b}{2a}\right)^2+c+\frac{b^2}{4a}$`, r`$a\left(x+\frac{b}{2a}\right)^2+c-\frac{b^2}{2a}$`, r`$a\left(x+\frac{b}{2a}\right)^2+c-\frac{b^2}{4}$`], e: r`In der Klammer wird $\frac{b^2}{4a^2}$ ergänzt; mal $a$ ergibt das $\frac{b^2}{4a}$, das wieder abgezogen wird.` },
      { l: 3, q: r`Für welches $c$ berührt $f(x)=x^2-6x+c$ die $x$-Achse?`, a: [r`$c=9$`, r`$c=6$`, r`$c=36$`, r`$c=-9$`], e: r`Dann ist $f(x)=(x-3)^2$: Der Scheitel liegt auf der $x$-Achse.` },
      { l: 3, q: r`Für welches $x$ ist $(x-1)^2+(x-5)^2$ am kleinsten?`, a: [r`Für $x=3$`, r`Für $x=1$`, r`Für $x=5$`, r`Für $x=2$`], e: r`Ausmultipliziert: $2x^2-12x+26=2\,(x-3)^2+8$.` },
      { l: 3, q: r`$f(x)=x^2+bx+c$ hat den Scheitel $S(2\,|\,-1)$. Wie gross sind $b$ und $c$?`, a: [r`$b=-4$, $c=3$`, r`$b=4$, $c=3$`, r`$b=-2$, $c=-1$`, r`$b=-4$, $c=-1$`], e: r`$(x-2)^2-1=x^2-4x+4-1$.` },
      { l: 3, q: r`$f(x)=x^2+6x+10$ wird nie null, weil $f(x)=(x+3)^2+1\ge1$ ist.`, tf: true, e: r`Die Scheitelform zeigt den kleinsten Wert direkt.` },
      { l: 3, q: r`Welchen Scheitel hat $f(x)=(x-1)(x-7)$?`, a: [r`$S(4\,|\,-9)$`, r`$S(4\,|\,9)$`, r`$S(3\,|\,-8)$`, r`$S(4\,|\,-7)$`], e: r`Mitte der Nullstellen: $x=4$; $f(4)=3\cdot(-3)$.` },
      { l: 3, q: r`Welchen grössten Wert nimmt $f(x)=-2x^2+12x-10$ an?`, a: [r`$8$`, r`$10$`, r`$-10$`, r`$18$`], e: r`$-2\,(x-3)^2+18-10$.` },
      { l: 3, q: r`Welchen grössten Wert hat das Produkt $x\cdot(10-x)$?`, a: [r`$25$`, r`$10$`, r`$20$`, r`$100$`], e: r`$-x^2+10x=-(x-5)^2+25$: Unter allen Rechtecken mit Umfang 20 ist das Quadrat am grössten.` }
    ],

    // ───────────────────────── Nullstellen und Diskriminante ─────────────────────────
    zer: [
      { l: 1, q: r`Wie lautet die Diskriminante von $ax^2+bx+c=0$?`, a: [r`$D=b^2-4ac$`, r`$D=b^2+4ac$`, r`$D=4ac-b^2$`, r`$D=b-4ac$`], e: r`Sie steht in der Lösungsformel unter der Wurzel.` },
      { l: 1, q: r`Wie viele Lösungen hat die Gleichung für $D>0$?`, a: [r`Zwei.`, r`Eine.`, r`Keine.`, r`Drei.`], e: r`Die Wurzel ist positiv, $\pm$ liefert zwei verschiedene Werte.` },
      { l: 1, q: r`Wie viele Lösungen hat die Gleichung für $D=0$?`, a: [r`Genau eine.`, r`Zwei.`, r`Keine.`, r`Unendlich viele.`], e: r`Die Parabel berührt die $x$-Achse im Scheitel.` },
      { l: 1, q: r`Wie viele reelle Lösungen hat die Gleichung für $D<0$?`, a: [r`Keine.`, r`Eine.`, r`Zwei.`, r`Unendlich viele.`], e: r`Aus einer negativen Zahl lässt sich keine reelle Wurzel ziehen.` },
      { l: 1, q: r`Wie lautet die Lösungsformel (Mitternachtsformel) für $ax^2+bx+c=0$?`, a: [r`$x_{1,2}=\frac{-b\pm\sqrt{b^2-4ac}}{2a}$`, r`$x_{1,2}=\frac{b\pm\sqrt{b^2-4ac}}{2a}$`, r`$x_{1,2}=\frac{-b\pm\sqrt{b^2-4ac}}{a}$`, r`$x_{1,2}=-b\pm\frac{\sqrt{b^2-4ac}}{2a}$`], e: r`Vorne $-b$, und der ganze Zähler wird durch $2a$ geteilt.` },
      { l: 1, q: r`Welche Lösungen hat $x^2-5x+6=0$?`, a: [r`$2$ und $3$`, r`$-2$ und $-3$`, r`$1$ und $6$`, r`$-1$ und $-6$`], e: r`$(x-2)(x-3)=0$: Summe 5, Produkt 6.` },
      { l: 1, q: r`Welche Lösungen hat $x^2-9=0$?`, a: [r`$3$ und $-3$`, r`Nur $3$`, r`Nur $9$`, r`$9$ und $-9$`], e: r`$x^2=9$ hat zwei Lösungen.` },
      { l: 1, q: r`Welche reellen Lösungen hat $x^2+4=0$?`, a: [r`Keine.`, r`$2$ und $-2$`, r`Nur $-2$`, r`Nur $2$`], e: r`$x^2=-4$ ist nicht möglich, denn ein Quadrat ist nie negativ.` },
      { l: 1, q: r`Eine quadratische Gleichung hat höchstens zwei reelle Lösungen.`, tf: true, e: r`Eine Parabel schneidet die $x$-Achse höchstens zweimal.` },
      { l: 1, q: r`Welche Lösungen hat $x^2-4x=0$?`, a: [r`$0$ und $4$`, r`Nur $4$`, r`$2$ und $-2$`, r`$0$ und $-4$`], e: r`Ausklammern: $x\,(x-4)=0$.` },
      { l: 1, q: r`Wie gross ist die Diskriminante von $x^2+2x+1=0$?`, a: [r`$0$`, r`$4$`, r`$8$`, r`$-4$`], e: r`$2^2-4\cdot1\cdot1=0$; die Gleichung ist $(x+1)^2=0$.` },
      { l: 1, q: r`Was sagt der Satz von Vieta für $x^2+px+q=0$?`, a: [r`$x_1+x_2=-p$ und $x_1\cdot x_2=q$`, r`$x_1+x_2=p$ und $x_1\cdot x_2=q$`, r`$x_1+x_2=-p$ und $x_1\cdot x_2=-q$`, r`$x_1+x_2=q$ und $x_1\cdot x_2=p$`], e: r`Aus $(x-x_1)(x-x_2)=x^2-(x_1+x_2)\,x+x_1x_2$.` },

      { l: 2, q: r`Welche Lösungen hat $2x^2-3x-2=0$?`, a: [r`$2$ und $-\frac12$`, r`$-2$ und $\frac12$`, r`$2$ und $\frac12$`, r`$1$ und $-2$`], e: r`$D=9+16=25$; $x=\frac{3\pm5}{4}$.` },
      { l: 2, q: r`Für welches $c$ hat $x^2+6x+c=0$ genau eine Lösung?`, a: [r`$c=9$`, r`$c=6$`, r`$c=36$`, r`$c=-9$`], e: r`$D=36-4c=0$.` },
      { l: 2, q: r`Wie viele Nullstellen hat $f(x)=x^2-2x+5$?`, a: [r`Keine.`, r`Eine.`, r`Zwei.`, r`Unendlich viele.`], e: r`$D=4-20<0$. Oder: $(x-1)^2+4\ge4$.` },
      { l: 2, q: r`Welche Gleichung hat die Lösungen $3$ und $-5$?`, a: [r`$x^2+2x-15=0$`, r`$x^2-2x-15=0$`, r`$x^2+2x+15=0$`, r`$x^2-8x-15=0$`], e: r`$(x-3)(x+5)=x^2+2x-15$. Vieta: Summe $-2$, Produkt $-15$.` },
      { l: 2, q: r`Ist $a>0$ und $c<0$, so hat $f(x)=ax^2+bx+c$ sicher zwei Nullstellen.`, tf: true, e: r`Dann ist $-4ac>0$ und damit $D>0$. Im Bild: Die Parabel ist nach oben geöffnet und bei $x=0$ unter der Achse.` },
      { l: 2, q: r`Welche Lösungen hat $(x-3)^2=16$?`, a: [r`$7$ und $-1$`, r`Nur $7$`, r`$4$ und $-4$`, r`$19$ und $-13$`], e: r`$x-3=\pm4$.` },
      { l: 2, q: r`Jemand teilt $x^2=5x$ durch $x$ und erhält $x=5$. Was ist geschehen?`, a: [r`Die Lösung $x=0$ ist verloren gegangen.`, r`Alles ist richtig; es gibt nur diese Lösung.`, r`$x=5$ ist keine Lösung.`, r`Die Gleichung hat gar keine Lösung.`], e: r`Durch $x$ darf man nur teilen, wenn $x\neq0$ ist. Besser: $x\,(x-5)=0$.` },
      { l: 2, q: r`Eine nach oben geöffnete Parabel hat den Scheitel unterhalb der $x$-Achse. Wie viele Nullstellen hat sie?`, a: [r`Zwei.`, r`Eine.`, r`Keine.`, r`Das hängt von $b$ ab.`], e: r`Vom Scheitel aus steigt sie nach beiden Seiten und muss die Achse zweimal kreuzen.` },
      { l: 2, q: r`Welche Lösungen hat $x^2-6x+9=0$?`, a: [r`Nur $x=3$`, r`$3$ und $-3$`, r`$0$ und $6$`, r`Keine`], e: r`$(x-3)^2=0$: eine doppelte Lösung.` },
      { l: 2, q: r`Die Diskriminante gibt an, wo die Nullstellen liegen.`, tf: false, e: r`Sie sagt nur, wie viele es sind. Für die Lage braucht man die ganze Lösungsformel.` },

      { l: 3, q: r`Für welche $k$ hat $x^2+kx+9=0$ keine reelle Lösung?`, a: [r`Für $-6<k<6$`, r`Für $k>6$`, r`Für $k<-6$`, r`Für $|k|>6$`], e: r`$D=k^2-36<0$.` },
      { l: 3, q: r`Welche Lösungen hat $x^4-5x^2+4=0$?`, a: [r`$\pm1$ und $\pm2$`, r`$1$ und $4$`, r`Nur $\pm1$`, r`Nur $\pm2$`], e: r`Mit $z=x^2$: $z^2-5z+4=0$ ergibt $z=1$ oder $z=4$.` },
      { l: 3, q: r`Die Gleichung $x^2+px+q=0$ hat die Lösungen $2+\sqrt3$ und $2-\sqrt3$. Wie gross sind $p$ und $q$?`, a: [r`$p=-4$, $q=1$`, r`$p=4$, $q=1$`, r`$p=-4$, $q=-1$`, r`$p=-2$, $q=3$`], e: r`Vieta: Summe 4, Produkt $4-3=1$.` },
      { l: 3, q: r`Wie weit liegen die beiden Nullstellen von $ax^2+bx+c$ auseinander (für $D>0$)?`, a: [r`$\frac{\sqrt{D}}{|a|}$`, r`$\sqrt{D}$`, r`$\frac{D}{a}$`, r`$\frac{\sqrt{D}}{2\,|a|}$`], e: r`Die Lösungen unterscheiden sich um $2\cdot\frac{\sqrt D}{2|a|}$.` },
      { l: 3, q: r`Hat $ax^2+bx+c=0$ zwei Lösungen, so hat auch $cx^2+bx+a=0$ (mit $c\neq0$) zwei Lösungen.`, tf: true, e: r`Beide Gleichungen haben dieselbe Diskriminante $b^2-4ac$.` },
      { l: 3, q: r`Welche positive Lösung hat $x^2=x+1$?`, a: [r`$\frac{1+\sqrt5}{2}$`, r`$\frac{\sqrt5-1}{2}$`, r`$\sqrt2$`, r`$\frac32$`], e: r`$x^2-x-1=0$, $D=5$. Die Zahl ist der Goldene Schnitt, etwa 1.618.` },
      { l: 3, q: r`Für welche $m$ berührt die Gerade $y=mx$ die Parabel $y=x^2+1$?`, a: [r`Für $m=2$ und $m=-2$`, r`Für $m=1$ und $m=-1$`, r`Für $m=4$ und $m=-4$`, r`Für $m=0$`], e: r`$x^2-mx+1=0$ hat genau eine Lösung, wenn $D=m^2-4=0$ ist.` },
      { l: 3, q: r`Welche Lösungen hat $\sqrt{x+2}=x$?`, a: [r`Nur $x=2$`, r`$2$ und $-1$`, r`Nur $x=-1$`, r`Keine`], e: r`Quadrieren ergibt $x^2-x-2=0$ mit den Lösungen 2 und $-1$; die Probe scheidet $-1$ aus, denn $\sqrt1\neq-1$.` }
    ],

    // ───────────────────────── Parabel und Gerade, Parabel aus Punkten ─────────────────────────
    cmb: [
      { l: 1, q: r`Was ist eine Sekante einer Parabel?`, a: [r`Eine Gerade, die die Parabel in zwei Punkten schneidet.`, r`Eine Gerade, die die Parabel berührt.`, r`Eine Gerade, die die Parabel verfehlt.`, r`Die Symmetrieachse.`], e: r`Sekante heisst «die Schneidende».` },
      { l: 1, q: r`Was ist eine Tangente einer Parabel?`, a: [r`Eine Gerade, die die Parabel in einem Punkt berührt.`, r`Eine Gerade durch zwei Parabelpunkte.`, r`Eine Gerade ohne gemeinsamen Punkt.`, r`Eine Gerade durch den Scheitel.`], e: r`Tangente heisst «die Berührende».` },
      { l: 1, q: r`Was ist eine Passante einer Parabel?`, a: [r`Eine Gerade ohne gemeinsamen Punkt mit der Parabel.`, r`Eine Gerade durch den Scheitel.`, r`Eine Gerade, die die Parabel berührt.`, r`Eine Gerade durch zwei Parabelpunkte.`], e: r`Passante heisst «die Vorbeigehende».` },
      { l: 1, q: r`Wie berechnet man die gemeinsamen Punkte von Parabel und Gerade?`, a: [r`Gleichsetzen; das ergibt eine quadratische Gleichung.`, r`Beide Funktionen addieren.`, r`Beide null setzen.`, r`Die Steigungen vergleichen.`], e: r`An den gemeinsamen Stellen haben beide denselben Funktionswert.` },
      { l: 1, q: r`Die Gleichung für die Schnittstellen von Parabel und Gerade hat die Diskriminante $D=0$. Was ist die Gerade?`, a: [r`Eine Tangente.`, r`Eine Sekante.`, r`Eine Passante.`, r`Die Symmetrieachse.`], e: r`Genau eine gemeinsame Stelle: Die Gerade berührt.` },
      { l: 1, q: r`Wo schneiden sich $y=x^2$ und $y=4$?`, a: [r`In $(-2\,|\,4)$ und $(2\,|\,4)$`, r`Nur in $(2\,|\,4)$`, r`In $(4\,|\,16)$`, r`Gar nicht`], e: r`$x^2=4$ ergibt $x=\pm2$.` },
      { l: 1, q: r`Was ist die Gerade $y=-1$ für die Parabel $y=x^2$?`, a: [r`Eine Passante.`, r`Eine Tangente.`, r`Eine Sekante.`, r`Die Symmetrieachse.`], e: r`$x^2=-1$ hat keine Lösung.` },
      { l: 1, q: r`Wie viele Punkte braucht man, um eine Parabel $y=ax^2+bx+c$ festzulegen?`, a: [r`Drei (mit verschiedenen $x$-Werten, nicht auf einer Geraden).`, r`Zwei.`, r`Vier.`, r`Einen.`], e: r`Drei Unbekannte $a$, $b$, $c$ brauchen drei Gleichungen.` },
      { l: 1, q: r`Eine Gerade und eine Parabel haben höchstens zwei gemeinsame Punkte.`, tf: true, e: r`Die Gleichung für die Schnittstellen ist quadratisch.` },
      { l: 1, q: r`Wo schneiden sich $y=x^2$ und $y=x$?`, a: [r`In $(0\,|\,0)$ und $(1\,|\,1)$`, r`Nur in $(0\,|\,0)$`, r`Nur in $(1\,|\,1)$`, r`In $(-1\,|\,1)$ und $(1\,|\,1)$`], e: r`$x^2=x$ ergibt $x\,(x-1)=0$.` },
      { l: 1, q: r`Der Scheitel und ein weiterer Punkt sind gegeben. Mit welcher Form findet man die Parabel am schnellsten?`, a: [r`Mit der Scheitelform.`, r`Mit der Nullstellenform.`, r`Mit der Standardform.`, r`Mit keiner; es fehlt ein Punkt.`], e: r`In $a\,(x-x_s)^2+y_s$ fehlt nur noch $a$.` },
      { l: 1, q: r`Zwei Nullstellen und ein weiterer Punkt sind gegeben. Mit welcher Form findet man die Parabel am schnellsten?`, a: [r`Mit der Nullstellenform.`, r`Mit der Scheitelform.`, r`Mit der Standardform.`, r`Mit keiner; es fehlt ein Punkt.`], e: r`In $a\,(x-x_1)(x-x_2)$ fehlt nur noch $a$.` },

      { l: 2, q: r`Wo schneiden sich $y=x^2$ und $y=2x+3$?`, a: [r`In $(-1\,|\,1)$ und $(3\,|\,9)$`, r`In $(1\,|\,1)$ und $(3\,|\,9)$`, r`In $(-1\,|\,1)$ und $(-3\,|\,9)$`, r`Nur in $(3\,|\,9)$`], e: r`$x^2-2x-3=0$ ergibt $x=-1$ und $x=3$.` },
      { l: 2, q: r`Was ist $y=2x-1$ für die Parabel $y=x^2$?`, a: [r`Eine Tangente (Berührpunkt $(1\,|\,1)$).`, r`Eine Sekante.`, r`Eine Passante.`, r`Die Symmetrieachse.`], e: r`$x^2-2x+1=(x-1)^2=0$ hat genau eine Lösung.` },
      { l: 2, q: r`Was ist $y=2x$ für die Parabel $y=x^2+2$?`, a: [r`Eine Passante.`, r`Eine Tangente.`, r`Eine Sekante.`, r`Die Symmetrieachse.`], e: r`$x^2-2x+2=0$ hat $D=4-8<0$.` },
      { l: 2, q: r`Für welches $q$ ist $y=2x+q$ eine Tangente an $y=x^2$?`, a: [r`$q=-1$`, r`$q=1$`, r`$q=0$`, r`$q=-2$`], e: r`$x^2-2x-q=0$ mit $D=4+4q=0$.` },
      { l: 2, q: r`Welche Parabel geht durch $(0\,|\,2)$, $(1\,|\,3)$ und $(-1\,|\,5)$?`, a: [r`$y=2x^2-x+2$`, r`$y=x^2+2$`, r`$y=2x^2+x+2$`, r`$y=x^2-x+2$`], e: r`$c=2$; $a+b=1$ und $a-b=3$ ergeben $a=2$, $b=-1$.` },
      { l: 2, q: r`Welche Parabel hat den Scheitel $S(2\,|\,1)$ und geht durch $P(0\,|\,5)$?`, a: [r`$y=(x-2)^2+1$`, r`$y=2\,(x-2)^2+1$`, r`$y=(x+2)^2+1$`, r`$y=(x-2)^2+5$`], e: r`$a\cdot(0-2)^2+1=5$ ergibt $a=1$.` },
      { l: 2, q: r`Welche Parabel hat die Nullstellen 1 und 3 und geht durch $P(0\,|\,6)$?`, a: [r`$y=2\,(x-1)(x-3)$`, r`$y=(x-1)(x-3)$`, r`$y=2\,(x+1)(x+3)$`, r`$y=6\,(x-1)(x-3)$`], e: r`$a\cdot(-1)\cdot(-3)=6$ ergibt $a=2$.` },
      { l: 2, q: r`Durch drei Punkte, die auf einer Geraden liegen, geht keine Parabel $y=ax^2+bx+c$ mit $a\neq0$.`, tf: true, e: r`Das Gleichungssystem liefert dann $a=0$, also die Gerade selbst.` },
      { l: 2, q: r`Wo schneiden sich die Parabeln $y=x^2$ und $y=-x^2+2$?`, a: [r`In $(-1\,|\,1)$ und $(1\,|\,1)$`, r`Nur in $(1\,|\,1)$`, r`In $(0\,|\,0)$ und $(0\,|\,2)$`, r`Gar nicht`], e: r`$x^2=-x^2+2$ ergibt $x^2=1$.` },
      { l: 2, q: r`Eine senkrechte Gerade $x=k$ schneidet jede Parabel $y=ax^2+bx+c$ genau einmal.`, tf: true, e: r`Zu jedem $x$ gehört genau ein Funktionswert.` },

      { l: 3, q: r`Welche Tangente an $y=x^2$ hat die Steigung 4?`, a: [r`$y=4x-4$`, r`$y=4x+4$`, r`$y=4x$`, r`$y=4x-2$`], e: r`$x^2-4x-q=0$ mit $D=16+4q=0$ ergibt $q=-4$; Berührpunkt $(2\,|\,4)$.` },
      { l: 3, q: r`Für welche $m$ hat $y=mx-4$ keinen gemeinsamen Punkt mit $y=x^2$?`, a: [r`Für $-4<m<4$`, r`Für $|m|>4$`, r`Für $m<4$`, r`Für alle $m$`], e: r`$x^2-mx+4=0$ mit $D=m^2-16<0$.` },
      { l: 3, q: r`Die Gerade $y=x+2$ schneidet aus der Parabel $y=x^2$ eine Sehne. Wie lang ist sie?`, a: [r`$3\sqrt2$`, r`$3$`, r`$\sqrt{10}$`, r`$6$`], e: r`Schnittpunkte $(-1\,|\,1)$ und $(2\,|\,4)$; Abstand $\sqrt{3^2+3^2}$.` },
      { l: 3, q: r`Welche Steigung hat die Sekante durch die Punkte der Parabel $y=x^2$ bei $x=a$ und $x=b$?`, a: [r`$a+b$`, r`$a\cdot b$`, r`$b-a$`, r`$2\,(a+b)$`], e: r`$\frac{b^2-a^2}{b-a}=\frac{(b-a)(b+a)}{b-a}$.` },
      { l: 3, q: r`Die Tangente an $y=x^2$ im Punkt $(a\,|\,a^2)$ hat die Steigung $2a$.`, tf: true, e: r`Rückt in der Sekantensteigung $a+b$ der zweite Punkt zum ersten, so wird daraus $2a$.` },
      { l: 3, q: r`Wo schneiden sich die Parabeln $y=x^2$ und $y=(x-2)^2$?`, a: [r`Nur in $(1\,|\,1)$`, r`Gar nicht`, r`In $(2\,|\,4)$`, r`In $(0\,|\,0)$ und $(2\,|\,0)$`], e: r`$x^2=x^2-4x+4$ ergibt $x=1$: Die Quadrate fallen weg, es bleibt eine lineare Gleichung.` },
      { l: 3, q: r`Welche Geraden durch $(0\,|\,-1)$ berühren die Parabel $y=x^2$?`, a: [r`$y=2x-1$ und $y=-2x-1$`, r`Nur $y=2x-1$`, r`$y=x-1$ und $y=-x-1$`, r`Keine`], e: r`$x^2-mx+1=0$ mit $D=m^2-4=0$.` },
      { l: 3, q: r`Die Gerade $y=mx+q$ schneidet die Parabel $y=x^2$ in zwei Punkten. Welche $x$-Koordinate hat der Mittelpunkt der Sehne?`, a: [r`$\frac{m}{2}$`, r`$q$`, r`$m$`, r`$-\frac{m}{2}$`], e: r`$x^2-mx-q=0$: Nach Vieta ist $x_1+x_2=m$.` }
    ],

    // ───────────────────────── Optimierung: Preis, Umsatz, Gewinn ─────────────────────────
    opt: [
      { l: 1, q: r`Die Nachfrage ist $x(p)=100-2p$ (Stück beim Preis $p$). Was geschieht, wenn der Preis steigt?`, a: [r`Die Nachfrage sinkt.`, r`Die Nachfrage steigt.`, r`Die Nachfrage bleibt gleich.`, r`Die Nachfrage verdoppelt sich.`], e: r`Je teurer, desto weniger wird gekauft.` },
      { l: 1, q: r`Wie berechnet man den Umsatz?`, a: [r`Preis mal verkaufte Menge: $U=p\cdot x$`, r`Preis plus Menge: $U=p+x$`, r`Menge durch Preis: $U=\frac{x}{p}$`, r`Preis minus Menge: $U=p-x$`], e: r`Jedes der $x$ Stücke bringt den Preis $p$ ein.` },
      { l: 1, q: r`Wie berechnet man den Gewinn?`, a: [r`Umsatz minus Kosten: $G=U-K$`, r`Umsatz plus Kosten: $G=U+K$`, r`Kosten minus Umsatz: $G=K-U$`, r`Umsatz mal Kosten`], e: r`Was nach Abzug der Kosten übrig bleibt.` },
      { l: 1, q: r`$x(p)=100-2p$. Wie viele Stück werden beim Preis 20 verkauft?`, a: [r`$60$`, r`$80$`, r`$40$`, r`$98$`], e: r`$100-2\cdot20$.` },
      { l: 1, q: r`$U(p)=p\cdot(100-2p)$. Wie gross ist der Umsatz beim Preis 20?`, a: [r`$1200$`, r`$2000$`, r`$1600$`, r`$60$`], e: r`$20\cdot60$.` },
      { l: 1, q: r`Welche Form hat der Graph von $U(p)=p\cdot(100-2p)$?`, a: [r`Eine nach unten geöffnete Parabel.`, r`Eine Gerade.`, r`Eine nach oben geöffnete Parabel.`, r`Eine Hyperbel.`], e: r`$U(p)=-2p^2+100p$ mit negativem Faktor vor $p^2$.` },
      { l: 1, q: r`Wo liest man den umsatzmaximalen Preis ab?`, a: [r`Am Scheitel der Umsatzparabel.`, r`An der Nullstelle der Umsatzparabel.`, r`Am $y$-Achsenabschnitt.`, r`Am höchsten Preis.`], e: r`Der Scheitel ist der höchste Punkt der nach unten geöffneten Parabel.` },
      { l: 1, q: r`$x(p)=100-2p$. Bei welchem Preis wird nichts mehr verkauft?`, a: [r`Bei $p=50$`, r`Bei $p=100$`, r`Bei $p=2$`, r`Bei $p=25$`], e: r`$100-2p=0$.` },
      { l: 1, q: r`Beim Preis 0 ist der Umsatz 0.`, tf: true, e: r`Verschenkte Ware bringt nichts ein.` },
      { l: 1, q: r`Was sind Fixkosten?`, a: [r`Kosten, die unabhängig von der Stückzahl anfallen.`, r`Kosten pro Stück.`, r`Der Umsatz bei festem Preis.`, r`Der Gewinn pro Stück.`], e: r`Zum Beispiel Miete: Sie fällt an, auch wenn nichts verkauft wird.` },
      { l: 1, q: r`Was ist die Gewinnschwelle?`, a: [r`Der Preis, ab dem aus Verlust Gewinn wird ($G=0$).`, r`Der Preis mit dem grössten Gewinn.`, r`Der Preis mit dem grössten Umsatz.`, r`Der höchste mögliche Preis.`], e: r`Sie ist die kleinere Nullstelle der Gewinnparabel.` },
      { l: 1, q: r`Der höchste Preis bringt immer den höchsten Umsatz.`, tf: false, e: r`Bei sehr hohem Preis wird kaum noch etwas verkauft.` },

      { l: 2, q: r`Bei welchem Preis ist $U(p)=p\cdot(100-2p)$ am grössten?`, a: [r`Bei $p=25$`, r`Bei $p=50$`, r`Bei $p=20$`, r`Bei $p=12.5$`], e: r`Nullstellen 0 und 50; der Scheitel liegt in der Mitte.` },
      { l: 2, q: r`Wie gross ist der grösste Umsatz bei $U(p)=p\cdot(100-2p)$?`, a: [r`$1250$`, r`$2500$`, r`$1000$`, r`$625$`], e: r`$U(25)=25\cdot50$.` },
      { l: 2, q: r`Warum liegt der umsatzmaximale Preis genau in der Mitte zwischen 0 und dem Höchstpreis?`, a: [r`Weil die Umsatzparabel symmetrisch ist und dort ihre Nullstellen hat.`, r`Weil man immer die Hälfte nimmt.`, r`Weil die Nachfrage dort am grössten ist.`, r`Das ist Zufall.`], e: r`Der Scheitel einer Parabel liegt mitten zwischen den Nullstellen.` },
      { l: 2, q: r`Die Kosten sind $K=200+10x$, die Nachfrage $x=100-2p$. Wie lauten die Kosten als Funktion des Preises?`, a: [r`$K(p)=1200-20p$`, r`$K(p)=200+10p$`, r`$K(p)=1200+20p$`, r`$K(p)=200-20p$`], e: r`$200+10\cdot(100-2p)$.` },
      { l: 2, q: r`Der Gewinn ist $G(p)=-2p^2+120p-1200$. Bei welchem Preis ist er am grössten?`, a: [r`Bei $p=30$`, r`Bei $p=25$`, r`Bei $p=60$`, r`Bei $p=20$`], e: r`$p=-\frac{120}{2\cdot(-2)}$.` },
      { l: 2, q: r`Wie gross ist der grösste Gewinn bei $G(p)=-2p^2+120p-1200$?`, a: [r`$600$`, r`$1250$`, r`$0$`, r`$1200$`], e: r`$G(30)=-1800+3600-1200$.` },
      { l: 2, q: r`Verursacht jedes Stück Kosten, so ist der gewinnmaximale Preis höher als der umsatzmaximale.`, tf: true, e: r`Im Beispiel 30 statt 25: Weniger Stück zu verkaufen spart Kosten.` },
      { l: 2, q: r`$G(p)=-2p^2+120p-1200$. Zwischen welchen Preisen entsteht Gewinn?`, a: [r`Etwa zwischen 12.7 und 47.3`, r`Zwischen 0 und 50`, r`Zwischen 25 und 30`, r`Zwischen 10 und 60`], e: r`$p^2-60p+600=0$ ergibt $p=30\pm\sqrt{300}$.` },
      { l: 2, q: r`Jedes Stück kostet in der Herstellung 10 CHF. Was gilt für Preise unter 10 CHF?`, a: [r`Man macht mit jedem verkauften Stück Verlust.`, r`Der Gewinn ist dort am grössten.`, r`Der Umsatz ist negativ.`, r`Es wird nichts verkauft.`], e: r`Der Preis deckt nicht einmal die Stückkosten.` },
      { l: 2, q: r`Was bedeutet $B$ in der Nachfrage $x(p)=A-B\cdot p$?`, a: [r`Um wie viel die Nachfrage sinkt, wenn der Preis um 1 steigt.`, r`Den Höchstpreis.`, r`Die Nachfrage beim Preis 0.`, r`Die Fixkosten.`], e: r`$B$ ist der Betrag der Steigung der Nachfragegeraden.` },

      { l: 3, q: r`Bei welchem Preis ist der Umsatz für die Nachfrage $x(p)=A-B\cdot p$ am grössten?`, a: [r`$p=\frac{A}{2B}$`, r`$p=\frac{A}{B}$`, r`$p=\frac{A}{2}$`, r`$p=\frac{B}{2A}$`], e: r`$U(p)=p\,(A-Bp)$ hat die Nullstellen 0 und $\frac AB$.` },
      { l: 3, q: r`Die Nachfrage ist $x(p)=A-B\cdot p$, jedes Stück kostet $k$. Bei welchem Preis ist der Gewinn am grössten?`, a: [r`$p=\frac{A}{2B}+\frac{k}{2}$`, r`$p=\frac{A}{2B}$`, r`$p=\frac{A}{2B}+k$`, r`$p=\frac{A+k}{2B}$`], e: r`$G(p)=(p-k)(A-Bp)-K_f$ hat (ohne Fixkosten) die Nullstellen $k$ und $\frac AB$; der Scheitel liegt in der Mitte.` },
      { l: 3, q: r`Die Fixkosten verändern den gewinnmaximalen Preis nicht.`, tf: true, e: r`Sie verschieben die Gewinnparabel nur nach unten; der Scheitel bleibt an derselben Stelle.` },
      { l: 3, q: r`Die Stückkosten steigen um 4 CHF. Um wie viel steigt der gewinnmaximale Preis?`, a: [r`Um 2 CHF`, r`Um 4 CHF`, r`Gar nicht`, r`Um 8 CHF`], e: r`Im Preis $\frac{A}{2B}+\frac k2$ zählen die Stückkosten nur zur Hälfte.` },
      { l: 3, q: r`Nachfrage $x(p)=100-2p$, Stückkosten 10 CHF. Wie hoch dürfen die Fixkosten höchstens sein, damit beim besten Preis kein Verlust entsteht?`, a: [r`$800$ CHF`, r`$600$ CHF`, r`$1250$ CHF`, r`$200$ CHF`], e: r`$(p-10)(100-2p)$ ist bei $p=30$ am grössten: $20\cdot40$.` },
      { l: 3, q: r`Aus $x=100-2p$ folgt $p=\frac{100-x}{2}$. Bei welcher Menge ist der Umsatz $U(x)=x\cdot\frac{100-x}{2}$ am grössten?`, a: [r`Bei $x=50$`, r`Bei $x=100$`, r`Bei $x=25$`, r`Bei $x=75$`], e: r`Nullstellen 0 und 100; der Scheitel liegt in der Mitte. Dazu gehört der Preis 25.` },
      { l: 3, q: r`Beim umsatzmaximalen Preis wird genau die Hälfte der Menge verkauft, die beim Preis 0 nachgefragt würde.`, tf: true, e: r`$x\!\left(\frac{A}{2B}\right)=A-\frac A2$.` },
      { l: 3, q: r`$U(p)=p\cdot(100-2p)$. Um wie viel sinkt der Umsatz, wenn man den Preis vom besten Wert 25 auf 26 erhöht?`, a: [r`Um 2`, r`Um 50`, r`Gar nicht`, r`Um 24`], e: r`$U(26)=26\cdot48=1248$ statt 1250. Nahe am Scheitel verläuft die Parabel flach.` }
    ]
  };
})();
