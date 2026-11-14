// quiz_sim.js — Quizfragen zur Ähnlichkeit (wird von 116_quiz.js bei Bedarf geladen)
// Je Ansicht 30 Fragen: 12 × Stufe 1 (Grundwissen), 10 × Stufe 2 (Verständnis), 8 × Stufe 3 (Knacknuss).
// Die Reihenfolge hier ist die Reihenfolge im Quiz und auf dem Arbeitsblatt (Frage 1 bis 30).
// {l, q, a, e}: a[0] ist die richtige Antwort (Anzeige gemischt)   ·   {l, q, tf, e}: Aussage, tf = wahr/falsch
(function () {
  const r = String.raw;
  // Strahlensatzfigur in Worten (steht bei den Fragen, die sie brauchen)
  const RAY = r`Zwei Strahlen gehen von $Z$ aus; die Parallelen $AB$ und $CD$ schneiden sie ($A$, $C$ auf dem einen, $B$, $D$ auf dem anderen Strahl). `;
  const RAY0 = r`Zwei Strahlen gehen von $Z$ aus; $A$ und $C$ liegen auf dem einen, $B$ und $D$ auf dem anderen. `;
  // Bezeichnungen im rechtwinkligen Dreieck
  const RT = r`Im rechtwinkligen Dreieck mit den Katheten $a$, $b$ und der Hypotenuse $c$ teilt die Höhe $h$ die Hypotenuse in die Abschnitte $p$ (bei $a$) und $q$ (bei $b$). `;
  (window.QUIZ_DATA = window.QUIZ_DATA || {}).sim = {

    // ───────────────────────── Ähnlichkeitsabbildungen ─────────────────────────
    map: [
      { l: 1, q: r`Welche Abbildungen lassen alle Längen gleich?`, a: [r`Verschiebung, Drehung und Spiegelung`, r`Nur die zentrische Streckung`, r`Verschiebung und zentrische Streckung`, r`Keine`], e: r`Es sind die Kongruenzabbildungen: Bild und Original sind deckungsgleich.` },
      { l: 1, q: r`Was geschieht mit den Längen bei einer zentrischen Streckung mit dem Faktor $k$?`, a: [r`Jede Länge wird mit $|k|$ multipliziert.`, r`Zu jeder Länge wird $k$ addiert.`, r`Die Längen bleiben gleich.`, r`Jede Länge wird mit $k^2$ multipliziert.`], e: r`Alle Strecken werden im selben Verhältnis vergrössert oder verkleinert.` },
      { l: 1, q: r`Was bleibt bei Verschiebung, Drehung, Spiegelung und zentrischer Streckung immer gleich?`, a: [r`Alle Winkel`, r`Alle Längen`, r`Alle Flächen`, r`Die Lage der Figur`], e: r`Die Form bleibt erhalten.` },
      { l: 1, q: r`Eine Seite ist 3 cm lang. Wie lang ist sie nach einer Streckung mit $k=2$?`, a: [r`6 cm`, r`5 cm`, r`9 cm`, r`1.5 cm`], e: r`$3\cdot2$.` },
      { l: 1, q: r`Was heisst «kongruent»?`, a: [r`Deckungsgleich: gleiche Form und gleiche Grösse.`, r`Gleiche Form, beliebige Grösse.`, r`Gleiche Fläche, beliebige Form.`, r`Parallel zueinander.`], e: r`Man könnte die eine Figur auf die andere legen.` },
      { l: 1, q: r`Was heisst «ähnlich»?`, a: [r`Gleiche Form; die Grösse darf verschieden sein.`, r`Gleiche Fläche.`, r`Gleicher Umfang.`, r`Gleiche Farbe und Lage.`], e: r`Eine Figur ist eine massstäbliche Vergrösserung oder Verkleinerung der anderen.` },
      { l: 1, q: r`Wohin wird der Punkt $(x\,|\,y)$ bei der Spiegelung an der $x$-Achse abgebildet?`, a: [r`$(x\,|\,-y)$`, r`$(-x\,|\,y)$`, r`$(-x\,|\,-y)$`, r`$(y\,|\,x)$`], e: r`Oben und unten werden vertauscht.` },
      { l: 1, q: r`Eine Verschiebung ändert die Seitenlängen einer Figur.`, tf: false, e: r`Die Figur wechselt nur den Ort.` },
      { l: 1, q: r`Wohin wird der Punkt $(3\,|\,2)$ bei der Spiegelung an der $y$-Achse abgebildet?`, a: [r`$(-3\,|\,2)$`, r`$(3\,|\,-2)$`, r`$(-3\,|\,-2)$`, r`$(2\,|\,3)$`], e: r`Links und rechts werden vertauscht.` },
      { l: 1, q: r`Wohin wird der Punkt $(1\,|\,2)$ bei der Streckung vom Ursprung aus mit $k=3$ abgebildet?`, a: [r`$(3\,|\,6)$`, r`$(4\,|\,5)$`, r`$(3\,|\,2)$`, r`$(1\,|\,6)$`], e: r`Beide Koordinaten werden mit 3 multipliziert.` },
      { l: 1, q: r`Was bewirkt eine zentrische Streckung mit $k=\frac12$?`, a: [r`Alle Längen werden halbiert.`, r`Alle Längen werden verdoppelt.`, r`Die Figur wird gespiegelt.`, r`Die Figur bleibt, wie sie ist.`], e: r`Für $|k|<1$ wird verkleinert.` },
      { l: 1, q: r`Kongruente Figuren sind auch ähnlich.`, tf: true, e: r`Ähnlich mit dem Faktor 1.` },

      { l: 2, q: r`Was geschieht mit dem Flächeninhalt bei einer Streckung mit dem Faktor $k$?`, a: [r`Er wird mit $k^2$ multipliziert.`, r`Er wird mit $|k|$ multipliziert.`, r`Er wird mit $2k$ multipliziert.`, r`Er bleibt gleich.`], e: r`Länge und Breite wachsen beide um den Faktor $|k|$.` },
      { l: 2, q: r`Ein Dreieck hat die Fläche 4 cm². Wie gross ist sie nach einer Streckung mit $k=3$?`, a: [r`36 cm²`, r`12 cm²`, r`7 cm²`, r`24 cm²`], e: r`$4\cdot3^2$.` },
      { l: 2, q: r`Welcher Abbildung entspricht die Streckung vom Ursprung aus mit $k=-1$?`, a: [r`Der Drehung um $180^\circ$ um den Ursprung.`, r`Der Spiegelung an der $x$-Achse.`, r`Der Verschiebung um $-1$.`, r`Der Abbildung, die nichts verändert.`], e: r`Aus $(x\,|\,y)$ wird $(-x\,|\,-y)$: die Punktspiegelung am Ursprung.` },
      { l: 2, q: r`Wohin wird der Punkt $(2\,|\,1)$ bei der Drehung um $90^\circ$ im Gegenuhrzeigersinn um den Ursprung abgebildet?`, a: [r`$(-1\,|\,2)$`, r`$(1\,|\,-2)$`, r`$(-2\,|\,1)$`, r`$(1\,|\,2)$`], e: r`Aus $(x\,|\,y)$ wird $(-y\,|\,x)$.` },
      { l: 2, q: r`Welche Abbildung kehrt den Umlaufsinn eines Dreiecks um?`, a: [r`Die Spiegelung an einer Achse`, r`Die Verschiebung`, r`Die Drehung`, r`Die zentrische Streckung mit $k>0$`], e: r`Aus «$A$, $B$, $C$ im Gegenuhrzeigersinn» wird «im Uhrzeigersinn».` },
      { l: 2, q: r`Wie liegt bei einer zentrischen Streckung eine Bildgerade zu ihrer Originalgeraden?`, a: [r`Parallel`, r`Senkrecht`, r`Sie schneiden sich immer im Zentrum.`, r`Beliebig`], e: r`Geraden durch das Zentrum werden auf sich selbst abgebildet.` },
      { l: 2, q: r`Was geschieht mit dem Umfang bei einer Streckung mit dem Faktor $k$?`, a: [r`Er wird mit $|k|$ multipliziert.`, r`Er wird mit $k^2$ multipliziert.`, r`Er bleibt gleich.`, r`Er wächst um $k$.`], e: r`Der Umfang ist eine Länge.` },
      { l: 2, q: r`Auch bei einer Streckung mit $k=-2$ bleiben alle Winkel gleich.`, tf: true, e: r`Das Bild ist doppelt so gross und um $180^\circ$ gedreht.` },
      { l: 2, q: r`Ein Dreieck mit den Seiten 3, 4 und 5 wird mit $k=2.5$ gestreckt. Wie lang sind die Bildseiten?`, a: [r`$7.5$, $10$ und $12.5$`, r`$5.5$, $6.5$ und $7.5$`, r`$6$, $8$ und $10$`, r`$7.5$, $10$ und $15$`], e: r`Jede Seite mal 2.5.` },
      { l: 2, q: r`Wie liegen bei einer zentrischen Streckung ein Punkt, sein Bildpunkt und das Zentrum $Z$?`, a: [r`Auf einer Geraden`, r`Auf einem Kreis um $Z$`, r`In einem rechtwinkligen Dreieck`, r`Beliebig`], e: r`Der Bildpunkt liegt auf der Geraden durch $Z$ und den Punkt.` },

      { l: 3, q: r`Wohin wird $P(3\,|\,2)$ bei der Streckung mit dem Zentrum $Z(1\,|\,1)$ und $k=2$ abgebildet?`, a: [r`$(5\,|\,3)$`, r`$(6\,|\,4)$`, r`$(4\,|\,3)$`, r`$(7\,|\,5)$`], e: r`Von $Z$ nach $P$ sind es $(2\,|\,1)$; das Doppelte davon von $Z$ aus abtragen.` },
      { l: 3, q: r`Mit welchem Faktor $k>0$ muss man strecken, damit sich der Flächeninhalt verdoppelt?`, a: [r`$\sqrt2$`, r`$2$`, r`$4$`, r`$1.5$`], e: r`$k^2=2$.` },
      { l: 3, q: r`Ein Körper wird mit $k=2$ gestreckt. Was geschieht mit seinem Volumen?`, a: [r`Es wird 8-mal so gross.`, r`Es wird doppelt so gross.`, r`Es wird 4-mal so gross.`, r`Es wird 6-mal so gross.`], e: r`Länge, Breite und Höhe verdoppeln sich: $2^3$.` },
      { l: 3, q: r`Zwei Spiegelungen nacheinander an zwei parallelen Achsen ergeben zusammen eine Verschiebung.`, tf: true, e: r`Der Umlaufsinn wird zweimal umgekehrt; die Figur wandert um den doppelten Achsenabstand.` },
      { l: 3, q: r`Was ergibt die Spiegelung an der $x$-Achse, gefolgt von der Spiegelung an der $y$-Achse?`, a: [r`Die Drehung um $180^\circ$ um den Ursprung`, r`Eine Verschiebung`, r`Die Spiegelung an der Geraden $y=x$`, r`Die Abbildung, die nichts verändert`], e: r`Aus $(x\,|\,y)$ wird $(x\,|\,-y)$ und dann $(-x\,|\,-y)$.` },
      { l: 3, q: r`Auf einer Karte im Massstab 1 : 25 000 sind zwei Orte 4 cm voneinander entfernt. Wie weit ist es in Wirklichkeit?`, a: [r`1 km`, r`100 m`, r`10 km`, r`625 m`], e: r`$4\cdot25\,000\,\text{cm}=100\,000\,\text{cm}$.` },
      { l: 3, q: r`Auf einer Karte im Massstab 1 : 25 000 misst ein See 1 cm². Wie gross ist er in Wirklichkeit?`, a: [r`62 500 m²`, r`25 000 m²`, r`250 m²`, r`625 m²`], e: r`1 cm entspricht 250 m, also 1 cm² einer Fläche von $250\,\text{m}\cdot250\,\text{m}$.` },
      { l: 3, q: r`Was ergeben zwei Streckungen mit demselben Zentrum und den Faktoren 3 und $-2$ nacheinander?`, a: [r`Eine Streckung mit $k=-6$`, r`Eine Streckung mit $k=1$`, r`Eine Streckung mit $k=6$`, r`Eine Verschiebung`], e: r`Die Faktoren werden multipliziert.` }
    ],

    // ───────────────────────── Ähnlich oder nicht? ─────────────────────────
    test: [
      { l: 1, q: r`Wann sind zwei Dreiecke ähnlich?`, a: [r`Wenn sie in allen Winkeln übereinstimmen.`, r`Wenn sie denselben Umfang haben.`, r`Wenn sie dieselbe Fläche haben.`, r`Wenn sie in einer Seite übereinstimmen.`], e: r`Gleiche Winkel heisst gleiche Form.` },
      { l: 1, q: r`In wie vielen Winkeln müssen zwei Dreiecke übereinstimmen, damit sie sicher ähnlich sind?`, a: [r`In zwei`, r`In einem`, r`In allen dreien einzeln nachgemessen`, r`Die Winkel genügen nie.`], e: r`Der dritte Winkel folgt aus der Winkelsumme $180^\circ$.` },
      { l: 1, q: r`Was gilt für die Seiten ähnlicher Dreiecke?`, a: [r`Alle entsprechenden Seitenverhältnisse sind gleich.`, r`Alle entsprechenden Seiten sind gleich lang.`, r`Die Seiten unterscheiden sich um dieselbe Länge.`, r`Die längsten Seiten sind gleich lang.`], e: r`Jede Seite des einen Dreiecks ist das $k$-Fache der entsprechenden Seite des anderen.` },
      { l: 1, q: r`Was bedeutet $\triangle ABC\sim\triangle PQR$?`, a: [r`Die beiden Dreiecke sind ähnlich.`, r`Die beiden Dreiecke sind kongruent.`, r`Die beiden Dreiecke haben dieselbe Fläche.`, r`Die beiden Dreiecke sind verschieden.`], e: r`Das Zeichen $\sim$ steht für «ähnlich».` },
      { l: 1, q: r`Sind die Dreiecke mit den Seiten 3, 4, 5 und 6, 8, 10 ähnlich?`, a: [r`Ja, alle Seiten sind verdoppelt.`, r`Nein, die Seiten sind verschieden lang.`, r`Nein, überall kommt 3 dazu.`, r`Das lässt sich ohne Winkel nicht sagen.`], e: r`$\frac63=\frac84=\frac{10}{5}=2$.` },
      { l: 1, q: r`Alle gleichseitigen Dreiecke sind zueinander ähnlich.`, tf: true, e: r`Alle Winkel messen $60^\circ$.` },
      { l: 1, q: r`Ein Dreieck hat die Winkel $50^\circ$ und $60^\circ$, ein anderes $60^\circ$ und $70^\circ$. Sind sie ähnlich?`, a: [r`Ja, beide haben die Winkel $50^\circ$, $60^\circ$ und $70^\circ$.`, r`Nein, nur ein Winkel stimmt überein.`, r`Nein, $50^\circ\ne70^\circ$.`, r`Das hängt von den Seitenlängen ab.`], e: r`Der dritte Winkel ergänzt jeweils auf $180^\circ$.` },
      { l: 1, q: r`Mit welchem Faktor wird das Dreieck mit den Seiten 3, 4, 5 auf das Dreieck mit den Seiten 9, 12, 15 abgebildet?`, a: [r`$3$`, r`$6$`, r`$\frac13$`, r`$9$`], e: r`$\frac93=\frac{12}{4}=\frac{15}{5}$.` },
      { l: 1, q: r`Alle Rechtecke sind zueinander ähnlich.`, tf: false, e: r`Die Winkel stimmen, aber die Seitenverhältnisse nicht: Ein Quadrat und ein schmales Rechteck haben verschiedene Formen.` },
      { l: 1, q: r`Welche Figuren sind immer zueinander ähnlich?`, a: [r`Zwei Kreise`, r`Zwei Rechtecke`, r`Zwei Dreiecke`, r`Zwei Rauten`], e: r`Jeder Kreis ist eine Vergrösserung jedes anderen.` },
      { l: 1, q: r`Es ist $\triangle ABC\sim\triangle PQR$ mit den entsprechenden Seiten $a$, $p$ und $b$, $q$. Welche Gleichung gilt?`, a: [r`$\frac ap=\frac bq$`, r`$a\cdot p=b\cdot q$`, r`$a-p=b-q$`, r`$\frac ap=\frac qb$`], e: r`Entsprechende Seiten stehen im gleichen Verhältnis.` },
      { l: 1, q: r`Alle Quadrate sind zueinander ähnlich.`, tf: true, e: r`Gleiche Winkel und überall das Seitenverhältnis $1:1$.` },

      { l: 2, q: r`Sind die Dreiecke mit den Seiten 4, 6, 8 und 6, 9, 12 ähnlich?`, a: [r`Ja, mit dem Faktor 1.5.`, r`Nein, überall kommt etwas anderes dazu.`, r`Ja, mit dem Faktor 2.`, r`Nein, die Verhältnisse sind verschieden.`], e: r`$\frac64=\frac96=\frac{12}{8}=1.5$.` },
      { l: 2, q: r`Sind die Dreiecke mit den Seiten 2, 3, 4 und 4, 6, 9 ähnlich?`, a: [r`Nein, $\frac94$ ist nicht 2.`, r`Ja, mit dem Faktor 2.`, r`Ja, mit dem Faktor 2.25.`, r`Das lässt sich nicht sagen.`], e: r`Zwei Verhältnisse sind 2, das dritte 2.25.` },
      { l: 2, q: r`Zwei ähnliche Dreiecke haben die entsprechenden Seiten 6, 8, 10 und 9, $x$, 15. Wie gross ist $x$?`, a: [r`$12$`, r`$11$`, r`$13$`, r`$10$`], e: r`Faktor $\frac96=1.5$.` },
      { l: 2, q: r`Alle rechtwinkligen Dreiecke sind zueinander ähnlich.`, tf: false, e: r`Die spitzen Winkel können verschieden sein, zum Beispiel $30^\circ$/$60^\circ$ und $45^\circ$/$45^\circ$.` },
      { l: 2, q: r`Welche Dreiecke sind immer zueinander ähnlich?`, a: [r`Zwei gleichschenklig-rechtwinklige Dreiecke`, r`Zwei gleichschenklige Dreiecke`, r`Zwei rechtwinklige Dreiecke`, r`Zwei stumpfwinklige Dreiecke`], e: r`Sie haben die Winkel $45^\circ$, $45^\circ$ und $90^\circ$.` },
      { l: 2, q: r`Zwei Dreiecke stimmen in einem Winkel überein, und die beiden anliegenden Seiten stehen im gleichen Verhältnis. Sind sie ähnlich?`, a: [r`Ja.`, r`Nein, es braucht zwei Winkel.`, r`Nur, wenn der Winkel $90^\circ$ misst.`, r`Nur, wenn die Dreiecke gleich gross sind.`], e: r`Eine Streckung mit diesem Verhältnis bringt das eine Dreieck auf das andere.` },
      { l: 2, q: r`Zwei Dreiecke sind ähnlich mit dem Faktor 3. In welchem Verhältnis stehen ihre Flächen?`, a: [r`$1:9$`, r`$1:3$`, r`$1:6$`, r`$1:27$`], e: r`Flächen wachsen mit $k^2$.` },
      { l: 2, q: r`Ein 2 m hoher Stab wirft einen 3 m langen Schatten, ein Baum zur gleichen Zeit einen 12 m langen. Wie hoch ist der Baum?`, a: [r`8 m`, r`18 m`, r`11 m`, r`6 m`], e: r`Gleiche Sonnenhöhe, ähnliche Dreiecke: $\frac{h}{12}=\frac23$.` },
      { l: 2, q: r`Welches Rechteck ist ähnlich zum Rechteck mit den Seiten 2 und 3?`, a: [r`Das Rechteck mit den Seiten 6 und 9`, r`Das Rechteck mit den Seiten 3 und 4`, r`Das Rechteck mit den Seiten 4 und 5`, r`Das Rechteck mit den Seiten 2 und 6`], e: r`$\frac62=\frac93=3$.` },
      { l: 2, q: r`Sind zwei Dreiecke ähnlich mit dem Faktor 1, so sind sie kongruent.`, tf: true, e: r`Dann sind alle entsprechenden Seiten gleich lang.` },

      { l: 3, q: r`Zwei gleichschenklige Dreiecke, die beide einen Winkel von $40^\circ$ haben, sind immer ähnlich.`, tf: false, e: r`Die $40^\circ$ können an der Spitze liegen ($40^\circ$, $70^\circ$, $70^\circ$) oder an der Basis ($40^\circ$, $40^\circ$, $100^\circ$).` },
      { l: 3, q: r`Zwei ähnliche Dreiecke haben die Flächen 18 cm² und 50 cm². Eine Seite des kleinen ist 6 cm lang. Wie lang ist die entsprechende Seite des grossen?`, a: [r`10 cm`, r`Etwa 16.7 cm`, r`8 cm`, r`15 cm`], e: r`Flächenverhältnis $\frac{50}{18}=\frac{25}{9}$, also Seitenverhältnis $\frac53$.` },
      { l: 3, q: r`Ein Rechteck wird quer zur langen Seite halbiert, und die Hälften sind zum ganzen Rechteck ähnlich. Welches Seitenverhältnis hat es?`, a: [r`$\sqrt2:1$`, r`$2:1$`, r`$3:2$`, r`$4:3$`], e: r`$\frac ab=\frac{b}{a/2}$ ergibt $a^2=2b^2$. So sind die Papierformate A4, A5, … gebaut.` },
      { l: 3, q: r`Man verbindet die drei Seitenmitten eines Dreiecks. Welchen Anteil der Fläche hat das Mittendreieck?`, a: [r`Einen Viertel`, r`Die Hälfte`, r`Einen Drittel`, r`Einen Achtel`], e: r`Es ist ähnlich zum grossen Dreieck mit $k=\frac12$, also Fläche mal $\frac14$.` },
      { l: 3, q: r`Stimmen zwei Vierecke in allen vier Winkeln überein, so sind sie ähnlich.`, tf: false, e: r`Ein Quadrat und ein längliches Rechteck haben dieselben Winkel. Bei Vierecken genügen die Winkel nicht.` },
      { l: 3, q: r`Ein Modell im Massstab 1 : 50 hat das Volumen 2 dm³. Welches Volumen hat das Original?`, a: [r`250 m³`, r`100 dm³`, r`5 m³`, r`2500 m³`], e: r`$2\,\text{dm}^3\cdot50^3=250\,000\,\text{dm}^3$.` },
      { l: 3, q: r`Eine Parallele zu einer Seite schneidet von einem Dreieck ein ähnliches Dreieck mit der halben Fläche ab. Wie lang sind dessen Seiten, verglichen mit dem ganzen Dreieck?`, a: [r`Etwa 71 %`, r`50 %`, r`25 %`, r`75 %`], e: r`$k^2=\frac12$, also $k=\frac{1}{\sqrt2}\approx0.707$.` },
      { l: 3, q: r`Ein Dreieck hat die Seiten 6, 9 und 12. Ein dazu ähnliches Dreieck hat den Umfang 9. Wie lang ist dessen kürzeste Seite?`, a: [r`$2$`, r`$3$`, r`$1.5$`, r`$4$`], e: r`Umfang 27, also $k=\frac13$.` }
    ],

    // ───────────────────────── Strahlensätze ─────────────────────────
    ray: [
      { l: 1, q: r`In welcher Figur gelten die Strahlensätze?`, a: [r`Zwei Strahlen mit gemeinsamem Anfangspunkt werden von zwei Parallelen geschnitten.`, r`Zwei Parallelen werden von einer dritten Parallelen geschnitten.`, r`Zwei Kreise schneiden sich in zwei Punkten.`, r`Zwei beliebige Geraden schneiden zwei Strahlen.`], e: r`Auf die Parallelen kommt es an.` },
      { l: 1, q: RAY + r`Was sagt der erste Strahlensatz?`, a: [r`$\frac{|ZA|}{|ZC|}=\frac{|ZB|}{|ZD|}$`, r`$|ZA|\cdot|ZC|=|ZB|\cdot|ZD|$`, r`$|ZA|+|ZC|=|ZB|+|ZD|$`, r`$\frac{|ZA|}{|ZD|}=\frac{|ZB|}{|ZC|}$`], e: r`Die Abschnitte auf dem einen Strahl verhalten sich wie die entsprechenden auf dem anderen.` },
      { l: 1, q: RAY + r`Was sagt der zweite Strahlensatz?`, a: [r`$\frac{|AB|}{|CD|}=\frac{|ZA|}{|ZC|}$`, r`$\frac{|AB|}{|CD|}=\frac{|ZA|}{|AC|}$`, r`$|AB|=|CD|$`, r`$\frac{|AB|}{|CD|}=\frac{|ZC|}{|ZA|}$`], e: r`Die Parallelenstücke verhalten sich wie die Strecken von $Z$ aus.` },
      { l: 1, q: RAY + r`Warum gelten die Strahlensätze?`, a: [r`Weil die Dreiecke $ZAB$ und $ZCD$ ähnlich sind.`, r`Weil die Dreiecke $ZAB$ und $ZCD$ kongruent sind.`, r`Weil alle Strecken gleich lang sind.`, r`Weil die Strahlen senkrecht aufeinander stehen.`], e: r`Sie haben den Winkel bei $Z$ gemeinsam und gleiche Winkel an den Parallelen.` },
      { l: 1, q: RAY + r`Es ist $|ZA|=2$, $|ZC|=6$ und $|ZB|=3$. Wie lang ist $|ZD|$?`, a: [r`$9$`, r`$7$`, r`$4$`, r`$1$`], e: r`Alles wird verdreifacht.` },
      { l: 1, q: RAY + r`Es ist $|ZA|=2$, $|ZC|=4$ und $|AB|=3$. Wie lang ist $|CD|$?`, a: [r`$6$`, r`$5$`, r`$1.5$`, r`$12$`], e: r`Faktor $\frac42=2$.` },
      { l: 1, q: r`Sind die beiden schneidenden Geraden nicht parallel, so gelten die Strahlensätze nicht.`, tf: true, e: r`Dann sind die beiden Dreiecke nicht ähnlich.` },
      { l: 1, q: RAY + r`Was gilt für die Winkel bei $A$ und bei $C$ (zwischen Strahl und Parallele)?`, a: [r`Sie sind gleich gross.`, r`Sie ergänzen sich zu $90^\circ$.`, r`Der Winkel bei $C$ ist doppelt so gross.`, r`Sie sind immer rechte Winkel.`], e: r`Stufenwinkel an Parallelen.` },
      { l: 1, q: RAY + r`Es ist $|ZA|=4$ und $|ZC|=8$. Mit welchem Faktor wird das Dreieck $ZAB$ auf $ZCD$ gestreckt?`, a: [r`$2$`, r`$4$`, r`$\frac12$`, r`$12$`], e: r`$\frac84$.` },
      { l: 1, q: RAY + r`Es ist $|ZA|=3$ und $|AC|=3$. Wie lang ist $|ZC|$?`, a: [r`$6$`, r`$3$`, r`$9$`, r`$0$`], e: r`$A$ liegt zwischen $Z$ und $C$: Die Stücke werden addiert.` },
      { l: 1, q: RAY + r`Welche Abbildung führt das Dreieck $ZAB$ in das Dreieck $ZCD$ über?`, a: [r`Eine zentrische Streckung mit dem Zentrum $Z$`, r`Eine Verschiebung`, r`Eine Drehung um $Z$`, r`Eine Spiegelung`], e: r`Darum ist $CD$ parallel zu $AB$.` },
      { l: 1, q: r`Die Strahlensätze gelten auch, wenn die beiden Parallelen auf verschiedenen Seiten von $Z$ liegen.`, tf: true, e: r`Das ist die Figur mit zwei sich kreuzenden Geraden; sie gehört zu einer Streckung mit negativem Faktor.` },

      { l: 2, q: RAY + r`Es ist $|ZA|=3$, $|AC|=6$ und $|AB|=2$. Wie lang ist $|CD|$?`, a: [r`$6$`, r`$4$`, r`$5$`, r`$1$`], e: r`$|ZC|=9$, also Faktor 3. Im zweiten Strahlensatz zählen die Strecken von $Z$ aus.` },
      { l: 2, q: RAY + r`Es ist $|ZA|=4$, $|AC|=2$ und $|ZB|=6$. Wie lang ist $|BD|$?`, a: [r`$3$`, r`$9$`, r`$4$`, r`$12$`], e: r`$\frac{|BD|}{|ZB|}=\frac{|AC|}{|ZA|}=\frac12$.` },
      { l: 2, q: RAY + r`Es gilt auch $\frac{|ZA|}{|AC|}=\frac{|ZB|}{|BD|}$.`, tf: true, e: r`Der erste Strahlensatz gilt für alle einander entsprechenden Abschnitte auf den Strahlen.` },
      { l: 2, q: RAY + r`Es gilt $\frac{|AB|}{|CD|}=\frac{|ZA|}{|AC|}$.`, tf: false, e: r`Bei den Parallelenstücken müssen die Strecken von $Z$ aus gemessen werden: $\frac{|ZA|}{|ZC|}$.` },
      { l: 2, q: r`Man peilt über die Spitze eines 1.5 m hohen Stabs, der 2 m entfernt steht, die Spitze eines 20 m entfernten Baums an (Auge am Boden). Wie hoch ist der Baum?`, a: [r`15 m`, r`13.3 m`, r`30 m`, r`26.7 m`], e: r`$\frac{h}{1.5}=\frac{20}{2}$.` },
      { l: 2, q: RAY + r`Es ist $|ZA|=5$, $|ZC|=8$ und $|CD|=12$. Wie lang ist $|AB|$?`, a: [r`$7.5$`, r`$19.2$`, r`$9$`, r`$4.5$`], e: r`$12\cdot\frac58$.` },
      { l: 2, q: RAY0 + r`Aus $\frac{|ZA|}{|ZC|}=\frac{|ZB|}{|ZD|}$ folgt, dass $AB$ und $CD$ parallel sind.`, tf: true, e: r`Die Umkehrung des ersten Strahlensatzes gilt.` },
      { l: 2, q: r`Zwei Geraden kreuzen sich in $Z$; die Parallelen $AB$ und $CD$ liegen auf verschiedenen Seiten von $Z$. Es ist $|ZA|=2$, $|ZC|=3$ und $|AB|=4$. Wie lang ist $|CD|$?`, a: [r`$6$`, r`$5$`, r`$\frac83$`, r`$4$`], e: r`$4\cdot\frac32$.` },
      { l: 2, q: RAY + r`Es ist $|ZA|:|ZC|=1:3$. In welchem Verhältnis stehen die Flächen der Dreiecke $ZAB$ und $ZCD$?`, a: [r`$1:9$`, r`$1:3$`, r`$1:6$`, r`$1:4$`], e: r`Flächen wachsen mit dem Quadrat des Streckfaktors.` },
      { l: 2, q: RAY + r`Es ist $|ZA|:|AC|=2:3$. In welchem Verhältnis stehen $|AB|$ und $|CD|$?`, a: [r`$2:5$`, r`$2:3$`, r`$3:5$`, r`$3:2$`], e: r`$|ZC|$ entspricht $2+3=5$ Teilen.` },

      { l: 3, q: RAY + r`Es ist $|AC|=4$, $|AB|=3$ und $|CD|=5$. Wie lang ist $|ZA|$?`, a: [r`$6$`, r`$2.4$`, r`$10$`, r`$6.67$`], e: r`$\frac{x}{x+4}=\frac35$ ergibt $5x=3x+12$.` },
      { l: 3, q: r`Ein Trapez hat die parallelen Seiten 6 und 10 und die Höhe 4. Man verlängert die Schenkel bis zum Schnittpunkt $Z$. Wie weit ist $Z$ von der kürzeren Parallelen entfernt?`, a: [r`$6$`, r`$4$`, r`$2.4$`, r`$10$`], e: r`$\frac{x}{x+4}=\frac{6}{10}$.` },
      { l: 3, q: RAY0 + r`Aus $\frac{|AB|}{|CD|}=\frac{|ZA|}{|ZC|}$ folgt, dass $AB$ und $CD$ parallel sind.`, tf: false, e: r`Die Umkehrung des zweiten Strahlensatzes gilt nicht: Eine Strecke der richtigen Länge lässt sich von $C$ aus auch schräg einzeichnen.` },
      { l: 3, q: RAY + r`Es ist $|ZA|:|ZC|=2:3$. Welchen Anteil an der Fläche des Dreiecks $ZCD$ hat das Trapez $ABDC$?`, a: [r`$\frac59$`, r`$\frac49$`, r`$\frac13$`, r`$\frac23$`], e: r`Das kleine Dreieck hat $\left(\frac23\right)^2=\frac49$ der Fläche; der Rest ist das Trapez.` },
      { l: 3, q: r`Eine 1.80 m grosse Person steht 4 m neben einer 5.40 m hohen Laterne. Wie lang ist ihr Schatten?`, a: [r`2 m`, r`1.33 m`, r`4 m`, r`12 m`], e: r`$\frac{s}{s+4}=\frac{1.8}{5.4}=\frac13$.` },
      { l: 3, q: r`Eine Münze mit 2 cm Durchmesser deckt in 2.20 m Entfernung vom Auge gerade den Mond ab (Durchmesser 3500 km). Wie weit ist der Mond entfernt?`, a: [r`Etwa 385 000 km`, r`Etwa 38 500 km`, r`Etwa 3 850 000 km`, r`Etwa 7700 km`], e: r`$\frac{x}{3500\,\text{km}}=\frac{2.2\,\text{m}}{0.02\,\text{m}}=110$.` },
      { l: 3, q: r`Ein Trapez hat die parallelen Seiten 4 und 6. In welchem Verhältnis teilt der Schnittpunkt der Diagonalen jede Diagonale?`, a: [r`$2:3$`, r`$1:1$`, r`$1:2$`, r`$4:10$`], e: r`Die Diagonalen und die Parallelen bilden die Strahlensatzfigur mit dem Zentrum im Schnittpunkt: $4:6$.` },
      { l: 3, q: r`Drei Parallelen schneiden aus einem Strahl nacheinander die Abschnitte 2 und 3 heraus, aus einem zweiten Strahl als ersten Abschnitt 5. Wie lang ist dort der zweite Abschnitt?`, a: [r`$7.5$`, r`$6$`, r`$3.33$`, r`$10$`], e: r`Die Abschnitte stehen im gleichen Verhältnis: $\frac{x}{5}=\frac32$.` }
    ],

    // ───────────────────────── Rechtwinkliges Dreieck mit Höhe ─────────────────────────
    right: [
      { l: 1, q: r`Die Höhe auf die Hypotenuse teilt ein rechtwinkliges Dreieck in zwei Teildreiecke. Was gilt für die drei Dreiecke?`, a: [r`Alle drei sind zueinander ähnlich.`, r`Alle drei sind kongruent.`, r`Alle drei haben dieselbe Fläche.`, r`Nur die beiden Teildreiecke sind ähnlich.`], e: r`Jedes hat die Winkel $\alpha$, $\beta$ und $90^\circ$.` },
      { l: 1, q: r`Warum sind die Teildreiecke zum ganzen Dreieck ähnlich?`, a: [r`Sie haben dieselben drei Winkel.`, r`Sie haben dieselben Seitenlängen.`, r`Sie haben denselben Umfang.`, r`Sie liegen im selben Kreis.`], e: r`Ein rechter Winkel und ein Winkel, den sie mit dem ganzen Dreieck teilen.` },
      { l: 1, q: RT + r`Was sagt der Höhensatz?`, a: [r`$h^2=p\cdot q$`, r`$h=p\cdot q$`, r`$h^2=p+q$`, r`$h^2=a\cdot b$`], e: r`Das Quadrat über der Höhe ist so gross wie das Rechteck aus den beiden Hypotenusenabschnitten.` },
      { l: 1, q: RT + r`Was sagt der Kathetensatz?`, a: [r`$a^2=c\cdot p$`, r`$a^2=c\cdot q$`, r`$a^2=p\cdot q$`, r`$a=c\cdot p$`], e: r`Das Quadrat über einer Kathete ist so gross wie das Rechteck aus Hypotenuse und anliegendem Abschnitt.` },
      { l: 1, q: r`Was sagt der Satz des Pythagoras für ein rechtwinkliges Dreieck mit den Katheten $a$, $b$ und der Hypotenuse $c$?`, a: [r`$a^2+b^2=c^2$`, r`$a+b=c$`, r`$a^2-b^2=c^2$`, r`$a\cdot b=c^2$`], e: r`Die Kathetenquadrate sind zusammen so gross wie das Hypotenusenquadrat.` },
      { l: 1, q: r`Was sagt der Satz des Thales?`, a: [r`Liegt $C$ auf dem Kreis mit dem Durchmesser $AB$, so ist der Winkel bei $C$ ein rechter.`, r`Jedes Dreieck hat einen rechten Winkel.`, r`Der Winkel bei $C$ ist immer $60^\circ$.`, r`Die Höhe halbiert die Hypotenuse.`], e: r`Darum zieht man $C$ im Bild auf dem Halbkreis über $AB$.` },
      { l: 1, q: RT + r`Es ist $p=4$ und $q=9$. Wie lang ist $h$?`, a: [r`$6$`, r`$36$`, r`$6.5$`, r`$13$`], e: r`$h^2=36$.` },
      { l: 1, q: RT + r`Was ergibt $p+q$?`, a: [r`$c$`, r`$h$`, r`$a+b$`, r`$h^2$`], e: r`Die beiden Abschnitte bilden zusammen die Hypotenuse.` },
      { l: 1, q: r`Die Höhe steht senkrecht auf der Hypotenuse.`, tf: true, e: r`So ist die Höhe definiert.` },
      { l: 1, q: RT + r`Es ist $p=2$ und $q=8$. Wie lang ist $h$?`, a: [r`$4$`, r`$16$`, r`$5$`, r`$10$`], e: r`$h^2=16$.` },
      { l: 1, q: RT + r`Es ist $c=10$ und $p=3.6$. Wie lang ist $a$?`, a: [r`$6$`, r`$36$`, r`$13.6$`, r`$6.4$`], e: r`$a^2=10\cdot3.6=36$.` },
      { l: 1, q: r`Die Höhe halbiert die Hypotenuse in jedem rechtwinkligen Dreieck.`, tf: false, e: r`Nur im gleichschenkligen. Sonst sind die Abschnitte $p$ und $q$ verschieden lang.` },

      { l: 2, q: r`Wie lang ist im Dreieck mit den Seiten 3, 4 und 5 die Höhe auf die Hypotenuse?`, a: [r`$2.4$`, r`$2.5$`, r`$3.5$`, r`$1.2$`], e: r`$h=\frac{a\,b}{c}=\frac{12}{5}$.` },
      { l: 2, q: RT + r`Es ist $a=3$, $b=4$ und $c=5$. Wie lang ist $p$?`, a: [r`$1.8$`, r`$3.2$`, r`$2.5$`, r`$0.6$`], e: r`$p=\frac{a^2}{c}=\frac95$.` },
      { l: 2, q: RT + r`Es ist $h=6$ und $p=4$. Wie lang ist $q$?`, a: [r`$9$`, r`$1.5$`, r`$2$`, r`$24$`], e: r`$36=4\cdot q$.` },
      { l: 2, q: RT + r`Warum gilt $h=\frac{a\,b}{c}$?`, a: [r`Die Fläche lässt sich als $\frac{a\,b}{2}$ und als $\frac{c\,h}{2}$ berechnen.`, r`Weil $h$ der Durchschnitt von $a$ und $b$ ist.`, r`Weil $a+b=c+h$ ist.`, r`Das gilt nur im Dreieck mit den Seiten 3, 4 und 5.`], e: r`Die Katheten sind zueinander Grundseite und Höhe, ebenso $c$ und $h$.` },
      { l: 2, q: r`Die Höhe $CD$ teilt das rechtwinklige Dreieck $ABC$ (rechter Winkel bei $C$). Wie gross ist der Winkel bei $C$ im Teildreieck $ADC$?`, a: [r`So gross wie $\beta$ (der Winkel bei $B$)`, r`So gross wie $\alpha$ (der Winkel bei $A$)`, r`$45^\circ$`, r`$90^\circ$`], e: r`Im Teildreieck $ADC$ ergänzt er $\alpha$ auf $90^\circ$, genau wie $\beta$ im ganzen Dreieck.` },
      { l: 2, q: RT + r`Was ergibt sich, wenn man die beiden Kathetensätze $a^2=c\,p$ und $b^2=c\,q$ addiert?`, a: [r`Der Satz des Pythagoras`, r`Der Höhensatz`, r`Der Satz des Thales`, r`Der Strahlensatz`], e: r`$a^2+b^2=c\,(p+q)=c^2$.` },
      { l: 2, q: RT + r`Es ist $p=1$ und $q=4$. Wie lang ist $a$?`, a: [r`$\sqrt5$`, r`$2$`, r`$\sqrt{20}$`, r`$5$`], e: r`$a^2=c\cdot p=5\cdot1$.` },
      { l: 2, q: r`Die Höhe auf die Hypotenuse ist nie länger als die halbe Hypotenuse.`, tf: true, e: r`$C$ liegt auf dem Thaleskreis, und dessen Radius ist $\frac c2$.` },
      { l: 2, q: r`Die Hypotenuse $c$ ist fest. Für welches rechtwinklige Dreieck ist die Höhe am grössten?`, a: [r`Für das gleichschenklige; dort ist $h=\frac c2$.`, r`Für das Dreieck mit den Winkeln $30^\circ$ und $60^\circ$.`, r`Die Höhe ist für alle gleich.`, r`Für ein möglichst flaches Dreieck.`], e: r`$C$ liegt dann am höchsten Punkt des Thaleskreises.` },
      { l: 2, q: RT + r`Es ist $c=13$ und $a=5$. Wie lang ist $p$?`, a: [r`Etwa $1.92$`, r`$2.6$`, r`Etwa $11.08$`, r`$8$`], e: r`$p=\frac{a^2}{c}=\frac{25}{13}$.` },

      { l: 3, q: r`Ein Rechteck mit den Seiten 4 und 9 soll in ein flächengleiches Quadrat verwandelt werden. Welcher Satz liefert die Quadratseite als Strecke, und wie lang ist sie?`, a: [r`Der Höhensatz; die Seite ist 6.`, r`Der Satz des Pythagoras; die Seite ist $\sqrt{97}$.`, r`Der Kathetensatz; die Seite ist 6.5.`, r`Der Satz des Thales; die Seite ist 13.`], e: r`Mit $p=4$ und $q=9$ ist $h^2=36$.` },
      { l: 3, q: RT + r`Es ist $h=12$ und $c=25$. Wie lang sind $p$ und $q$?`, a: [r`$9$ und $16$`, r`$12$ und $13$`, r`$10$ und $15$`, r`$5$ und $20$`], e: r`$p+q=25$ und $p\cdot q=144$.` },
      { l: 3, q: RT + r`Es gilt $\frac{1}{h^2}=\frac{1}{a^2}+\frac{1}{b^2}$.`, tf: true, e: r`Aus $h=\frac{a\,b}{c}$ folgt $\frac{1}{h^2}=\frac{c^2}{a^2b^2}=\frac{a^2+b^2}{a^2b^2}$.` },
      { l: 3, q: RT + r`Es ist $a=3$ und $b=4$. In welchem Verhältnis stehen die Flächen der Teildreiecke über $q$ und über $p$?`, a: [r`$16:9$`, r`$4:3$`, r`$1:1$`, r`$5:4$`], e: r`Beide haben die Höhe $h$; die Flächen verhalten sich wie $q:p=\frac{b^2}{c}:\frac{a^2}{c}$.` },
      { l: 3, q: r`Mit welchen Hypotenusenabschnitten konstruiert man nach dem Höhensatz eine Strecke der Länge $\sqrt7$?`, a: [r`Mit 1 und 7`, r`Mit 3 und 4`, r`Mit 2 und 5`, r`Mit 7 und 7`], e: r`$h^2=1\cdot7$.` },
      { l: 3, q: RT + r`Es ist $p=3$ und $a=6$. Wie lang ist $h$?`, a: [r`$3\sqrt3$`, r`$\sqrt{18}$`, r`$4.5$`, r`$9$`], e: r`$c=\frac{a^2}{p}=12$, also $q=9$ und $h^2=27$.` },
      { l: 3, q: RT + r`Welche Ungleichung liest man aus $h\le\frac c2$ ab?`, a: [r`$\sqrt{p\,q}\le\frac{p+q}{2}$`, r`$p\,q\le p+q$`, r`$\sqrt{p+q}\le\frac{p\,q}{2}$`, r`$p\le q$`], e: r`Das geometrische Mittel ist höchstens so gross wie das arithmetische.` },
      { l: 3, q: r`Ein rechtwinkliges Dreieck hat die Hypotenuse 8 und einen Winkel von $30^\circ$. Wie lang ist die Höhe auf die Hypotenuse?`, a: [r`$2\sqrt3$`, r`$4$`, r`$4\sqrt3$`, r`$2$`], e: r`Katheten 4 und $4\sqrt3$; $h=\frac{4\cdot4\sqrt3}{8}$.` }
    ]
  };
})();
