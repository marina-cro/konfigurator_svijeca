// ===== VLASTITE OBAVIJESTI (TOAST) UMJESTO alert() =====

function osiguajKontejnerObavijesti() {
    let kontejner = document.getElementById("toast-kontejner");
    if (!kontejner) {
        kontejner = document.createElement("div");
        kontejner.id = "toast-kontejner";
        document.body.appendChild(kontejner);
    }
    return kontejner;
}

// tip: "uspjeh" (zeleno-ljubičasto, default) ili "greska" (crveno)
function prikaziObavijest(poruka, tip = "uspjeh", trajanje = 2500) {
    const kontejner = osiguajKontejnerObavijesti();

    const toast = document.createElement("div");
    toast.className = "toast" + (tip === "greska" ? " toast-greska" : "");
    toast.textContent = poruka;

    kontejner.appendChild(toast);

    // Pokreni animaciju ulaska
    requestAnimationFrame(() => toast.classList.add("toast-vidljiv"));

    // Ukloni obavijest nakon zadanog trajanja
    setTimeout(() => {
        toast.classList.remove("toast-vidljiv");
        toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    }, trajanje);
}


// ===== POMOĆNE FUNKCIJE KOŠARICE =====

function dohvatiKosaricu() {
    return JSON.parse(localStorage.getItem("kosarica")) || [];
}

function spremiKosaricu(kosarica) {
    localStorage.setItem("kosarica", JSON.stringify(kosarica));
    osvjeziBrojStavki();
    renderirajDropdown();
}

function dodajUKosaricu(stavka) {
    const kosarica = dohvatiKosaricu();
    kosarica.push(stavka);
    spremiKosaricu(kosarica);
}

// Osvježava broj na ikonici košarice na BILO KOJOJ stranici
function osvjeziBrojStavki() {
    const broj = dohvatiKosaricu().length;
    document.querySelectorAll(".cart-count").forEach((el) => {
        el.textContent = broj;
    });
}

osvjeziBrojStavki();


// ===== KONFIGURATOR (samo index.html) =====

const slikaBaze = document.getElementById("slika");

if (slikaBaze) {
    let odabranaBaza = {
        naziv: "Bijela baza",
        slika: "slike/torta_bijela.jpg"
    };

    document.querySelector(".bijeli").addEventListener("click", () => {
        slikaBaze.src = "slike/torta_bijela.jpg";
        odabranaBaza = { naziv: "Bijela baza", slika: "slike/torta_bijela.jpg" };
    });

    document.querySelector(".rozi").addEventListener("click", () => {
        slikaBaze.src = "slike/torta_roza.jpg";
        odabranaBaza = { naziv: "Roza baza", slika: "slike/torta_roza.jpg" };
    });

    document.querySelector(".ljubicasti").addEventListener("click", () => {
        slikaBaze.src = "slike/torta_ljubicasta.jpg";
        odabranaBaza = { naziv: "Ljubičasta baza", slika: "slike/torta_ljubicasta.jpg" };
    });


    // DODATCI (dropdown gumbi s izborom boje)
    const slikaDodatka = document.getElementById("dodatci");

    let odabraniDodatak = {
        naziv: "Macaroons (Ljubičasta)",
        slika: "slike/dodatak_macaroons2.png"
    };

    // Odabir boje iz dropdowna
    document.querySelectorAll(".dodatak-opcije button").forEach((opcija) => {
        opcija.addEventListener("click", () => {
            const slika = opcija.dataset.slika;
            const naziv = opcija.dataset.naziv;
            slikaDodatka.src = slika;
            odabraniDodatak = { naziv: naziv, slika: slika };

            const dd = opcija.closest(".dodatak-dropdown");
            if (dd) dd.classList.remove("open");
        });
    });

    // Otvaranje dropdowna klikom (hover je preko CSS-a), uz zatvaranje ostalih
    document.querySelectorAll(".dodatak-glavni").forEach((glavni) => {
        glavni.addEventListener("click", (e) => {
            e.stopPropagation();
            const dd = glavni.closest(".dodatak-dropdown");
            document.querySelectorAll(".dodatak-dropdown.open").forEach((o) => {
                if (o !== dd) o.classList.remove("open");
            });
            dd.classList.toggle("open");
        });
    });

    // Klik izvan zatvara sve dropdownove dodataka
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".dodatak-dropdown")) {
            document.querySelectorAll(".dodatak-dropdown.open").forEach((o) => o.classList.remove("open"));
        }
    });

    // Gumbi "Odaberi" za bazu i dodatak
    const gumbiOdaberi = document.querySelectorAll(".card > button");

    if (gumbiOdaberi[0]) {
        gumbiOdaberi[0].addEventListener("click", () => {
            dodajUKosaricu({ tip: "Baza", naziv: odabranaBaza.naziv, slika: odabranaBaza.slika });
            prikaziObavijest("Baza dodana u košaricu!");
        });
    }

    if (gumbiOdaberi[1]) {
        gumbiOdaberi[1].addEventListener("click", () => {
            dodajUKosaricu({ tip: "Dodatak", naziv: odabraniDodatak.naziv, slika: odabraniDodatak.slika });
            prikaziObavijest("Dodatak dodan u košaricu!");
        });
    }
}


