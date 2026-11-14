// quiz_trig.js — Quizfragen zur Trigonometrie (wird von 116_quiz.js bei Bedarf geladen)
// Je Ansicht 30 Fragen: 12 × Stufe 1 (Grundwissen), 10 × Stufe 2 (Verständnis), 8 × Stufe 3 (Knacknuss).
// Die Reihenfolge hier ist die Reihenfolge im Quiz und auf dem Arbeitsblatt (Frage 1 bis 30).
// {l, q, a, e}: a[0] ist die richtige Antwort (Anzeige gemischt)   ·   {l, q, tf, e}: Aussage, tf = wahr/falsch
(function () {
  const r = String.raw;
  (window.QUIZ_DATA = window.QUIZ_DATA || {}).trig = {

    // ───────────────────────── Einheitskreis → Sinus und Kosinus ─────────────────────────
    circ: [
      { l: 1, q: r`Welchen Radius hat der Einheitskreis?`, a: [r`$1$`, r`$2$`, r`$\pi$`, r`$360$`], e: r`«Einheit» steht für die Länge 1.` },
      { l: 1, q: r`Der Punkt $P$ gehört auf dem Einheitskreis zum Winkel $\varphi$. Was ist $\sin\varphi$?`, a: [r`Die $y$-Koordinate von $P$.`, r`Die $x$-Koordinate von $P$.`, r`Der Abstand von $P$ zum Ursprung.`, r`Die Steigung des Strahls durch $P$.`], e: r`Der Sinus ist die Höhe von $P$ über der $x$-Achse.` },
      { l: 1, q: r`Der Punkt $P$ gehört auf dem Einheitskreis zum Winkel $\varphi$. Was ist $\cos\varphi$?`, a: [r`Die $x$-Koordinate von $P$.`, r`Die $y$-Koordinate von $P$.`, r`Der Abstand von $P$ zum Ursprung.`, r`Die Länge des Kreisbogens.`], e: r`Der Kosinus ist der waagrechte Abstand von $P$ zur $y$-Achse (mit Vorzeichen).` },
      { l: 1, q: r`Wie gross ist $\sin90^\circ$?`, a: [r`$1$`, r`$0$`, r`$-1$`, r`$\frac12$`], e: r`Bei $90^\circ$ liegt $P$ ganz oben, in $(0\,|\,1)$.` },
      { l: 1, q: r`Wie gross ist $\cos0^\circ$?`, a: [r`$1$`, r`$0$`, r`$-1$`, r`$\frac12$`], e: r`Bei $0^\circ$ liegt $P$ in $(1\,|\,0)$.` },
      { l: 1, q: r`Wie gross ist $\sin30^\circ$?`, a: [r`$\frac12$`, r`$\frac{\sqrt3}{2}$`, r`$\frac{\sqrt2}{2}$`, r`$\frac13$`], e: r`Einer der besonderen Werte, die man kennen sollte.` },
      { l: 1, q: r`Wie gross ist $\cos60^\circ$?`, a: [r`$\frac12$`, r`$\frac{\sqrt3}{2}$`, r`$\frac{\sqrt2}{2}$`, r`$1$`], e: r`$\cos60^\circ=\sin30^\circ$.` },
      { l: 1, q: r`Wie gross ist $\sin0^\circ$?`, a: [r`$0$`, r`$1$`, r`$-1$`, r`$\frac12$`], e: r`Bei $0^\circ$ liegt $P$ auf der $x$-Achse; die Höhe ist 0.` },
      { l: 1, q: r`Welche Werte kann $\sin\varphi$ annehmen?`, a: [r`Alle von $-1$ bis $1$.`, r`Alle von $0$ bis $1$.`, r`Alle reellen Zahlen.`, r`Alle von $0$ bis $360$.`], e: r`$P$ liegt auf einem Kreis mit Radius 1.` },
      { l: 1, q: r`Für jeden Winkel gilt $\sin^2\varphi+\cos^2\varphi=1$.`, tf: true, e: r`Pythagoras im Dreieck mit den Katheten $\sin\varphi$, $\cos\varphi$ und der Hypotenuse 1.` },
      { l: 1, q: r`Nach welchem Winkel wiederholen sich die Werte von Sinus und Kosinus?`, a: [r`Nach $360^\circ$`, r`Nach $180^\circ$`, r`Nach $90^\circ$`, r`Nach $720^\circ$`], e: r`Nach einer vollen Umdrehung ist $P$ wieder am selben Ort.` },
      { l: 1, q: r`Welchem Winkel im Bogenmass entsprechen $180^\circ$?`, a: [r`$\pi$`, r`$2\pi$`, r`$\frac{\pi}{2}$`, r`$180\pi$`], e: r`Der halbe Umfang des Einheitskreises ist $\pi$.` },

      { l: 2, q: r`Wie gross ist $\sin45^\circ$?`, a: [r`$\frac{\sqrt2}{2}$`, r`$\frac12$`, r`$\frac{\sqrt3}{2}$`, r`$1$`], e: r`Bei $45^\circ$ sind Sinus und Kosinus gleich: $2\sin^245^\circ=1$.` },
      { l: 2, q: r`Wie gross ist $\cos180^\circ$?`, a: [r`$-1$`, r`$1$`, r`$0$`, r`$-\frac12$`], e: r`Bei $180^\circ$ liegt $P$ in $(-1\,|\,0)$.` },
      { l: 2, q: r`Wie gross ist $\sin210^\circ$?`, a: [r`$-\frac12$`, r`$\frac12$`, r`$-\frac{\sqrt3}{2}$`, r`$\frac{\sqrt3}{2}$`], e: r`$210^\circ=180^\circ+30^\circ$: $P$ liegt unter der $x$-Achse, so tief wie bei $30^\circ$ hoch.` },
      { l: 2, q: r`In welchem Quadranten ist $\sin\varphi>0$ und $\cos\varphi<0$?`, a: [r`Im zweiten (zwischen $90^\circ$ und $180^\circ$).`, r`Im ersten.`, r`Im dritten.`, r`Im vierten.`], e: r`Links oben: $x$ negativ, $y$ positiv.` },
      { l: 2, q: r`Wie gross ist $\cos30^\circ$?`, a: [r`$\frac{\sqrt3}{2}$`, r`$\frac12$`, r`$\frac{\sqrt2}{2}$`, r`$\frac{\sqrt3}{3}$`], e: r`$\cos^230^\circ=1-\frac14=\frac34$.` },
      { l: 2, q: r`Wie gross ist $\sin150^\circ$?`, a: [r`$\frac12$`, r`$-\frac12$`, r`$\frac{\sqrt3}{2}$`, r`$-\frac{\sqrt3}{2}$`], e: r`$\sin(180^\circ-\varphi)=\sin\varphi$: Die Punkte zu $30^\circ$ und $150^\circ$ liegen gleich hoch.` },
      { l: 2, q: r`Es gilt $\cos(-\varphi)=\cos\varphi$.`, tf: true, e: r`Spiegelt man $P$ an der $x$-Achse, so bleibt die $x$-Koordinate gleich.` },
      { l: 2, q: r`Welchem Winkel im Bogenmass entsprechen $60^\circ$?`, a: [r`$\frac{\pi}{3}$`, r`$\frac{\pi}{6}$`, r`$\frac{\pi}{4}$`, r`$\frac{2\pi}{3}$`], e: r`$\frac{60}{180}\cdot\pi$.` },
      { l: 2, q: r`Für welche Winkel zwischen $0^\circ$ und $360^\circ$ ist $\sin\varphi=\frac12$?`, a: [r`Für $30^\circ$ und $150^\circ$`, r`Nur für $30^\circ$`, r`Für $30^\circ$ und $330^\circ$`, r`Für $60^\circ$ und $120^\circ$`], e: r`Auf der Höhe $\frac12$ liegen zwei Punkte des Kreises, symmetrisch zur $y$-Achse.` },
      { l: 2, q: r`Wie hängen die Kosinus- und die Sinuskurve zusammen?`, a: [r`$\cos\varphi=\sin(\varphi+90^\circ)$: Die Kosinuskurve ist die um $90^\circ$ nach links verschobene Sinuskurve.`, r`Sie sind gleich.`, r`Die Kosinuskurve ist die an der $x$-Achse gespiegelte Sinuskurve.`, r`Die Kosinuskurve ist doppelt so hoch.`], e: r`Der Kosinus ist dem Sinus um eine Vierteldrehung voraus.` },

      { l: 3, q: r`Es ist $\sin\varphi=0.6$, und $\varphi$ liegt im zweiten Quadranten. Wie gross ist $\cos\varphi$?`, a: [r`$-0.8$`, r`$0.8$`, r`$0.4$`, r`$-0.4$`], e: r`$\cos^2\varphi=1-0.36=0.64$; im zweiten Quadranten ist der Kosinus negativ.` },
      { l: 3, q: r`Für welche Winkel zwischen $0^\circ$ und $360^\circ$ ist $\sin\varphi=\cos\varphi$?`, a: [r`Für $45^\circ$ und $225^\circ$`, r`Nur für $45^\circ$`, r`Für $45^\circ$ und $135^\circ$`, r`Für $0^\circ$ und $180^\circ$`], e: r`$P$ liegt auf der Geraden $y=x$; sie trifft den Kreis zweimal.` },
      { l: 3, q: r`Wie gross ist $\sin300^\circ$?`, a: [r`$-\frac{\sqrt3}{2}$`, r`$\frac{\sqrt3}{2}$`, r`$-\frac12$`, r`$\frac12$`], e: r`$300^\circ=360^\circ-60^\circ$: so tief unter der Achse wie $60^\circ$ darüber.` },
      { l: 3, q: r`Es gilt $\sin(\varphi+180^\circ)=-\sin\varphi$.`, tf: true, e: r`Eine halbe Drehung bringt $P$ auf den gegenüberliegenden Punkt des Kreises.` },
      { l: 3, q: r`Wie viele Lösungen hat $\sin\varphi=0.3$ für $0^\circ\le\varphi<720^\circ$?`, a: [r`$4$`, r`$2$`, r`$1$`, r`$8$`], e: r`Zwei pro Umdrehung, und es sind zwei Umdrehungen.` },
      { l: 3, q: r`Wie lang ist auf dem Einheitskreis der Bogen zum Winkel $120^\circ$?`, a: [r`$\frac{2\pi}{3}$`, r`$\frac{\pi}{3}$`, r`$120$`, r`$\frac{4\pi}{3}$`], e: r`Ein Drittel des Umfangs $2\pi$. Das ist der Winkel im Bogenmass.` },
      { l: 3, q: r`Welchen grössten Wert nimmt $\sin\varphi+\cos\varphi$ an?`, a: [r`$\sqrt2$`, r`$2$`, r`$1$`, r`$\frac32$`], e: r`Bei $45^\circ$: $\frac{\sqrt2}{2}+\frac{\sqrt2}{2}$. Beide können nicht gleichzeitig 1 sein.` },
      { l: 3, q: r`Wie gross ist $\sin15^\circ\cdot\cos15^\circ$?`, a: [r`$\frac14$`, r`$\frac12$`, r`$\frac{\sqrt3}{4}$`, r`$\frac18$`], e: r`$\sin\varphi\cos\varphi=\frac12\sin(2\varphi)$, und $\sin30^\circ=\frac12$.` }
    ],

    // ───────────────────────── Allgemeine Sinusfunktion ─────────────────────────
    gen: [
      { l: 1, q: r`Was bedeutet $a$ in $f(x)=a\cdot\sin\big(b\,(x-c)\big)+d$ (für $a>0$)?`, a: [r`Die Amplitude.`, r`Die Periode.`, r`Die Verschiebung nach rechts.`, r`Die Mittellinie.`], e: r`So weit schwingt die Kurve von der Mittellinie aus nach oben und unten.` },
      { l: 1, q: r`Was bewirkt $d$ in $f(x)=a\cdot\sin\big(b\,(x-c)\big)+d$?`, a: [r`Es verschiebt die Kurve nach oben; die Mittellinie ist $y=d$.`, r`Es verschiebt die Kurve nach rechts.`, r`Es ändert die Periode.`, r`Es ändert die Amplitude.`], e: r`Zu jedem Funktionswert kommt $d$ dazu.` },
      { l: 1, q: r`Welche Periode hat $f(x)=\sin(b\,x)$ für $b>0$?`, a: [r`$\frac{2\pi}{b}$`, r`$2\pi b$`, r`$\frac{b}{2\pi}$`, r`$b$`], e: r`Je grösser $b$, desto schneller schwingt die Kurve.` },
      { l: 1, q: r`Was bewirkt $c$ in $f(x)=a\cdot\sin\big(b\,(x-c)\big)+d$?`, a: [r`Eine Verschiebung um $c$ nach rechts.`, r`Eine Verschiebung um $c$ nach oben.`, r`Eine Streckung.`, r`Eine Spiegelung.`], e: r`Die Schwingung beginnt bei $x=c$ statt bei $x=0$.` },
      { l: 1, q: r`Welchen grössten Wert nimmt $f(x)=3\sin x$ an?`, a: [r`$3$`, r`$1$`, r`$6$`, r`$\pi$`], e: r`Der Sinus ist höchstens 1.` },
      { l: 1, q: r`Welchen Wertebereich hat $f(x)=\sin x+2$?`, a: [r`Von 1 bis 3`, r`Von $-1$ bis 1`, r`Von 0 bis 2`, r`Von 2 bis 3`], e: r`$-1+2$ bis $1+2$.` },
      { l: 1, q: r`Welche Periode hat $f(x)=\sin(2x)$?`, a: [r`$\pi$`, r`$2\pi$`, r`$4\pi$`, r`$2$`], e: r`$\frac{2\pi}{2}$: Die Kurve schwingt doppelt so schnell.` },
      { l: 1, q: r`Welche Periode hat $f(x)=\sin x$ (im Bogenmass)?`, a: [r`$2\pi$`, r`$\pi$`, r`$360$`, r`$1$`], e: r`Eine volle Umdrehung am Einheitskreis.` },
      { l: 1, q: r`Ein negatives $a$ spiegelt die Kurve an ihrer Mittellinie.`, tf: true, e: r`Aus Hochpunkten werden Tiefpunkte und umgekehrt.` },
      { l: 1, q: r`Welche Amplitude hat $f(x)=2\sin x$?`, a: [r`$2$`, r`$1$`, r`$4$`, r`$2\pi$`], e: r`Der Faktor vor dem Sinus.` },
      { l: 1, q: r`Wie entsteht $f(x)=\sin\left(x-\frac{\pi}{2}\right)$ aus $\sin x$?`, a: [r`Durch Verschieben um $\frac{\pi}{2}$ nach rechts.`, r`Durch Verschieben um $\frac{\pi}{2}$ nach links.`, r`Durch Verschieben um $\frac{\pi}{2}$ nach unten.`, r`Durch Stauchen.`], e: r`$c=\frac{\pi}{2}$.` },
      { l: 1, q: r`$d$ verändert die Periode der Funktion.`, tf: false, e: r`$d$ verschiebt nur nach oben oder unten. Die Periode hängt allein von $b$ ab.` },

      { l: 2, q: r`Welche Periode hat $f(x)=2\sin(3x)+1$?`, a: [r`$\frac{2\pi}{3}$`, r`$3\pi$`, r`$6\pi$`, r`$\frac{\pi}{3}$`], e: r`$\frac{2\pi}{b}$ mit $b=3$.` },
      { l: 2, q: r`Welchen grössten und kleinsten Wert hat $f(x)=2\sin(3x)+1$?`, a: [r`$3$ und $-1$`, r`$2$ und $-2$`, r`$3$ und $1$`, r`$6$ und $-6$`], e: r`Mittellinie 1, Amplitude 2.` },
      { l: 2, q: r`Eine Sinusfunktion $\sin(b\,x)$ soll die Periode $4\pi$ haben. Wie gross ist $b$?`, a: [r`$\frac12$`, r`$2$`, r`$4$`, r`$\frac14$`], e: r`$\frac{2\pi}{b}=4\pi$.` },
      { l: 2, q: r`Welche Funktion ist dasselbe wie $\sin\left(x-\frac{\pi}{2}\right)$?`, a: [r`$-\cos x$`, r`$\cos x$`, r`$-\sin x$`, r`$\sin x-1$`], e: r`Bei $x=0$ ist der Wert $\sin\left(-\frac{\pi}{2}\right)=-1$, und die Kurve steigt von dort aus.` },
      { l: 2, q: r`Welchen Wertebereich hat $f(x)=-3\sin x+1$?`, a: [r`Von $-2$ bis $4$`, r`Von $-3$ bis $3$`, r`Von $-4$ bis $2$`, r`Von $1$ bis $4$`], e: r`Amplitude 3 um die Mittellinie 1; das Minus ändert den Bereich nicht.` },
      { l: 2, q: r`Bei welchem $x$ hat $f(x)=\sin(2x)$ seinen ersten Hochpunkt rechts von 0?`, a: [r`Bei $x=\frac{\pi}{4}$`, r`Bei $x=\frac{\pi}{2}$`, r`Bei $x=\pi$`, r`Bei $x=\frac{\pi}{8}$`], e: r`$2x=\frac{\pi}{2}$.` },
      { l: 2, q: r`Für alle $x$ gilt $\sin(x+2\pi)=\sin x$.`, tf: true, e: r`$2\pi$ ist die Periode.` },
      { l: 2, q: r`Welche Mittellinie hat $f(x)=4\sin x-1$?`, a: [r`$y=-1$`, r`$y=4$`, r`$y=0$`, r`$y=3$`], e: r`Die Mittellinie ist $y=d$.` },
      { l: 2, q: r`Eine Sinuskurve schwankt zwischen dem grössten Wert 5 und dem kleinsten Wert 1. Wie gross sind Amplitude und $d$?`, a: [r`Amplitude 2, $d=3$`, r`Amplitude 4, $d=1$`, r`Amplitude 5, $d=1$`, r`Amplitude 3, $d=2$`], e: r`Amplitude $\frac{5-1}{2}$, Mittellinie $\frac{5+1}{2}$.` },
      { l: 2, q: r`Ein Vorgang wiederholt sich alle 12 Stunden. Welches $b$ gehört zu $\sin(b\,t)$ mit $t$ in Stunden?`, a: [r`$\frac{\pi}{6}$`, r`$12$`, r`$\frac{\pi}{12}$`, r`$\frac{1}{12}$`], e: r`$b=\frac{2\pi}{12}$.` },

      { l: 3, q: r`Eine Sinuskurve hat den grössten Wert 5, den kleinsten Wert 1 und die Periode $\pi$; bei $x=0$ geht sie steigend durch die Mittellinie. Welche Funktion ist es?`, a: [r`$f(x)=2\sin(2x)+3$`, r`$f(x)=2\sin\left(\frac{x}{2}\right)+3$`, r`$f(x)=3\sin(2x)+2$`, r`$f(x)=4\sin(2x)+1$`], e: r`Amplitude 2, $d=3$, $b=\frac{2\pi}{\pi}=2$, keine Verschiebung.` },
      { l: 3, q: r`Welche Amplitude hat $f(x)=\sin x+\cos x$?`, a: [r`$\sqrt2$`, r`$2$`, r`$1$`, r`$\frac12$`], e: r`$\sin x+\cos x=\sqrt2\,\sin\left(x+\frac{\pi}{4}\right)$.` },
      { l: 3, q: r`Welche Nullstellen hat $f(x)=2\sin x-1$ zwischen 0 und $2\pi$?`, a: [r`$\frac{\pi}{6}$ und $\frac{5\pi}{6}$`, r`Nur $\frac{\pi}{6}$`, r`$\frac{\pi}{3}$ und $\frac{2\pi}{3}$`, r`$\frac{\pi}{6}$ und $\frac{11\pi}{6}$`], e: r`$\sin x=\frac12$ gilt bei $30^\circ$ und $150^\circ$.` },
      { l: 3, q: r`Es gilt $\sin(2x)=2\sin x$.`, tf: false, e: r`Zum Beispiel ist $\sin\pi=0$, aber $2\sin\frac{\pi}{2}=2$. Richtig ist $\sin(2x)=2\sin x\cos x$.` },
      { l: 3, q: r`Wie viele Nullstellen hat $f(x)=\sin(3x)$ im Intervall $[0,2\pi]$ (Ränder mitgezählt)?`, a: [r`$7$`, r`$6$`, r`$3$`, r`$4$`], e: r`$3x=k\pi$, also $x=0,\ \frac{\pi}{3},\ \ldots,\ 2\pi$: von $k=0$ bis $k=6$.` },
      { l: 3, q: r`Wie schreibt man $\cos x$ als Sinusfunktion?`, a: [r`$\sin\left(x+\frac{\pi}{2}\right)$`, r`$\sin\left(x-\frac{\pi}{2}\right)$`, r`$-\sin x$`, r`$\sin(x+\pi)$`], e: r`Die Kosinuskurve ist die um $\frac{\pi}{2}$ nach links verschobene Sinuskurve.` },
      { l: 3, q: r`Der Wasserstand ist $h(t)=2\sin\left(\frac{\pi}{6}\,t\right)+3$ ($h$ in m, $t$ in Stunden). Wann erreicht er zum ersten Mal 4 m?`, a: [r`Nach 1 Stunde`, r`Nach 3 Stunden`, r`Nach 2 Stunden`, r`Nach 6 Stunden`], e: r`$\sin\left(\frac{\pi}{6}\,t\right)=\frac12$ ergibt $\frac{\pi}{6}\,t=\frac{\pi}{6}$.` },
      { l: 3, q: r`Welche Periode hat $u(t)=\sin(2\pi\cdot50\cdot t)$ ($t$ in Sekunden)?`, a: [r`$0.02$ s`, r`$50$ s`, r`$0.5$ s`, r`$\frac{1}{100\pi}$ s`], e: r`$\frac{2\pi}{2\pi\cdot50}=\frac{1}{50}$: 50 Schwingungen pro Sekunde.` }
    ],

    // ───────────────────────── Tangens und Beziehungen ─────────────────────────
    tan: [
      { l: 1, q: r`Wie ist der Tangens festgelegt?`, a: [r`$\tan\varphi=\frac{\sin\varphi}{\cos\varphi}$`, r`$\tan\varphi=\frac{\cos\varphi}{\sin\varphi}$`, r`$\tan\varphi=\sin\varphi\cdot\cos\varphi$`, r`$\tan\varphi=\sin\varphi+\cos\varphi$`], e: r`Höhe durch waagrechten Abstand.` },
      { l: 1, q: r`Wie gross ist $\tan45^\circ$?`, a: [r`$1$`, r`$0$`, r`$\frac{\sqrt2}{2}$`, r`$\sqrt3$`], e: r`Sinus und Kosinus sind bei $45^\circ$ gleich.` },
      { l: 1, q: r`Wie gross ist $\tan0^\circ$?`, a: [r`$0$`, r`$1$`, r`Nicht definiert`, r`$-1$`], e: r`$\frac{0}{1}$.` },
      { l: 1, q: r`Was gilt für $\tan90^\circ$?`, a: [r`Er ist nicht definiert.`, r`Er ist 0.`, r`Er ist 1.`, r`Er ist $-1$.`], e: r`$\cos90^\circ=0$, und durch 0 kann man nicht teilen.` },
      { l: 1, q: r`Was bedeutet $\tan\varphi$ am Einheitskreis?`, a: [r`Die Steigung des Strahls vom Ursprung durch $P$.`, r`Die Höhe von $P$.`, r`Die Länge des Bogens.`, r`Den Abstand von $P$ zur $y$-Achse.`], e: r`Steigung = $\frac{\Delta y}{\Delta x}=\frac{\sin\varphi}{\cos\varphi}$.` },
      { l: 1, q: r`Nach welchem Winkel wiederholen sich die Werte des Tangens?`, a: [r`Nach $180^\circ$`, r`Nach $360^\circ$`, r`Nach $90^\circ$`, r`Nach $45^\circ$`], e: r`Der gegenüberliegende Punkt des Kreises liegt auf demselben Strahl durch den Ursprung.` },
      { l: 1, q: r`Wie gross ist $\tan60^\circ$?`, a: [r`$\sqrt3$`, r`$\frac{\sqrt3}{3}$`, r`$1$`, r`$\frac{\sqrt3}{2}$`], e: r`$\frac{\sqrt3/2}{1/2}$.` },
      { l: 1, q: r`Wie gross ist $\tan30^\circ$?`, a: [r`$\frac{\sqrt3}{3}$`, r`$\sqrt3$`, r`$\frac12$`, r`$1$`], e: r`$\frac{1/2}{\sqrt3/2}=\frac{1}{\sqrt3}$.` },
      { l: 1, q: r`Der Tangens kann beliebig grosse Werte annehmen.`, tf: true, e: r`Nahe bei $90^\circ$ wird der Strahl beliebig steil.` },
      { l: 1, q: r`Wo hat der Tangens seine Polstellen?`, a: [r`Bei $90^\circ$, $270^\circ$, … (alle $180^\circ$)`, r`Bei $0^\circ$, $180^\circ$, …`, r`Bei $45^\circ$, $225^\circ$, …`, r`Nirgends`], e: r`Überall dort, wo der Kosinus 0 ist.` },
      { l: 1, q: r`Wie gross ist $\tan135^\circ$?`, a: [r`$-1$`, r`$1$`, r`$0$`, r`$-\sqrt3$`], e: r`Der Strahl fällt mit der Steigung $-1$.` },
      { l: 1, q: r`Es gilt $\tan(-\varphi)=-\tan\varphi$.`, tf: true, e: r`Der Sinus wechselt das Vorzeichen, der Kosinus nicht.` },

      { l: 2, q: r`Es ist $\sin\varphi=0.6$ mit $0^\circ<\varphi<90^\circ$. Wie gross ist $\cos\varphi$?`, a: [r`$0.8$`, r`$0.4$`, r`$0.64$`, r`$-0.8$`], e: r`$\cos^2\varphi=1-0.36$.` },
      { l: 2, q: r`Es ist $\sin\varphi=0.6$ und $\cos\varphi=0.8$. Wie gross ist $\tan\varphi$?`, a: [r`$0.75$`, r`$1.33$`, r`$0.48$`, r`$1.4$`], e: r`$\frac{0.6}{0.8}$.` },
      { l: 2, q: r`Was ergibt $1+\tan^2\varphi$?`, a: [r`$\frac{1}{\cos^2\varphi}$`, r`$\frac{1}{\sin^2\varphi}$`, r`$\cos^2\varphi$`, r`$2$`], e: r`$\sin^2\varphi+\cos^2\varphi=1$ durch $\cos^2\varphi$ teilen.` },
      { l: 2, q: r`Eine Strasse hat 100 % Steigung. Welchen Steigungswinkel hat sie?`, a: [r`$45^\circ$`, r`$90^\circ$`, r`$60^\circ$`, r`$100^\circ$`], e: r`$\tan\alpha=1$.` },
      { l: 2, q: r`Für welche Winkel zwischen $0^\circ$ und $360^\circ$ ist $\tan\varphi=1$?`, a: [r`Für $45^\circ$ und $225^\circ$`, r`Nur für $45^\circ$`, r`Für $45^\circ$ und $135^\circ$`, r`Für $45^\circ$ und $315^\circ$`], e: r`Die Periode ist $180^\circ$.` },
      { l: 2, q: r`In welchen Quadranten ist der Tangens positiv?`, a: [r`Im ersten und dritten.`, r`Im ersten und zweiten.`, r`Im ersten und vierten.`, r`Nur im ersten.`], e: r`Dort haben Sinus und Kosinus dasselbe Vorzeichen.` },
      { l: 2, q: r`$\tan89^\circ$ ist grösser als 50.`, tf: true, e: r`$\tan89^\circ\approx57.3$: Kurz vor der Polstelle ist der Strahl sehr steil.` },
      { l: 2, q: r`Welchen Steigungswinkel hat die Gerade $y=\sqrt3\,x$?`, a: [r`$60^\circ$`, r`$30^\circ$`, r`$45^\circ$`, r`$75^\circ$`], e: r`$\tan\alpha=m=\sqrt3$.` },
      { l: 2, q: r`Was ergibt $\tan(180^\circ+\varphi)$?`, a: [r`$\tan\varphi$`, r`$-\tan\varphi$`, r`$\frac{1}{\tan\varphi}$`, r`$0$`], e: r`Sinus und Kosinus wechseln beide das Vorzeichen; der Quotient bleibt.` },
      { l: 2, q: r`Wie gross ist $\tan120^\circ$?`, a: [r`$-\sqrt3$`, r`$\sqrt3$`, r`$-\frac{\sqrt3}{3}$`, r`$-1$`], e: r`$\frac{\sqrt3/2}{-1/2}$.` },

      { l: 3, q: r`Es ist $\tan\varphi=2$ mit $0^\circ<\varphi<90^\circ$. Wie gross ist $\sin\varphi$?`, a: [r`$\frac{2}{\sqrt5}$`, r`$\frac{1}{\sqrt5}$`, r`$\frac23$`, r`$\frac{2}{\sqrt3}$`], e: r`Rechtwinkliges Dreieck mit den Katheten 2 und 1; die Hypotenuse ist $\sqrt5$.` },
      { l: 3, q: r`Welchen Winkel schliessen die Geraden $y=x$ und $y=\sqrt3\,x$ ein?`, a: [r`$15^\circ$`, r`$30^\circ$`, r`$45^\circ$`, r`$60^\circ$`], e: r`Steigungswinkel $45^\circ$ und $60^\circ$.` },
      { l: 3, q: r`Wie gross ist $\tan15^\circ$ genau?`, a: [r`$2-\sqrt3$`, r`$\frac{\sqrt3}{6}$`, r`$\sqrt3-1$`, r`$\frac14$`], e: r`$\tan(45^\circ-30^\circ)=\frac{1-\frac{1}{\sqrt3}}{1+\frac{1}{\sqrt3}}=\frac{\sqrt3-1}{\sqrt3+1}$.` },
      { l: 3, q: r`Es gilt $\tan(\alpha+\beta)=\tan\alpha+\tan\beta$.`, tf: false, e: r`Zum Beispiel $\tan90^\circ$ ist nicht definiert, aber $\tan45^\circ+\tan45^\circ=2$.` },
      { l: 3, q: r`Was ergibt $\tan75^\circ\cdot\tan15^\circ$?`, a: [r`$1$`, r`$\frac12$`, r`$2$`, r`$\sqrt3$`], e: r`$\tan(90^\circ-\varphi)=\frac{1}{\tan\varphi}$.` },
      { l: 3, q: r`Wie lautet die Ableitung von $\tan x$?`, a: [r`$\frac{1}{\cos^2x}$`, r`$\frac{1}{\sin^2x}$`, r`$-\frac{1}{\cos^2x}$`, r`$\frac{\cos x}{\sin x}$`], e: r`Quotientenregel: $\frac{\cos^2x+\sin^2x}{\cos^2x}$.` },
      { l: 3, q: r`Welchen grössten Wert nimmt $\sin\varphi\cdot\cos\varphi$ an?`, a: [r`$\frac12$`, r`$1$`, r`$\frac{\sqrt2}{2}$`, r`$\frac14$`], e: r`$\sin\varphi\cos\varphi=\frac12\sin(2\varphi)$, am grössten bei $45^\circ$.` },
      { l: 3, q: r`Für welche Winkel mit $0^\circ\le\varphi<360^\circ$ ist $\tan\varphi=\sin\varphi$?`, a: [r`Für $0^\circ$ und $180^\circ$`, r`Für $45^\circ$ und $225^\circ$`, r`Für alle Winkel`, r`Für keinen Winkel`], e: r`$\sin\varphi\left(\frac{1}{\cos\varphi}-1\right)=0$: entweder $\sin\varphi=0$ oder $\cos\varphi=1$.` }
    ],

    // ───────────────────────── Rechtwinkliges Dreieck ─────────────────────────
    rt: [
      { l: 1, q: r`Wie ist $\sin\alpha$ im rechtwinkligen Dreieck festgelegt?`, a: [r`Gegenkathete durch Hypotenuse`, r`Ankathete durch Hypotenuse`, r`Gegenkathete durch Ankathete`, r`Hypotenuse durch Gegenkathete`], e: r`Die Gegenkathete liegt dem Winkel gegenüber.` },
      { l: 1, q: r`Wie ist $\cos\alpha$ im rechtwinkligen Dreieck festgelegt?`, a: [r`Ankathete durch Hypotenuse`, r`Gegenkathete durch Hypotenuse`, r`Gegenkathete durch Ankathete`, r`Ankathete durch Gegenkathete`], e: r`Die Ankathete liegt am Winkel an.` },
      { l: 1, q: r`Wie ist $\tan\alpha$ im rechtwinkligen Dreieck festgelegt?`, a: [r`Gegenkathete durch Ankathete`, r`Ankathete durch Gegenkathete`, r`Gegenkathete durch Hypotenuse`, r`Ankathete durch Hypotenuse`], e: r`Der Tangens braucht die Hypotenuse nicht.` },
      { l: 1, q: r`Welche Seite ist die Hypotenuse?`, a: [r`Die Seite gegenüber dem rechten Winkel.`, r`Die kürzeste Seite.`, r`Die Seite am Winkel $\alpha$.`, r`Die Seite gegenüber von $\alpha$.`], e: r`Sie ist zugleich die längste Seite.` },
      { l: 1, q: r`Die Katheten sind 3 und 4 lang. Wie lang ist die Hypotenuse?`, a: [r`$5$`, r`$7$`, r`$25$`, r`$\sqrt7$`], e: r`Pythagoras: $\sqrt{9+16}$.` },
      { l: 1, q: r`Die Gegenkathete von $\alpha$ ist 3, die Hypotenuse 5. Wie gross ist $\sin\alpha$?`, a: [r`$0.6$`, r`$0.8$`, r`$0.75$`, r`$1.67$`], e: r`$\frac35$.` },
      { l: 1, q: r`Wie gross ist die Summe der beiden spitzen Winkel im rechtwinkligen Dreieck?`, a: [r`$90^\circ$`, r`$180^\circ$`, r`$45^\circ$`, r`$60^\circ$`], e: r`Winkelsumme $180^\circ$ minus den rechten Winkel.` },
      { l: 1, q: r`$\sin\alpha$ hängt nur vom Winkel ab, nicht von der Grösse des Dreiecks.`, tf: true, e: r`In ähnlichen Dreiecken sind die Seitenverhältnisse gleich.` },
      { l: 1, q: r`Die Hypotenuse ist 10 lang, $\alpha=30^\circ$. Wie lang ist die Gegenkathete von $\alpha$?`, a: [r`$5$`, r`$8.66$`, r`$20$`, r`$3$`], e: r`$10\cdot\sin30^\circ$.` },
      { l: 1, q: r`Die Gegenkathete von $\alpha$ ist 3, die Ankathete 4. Wie gross ist $\tan\alpha$?`, a: [r`$0.75$`, r`$1.33$`, r`$0.6$`, r`$0.8$`], e: r`$\frac34$.` },
      { l: 1, q: r`Gegenkathete und Hypotenuse sind bekannt. Womit berechnet man den Winkel?`, a: [r`Mit $\sin^{-1}$ (Arkussinus)`, r`Mit $\cos^{-1}$`, r`Mit $\tan^{-1}$`, r`Mit dem Satz des Pythagoras`], e: r`Der Arkussinus macht aus dem Verhältnis wieder den Winkel.` },
      { l: 1, q: r`Die Hypotenuse ist immer länger als jede der beiden Katheten.`, tf: true, e: r`Deshalb liegen Sinus und Kosinus spitzer Winkel zwischen 0 und 1.` },

      { l: 2, q: r`Die Hypotenuse ist 10 lang, $\alpha=60^\circ$. Wie lang ist die Ankathete von $\alpha$?`, a: [r`$5$`, r`$8.66$`, r`$10$`, r`$17.3$`], e: r`$10\cdot\cos60^\circ$.` },
      { l: 2, q: r`Die Gegenkathete von $\alpha=30^\circ$ ist 5 lang. Wie lang ist die Hypotenuse?`, a: [r`$10$`, r`$2.5$`, r`$5.77$`, r`$8.66$`], e: r`$\frac{5}{\sin30^\circ}$.` },
      { l: 2, q: r`Die Ankathete von $\alpha=45^\circ$ ist 10 lang. Wie lang ist die Gegenkathete?`, a: [r`$10$`, r`$7.07$`, r`$14.1$`, r`$5$`], e: r`$10\cdot\tan45^\circ$: Das Dreieck ist gleichschenklig.` },
      { l: 2, q: r`$\alpha$ und $\beta$ sind die spitzen Winkel eines rechtwinkligen Dreiecks. Was ist $\sin\alpha$ auch?`, a: [r`$\cos\beta$`, r`$\sin\beta$`, r`$\tan\beta$`, r`$1-\sin\beta$`], e: r`Die Gegenkathete von $\alpha$ ist die Ankathete von $\beta$.` },
      { l: 2, q: r`Eine 5 m lange Leiter lehnt mit dem Neigungswinkel $70^\circ$ an einer Wand. Wie hoch reicht sie?`, a: [r`Etwa 4.70 m`, r`Etwa 1.71 m`, r`Etwa 5.32 m`, r`Etwa 3.50 m`], e: r`$5\cdot\sin70^\circ$.` },
      { l: 2, q: r`Aus 50 m Entfernung sieht man die Spitze eines Turms unter dem Höhenwinkel $30^\circ$. Wie hoch ist der Turm (Augenhöhe vernachlässigt)?`, a: [r`Etwa 28.9 m`, r`25 m`, r`Etwa 43.3 m`, r`Etwa 86.6 m`], e: r`$50\cdot\tan30^\circ$.` },
      { l: 2, q: r`Sind beide Katheten gleich lang, so sind die spitzen Winkel $45^\circ$.`, tf: true, e: r`$\tan\alpha=1$.` },
      { l: 2, q: r`Die Gegenkathete von $\alpha$ ist 6, die Hypotenuse 10. Wie gross ist $\alpha$?`, a: [r`Etwa $36.9^\circ$`, r`Etwa $53.1^\circ$`, r`$30^\circ$`, r`$60^\circ$`], e: r`$\sin^{-1}(0.6)$.` },
      { l: 2, q: r`Eine Strasse hat 12 % Steigung. Wie gross ist der Steigungswinkel?`, a: [r`Etwa $6.8^\circ$`, r`$12^\circ$`, r`Etwa $10.8^\circ$`, r`Etwa $83.2^\circ$`], e: r`$\tan^{-1}(0.12)$.` },
      { l: 2, q: r`Welche Fläche hat das rechtwinklige Dreieck mit den Katheten 3 und 4?`, a: [r`$6$`, r`$12$`, r`$10$`, r`$7.5$`], e: r`$\frac12\cdot3\cdot4$: Die Katheten sind Grundseite und Höhe.` },

      { l: 3, q: r`Wie lang ist im Dreieck mit den Seiten 3, 4 und 5 die Höhe auf die Hypotenuse?`, a: [r`$2.4$`, r`$2.5$`, r`$3$`, r`$1.2$`], e: r`Fläche auf zwei Arten: $\frac12\cdot3\cdot4=\frac12\cdot5\cdot h$.` },
      { l: 3, q: r`Wie hoch ist ein gleichseitiges Dreieck mit der Seitenlänge 2?`, a: [r`$\sqrt3$`, r`$2$`, r`$1$`, r`$\sqrt2$`], e: r`Die Höhe teilt es in zwei rechtwinklige Dreiecke: $\sqrt{2^2-1^2}$.` },
      { l: 3, q: r`Ein 2 m hoher Stab wirft einen Schatten von $2\sqrt3$ m. Wie hoch steht die Sonne?`, a: [r`$30^\circ$`, r`$60^\circ$`, r`$45^\circ$`, r`$15^\circ$`], e: r`$\tan\alpha=\frac{2}{2\sqrt3}=\frac{1}{\sqrt3}$.` },
      { l: 3, q: r`Verdoppelt man alle Seiten eines Dreiecks, so verdoppeln sich auch seine Winkel.`, tf: false, e: r`Das Dreieck ist ähnlich zum alten: Die Winkel bleiben gleich.` },
      { l: 3, q: r`Welchen Winkel schliesst die Raumdiagonale eines Würfels mit der Grundfläche ein?`, a: [r`Etwa $35.3^\circ$`, r`$45^\circ$`, r`$30^\circ$`, r`Etwa $54.7^\circ$`], e: r`$\tan\alpha=\frac{s}{s\sqrt2}=\frac{1}{\sqrt2}$: Höhe durch Flächendiagonale.` },
      { l: 3, q: r`Für welchen spitzen Winkel ist $\sin\alpha=\cos\alpha$?`, a: [r`Für $45^\circ$`, r`Für $30^\circ$`, r`Für $60^\circ$`, r`Für keinen`], e: r`Dann sind Gegenkathete und Ankathete gleich lang.` },
      { l: 3, q: r`Am Ufer steht man genau gegenüber einem Baum am anderen Ufer. Nach 40 m entlang des Ufers sieht man ihn unter dem Winkel $60^\circ$ zum Ufer. Wie breit ist der Fluss?`, a: [r`Etwa 69.3 m`, r`Etwa 34.6 m`, r`Etwa 23.1 m`, r`80 m`], e: r`$40\cdot\tan60^\circ=40\sqrt3$.` },
      { l: 3, q: r`In einem rechtwinkligen Dreieck ist $\alpha=30^\circ$. In welchem Verhältnis stehen Gegenkathete, Ankathete und Hypotenuse?`, a: [r`$1:\sqrt3:2$`, r`$1:2:\sqrt3$`, r`$1:1:\sqrt2$`, r`$1:2:3$`], e: r`Halbes gleichseitiges Dreieck: $\sin30^\circ=\frac12$ und $\cos30^\circ=\frac{\sqrt3}{2}$.` }
    ],

    // ───────────────────────── Allgemeines Dreieck ─────────────────────────
    tri: [
      { l: 1, q: r`Wie lautet der Sinussatz?`, a: [r`$\frac{a}{\sin\alpha}=\frac{b}{\sin\beta}=\frac{c}{\sin\gamma}$`, r`$a\sin\alpha=b\sin\beta=c\sin\gamma$`, r`$\frac{a}{\cos\alpha}=\frac{b}{\cos\beta}=\frac{c}{\cos\gamma}$`, r`$a+b+c=\sin\alpha+\sin\beta+\sin\gamma$`], e: r`Jede Seite durch den Sinus des gegenüberliegenden Winkels.` },
      { l: 1, q: r`Wie lautet der Kosinussatz für die Seite $c$?`, a: [r`$c^2=a^2+b^2-2ab\cos\gamma$`, r`$c^2=a^2+b^2+2ab\cos\gamma$`, r`$c^2=a^2+b^2-ab\cos\gamma$`, r`$c^2=a^2-b^2-2ab\cos\gamma$`], e: r`Pythagoras mit einem Korrekturglied für den Winkel $\gamma$.` },
      { l: 1, q: r`Wie gross ist die Winkelsumme im Dreieck?`, a: [r`$180^\circ$`, r`$360^\circ$`, r`$90^\circ$`, r`$270^\circ$`], e: r`In jedem Dreieck.` },
      { l: 1, q: r`Es ist $\alpha=50^\circ$ und $\beta=60^\circ$. Wie gross ist $\gamma$?`, a: [r`$70^\circ$`, r`$110^\circ$`, r`$80^\circ$`, r`$60^\circ$`], e: r`$180^\circ-50^\circ-60^\circ$.` },
      { l: 1, q: r`Alle drei Seiten sind gegeben. Mit welchem Satz berechnet man einen Winkel?`, a: [r`Mit dem Kosinussatz.`, r`Mit dem Sinussatz.`, r`Mit dem Satz des Pythagoras.`, r`Mit der Winkelsumme.`], e: r`Für den Sinussatz fehlt ein Winkel.` },
      { l: 1, q: r`Zwei Seiten und der eingeschlossene Winkel sind gegeben. Mit welchem Satz berechnet man die dritte Seite?`, a: [r`Mit dem Kosinussatz.`, r`Mit dem Sinussatz.`, r`Mit der Winkelsumme.`, r`Mit dem Strahlensatz.`], e: r`Genau diese Stücke stehen auf der rechten Seite des Kosinussatzes.` },
      { l: 1, q: r`Eine Seite und zwei Winkel sind gegeben. Mit welchem Satz berechnet man eine weitere Seite?`, a: [r`Mit dem Sinussatz.`, r`Mit dem Kosinussatz.`, r`Mit dem Satz des Pythagoras.`, r`Das geht nicht.`], e: r`Der dritte Winkel folgt aus der Winkelsumme, dann passt der Sinussatz.` },
      { l: 1, q: r`Für $\gamma=90^\circ$ wird der Kosinussatz zum Satz des Pythagoras.`, tf: true, e: r`$\cos90^\circ=0$, und das Korrekturglied fällt weg.` },
      { l: 1, q: r`Wo liegt im Dreieck die längste Seite?`, a: [r`Gegenüber dem grössten Winkel.`, r`Gegenüber dem kleinsten Winkel.`, r`Am grössten Winkel.`, r`Das lässt sich nicht sagen.`], e: r`Grösserer Winkel, längere gegenüberliegende Seite.` },
      { l: 1, q: r`Wie berechnet man die Fläche aus zwei Seiten und dem eingeschlossenen Winkel?`, a: [r`$A=\frac12\,a\,b\,\sin\gamma$`, r`$A=a\,b\,\sin\gamma$`, r`$A=\frac12\,a\,b\,\cos\gamma$`, r`$A=\frac12\,a\,b$`], e: r`$b\sin\gamma$ ist die Höhe auf $a$.` },
      { l: 1, q: r`Wie gross sind die Winkel im gleichseitigen Dreieck?`, a: [r`Je $60^\circ$`, r`Je $45^\circ$`, r`Je $90^\circ$`, r`$30^\circ$, $60^\circ$ und $90^\circ$`], e: r`$180^\circ$ auf drei gleiche Winkel verteilt.` },
      { l: 1, q: r`Der Sinussatz gilt nur in rechtwinkligen Dreiecken.`, tf: false, e: r`Er gilt in jedem Dreieck.` },

      { l: 2, q: r`Es ist $a=5$, $b=7$ und $\gamma=60^\circ$. Wie lang ist $c$?`, a: [r`$\sqrt{39}\approx6.24$`, r`$\sqrt{74}\approx8.60$`, r`$\sqrt{109}\approx10.44$`, r`$6$`], e: r`$c^2=25+49-2\cdot5\cdot7\cdot\frac12$.` },
      { l: 2, q: r`Es ist $a=8$, $\alpha=30^\circ$ und $\beta=45^\circ$. Wie lang ist $b$?`, a: [r`$8\sqrt2\approx11.3$`, r`$4\sqrt2\approx5.66$`, r`$12$`, r`$16$`], e: r`$b=\frac{a\,\sin\beta}{\sin\alpha}=\frac{8\cdot\frac{\sqrt2}{2}}{\frac12}$.` },
      { l: 2, q: r`Ein Dreieck hat die Seiten 3, 4 und 6. Was gilt für den Winkel gegenüber der Seite 6?`, a: [r`Er ist stumpf (grösser als $90^\circ$).`, r`Er ist ein rechter Winkel.`, r`Er ist spitz.`, r`Ein solches Dreieck gibt es nicht.`], e: r`$\cos\gamma=\frac{9+16-36}{24}<0$.` },
      { l: 2, q: r`Es ist $a=4$, $b=6$ und $\gamma=30^\circ$. Wie gross ist die Fläche?`, a: [r`$6$`, r`$12$`, r`$10.4$`, r`$24$`], e: r`$\frac12\cdot4\cdot6\cdot\frac12$.` },
      { l: 2, q: r`Zwei Seiten und ein Winkel, der nicht zwischen ihnen liegt, sind gegeben. Was kann geschehen?`, a: [r`Es kann zwei verschiedene Dreiecke geben.`, r`Es gibt immer genau ein Dreieck.`, r`Es gibt nie ein Dreieck.`, r`Das Dreieck ist immer rechtwinklig.`], e: r`Der Sinussatz liefert $\sin\beta$, und dazu passen ein spitzer und ein stumpfer Winkel.` },
      { l: 2, q: r`Ist $\cos\gamma<0$, so ist $\gamma$ ein stumpfer Winkel.`, tf: true, e: r`Der Kosinus ist zwischen $90^\circ$ und $180^\circ$ negativ.` },
      { l: 2, q: r`Es ist $a=7$, $b=7$ und $\gamma=60^\circ$. Wie lang ist $c$?`, a: [r`$7$`, r`$7\sqrt3$`, r`$14$`, r`$3.5$`], e: r`Gleichschenklig mit $60^\circ$ an der Spitze ist gleichseitig.` },
      { l: 2, q: r`Gibt es ein Dreieck mit den Seiten 2, 3 und 6?`, a: [r`Nein, denn $2+3<6$.`, r`Ja, ein spitzwinkliges.`, r`Ja, ein stumpfwinkliges.`, r`Ja, ein rechtwinkliges.`], e: r`Zwei Seiten zusammen müssen länger sein als die dritte.` },
      { l: 2, q: r`Es ist $a=6$, $b=9$ und $\alpha=30^\circ$. Wie gross ist $\sin\beta$?`, a: [r`$0.75$`, r`$0.33$`, r`$0.5$`, r`$1.5$`], e: r`$\sin\beta=\frac{b\,\sin\alpha}{a}=\frac{9\cdot0.5}{6}$.` },
      { l: 2, q: r`Im Sinussatz ist $\frac{a}{\sin\alpha}=2R$ mit dem Umkreisradius $R$. Wie gross ist $R$ für $a=5$ und $\alpha=30^\circ$?`, a: [r`$5$`, r`$10$`, r`$2.5$`, r`$20$`], e: r`$\frac{5}{0.5}=10=2R$.` },

      { l: 3, q: r`Es ist $a=5$, $b=8$ und $\alpha=30^\circ$. Wie viele Dreiecke gibt es dazu?`, a: [r`Zwei.`, r`Eines.`, r`Keines.`, r`Unendlich viele.`], e: r`$\sin\beta=0.8$ ergibt $\beta\approx53.1^\circ$ oder $\beta\approx126.9^\circ$; beide lassen Platz für $\gamma$.` },
      { l: 3, q: r`Es ist $a=4$, $b=8$ und $\alpha=30^\circ$. Wie viele Dreiecke gibt es dazu?`, a: [r`Genau eines (rechtwinklig).`, r`Zwei.`, r`Keines.`, r`Unendlich viele.`], e: r`$\sin\beta=\frac{8\cdot0.5}{4}=1$, also $\beta=90^\circ$.` },
      { l: 3, q: r`Es ist $a=3$, $b=8$ und $\alpha=30^\circ$. Wie viele Dreiecke gibt es dazu?`, a: [r`Keines.`, r`Eines.`, r`Zwei.`, r`Unendlich viele.`], e: r`$\sin\beta=\frac{8\cdot0.5}{3}>1$ ist nicht möglich: Die Seite $a$ ist zu kurz.` },
      { l: 3, q: r`Durch seine drei Winkel ist ein Dreieck eindeutig bestimmt.`, tf: false, e: r`Die Winkel legen nur die Form fest. Es gibt beliebig grosse ähnliche Dreiecke.` },
      { l: 3, q: r`Zwei Schiffe verlassen denselben Hafen unter einem Winkel von $120^\circ$ und fahren 10 km und 14 km weit. Wie weit sind sie voneinander entfernt?`, a: [r`Etwa 20.9 km`, r`Etwa 12.5 km`, r`24 km`, r`Etwa 17.2 km`], e: r`$d^2=100+196-2\cdot10\cdot14\cdot\cos120^\circ=436$.` },
      { l: 3, q: r`Welche Fläche hat das Dreieck mit den Seiten 7, 8 und 9?`, a: [r`$\sqrt{720}\approx26.8$`, r`$28$`, r`$31.5$`, r`$24$`], e: r`Heron mit $s=12$: $\sqrt{12\cdot5\cdot4\cdot3}$.` },
      { l: 3, q: r`Ein Parallelogramm hat die Seiten 5 und 8 und einen Winkel von $60^\circ$. Wie lang ist die kürzere Diagonale?`, a: [r`$7$`, r`$\sqrt{129}\approx11.4$`, r`$\sqrt{89}\approx9.43$`, r`$6.5$`], e: r`$\sqrt{25+64-2\cdot5\cdot8\cdot\frac12}=\sqrt{49}$.` },
      { l: 3, q: r`Ein Dreieck hat die Seiten 5, 5 und 6. Wie gross ist der Winkel gegenüber der Seite 6?`, a: [r`Etwa $73.7^\circ$`, r`$60^\circ$`, r`Etwa $53.1^\circ$`, r`$90^\circ$`], e: r`$\cos\gamma=\frac{25+25-36}{50}=0.28$.` }
    ]
  };
})();
