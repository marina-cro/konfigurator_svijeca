// ===== AŽURIRANJE NAVIGACIJE OVISNO O TOME JE LI KORISNIK PRIJAVLJEN =====

function osvjeziNavigacijuAuth(user) {
    const el = document.getElementById("nav-auth");
    if (!el) return;

    if (user) {
        el.innerHTML =
            '<a href="profil.html">Moj profil</a> ' +
            '<button type="button" id="btn-odjava" class="btn-odjava">Odjava</button>';

        const btn = document.getElementById("btn-odjava");
        if (btn) {
            btn.addEventListener("click", () => {
                auth.signOut().then(() => {
                    window.location.href = "index.html";
                });
            });
        }
    } else {
        el.innerHTML = '<a href="login.html">Prijava</a>';
    }
}

if (typeof auth !== "undefined") {
    auth.onAuthStateChanged((user) => {
        osvjeziNavigacijuAuth(user);
    });
}


// ===== PRIJEVOD FIREBASE GREŠAKA NA HRVATSKI =====

function prevediGresku(err) {
    const kod = err && err.code ? err.code : "";
    switch (kod) {
        case "auth/email-already-in-use":
            return "Ovaj e-mail je već registriran.";
        case "auth/invalid-email":
            return "E-mail adresa nije ispravna.";
        case "auth/weak-password":
            return "Lozinka je preslaba (najmanje 6 znakova).";
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Pogrešan e-mail ili lozinka.";
        case "auth/too-many-requests":
            return "Previše pokušaja. Pokušajte kasnije.";
        default:
            return "Došlo je do greške. Pokušajte ponovno.";
    }
}


// ===== REGISTRACIJA I PRIJAVA (login.html) =====

const formRegistracija = document.getElementById("form-registracija");
const formPrijava = document.getElementById("form-prijava");

if (formRegistracija) {
    formRegistracija.addEventListener("submit", (e) => {
        e.preventDefault();

        const ime = document.getElementById("reg-ime").value.trim();
        const prezime = document.getElementById("reg-prezime").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const lozinka = document.getElementById("reg-lozinka").value;

        if (!ime || !prezime || !email || !lozinka) {
            prikaziObavijest("Molimo popunite sva polja.", "greska");
            return;
        }

        if (lozinka.length < 6) {
            prikaziObavijest("Lozinka mora imati najmanje 6 znakova.", "greska");
            return;
        }

        auth.createUserWithEmailAndPassword(email, lozinka)
            .then((cred) => {
                return db.collection("korisnici").doc(cred.user.uid).set({
                    ime: ime,
                    prezime: prezime,
                    email: email,
                    telefon: "",
                    adresa: "",
                    kreiran: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                prikaziObavijest("Uspješno ste se registrirali!");
                window.location.href = "profil.html";
            })
            .catch((err) => {
                prikaziObavijest(prevediGresku(err), "greska");
            });
    });
}

if (formPrijava) {
    formPrijava.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("prijava-email").value.trim();
        const lozinka = document.getElementById("prijava-lozinka").value;

        if (!email || !lozinka) {
            prikaziObavijest("Unesite e-mail i lozinku.", "greska");
            return;
        }

        auth.signInWithEmailAndPassword(email, lozinka)
            .then(() => {
                prikaziObavijest("Uspješna prijava!");
                window.location.href = "profil.html";
            })
            .catch((err) => {
                prikaziObavijest(prevediGresku(err), "greska");
            });
    });
}

// Prebacivanje između tabova "Prijava" / "Registracija"
const tabPrijava = document.getElementById("tab-prijava");
const tabRegistracija = document.getElementById("tab-registracija");

if (tabPrijava && tabRegistracija) {
    tabPrijava.addEventListener("click", () => {
        tabPrijava.classList.add("aktivan");
        tabRegistracija.classList.remove("aktivan");
        formPrijava.style.display = "flex";
        formRegistracija.style.display = "none";
    });

    tabRegistracija.addEventListener("click", () => {
        tabRegistracija.classList.add("aktivan");
        tabPrijava.classList.remove("aktivan");
        formRegistracija.style.display = "flex";
        formPrijava.style.display = "none";
    });
}

// Zaboravljena lozinka
const linkZaboravljenaLozinka = document.getElementById("zaboravljena-lozinka");
if (linkZaboravljenaLozinka) {
    linkZaboravljenaLozinka.addEventListener("click", (e) => {
        e.preventDefault();
        const email = document.getElementById("prijava-email").value.trim();
        if (!email) {
            prikaziObavijest("Prvo upišite svoj e-mail u polje iznad.", "greska");
            return;
        }
        auth.sendPasswordResetEmail(email)
            .then(() => {
                prikaziObavijest("Poslali smo vam e-mail za resetiranje lozinke.");
            })
            .catch((err) => {
                prikaziObavijest(prevediGresku(err), "greska");
            });
    });
}


// ===== PROFIL (profil.html) =====

const formProfil = document.getElementById("form-profil");