// ===== CUSTOM TEKST (samo index.html) =====

const customTextInput = document.getElementById("customText");

if (customTextInput) {
    const customTextForm = customTextInput.closest("form");

    if (customTextForm) {
        customTextForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const tekst = customTextInput.value.trim();

            if (!tekst) {
                prikaziObavijest("Unesite tekst prije slanja.", "greska");
                return;
            }

            dodajUKosaricu({ tip: "Tekst na torti", naziv: tekst, slika: "" });
            prikaziObavijest("Tekst je dodan u košaricu!");
            customTextForm.reset();
        });
    }
}


// ===== GOTOVI PROIZVODI (proizvodi.html) =====

document.querySelectorAll(".card").forEach((card) => {
    if (card.querySelector(".gumbi-torta") || card.querySelector(".gumbi-dodatci")) return;

    const gumb = card.querySelector("button");
    if (!gumb) return;

    gumb.addEventListener("click", () => {
        const naslov = card.querySelector("h3");
        const slika = card.querySelector("img");

        dodajUKosaricu({
            tip: "Proizvod",
            naziv: naslov ? naslov.textContent.trim() : "Proizvod",
            slika: slika ? slika.getAttribute("src") : ""
        });

        prikaziObavijest("Proizvod dodan u košaricu!");
    });
});


// ===== DROPDOWN KOŠARICE (na svakoj stranici) =====

function renderirajDropdown() {
    const lista = document.getElementById("cart-dropdown-lista");
    if (!lista) return;

    const prazna = document.getElementById("cart-dropdown-prazna");
    const narudzba = document.getElementById("cart-narudzba");
    const kosarica = dohvatiKosaricu();

    lista.innerHTML = "";

    if (kosarica.length === 0) {
        if (prazna) prazna.style.display = "block";
        if (narudzba) narudzba.style.display = "none";
        return;
    }
    if (prazna) prazna.style.display = "none";
    if (narudzba) narudzba.style.display = "flex";

    kosarica.forEach((stavka, i) => {
        const red = document.createElement("div");
        red.className = "cart-dropdown-stavka";

        let img = null;
        if (stavka.slika) {
            img = document.createElement("img");
            img.src = stavka.slika;
            img.alt = stavka.naziv || "";
        }

        const info = document.createElement("div");
        info.className = "cart-dropdown-info";

        const tip = document.createElement("span");
        tip.className = "tip";
        tip.textContent = stavka.tip || "";

        const naziv = document.createElement("span");
        naziv.className = "naziv";
        naziv.textContent = stavka.naziv || "";

        info.appendChild(tip);
        info.appendChild(naziv);

        const ukloni = document.createElement("button");
        ukloni.className = "cart-dropdown-ukloni";
        ukloni.textContent = "✕";
        ukloni.title = "Ukloni";
        ukloni.addEventListener("click", (e) => {
            e.stopPropagation();
            const k = dohvatiKosaricu();
            k.splice(i, 1);
            spremiKosaricu(k);
        });

        if (img) red.appendChild(img);
        red.appendChild(info);
        red.appendChild(ukloni);
        lista.appendChild(red);
    });
}

