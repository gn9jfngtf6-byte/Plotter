// quiz_int.js — Quizfragen zur Integralrechnung (wird von 116_quiz.js bei Bedarf geladen)
// Je Ansicht 30 Fragen: 12 × Stufe 1 (Grundwissen), 10 × Stufe 2 (Verständnis), 8 × Stufe 3 (Knacknuss).
// Die Reihenfolge hier ist die Reihenfolge im Quiz und auf dem Arbeitsblatt (Frage 1 bis 30).
// {l, q, a, e}: a[0] ist die richtige Antwort (Anzeige gemischt)   ·   {l, q, tf, e}: Aussage, tf = wahr/falsch
(function () {
  const r = String.raw;
  (window.QUIZ_DATA = window.QUIZ_DATA || {}).int = {

    // ───────────────────────── Ober-/Untersumme → Integral ─────────────────────────
    sum: [
      { l: 1, q: r`Was ist eine Untersumme?`, a: [r`Die Summe von Rechtecksflächen, deren Höhe in jedem Streifen der kleinste Funktionswert ist.`, r`Die Summe von Rechtecksflächen, deren Höhe in jedem Streifen der grösste Funktionswert ist.`, r`Die Fläche unterhalb der $x$-Achse.`, r`Die Hälfte der Fläche unter dem Graphen.`], e: r`Die Rechtecke der Untersumme liegen ganz unter dem Graphen.` },
      { l: 1, q: r`$f$ ist auf $[a,b]$ positiv. Wie liegen Untersumme $U$, Obersumme $O$ und die Fläche $A$ unter dem Graphen zueinander?`, a: [r`$U\le A\le O$`, r`$O\le A\le U$`, r`$A\le U\le O$`, r`$U=O$, und $A$ liegt darüber.`], e: r`Die Untersumme ist höchstens so gross wie die Fläche, die Obersumme mindestens so gross.` },
      { l: 1, q: r`Das Intervall $[a,b]$ wird in $n$ gleich breite Streifen geteilt. Wie breit ist ein Streifen?`, a: [r`$\Delta x=\frac{b-a}{n}$`, r`$\Delta x=(b-a)\cdot n$`, r`$\Delta x=\frac{b}{n}$`, r`$\Delta x=\frac{n}{b-a}$`], e: r`Die Länge $b-a$ wird gleichmässig auf $n$ Streifen verteilt.` },
      { l: 1, q: r`Was geschieht mit dem Unterschied $O-U$, wenn man bei einer stetigen Funktion die Anzahl $n$ der Streifen erhöht?`, a: [r`Er geht gegen 0.`, r`Er wächst.`, r`Er bleibt gleich.`, r`Er schwankt ohne Regel.`], e: r`Je schmaler die Streifen, desto weniger unterscheiden sich kleinster und grösster Funktionswert im Streifen.` },
      { l: 1, q: r`Wie heisst der gemeinsame Grenzwert von Unter- und Obersumme?`, a: [r`Bestimmtes Integral $\int_a^b f(x)\,dx$`, r`Stammfunktion`, r`Ableitung`, r`Mittelwert`], e: r`Für $n\to\infty$ nähern sich beide Summen demselben Wert, dem Integral.` },
      { l: 1, q: r`$f(x)=2$ auf $[0,3]$. Wie gross ist $\int_0^3 f(x)\,dx$?`, a: [r`$6$`, r`$2$`, r`$3$`, r`$5$`], e: r`Die Fläche ist ein Rechteck mit Breite 3 und Höhe 2.` },
      { l: 1, q: r`Bei einer steigenden Funktion ergibt der Funktionswert am linken Rand jedes Streifens die Untersumme.`, tf: true, e: r`Steigt $f$, so ist der kleinste Wert im Streifen der am linken Rand.` },
      { l: 1, q: r`$f(x)=x$ auf $[0,4]$ mit 4 Streifen der Breite 1. Wie gross ist die Untersumme?`, a: [r`$6$`, r`$10$`, r`$8$`, r`$4$`], e: r`Höhen am linken Rand: $0+1+2+3=6$.` },
      { l: 1, q: r`$f(x)=x$ auf $[0,4]$ mit 4 Streifen der Breite 1. Wie gross ist die Obersumme?`, a: [r`$10$`, r`$6$`, r`$8$`, r`$16$`], e: r`Höhen am rechten Rand: $1+2+3+4=10$.` },
      { l: 1, q: r`Wie gross ist die Fläche unter $f(x)=x$ von 0 bis 4 genau?`, a: [r`$8$`, r`$6$`, r`$10$`, r`$16$`], e: r`Ein Dreieck mit Grundseite 4 und Höhe 4: $\frac12\cdot4\cdot4$. Der Wert liegt zwischen Untersumme 6 und Obersumme 10.` },
      { l: 1, q: r`Wie heissen $a$ und $b$ in $\int_a^b f(x)\,dx$?`, a: [r`Integrationsgrenzen`, r`Integranden`, r`Stammfunktionen`, r`Streifenbreiten`], e: r`$a$ ist die untere, $b$ die obere Grenze; $f(x)$ heisst Integrand.` },
      { l: 1, q: r`Bei einer konstanten Funktion sind Unter- und Obersumme für jedes $n$ gleich.`, tf: true, e: r`In jedem Streifen sind kleinster und grösster Funktionswert gleich.` },

      { l: 2, q: r`$f(x)=x^2$ auf $[0,1]$ mit 2 Streifen. Wie gross ist die Untersumme?`, a: [r`$0.125$`, r`$0.25$`, r`$0.625$`, r`$0.5$`], e: r`$0.5\cdot f(0)+0.5\cdot f(0.5)=0+0.5\cdot0.25$.` },
      { l: 2, q: r`$f$ steigt auf $[a,b]$. Wie gross ist $O-U$ bei $n$ Streifen der Breite $\Delta x$?`, a: [r`$\big(f(b)-f(a)\big)\cdot\Delta x$`, r`$(b-a)\cdot\Delta x$`, r`$f(b)\cdot\Delta x$`, r`$0$`], e: r`Die Differenzen der Rechteckshöhen lassen sich zu einem einzigen Streifen der Höhe $f(b)-f(a)$ stapeln.` },
      { l: 2, q: r`$f$ ist monoton. Was geschieht mit $O-U$, wenn man die Anzahl der Streifen verdoppelt?`, a: [r`Der Unterschied halbiert sich.`, r`Er wird ein Viertel so gross.`, r`Er bleibt gleich.`, r`Er verdoppelt sich.`], e: r`$O-U=|f(b)-f(a)|\cdot\Delta x$, und $\Delta x$ wird halb so gross.` },
      { l: 2, q: r`$f(x)=-1$ auf $[0,3]$. Wie gross ist $\int_0^3 f(x)\,dx$?`, a: [r`$-3$`, r`$3$`, r`$0$`, r`$-1$`], e: r`Liegt der Graph unter der $x$-Achse, so zählt das Integral negativ.` },
      { l: 2, q: r`Das bestimmte Integral ist immer gleich dem Flächeninhalt zwischen Graph und $x$-Achse.`, tf: false, e: r`Stücke unter der $x$-Achse zählen negativ. Das Integral ist eine Flächenbilanz.` },
      { l: 2, q: r`Wie gross ist $\int_{-1}^{1}x\,dx$?`, a: [r`$0$`, r`$1$`, r`$2$`, r`$-1$`], e: r`Die Dreiecke links (negativ) und rechts (positiv) sind gleich gross und heben sich auf.` },
      { l: 2, q: r`Bei einer linearen Funktion ist der Mittelwert von Unter- und Obersumme …`, a: [r`genau das Integral.`, r`immer zu gross.`, r`immer zu klein.`, r`immer null.`], e: r`Der Mittelwert ersetzt jedes Rechteck durch ein Trapez, und das passt bei einer Geraden exakt.` },
      { l: 2, q: r`$f$ fällt auf $[a,b]$. Welcher Rand jedes Streifens liefert die Obersumme?`, a: [r`Der linke Rand.`, r`Der rechte Rand.`, r`Die Streifenmitte.`, r`Beide Ränder liefern dasselbe.`], e: r`Bei einer fallenden Funktion ist der grösste Wert im Streifen der am linken Rand.` },
      { l: 2, q: r`Woran erinnert das $dx$ in $\int_a^b f(x)\,dx$?`, a: [r`An die Breite $\Delta x$ der immer schmaleren Streifen.`, r`An die Höhe der Rechtecke.`, r`An die Anzahl der Streifen.`, r`An die Steigung des Graphen.`], e: r`Aus der Summe $\sum f(x)\,\Delta x$ wird im Grenzwert $\int f(x)\,dx$.` },
      { l: 2, q: r`Es gilt $\int_a^a f(x)\,dx=0$.`, tf: true, e: r`Ein Streifen der Breite 0 hat keine Fläche.` },

      { l: 3, q: r`Für $f(x)=x^2$ auf $[0,1]$ ist die Obersumme mit $n$ Streifen $\frac{(n+1)(2n+1)}{6n^2}$. Wie gross ist die Untersumme?`, a: [r`$\frac{(n-1)(2n-1)}{6n^2}$`, r`$\frac{(n-1)(2n+1)}{6n^2}$`, r`$\frac{n\,(2n+1)}{6n^2}$`, r`$\frac{(n+1)(2n+1)}{6n^2}-\frac{1}{n^2}$`], e: r`$O-U=\big(f(1)-f(0)\big)\cdot\frac1n=\frac1n$. Beide Summen gehen gegen $\frac13$.` },
      { l: 3, q: r`Wie viele Streifen braucht man bei $f(x)=x^2$ auf $[0,1]$ mindestens, damit $O-U<0.01$ ist?`, a: [r`$101$`, r`$100$`, r`$10$`, r`$1000$`], e: r`$O-U=\frac1n$; für $n=100$ ist das genau $0.01$, erst ab $n=101$ kleiner.` },
      { l: 3, q: r`Ist $f$ nicht monoton, so genügen die Funktionswerte an den Streifenrändern nicht: Für Unter- und Obersumme braucht man in jedem Streifen den kleinsten und den grössten Funktionswert.`, tf: true, e: r`Liegt etwa ein Hochpunkt im Innern eines Streifens, so ist der grösste Wert dort und nicht am Rand.` },
      { l: 3, q: r`Wie gross ist $\int_0^2|x-1|\,dx$?`, a: [r`$1$`, r`$0$`, r`$2$`, r`$\frac12$`], e: r`Zwei Dreiecke mit Grundseite 1 und Höhe 1: $2\cdot\frac12$.` },
      { l: 3, q: r`Wie gross ist $\int_0^1\sqrt{1-x^2}\,dx$?`, a: [r`$\frac{\pi}{4}$`, r`$\frac{\pi}{2}$`, r`$1$`, r`$\pi$`], e: r`Der Graph ist ein Viertelkreis mit Radius 1.` },
      { l: 3, q: r`Aus $\int_a^b f(x)\,dx=0$ folgt $f(x)=0$ für alle $x$ in $[a,b]$.`, tf: false, e: r`Positive und negative Anteile können sich aufheben, wie bei $\int_{-1}^{1}x\,dx$.` },
      { l: 3, q: r`Welchen Grenzwert hat $\frac1n\sum_{k=1}^{n}\left(\frac kn\right)^3$ für $n\to\infty$?`, a: [r`$\frac14$`, r`$\frac13$`, r`$1$`, r`$0$`], e: r`Das ist die Obersumme von $f(x)=x^3$ auf $[0,1]$, ihr Grenzwert ist $\int_0^1x^3\,dx$.` },
      { l: 3, q: r`Als Höhe jedes Rechtecks wird der Funktionswert in der Streifenmitte genommen. Wie verhält sich diese Summe bei einer Linkskurve zum Integral?`, a: [r`Sie ist kleiner als das Integral.`, r`Sie ist grösser als das Integral.`, r`Sie ist gleich dem Integral.`, r`Mal grösser, mal kleiner.`], e: r`Das Rechteck ist flächengleich zum Trapez unter der Tangente in der Streifenmitte, und bei einer Linkskurve liegt der Graph über jeder Tangente.` }
    ],

    // ───────────────────────── Integralfunktion und Hauptsatz ─────────────────────────
    hs: [
      { l: 1, q: r`Was gibt die Integralfunktion $F_a(x)=\int_a^x f(t)\,dt$ an?`, a: [r`Die Flächenbilanz unter $f$ von $a$ bis $x$.`, r`Die Steigung von $f$ an der Stelle $x$.`, r`Den Unterschied $f(x)-f(a)$.`, r`Die Länge des Graphen von $a$ bis $x$.`], e: r`$F_a$ «sammelt» die Fläche unter $f$ von der festen Grenze $a$ bis zur beweglichen Grenze $x$.` },
      { l: 1, q: r`Wie gross ist $F_a(a)$?`, a: [r`$0$`, r`$f(a)$`, r`$a$`, r`$1$`], e: r`Von $a$ bis $a$ ist noch keine Fläche gesammelt.` },
      { l: 1, q: r`Was besagt der Hauptsatz über die Ableitung der Integralfunktion?`, a: [r`$F_a'(x)=f(x)$`, r`$F_a'(x)=f'(x)$`, r`$F_a'(x)=F_a(x)$`, r`$F_a'(x)=0$`], e: r`Die Fläche wächst an der Stelle $x$ so schnell, wie der Graph von $f$ dort hoch ist.` },
      { l: 1, q: r`Was ist eine Stammfunktion von $f$?`, a: [r`Eine Funktion $F$ mit $F'=f$.`, r`Eine Funktion $F$ mit $F=f'$.`, r`Eine Funktion $F$ mit $F(0)=f(0)$.`, r`Die Funktion $F=f^2$.`], e: r`Stammfunktion bilden ist die Umkehrung des Ableitens.` },
      { l: 1, q: r`$F$ ist eine Stammfunktion von $f$. Wie berechnet man $\int_a^b f(x)\,dx$?`, a: [r`$F(b)-F(a)$`, r`$F(a)-F(b)$`, r`$f(b)-f(a)$`, r`$F(b)+F(a)$`], e: r`Obere Grenze einsetzen minus untere Grenze einsetzen.` },
      { l: 1, q: r`Welche Funktion ist eine Stammfunktion von $f(x)=2x$?`, a: [r`$F(x)=x^2$`, r`$F(x)=2$`, r`$F(x)=2x^2$`, r`$F(x)=x$`], e: r`Probe durch Ableiten: $(x^2)'=2x$.` },
      { l: 1, q: r`Wie gross ist $\int_0^3 2x\,dx$?`, a: [r`$9$`, r`$6$`, r`$3$`, r`$18$`], e: r`$\big[x^2\big]_0^3=9-0$.` },
      { l: 1, q: r`Ist $F$ eine Stammfunktion von $f$, so ist auch $F+5$ eine Stammfunktion von $f$.`, tf: true, e: r`Die Konstante fällt beim Ableiten weg.` },
      { l: 1, q: r`In einem Intervall ist $f$ positiv. Was gilt dort für die Integralfunktion $F_a$?`, a: [r`Sie steigt.`, r`Sie fällt.`, r`Sie ist konstant.`, r`Sie hat dort eine Nullstelle.`], e: r`$F_a'=f>0$: Es kommt positive Fläche dazu.` },
      { l: 1, q: r`$f$ hat eine Nullstelle mit Vorzeichenwechsel von plus nach minus. Was hat $F_a$ dort?`, a: [r`Einen Hochpunkt.`, r`Einen Tiefpunkt.`, r`Eine Nullstelle.`, r`Einen Wendepunkt.`], e: r`Bis dahin kommt positive Fläche dazu, danach wird wieder abgezogen.` },
      { l: 1, q: r`Wie gross ist $\int_1^2 3x^2\,dx$?`, a: [r`$7$`, r`$8$`, r`$3$`, r`$9$`], e: r`$\big[x^3\big]_1^2=8-1$.` },
      { l: 1, q: r`Die Integralfunktion $F_a$ ist selbst eine Stammfunktion von $f$.`, tf: true, e: r`Das ist die Aussage des Hauptsatzes: $F_a'=f$.` },

      { l: 2, q: r`Worin unterscheiden sich die Integralfunktionen $F_a$ und $F_c$ zu verschiedenen unteren Grenzen $a$ und $c$?`, a: [r`Um die Konstante $\int_a^c f(t)\,dt$.`, r`Um einen konstanten Faktor.`, r`Gar nicht.`, r`Um den Summanden $x$.`], e: r`$F_a(x)=\int_a^c f+\int_c^x f$: Die Graphen sind in $y$-Richtung gegeneinander verschoben.` },
      { l: 2, q: r`$f(x)=2$. Wie lautet die Integralfunktion $F_0$?`, a: [r`$F_0(x)=2x$`, r`$F_0(x)=2$`, r`$F_0(x)=x^2$`, r`$F_0(x)=0$`], e: r`Das Rechteck von 0 bis $x$ mit der Höhe 2 hat die Fläche $2x$.` },
      { l: 2, q: r`$f(x)=x$. Wie lautet $F_1(x)=\int_1^x t\,dt$?`, a: [r`$\frac{x^2}{2}-\frac12$`, r`$\frac{x^2}{2}$`, r`$x-1$`, r`$x^2-1$`], e: r`$\left[\frac{t^2}{2}\right]_1^x$. Probe: $F_1(1)=0$.` },
      { l: 2, q: r`$f$ hat an der Stelle $x_0$ einen Hochpunkt. Was hat die Integralfunktion $F_a$ dort?`, a: [r`Einen Wendepunkt.`, r`Einen Hochpunkt.`, r`Eine Nullstelle.`, r`Einen Tiefpunkt.`], e: r`$F_a'=f$ ist dort am grössten: $F_a$ steigt an dieser Stelle am steilsten.` },
      { l: 2, q: r`Ist $f(x)<0$, so ist auch $F_a(x)<0$.`, tf: false, e: r`$f(x)<0$ heisst nur, dass $F_a$ dort fällt. War vorher viel positive Fläche gesammelt, so ist $F_a(x)$ trotzdem positiv.` },
      { l: 2, q: r`$f(x)=1$ und $a=2$. Wie gross ist $F_2(0)=\int_2^0 1\,dt$?`, a: [r`$-2$`, r`$2$`, r`$0$`, r`$1$`], e: r`Läuft man von der unteren Grenze nach links, so zählt die Fläche mit umgekehrtem Vorzeichen.` },
      { l: 2, q: r`Wie lautet die Ableitung von $G(x)=\int_0^x\sin(t^2)\,dt$?`, a: [r`$\sin(x^2)$`, r`$2x\cos(x^2)$`, r`$\cos(x^2)$`, r`$-\frac{\cos(x^2)}{2x}$`], e: r`Hauptsatz: Die Ableitung der Integralfunktion ist der Integrand an der oberen Grenze. Ausrechnen muss man das Integral dafür nicht.` },
      { l: 2, q: r`Wie gross ist $\int_0^{\pi}\sin x\,dx$?`, a: [r`$2$`, r`$0$`, r`$1$`, r`$\pi$`], e: r`$\big[-\cos x\big]_0^{\pi}=1-(-1)$.` },
      { l: 2, q: r`Wie gross ist $\int_0^{2\pi}\sin x\,dx$?`, a: [r`$0$`, r`$2$`, r`$4$`, r`$2\pi$`], e: r`Der Bogen über der Achse und der Bogen darunter sind gleich gross und heben sich auf.` },
      { l: 2, q: r`Es gilt $\int_a^b f(x)\,dx=-\int_b^a f(x)\,dx$.`, tf: true, e: r`$F(b)-F(a)=-\big(F(a)-F(b)\big)$: Vertauschen der Grenzen ändert das Vorzeichen.` },

      { l: 3, q: r`Wie lautet die Ableitung von $G(x)=\int_0^{x^2}\cos t\,dt$?`, a: [r`$2x\cos(x^2)$`, r`$\cos(x^2)$`, r`$\sin(x^2)$`, r`$2x\sin(x^2)$`], e: r`Hauptsatz und Kettenregel: Integrand an der oberen Grenze mal Ableitung der oberen Grenze.` },
      { l: 3, q: r`Wie lautet die Ableitung von $G(x)=\int_x^{1}t^2\,dt$?`, a: [r`$-x^2$`, r`$x^2$`, r`$1-x^2$`, r`$2x$`], e: r`$\int_x^1=-\int_1^x$; die Variable steht in der unteren Grenze, daher das Minus.` },
      { l: 3, q: r`$F(x)=\int_0^x(t^2-1)\,dt$. Welche Extrempunkte hat $F$?`, a: [r`Hochpunkt bei $x=-1$, Tiefpunkt bei $x=1$.`, r`Tiefpunkt bei $x=-1$, Hochpunkt bei $x=1$.`, r`Nur einen Tiefpunkt bei $x=0$.`, r`Keine.`], e: r`$F'(x)=x^2-1$ wechselt bei $-1$ von plus nach minus und bei $1$ von minus nach plus.` },
      { l: 3, q: r`Jede stetige Funktion besitzt eine Stammfunktion.`, tf: true, e: r`Die Integralfunktion ist eine. Sie lässt sich aber nicht immer als Formel schreiben, etwa bei $e^{-x^2}$.` },
      { l: 3, q: r`Der Mittelwert von $f$ auf $[a,b]$ ist $\frac{1}{b-a}\int_a^b f(x)\,dx$. Wie gross ist er für $f(x)=x^2$ auf $[0,3]$?`, a: [r`$3$`, r`$9$`, r`$4.5$`, r`$1.5$`], e: r`$\int_0^3x^2\,dx=9$, geteilt durch die Länge 3.` },
      { l: 3, q: r`Für alle $x$ gilt $\int_0^x f(t)\,dt=x^3+x$. Wie lautet $f$?`, a: [r`$f(x)=3x^2+1$`, r`$f(x)=x^3+x$`, r`$f(x)=\frac{x^4}{4}+\frac{x^2}{2}$`, r`$f(x)=3x^2$`], e: r`Beide Seiten ableiten: links steht nach dem Hauptsatz $f(x)$.` },
      { l: 3, q: r`Wie gross ist $\int_{-2}^{2}\big(x^3+\sin x\big)\,dx$?`, a: [r`$0$`, r`$8$`, r`$16$`, r`$4$`], e: r`Der Integrand ist punktsymmetrisch zum Ursprung, die Grenzen liegen symmetrisch zu 0.` },
      { l: 3, q: r`Die Rechnung $\int_{-1}^{1}\frac{1}{x^2}\,dx=\left[-\frac1x\right]_{-1}^{1}=-2$ ist richtig.`, tf: false, e: r`Bei 0 liegt eine Polstelle, der Hauptsatz ist dort nicht anwendbar. Ein positiver Integrand kann zudem kein negatives Integral haben.` }
    ],

    // ───────────────────────── Stammfunktion mit Regeln ─────────────────────────
    rg: [
      { l: 1, q: r`Wie lautet $\int x^3\,dx$?`, a: [r`$\frac{x^4}{4}+C$`, r`$3x^2+C$`, r`$x^4+C$`, r`$\frac{x^3}{3}+C$`], e: r`Potenzregel: Exponent um 1 erhöhen und durch den neuen Exponenten teilen.` },
      { l: 1, q: r`Wie lautet $\int 5\,dx$?`, a: [r`$5x+C$`, r`$5+C$`, r`$C$`, r`$\frac{5x^2}{2}+C$`], e: r`Probe: $(5x)'=5$.` },
      { l: 1, q: r`Wie lautet $\int\cos x\,dx$?`, a: [r`$\sin x+C$`, r`$-\sin x+C$`, r`$\cos x+C$`, r`$-\cos x+C$`], e: r`Probe: $(\sin x)'=\cos x$.` },
      { l: 1, q: r`Wie lautet $\int\sin x\,dx$?`, a: [r`$-\cos x+C$`, r`$\cos x+C$`, r`$\sin x+C$`, r`$-\sin x+C$`], e: r`Probe: $(-\cos x)'=\sin x$.` },
      { l: 1, q: r`Wie lautet $\int e^x\,dx$?`, a: [r`$e^x+C$`, r`$\frac{e^{x+1}}{x+1}+C$`, r`$x\,e^x+C$`, r`$\ln x+C$`], e: r`$e^x$ ist seine eigene Ableitung und damit auch seine eigene Stammfunktion.` },
      { l: 1, q: r`Wie lautet $\int\frac1x\,dx$ für $x>0$?`, a: [r`$\ln x+C$`, r`$-\frac{1}{x^2}+C$`, r`$\frac{1}{x^2}+C$`, r`$x+C$`], e: r`Probe: $(\ln x)'=\frac1x$. Die Potenzregel versagt hier, weil sie durch 0 teilen würde.` },
      { l: 1, q: r`Für welche Exponenten gilt $\int x^n\,dx=\frac{x^{n+1}}{n+1}+C$?`, a: [r`Für alle $n\neq-1$.`, r`Für alle $n$.`, r`Nur für $n>0$.`, r`Nur für ganze $n$.`], e: r`Für $n=-1$ wäre der Nenner 0; dort ist die Stammfunktion $\ln|x|$.` },
      { l: 1, q: r`Wie lautet $\int(2x+3)\,dx$?`, a: [r`$x^2+3x+C$`, r`$2x^2+3x+C$`, r`$x^2+3+C$`, r`$2+C$`], e: r`Summenregel: jeden Summanden einzeln integrieren.` },
      { l: 1, q: r`Es gilt $\int 3\,f(x)\,dx=3\int f(x)\,dx$.`, tf: true, e: r`Faktorregel: Ein konstanter Faktor darf vor das Integral gezogen werden.` },
      { l: 1, q: r`Wofür steht das «$+C$» beim unbestimmten Integral?`, a: [r`Stammfunktionen sind nur bis auf eine Konstante bestimmt.`, r`Für die obere Integrationsgrenze.`, r`Für den Fehler der Näherung.`, r`Für die Steigung der Stammfunktion.`], e: r`Jede Konstante fällt beim Ableiten weg.` },
      { l: 1, q: r`Wie gross ist $\int_0^1 x^2\,dx$?`, a: [r`$\frac13$`, r`$\frac12$`, r`$1$`, r`$2$`], e: r`$\left[\frac{x^3}{3}\right]_0^1=\frac13$.` },
      { l: 1, q: r`Es gilt $\int f(x)\cdot g(x)\,dx=\int f(x)\,dx\cdot\int g(x)\,dx$.`, tf: false, e: r`Für Produkte gibt es keine so einfache Regel. Dafür braucht man partielle Integration oder Substitution.` },

      { l: 2, q: r`Wie lautet $\int\sqrt{x}\,dx$?`, a: [r`$\frac23\,x^{3/2}+C$`, r`$\frac{1}{2\sqrt{x}}+C$`, r`$\frac32\,x^{3/2}+C$`, r`$2\sqrt{x}+C$`], e: r`$\sqrt{x}=x^{1/2}$; Potenzregel: $\frac{x^{3/2}}{3/2}$.` },
      { l: 2, q: r`Wie lautet $\int\frac{1}{x^2}\,dx$?`, a: [r`$-\frac1x+C$`, r`$\ln(x^2)+C$`, r`$\frac1x+C$`, r`$-\frac{2}{x^3}+C$`], e: r`$\frac{1}{x^2}=x^{-2}$; Potenzregel: $\frac{x^{-1}}{-1}$.` },
      { l: 2, q: r`Wie lautet $\int e^{2x}\,dx$?`, a: [r`$\frac12\,e^{2x}+C$`, r`$2\,e^{2x}+C$`, r`$e^{2x}+C$`, r`$\frac{e^{2x+1}}{2x+1}+C$`], e: r`Beim Ableiten von $e^{2x}$ entsteht der Faktor 2; er wird mit $\frac12$ ausgeglichen.` },
      { l: 2, q: r`Wie lautet $\int\cos(3x)\,dx$?`, a: [r`$\frac13\sin(3x)+C$`, r`$3\sin(3x)+C$`, r`$\sin(3x)+C$`, r`$-\frac13\sin(3x)+C$`], e: r`Probe: $\left(\frac13\sin(3x)\right)'=\frac13\cdot3\cos(3x)$.` },
      { l: 2, q: r`Wie lautet $\int(x+1)^2\,dx$?`, a: [r`$\frac{(x+1)^3}{3}+C$`, r`$(x+1)^3+C$`, r`$2\,(x+1)+C$`, r`$\frac{x^3}{3}+x+C$`], e: r`Probe durch Ableiten mit der Kettenregel; die innere Ableitung ist 1.` },
      { l: 2, q: r`Wie gross ist $\int_1^e\frac1x\,dx$?`, a: [r`$1$`, r`$e$`, r`$e-1$`, r`$0$`], e: r`$\big[\ln x\big]_1^e=\ln e-\ln1=1-0$.` },
      { l: 2, q: r`Wie gross ist $\int_0^{\pi/2}\cos x\,dx$?`, a: [r`$1$`, r`$0$`, r`$\frac{\pi}{2}$`, r`$-1$`], e: r`$\big[\sin x\big]_0^{\pi/2}=1-0$.` },
      { l: 2, q: r`$F(x)=x\ln x-x$ ist eine Stammfunktion von $f(x)=\ln x$.`, tf: true, e: r`Probe mit der Produktregel: $\ln x+x\cdot\frac1x-1=\ln x$.` },
      { l: 2, q: r`Welche Stammfunktion $F$ von $f(x)=2x$ erfüllt $F(1)=3$?`, a: [r`$F(x)=x^2+2$`, r`$F(x)=x^2$`, r`$F(x)=x^2+3$`, r`$F(x)=2x+1$`], e: r`$F(x)=x^2+C$; aus $1+C=3$ folgt $C=2$.` },
      { l: 2, q: r`Wie lautet $\int\frac{x^2+1}{x}\,dx$ für $x>0$?`, a: [r`$\frac{x^2}{2}+\ln x+C$`, r`$\frac{x^3/3+x}{x^2/2}+C$`, r`$x+\ln x+C$`, r`$\ln(x^2+1)+C$`], e: r`Zuerst teilen: $\frac{x^2+1}{x}=x+\frac1x$. Zähler und Nenner einzeln zu integrieren ist falsch.` },

      { l: 3, q: r`Wie lautet $\int\frac{1}{2x+1}\,dx$?`, a: [r`$\frac12\ln|2x+1|+C$`, r`$\ln|2x+1|+C$`, r`$2\ln|2x+1|+C$`, r`$-\frac{1}{(2x+1)^2}+C$`], e: r`Beim Ableiten von $\ln|2x+1|$ entsteht der Faktor 2 aus der inneren Ableitung.` },
      { l: 3, q: r`Wie lautet $\int\tan x\,dx$?`, a: [r`$-\ln|\cos x|+C$`, r`$\ln|\cos x|+C$`, r`$\frac{1}{\cos^2x}+C$`, r`$\ln|\sin x|+C$`], e: r`$\tan x=\frac{\sin x}{\cos x}$: Im Zähler steht bis aufs Vorzeichen die Ableitung des Nenners.` },
      { l: 3, q: r`Wie lautet $\int\sin^2x\,dx$?`, a: [r`$\frac{x}{2}-\frac{\sin(2x)}{4}+C$`, r`$\frac{\sin^3x}{3}+C$`, r`$-\cos^2x+C$`, r`$\frac{x}{2}+\frac{\sin(2x)}{4}+C$`], e: r`Mit $\sin^2x=\frac{1-\cos(2x)}{2}$ wird der Integrand eine Summe.` },
      { l: 3, q: r`Wie lautet $\int a^x\,dx$ für $a>0$, $a\neq1$?`, a: [r`$\frac{a^x}{\ln a}+C$`, r`$a^x\ln a+C$`, r`$\frac{a^{x+1}}{x+1}+C$`, r`$x\,a^{x-1}+C$`], e: r`$(a^x)'=a^x\ln a$; der Faktor $\ln a$ wird durch Teilen ausgeglichen.` },
      { l: 3, q: r`$\int\frac1x\,dx=\ln|x|+C$ gilt auch für $x<0$.`, tf: true, e: r`Für $x<0$ ist $\ln|x|=\ln(-x)$ mit der Ableitung $\frac{-1}{-x}=\frac1x$.` },
      { l: 3, q: r`Wie gross ist $\int_0^1\frac{1}{1+x^2}\,dx$?`, a: [r`$\frac{\pi}{4}$`, r`$\ln 2$`, r`$\frac12$`, r`$\frac{\pi}{2}$`], e: r`Stammfunktion ist $\arctan x$, und $\arctan1=\frac{\pi}{4}$.` },
      { l: 3, q: r`Wie lautet $\int\frac{2x}{x^2+1}\,dx$?`, a: [r`$\ln(x^2+1)+C$`, r`$\arctan(x^2)+C$`, r`$2x\ln(x^2+1)+C$`, r`$\frac{x^2}{x^3/3+x}+C$`], e: r`Im Zähler steht die Ableitung des Nenners: $\int\frac{g'}{g}=\ln|g|+C$.` },
      { l: 3, q: r`Die Funktion $f(x)=e^{-x^2}$ hat keine Stammfunktion.`, tf: false, e: r`Als stetige Funktion hat sie eine. Sie lässt sich nur nicht mit den bekannten Funktionen als Formel schreiben.` }
    ],

    // ───────────────────────── Partielle Integration ─────────────────────────
    pi: [
      { l: 1, q: r`Wie lautet die Formel der partiellen Integration?`, a: [r`$\int u\,v'\,dx=u\,v-\int u'\,v\,dx$`, r`$\int u\,v'\,dx=u\,v+\int u'\,v\,dx$`, r`$\int u\,v'\,dx=u'\,v'$`, r`$\int u\,v'\,dx=u\,v$`], e: r`Das Produkt $u\,v$ minus das Integral mit vertauschten Rollen.` },
      { l: 1, q: r`Aus welcher Ableitungsregel folgt die partielle Integration?`, a: [r`Aus der Produktregel.`, r`Aus der Kettenregel.`, r`Aus der Quotientenregel.`, r`Aus der Summenregel.`], e: r`$(u\,v)'=u'v+u\,v'$ wird auf beiden Seiten integriert.` },
      { l: 1, q: r`Für welche Integrale ist die partielle Integration gedacht?`, a: [r`Für Produkte wie $x\cdot e^x$.`, r`Für Summen wie $x+e^x$.`, r`Für Konstanten.`, r`Nur für Polynome.`], e: r`Sie ersetzt ein Produkt-Integral durch ein anderes, das hoffentlich einfacher ist.` },
      { l: 1, q: r`Welche Wahl ist bei $\int x\,e^x\,dx$ sinnvoll?`, a: [r`$u=x$, $v'=e^x$`, r`$u=e^x$, $v'=x$`, r`$u=x\,e^x$, $v'=1$`, r`Die Wahl spielt keine Rolle.`], e: r`$u=x$ wird beim Ableiten zu 1, und $e^x$ lässt sich leicht integrieren.` },
      { l: 1, q: r`Wie lautet $\int x\,e^x\,dx$?`, a: [r`$(x-1)\,e^x+C$`, r`$x\,e^x+C$`, r`$\frac{x^2}{2}\,e^x+C$`, r`$(x+1)\,e^x+C$`], e: r`$x\,e^x-\int1\cdot e^x\,dx=x\,e^x-e^x$.` },
      { l: 1, q: r`Im Bild liegt die Kurve $(u(x)\,|\,v(x))$. Was ergeben die Flächen $\int u\,dv$ und $\int v\,du$ zusammen?`, a: [r`Das grosse Rechteck $u(b)\,v(b)$ ohne das kleine Rechteck $u(a)\,v(a)$.`, r`Das grosse Rechteck $u(b)\,v(b)$.`, r`Das kleine Rechteck $u(a)\,v(a)$.`, r`Die Fläche unter der Kurve.`], e: r`Das ist die Formel als Bild: $\int u\,dv+\int v\,du=\big[u\,v\big]_a^b$.` },
      { l: 1, q: r`Bei der partiellen Integration wird ein Faktor abgeleitet und der andere integriert.`, tf: true, e: r`Aus $u$ wird $u'$, aus $v'$ wird $v$.` },
      { l: 1, q: r`Wie lautet $\int x\cos x\,dx$?`, a: [r`$x\sin x+\cos x+C$`, r`$x\sin x-\cos x+C$`, r`$-x\sin x+C$`, r`$\frac{x^2}{2}\sin x+C$`], e: r`$u=x$, $v'=\cos x$: $x\sin x-\int\sin x\,dx=x\sin x+\cos x$.` },
      { l: 1, q: r`Was bedeutet $\big[u\,v\big]_a^b$?`, a: [r`$u(b)\,v(b)-u(a)\,v(a)$`, r`$u(b)\,v(a)-u(a)\,v(b)$`, r`$u(b)\,v(b)+u(a)\,v(a)$`, r`$\big(u(b)-u(a)\big)\big(v(b)-v(a)\big)$`], e: r`Obere Grenze einsetzen minus untere Grenze einsetzen.` },
      { l: 1, q: r`Welchen Faktor wählt man meist als $u$?`, a: [r`Den, der beim Ableiten einfacher wird.`, r`Den, der beim Ableiten komplizierter wird.`, r`Immer $e^x$.`, r`Immer den zweiten Faktor.`], e: r`Zum Beispiel $x$ (wird zu 1) oder $\ln x$ (wird zu $\frac1x$).` },
      { l: 1, q: r`Wie gross ist $\int_0^1 x\,e^x\,dx$?`, a: [r`$1$`, r`$e$`, r`$e-1$`, r`$0$`], e: r`$\big[(x-1)\,e^x\big]_0^1=0-(-1)$.` },
      { l: 1, q: r`Partielle Integration macht jedes Produkt-Integral einfacher, egal wie man $u$ und $v'$ wählt.`, tf: false, e: r`Bei ungünstiger Wahl wird das neue Integral schwieriger als das alte.` },

      { l: 2, q: r`Wie lautet $\int\ln x\,dx$ (mit $u=\ln x$, $v'=1$)?`, a: [r`$x\ln x-x+C$`, r`$\frac1x+C$`, r`$\frac{\ln^2x}{2}+C$`, r`$x\ln x+C$`], e: r`$x\ln x-\int x\cdot\frac1x\,dx=x\ln x-x$.` },
      { l: 2, q: r`Wie lautet $\int x\sin x\,dx$?`, a: [r`$-x\cos x+\sin x+C$`, r`$x\cos x-\sin x+C$`, r`$-x\cos x-\sin x+C$`, r`$x\sin x+\cos x+C$`], e: r`$u=x$, $v'=\sin x$, $v=-\cos x$: $-x\cos x+\int\cos x\,dx$.` },
      { l: 2, q: r`Wie oft muss man bei $\int x^2e^x\,dx$ partiell integrieren?`, a: [r`Zweimal.`, r`Einmal.`, r`Dreimal.`, r`Es geht nicht mit partieller Integration.`], e: r`Jeder Schritt senkt den Exponenten von $x$ um 1: $x^2\to2x\to2$.` },
      { l: 2, q: r`Wie lautet $\int x^2e^x\,dx$?`, a: [r`$(x^2-2x+2)\,e^x+C$`, r`$(x^2-2x)\,e^x+C$`, r`$(x^2+2x+2)\,e^x+C$`, r`$(x^2-2)\,e^x+C$`], e: r`$x^2e^x-2\int x\,e^x\,dx=x^2e^x-2\,(x-1)\,e^x$.` },
      { l: 2, q: r`Was geschieht, wenn man bei $\int x\,e^x\,dx$ umgekehrt $u=e^x$ und $v'=x$ wählt?`, a: [r`Das neue Integral $\int\frac{x^2}{2}\,e^x\,dx$ ist schwieriger als das alte.`, r`Man kommt schneller zum Ziel.`, r`Die Formel liefert ein falsches Ergebnis.`, r`Es entsteht dasselbe Integral wie vorher.`], e: r`Die Formel stimmt immer, aber der Exponent von $x$ steigt statt zu sinken.` },
      { l: 2, q: r`Wie gross ist $\int_1^e\ln x\,dx$?`, a: [r`$1$`, r`$e$`, r`$e-1$`, r`$0$`], e: r`$\big[x\ln x-x\big]_1^e=(e-e)-(0-1)$.` },
      { l: 2, q: r`Die Formel der partiellen Integration erhält man, indem man die Produktregel $(u\,v)'=u'v+u\,v'$ integriert.`, tf: true, e: r`$u\,v=\int u'v\,dx+\int u\,v'\,dx$, nach dem zweiten Integral aufgelöst.` },
      { l: 2, q: r`Wie lautet $\int x\ln x\,dx$?`, a: [r`$\frac{x^2}{2}\ln x-\frac{x^2}{4}+C$`, r`$\frac{x^2}{2}\ln x-\frac{x^2}{2}+C$`, r`$x\ln x-x+C$`, r`$\frac{x^2}{2}\ln x+\frac{x^2}{4}+C$`], e: r`$u=\ln x$, $v'=x$: $\frac{x^2}{2}\ln x-\int\frac{x^2}{2}\cdot\frac1x\,dx$.` },
      { l: 2, q: r`Wie gross ist $\int_0^{\pi}x\sin x\,dx$?`, a: [r`$\pi$`, r`$0$`, r`$2$`, r`$-\pi$`], e: r`$\big[-x\cos x+\sin x\big]_0^{\pi}=\pi-0$.` },
      { l: 2, q: r`Die Kurve $(u(x)\,|\,v(x))$ liegt in einem Koordinatensystem mit waagrechter $u$-Achse und senkrechter $v$-Achse. Welche Fläche ist $\int v\,du$?`, a: [r`Die Fläche zwischen der Kurve und der $u$-Achse.`, r`Die Fläche zwischen der Kurve und der $v$-Achse.`, r`Das grosse Rechteck.`, r`Das kleine Rechteck.`], e: r`Streifen der Breite $du$ und der Höhe $v$ stehen auf der $u$-Achse.` },

      { l: 3, q: r`Wie lautet $\int e^x\sin x\,dx$?`, a: [r`$\frac12\,e^x\,(\sin x-\cos x)+C$`, r`$e^x\,(\sin x-\cos x)+C$`, r`$\frac12\,e^x\,(\sin x+\cos x)+C$`, r`$-e^x\cos x+C$`], e: r`Nach zweimaliger partieller Integration steht das gesuchte Integral wieder da; nach ihm auflösen.` },
      { l: 3, q: r`Bei $\int e^x\cos x\,dx$ erscheint nach zweimaliger partieller Integration das Ausgangsintegral wieder. Was tut man?`, a: [r`Man löst die Gleichung nach dem gesuchten Integral auf.`, r`Man integriert so lange weiter, bis es verschwindet.`, r`Man muss eine andere Methode nehmen.`, r`Das Integral hat dann den Wert 0.`], e: r`Aus $I=e^x\sin x+e^x\cos x-I$ folgt $I=\frac12\,e^x\,(\sin x+\cos x)$.` },
      { l: 3, q: r`Wie lautet $\int\arctan x\,dx$?`, a: [r`$x\arctan x-\frac12\ln(1+x^2)+C$`, r`$\frac{1}{1+x^2}+C$`, r`$x\arctan x+\frac12\ln(1+x^2)+C$`, r`$\frac{\arctan^2x}{2}+C$`], e: r`$u=\arctan x$, $v'=1$: $x\arctan x-\int\frac{x}{1+x^2}\,dx$.` },
      { l: 3, q: r`Wie gross ist $\int_0^1 x^2e^x\,dx$?`, a: [r`$e-2$`, r`$e$`, r`$2$`, r`$e-1$`], e: r`$\big[(x^2-2x+2)\,e^x\big]_0^1=e-2$.` },
      { l: 3, q: r`Es gilt $\int\ln^2x\,dx=x\ln^2x-2x\ln x+2x+C$.`, tf: true, e: r`Probe: $\ln^2x+2\ln x-2\ln x-2+2=\ln^2x$.` },
      { l: 3, q: r`Wie lautet $\int\cos^2x\,dx$?`, a: [r`$\frac{x}{2}+\frac{\sin x\cos x}{2}+C$`, r`$\frac{\sin^2x}{2}+C$`, r`$\frac{x}{2}-\frac{\sin x\cos x}{2}+C$`, r`$\frac{\cos^3x}{3}+C$`], e: r`Partiell mit $u=\cos x$, $v'=\cos x$ und $\sin^2x=1-\cos^2x$; dann nach dem Integral auflösen.` },
      { l: 3, q: r`Welche Rekursionsformel gilt für $I_n=\int x^ne^x\,dx$?`, a: [r`$I_n=x^ne^x-n\,I_{n-1}$`, r`$I_n=x^ne^x+n\,I_{n-1}$`, r`$I_n=n\,x^{n-1}e^x-I_{n-1}$`, r`$I_n=x^ne^x-I_{n-1}$`], e: r`$u=x^n$, $v'=e^x$: $x^ne^x-\int n\,x^{n-1}e^x\,dx$.` },
      { l: 3, q: r`Wie gross ist $\int_0^{\infty}x\,e^{-x}\,dx$?`, a: [r`$1$`, r`$0$`, r`$\infty$`, r`$e$`], e: r`Stammfunktion $-(x+1)\,e^{-x}$; sie geht für $x\to\infty$ gegen 0 und ist bei 0 gleich $-1$.` }
    ],

    // ───────────────────────── Substitution ─────────────────────────
    sub: [
      { l: 1, q: r`Wie lautet die Substitutionsregel mit $u=g(x)$?`, a: [r`$\int f(g(x))\,g'(x)\,dx=\int f(u)\,du$`, r`$\int f(g(x))\,g'(x)\,dx=\int f(u)\,g'(u)\,du$`, r`$\int f(g(x))\,g'(x)\,dx=f(g(x))+C$`, r`$\int f(g(x))\,g'(x)\,dx=\int f(x)\,dx\cdot\int g'(x)\,dx$`], e: r`Aus $g'(x)\,dx$ wird $du$.` },
      { l: 1, q: r`Welche Ableitungsregel wird durch die Substitution umgekehrt?`, a: [r`Die Kettenregel.`, r`Die Produktregel.`, r`Die Quotientenregel.`, r`Die Summenregel.`], e: r`$\big(F(g(x))\big)'=f(g(x))\cdot g'(x)$.` },
      { l: 1, q: r`Wie lautet $\int 2x\cos(x^2)\,dx$?`, a: [r`$\sin(x^2)+C$`, r`$\cos(x^2)+C$`, r`$2\sin(x^2)+C$`, r`$x^2\sin(x^2)+C$`], e: r`Mit $u=x^2$ und $du=2x\,dx$ wird daraus $\int\cos u\,du$.` },
      { l: 1, q: r`Es ist $u=x^2$. Wodurch wird $du$ ersetzt?`, a: [r`$du=2x\,dx$`, r`$du=x^2\,dx$`, r`$du=\frac{dx}{2x}$`, r`$du=2\,dx$`], e: r`$\frac{du}{dx}=g'(x)=2x$.` },
      { l: 1, q: r`Was geschieht bei einem bestimmten Integral mit den Grenzen $a$ und $b$, wenn man $u=g(x)$ substituiert?`, a: [r`Sie werden zu $g(a)$ und $g(b)$.`, r`Sie bleiben immer gleich.`, r`Sie werden zu 0 und 1.`, r`Sie werden vertauscht.`], e: r`Die Grenzen müssen zur neuen Variablen $u$ passen.` },
      { l: 1, q: r`Bei $\int_0^1 2x\,(x^2+1)^3\,dx$ wird $u=x^2+1$ gesetzt. Wie lauten die neuen Grenzen?`, a: [r`1 und 2`, r`0 und 1`, r`0 und 2`, r`1 und 4`], e: r`$u(0)=1$ und $u(1)=2$.` },
      { l: 1, q: r`Wie gross ist $\int_0^1 2x\,(x^2+1)^3\,dx$?`, a: [r`$\frac{15}{4}$`, r`$4$`, r`$\frac14$`, r`$15$`], e: r`$\int_1^2u^3\,du=\left[\frac{u^4}{4}\right]_1^2=\frac{16-1}{4}$.` },
      { l: 1, q: r`Beim unbestimmten Integral setzt man am Schluss wieder $u=g(x)$ ein (Rücksubstitution).`, tf: true, e: r`Das Ergebnis soll eine Funktion von $x$ sein.` },
      { l: 1, q: r`Wie lautet $\int e^{3x}\,dx$?`, a: [r`$\frac13\,e^{3x}+C$`, r`$3\,e^{3x}+C$`, r`$e^{3x}+C$`, r`$\frac{e^{3x}}{x}+C$`], e: r`Mit $u=3x$ ist $dx=\frac{du}{3}$.` },
      { l: 1, q: r`Wie lautet $\int(2x+1)^4\,dx$?`, a: [r`$\frac{(2x+1)^5}{10}+C$`, r`$\frac{(2x+1)^5}{5}+C$`, r`$8\,(2x+1)^3+C$`, r`$\frac{(2x+1)^5}{2}+C$`], e: r`Mit $u=2x+1$ ist $dx=\frac{du}{2}$: $\frac12\cdot\frac{u^5}{5}$.` },
      { l: 1, q: r`Beim Übergang von $x$ zu $u=g(x)$ wird ein Streifen $g'(x)$-mal so breit. Was geschieht mit seiner Höhe?`, a: [r`Sie wird durch $g'(x)$ geteilt; die Fläche bleibt gleich.`, r`Sie wird mit $g'(x)$ multipliziert.`, r`Sie bleibt gleich.`, r`Sie halbiert sich.`], e: r`Aus der Höhe $f(g(x))\cdot g'(x)$ wird $f(u)$, aus der Breite $dx$ wird $du=g'(x)\,dx$.` },
      { l: 1, q: r`Die Substitution ist die Umkehrung der Kettenregel.`, tf: true, e: r`So wie die partielle Integration die Umkehrung der Produktregel ist.` },

      { l: 2, q: r`Wie lautet $\int x\,e^{x^2}\,dx$?`, a: [r`$\frac12\,e^{x^2}+C$`, r`$e^{x^2}+C$`, r`$2\,e^{x^2}+C$`, r`$\frac{x^2}{2}\,e^{x^2}+C$`], e: r`Mit $u=x^2$ ist $x\,dx=\frac{du}{2}$.` },
      { l: 2, q: r`Wie lautet $\int\sin x\cos x\,dx$?`, a: [r`$\frac12\sin^2x+C$`, r`$-\frac12\sin^2x+C$`, r`$\frac12\cos^2x+C$`, r`$\sin^2x+C$`], e: r`Mit $u=\sin x$ und $du=\cos x\,dx$ wird daraus $\int u\,du$.` },
      { l: 2, q: r`Wie gross ist $\int_0^{\sqrt{\pi}}2x\sin(x^2)\,dx$?`, a: [r`$2$`, r`$0$`, r`$1$`, r`$\pi$`], e: r`Mit $u=x^2$: $\int_0^{\pi}\sin u\,du=2$.` },
      { l: 2, q: r`Wie lautet $\int\frac{\ln x}{x}\,dx$?`, a: [r`$\frac12\ln^2x+C$`, r`$\frac{\ln x}{x^2}+C$`, r`$\ln(\ln x)+C$`, r`$\frac{1}{x^2}+C$`], e: r`Mit $u=\ln x$ und $du=\frac{dx}{x}$ wird daraus $\int u\,du$.` },
      { l: 2, q: r`Wie lautet $\int\frac{f'(x)}{f(x)}\,dx$?`, a: [r`$\ln|f(x)|+C$`, r`$\frac{f(x)^2}{2}+C$`, r`$\frac{1}{f(x)}+C$`, r`$f'(x)\ln x+C$`], e: r`Mit $u=f(x)$ wird daraus $\int\frac{du}{u}$.` },
      { l: 2, q: r`Bei $\int\cos(x^2)\,dx$ führt $u=x^2$ direkt zum Ziel.`, tf: false, e: r`Es fehlt der Faktor $2x$, also die innere Ableitung. Ohne ihn lässt sich $dx$ nicht sauber ersetzen.` },
      { l: 2, q: r`Wie gross ist $\int_0^1\frac{x}{x^2+1}\,dx$?`, a: [r`$\frac12\ln 2$`, r`$\ln 2$`, r`$\frac12$`, r`$\frac{\pi}{4}$`], e: r`Mit $u=x^2+1$: $\frac12\int_1^2\frac{du}{u}$.` },
      { l: 2, q: r`$F$ ist eine Stammfunktion von $f$. Wie lautet $\int f(ax+b)\,dx$ für $a\neq0$?`, a: [r`$\frac1a\,F(ax+b)+C$`, r`$a\,F(ax+b)+C$`, r`$F(ax+b)+C$`, r`$\frac{F(x)}{a}+C$`], e: r`Lineare Substitution: Der Faktor $a$ der inneren Ableitung wird durch $\frac1a$ ausgeglichen.` },
      { l: 2, q: r`Wie lautet $\int\frac{1}{\sqrt{2x+1}}\,dx$?`, a: [r`$\sqrt{2x+1}+C$`, r`$2\sqrt{2x+1}+C$`, r`$\frac12\sqrt{2x+1}+C$`, r`$\ln\sqrt{2x+1}+C$`], e: r`Probe: $\big(\sqrt{2x+1}\big)'=\frac{2}{2\sqrt{2x+1}}$.` },
      { l: 2, q: r`Nach dem Umrechnen der Grenzen kann die untere Grenze grösser sein als die obere. Man rechnet trotzdem normal weiter.`, tf: true, e: r`Das geschieht, wenn $g$ fällt. $F(g(b))-F(g(a))$ liefert das richtige Vorzeichen von selbst.` },

      { l: 3, q: r`Welche Substitution eignet sich für $\int\sqrt{1-x^2}\,dx$?`, a: [r`$x=\sin t$`, r`$u=1-x^2$`, r`$u=x^2$`, r`$u=\sqrt{x}$`], e: r`Mit $x=\sin t$ wird $\sqrt{1-x^2}=\cos t$ und $dx=\cos t\,dt$. Für $u=1-x^2$ fehlt der Faktor $x$.` },
      { l: 3, q: r`Wie lautet $\int\frac{1}{x\ln x}\,dx$ für $x>1$?`, a: [r`$\ln(\ln x)+C$`, r`$\frac{\ln x}{x}+C$`, r`$\frac{1}{\ln x}+C$`, r`$\ln(x\ln x)+C$`], e: r`Mit $u=\ln x$ wird daraus $\int\frac{du}{u}$.` },
      { l: 3, q: r`Wie lautet $\int\frac{e^x}{e^x+1}\,dx$?`, a: [r`$\ln(e^x+1)+C$`, r`$e^x\ln(e^x+1)+C$`, r`$\frac{1}{e^x+1}+C$`, r`$x-e^{-x}+C$`], e: r`Im Zähler steht die Ableitung des Nenners.` },
      { l: 3, q: r`Wie gross ist $\int_0^{\ln 2}\frac{e^x}{e^x+1}\,dx$?`, a: [r`$\ln\frac32$`, r`$\ln 2$`, r`$\ln 3$`, r`$\frac12$`], e: r`$\big[\ln(e^x+1)\big]_0^{\ln2}=\ln3-\ln2$.` },
      { l: 3, q: r`Mit $u=x^2$ werden bei $\int_{-1}^{1}x^2\,dx$ beide Grenzen zu 1. Warum ist das Integral trotzdem nicht 0?`, a: [r`$x=\pm\sqrt{u}$ ist auf $[-1,1]$ nicht eindeutig: Man muss das Integral bei 0 teilen.`, r`Weil man Grenzen nie umrechnen darf.`, r`Das Integral ist tatsächlich 0.`, r`Weil $x^2$ keine Stammfunktion hat.`], e: r`Um $dx$ durch $du$ auszudrücken, braucht man $x$ als Funktion von $u$, und das geht nur auf $[-1,0]$ und $[0,1]$ getrennt.` },
      { l: 3, q: r`Wie lautet $\int\frac{1}{1+\sqrt{x}}\,dx$?`, a: [r`$2\sqrt{x}-2\ln(1+\sqrt{x})+C$`, r`$\ln(1+\sqrt{x})+C$`, r`$2\sqrt{x}+2\ln(1+\sqrt{x})+C$`, r`$2\ln(1+\sqrt{x})+C$`], e: r`Mit $u=\sqrt{x}$, $dx=2u\,du$: $\int\frac{2u}{1+u}\,du=\int\left(2-\frac{2}{1+u}\right)du$.` },
      { l: 3, q: r`Wie gross ist $\int_0^{\pi/2}\sin^3x\cos x\,dx$?`, a: [r`$\frac14$`, r`$\frac13$`, r`$1$`, r`$0$`], e: r`Mit $u=\sin x$: $\int_0^1u^3\,du$.` },
      { l: 3, q: r`Wie lautet $\int\frac{1}{x^2+4}\,dx$?`, a: [r`$\frac12\arctan\frac{x}{2}+C$`, r`$\arctan\frac{x}{2}+C$`, r`$\frac14\arctan\frac{x}{2}+C$`, r`$\frac12\ln(x^2+4)+C$`], e: r`$\frac{1}{x^2+4}=\frac14\cdot\frac{1}{(x/2)^2+1}$; mit $u=\frac{x}{2}$ ist $dx=2\,du$.` }
    ],

    // ───────────────────────── Flächen zwischen Kurven ─────────────────────────
    ar: [
      { l: 1, q: r`$f$ ist auf $[a,b]$ positiv. Wie berechnet man die Fläche zwischen dem Graphen und der $x$-Achse?`, a: [r`$\int_a^b f(x)\,dx$`, r`$\int_a^b f'(x)\,dx$`, r`$f(b)-f(a)$`, r`$(b-a)\cdot f(a)$`], e: r`Für positive Funktionen ist das Integral der Flächeninhalt.` },
      { l: 1, q: r`Der Graph von $f$ liegt auf $[0,2]$ unter der $x$-Achse, und es ist $\int_0^2 f(x)\,dx=-3$. Wie gross ist die Fläche zwischen Graph und $x$-Achse?`, a: [r`$3$`, r`$-3$`, r`$0$`, r`$9$`], e: r`Die Fläche ist der Betrag des Integrals.` },
      { l: 1, q: r`$f$ wechselt in $[a,b]$ das Vorzeichen. Wie berechnet man die Fläche zwischen Graph und $x$-Achse?`, a: [r`An den Nullstellen teilen und die Beträge der Teilintegrale addieren.`, r`Einfach $\int_a^b f(x)\,dx$ berechnen.`, r`Den Betrag von $\int_a^b f(x)\,dx$ nehmen.`, r`Nur die Teile über der Achse zählen.`], e: r`Sonst heben sich die Stücke über und unter der Achse teilweise auf.` },
      { l: 1, q: r`Auf $[a,b]$ ist $f(x)\ge g(x)$. Wie gross ist die Fläche zwischen den beiden Graphen?`, a: [r`$\int_a^b\big(f(x)-g(x)\big)\,dx$`, r`$\int_a^b\big(f(x)+g(x)\big)\,dx$`, r`$\int_a^b f(x)\,dx\cdot\int_a^b g(x)\,dx$`, r`$\int_a^b\frac{f(x)}{g(x)}\,dx$`], e: r`Obere Funktion minus untere Funktion: Die Streifen haben die Höhe $f(x)-g(x)$.` },
      { l: 1, q: r`Zwei Graphen schliessen eine Fläche ein. Wie findet man die Integrationsgrenzen?`, a: [r`Man löst $f(x)=g(x)$.`, r`Man löst $f'(x)=g'(x)$.`, r`Man löst $f(x)=0$.`, r`Man löst $g(x)=0$.`], e: r`Die Fläche reicht von Schnittstelle zu Schnittstelle.` },
      { l: 1, q: r`Ein Flächeninhalt ist nie negativ.`, tf: true, e: r`Das Integral kann negativ sein, die Fläche nicht.` },
      { l: 1, q: r`Wie gross ist die Fläche zwischen dem Graphen von $f(x)=x$ und der $x$-Achse von $-1$ bis $1$?`, a: [r`$1$`, r`$0$`, r`$2$`, r`$\frac12$`], e: r`Zwei Dreiecke mit der Fläche $\frac12$. Das Integral selbst wäre 0.` },
      { l: 1, q: r`Wie gross ist die Fläche unter $f(x)=x^2$ von 0 bis 3?`, a: [r`$9$`, r`$27$`, r`$3$`, r`$6$`], e: r`$\left[\frac{x^3}{3}\right]_0^3=\frac{27}{3}$.` },
      { l: 1, q: r`Wie gross ist die Fläche zwischen $f(x)=1-x^2$ und der $x$-Achse?`, a: [r`$\frac43$`, r`$\frac23$`, r`$2$`, r`$1$`], e: r`Nullstellen $\pm1$; $\left[x-\frac{x^3}{3}\right]_{-1}^{1}=\frac23+\frac23$.` },
      { l: 1, q: r`$\int_a^b|f(x)|\,dx$ ist die Fläche zwischen dem Graphen von $f$ und der $x$-Achse von $a$ bis $b$.`, tf: true, e: r`Der Betrag klappt die Stücke unter der Achse nach oben.` },
      { l: 1, q: r`Wie gross ist die Fläche zwischen $y=x$ und $y=x^2$?`, a: [r`$\frac16$`, r`$\frac13$`, r`$\frac12$`, r`$1$`], e: r`Schnittstellen 0 und 1; $\int_0^1(x-x^2)\,dx=\frac12-\frac13$.` },
      { l: 1, q: r`An welchen Stellen schneiden sich $f(x)=x^2$ und $g(x)=x+2$?`, a: [r`Bei $x=-1$ und $x=2$`, r`Bei $x=1$ und $x=-2$`, r`Bei $x=0$ und $x=2$`, r`Bei $x=\pm\sqrt2$`], e: r`$x^2-x-2=0$ hat die Lösungen $-1$ und $2$.` },

      { l: 2, q: r`Wie gross ist die Fläche zwischen $f(x)=x^2$ und $g(x)=x+2$?`, a: [r`$4.5$`, r`$9$`, r`$3$`, r`$6$`], e: r`$\int_{-1}^{2}(x+2-x^2)\,dx=\left[\frac{x^2}{2}+2x-\frac{x^3}{3}\right]_{-1}^{2}=\frac{10}{3}+\frac76$.` },
      { l: 2, q: r`Wie gross ist die Fläche zwischen $f(x)=x^3-x$ und der $x$-Achse von $-1$ bis $1$?`, a: [r`$\frac12$`, r`$0$`, r`$\frac14$`, r`$1$`], e: r`Zwei gleich grosse Stücke zwischen den Nullstellen $-1$, $0$, $1$: $2\cdot\int_0^1(x-x^3)\,dx=2\cdot\frac14$.` },
      { l: 2, q: r`Für die Fläche zwischen $f$ und $g$ spielt es keine Rolle, ob die Graphen über oder unter der $x$-Achse liegen.`, tf: true, e: r`Es zählt nur der Abstand $f(x)-g(x)$ der beiden Graphen.` },
      { l: 2, q: r`Wie gross ist die Fläche zwischen $f(x)=\sin x$ und der $x$-Achse von 0 bis $2\pi$?`, a: [r`$4$`, r`$0$`, r`$2$`, r`$2\pi$`], e: r`Jeder der beiden Bögen hat die Fläche 2.` },
      { l: 2, q: r`Warum muss man die Fläche zwischen $f$ und $g$ an einer Schnittstelle teilen?`, a: [r`Weil dort $f-g$ das Vorzeichen wechselt.`, r`Weil dort $f$ eine Nullstelle hat.`, r`Weil das Integral dort nicht definiert ist.`, r`Das ist nicht nötig.`], e: r`Hinter der Schnittstelle liegt der andere Graph oben.` },
      { l: 2, q: r`Wie gross ist die Fläche zwischen $f(x)=x^2$ und der Geraden $y=4$?`, a: [r`$\frac{32}{3}$`, r`$\frac{16}{3}$`, r`$16$`, r`$8$`], e: r`$\int_{-2}^{2}(4-x^2)\,dx=2\cdot\left(8-\frac83\right)$.` },
      { l: 2, q: r`Verschiebt man beide Graphen um denselben Betrag nach oben, so bleibt die Fläche zwischen ihnen gleich.`, tf: true, e: r`Die Differenz $f(x)-g(x)$ ändert sich nicht.` },
      { l: 2, q: r`Wie gross ist die Fläche unter $f(x)=e^x$ von 0 bis 1?`, a: [r`$e-1$`, r`$e$`, r`$1$`, r`$e+1$`], e: r`$\big[e^x\big]_0^1=e-1$.` },
      { l: 2, q: r`Wie gross ist die Fläche zwischen $y=x^2$ und $y=2x$?`, a: [r`$\frac43$`, r`$\frac23$`, r`$\frac83$`, r`$2$`], e: r`Schnittstellen 0 und 2; $\int_0^2(2x-x^2)\,dx=4-\frac83$.` },
      { l: 2, q: r`Welcher Ausdruck gibt die Fläche zwischen $f$ und $g$ von $a$ bis $b$ immer richtig an?`, a: [r`$\int_a^b|f(x)-g(x)|\,dx$`, r`$\left|\int_a^b\big(f(x)-g(x)\big)\,dx\right|$`, r`$\int_a^b\big(f(x)-g(x)\big)\,dx$`, r`$\int_a^b|f(x)|\,dx-\int_a^b|g(x)|\,dx$`], e: r`Der Betrag muss im Integral stehen. Sonst heben sich Stücke auf, wenn sich die Graphen schneiden.` },

      { l: 3, q: r`Die Fläche zwischen $y=x$ und $y=x^2$ ist gleich gross wie die Fläche zwischen $y=\sqrt{x}$ und $y=x$.`, tf: true, e: r`Die Graphen von $x^2$ und $\sqrt{x}$ gehen durch Spiegeln an $y=x$ ineinander über. Beide Flächen sind $\frac16$.` },
      { l: 3, q: r`Für welches $k>0$ schliessen $y=x^2$ und $y=k$ die Fläche 36 ein?`, a: [r`$k=9$`, r`$k=6$`, r`$k=3$`, r`$k=27$`], e: r`Fläche: $\frac43\,k^{3/2}=36$, also $k^{3/2}=27$.` },
      { l: 3, q: r`Wie gross ist die Fläche zwischen $\sin x$ und $\cos x$ von 0 bis $\frac{\pi}{2}$?`, a: [r`$2\sqrt2-2$`, r`$0$`, r`$2$`, r`$\sqrt2$`], e: r`Schnittstelle $\frac{\pi}{4}$; $\int_0^{\pi/4}(\cos x-\sin x)\,dx=\sqrt2-1$, und das zweite Stück ist gleich gross.` },
      { l: 3, q: r`Wie gross ist die Fläche unter $f(x)=\frac{1}{x^2}$ von 1 bis unendlich?`, a: [r`$1$`, r`Unendlich`, r`$2$`, r`$\frac12$`], e: r`$\left[-\frac1x\right]_1^{b}=1-\frac1b$ geht für $b\to\infty$ gegen 1.` },
      { l: 3, q: r`Wie gross ist die Fläche unter $f(x)=\frac1x$ von 1 bis unendlich?`, a: [r`Unendlich`, r`$1$`, r`$e$`, r`$\ln 2$`], e: r`$\big[\ln x\big]_1^{b}=\ln b$ wächst über alle Grenzen, obwohl der Graph der $x$-Achse immer näher kommt.` },
      { l: 3, q: r`$\left|\int_a^b f(x)\,dx\right|$ ist immer die Fläche zwischen dem Graphen und der $x$-Achse.`, tf: false, e: r`Nur wenn $f$ das Vorzeichen nicht wechselt. Sonst heben sich Stücke auf, bevor der Betrag genommen wird.` },
      { l: 3, q: r`Wie gross ist die Fläche, die von der Parabel $y=x^2$, ihrer Tangente im Punkt $(1\,|\,1)$ und der $x$-Achse begrenzt wird?`, a: [r`$\frac{1}{12}$`, r`$\frac13$`, r`$\frac14$`, r`$\frac16$`], e: r`Tangente $y=2x-1$ schneidet die $x$-Achse bei $\frac12$. Fläche unter der Parabel $\frac13$ minus Dreieck $\frac12\cdot\frac12\cdot1=\frac14$.` },
      { l: 3, q: r`Die Parabel $y=x^2$ und die Gerade $y=1$ schliessen eine Fläche ein. Welchen Anteil des Rechtecks mit den Ecken $(\pm1\,|\,0)$ und $(\pm1\,|\,1)$ füllt sie?`, a: [r`$\frac23$`, r`$\frac12$`, r`$\frac13$`, r`$\frac34$`], e: r`Fläche $\int_{-1}^{1}(1-x^2)\,dx=\frac43$, das Rechteck hat die Fläche 2.` }
    ],

    // ───────────────────────── Rotationskörper ─────────────────────────
    rot: [
      { l: 1, q: r`Der Graph von $f$ dreht sich zwischen $a$ und $b$ um die $x$-Achse. Wie gross ist das Volumen des Körpers?`, a: [r`$V=\pi\int_a^b f(x)^2\,dx$`, r`$V=\pi\int_a^b f(x)\,dx$`, r`$V=2\pi\int_a^b f(x)\,dx$`, r`$V=\int_a^b f(x)^2\,dx$`], e: r`Summe dünner Kreisscheiben mit dem Radius $f(x)$.` },
      { l: 1, q: r`Welches Volumen hat eine dünne Scheibe der Dicke $\Delta x$ an der Stelle $x$?`, a: [r`$\pi\,f(x)^2\,\Delta x$`, r`$2\pi\,f(x)\,\Delta x$`, r`$f(x)\,\Delta x$`, r`$\pi\,f(x)\,\Delta x$`], e: r`Ein flacher Zylinder: Grundfläche $\pi r^2$ mit $r=f(x)$, mal Höhe $\Delta x$.` },
      { l: 1, q: r`Welche Form hat der Querschnitt des Körpers senkrecht zur Drehachse?`, a: [r`Ein Kreis mit dem Radius $f(x)$.`, r`Ein Quadrat mit der Seite $f(x)$.`, r`Ein Rechteck.`, r`Eine Ellipse.`], e: r`Jeder Punkt des Graphen läuft bei der Drehung auf einem Kreis um die $x$-Achse.` },
      { l: 1, q: r`$f(x)=2$ dreht sich auf $[0,3]$ um die $x$-Achse. Wie gross ist das Volumen?`, a: [r`$12\pi$`, r`$6\pi$`, r`$12$`, r`$36\pi$`], e: r`Zylinder mit Radius 2 und Höhe 3: $\pi\cdot4\cdot3$.` },
      { l: 1, q: r`$f(x)=x$ dreht sich auf $[0,3]$ um die $x$-Achse. Wie gross ist das Volumen?`, a: [r`$9\pi$`, r`$27\pi$`, r`$3\pi$`, r`$9$`], e: r`$\pi\int_0^3x^2\,dx=\pi\cdot\frac{27}{3}$. Das ist ein Kegel mit Radius 3 und Höhe 3.` },
      { l: 1, q: r`Dreht sich eine waagrechte Strecke um die $x$-Achse, so entsteht ein Zylinder.`, tf: true, e: r`Alle Scheiben haben denselben Radius.` },
      { l: 1, q: r`Welcher Körper entsteht, wenn sich die Strecke $f(x)=x$ auf $[0,h]$ um die $x$-Achse dreht?`, a: [r`Ein Kegel.`, r`Ein Zylinder.`, r`Eine Kugel.`, r`Eine Pyramide.`], e: r`Der Radius wächst gleichmässig von 0 an: Die Spitze liegt im Ursprung.` },
      { l: 1, q: r`Welcher Körper entsteht, wenn sich der Halbkreis $f(x)=\sqrt{r^2-x^2}$ um die $x$-Achse dreht?`, a: [r`Eine Kugel.`, r`Ein Kegel.`, r`Ein Zylinder.`, r`Eine Halbkugel.`], e: r`Ein Halbkreis über dem Durchmesser erzeugt bei der Drehung die ganze Kugel.` },
      { l: 1, q: r`Warum steht in der Volumenformel $f(x)^2$?`, a: [r`Weil die Kreisfläche $\pi r^2$ ist und $r=f(x)$.`, r`Weil der Graph zwei Seiten hat.`, r`Wegen des Satzes von Pythagoras.`, r`Weil man die Fläche unter dem Graphen quadriert.`], e: r`Summiert werden Kreisflächen, nicht Längen.` },
      { l: 1, q: r`Je mehr Scheiben man nimmt, desto genauer nähert ihre Summe das Volumen an.`, tf: true, e: r`Wie bei Unter- und Obersumme: Der Grenzwert der Scheibensummen ist das Integral.` },
      { l: 1, q: r`$f(x)=\sqrt{x}$ dreht sich auf $[0,4]$ um die $x$-Achse. Wie gross ist das Volumen?`, a: [r`$8\pi$`, r`$4\pi$`, r`$16\pi$`, r`$2\pi$`], e: r`$\pi\int_0^4x\,dx=\pi\cdot\frac{16}{2}$.` },
      { l: 1, q: r`$x$ und $f(x)$ sind in cm gemessen. In welcher Einheit ergibt sich das Rotationsvolumen?`, a: [r`$\text{cm}^3$`, r`$\text{cm}^2$`, r`$\text{cm}$`, r`$\pi\ \text{cm}$`], e: r`Fläche ($\text{cm}^2$) mal Dicke ($\text{cm}$).` },

      { l: 2, q: r`Was ergibt $\pi\int_{-r}^{r}(r^2-x^2)\,dx$?`, a: [r`$\frac43\pi r^3$`, r`$\frac23\pi r^3$`, r`$\pi r^3$`, r`$4\pi r^2$`], e: r`$\pi\left[r^2x-\frac{x^3}{3}\right]_{-r}^{r}=\pi\cdot2\cdot\frac23r^3$: das Kugelvolumen.` },
      { l: 2, q: r`Liegt der Graph unter der $x$-Achse, so wird das Rotationsvolumen negativ.`, tf: false, e: r`Wegen des Quadrats ist $f(x)^2\ge0$. Der Körper ist derselbe wie beim gespiegelten Graphen.` },
      { l: 2, q: r`Wie ändert sich das Rotationsvolumen, wenn man $f$ durch $2f$ ersetzt?`, a: [r`Es wird viermal so gross.`, r`Es wird doppelt so gross.`, r`Es wird achtmal so gross.`, r`Es bleibt gleich.`], e: r`$(2f)^2=4f^2$: Alle Radien verdoppeln sich, die Länge bleibt.` },
      { l: 2, q: r`Welche Funktion erzeugt einen Kegel mit Radius $r$ und Höhe $h$?`, a: [r`$f(x)=\frac{r}{h}\,x$ auf $[0,h]$`, r`$f(x)=\frac{h}{r}\,x$ auf $[0,h]$`, r`$f(x)=r$ auf $[0,h]$`, r`$f(x)=r-x$ auf $[0,h]$`], e: r`Bei $x=h$ muss der Radius $r$ erreicht sein. Das Integral ergibt $\frac13\pi r^2h$.` },
      { l: 2, q: r`$f(x)=x^2$ dreht sich auf $[0,1]$ um die $x$-Achse. Wie gross ist das Volumen?`, a: [r`$\frac{\pi}{5}$`, r`$\frac{\pi}{3}$`, r`$\frac{\pi}{4}$`, r`$\frac{\pi}{2}$`], e: r`$\pi\int_0^1x^4\,dx$. Quadriert wird der Funktionsterm, nicht das Integral.` },
      { l: 2, q: r`Die Fläche zwischen $f$ und $g$ (mit $f\ge g\ge0$) dreht sich um die $x$-Achse. Wie gross ist das Volumen des Hohlkörpers?`, a: [r`$\pi\int_a^b\big(f(x)^2-g(x)^2\big)\,dx$`, r`$\pi\int_a^b\big(f(x)-g(x)\big)^2\,dx$`, r`$\pi\int_a^b\big(f(x)-g(x)\big)\,dx$`, r`$\pi\left(\int_a^b f(x)\,dx-\int_a^b g(x)\,dx\right)^2$`], e: r`Äusserer Körper minus innerer Körper: Jede Scheibe ist ein Kreisring.` },
      { l: 2, q: r`$f(x)=e^x$ dreht sich auf $[0,1]$ um die $x$-Achse. Wie gross ist das Volumen?`, a: [r`$\frac{\pi}{2}\,(e^2-1)$`, r`$\pi\,(e-1)$`, r`$\pi\,e^2$`, r`$\pi\,(e^2-1)$`], e: r`$\pi\int_0^1e^{2x}\,dx=\pi\left[\frac12e^{2x}\right]_0^1$.` },
      { l: 2, q: r`$f(x)=\sin x$ dreht sich auf $[0,\pi]$ um die $x$-Achse. Wie gross ist das Volumen?`, a: [r`$\frac{\pi^2}{2}$`, r`$2\pi$`, r`$\pi$`, r`$\frac{\pi^2}{4}$`], e: r`$\int_0^{\pi}\sin^2x\,dx=\frac{\pi}{2}$, mal $\pi$.` },
      { l: 2, q: r`$f(x)=\frac1x$ dreht sich auf $[1,2]$ um die $x$-Achse. Wie gross ist das Volumen?`, a: [r`$\frac{\pi}{2}$`, r`$\pi\ln 2$`, r`$\pi$`, r`$\frac{\pi}{4}$`], e: r`$\pi\int_1^2\frac{1}{x^2}\,dx=\pi\left(1-\frac12\right)$.` },
      { l: 2, q: r`Zwei Graphen mit gleich grosser Fläche unter der Kurve erzeugen bei der Drehung um die $x$-Achse immer gleich grosse Volumen.`, tf: false, e: r`Beispiel auf $[0,1]$: $f(x)=1$ und $g(x)=2x$ haben beide die Fläche 1, aber die Volumen $\pi$ und $\frac43\pi$.` },

      { l: 3, q: r`$f(x)=\frac1x$ dreht sich auf $[1,\infty)$ um die $x$-Achse. Wie gross ist das Volumen?`, a: [r`$\pi$`, r`Unendlich`, r`$\frac{\pi}{2}$`, r`$1$`], e: r`$\pi\int_1^{b}\frac{1}{x^2}\,dx=\pi\left(1-\frac1b\right)\to\pi$. Die Fläche unter dem Graphen ist dagegen unendlich.` },
      { l: 3, q: r`Die Fläche zwischen $y=x^2$, der $y$-Achse und $y=1$ dreht sich um die $y$-Achse. Wie gross ist das Volumen?`, a: [r`$\frac{\pi}{2}$`, r`$\frac{\pi}{5}$`, r`$\frac{\pi}{3}$`, r`$\pi$`], e: r`Scheiben senkrecht zur $y$-Achse mit dem Radius $x=\sqrt{y}$: $\pi\int_0^1y\,dy$.` },
      { l: 3, q: r`Von einer Kugel mit Radius 3 wird die Kappe zwischen $x=2$ und $x=3$ abgeschnitten. Wie gross ist ihr Volumen?`, a: [r`$\frac83\pi$`, r`$\frac43\pi$`, r`$3\pi$`, r`$9\pi$`], e: r`$\pi\int_2^3(9-x^2)\,dx=\pi\left[9x-\frac{x^3}{3}\right]_2^3=\pi\left(18-\frac{46}{3}\right)$.` },
      { l: 3, q: r`$f(x)=\sqrt{x}$ erzeugt auf $[0,h]$ ein Paraboloid. Welchen Anteil des umschriebenen Zylinders füllt es?`, a: [r`Die Hälfte.`, r`Ein Drittel.`, r`Zwei Drittel.`, r`Ein Viertel.`], e: r`Paraboloid: $\pi\int_0^hx\,dx=\frac{\pi h^2}{2}$. Zylinder mit Radius $\sqrt{h}$ und Höhe $h$: $\pi h^2$.` },
      { l: 3, q: r`Kegel, Halbkugel und Zylinder mit demselben Radius $r$ und derselben Höhe $r$ haben Volumen im Verhältnis $1:2:3$.`, tf: true, e: r`$\frac13\pi r^3$, $\frac23\pi r^3$ und $\pi r^3$.` },
      { l: 3, q: r`Für welches $b$ hat der Körper, den $f(x)=\sqrt{x}$ auf $[0,b]$ erzeugt, das Volumen $8\pi$?`, a: [r`$b=4$`, r`$b=2$`, r`$b=8$`, r`$b=16$`], e: r`$\pi\cdot\frac{b^2}{2}=8\pi$, also $b^2=16$.` },
      { l: 3, q: r`Die Fläche zwischen $y=x$ und $y=x^2$ dreht sich um die $x$-Achse. Wie gross ist das Volumen?`, a: [r`$\frac{2\pi}{15}$`, r`$\frac{\pi}{30}$`, r`$\frac{\pi}{6}$`, r`$\frac{\pi}{3}$`], e: r`$\pi\int_0^1(x^2-x^4)\,dx=\pi\left(\frac13-\frac15\right)$. Mit $(x-x^2)^2$ käme fälschlich $\frac{\pi}{30}$ heraus.` },
      { l: 3, q: r`Verschiebt man den Graphen von $f>0$ um 1 nach oben, so wächst das Rotationsvolumen über $[a,b]$ um genau $\pi\,(b-a)$.`, tf: false, e: r`$(f+1)^2=f^2+2f+1$: Dazu kommt noch $2\pi\int_a^b f(x)\,dx$.` }
    ]
  };
})();