if (formProfil) {
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        const emailEl = document.getElementById("profil-email");
        if (emailEl) emailEl.textContent = user.email;

        db.collection("korisnici").doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                const podaci = doc.data();
                document.getElementById("profil-ime").value = podaci.ime || "";
                document.getElementById("profil-prezime").value = podaci.prezime || "";
                document.getElementById("profil-telefon").value = podaci.telefon || "";
                const emailInput = document.getElementById("profil-email-input");
                if (emailInput) emailInput.value = user.email || podaci.email || "";
            }
        });

        ucitajPovijestNarudzbi(user.uid);
    });

    formProfil.addEventListener("submit", (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        const novoIme = document.getElementById("profil-ime").value.trim();
        const novoPrezime = document.getElementById("profil-prezime").value.trim();
        const noviTelefon = document.getElementById("profil-telefon").value.trim();
        const noviEmail = document.getElementById("profil-email-input").value.trim();

        const podaci = {
            ime: novoIme,
            prezime: novoPrezime,
            telefon: noviTelefon,
            email: noviEmail
        };

        // Ako se e-mail promijenio, prvo pokušaj ažurirati auth e-mail.
        const azurirajAuthEmail = (noviEmail !== user.email)
            ? auth.currentUser.updateEmail(noviEmail).catch((err) => {
                // Ako treba nedavno prijavljivanje, obavijesti korisnika
                if (err && err.code === 'auth/requires-recent-login') {
                    throw new Error('Za promjenu e-maila potrebno je ponovno se prijaviti. Odjavite se i prijavite ponovo pa pokušajte ponovno.');
                }
                throw err;
            })
            : Promise.resolve();

        azurirajAuthEmail
            .then(() => db.collection("korisnici").doc(user.uid).set(podaci, { merge: true }))
            .then(() => {
                prikaziObavijest("Podaci su spremljeni!");
                // Ako je email promijenjen, ažuraj prikaz na stranici
                const emailEl = document.getElementById("profil-email");
                if (emailEl) emailEl.textContent = noviEmail;
            })
            .catch((err) => {
                const poruka = err && err.message ? err.message : 'Greška prilikom spremanja podataka.';
                prikaziObavijest(poruka, "greska");
            });
    });
}

// Odjava s profil stranice
const btnOdjavaProfil = document.getElementById("btn-odjava-profil");
if (btnOdjavaProfil) {
    btnOdjavaProfil.addEventListener("click", () => {
        auth.signOut().then(() => {
            window.location.href = "index.html";
        });
    });
}


// ===== POVIJEST / PRAĆENJE NARUDŽBI (profil.html) =====

function ucitajPovijestNarudzbi(uid) {
    const kontejner = document.getElementById("povijest-narudzbi");
    if (!kontejner) return;

    kontejner.innerHTML = "<p>Učitavanje narudžbi...</p>";

    // Dohvati narudžbe za korisnika bez Firestore `orderBy` kako bismo izbjegli
    // potrebu za složenim indeksom. Sortirati ćemo lokalno po datumu.
    db.collection("narudzbe")
        .where("userId", "==", uid)
        .get()
        .then((snapshot) => {
            console.log('ucitajPovijestNarudzbi: snapshot size=', snapshot.size);
            if (snapshot.empty) {
                kontejner.innerHTML = "<p>Još nemate narudžbi.</p>";
                return;
            }

            // Mapiraj dokumente u niz, uključujući datum za lokalno sortiranje
            const docs = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                docs.push({ id: doc.id, data: data });
            });

            // Sortiraj po svom polju `datum` silazno (novije prve)
            docs.sort((a, b) => {
                const da = a.data.datum && a.data.datum.toDate ? a.data.datum.toDate().getTime() : 0;
                const dbt = b.data.datum && b.data.datum.toDate ? b.data.datum.toDate().getTime() : 0;
                return dbt - da;
            });

            kontejner.innerHTML = "";

            docs.forEach((docObj) => {
                const n = docObj.data;
                const datum = (n.datum && n.datum.toDate)
                    ? n.datum.toDate().toLocaleDateString("hr-HR", { year: "numeric", month: "long", day: "numeric" })
                    : "";

                const stavkeHtml = (n.stavke || [])
                    .map((s) => "<li>" + escapeHtml(s.tip) + ": " + escapeHtml(s.naziv) + "</li>")
                    .join("");

                const el = document.createElement("article");
                el.className = "narudzba-item";
                el.innerHTML =
                    '<div class="narudzba-header">' +
                        '<span class="narudzba-datum">' + datum + '</span>' +
                        '<span class="narudzba-status narudzba-status--' + slugStatusa(n.status) + '">' + escapeHtml(n.status || "Zaprimljeno") + '</span>' +
                    '</div>' +
                    '<ul class="narudzba-stavke">' + stavkeHtml + '</ul>';
                kontejner.appendChild(el);
            });
        })
        .catch((err) => {
            console.error('Greška pri dohvaćanju narudžbi:', err);
            const poruka = err && err.message ? err.message : 'Greška prilikom dohvaćanja narudžbi. Pokušajte kasnije.';
            kontejner.innerHTML = "<p>Greška prilikom dohvaćanja narudžbi: " + escapeHtml(poruka) + "</p>";
        });
}

function slugStatusa(status) {
    const s = (status || "zaprimljeno").toLowerCase();
    if (s.includes("priprem")) return "priprema";
    if (s.includes("posl") || s.includes("dostav")) return "poslano";
    if (s.includes("zavr") || s.includes("gotov")) return "gotovo";
    return "zaprimljeno";
}

function escapeHtml(tekst) {
    const div = document.createElement("div");
    div.textContent = tekst || "";
    return div.innerHTML;
}