// Otvaranje / zatvaranje dropdowna
const cartToggle = document.getElementById("cart-toggle");
const cartDropdown = document.getElementById("cart-dropdown");

if (cartToggle && cartDropdown) {
    renderirajDropdown();

    cartToggle.addEventListener("click", (e) => {
        e.preventDefault();
        cartDropdown.classList.toggle("open");
    });

    // Klik bilo gdje izvan košarice zatvara dropdown
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".cart-wrapper")) {
            cartDropdown.classList.remove("open");
        }
    });

    // Gumb "Naruči"
    const btnNaruci = document.getElementById("btn-naruci");
    if (btnNaruci) btnNaruci.addEventListener("click", naruci);
}


// ===== IZVRŠAVANJE NARUDŽBE =====

const EMAIL_TRGOVINE = "glassofhappines@gmail.com";

function ispravanEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function naruci() {
    const kosarica = dohvatiKosaricu();
    if (kosarica.length === 0) {
        prikaziObavijest("Košarica je prazna.", "greska");
        return;
    }

    const emailPolje = document.getElementById("cart-email");
    const email = emailPolje ? emailPolje.value.trim() : "";

    if (!ispravanEmail(email)) {
        prikaziObavijest("Unesite ispravnu e-mail adresu.", "greska");
        if (emailPolje) emailPolje.focus();
        return;
    }

    const stavkeTekst = kosarica
        .map((s, i) => (i + 1) + ". " + s.tip + ": " + s.naziv)
        .join("\n");

    const naslov = "Nova narudžba - Glass of Happiness";
    const tijelo =
        "E-mail kupca: " + email + "\n\n" +
        "Narudžba:\n" + stavkeTekst + "\n\n" +
        "Broj stavki: " + kosarica.length;

    // Ako je korisnik prijavljen, spremi narudžbu u njegovu povijest narudžbi.
    // Pričekaj da se operacija završi prije otvaranja mail klijenta jer navigacija može
    // prekinuti mrežni zahtjev i spriječiti spremanje u Firestore.
    let savePromise = Promise.resolve();
    if (typeof auth !== "undefined" && typeof db !== "undefined" && auth.currentUser) {
        savePromise = db.collection("narudzbe").add({
            userId: auth.currentUser.uid,
            email: email,
            stavke: kosarica,
            datum: firebase.firestore.FieldValue.serverTimestamp(),
            status: "Zaprimljeno"
        }).catch((err) => {
        });
    } else {
        // Ako korisnik nije prijavljen, obavijesti ga da narudžba neće biti spremljena ali ce biti poslana mailom.
        prikaziObavijest("Ako želite da narudžba bude spremljena u povijest, prijavite se prije narudžbe.", "uspjeh");
    }

    savePromise.then(() => {
        // Otvara mail aplikaciju s popunjenom narudžbom prema trgovini
        window.location.href =
            "mailto:" + EMAIL_TRGOVINE +
            "?subject=" + encodeURIComponent(naslov) +
            "&body=" + encodeURIComponent(tijelo);

        prikaziObavijest("Vaša narudžba je poslana! Javit ćemo vam se na " + email + ".", "uspjeh", 5000);

        localStorage.removeItem("kosarica");
        osvjeziBrojStavki();
        renderirajDropdown();
        if (emailPolje) emailPolje.value = "";
        if (cartDropdown) cartDropdown.classList.remove("open");
    });
}
