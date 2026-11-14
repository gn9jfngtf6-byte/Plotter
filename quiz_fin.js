// quiz_fin.js — Quizfragen zur Finanzmathematik (wird von 116_quiz.js bei Bedarf geladen)
// Je Ansicht 30 Fragen: 12 × Stufe 1 (Grundwissen), 10 × Stufe 2 (Verständnis), 8 × Stufe 3 (Knacknuss).
// Die Reihenfolge hier ist die Reihenfolge im Quiz und auf dem Arbeitsblatt (Frage 1 bis 30).
// {l, q, a, e}: a[0] ist die richtige Antwort (Anzeige gemischt)   ·   {l, q, tf, e}: Aussage, tf = wahr/falsch
// Bezeichnungen wie im Thema: Zinsfaktor r = 1 + p/100, Zeitpunkte t = 0, 1, 2, … in Jahren.
(function () {
  const r = String.raw;
  (window.QUIZ_DATA = window.QUIZ_DATA || {}).fin = {

    // ───────────────────────── Zeitstrahl und Konten ─────────────────────────
    line: [
      { l: 1, q: r`Wie lautet der Zinsfaktor $r$ zum Zinssatz $p\,\%$?`, a: [r`$r=1+\frac{p}{100}$`, r`$r=\frac{p}{100}$`, r`$r=1+p$`, r`$r=100+p$`], e: r`Kapital plus Zins: 100 % und $p\,\%$ dazu.` },
      { l: 1, q: r`Welcher Zinsfaktor gehört zu 5 %?`, a: [r`$1.05$`, r`$0.05$`, r`$1.5$`, r`$5$`], e: r`$1+\frac{5}{100}$.` },
      { l: 1, q: r`Wie zinst man einen Betrag $K$ um $n$ Jahre auf?`, a: [r`$K\cdot r^n$`, r`$K\cdot n\cdot r$`, r`$K+r^n$`, r`$K\cdot r^{-n}$`], e: r`Jedes Jahr wird mit $r$ multipliziert.` },
      { l: 1, q: r`Wie zinst man einen Betrag $K$ um $n$ Jahre ab?`, a: [r`$K\cdot r^{-n}$`, r`$K\cdot r^n$`, r`$K-n\cdot r$`, r`$\frac{K}{n\cdot r}$`], e: r`Für jedes Jahr wird durch $r$ geteilt.` },
      { l: 1, q: r`1000 CHF werden ein Jahr lang zu 5 % verzinst. Wie viel ist es danach?`, a: [r`1050 CHF`, r`1005 CHF`, r`1500 CHF`, r`1055 CHF`], e: r`$1000\cdot1.05$.` },
      { l: 1, q: r`Was sagt das Prinzip der verschiedenen Konti?`, a: [r`Jede Zahlung wird einzeln auf den gesuchten Zeitpunkt auf- oder abgezinst; dann wird addiert.`, r`Jede Zahlung braucht eine eigene Bank.`, r`Alle Zahlungen werden zuerst addiert und dann verzinst.`, r`Nur die erste Zahlung wird verzinst.`], e: r`So behält man bei mehreren Zahlungen den Überblick.` },
      { l: 1, q: r`Was ist der Barwert einer Zahlung?`, a: [r`Ihr Wert heute (zum Zeitpunkt 0).`, r`Ihr Wert am Ende der Laufzeit.`, r`Der Betrag, der bar ausbezahlt wird.`, r`Der Zins eines Jahres.`], e: r`Man erhält ihn durch Abzinsen.` },
      { l: 1, q: r`Beträge, die zu verschiedenen Zeitpunkten fällig sind, darf man direkt addieren.`, tf: false, e: r`Erst müssen alle auf denselben Zeitpunkt auf- oder abgezinst werden.` },
      { l: 1, q: r`Was ist der Endwert?`, a: [r`Der Wert am Ende der Laufzeit.`, r`Der Wert heute.`, r`Die letzte Zahlung.`, r`Die Summe aller Zinsen.`], e: r`Man erhält ihn durch Aufzinsen.` },
      { l: 1, q: r`1000 CHF werden zwei Jahre lang zu 10 % verzinst. Wie viel ist es danach?`, a: [r`1210 CHF`, r`1200 CHF`, r`1100 CHF`, r`1020 CHF`], e: r`$1000\cdot1.1^2$.` },
      { l: 1, q: r`In einem Jahr werden 1050 CHF fällig; der Zins beträgt 5 %. Wie gross ist der Barwert?`, a: [r`1000 CHF`, r`1102.50 CHF`, r`997.50 CHF`, r`1050 CHF`], e: r`$\frac{1050}{1.05}$.` },
      { l: 1, q: r`Bei positivem Zins macht Aufzinsen einen Betrag grösser.`, tf: true, e: r`Dann ist $r>1$.` },

      { l: 2, q: r`Man zahlt je 1000 CHF bei $t=0$ und bei $t=1$ ein; der Zins beträgt 10 %. Wie viel ist es bei $t=2$?`, a: [r`2310 CHF`, r`2420 CHF`, r`2200 CHF`, r`2210 CHF`], e: r`$1000\cdot1.21+1000\cdot1.1$.` },
      { l: 2, q: r`In zwei Jahren werden 1210 CHF fällig; der Zins beträgt 10 %. Wie gross ist der Barwert?`, a: [r`1000 CHF`, r`1100 CHF`, r`968 CHF`, r`1008.33 CHF`], e: r`$\frac{1210}{1.1^2}$.` },
      { l: 2, q: r`Es werden je 500 CHF bei $t=1$ und bei $t=2$ fällig; der Zins beträgt 10 %. Wie gross ist der Barwert bei $t=0$?`, a: [r`Etwa 868 CHF`, r`1000 CHF`, r`Etwa 909 CHF`, r`Etwa 826 CHF`], e: r`$\frac{500}{1.1}+\frac{500}{1.21}$.` },
      { l: 2, q: r`Bei $t=0$ fliessen 1000 CHF, bei $t=2$ fliessen 1100 CHF; der Zins beträgt 10 %. Wie viel sind beide zusammen bei $t=1$ wert?`, a: [r`2100 CHF`, r`2310 CHF`, r`2000 CHF`, r`2200 CHF`], e: r`Die erste wird aufgezinst (1100), die zweite abgezinst (1000).` },
      { l: 2, q: r`Wie trägt man eine Auszahlung (einen Bezug) in die Rechnung ein?`, a: [r`Mit negativem Vorzeichen; ihr auf- oder abgezinster Wert wird abgezogen.`, r`Gar nicht.`, r`Wie eine Einzahlung.`, r`Mit dem doppelten Betrag.`], e: r`Auch ein Bezug hat ein eigenes Konto mit Zins.` },
      { l: 2, q: r`Bei $t=0$ zahlt man 1000 CHF ein, bei $t=1$ bezieht man 500 CHF; der Zins beträgt 10 %. Wie gross ist der Stand bei $t=2$?`, a: [r`660 CHF`, r`710 CHF`, r`605 CHF`, r`550 CHF`], e: r`$1000\cdot1.21-500\cdot1.1$.` },
      { l: 2, q: r`Der Wert einer Zahlungsreihe hängt davon ab, auf welchen Zeitpunkt man ihn bezieht.`, tf: true, e: r`Der Wert bei $t=5$ ist das $r^5$-Fache des Barwerts.` },
      { l: 2, q: r`Eine Zahlung liegt bei $t=5$. Wie erhält man ihren Wert bei $t=3$?`, a: [r`Man zinst sie um 2 Jahre ab.`, r`Man zinst sie um 2 Jahre auf.`, r`Man zinst sie um 3 Jahre ab.`, r`Man zinst sie um 5 Jahre ab.`], e: r`Von 5 zurück nach 3 sind es zwei Jahre.` },
      { l: 2, q: r`Der Zins beträgt 5 %. Was ist mehr wert: 1000 CHF heute oder 1040 CHF in einem Jahr?`, a: [r`1000 CHF heute`, r`1040 CHF in einem Jahr`, r`Beides ist gleich viel wert.`, r`Das lässt sich nicht vergleichen.`], e: r`Aus 1000 CHF werden in einem Jahr 1050 CHF.` },
      { l: 2, q: r`Eine Zahlung wird von $t=2$ nach $t=7$ aufgezinst. Welchen Exponenten hat $r$?`, a: [r`$5$`, r`$7$`, r`$2$`, r`$9$`], e: r`$7-2$ Jahre.` },

      { l: 3, q: r`Welche einzelne Zahlung bei $t=2$ ist gleich viel wert wie 1000 CHF bei $t=0$ und 1000 CHF bei $t=4$ zusammen (Zins 10 %)?`, a: [r`Etwa 2036 CHF`, r`2000 CHF`, r`Etwa 2674 CHF`, r`Etwa 1683 CHF`], e: r`$1000\cdot1.21+\frac{1000}{1.21}$.` },
      { l: 3, q: r`Angebot A: 10 000 CHF sofort. Angebot B: 5000 CHF sofort und 5500 CHF in einem Jahr. Welches ist bei 8 % Zins mehr wert?`, a: [r`B, mit einem Barwert von etwa 10 093 CHF`, r`A`, r`Beide sind gleich viel wert.`, r`B, mit einem Barwert von 10 500 CHF`], e: r`$5000+\frac{5500}{1.08}$.` },
      { l: 3, q: r`Sind zwei Zahlungsreihen zu einem Zeitpunkt gleich viel wert, so sind sie es (beim selben Zins) zu jedem Zeitpunkt.`, tf: true, e: r`Beide Werte werden beim Verschieben mit demselben Faktor multipliziert.` },
      { l: 3, q: r`Man zahlt 1000 CHF bei $t=0$ und 2000 CHF bei $t=1$ ein und hat bei $t=2$ genau 3410 CHF. Wie hoch war der Zins?`, a: [r`10 %`, r`5 %`, r`13.7 %`, r`8 %`], e: r`$1000\,r^2+2000\,r=3410$ stimmt für $r=1.1$: $1210+2200$.` },
      { l: 3, q: r`Ein Kredit von 10 000 CHF (Zins 5 %) wird mit 6000 CHF nach einem Jahr und dem Rest nach zwei Jahren zurückbezahlt. Wie gross ist der Rest?`, a: [r`4725 CHF`, r`4000 CHF`, r`4410 CHF`, r`5025 CHF`], e: r`$10\,000\cdot1.05^2-6000\cdot1.05$.` },
      { l: 3, q: r`Bei welchem Zins sind 1000 CHF heute und 1210 CHF in zwei Jahren gleich viel wert?`, a: [r`Bei 10 %`, r`Bei 10.5 %`, r`Bei 21 %`, r`Bei 20 %`], e: r`$r^2=1.21$.` },
      { l: 3, q: r`Je 100 CHF werden bei $t=0$, $t=1$ und $t=2$ einbezahlt; der Zins beträgt 10 %. Wie viel ist es bei $t=2$?`, a: [r`331 CHF`, r`300 CHF`, r`364.10 CHF`, r`330 CHF`], e: r`$121+110+100$.` },
      { l: 3, q: r`Wie gross ist bei 3 % Zins der Barwert von 1000 CHF, die in 10 Jahren fällig werden?`, a: [r`Etwa 744 CHF`, r`700 CHF`, r`Etwa 970 CHF`, r`Etwa 1344 CHF`], e: r`$\frac{1000}{1.03^{10}}$.` }
    ],

    // ───────────────────────── Zeitstrahl und Summenzeichen ─────────────────────────
    sum: [
      { l: 1, q: r`Wie schreibt man den Wert regelmässiger Raten $R$ kurz?`, a: [r`Als Summe $\sum R\cdot r^k$`, r`Als Produkt $R\cdot r$`, r`Als $R^k$`, r`Als $R+r+k$`], e: r`Jede Rate hat ihren eigenen Exponenten $k$.` },
      { l: 1, q: r`Was bedeutet der Exponent $k$ einer Rate beim Aufzinsen?`, a: [r`Wie oft diese Rate verzinst wird.`, r`Die Nummer der Rate.`, r`Den Betrag der Rate.`, r`Den Zinssatz.`], e: r`So viele Jahre liegt sie vor dem Bewertungszeitpunkt.` },
      { l: 1, q: r`Welche Exponenten stehen beim Abzinsen?`, a: [r`Negative: $r^{-k}$ für $k$ Jahre Abzinsen`, r`Positive wie beim Aufzinsen`, r`Immer 0`, r`Brüche`], e: r`Teilen durch $r^k$.` },
      { l: 1, q: r`Was bedeutet $\sum_{k=0}^{2}r^k$ ausgeschrieben?`, a: [r`$1+r+r^2$`, r`$r+r^2$`, r`$r^0\cdot r^1\cdot r^2$`, r`$3\,r^2$`], e: r`$r^0=1$.` },
      { l: 1, q: r`Wie viele Summanden hat $\sum_{k=0}^{9}R\cdot r^k$?`, a: [r`$10$`, r`$9$`, r`$11$`, r`$45$`], e: r`Von 0 bis 9.` },
      { l: 1, q: r`Was für eine Summe ist $\sum_{k=0}^{n-1}r^k$?`, a: [r`Eine geometrische Reihe`, r`Eine arithmetische Reihe`, r`Eine konstante Summe`, r`Ein Produkt`], e: r`Jeder Summand ist das $r$-Fache des vorigen.` },
      { l: 1, q: r`Wie lautet die Summenformel für $\sum_{k=0}^{n-1}r^k$?`, a: [r`$\frac{r^n-1}{r-1}$`, r`$\frac{r^n}{r-1}$`, r`$n\cdot r$`, r`$\frac{r^{n-1}}{r}$`], e: r`Die Formel der geometrischen Reihe.` },
      { l: 1, q: r`Eine Rate, die genau am Bewertungszeitpunkt bezahlt wird, hat den Exponenten 0.`, tf: true, e: r`Sie wird weder auf- noch abgezinst.` },
      { l: 1, q: r`Wie gross ist $1+r+r^2$ für $r=1.1$?`, a: [r`$3.31$`, r`$3.3$`, r`$3.21$`, r`$3$`], e: r`$1+1.1+1.21$.` },
      { l: 1, q: r`Was geben die Summationsgrenzen an?`, a: [r`Den kleinsten und den grössten Exponenten`, r`Die kleinste und die grösste Rate`, r`Den Zinssatz`, r`Den ersten und den letzten Betrag`], e: r`Sie hängen davon ab, wann die erste und die letzte Rate liegt.` },
      { l: 1, q: r`Drei Raten von je 100 CHF liegen bei $t=1$, 2 und 3. Wie gross ist ihr Wert bei $t=3$?`, a: [r`$100\cdot(1+r+r^2)$`, r`$100\cdot(r+r^2+r^3)$`, r`$300\cdot r^3$`, r`$100\cdot3\,r$`], e: r`Die letzte Rate wird gar nicht, die erste zweimal verzinst.` },
      { l: 1, q: r`Alle Raten eines Sparplans werden gleich oft verzinst.`, tf: false, e: r`Frühe Raten werden öfter verzinst als späte.` },

      { l: 2, q: r`Fünf Raten liegen bei $t=1$ bis $t=5$. Welche Summe gibt ihren Wert bei $t=5$?`, a: [r`$\sum_{k=0}^{4}R\cdot r^k$`, r`$\sum_{k=1}^{5}R\cdot r^k$`, r`$\sum_{k=0}^{5}R\cdot r^k$`, r`$\sum_{k=1}^{4}R\cdot r^k$`], e: r`Die Rate bei $t=5$ hat den Exponenten 0, die bei $t=1$ den Exponenten 4.` },
      { l: 2, q: r`Fünf Raten liegen bei $t=0$ bis $t=4$. Welche Summe gibt ihren Wert bei $t=5$?`, a: [r`$\sum_{k=1}^{5}R\cdot r^k$`, r`$\sum_{k=0}^{4}R\cdot r^k$`, r`$\sum_{k=0}^{5}R\cdot r^k$`, r`$\sum_{k=1}^{4}R\cdot r^k$`], e: r`Die letzte Rate wird einmal, die erste fünfmal verzinst.` },
      { l: 2, q: r`Fünf Raten liegen bei $t=1$ bis $t=5$. Welche Summe gibt ihren Barwert bei $t=0$?`, a: [r`$\sum_{k=1}^{5}R\cdot r^{-k}$`, r`$\sum_{k=0}^{4}R\cdot r^{-k}$`, r`$\sum_{k=1}^{5}R\cdot r^{k}$`, r`$\sum_{k=0}^{5}R\cdot r^{-k}$`], e: r`Die erste Rate wird einmal, die letzte fünfmal abgezinst.` },
      { l: 2, q: r`Die erste Rate wird ein Jahr früher bezahlt, sonst bleibt alles gleich. Was ändert sich in der Summe für den Endwert?`, a: [r`Die obere Grenze steigt um 1.`, r`Die untere Grenze steigt um 1.`, r`Beide Grenzen steigen um 1.`, r`Nichts.`], e: r`Die früheste Rate hat den grössten Exponenten, und der wächst um 1.` },
      { l: 2, q: r`Wie gross ist $\sum_{k=0}^{3}100\cdot1.1^k$?`, a: [r`$464.10$`, r`$440$`, r`$400$`, r`$510.51$`], e: r`$100\cdot(1+1.1+1.21+1.331)$.` },
      { l: 2, q: r`Was ergibt $\sum_{k=1}^{4}r^k$?`, a: [r`$r\cdot\frac{r^4-1}{r-1}$`, r`$\frac{r^4-1}{r-1}$`, r`$\frac{r^5-1}{r-1}$`, r`$4\,r^4$`], e: r`$r$ ausklammern: $r\cdot(1+r+r^2+r^3)$.` },
      { l: 2, q: r`Es gilt $\sum_{k=1}^{n}r^k=r\cdot\sum_{k=0}^{n-1}r^k$.`, tf: true, e: r`Jeder Summand ist einmal mehr verzinst.` },
      { l: 2, q: r`Raten liegen bei $t=3$ bis $t=7$, bewertet wird bei $t=10$. Welche Grenzen hat die Summe $\sum R\cdot r^k$?`, a: [r`Von $k=3$ bis $k=7$`, r`Von $k=0$ bis $k=4$`, r`Von $k=3$ bis $k=10$`, r`Von $k=7$ bis $k=10$`], e: r`Die Rate bei $t=7$ wird 3-mal, die bei $t=3$ wird 7-mal verzinst.` },
      { l: 2, q: r`Wie viele Raten umfasst $\sum_{k=3}^{7}R\cdot r^k$?`, a: [r`$5$`, r`$4$`, r`$7$`, r`$10$`], e: r`$7-3+1$.` },
      { l: 2, q: r`Was darf man mit der Rate $R$ in $\sum R\cdot r^k$ tun?`, a: [r`Man darf sie vor das Summenzeichen ziehen.`, r`Man darf sie weglassen.`, r`Man muss sie potenzieren.`, r`Man darf sie zur oberen Grenze addieren.`], e: r`Sie ist in jedem Summanden derselbe Faktor.` },

      { l: 3, q: r`Was ergibt $\sum_{k=3}^{7}r^k$?`, a: [r`$r^3\cdot\frac{r^5-1}{r-1}$`, r`$\frac{r^7-1}{r-1}$`, r`$r^3\cdot\frac{r^7-1}{r-1}$`, r`$\frac{r^5-1}{r-1}$`], e: r`$r^3$ ausklammern; es bleiben 5 Summanden von $r^0$ bis $r^4$.` },
      { l: 3, q: r`Zehn Raten von 1000 CHF werden jeweils am Jahresende bezahlt; der Zins beträgt 5 %. Wie gross ist der Wert nach der letzten Rate?`, a: [r`Etwa 12 578 CHF`, r`10 500 CHF`, r`Etwa 13 207 CHF`, r`Etwa 16 289 CHF`], e: r`$1000\cdot\frac{1.05^{10}-1}{0.05}$.` },
      { l: 3, q: r`Der Barwert einer Reihe von Raten ist ihr Endwert nach $n$ Jahren, geteilt durch $r^n$.`, tf: true, e: r`Die ganze Summe wird um $n$ Jahre abgezinst.` },
      { l: 3, q: r`Was ergibt $\sum_{k=1}^{n}r^{-k}$?`, a: [r`$\frac{1-r^{-n}}{r-1}$`, r`$\frac{r^n-1}{r-1}$`, r`$\frac{1-r^{-n}}{r}$`, r`$\frac{r^{-n}}{r-1}$`], e: r`Der Endwertfaktor $\frac{r^n-1}{r-1}$, geteilt durch $r^n$.` },
      { l: 3, q: r`Zehn Raten liegen bei $t=1$ bis $t=10$, bewertet wird bei $t=4$. Welche Exponenten kommen vor?`, a: [r`Von $-6$ bis $3$`, r`Von $0$ bis $9$`, r`Von $-4$ bis $6$`, r`Von $1$ bis $10$`], e: r`Die Rate bei $t=1$ wird 3-mal aufgezinst, die bei $t=10$ wird 6-mal abgezinst.` },
      { l: 3, q: r`Eine Rente zahlt für immer 1000 CHF pro Jahr, erstmals in einem Jahr. Wie gross ist ihr Barwert bei 4 % Zins?`, a: [r`25 000 CHF`, r`Unendlich`, r`4000 CHF`, r`Etwa 26 000 CHF`], e: r`$\sum_{k=1}^{\infty}R\cdot r^{-k}=\frac{R}{r-1}=\frac{1000}{0.04}$. Dieses Kapital wirft genau 1000 CHF Zins ab.` },
      { l: 3, q: r`Zehn Raten von 1000 CHF werden jeweils am Jahresanfang bezahlt; der Zins beträgt 5 %. Wie gross ist der Wert am Ende des zehnten Jahres?`, a: [r`Etwa 13 207 CHF`, r`Etwa 12 578 CHF`, r`10 500 CHF`, r`Etwa 16 289 CHF`], e: r`Jede Rate wird einmal mehr verzinst: $12\,577.89\cdot1.05$.` },
      { l: 3, q: r`Ab wie vielen Summanden ist $\sum_{k=0}^{n-1}1.1^k$ grösser als 10?`, a: [r`Ab 8`, r`Ab 7`, r`Ab 10`, r`Ab 9`], e: r`$\frac{1.1^n-1}{0.1}>10$ verlangt $1.1^n>2$; $1.1^7\approx1.95$ und $1.1^8\approx2.14$.` }
    ],

    // ───────────────────────── Sparplan ─────────────────────────
    save: [
      { l: 1, q: r`Was ist ein Sparplan?`, a: [r`In jeder Periode wird dieselbe Rate einbezahlt.`, r`Ein einziger Betrag wird einmal einbezahlt.`, r`Ein Kredit wird in Raten zurückbezahlt.`, r`Die Rate verdoppelt sich jedes Jahr.`], e: r`Jede Rate wächst auf ihrem eigenen Konto bis zum Ende.` },
      { l: 1, q: r`Was wird beim Sparplan meistens gesucht?`, a: [r`Der Endwert oder die nötige Rate`, r`Der Barwert des Kredits`, r`Die Anzahl der Zinstage`, r`Der Tilgungsanteil`], e: r`Wie viel hat man am Schluss, oder wie viel muss man einzahlen?` },
      { l: 1, q: r`Was heisst «nachschüssig»?`, a: [r`Die Rate wird am Ende jeder Periode bezahlt.`, r`Die Rate wird am Anfang jeder Periode bezahlt.`, r`Die Rate wird nachträglich erhöht.`, r`Die Rate wird nur einmal bezahlt.`], e: r`Die erste Rate liegt bei $t=1$.` },
      { l: 1, q: r`Was heisst «vorschüssig»?`, a: [r`Die Rate wird am Anfang jeder Periode bezahlt.`, r`Die Rate wird am Ende jeder Periode bezahlt.`, r`Die Bank zahlt einen Vorschuss.`, r`Der Zins wird im Voraus abgezogen.`], e: r`Die erste Rate liegt bei $t=0$.` },
      { l: 1, q: r`Wie gross ist der Endwert von $n$ nachschüssigen Raten $R$?`, a: [r`$R\cdot\frac{r^n-1}{r-1}$`, r`$R\cdot r^n$`, r`$n\cdot R\cdot r$`, r`$R\cdot\frac{r^n}{r-1}$`], e: r`Die geometrische Reihe $R\cdot(1+r+\ldots+r^{n-1})$.` },
      { l: 1, q: r`Man zahlt zehnmal 100 CHF ein und erhält keinen Zins. Wie gross ist der Endwert?`, a: [r`1000 CHF`, r`100 CHF`, r`1100 CHF`, r`10 000 CHF`], e: r`Ohne Zins ist es einfach $n\cdot R$.` },
      { l: 1, q: r`Welcher Sparplan hat bei gleichen Raten den höheren Endwert?`, a: [r`Der vorschüssige`, r`Der nachschüssige`, r`Beide sind gleich.`, r`Das hängt von der Rate ab.`], e: r`Jede Rate liegt eine Periode länger am Zins.` },
      { l: 1, q: r`Bei positivem Zins ist der Endwert grösser als die Summe der Einzahlungen.`, tf: true, e: r`Der Unterschied sind die Zinsen.` },
      { l: 1, q: r`Was ist der Zinseszinseffekt?`, a: [r`Auch die gutgeschriebenen Zinsen werden wieder verzinst.`, r`Der Zinssatz steigt jedes Jahr.`, r`Die Zinsen werden doppelt ausbezahlt.`, r`Die Bank zahlt Zins nur auf die Zinsen.`], e: r`Darum wächst das Guthaben immer schneller.` },
      { l: 1, q: r`Zwei Raten von 1000 CHF werden nachschüssig bezahlt; der Zins beträgt 10 %. Wie gross ist der Endwert?`, a: [r`2100 CHF`, r`2000 CHF`, r`2310 CHF`, r`2200 CHF`], e: r`Die erste Rate wird einmal verzinst, die zweite nicht: $1100+1000$.` },
      { l: 1, q: r`Die Rate wird verdoppelt. Was geschieht mit dem Endwert?`, a: [r`Er verdoppelt sich.`, r`Er vervierfacht sich.`, r`Er bleibt gleich.`, r`Er steigt um den Zinsfaktor.`], e: r`Der Endwert ist proportional zur Rate.` },
      { l: 1, q: r`Die letzte nachschüssige Rate bringt bis zum Ende keinen Zins mehr.`, tf: true, e: r`Sie wird genau am Bewertungszeitpunkt einbezahlt.` },

      { l: 2, q: r`Drei Raten von 1000 CHF werden nachschüssig bezahlt; der Zins beträgt 10 %. Wie gross ist der Endwert?`, a: [r`3310 CHF`, r`3300 CHF`, r`3641 CHF`, r`3000 CHF`], e: r`$1210+1100+1000$.` },
      { l: 2, q: r`Drei Raten von 1000 CHF werden vorschüssig bezahlt; der Zins beträgt 10 %. Wie gross ist der Endwert nach drei Jahren?`, a: [r`3641 CHF`, r`3310 CHF`, r`3630 CHF`, r`3993 CHF`], e: r`$1331+1210+1100$.` },
      { l: 2, q: r`Wie hängen der vorschüssige und der nachschüssige Endwert zusammen?`, a: [r`Vorschüssig ist das $r$-Fache von nachschüssig.`, r`Vorschüssig ist um eine Rate grösser.`, r`Beide sind gleich.`, r`Vorschüssig ist das $r^n$-Fache.`], e: r`Jede Rate wird genau einmal mehr verzinst.` },
      { l: 2, q: r`Wie berechnet man die nachschüssige Rate für einen gewünschten Endwert $E$?`, a: [r`$R=E\cdot\frac{r-1}{r^n-1}$`, r`$R=\frac En$`, r`$R=E\cdot\frac{r^n-1}{r-1}$`, r`$R=\frac{E}{r^n}$`], e: r`Die Endwertformel, nach $R$ aufgelöst.` },
      { l: 2, q: r`Man zahlt zehn Jahre lang je 1000 CHF nachschüssig ein; der Zins beträgt 5 %. Wie gross ist der Endwert?`, a: [r`Etwa 12 578 CHF`, r`10 500 CHF`, r`Etwa 16 289 CHF`, r`Etwa 11 025 CHF`], e: r`$1000\cdot\frac{1.05^{10}-1}{0.05}$.` },
      { l: 2, q: r`Der Endwert eines Sparplans mit zehn Raten von 1000 CHF beträgt 12 578 CHF. Wie viel davon sind Zinsen?`, a: [r`2578 CHF`, r`12 578 CHF`, r`500 CHF`, r`1258 CHF`], e: r`Endwert minus Einzahlungen von 10 000 CHF.` },
      { l: 2, q: r`Bei positivem Zins bringt die doppelte Laufzeit mehr als den doppelten Endwert.`, tf: true, e: r`Die frühen Raten werden viel länger verzinst.` },
      { l: 2, q: r`In drei Jahren sollen 3310 CHF beisammen sein (nachschüssig, 10 %). Wie gross ist die Rate?`, a: [r`1000 CHF`, r`1103.33 CHF`, r`909.09 CHF`, r`1100 CHF`], e: r`$\frac{3310}{1+1.1+1.21}$.` },
      { l: 2, q: r`Womit rechnet man bei monatlichen Raten?`, a: [r`Mit dem konformen Monatszinssatz`, r`Mit dem Jahreszinssatz`, r`Ohne Zins`, r`Mit dem doppelten Jahreszinssatz`], e: r`Er ergibt über 12 Monate genau den Jahreszins.` },
      { l: 2, q: r`Der Zins steigt. Was geschieht mit der Rate, die für denselben Endwert nötig ist?`, a: [r`Sie wird kleiner.`, r`Sie wird grösser.`, r`Sie bleibt gleich.`, r`Sie verdoppelt sich.`], e: r`Die Zinsen tragen mehr zum Ziel bei.` },

      { l: 3, q: r`In 20 Jahren sollen 100 000 CHF beisammen sein (nachschüssig, 4 %). Wie gross ist die jährliche Rate?`, a: [r`Etwa 3358 CHF`, r`5000 CHF`, r`Etwa 4564 CHF`, r`Etwa 2282 CHF`], e: r`$100\,000\cdot\frac{0.04}{1.04^{20}-1}$.` },
      { l: 3, q: r`Man zahlt 30 Jahre lang je 1000 CHF nachschüssig ein; der Zins beträgt 5 %. Wie gross ist der Endwert?`, a: [r`Etwa 66 439 CHF`, r`Etwa 31 500 CHF`, r`Etwa 43 219 CHF`, r`Etwa 129 658 CHF`], e: r`$1000\cdot\frac{1.05^{30}-1}{0.05}$. Mehr als die Hälfte davon sind Zinsen.` },
      { l: 3, q: r`Wer bei 5 % Zins nur 20 statt 30 Jahre lang spart, erreicht immer noch etwa zwei Drittel des Endwerts.`, tf: false, e: r`Es ist nur etwa die Hälfte: 33 066 CHF statt 66 439 CHF. Die ersten Jahre zählen am meisten.` },
      { l: 3, q: r`Auf einem Konto liegen 5000 CHF. Dazu kommen drei nachschüssige Raten von 1000 CHF; der Zins beträgt 10 %. Wie gross ist der Stand nach drei Jahren?`, a: [r`9965 CHF`, r`8310 CHF`, r`9141 CHF`, r`10 648 CHF`], e: r`$5000\cdot1.1^3+3310$.` },
      { l: 3, q: r`Man zahlt jährlich 1000 CHF nachschüssig ein; der Zins beträgt 5 %. Nach wie vielen Jahren sind erstmals 20 000 CHF erreicht?`, a: [r`Nach 15 Jahren`, r`Nach 20 Jahren`, r`Nach 14 Jahren`, r`Nach 17 Jahren`], e: r`$\frac{1.05^n-1}{0.05}\ge20$ verlangt $1.05^n\ge2$, also $n\ge14.2$.` },
      { l: 3, q: r`Zwei nachschüssige Raten von 1000 CHF ergeben einen Endwert von 2050 CHF. Wie hoch war der Zins?`, a: [r`5 %`, r`2.5 %`, r`10 %`, r`50 %`], e: r`$1000\cdot r+1000=2050$.` },
      { l: 3, q: r`Fünf Raten von 1000 CHF werden vorschüssig bezahlt; der Zins beträgt 3 %. Wie gross ist der Endwert nach fünf Jahren?`, a: [r`Etwa 5468 CHF`, r`Etwa 5309 CHF`, r`5150 CHF`, r`Etwa 5796 CHF`], e: r`$1000\cdot1.03\cdot\frac{1.03^5-1}{0.03}$.` },
      { l: 3, q: r`Zehn nachschüssige Raten von 1000 CHF: Um wie viel steigt der Endwert, wenn der Zins 4 % statt 2 % beträgt?`, a: [r`Um etwa 10 %`, r`Um 100 %`, r`Um etwa 2 %`, r`Um etwa 22 %`], e: r`Von etwa 10 950 CHF auf etwa 12 006 CHF. Der doppelte Zins bringt nicht den doppelten Endwert.` }
    ],

    // ───────────────────────── Kredit und Tilgungsplan ─────────────────────────
    loan: [
      { l: 1, q: r`Was ist eine Annuität?`, a: [r`Eine gleichbleibende Rate aus Zins und Tilgung`, r`Der Zins des ersten Jahres`, r`Die Restschuld am Ende`, r`Eine einmalige Rückzahlung`], e: r`Jedes Jahr wird derselbe Betrag bezahlt.` },
      { l: 1, q: r`Woraus besteht jede Rate eines Annuitätenkredits?`, a: [r`Aus einem Zinsanteil und einem Tilgungsanteil`, r`Nur aus Zins`, r`Nur aus Tilgung`, r`Aus Zins und Gebühren`], e: r`Der Zins geht an die Bank, die Tilgung verringert die Schuld.` },
      { l: 1, q: r`Worauf wird der Zinsanteil einer Rate berechnet?`, a: [r`Auf die aktuelle Restschuld`, r`Auf den ursprünglichen Kredit`, r`Auf die Rate`, r`Auf die bisher bezahlten Zinsen`], e: r`Je kleiner die Schuld, desto kleiner der Zins.` },
      { l: 1, q: r`Was ist die Tilgung?`, a: [r`Der Teil der Rate, der die Schuld verringert.`, r`Der Zins des laufenden Jahres.`, r`Die ganze Rate.`, r`Eine Gebühr der Bank.`], e: r`Rate minus Zins.` },
      { l: 1, q: r`Wie verändern sich Zins- und Tilgungsanteil im Lauf der Jahre?`, a: [r`Der Zinsanteil sinkt, der Tilgungsanteil steigt.`, r`Der Zinsanteil steigt, der Tilgungsanteil sinkt.`, r`Beide bleiben gleich.`, r`Beide sinken.`], e: r`Die Restschuld wird kleiner, die Rate bleibt gleich.` },
      { l: 1, q: r`Was gilt für den Barwert aller Raten eines Kredits?`, a: [r`Er ist gleich dem Kreditbetrag.`, r`Er ist grösser als der Kreditbetrag.`, r`Er ist 0.`, r`Er ist gleich der Summe der Raten.`], e: r`Kredit heute und Raten später sind gleich viel wert.` },
      { l: 1, q: r`Ein Kredit beträgt 10 000 CHF, der Zins 5 %. Wie gross ist der Zins im ersten Jahr?`, a: [r`500 CHF`, r`50 CHF`, r`5000 CHF`, r`105 CHF`], e: r`5 % von 10 000 CHF.` },
      { l: 1, q: r`Bei einem Annuitätenkredit ist die Rate jedes Jahr gleich hoch.`, tf: true, e: r`Nur ihre Aufteilung in Zins und Tilgung ändert sich.` },
      { l: 1, q: r`Die Rate beträgt 2000 CHF, der Zinsanteil 500 CHF. Wie gross ist die Tilgung?`, a: [r`1500 CHF`, r`2500 CHF`, r`500 CHF`, r`2000 CHF`], e: r`$2000-500$.` },
      { l: 1, q: r`Ein Kredit von 10 000 CHF wird im ersten Jahr um 1500 CHF getilgt. Wie gross ist die Restschuld?`, a: [r`8500 CHF`, r`8000 CHF`, r`9500 CHF`, r`11 500 CHF`], e: r`$10\,000-1500$.` },
      { l: 1, q: r`Was zeigt ein Tilgungsplan?`, a: [r`Für jedes Jahr die Restschuld, den Zins, die Tilgung und die Rate`, r`Nur die Summe aller Raten`, r`Den Zinssatz der Bank`, r`Die Zinstage im Kalender`], e: r`So sieht man, wie die Schuld Jahr für Jahr abnimmt.` },
      { l: 1, q: r`Bei einem Annuitätenkredit sinkt die Restschuld jedes Jahr um denselben Betrag.`, tf: false, e: r`Die Tilgung wächst von Jahr zu Jahr; die Schuld sinkt immer schneller.` },

      { l: 2, q: r`Ein Kredit von 10 000 CHF (5 %) wird mit jährlich 2000 CHF bedient. Wie gross ist der Zins im zweiten Jahr?`, a: [r`425 CHF`, r`500 CHF`, r`400 CHF`, r`475 CHF`], e: r`5 % der Restschuld von 8500 CHF.` },
      { l: 2, q: r`Im selben Kredit: Wie gross ist die Tilgung im zweiten Jahr?`, a: [r`1575 CHF`, r`1500 CHF`, r`1600 CHF`, r`1425 CHF`], e: r`$2000-425$.` },
      { l: 2, q: r`Wie wächst die Tilgung von Jahr zu Jahr?`, a: [r`Mit dem Zinsfaktor $r$`, r`Um einen festen Betrag`, r`Gar nicht`, r`Sie verdoppelt sich.`], e: r`Im Beispiel: $1500\cdot1.05=1575$. Der eingesparte Zins kommt zur Tilgung dazu.` },
      { l: 2, q: r`Wie berechnet man die nachschüssige Annuität für einen Kredit $K$ über $n$ Jahre?`, a: [r`$R=K\cdot\frac{r^n\,(r-1)}{r^n-1}$`, r`$R=\frac Kn$`, r`$R=K\cdot\frac{r^n-1}{r-1}$`, r`$R=K\cdot r^n$`], e: r`Der Barwert der $n$ Raten muss $K$ sein.` },
      { l: 2, q: r`Ein Kredit von 1000 CHF (10 %) wird mit zwei gleichen nachschüssigen Raten zurückbezahlt. Wie gross ist die Rate?`, a: [r`Etwa 576.19 CHF`, r`550 CHF`, r`605 CHF`, r`500 CHF`], e: r`$1000\cdot\frac{1.21\cdot0.1}{0.21}$.` },
      { l: 2, q: r`Bei einem Kredit von 10 000 CHF (5 %) bezahlt man jedes Jahr nur 500 CHF. Was geschieht mit der Schuld?`, a: [r`Sie bleibt für immer bei 10 000 CHF.`, r`Sie ist nach 20 Jahren getilgt.`, r`Sie wächst.`, r`Sie sinkt langsam.`], e: r`Die Rate deckt genau den Zins; für die Tilgung bleibt nichts.` },
      { l: 2, q: r`Die Summe aller Raten ist grösser als der Kreditbetrag.`, tf: true, e: r`Der Unterschied ist der gesamte Zins.` },
      { l: 2, q: r`Ein Kredit von 1000 CHF wird mit zwei Raten von 576.19 CHF zurückbezahlt. Wie viel Zins bezahlt man insgesamt?`, a: [r`152.38 CHF`, r`200 CHF`, r`100 CHF`, r`76.19 CHF`], e: r`$2\cdot576.19-1000$.` },
      { l: 2, q: r`Was bewirkt eine längere Laufzeit beim selben Kredit?`, a: [r`Eine kleinere Rate, aber insgesamt mehr Zins`, r`Eine kleinere Rate und weniger Zins`, r`Eine grössere Rate`, r`Nichts`], e: r`Die Schuld bleibt länger bestehen und wird länger verzinst.` },
      { l: 2, q: r`Die Rate ist kleiner als der Jahreszins. Was geschieht mit der Schuld?`, a: [r`Sie wächst.`, r`Sie sinkt.`, r`Sie bleibt gleich.`, r`Sie ist sofort getilgt.`], e: r`Der unbezahlte Zins wird zur Schuld geschlagen.` },

      { l: 3, q: r`Ein Kredit von 100 000 CHF (5 %) wird in 10 Jahren mit gleichen nachschüssigen Raten zurückbezahlt. Wie gross ist die Rate?`, a: [r`Etwa 12 950 CHF`, r`10 500 CHF`, r`15 000 CHF`, r`Etwa 16 289 CHF`], e: r`$100\,000\cdot\frac{0.05}{1-1.05^{-10}}$.` },
      { l: 3, q: r`Wie viel Zins bezahlt man bei diesem Kredit insgesamt?`, a: [r`Etwa 29 500 CHF`, r`50 000 CHF`, r`Etwa 62 900 CHF`, r`5000 CHF`], e: r`$10\cdot12\,950.46-100\,000$. Viel weniger als $10\cdot5000$, weil die Schuld laufend sinkt.` },
      { l: 3, q: r`Nach der halben Laufzeit ist bei einem Annuitätenkredit die Hälfte der Schuld getilgt.`, tf: false, e: r`Am Anfang ist der Zinsanteil gross und die Tilgung klein; es ist weniger als die Hälfte getilgt.` },
      { l: 3, q: r`Wie gross ist bei diesem Kredit (100 000 CHF, 5 %, 10 Jahre) die Restschuld nach 5 Jahren?`, a: [r`Etwa 56 070 CHF`, r`50 000 CHF`, r`Etwa 43 930 CHF`, r`Etwa 64 750 CHF`], e: r`Barwert der fünf restlichen Raten: $12\,950.46\cdot\frac{1-1.05^{-5}}{0.05}$.` },
      { l: 3, q: r`Ein Kredit von 10 000 CHF (5 %) wird mit jährlich 2000 CHF bedient. In welchem Jahr ist er getilgt?`, a: [r`Im 6. Jahr (mit einer kleineren Schlussrate)`, r`Im 5. Jahr`, r`Im 7. Jahr`, r`Im 10. Jahr`], e: r`$n=\frac{-\ln\left(1-\frac{500}{2000}\right)}{\ln1.05}\approx5.9$.` },
      { l: 3, q: r`Welchen Kredit kann man bei 4 % Zins mit fünf nachschüssigen Raten von 1000 CHF zurückbezahlen?`, a: [r`Etwa 4452 CHF`, r`5000 CHF`, r`Etwa 5416 CHF`, r`Etwa 4110 CHF`], e: r`Barwert der Raten: $1000\cdot\frac{1-1.04^{-5}}{0.04}$.` },
      { l: 3, q: r`Welchem Wert nähert sich die Annuität, wenn die Laufzeit immer länger wird?`, a: [r`Dem Jahreszins $K\cdot(r-1)$`, r`Null`, r`Dem Kreditbetrag $K$`, r`Sie wächst über alle Grenzen.`], e: r`Bei unendlicher Laufzeit wird nur noch der Zins bezahlt.` },
      { l: 3, q: r`Bei einem Annuitätenkredit über 10 Jahre steigt der Zinssatz von 2 % auf 4 %. Was geschieht mit der Rate?`, a: [r`Sie steigt um etwa 11 %.`, r`Sie verdoppelt sich.`, r`Sie steigt um 2 %.`, r`Sie steigt um etwa 50 %.`], e: r`Bei 100 000 CHF von etwa 11 133 CHF auf etwa 12 329 CHF. Der grösste Teil der Rate ist Tilgung.` }
    ],

    // ───────────────────────── Zeitwert und Zinseszins ─────────────────────────
    value: [
      { l: 1, q: r`Was heisst «Zinseszins»?`, a: [r`Die gutgeschriebenen Zinsen werden in den folgenden Jahren mitverzinst.`, r`Der Zins wird zweimal pro Jahr ausbezahlt.`, r`Der Zinssatz verdoppelt sich.`, r`Nur das Anfangskapital wird verzinst.`], e: r`Zins auf den Zins.` },
      { l: 1, q: r`Wie gross ist ein Kapital $K_0$ nach $n$ Jahren mit Zinseszins?`, a: [r`$K_n=K_0\cdot r^n$`, r`$K_n=K_0\cdot n\cdot r$`, r`$K_n=K_0+r^n$`, r`$K_n=K_0\cdot(1+n\cdot r)$`], e: r`Jedes Jahr mal den Zinsfaktor $r$.` },
      { l: 1, q: r`1000 CHF werden ein Jahr lang zu 2 % verzinst. Wie viel ist es danach?`, a: [r`1020 CHF`, r`1002 CHF`, r`1200 CHF`, r`1022 CHF`], e: r`$1000\cdot1.02$.` },
      { l: 1, q: r`1000 CHF werden drei Jahre lang zu 10 % verzinst. Wie viel ist es danach?`, a: [r`1331 CHF`, r`1300 CHF`, r`1210 CHF`, r`1030 CHF`], e: r`$1000\cdot1.1^3$.` },
      { l: 1, q: r`Wie berechnet man den Barwert eines Betrags $K_n$, der in $n$ Jahren fällig ist?`, a: [r`$K_0=\frac{K_n}{r^n}$`, r`$K_0=K_n\cdot r^n$`, r`$K_0=K_n-n\cdot r$`, r`$K_0=\frac{K_n}{n\cdot r}$`], e: r`Abzinsen ist die Umkehrung des Aufzinsens.` },
      { l: 1, q: r`Worin unterscheidet sich der einfache Zins vom Zinseszins?`, a: [r`Beim einfachen Zins wird immer nur das Anfangskapital verzinst.`, r`Beim einfachen Zins ist der Zinssatz kleiner.`, r`Beim einfachen Zins gibt es keinen Zins.`, r`Es gibt keinen Unterschied.`], e: r`Der einfache Zins wächst linear, der Zinseszins exponentiell.` },
      { l: 1, q: r`Was bedeutet «Geld hat einen Zeitwert»?`, a: [r`Ein Franken heute ist mehr wert als ein Franken in einem Jahr.`, r`Geld verliert nie an Wert.`, r`Ein Franken in einem Jahr ist mehr wert als ein Franken heute.`, r`Geld ist nur eine bestimmte Zeit lang gültig.`], e: r`Den Franken von heute kann man anlegen.` },
      { l: 1, q: r`Mit Zinseszins wächst ein Kapital exponentiell.`, tf: true, e: r`$K_0\cdot r^n$ hat $n$ im Exponenten.` },
      { l: 1, q: r`Welcher Zinsfaktor gehört zu 3.5 %?`, a: [r`$1.035$`, r`$1.35$`, r`$0.035$`, r`$3.5$`], e: r`$1+\frac{3.5}{100}$.` },
      { l: 1, q: r`Welcher Zinssatz gehört zum Zinsfaktor $r=1.08$?`, a: [r`8 %`, r`0.8 %`, r`108 %`, r`1.08 %`], e: r`$(r-1)\cdot100$.` },
      { l: 1, q: r`Eine Maschine verliert jedes Jahr 20 % ihres Werts. Mit welchem Faktor rechnet man?`, a: [r`$0.8$`, r`$0.2$`, r`$1.2$`, r`$-0.2$`], e: r`Es bleiben 80 % des Vorjahreswerts.` },
      { l: 1, q: r`Bei 10 % Zins hat man nach zwei Jahren genau 20 % mehr.`, tf: false, e: r`$1.1^2=1.21$: Es sind 21 %, weil der erste Zins mitverzinst wird.` },

      { l: 2, q: r`5000 CHF werden 10 Jahre lang zu 4 % verzinst. Wie viel ist es danach?`, a: [r`Etwa 7401 CHF`, r`7000 CHF`, r`Etwa 7200 CHF`, r`Etwa 10 800 CHF`], e: r`$5000\cdot1.04^{10}$.` },
      { l: 2, q: r`Wie gross ist bei 3 % Zins der Barwert von 10 000 CHF, die in 5 Jahren fällig werden?`, a: [r`Etwa 8626 CHF`, r`8500 CHF`, r`Etwa 11 593 CHF`, r`Etwa 9709 CHF`], e: r`$\frac{10\,000}{1.03^5}$.` },
      { l: 2, q: r`Aus 1000 CHF werden in zwei Jahren 1210 CHF. Wie hoch ist die jährliche Rendite?`, a: [r`10 %`, r`10.5 %`, r`21 %`, r`20 %`], e: r`$r=\sqrt{1.21}=1.1$.` },
      { l: 2, q: r`Nach etwa wie vielen Jahren verdoppelt sich ein Kapital bei 5 % Zins?`, a: [r`Nach etwa 14 Jahren`, r`Nach 20 Jahren`, r`Nach 10 Jahren`, r`Nach 40 Jahren`], e: r`$\frac{\ln2}{\ln1.05}\approx14.2$.` },
      { l: 2, q: r`Die Faustregel sagt: Verdopplungszeit $\approx\frac{72}{p}$. Was ergibt sie für 6 %?`, a: [r`12 Jahre`, r`6 Jahre`, r`72 Jahre`, r`16.7 Jahre`], e: r`$\frac{72}{6}$; genau wären es 11.9 Jahre.` },
      { l: 2, q: r`Eine Maschine für 20 000 CHF verliert jedes Jahr 20 % ihres Werts. Wie viel ist sie nach 3 Jahren wert?`, a: [r`10 240 CHF`, r`8000 CHF`, r`12 800 CHF`, r`4000 CHF`], e: r`$20\,000\cdot0.8^3$.` },
      { l: 2, q: r`Die Verdopplungszeit hängt nicht vom Anfangskapital ab.`, tf: true, e: r`$r^n=2$ enthält $K_0$ nicht.` },
      { l: 2, q: r`Wie berechnet man die Laufzeit $n$ aus $K_0$, $K_n$ und $r$?`, a: [r`$n=\frac{\ln\left(K_n/K_0\right)}{\ln r}$`, r`$n=\frac{K_n}{K_0\cdot r}$`, r`$n=\frac{K_n-K_0}{r}$`, r`$n=\sqrt[r]{K_n/K_0}$`], e: r`$r^n=\frac{K_n}{K_0}$ logarithmieren.` },
      { l: 2, q: r`1000 CHF werden 10 Jahre lang zu 5 % angelegt. Wie viel mehr bringt der Zinseszins gegenüber dem einfachen Zins?`, a: [r`Etwa 129 CHF`, r`Nichts`, r`Etwa 500 CHF`, r`Etwa 29 CHF`], e: r`$1000\cdot1.05^{10}\approx1628.89$ gegenüber $1000+10\cdot50=1500$.` },
      { l: 2, q: r`Wie berechnet man den Zinsfaktor aus $K_0$, $K_n$ und $n$?`, a: [r`$r=\sqrt[n]{\frac{K_n}{K_0}}$`, r`$r=\frac{K_n}{n\cdot K_0}$`, r`$r=\frac{K_n-K_0}{n}$`, r`$r=\left(\frac{K_n}{K_0}\right)^n$`], e: r`$r^n=\frac{K_n}{K_0}$, dann die $n$-te Wurzel.` },

      { l: 3, q: r`Ein Kapital verdoppelt sich in 10 Jahren. Wie hoch ist die jährliche Rendite?`, a: [r`Etwa 7.2 %`, r`10 %`, r`Etwa 5 %`, r`20 %`], e: r`$r=2^{\frac{1}{10}}\approx1.0718$.` },
      { l: 3, q: r`Eine Maschine verliert jedes Jahr 20 % ihres Werts. Nach wie vielen Jahren ist sie erstmals weniger als 10 % des Neupreises wert?`, a: [r`Nach 11 Jahren`, r`Nach 5 Jahren`, r`Nach 9 Jahren`, r`Nach 10 Jahren`], e: r`$0.8^{10}\approx0.107$ und $0.8^{11}\approx0.086$.` },
      { l: 3, q: r`Steigt ein Wert zuerst um 50 % und fällt dann um 50 %, so ist er wieder gleich gross wie am Anfang.`, tf: false, e: r`$1.5\cdot0.5=0.75$: Es bleiben 75 %.` },
      { l: 3, q: r`Der Zins beträgt 5 %, die Teuerung 2 %. Um wie viel wächst die Kaufkraft pro Jahr?`, a: [r`Um etwa 2.94 %`, r`Um 3 %`, r`Um 7 %`, r`Um 2.5 %`], e: r`$\frac{1.05}{1.02}-1$. Die Faktoren werden geteilt, nicht die Prozente abgezogen.` },
      { l: 3, q: r`Nach etwa wie vielen Jahren hat sich ein Kapital bei 4 % Zins verdreifacht?`, a: [r`Nach 28 Jahren`, r`Nach 50 Jahren`, r`Nach 18 Jahren`, r`Nach 75 Jahren`], e: r`$\frac{\ln3}{\ln1.04}\approx28.0$.` },
      { l: 3, q: r`Ein Kapital wächst in 5 Jahren um insgesamt 30 %. Wie hoch ist die jährliche Rendite?`, a: [r`Etwa 5.4 %`, r`6 %`, r`Etwa 4.6 %`, r`30 %`], e: r`$1.3^{\frac15}\approx1.0539$. Weniger als $\frac{30}{5}$, weil der Zinseszins mithilft.` },
      { l: 3, q: r`1000 CHF werden 10 Jahre lang zu 5 % angelegt. Welchem Wert nähert sich das Endkapital, wenn der Zins immer häufiger (anteilig) gutgeschrieben wird?`, a: [r`Etwa 1648.72 CHF`, r`Etwa 1628.89 CHF`, r`2000 CHF`, r`Es wächst über alle Grenzen.`], e: r`Stetige Verzinsung: $1000\cdot e^{0.05\cdot10}$.` },
      { l: 3, q: r`Was bringt mehr: 10 Jahre zu 6 % oder 20 Jahre zu 3 %?`, a: [r`20 Jahre zu 3 % (Faktor etwa 1.806 gegenüber 1.791)`, r`10 Jahre zu 6 %`, r`Beides bringt genau gleich viel.`, r`Das hängt vom Anfangskapital ab.`], e: r`$1.03^2=1.0609$ ist etwas mehr als 1.06.` }
    ],

    // ───────────────────────── Marchzins (Kalender) ─────────────────────────
    march: [
      { l: 1, q: r`Was ist der Marchzins?`, a: [r`Der Zins für einen Teil des Jahres`, r`Der Zins im Monat März`, r`Der Zins für mehrere Jahre`, r`Eine Gebühr der Bank`], e: r`Er wird nach Zinstagen berechnet.` },
      { l: 1, q: r`Wie zählt die Schweizer Usanz die Tage?`, a: [r`Jeder Monat hat 30 Tage, das Jahr 360 Tage.`, r`Jeder Monat hat seine wirklichen Tage, das Jahr 365 Tage.`, r`Jeder Monat hat 31 Tage, das Jahr 372 Tage.`, r`Jeder Monat hat 28 Tage, das Jahr 336 Tage.`], e: r`Das vereinfacht die Rechnung von Hand.` },
      { l: 1, q: r`Wie berechnet man den Marchzins für $t$ Zinstage?`, a: [r`$Z=\frac{K\cdot p\cdot t}{100\cdot360}$`, r`$Z=\frac{K\cdot p\cdot t}{100}$`, r`$Z=\frac{K\cdot p}{t\cdot360}$`, r`$Z=K\cdot r^t$`], e: r`Jahreszins mal Anteil des Jahres $\frac{t}{360}$.` },
      { l: 1, q: r`Welche Tage zählen bei der Verzinsung?`, a: [r`Der Bringtag zählt nicht, der Holtag zählt.`, r`Beide Tage zählen.`, r`Keiner der beiden Tage zählt.`, r`Der Bringtag zählt, der Holtag nicht.`], e: r`Das Geld arbeitet ab dem Tag nach der Einzahlung.` },
      { l: 1, q: r`Wie viele Zinstage hat ein ganzes Jahr?`, a: [r`$360$`, r`$365$`, r`$366$`, r`$350$`], e: r`12 Monate zu je 30 Tagen.` },
      { l: 1, q: r`Wie viel Zins bringen 10 000 CHF bei 2 % in einem halben Jahr?`, a: [r`100 CHF`, r`200 CHF`, r`50 CHF`, r`1000 CHF`], e: r`Die Hälfte des Jahreszinses von 200 CHF.` },
      { l: 1, q: r`Wie viele Zinstage sind es vom 1. März bis zum 1. April?`, a: [r`$30$`, r`$31$`, r`$29$`, r`$32$`], e: r`Genau ein Monat.` },
      { l: 1, q: r`Der Februar zählt mit 28 Zinstagen.`, tf: false, e: r`Auch der Februar zählt mit 30 Tagen.` },
      { l: 1, q: r`Wie viel Zins bringen 12 000 CHF bei 3 % in einem Monat?`, a: [r`30 CHF`, r`360 CHF`, r`36 CHF`, r`3 CHF`], e: r`Ein Zwölftel des Jahreszinses von 360 CHF.` },
      { l: 1, q: r`Wie viele Zinstage sind es vom 15. Januar bis zum 15. April?`, a: [r`$90$`, r`$91$`, r`$89$`, r`$105$`], e: r`Drei Monate zu je 30 Tagen.` },
      { l: 1, q: r`Wie viel Zins bringen 3600 CHF bei 5 % in 90 Tagen?`, a: [r`45 CHF`, r`180 CHF`, r`15 CHF`, r`90 CHF`], e: r`Ein Viertel des Jahreszinses von 180 CHF.` },
      { l: 1, q: r`Der 31. eines Monats wird wie der 30. behandelt.`, tf: true, e: r`Jeder Monat hat in dieser Zählung nur 30 Tage.` },

      { l: 2, q: r`Wie viele Zinstage sind es vom 10. März bis zum 25. Juni?`, a: [r`$105$`, r`$107$`, r`$115$`, r`$95$`], e: r`Drei Monate (90 Tage) und 15 Tage.` },
      { l: 2, q: r`Wie viele Zinstage sind es vom 20. Mai bis zum 8. September?`, a: [r`$108$`, r`$111$`, r`$132$`, r`$120$`], e: r`Vier Monate (120 Tage) minus 12 Tage.` },
      { l: 2, q: r`Wie viele Zinstage sind es vom 31. Januar bis zum 28. Februar (kein Schaltjahr)?`, a: [r`$30$`, r`$28$`, r`$27$`, r`$29$`], e: r`Der 31. Januar gilt als 30., der letzte Februartag ebenfalls: genau ein Monat.` },
      { l: 2, q: r`Wie viel Zins bringen 8000 CHF bei 4.5 % in 108 Tagen?`, a: [r`108 CHF`, r`360 CHF`, r`97.20 CHF`, r`120 CHF`], e: r`$8000\cdot0.045\cdot\frac{108}{360}$.` },
      { l: 2, q: r`6000 CHF bringen in 120 Tagen 50 CHF Zins. Wie hoch ist der Zinssatz?`, a: [r`2.5 %`, r`0.83 %`, r`5 %`, r`7.5 %`], e: r`Auf ein Jahr gerechnet 150 CHF, also $\frac{150}{6000}$.` },
      { l: 2, q: r`9000 CHF bringen bei 4 % genau 60 CHF Zins. Wie viele Tage lag das Geld auf dem Konto?`, a: [r`60 Tage`, r`30 Tage`, r`90 Tage`, r`6 Tage`], e: r`Jahreszins 360 CHF, also 1 CHF pro Tag.` },
      { l: 2, q: r`Vom 30. Juni bis zum 31. Juli sind es 30 Zinstage.`, tf: true, e: r`Der 31. Juli gilt als 30.: genau ein Monat.` },
      { l: 2, q: r`Welches Kapital bringt bei 5 % in 72 Tagen 25 CHF Zins?`, a: [r`2500 CHF`, r`500 CHF`, r`3600 CHF`, r`1800 CHF`], e: r`$K=\frac{25\cdot360}{0.05\cdot72}$.` },
      { l: 2, q: r`Wie viele Zinstage sind es vom 1. Januar bis zum 31. Dezember?`, a: [r`$359$`, r`$360$`, r`$364$`, r`$365$`], e: r`Elf Monate und 29 Tage: Der Bringtag zählt nicht.` },
      { l: 2, q: r`Am 12. April werden 6000 CHF einbezahlt und am 12. Mai wieder abgehoben; der Zins beträgt 3 %. Wie viel Zins gibt es?`, a: [r`15 CHF`, r`15.50 CHF`, r`180 CHF`, r`14.50 CHF`], e: r`30 Tage: $6000\cdot0.03\cdot\frac{30}{360}$.` },

      { l: 3, q: r`Am 15. März werden 5000 CHF zu 3 % einbezahlt. Wie viel Zins gibt es bis zum 31. Dezember?`, a: [r`118.75 CHF`, r`150 CHF`, r`112.50 CHF`, r`120.83 CHF`], e: r`9 Monate und 15 Tage, also 285 Tage: $5000\cdot0.03\cdot\frac{285}{360}$.` },
      { l: 3, q: r`Am 31. März werden 4000 CHF einbezahlt, am 30. Juni weitere 2000 CHF; der Zins beträgt 2 %. Wie viel Zins gibt es bis zum 31. Dezember?`, a: [r`80 CHF`, r`120 CHF`, r`90 CHF`, r`60 CHF`], e: r`4000 CHF für 270 Tage (60 CHF) und 2000 CHF für 180 Tage (20 CHF).` },
      { l: 3, q: r`Vom 28. Februar bis zum 1. März (kein Schaltjahr) ist es ein Zinstag.`, tf: true, e: r`Der letzte Februartag gilt als 30.; von dort bis zum 1. März ist es ein Tag.` },
      { l: 3, q: r`Wie viele Zinstage sind es vom 27. Februar bis zum 1. März (kein Schaltjahr)?`, a: [r`$4$`, r`$2$`, r`$1$`, r`$3$`], e: r`Vom 27. bis zum 30. Februar sind es 3 Tage, dazu der 1. März.` },
      { l: 3, q: r`Eine Rechnung über 2400 CHF war am 10. April fällig und wird am 25. Mai bezahlt. Wie viel Verzugszins zu 5 % fällt an?`, a: [r`15 CHF`, r`120 CHF`, r`10 CHF`, r`18 CHF`], e: r`45 Tage: $2400\cdot0.05\cdot\frac{45}{360}$.` },
      { l: 3, q: r`Ein Konto (Zins 1.5 %) hat seit dem 31. Dezember des Vorjahres 10 000 CHF; am 30. Juni werden 4000 CHF abgehoben. Wie viel Zins gibt es für das ganze Jahr?`, a: [r`120 CHF`, r`150 CHF`, r`90 CHF`, r`105 CHF`], e: r`10 000 CHF für 180 Tage (75 CHF) und 6000 CHF für 180 Tage (45 CHF).` },
      { l: 3, q: r`Eine Rechnung erlaubt 2 % Skonto bei Zahlung nach 10 statt nach 30 Tagen. Welchem Jahreszins entspricht der Verzicht auf das Skonto etwa?`, a: [r`Etwa 37 %`, r`2 %`, r`Etwa 24 %`, r`Etwa 12 %`], e: r`Man zahlt 2 auf 98 für 20 Tage: $\frac{2}{98}\cdot\frac{360}{20}$.` },
      { l: 3, q: r`10 000 CHF bringen bei 4 % in 180 Tagen 200 CHF Marchzins. Mit dem konformen Halbjahreszins wären es nur 198.04 CHF. Warum?`, a: [r`Der Marchzins rechnet anteilig (linear), der konforme Zins mit Zinseszins.`, r`Weil 180 Tage kein halbes Jahr sind.`, r`Weil der Marchzins den Bringtag mitzählt.`, r`Wegen eines Rundungsfehlers.`], e: r`Zweimal 1.98 % mit Zinseszins ergibt genau 4 %; zweimal 2 % ergäbe 4.04 %.` }
    ],

    // ───────────────────────── Marchzins: Zeitstrahl und Konten ─────────────────────────
    mline: [
      { l: 1, q: r`Was sagt das Prinzip der verschiedenen Konti beim Marchzins?`, a: [r`Jede Ein- oder Auszahlung wird wie ein eigenes Konto behandelt und einzeln bis zum Stichtag verzinst.`, r`Jede Zahlung braucht ein Konto bei einer anderen Bank.`, r`Nur der Saldo am Jahresanfang wird verzinst.`, r`Alle Zahlungen werden so verzinst, als wären sie am Jahresanfang erfolgt.`], e: r`Am Schluss werden die Zinsen aller Konten addiert.` },
      { l: 1, q: r`Bis wann wird jedes dieser Konten verzinst?`, a: [r`Bis zum Stichtag`, r`Bis zur nächsten Zahlung`, r`Immer genau 360 Tage`, r`Bis zum Monatsende`], e: r`Der Stichtag ist der Tag, für den der Saldo gesucht ist, oft der 31. Dezember.` },
      { l: 1, q: r`Wie wird eine Auszahlung behandelt?`, a: [r`Als Konto mit negativem Betrag; ihr Zins wird abgezogen.`, r`Sie wird nicht berücksichtigt.`, r`Wie eine Einzahlung.`, r`Sie verringert nur den Zinssatz.`], e: r`Das abgehobene Geld trägt ab dann keinen Zins mehr.` },
      { l: 1, q: r`Wie erhält man den Saldo am Stichtag?`, a: [r`Summe aller Beträge plus Summe aller Zinsen`, r`Nur die Summe aller Zinsen`, r`Saldo am Jahresanfang mal Zinsfaktor`, r`Grösste Einzahlung plus Zins`], e: r`Kapital und Zinsen zusammen.` },
      { l: 1, q: r`Für wie viele Zinstage wird der Saldo vom Jahresanfang bis zum 31. Dezember verzinst?`, a: [r`$360$`, r`$365$`, r`$359$`, r`$180$`], e: r`Das ganze Jahr: 12 Monate zu je 30 Tagen.` },
      { l: 1, q: r`Am Jahresanfang liegen 10 000 CHF auf dem Konto; der Zins beträgt 2 %. Wie viel Zins bringt dieser Betrag bis zum 31. Dezember?`, a: [r`200 CHF`, r`20 CHF`, r`100 CHF`, r`2000 CHF`], e: r`2 % von 10 000 CHF für das ganze Jahr.` },
      { l: 1, q: r`Eine Einzahlung erfolgt am 30. Juni. Wie viele Zinstage hat sie bis zum 31. Dezember?`, a: [r`$180$`, r`$184$`, r`$150$`, r`$210$`], e: r`Sechs Monate zu je 30 Tagen.` },
      { l: 1, q: r`Eine Einzahlung im Dezember bringt bis zum Jahresende gleich viel Zins wie dieselbe Einzahlung im Januar.`, tf: false, e: r`Sie hat viel weniger Zinstage.` },
      { l: 1, q: r`Am 30. Juni werden 6000 CHF einbezahlt; der Zins beträgt 2 %. Wie viel Zins bringen sie bis zum 31. Dezember?`, a: [r`60 CHF`, r`120 CHF`, r`30 CHF`, r`600 CHF`], e: r`Der halbe Jahreszins von 120 CHF.` },
      { l: 1, q: r`Wie sind die Zahlungen auf dem Zeitstrahl eingetragen?`, a: [r`Einzahlungen oberhalb, Auszahlungen unterhalb der Achse`, r`Alle Zahlungen oberhalb der Achse`, r`Einzahlungen links, Auszahlungen rechts`, r`Nur die Einzahlungen`], e: r`So sieht man auf einen Blick, was dazukommt und was weggeht.` },
      { l: 1, q: r`Was geschieht mit einer Zahlung, die nach dem Stichtag liegt?`, a: [r`Sie zählt für diesen Abschluss nicht.`, r`Sie wird abgezinst.`, r`Sie wird doppelt verzinst.`, r`Sie verschiebt den Stichtag.`], e: r`Am Stichtag war sie noch gar nicht auf dem Konto.` },
      { l: 1, q: r`Beim Marchzins wächst der Zins eines Kontos Tag für Tag um denselben Betrag.`, tf: true, e: r`Der Zins ist proportional zur Anzahl der Zinstage (kein Zinseszins innerhalb des Jahres).` },

      { l: 2, q: r`Am Jahresanfang liegen 10 000 CHF auf dem Konto, am 30. Juni werden 4000 CHF abgehoben; der Zins beträgt 1.5 %. Wie viel Zins gibt es bis zum 31. Dezember?`, a: [r`120 CHF`, r`150 CHF`, r`90 CHF`, r`180 CHF`], e: r`150 CHF für die 10 000 CHF, minus 30 CHF für die 4000 CHF während 180 Tagen.` },
      { l: 2, q: r`Wie gross ist bei diesem Konto der Saldo am 31. Dezember mit Zins?`, a: [r`6120 CHF`, r`10 120 CHF`, r`6150 CHF`, r`6000 CHF`], e: r`Kapital $10\,000-4000$ und 120 CHF Zins.` },
      { l: 2, q: r`Am Jahresanfang liegen 8000 CHF auf dem Konto; am 31. März kommen 4000 CHF dazu, am 30. Juni weitere 2000 CHF. Der Zins beträgt 1.5 %. Wie viel Zins gibt es bis zum 31. Dezember?`, a: [r`180 CHF`, r`210 CHF`, r`165 CHF`, r`120 CHF`], e: r`$120+45+15$: 360, 270 und 180 Zinstage.` },
      { l: 2, q: r`Eine Einzahlung erfolgt am 15. März. Wie viele Zinstage hat sie bis zum 31. Dezember?`, a: [r`$285$`, r`$291$`, r`$270$`, r`$300$`], e: r`Neun Monate (270 Tage) und 15 Tage.` },
      { l: 2, q: r`Statt jede Zahlung einzeln zu verzinsen, kann man auch den jeweiligen Saldo von Zahlung zu Zahlung verzinsen. Was gilt für das Ergebnis?`, a: [r`Es ist dasselbe.`, r`Es ist immer grösser.`, r`Es ist immer kleiner.`, r`Es lässt sich nicht vergleichen.`], e: r`Beide Wege zählen für jeden Franken genau die Tage, die er auf dem Konto liegt.` },
      { l: 2, q: r`Der Zins einer Auszahlung wird zum Zins der Einzahlungen addiert.`, tf: false, e: r`Er wird abgezogen: Das Konto der Auszahlung hat einen negativen Betrag.` },
      { l: 2, q: r`Am 1. Oktober werden 3000 CHF einbezahlt; der Zins beträgt 1.5 %. Wie viel Zins bringen sie bis zum 31. Dezember?`, a: [r`11.13 CHF`, r`11.25 CHF`, r`45 CHF`, r`3.75 CHF`], e: r`89 Zinstage (der Bringtag zählt nicht): $3000\cdot0.015\cdot\frac{89}{360}$.` },
      { l: 2, q: r`Eine Einzahlung erfolgt genau am Stichtag. Wie wirkt sie sich aus?`, a: [r`Sie zählt zum Kapital, bringt aber keinen Zins.`, r`Sie zählt gar nicht.`, r`Sie bringt Zins für einen Tag.`, r`Sie bringt Zins für 30 Tage.`], e: r`0 Zinstage: Der Bringtag zählt nicht.` },
      { l: 2, q: r`Der Stichtag ist der 30. Juni. Am 10. Januar wurden 6000 CHF einbezahlt; der Zins beträgt 2.5 %. Wie viel Zins bringen sie?`, a: [r`70.83 CHF`, r`75 CHF`, r`150 CHF`, r`62.50 CHF`], e: r`170 Zinstage: $6000\cdot0.025\cdot\frac{170}{360}$.` },
      { l: 2, q: r`Was bringt bis zum 31. Dezember mehr Zins: 2000 CHF, einbezahlt am 31. März, oder 3000 CHF, einbezahlt am 30. Juni?`, a: [r`Beide bringen gleich viel.`, r`Die 2000 CHF vom 31. März`, r`Die 3000 CHF vom 30. Juni`, r`Das hängt vom Zinssatz ab.`], e: r`$2000\cdot270=3000\cdot180$: Betrag mal Zinstage ist gleich.` },

      { l: 3, q: r`Ein Lohnkonto (Zins 1 %) hat am Jahresanfang 2500 CHF. Am 25. Januar gehen 5200 CHF ein, am 10. Februar werden 3800 CHF bezogen. Wie viel Zins gibt es bis zum 31. Dezember?`, a: [r`39.61 CHF`, r`107.17 CHF`, r`39 CHF`, r`73.39 CHF`], e: r`$25.00+48.39-33.78$: 360, 335 und 320 Zinstage.` },
      { l: 3, q: r`Wer am 30. Juni 1000 CHF einzahlt und sie am 30. September wieder abhebt, erhält bis zum Jahresende gleich viel Zins wie für 1000 CHF während 90 Tagen.`, tf: true, e: r`Einzahlung 180 Tage, Auszahlung 90 Tage: $1000\cdot180-1000\cdot90=1000\cdot90$.` },
      { l: 3, q: r`Ein Konto ist am Jahresanfang leer; der Zins beträgt 2 %. Welche Einzahlung am 30. Juni ergibt am 31. Dezember einen Saldo von 5050 CHF?`, a: [r`5000 CHF`, r`4950 CHF`, r`4951 CHF`, r`5025 CHF`], e: r`Halbes Jahr, also 1 % Zins: $x\cdot1.01=5050$.` },
      { l: 3, q: r`Auf einem Konto liegen seit Jahresanfang 12 000 CHF (Zins 2 %). Am 30. September wird ein Betrag abgehoben, und der Jahreszins beträgt nur noch 220 CHF. Wie viel wurde abgehoben?`, a: [r`4000 CHF`, r`1000 CHF`, r`2000 CHF`, r`8000 CHF`], e: r`Es fehlen 20 CHF Zins für 90 Tage: $B\cdot0.02\cdot\frac{90}{360}=20$.` },
      { l: 3, q: r`Am Jahresanfang liegen 10 000 CHF auf dem Konto, am 30. Juni werden 4000 CHF abgehoben. Welchem gleichbleibenden Kapital über das ganze Jahr entspricht das beim Zins?`, a: [r`8000 CHF`, r`6000 CHF`, r`7000 CHF`, r`10 000 CHF`], e: r`Ein halbes Jahr 10 000 CHF, ein halbes Jahr 6000 CHF: im Durchschnitt 8000 CHF.` },
      { l: 3, q: r`Je 5000 CHF werden am 31. März und am 30. September einbezahlt; der Zins beträgt 2 %. Wie viel Zins gibt es bis zum 31. Dezember?`, a: [r`100 CHF`, r`200 CHF`, r`75 CHF`, r`150 CHF`], e: r`270 und 90 Zinstage ergeben zusammen 360: so viel wie 5000 CHF während eines ganzen Jahres.` },
      { l: 3, q: r`Der Stichtag ist der 30. Juni. Am Jahresanfang liegen 6000 CHF auf dem Konto, am 31. März werden 2000 CHF bezogen; der Zins beträgt 3 %. Wie gross ist der Saldo am Stichtag mit Zins?`, a: [r`4075 CHF`, r`4090 CHF`, r`4060 CHF`, r`4120 CHF`], e: r`Zins $90-15=75$ CHF (180 und 90 Zinstage), Kapital 4000 CHF.` },
      { l: 3, q: r`Am Jahresanfang liegen 1000 CHF auf dem Konto, am 30. Juni werden 3000 CHF bezogen; gerechnet wird durchgehend mit 2 %. Wie viel «Zins» ergibt die Rechnung bis zum 31. Dezember?`, a: [r`$-10$ CHF`, r`$+20$ CHF`, r`$-40$ CHF`, r`$0$ CHF`], e: r`$20-30$: Das Konto ist im zweiten Halbjahr überzogen. In Wirklichkeit gilt dann ein höherer Sollzins.` }
    ],

    // ───────────────────────── Konformer Zins ─────────────────────────
    conform: [
      { l: 1, q: r`Was ist der konforme Zinssatz?`, a: [r`Der unterjährige Zinssatz, der über das Jahr genau den Jahreszins ergibt.`, r`Der Jahreszins geteilt durch die Anzahl Perioden.`, r`Der Zinssatz der Nationalbank.`, r`Der Zinssatz ohne Zinseszins.`], e: r`«Konform» heisst: gleichwertig zum Jahreszins.` },
      { l: 1, q: r`Was ist der proportionale Zinssatz bei $m$ Perioden pro Jahr?`, a: [r`$\frac pm$`, r`$p\cdot m$`, r`$\sqrt[m]{p}$`, r`$p-m$`], e: r`Der Jahreszins wird einfach aufgeteilt.` },
      { l: 1, q: r`Wie berechnet man den konformen Zinssatz $i_k$ aus dem Jahreszins $i$?`, a: [r`$i_k=(1+i)^{\frac1m}-1$`, r`$i_k=\frac im$`, r`$i_k=(1+i)^m-1$`, r`$i_k=\frac{1+i}{m}$`], e: r`Die $m$-te Wurzel aus dem Jahreszinsfaktor.` },
      { l: 1, q: r`Der Jahreszins beträgt 12 %. Wie gross ist der proportionale Monatszins?`, a: [r`1 %`, r`0.95 %`, r`12 %`, r`1.2 %`], e: r`$\frac{12\,\%}{12}$.` },
      { l: 1, q: r`Welcher der beiden unterjährigen Zinssätze ist kleiner?`, a: [r`Der konforme`, r`Der proportionale`, r`Beide sind gleich.`, r`Das hängt vom Kapital ab.`], e: r`Der Zinseszins innerhalb des Jahres muss «eingespart» werden.` },
      { l: 1, q: r`Wie gross ist $m$ bei monatlicher Verzinsung?`, a: [r`$12$`, r`$4$`, r`$2$`, r`$360$`], e: r`12 Monate pro Jahr.` },
      { l: 1, q: r`Wie gross ist $m$ bei vierteljährlicher Verzinsung?`, a: [r`$4$`, r`$3$`, r`$12$`, r`$2$`], e: r`Vier Quartale pro Jahr.` },
      { l: 1, q: r`Was ist der effektive Jahreszins?`, a: [r`Der Zins, der über ein Jahr tatsächlich entsteht, Zinseszins innerhalb des Jahres eingerechnet.`, r`Der Zins ohne Gebühren.`, r`Der Zins des ersten Monats.`, r`Der Zins, den die Bank verspricht.`], e: r`Er macht Angebote mit verschiedenen Zinsperioden vergleichbar.` },
      { l: 1, q: r`Wird der proportionale Zins mehrmals pro Jahr gutgeschrieben, so ist der effektive Jahreszins höher als der genannte Jahreszins.`, tf: true, e: r`Die Gutschriften werden im selben Jahr schon mitverzinst.` },
      { l: 1, q: r`Zweimal pro Jahr werden 5 % gutgeschrieben. Wie hoch ist der effektive Jahreszins?`, a: [r`10.25 %`, r`10 %`, r`5 %`, r`25 %`], e: r`$1.05^2-1$.` },
      { l: 1, q: r`Der Jahreszins beträgt 21 %. Wie gross ist der konforme Halbjahreszins?`, a: [r`10 %`, r`10.5 %`, r`11 %`, r`4.58 %`], e: r`$\sqrt{1.21}-1$.` },
      { l: 1, q: r`Der konforme Monatszins mal 12 ergibt den Jahreszins.`, tf: false, e: r`Das gilt für den proportionalen Zins. Der konforme muss 12-mal aufgezinst werden.` },

      { l: 2, q: r`Der Jahreszins beträgt 12 %. Wie gross ist der konforme Monatszins?`, a: [r`Etwa 0.949 %`, r`1 %`, r`Etwa 1.057 %`, r`Etwa 0.5 %`], e: r`$1.12^{\frac{1}{12}}-1$.` },
      { l: 2, q: r`Jeden Monat wird 1 % Zins gutgeschrieben. Wie hoch ist der effektive Jahreszins?`, a: [r`Etwa 12.68 %`, r`12 %`, r`Etwa 11.39 %`, r`Etwa 13.2 %`], e: r`$1.01^{12}-1$.` },
      { l: 2, q: r`Der Jahreszins beträgt 8 %. Wie gross ist der konforme Quartalszins?`, a: [r`Etwa 1.943 %`, r`2 %`, r`Etwa 2.06 %`, r`Etwa 1.5 %`], e: r`$1.08^{\frac14}-1$.` },
      { l: 2, q: r`Jedes Quartal werden 2 % Zins gutgeschrieben. Wie hoch ist der effektive Jahreszins?`, a: [r`Etwa 8.24 %`, r`8 %`, r`Etwa 7.77 %`, r`Etwa 8.5 %`], e: r`$1.02^4-1$.` },
      { l: 2, q: r`Mit welchem Zins rechnet ein Sparplan mit Monatsraten, wenn ein Jahreszins gegeben ist?`, a: [r`Mit dem konformen Monatszins`, r`Mit dem Jahreszins`, r`Mit dem proportionalen Tageszins`, r`Ohne Zins`], e: r`So ergeben zwölf Monate genau den Jahreszins.` },
      { l: 2, q: r`Eine Kreditkarte verlangt 1.5 % Zins pro Monat. Wie hoch ist der effektive Jahreszins?`, a: [r`Etwa 19.6 %`, r`18 %`, r`15 %`, r`Etwa 16.1 %`], e: r`$1.015^{12}-1$.` },
      { l: 2, q: r`Je häufiger der proportionale Zins gutgeschrieben wird, desto höher ist der effektive Jahreszins.`, tf: true, e: r`Monatlich bringt mehr als vierteljährlich, vierteljährlich mehr als jährlich.` },
      { l: 2, q: r`Der Jahreszins beträgt 6 %. Wie gross ist der konforme Halbjahreszins?`, a: [r`Etwa 2.956 %`, r`3 %`, r`Etwa 3.045 %`, r`Etwa 2.5 %`], e: r`$\sqrt{1.06}-1$.` },
      { l: 2, q: r`1000 CHF werden ein Jahr lang monatlich mit dem konformen Zins zu 12 % Jahreszins verzinst. Wie viel ist es danach?`, a: [r`1120 CHF`, r`1126.83 CHF`, r`1113.87 CHF`, r`1012 CHF`], e: r`Der konforme Zins ergibt über das Jahr genau 12 %.` },
      { l: 2, q: r`1000 CHF werden ein Jahr lang monatlich mit 1 % (proportional zu 12 %) verzinst. Wie viel ist es danach?`, a: [r`Etwa 1126.83 CHF`, r`1120 CHF`, r`1012 CHF`, r`Etwa 1138.24 CHF`], e: r`$1000\cdot1.01^{12}$.` },

      { l: 3, q: r`Der Jahreszins beträgt 5 %. Wie gross ist der konforme Tageszins (360 Tage)?`, a: [r`Etwa 0.01355 %`, r`Etwa 0.01389 %`, r`Etwa 0.05 %`, r`Etwa 0.0014 %`], e: r`$1.05^{\frac{1}{360}}-1$; proportional wären es $\frac{5\,\%}{360}\approx0.01389\,\%$.` },
      { l: 3, q: r`Welchem effektiven Jahreszins nähert man sich bei 10 % Jahreszins, wenn die proportionale Gutschrift immer häufiger erfolgt?`, a: [r`Etwa 10.52 %`, r`10 %`, r`11 %`, r`Er wächst über alle Grenzen.`], e: r`$\left(1+\frac{0.1}{m}\right)^m\to e^{0.1}\approx1.1052$.` },
      { l: 3, q: r`Erfolgt die proportionale Gutschrift immer häufiger, so wächst der effektive Jahreszins über alle Grenzen.`, tf: false, e: r`Er nähert sich einem Grenzwert, der stetigen Verzinsung $e^{i}-1$.` },
      { l: 3, q: r`Ein Konto nennt 6 % Jahreszins mit monatlicher Gutschrift (0.5 % pro Monat). Wie hoch ist der effektive Jahreszins?`, a: [r`Etwa 6.17 %`, r`6 %`, r`Etwa 6.5 %`, r`Etwa 5.84 %`], e: r`$1.005^{12}-1$.` },
      { l: 3, q: r`Bei monatlicher Gutschrift soll der effektive Jahreszins 12.68 % betragen. Welcher Jahreszins wird genannt (proportional)?`, a: [r`12 %`, r`12.68 %`, r`Etwa 13.4 %`, r`Etwa 11.4 %`], e: r`$1.01^{12}\approx1.1268$: 1 % pro Monat, also $12\cdot1\,\%$.` },
      { l: 3, q: r`Welcher Zins für zwei Jahre ist konform zu 10 % pro Jahr?`, a: [r`21 %`, r`20 %`, r`Etwa 4.88 %`, r`22 %`], e: r`$1.1^2-1$. «Konform» geht auch für längere Perioden.` },
      { l: 3, q: r`Angebot A: 4 % Zins mit jährlicher Gutschrift. Angebot B: 3.95 % Jahreszins mit monatlicher (proportionaler) Gutschrift. Welches ist besser?`, a: [r`B, mit effektiv etwa 4.02 %`, r`A`, r`Beide sind gleich.`, r`B, mit effektiv etwa 4.74 %`], e: r`$\left(1+\frac{0.0395}{12}\right)^{12}-1$.` },
      { l: 3, q: r`10 000 CHF werden ein halbes Jahr lang zum konformen Zins angelegt; der Jahreszins beträgt 8 %. Wie viel ist es danach?`, a: [r`Etwa 10 392.30 CHF`, r`10 400 CHF`, r`10 800 CHF`, r`Etwa 10 384.60 CHF`], e: r`$10\,000\cdot\sqrt{1.08}$.` }
    ]
  };
})();
