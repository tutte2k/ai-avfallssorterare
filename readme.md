# 🧠 AI-Avfallssorterare

Ett Node.js-projekt som använder två Hugging Face-modeller för att identifiera avfall från en bild och föreslå rätt återvinningskärl (glas, plast, mat, metall eller papper).

---

## 🚀 Hur man kör projektet

### 📋 Förkrav

- Node.js (v16 eller högre)
- npm
- Hugging Face API-nyckel ([skaffas här](https://huggingface.co/settings/tokens))

---

### ⚙️ Steg-för-steg

1. **Klona projektet:**

   ```bash
   git clone https://github.com/tutte2k/ai-avfallssorterare.git
   cd ai-avfallssorterare
   ```

2. **Installera beroenden:**

   ```bash
   npm install
   ```

3. **Skapa en `.env`-fil:**

   ```env
   API_KEY=din_huggingface_api_nyckel
   ```

4. **Starta servern:**

   ```bash
   node index.js
   ```

5. **Öppna i webbläsare:**

   Gå till: [http://localhost:3000](http://localhost:3000)

---

## 📦 Funktionalitet

- Användare laddar upp en bild på ett föremål.
- Backend skickar bilden till bildmodellen (`convnext-tiny-224`).
- Textmodellen (`bart-large-mnli`) avgör rätt återvinningskategori.
- Resultatet visas direkt i användarens webbläsare.

---

## 📁 Struktur

```bash
.
├── index.js           # Huvudfil (Express-server)
├── index.html         # Enkel frontend för uppladdning
├── .env               # API-nyckel (ej incheckad i git)
└── package.json       # Projektets beroenden och metadata
```

---

## ✅ Exempel

1. Ladda upp en bild på ett äpple.
2. Servern känner igen objektet som "apple".
3. Modellen svarar med "food" som högsta sannolikhet.
4. Resultatet: "Släng i matavfall!"

---

## ⚠️ Obs

- Hugging Face's modeller kan ta ett par sekunder att svara.
- Endast testad med mindre bildfiler (JPEG/PNG).

---
