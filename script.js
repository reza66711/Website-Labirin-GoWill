/* ==========================================================
   Labirin GoWill - Game labirin kuis Be Going To & Will
   Struktur file:
   1. KONFIGURASI   -> angka, harga, tingkat, daftar level
   2. BANK SOAL     -> tambah / ubah soal di sini saja
   3. KARAKTER      -> daftar karakter + gambar SVG
   4. UTILITAS      -> fungsi pembantu
   5. DATA SIMPAN   -> poin, karakter, progres (localStorage)
   6. SUARA         -> efek bunyi sederhana
   7. LABIRIN       -> pembuat labirin (selalu bisa diselesaikan)
   8. NAVIGASI      -> pindah halaman, tema
   9. TAMPILAN      -> beranda, peta level, toko
  10. GAME          -> gerak, gerbang soal, hasil
  11. INIT          -> menyalakan semua event
   ========================================================== */
(() => {
  "use strict";

  /* ---------- 1. KONFIGURASI ---------- */
  const CONFIG = {
    storageKey: "labirin-gowill-v1",
    themeKey: "labirin-gowill-theme",
    maxHearts: 6, // batas nyawa saat memakai item
    coinPoints: 5, // poin per koin
    tierPoints: { low: 10, mid: 15, high: 20 }, // poin per gerbang benar
    starBonus: 20, // bonus per bintang (pertama kali)
    replayBonus: 5, // bonus jika mengulang level
    startItems: { hint: 2, heart: 1 }, // item awal
    itemPrices: { hint: 20, heart: 30 },
    toastMs: 2400,
  };

  const TIERS = {
    low: {
      label: "Rendah",
      desc: "Kenali dasar: kapan memakai be going to dan will.",
    },
    mid: {
      label: "Menengah",
      desc: "Bentuk negatif, kalimat tanya, dan percakapan. Mulai berkabut.",
    },
    high: {
      label: "Tinggi",
      desc: "Soal jebakan, koreksi kalimat, dan mengetik jawaban. Kabut tebal.",
    },
  };

  /* Daftar level. vision = radius pandang (0 = tanpa kabut). seed = pola labirin tetap. */
  const LEVELS = [
    {
      id: 1,
      tier: "low",
      name: "Taman Awal",
      size: 7,
      gates: 2,
      coins: 5,
      hearts: 5,
      vision: 0,
      seed: 101,
    },
    {
      id: 2,
      tier: "low",
      name: "Jalan Setapak",
      size: 7,
      gates: 3,
      coins: 5,
      hearts: 5,
      vision: 0,
      seed: 202,
    },
    {
      id: 3,
      tier: "low",
      name: "Hutan Kecil",
      size: 8,
      gates: 3,
      coins: 6,
      hearts: 5,
      vision: 0,
      seed: 303,
    },
    {
      id: 4,
      tier: "mid",
      name: "Lembah Sunyi",
      size: 9,
      gates: 3,
      coins: 7,
      hearts: 4,
      vision: 6,
      seed: 404,
    },
    {
      id: 5,
      tier: "mid",
      name: "Gua Berkabut",
      size: 9,
      gates: 4,
      coins: 7,
      hearts: 4,
      vision: 5,
      seed: 505,
    },
    {
      id: 6,
      tier: "mid",
      name: "Menara Batu",
      size: 10,
      gates: 4,
      coins: 8,
      hearts: 4,
      vision: 5,
      seed: 606,
    },
    {
      id: 7,
      tier: "high",
      name: "Gurun Fatamorgana",
      size: 10,
      gates: 4,
      coins: 8,
      hearts: 3,
      vision: 4,
      seed: 707,
    },
    {
      id: 8,
      tier: "high",
      name: "Kastil Bayangan",
      size: 11,
      gates: 5,
      coins: 9,
      hearts: 3,
      vision: 3,
      seed: 808,
    },
    {
      id: 9,
      tier: "high",
      name: "Puncak Teka-teki",
      size: 12,
      gates: 5,
      coins: 10,
      hearts: 3,
      vision: 3,
      seed: 909,
    },
  ];

  /* ---------- 2. BANK SOAL ----------
     tier : 'low' | 'mid' | 'high'
     type : 'choice' (q, options, answer) | 'type' (q, answer = array versi benar)
     rule : kunci dari RULES (menentukan teks petunjuk)
  ------------------------------------------------ */
  const RULES = {
    plan: "Rencana ini sudah diputuskan sebelum berbicara. Rumus: am/is/are + going to + V1.",
    evidence:
      "Ada bukti yang terlihat sekarang, jadi hasilnya hampir pasti. Pakai be going to.",
    spontaneous:
      "Keputusan ini baru dibuat saat berbicara, bukan rencana lama. Pakai will.",
    offer: "Menawarkan bantuan secara spontan memakai will.",
    promise: "Janji selalu memakai will (won't untuk negatif).",
    opinion: "Hanya dugaan atau pendapat, tanpa bukti nyata. Pakai will.",
    request: "Permintaan sopan dibuat dengan Will + subjek + V1.",
    formGoing:
      "Rumus be going to: S + am/is/are (+ not) + going to + V1. Tanya: Am/Is/Are + S + going to + V1?",
    formWill:
      "Rumus will: S + will (+ not / won't) + V1. Tanya: Will + S + V1?",
  };

  const INSTRUCTION = {
    choice: "Pilih jawaban yang paling tepat.",
    type: "Ketik hanya bagian yang kosong (termasuk am/is/are atau will).",
  };

  const QUESTIONS = [
    /* ===== RENDAH ===== */
    {
      tier: "low",
      type: "choice",
      rule: "evidence",
      q: "Look at the dark clouds! It ____ rain.",
      options: ["is going to", "will", "am going to"],
      answer: "is going to",
      explain:
        'Ada bukti nyata (awan gelap), jadi pakai be going to. Subjek "it" memakai "is".',
    },
    {
      tier: "low",
      type: "choice",
      rule: "spontaneous",
      q: "The phone is ringing. I ____ answer it.",
      options: ["will", "am going to", "are going to"],
      answer: "will",
      explain:
        "Keputusan diambil spontan saat telepon berdering, jadi pakai will.",
    },
    {
      tier: "low",
      type: "choice",
      rule: "plan",
      q: "We ____ visit our grandma next week. We have bought the tickets.",
      options: ["are going to", "is going to", "will"],
      answer: "are going to",
      explain:
        'Tiket sudah dibeli, berarti rencana matang. Subjek "we" memakai "are going to".',
    },
    {
      tier: "low",
      type: "choice",
      rule: "promise",
      q: "I promise I ____ help you.",
      options: ["will", "am going to", "is going to"],
      answer: "will",
      explain: 'Kata "promise" menunjukkan janji, dan janji memakai will.',
    },
    {
      tier: "low",
      type: "choice",
      rule: "plan",
      q: "She ____ study medicine. She has already decided.",
      options: ["is going to", "will", "are going to"],
      answer: "is going to",
      explain:
        '"Already decided" berarti rencana. Subjek "she" memakai "is going to".',
    },
    {
      tier: "low",
      type: "choice",
      rule: "spontaneous",
      q: "It is hot in here. I ____ open the window.",
      options: ["will", "am going to", "is going to"],
      answer: "will",
      explain: "Keputusan spontan saat merasa panas, jadi pakai will.",
    },
    {
      tier: "low",
      type: "choice",
      rule: "evidence",
      q: "Be careful! You ____ fall.",
      options: ["are going to", "is going to", "am going to"],
      answer: "are going to",
      explain:
        'Bahaya terlihat sekarang (bukti). Subjek "you" memakai "are going to".',
    },
    {
      tier: "low",
      type: "choice",
      rule: "opinion",
      q: "I think it ____ be sunny tomorrow.",
      options: ["will", "are going to", "am going to"],
      answer: "will",
      explain:
        '"I think" menandakan pendapat tanpa bukti pasti, jadi pakai will.',
    },
    {
      tier: "low",
      type: "choice",
      rule: "plan",
      q: "Tonight I ____ watch a movie. I have bought the tickets.",
      options: ["am going to", "will", "is going to"],
      answer: "am going to",
      explain:
        'Tiket sudah dibeli, itu rencana. Subjek "I" memakai "am going to".',
    },
    {
      tier: "low",
      type: "choice",
      rule: "offer",
      q: "A: I am hungry. B: I ____ make you a sandwich.",
      options: ["will", "am going to", "are going to"],
      answer: "will",
      explain: "B menawarkan bantuan spontan saat itu juga, jadi pakai will.",
    },
    {
      tier: "low",
      type: "choice",
      rule: "plan",
      q: "They ____ build a new mall. The plan is ready.",
      options: ["are going to", "is going to", "will"],
      answer: "are going to",
      explain:
        '"The plan is ready" berarti rencana. Subjek "they" memakai "are going to".',
    },
    {
      tier: "low",
      type: "choice",
      rule: "promise",
      q: "Don't worry. I ____ tell anyone your secret.",
      options: ["won't", "isn't going to", "am going to"],
      answer: "won't",
      explain: "Janji negatif memakai won't (will not).",
    },
    {
      tier: "low",
      type: "choice",
      rule: "plan",
      q: "We ____ visit Bali next month. We have booked the hotel.",
      options: ["are going to", "is going to", "will"],
      answer: "are going to",
      explain:
        'Hotel sudah dipesan, berarti rencana. Subjek "we" memakai "are going to".',
    },
    {
      tier: "low",
      type: "choice",
      rule: "plan",
      q: "My brother ____ be a doctor. He told us his plan yesterday.",
      options: ["is going to", "are going to", "will"],
      answer: "is going to",
      explain:
        '"His plan" menunjukkan rencana. Subjek "my brother" memakai "is going to".',
    },

    /* ===== MENENGAH ===== */
    {
      tier: "mid",
      type: "choice",
      rule: "formGoing",
      q: "____ you going to join the English club?",
      options: ["Are", "Is", "Do", "Will"],
      answer: "Are",
      explain: "Kalimat tanya be going to: Are + you + going to + V1?",
    },
    {
      tier: "mid",
      type: "choice",
      rule: "formGoing",
      q: "He ____ going to take the exam. He is too sick.",
      options: ["isn't", "won't", "doesn't", "aren't"],
      answer: "isn't",
      explain:
        'Negatif be going to memakai to be + not. Untuk "he" menjadi "isn\'t going to".',
    },
    {
      tier: "mid",
      type: "choice",
      rule: "spontaneous",
      q: "A: The printer isn't working. B: Really? I ____ fix it.",
      options: ["will", "am going to", "is going to", "going to"],
      answer: "will",
      explain:
        "B baru tahu dan langsung menawarkan bantuan, itu keputusan spontan. Pakai will.",
    },
    {
      tier: "mid",
      type: "choice",
      rule: "plan",
      q: "I have decided: I ____ start a diet next Monday.",
      options: ["am going to", "will", "is going to", "are going to"],
      answer: "am going to",
      explain:
        '"I have decided" menandakan rencana yang sudah dibuat. Subjek "I" memakai "am going to".',
    },
    {
      tier: "mid",
      type: "choice",
      rule: "evidence",
      q: "Look at the traffic! We ____ be late.",
      options: ["are going to", "are go to", "is going to", "am going to"],
      answer: "are going to",
      explain:
        'Kemacetan adalah bukti nyata. Subjek "we" memakai "are going to".',
    },
    {
      tier: "mid",
      type: "choice",
      rule: "opinion",
      q: "I think my team ____ win the final.",
      options: ["will", "are going to", "am going to", "going to"],
      answer: "will",
      explain: '"I think" menandakan opini tanpa bukti, jadi pakai will.',
    },
    {
      tier: "mid",
      type: "choice",
      rule: "request",
      q: "____ you please pass me the salt?",
      options: ["Will", "Going to", "Is", "Does"],
      answer: "Will",
      explain: "Permintaan sopan memakai Will + subjek + V1.",
    },
    {
      tier: "mid",
      type: "choice",
      rule: "formGoing",
      q: "Which sentence is correct?",
      options: [
        "She will to travel to Japan.",
        "She is going to travels to Japan.",
        "She is going to travel to Japan.",
        "She going to travel to Japan.",
      ],
      answer: "She is going to travel to Japan.",
      explain:
        "Rumusnya is + going to + V1 (kata kerja bentuk dasar, tanpa -s).",
    },
    {
      tier: "mid",
      type: "choice",
      rule: "plan",
      q: "Sorry, I can't come tonight. I ____ meet my cousin; we planned it last week.",
      options: ["am going to", "will", "is going to", "are going to"],
      answer: "am going to",
      explain:
        '"Planned it last week" berarti sudah direncanakan. Subjek "I" memakai "am going to".',
    },
    {
      tier: "mid",
      type: "choice",
      rule: "formGoing",
      q: "What ____ you going to do this weekend?",
      options: ["are", "will", "do", "is"],
      answer: "are",
      explain: 'Setelah "you" dan sebelum "going to" harus ada "are".',
    },
    {
      tier: "mid",
      type: "choice",
      rule: "request",
      q: "Which sentence is correct?",
      options: [
        "Will you helping me?",
        "Will you help me?",
        "Are you help me?",
        "Do you will help me?",
      ],
      answer: "Will you help me?",
      explain:
        "Setelah will selalu kata kerja bentuk dasar: Will + you + help?",
    },
    {
      tier: "mid",
      type: "choice",
      rule: "opinion",
      q: "I am tired. I think I ____ go to bed early tonight.",
      options: ["will", "am going", "going to", "is going to"],
      answer: "will",
      explain:
        '"I think" menandakan keputusan atau dugaan saat berbicara. Pakai will.',
    },
    {
      tier: "mid",
      type: "choice",
      rule: "evidence",
      q: "The sky is black and the wind is strong. A storm ____ hit the town.",
      options: ["is going to", "will to", "are going to", "going"],
      answer: "is going to",
      explain:
        'Langit hitam dan angin kencang adalah bukti. Subjek "a storm" memakai "is going to".',
    },
    {
      tier: "mid",
      type: "choice",
      rule: "plan",
      q: "My parents ____ buy a new car. They have saved money for two years.",
      options: ["are going to", "is going to", "will to", "am going to"],
      answer: "are going to",
      explain:
        'Menabung dua tahun menunjukkan rencana. Subjek "my parents" memakai "are going to".',
    },

    /* ===== TINGGI ===== */
    {
      tier: "high",
      type: "choice",
      rule: "plan",
      q: "A: Why are you carrying that paint? B: I ____ paint my bedroom.",
      options: ["am going to", "will", "shall to", "am will"],
      answer: "am going to",
      explain:
        "B sudah membawa cat, artinya rencana sudah dibuat sebelumnya. Pakai am going to.",
    },
    {
      tier: "high",
      type: "choice",
      rule: "promise",
      q: "Which sentence is a promise?",
      options: [
        "I'm going to visit my aunt.",
        "I won't be late again, I promise.",
        "It's going to rain soon.",
        "We are going to move house.",
      ],
      answer: "I won't be late again, I promise.",
      explain:
        "Kata \"promise\" dan won't menunjukkan janji. Janji memakai will / won't.",
    },
    {
      tier: "high",
      type: "choice",
      rule: "spontaneous",
      q: "Which sentence shows a spontaneous decision?",
      options: [
        "I'm going to buy a new bike next week.",
        "I'll take the red one, please.",
        "We're going to move to Jakarta.",
        "She is going to visit her aunt.",
      ],
      answer: "I'll take the red one, please.",
      explain:
        "Memilih barang saat itu juga adalah keputusan spontan, jadi pakai will ('ll).",
    },
    {
      tier: "high",
      type: "choice",
      rule: "evidence",
      q: "Which sentence shows a prediction with evidence?",
      options: [
        "I think it will be a great year.",
        "He has a high fever. He is going to be sick.",
        "Maybe they will come.",
        "I promise I will write.",
      ],
      answer: "He has a high fever. He is going to be sick.",
      explain:
        "Demam tinggi adalah bukti yang terlihat, jadi prediksinya memakai be going to.",
    },
    {
      tier: "high",
      type: "choice",
      rule: "offer",
      q: 'A: "I have no money for lunch." B: "____"',
      options: [
        "Don't worry. I'll buy you lunch.",
        "Don't worry. I buying you lunch.",
        "Don't worry. I'm going buy you lunch.",
        "Don't worry. I'll to buy you lunch.",
      ],
      answer: "Don't worry. I'll buy you lunch.",
      explain: 'Tawaran spontan: I\'ll + V1. Tidak ada "to" setelah will.',
    },
    {
      tier: "high",
      type: "choice",
      rule: "formWill",
      q: "Which sentence is NOT correct?",
      options: [
        "They aren't going to come.",
        "He won't be late.",
        "She isn't will go.",
        "I'm not going to cry.",
      ],
      answer: "She isn't will go.",
      explain:
        "\"Isn't will\" salah. Negatif will adalah will not / won't, tanpa to be.",
    },
    {
      tier: "high",
      type: "choice",
      rule: "plan",
      q: "Which sentence is a plan made BEFORE speaking?",
      options: [
        "Wait, I'll call a taxi.",
        "I'm going to study abroad. I have applied for a scholarship.",
        "Oh no, I'll open the window.",
        "Okay, I'll have the soup.",
      ],
      answer: "I'm going to study abroad. I have applied for a scholarship.",
      explain:
        "Sudah mendaftar beasiswa berarti rencana lama. Tiga kalimat lain adalah keputusan spontan.",
    },
    {
      tier: "high",
      type: "choice",
      rule: "formGoing",
      q: "Which question is correct?",
      options: [
        "Are you going to attend the meeting?",
        "Do you going to attend the meeting?",
        "Will you going to attend the meeting?",
        "Is you going to attend the meeting?",
      ],
      answer: "Are you going to attend the meeting?",
      explain:
        'Tanya be going to: Are + you + going to + V1? Subjek "you" memakai "are".',
    },

    {
      tier: "high",
      type: "type",
      rule: "evidence",
      q: "Look at that boy on the roof! He ____ (fall).",
      answer: ["is going to fall", "'s going to fall"],
      explain: "Ada bukti nyata. Bentuknya: is going to + fall.",
    },
    {
      tier: "high",
      type: "type",
      rule: "offer",
      q: "A: I don't have a pen. B: Wait, I ____ (lend) you mine.",
      answer: ["will lend", "'ll lend"],
      explain: "Tawaran spontan memakai will + lend.",
    },
    {
      tier: "high",
      type: "type",
      rule: "plan",
      q: "We have already chosen the date. We ____ (get married) in June.",
      answer: ["are going to get married", "'re going to get married"],
      explain:
        'Tanggal sudah dipilih, jadi rencana. Subjek "we" memakai are going to + get married.',
    },
    {
      tier: "high",
      type: "type",
      rule: "formWill",
      q: "I am sure you ____ (not / regret) it.",
      answer: ["won't regret", "will not regret"],
      explain:
        "Keyakinan atau opini memakai will. Negatifnya won't (will not) + regret.",
    },
    {
      tier: "high",
      type: "type",
      rule: "formGoing",
      q: "Ubah menjadi kalimat tanya: She is going to sing tonight.",
      instruction: "Tulis kalimat tanya lengkap.",
      answer: ["is she going to sing tonight"],
      explain: 'Pindahkan "is" ke depan: Is she going to sing tonight?',
    },
    {
      tier: "high",
      type: "type",
      rule: "formGoing",
      q: "I am so tired. I ____ (not / go) to the party. I have decided to stay home.",
      answer: ["am not going to go", "'m not going to go"],
      explain:
        '"Have decided" berarti rencana. Negatifnya: am not going to + go.',
    },
    {
      tier: "high",
      type: "type",
      rule: "opinion",
      q: "Maybe the exam ____ (be) easy.",
      answer: ["will be", "'ll be"],
      explain: '"Maybe" menandakan dugaan tanpa bukti, jadi will + be.',
    },
  ];

  /* ---------- Item toko ---------- */
  const ITEMS = [
    {
      id: "hint",
      title: "Petunjuk",
      mark: "?",
      desc: "Menghapus pilihan salah atau menampilkan aturan saat menjawab gerbang.",
    },
    {
      id: "heart",
      title: "Nyawa +1",
      mark: "♥",
      desc: "Tambah 1 nyawa saat bermain (maksimal " + CONFIG.maxHearts + ").",
    },
  ];

  /* ---------- 3. KARAKTER ---------- */
  const CHARACTERS = [
    {
      id: "bolt",
      name: "Bolt",
      price: 0,
      desc: "Robot penjelajah yang selalu siap.",
      color: "#6c7bff",
    },
    {
      id: "kiko",
      name: "Kiko",
      price: 80,
      desc: "Kucing lincah dengan telinga tajam.",
      color: "#ffb347",
    },
    {
      id: "pip",
      name: "Pip",
      price: 150,
      desc: "Penguin kecil yang tenang dan teliti.",
      color: "#37474f",
    },
    {
      id: "luna",
      name: "Luna",
      price: 250,
      desc: "Burung hantu bijak, suka teka-teki.",
      color: "#a678e3",
    },
    {
      id: "rex",
      name: "Rex",
      price: 350,
      desc: "Dino hijau yang pemberani.",
      color: "#4cc38a",
    },
    {
      id: "nova",
      name: "Aurel",
      price: 500,
      desc: "Si Alien cewe yang berwarna hijau",
      color: "#34d1c3",
    },
  ];

  const INK = "#1b1e3b";
  const eyes = (x1, x2, y, r) =>
    '<circle cx="' +
    x1 +
    '" cy="' +
    y +
    '" r="' +
    r +
    '" fill="#fff"/><circle cx="' +
    x2 +
    '" cy="' +
    y +
    '" r="' +
    r +
    '" fill="#fff"/>' +
    '<circle cx="' +
    (x1 + 1) +
    '" cy="' +
    (y + 1) +
    '" r="' +
    r * 0.5 +
    '" fill="' +
    INK +
    '"/><circle cx="' +
    (x2 + 1) +
    '" cy="' +
    (y + 1) +
    '" r="' +
    r * 0.5 +
    '" fill="' +
    INK +
    '"/>';

  const AVATARS = {
    bolt: (c) =>
      '<line x1="32" y1="14" x2="32" y2="6" stroke="' +
      INK +
      '" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="6" r="3.5" fill="#ff5d73"/>' +
      '<rect x="8" y="26" width="6" height="14" rx="3" fill="#4b55c9"/><rect x="50" y="26" width="6" height="14" rx="3" fill="#4b55c9"/>' +
      '<rect x="12" y="14" width="40" height="38" rx="11" fill="' +
      c +
      '"/><rect x="17" y="22" width="30" height="19" rx="8" fill="' +
      INK +
      '"/>' +
      '<circle cx="25" cy="31" r="4.2" fill="#7ef0ff"/><circle cx="39" cy="31" r="4.2" fill="#7ef0ff"/>' +
      '<rect x="25" y="44" width="14" height="3" rx="1.5" fill="#fff" opacity=".85"/>',
    kiko: (c) =>
      '<polygon points="11,26 15,5 30,16" fill="' +
      c +
      '"/><polygon points="53,26 49,5 34,16" fill="' +
      c +
      '"/>' +
      '<polygon points="16,20 18,11 25,16" fill="#ffc9d6"/><polygon points="48,20 46,11 39,16" fill="#ffc9d6"/>' +
      '<ellipse cx="32" cy="38" rx="23" ry="20" fill="' +
      c +
      '"/>' +
      eyes(23, 41, 34, 5) +
      '<polygon points="29,42 35,42 32,46" fill="#ff7a93"/>' +
      '<path d="M7 41 L19 43 M7 48 L19 46 M57 41 L45 43 M57 48 L45 46" stroke="' +
      INK +
      '" stroke-width="1.6" stroke-linecap="round"/>',
    pip: (c) =>
      '<ellipse cx="10" cy="38" rx="5" ry="12" fill="#263238"/><ellipse cx="54" cy="38" rx="5" ry="12" fill="#263238"/>' +
      '<ellipse cx="24" cy="59" rx="7" ry="3" fill="#ffa000"/><ellipse cx="40" cy="59" rx="7" ry="3" fill="#ffa000"/>' +
      '<ellipse cx="32" cy="34" rx="20" ry="24" fill="' +
      c +
      '"/><ellipse cx="32" cy="40" rx="13" ry="17" fill="#fff"/>' +
      '<circle cx="25" cy="26" r="4" fill="#fff"/><circle cx="39" cy="26" r="4" fill="#fff"/>' +
      '<circle cx="26" cy="27" r="2" fill="' +
      INK +
      '"/><circle cx="40" cy="27" r="2" fill="' +
      INK +
      '"/>' +
      '<polygon points="27,31 37,31 32,38" fill="#ffb300"/>',
    luna: (c) =>
      '<polygon points="13,22 13,5 27,15" fill="' +
      c +
      '"/><polygon points="51,22 51,5 37,15" fill="' +
      c +
      '"/>' +
      '<ellipse cx="32" cy="37" rx="22" ry="22" fill="' +
      c +
      '"/><ellipse cx="32" cy="46" rx="13" ry="11" fill="#e1d0ff"/>' +
      '<circle cx="23" cy="30" r="8.5" fill="#fff" stroke="' +
      INK +
      '" stroke-width="1.5"/><circle cx="41" cy="30" r="8.5" fill="#fff" stroke="' +
      INK +
      '" stroke-width="1.5"/>' +
      '<circle cx="24" cy="31" r="3.6" fill="' +
      INK +
      '"/><circle cx="42" cy="31" r="3.6" fill="' +
      INK +
      '"/>' +
      '<polygon points="28,37 36,37 32,44" fill="#ffb300"/>',
    rex: (c) =>
      '<polygon points="16,20 21,6 27,17" fill="#2e9e6a"/><polygon points="26,15 32,2 38,15" fill="#2e9e6a"/><polygon points="37,17 43,6 48,20" fill="#2e9e6a"/>' +
      '<ellipse cx="32" cy="38" rx="23" ry="21" fill="' +
      c +
      '"/><ellipse cx="32" cy="46" rx="14" ry="10" fill="#b9f0d4"/>' +
      eyes(23, 41, 32, 5) +
      '<circle cx="28" cy="43" r="1.3" fill="' +
      INK +
      '"/><circle cx="36" cy="43" r="1.3" fill="' +
      INK +
      '"/>' +
      '<path d="M24 49 Q32 55 40 49" fill="none" stroke="' +
      INK +
      '" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="15" cy="42" r="3" fill="#ff9db3" opacity=".7"/><circle cx="49" cy="42" r="3" fill="#ff9db3" opacity=".7"/>',
    nova: (c) =>
      '<line x1="22" y1="17" x2="15" y2="6" stroke="' +
      INK +
      '" stroke-width="2.5" stroke-linecap="round"/><circle cx="15" cy="6" r="3.5" fill="#ffd54f"/>' +
      '<line x1="42" y1="17" x2="49" y2="6" stroke="' +
      INK +
      '" stroke-width="2.5" stroke-linecap="round"/><circle cx="49" cy="6" r="3.5" fill="#ffd54f"/>' +
      '<ellipse cx="32" cy="37" rx="23" ry="21" fill="' +
      c +
      '"/>' +
      '<ellipse cx="22" cy="34" rx="7" ry="9.5" transform="rotate(-18 22 34)" fill="' +
      INK +
      '"/><ellipse cx="42" cy="34" rx="7" ry="9.5" transform="rotate(18 42 34)" fill="' +
      INK +
      '"/>' +
      '<circle cx="24" cy="31" r="2.2" fill="#fff"/><circle cx="40" cy="31" r="2.2" fill="#fff"/>' +
      '<path d="M26 49 Q32 54 38 49" fill="none" stroke="' +
      INK +
      '" stroke-width="2" stroke-linecap="round"/>',
  };

  function characterById(id) {
    return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
  }

  function avatarSVG(id) {
    const ch = characterById(id);
    return (
      '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
      AVATARS[ch.id](ch.color) +
      "</svg>"
    );
  }

  /* ---------- 4. UTILITAS ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function shuffle(arr, rng) {
    const rand = rng || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function normalize(str) {
    return String(str)
      .toLowerCase()
      .replace(/[‘’`]/g, "'")
      .replace(/[.,!?;:]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const levelById = (id) => LEVELS.find((l) => l.id === id);

  /* ---------- 5. DATA SIMPAN ---------- */
  function defaultSave() {
    return {
      points: 0,
      owned: ["bolt"],
      selected: "bolt",
      items: { hint: CONFIG.startItems.hint, heart: CONFIG.startItems.heart },
      stars: {},
      sound: true,
    };
  }

  function loadSave() {
    const d = defaultSave();
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return d;
      const p = JSON.parse(raw) || {};
      const s = Object.assign(d, p);
      s.items = Object.assign({ hint: 0, heart: 0 }, p.items);
      s.owned = Array.isArray(s.owned)
        ? s.owned.filter((id) => CHARACTERS.some((c) => c.id === id))
        : ["bolt"];
      if (!s.owned.includes("bolt")) s.owned.unshift("bolt");
      if (!s.owned.includes(s.selected)) s.selected = "bolt";
      s.stars = s.stars && typeof s.stars === "object" ? s.stars : {};
      s.points = Number.isFinite(s.points) ? Math.max(0, s.points) : 0;
      return s;
    } catch (e) {
      return d;
    }
  }

  let store = loadSave();

  function persist() {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(store));
    } catch (e) {
      /* penyimpanan tidak tersedia */
    }
  }

  function starsOf(levelId) {
    return store.stars[String(levelId)] || 0;
  }
  function isUnlocked(levelId) {
    return levelId === 1 || starsOf(levelId - 1) > 0;
  }

  /* ---------- 6. SUARA ---------- */
  let audioCtx = null;
  function tone(freq, dur, type, vol, delay) {
    if (!store.sound) return;
    try {
      if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = new AC();
      }
      if (audioCtx.state === "suspended") audioCtx.resume();
      const t = audioCtx.currentTime + (delay || 0);
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type || "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol || 0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + dur);
    } catch (e) {
      /* suara tidak wajib */
    }
  }

  const SFX = {
    step: () => tone(320, 0.04, "square", 0.02),
    bump: () => tone(130, 0.08, "square", 0.04),
    coin: () => {
      tone(988, 0.08, "triangle", 0.07);
      tone(1318, 0.14, "triangle", 0.07, 0.07);
    },
    ok: () => {
      tone(660, 0.12, "sine", 0.08);
      tone(880, 0.2, "sine", 0.08, 0.1);
    },
    bad: () => tone(200, 0.28, "sawtooth", 0.06),
    win: () =>
      [523, 659, 784, 1047].forEach((f, i) =>
        tone(f, 0.18, "triangle", 0.08, i * 0.12),
      ),
    lose: () =>
      [392, 330, 262].forEach((f, i) =>
        tone(f, 0.22, "sawtooth", 0.05, i * 0.15),
      ),
    buy: () => {
      tone(784, 0.1, "triangle", 0.07);
      tone(1046, 0.18, "triangle", 0.07, 0.09);
    },
  };

  /* ---------- 7. LABIRIN ---------- */
  const DIRS = [
    { k: "n", dx: 0, dy: -1, opp: "s" },
    { k: "e", dx: 1, dy: 0, opp: "w" },
    { k: "s", dx: 0, dy: 1, opp: "n" },
    { k: "w", dx: -1, dy: 0, opp: "e" },
  ];

  // Labirin sempurna (satu jalur unik antara start dan finish) dengan algoritma recursive backtracker
  function generateMaze(n, rng) {
    const grid = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => ({ n: true, e: true, s: true, w: true })),
    );
    const visited = Array.from({ length: n }, () => Array(n).fill(false));
    const stack = [{ x: 0, y: 0 }];
    visited[0][0] = true;

    while (stack.length) {
      const cur = stack[stack.length - 1];
      const options = DIRS.filter((d) => {
        const nx = cur.x + d.dx,
          ny = cur.y + d.dy;
        return nx >= 0 && ny >= 0 && nx < n && ny < n && !visited[ny][nx];
      });
      if (!options.length) {
        stack.pop();
        continue;
      }
      const d = options[Math.floor(rng() * options.length)];
      const nx = cur.x + d.dx,
        ny = cur.y + d.dy;
      grid[cur.y][cur.x][d.k] = false;
      grid[ny][nx][d.opp] = false;
      visited[ny][nx] = true;
      stack.push({ x: nx, y: ny });
    }
    return grid;
  }

  // Jalur dari (0,0) ke (n-1,n-1) memakai BFS
  function solvePath(grid, n) {
    const prev = new Map();
    const startKey = "0,0";
    const queue = [{ x: 0, y: 0 }];
    prev.set(startKey, null);

    while (queue.length) {
      const cur = queue.shift();
      if (cur.x === n - 1 && cur.y === n - 1) break;
      DIRS.forEach((d) => {
        if (grid[cur.y][cur.x][d.k]) return;
        const nx = cur.x + d.dx,
          ny = cur.y + d.dy;
        const key = nx + "," + ny;
        if (prev.has(key)) return;
        prev.set(key, cur);
        queue.push({ x: nx, y: ny });
      });
    }

    const path = [];
    let node = { x: n - 1, y: n - 1 };
    while (node) {
      path.push(node);
      node = prev.get(node.x + "," + node.y);
    }
    return path.reverse();
  }

  // Letakkan gerbang tersebar merata di sepanjang jalur
  function pickGateIndexes(pathLength, count) {
    const used = new Set();
    const result = [];
    for (let i = 1; i <= count; i++) {
      let idx = Math.round((pathLength * i) / (count + 1));
      idx = Math.min(Math.max(idx, 1), pathLength - 2);
      while (used.has(idx) && idx < pathLength - 2) idx += 1;
      while (used.has(idx) && idx > 1) idx -= 1;
      used.add(idx);
      result.push(idx);
    }
    return result.sort((a, b) => a - b);
  }

  function buildLevelData(level) {
    const rng = mulberry32(level.seed);
    const n = level.size;
    const grid = generateMaze(n, rng);
    const path = solvePath(grid, n);

    const gates = new Map();
    pickGateIndexes(path.length, level.gates).forEach((idx, i) => {
      const p = path[idx];
      gates.set(p.x + "," + p.y, { x: p.x, y: p.y, num: i + 1, solved: false });
    });

    const free = [];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const key = x + "," + y;
        const isStart = x === 0 && y === 0;
        const isExit = x === n - 1 && y === n - 1;
        if (!isStart && !isExit && !gates.has(key)) free.push(key);
      }
    }
    const coins = new Set(
      shuffle(free, rng).slice(0, Math.min(level.coins, free.length)),
    );
    return { grid, path, gates, coins };
  }

  /* ---------- Referensi elemen ---------- */
  const ui = {};
  function cacheElements() {
    [
      "points-count",
      "sound-toggle",
      "sound-icon",
      "theme-toggle",
      "theme-icon",
      "home-avatar",
      "home-char-name",
      "home-points",
      "home-cleared",
      "home-stars",
      "level-map",
      "btn-reset-data",
      "shop-points",
      "shop-chars",
      "shop-items",
      "play-tier",
      "play-name",
      "btn-leave",
      "hud-hearts",
      "hud-gates",
      "hud-earned",
      "hud-steps",
      "btn-heart",
      "heart-count",
      "board",
      "modal-question",
      "q-tier",
      "q-gate",
      "q-instruction",
      "q-text",
      "q-body",
      "q-hint",
      "btn-hint",
      "hint-count",
      "q-feedback",
      "fb-icon",
      "fb-title",
      "fb-points",
      "fb-answer",
      "fb-explain",
      "btn-q-next",
      "modal-result",
      "res-stars",
      "res-title",
      "res-sub",
      "res-list",
      "btn-res-next",
      "btn-res-retry",
      "btn-res-map",
      "toast",
    ].forEach((id) => {
      ui[id] = document.getElementById(id);
    });
  }

  /* ---------- Toast ---------- */
  let toastTimer = null;
  function toast(message) {
    ui.toast.textContent = message;
    ui.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      ui.toast.hidden = true;
    }, CONFIG.toastMs);
  }

  /* ---------- 8. NAVIGASI & TEMA ---------- */
  const VIEWS = ["home", "levels", "shop", "learn", "play"];
  const view = { current: "home" };

  function showView(name) {
    if (!VIEWS.includes(name)) name = "home";
    if (name === "play" && !game.active) name = "levels";
    view.current = name;

    VIEWS.forEach((v) => {
      const section = document.getElementById("view-" + v);
      if (section) section.hidden = v !== name;
    });
    const navName = name === "play" ? "levels" : name;
    $$(".nav__link").forEach((btn) => {
      const on = btn.dataset.view === navName;
      btn.classList.toggle("is-active", on);
      if (on) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });

    refreshUI();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function goTo(name) {
    if (window.location.hash === "#" + name) showView(name);
    else window.location.hash = name;
  }

  function viewFromHash() {
    const name = window.location.hash.replace("#", "");
    return VIEWS.includes(name) ? name : "home";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    ui["theme-icon"].textContent = theme === "dark" ? "☀" : "☾";
    ui["theme-toggle"].setAttribute(
      "aria-label",
      theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap",
    );
  }

  function initTheme() {
    let theme = null;
    try {
      theme = localStorage.getItem(CONFIG.themeKey);
    } catch (e) {
      /* abaikan */
    }
    if (theme !== "dark" && theme !== "light") {
      theme =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    }
    applyTheme(theme);
  }

  function toggleTheme() {
    const next =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(CONFIG.themeKey, next);
    } catch (e) {
      /* abaikan */
    }
  }

  function renderSoundButton() {
    ui["sound-toggle"].classList.toggle("is-off", !store.sound);
    ui["sound-toggle"].setAttribute(
      "aria-label",
      store.sound ? "Matikan suara" : "Nyalakan suara",
    );
  }

  function toggleSound() {
    store.sound = !store.sound;
    persist();
    renderSoundButton();
    if (store.sound) SFX.coin();
  }

  /* ---------- 9. TAMPILAN: beranda, peta level, toko ---------- */
  function updatePoints(bump) {
    ui["points-count"].textContent = String(store.points);
    ui["home-points"].textContent = String(store.points);
    ui["shop-points"].textContent = String(store.points);
    if (bump) {
      const chip = ui["points-count"].closest(".points-chip");
      chip.classList.remove("is-bump");
      void chip.offsetWidth;
      chip.classList.add("is-bump");
    }
  }

  function renderHome() {
    const ch = characterById(store.selected);
    ui["home-avatar"].innerHTML = avatarSVG(ch.id);
    ui["home-char-name"].textContent = ch.name;
    const cleared = LEVELS.filter((l) => starsOf(l.id) > 0).length;
    const totalStars = LEVELS.reduce((sum, l) => sum + starsOf(l.id), 0);
    ui["home-cleared"].textContent = cleared + "/" + LEVELS.length;
    ui["home-stars"].textContent = totalStars + "/" + LEVELS.length * 3;
  }

  function renderLevelMap() {
    const root = ui["level-map"];
    root.textContent = "";

    ["low", "mid", "high"].forEach((tier) => {
      const info = TIERS[tier];
      const section = el("section", "tier tier--" + tier);
      const head = el("div", "tier__head");
      head.appendChild(el("span", "badge badge--" + tier, info.label));
      head.appendChild(el("h2", "", "Tingkat " + info.label));
      head.appendChild(el("p", "", info.desc));
      section.appendChild(head);

      const grid = el("div", "level-grid");
      LEVELS.filter((l) => l.tier === tier).forEach((level) => {
        const unlocked = isUnlocked(level.id);
        const stars = starsOf(level.id);
        const card = el("button", "level-card");
        card.type = "button";
        card.disabled = !unlocked;
        card.setAttribute(
          "aria-label",
          "Level " +
            level.id +
            ", " +
            level.name +
            (unlocked ? "" : ", terkunci"),
        );

        card.appendChild(el("span", "level-card__num", String(level.id)));
        card.appendChild(el("span", "level-card__name", level.name));
        const meta =
          level.size +
          "×" +
          level.size +
          " · " +
          level.gates +
          " gerbang · " +
          level.hearts +
          " nyawa" +
          (level.vision ? " · berkabut" : "");
        card.appendChild(el("span", "level-card__meta", meta));

        const starBox = el("span", "level-card__stars");
        for (let i = 0; i < 3; i++)
          starBox.appendChild(el("span", i < stars ? "on" : "", "★"));
        card.appendChild(starBox);

        if (!unlocked)
          card.appendChild(el("span", "level-card__lock", "Terkunci"));
        card.addEventListener("click", () => startLevel(level.id));
        grid.appendChild(card);
      });
      section.appendChild(grid);
      root.appendChild(section);
    });
  }

  function renderShop() {
    const chars = ui["shop-chars"];
    chars.textContent = "";
    CHARACTERS.forEach((ch) => {
      const owned = store.owned.includes(ch.id);
      const equipped = store.selected === ch.id;
      const card = el(
        "article",
        "char-card" + (equipped ? " is-equipped" : ""),
      );
      const art = el("div", "char-card__art");
      art.innerHTML = avatarSVG(ch.id);
      card.appendChild(art);
      card.appendChild(el("h3", "", ch.name));
      card.appendChild(el("p", "", ch.desc));

      const btn = el("button", "btn btn--block");
      btn.type = "button";
      if (equipped) {
        btn.className += " btn--ghost";
        btn.textContent = "Dipakai";
        btn.disabled = true;
      } else if (owned) {
        btn.className += " btn--primary";
        btn.textContent = "Pakai";
        btn.addEventListener("click", () => selectCharacter(ch.id));
      } else {
        btn.className += " btn--gold";
        btn.textContent = "Beli ♦ " + ch.price;
        btn.disabled = store.points < ch.price;
        btn.addEventListener("click", () => buyCharacter(ch.id));
      }
      card.appendChild(btn);
      chars.appendChild(card);
    });

    const items = ui["shop-items"];
    items.textContent = "";
    ITEMS.forEach((item) => {
      const card = el("article", "item-card");
      card.appendChild(
        el("div", "item-card__icon item-card__icon--" + item.id, item.mark),
      );
      const body = el("div", "item-card__body");
      body.appendChild(el("h3", "", item.title));
      body.appendChild(el("p", "", item.desc));
      body.appendChild(
        el("p", "", "Kamu punya: " + (store.items[item.id] || 0)),
      );
      card.appendChild(body);

      const price = CONFIG.itemPrices[item.id];
      const btn = el("button", "btn btn--gold btn--sm", "Beli ♦ " + price);
      btn.type = "button";
      btn.disabled = store.points < price;
      btn.addEventListener("click", () => buyItem(item.id));
      card.appendChild(btn);
      items.appendChild(card);
    });
  }

  function refreshUI() {
    updatePoints(false);
    renderSoundButton();
    if (view.current === "home") renderHome();
    if (view.current === "levels") renderLevelMap();
    if (view.current === "shop") renderShop();
    if (view.current === "play") updateHud();
  }

  function selectCharacter(id) {
    if (!store.owned.includes(id)) return;
    store.selected = id;
    persist();
    toast(characterById(id).name + " siap menjelajah!");
    renderShop();
    renderHome();
  }

  function buyCharacter(id) {
    const ch = characterById(id);
    if (store.owned.includes(id)) return;
    if (store.points < ch.price) {
      toast("Poin belum cukup. Main lagi untuk mengumpulkan poin.");
      return;
    }
    store.points -= ch.price;
    store.owned.push(id);
    store.selected = id;
    persist();
    SFX.buy();
    toast(ch.name + " kini milikmu dan langsung dipakai!");
    updatePoints(true);
    renderShop();
    renderHome();
  }

  function buyItem(id) {
    const price = CONFIG.itemPrices[id];
    if (store.points < price) {
      toast("Poin belum cukup.");
      return;
    }
    store.points -= price;
    store.items[id] = (store.items[id] || 0) + 1;
    persist();
    SFX.buy();
    toast("Pembelian berhasil!");
    updatePoints(true);
    renderShop();
  }

  /* ---------- 10. GAME ---------- */
  const game = {
    active: false,
    locked: true,
    level: null,
    data: null,
    n: 0,
    x: 0,
    y: 0,
    hearts: 0,
    earned: 0,
    mistakes: 0,
    steps: 0,
    solved: 0,
    seen: new Set(),
    used: new Set(),
    cells: [],
    coinEls: new Map(),
    gateEls: new Map(),
    playerEl: null,
    currentGate: null,
    currentQ: null,
    answered: false,
    hintUsed: false,
    lastCorrect: false,
  };

  function startLevel(id) {
    const level = levelById(id);
    if (!level || !isUnlocked(id)) return;

    game.level = level;
    game.n = level.size;
    game.data = buildLevelData(level);
    game.x = 0;
    game.y = 0;
    game.hearts = level.hearts;
    game.earned = 0;
    game.mistakes = 0;
    game.steps = 0;
    game.solved = 0;
    game.seen = new Set();
    game.used = new Set();
    game.currentGate = null;
    game.currentQ = null;
    game.answered = false;
    game.active = true;
    game.locked = false;

    closeModal(ui["modal-question"]);
    closeModal(ui["modal-result"]);

    ui["play-tier"].textContent = TIERS[level.tier].label;
    ui["play-tier"].className = "badge badge--" + level.tier;
    ui["play-name"].textContent = "Level " + level.id + ": " + level.name;

    renderBoard();
    updateFog();
    updateHud();
    goTo("play");
  }

  function renderBoard() {
    const board = ui.board;
    const n = game.n;
    board.textContent = "";
    board.style.setProperty("--n", String(n));
    board.style.gridTemplateColumns = "repeat(" + n + ", 1fr)";
    board.style.gridTemplateRows = "repeat(" + n + ", 1fr)";

    game.cells = [];
    game.coinEls = new Map();
    game.gateEls = new Map();

    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const w = game.data.grid[y][x];
        const key = x + "," + y;
        const cell = el("div", "cell");
        if (w.n) cell.classList.add("wn");
        if (w.w) cell.classList.add("ww");
        if (x === n - 1 && w.e) cell.classList.add("we");
        if (y === n - 1 && w.s) cell.classList.add("ws");
        if (x === 0 && y === 0) cell.classList.add("is-start");
        if (x === n - 1 && y === n - 1) cell.classList.add("is-exit");

        if (game.data.gates.has(key)) {
          const g = el("div", "gate", "?");
          g.setAttribute("aria-hidden", "true");
          cell.appendChild(g);
          game.gateEls.set(key, g);
        } else if (game.data.coins.has(key)) {
          const c = el("div", "coin");
          cell.appendChild(c);
          game.coinEls.set(key, c);
        }
        board.appendChild(cell);
        game.cells.push(cell);
      }
    }

    const player = el("div", "player");
    player.innerHTML = avatarSVG(store.selected);
    game.playerEl = player;
    placePlayer(false);
  }

  function cellAt(x, y) {
    return game.cells[y * game.n + x];
  }

  function placePlayer(animate) {
    const p = game.playerEl;
    p.classList.remove("is-bump");
    if (animate) {
      // memulai ulang animasi lompat
      const clone = p.cloneNode(true);
      game.playerEl = clone;
      cellAt(game.x, game.y).appendChild(clone);
      if (p.parentNode) p.parentNode.removeChild(p);
    } else {
      cellAt(game.x, game.y).appendChild(p);
    }
  }

  function updateFog() {
    const v = game.level.vision;
    const n = game.n;
    game.cells.forEach((cell, i) => {
      if (!v) {
        cell.classList.remove("fog-hidden", "fog-seen");
        return;
      }
      const x = i % n;
      const y = Math.floor(i / n);
      const key = x + "," + y;
      const dist = Math.max(Math.abs(x - game.x), Math.abs(y - game.y));
      const isExit = x === n - 1 && y === n - 1;
      if (dist <= v) game.seen.add(key);
      const seen = game.seen.has(key) || isExit;
      cell.classList.toggle("fog-hidden", !seen);
      cell.classList.toggle("fog-seen", seen && dist > v);
    });
  }

  function updateHud() {
    if (!game.level) return;
    const maxShown = Math.max(game.level.hearts, game.hearts);
    ui["hud-hearts"].textContent =
      "♥".repeat(Math.max(game.hearts, 0)) +
      "♡".repeat(Math.max(maxShown - game.hearts, 0));
    ui["hud-hearts"].setAttribute("aria-label", game.hearts + " nyawa");
    ui["hud-gates"].textContent = game.solved + "/" + game.data.gates.size;
    ui["hud-earned"].textContent = String(game.earned);
    ui["hud-steps"].textContent = String(game.steps);
    ui["heart-count"].textContent = String(store.items.heart || 0);
  }

  /* --- Gerak --- */
  function tryMove(dirKey) {
    if (!game.active || game.locked || view.current !== "play") return;
    const d = DIRS.find((item) => item.k === dirKey);
    if (!d) return;

    if (game.data.grid[game.y][game.x][d.k]) {
      game.playerEl.classList.remove("is-bump");
      void game.playerEl.offsetWidth;
      game.playerEl.classList.add("is-bump");
      SFX.bump();
      return;
    }

    const nx = game.x + d.dx;
    const ny = game.y + d.dy;
    const gate = game.data.gates.get(nx + "," + ny);
    if (gate && !gate.solved) {
      openQuestion(gate);
      return;
    }
    enterCell(nx, ny);
  }

  function floatText(cell, text) {
    const f = el("span", "float-text", text);
    cell.appendChild(f);
    setTimeout(() => {
      if (f.parentNode) f.parentNode.removeChild(f);
    }, 900);
  }

  function enterCell(nx, ny) {
    game.x = nx;
    game.y = ny;
    game.steps += 1;
    placePlayer(true);
    SFX.step();

    const key = nx + "," + ny;
    if (game.data.coins.has(key)) {
      game.data.coins.delete(key);
      const coinEl = game.coinEls.get(key);
      if (coinEl && coinEl.parentNode) coinEl.parentNode.removeChild(coinEl);
      game.earned += CONFIG.coinPoints;
      store.points += CONFIG.coinPoints;
      persist();
      updatePoints(true);
      floatText(cellAt(nx, ny), "+" + CONFIG.coinPoints);
      SFX.coin();
    }

    updateFog();
    updateHud();

    if (nx === game.n - 1 && ny === game.n - 1) finishLevel(true);
  }

  /* --- Modal --- */
  function openModal(modal) {
    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeModal(modal) {
    modal.hidden = true;
    if (ui["modal-question"].hidden && ui["modal-result"].hidden)
      document.body.classList.remove("modal-open");
  }

  /* --- Soal --- */
  function pickQuestion(tier) {
    const pool = QUESTIONS.map((q, i) => ({ q, i })).filter(
      (item) => item.q.tier === tier,
    );
    let fresh = pool.filter((item) => !game.used.has(item.i));
    if (!fresh.length) {
      pool.forEach((item) => game.used.delete(item.i));
      fresh = pool;
    }
    const chosen = fresh[Math.floor(Math.random() * fresh.length)];
    game.used.add(chosen.i);
    return chosen.q;
  }

  function setQuestionText(target, text) {
    target.textContent = "";
    const parts = text.split(/_{3,}/);
    parts.forEach((part, i) => {
      if (part) target.appendChild(document.createTextNode(part));
      if (i < parts.length - 1) target.appendChild(el("span", "blank"));
    });
  }

  function openQuestion(gate) {
    game.locked = true;
    game.currentGate = gate;
    game.answered = false;
    game.hintUsed = false;
    const q = pickQuestion(game.level.tier);
    game.currentQ = q;

    ui["q-tier"].textContent = TIERS[game.level.tier].label;
    ui["q-tier"].className = "badge badge--" + game.level.tier;
    ui["q-gate"].textContent =
      "Gerbang " + gate.num + " dari " + game.data.gates.size;
    ui["q-instruction"].textContent = q.instruction || INSTRUCTION[q.type];
    setQuestionText(ui["q-text"], q.q);
    ui["q-body"].textContent = "";
    ui["q-hint"].hidden = true;
    ui["q-feedback"].hidden = true;
    ui["btn-hint"].disabled = false;
    ui["hint-count"].textContent = String(store.items.hint || 0);

    if (q.type === "choice") buildChoice(q);
    else buildTyping(q);

    openModal(ui["modal-question"]);
    const first = $(".option, .text-input", ui["q-body"]);
    if (first) first.focus({ preventScroll: true });
  }

  function buildChoice(q) {
    const list = el("div", "options");
    list.setAttribute("role", "group");
    list.setAttribute("aria-label", "Pilihan jawaban");
    shuffle(q.options).forEach((opt, i) => {
      const btn = el("button", "option");
      btn.type = "button";
      btn.dataset.value = opt;
      btn.appendChild(el("span", "option__key", String.fromCharCode(65 + i)));
      btn.appendChild(el("span", "option__text", opt));
      btn.addEventListener("click", () => answerChoice(q, btn));
      list.appendChild(btn);
    });
    ui["q-body"].appendChild(list);
  }

  function answerChoice(q, btn) {
    if (game.answered) return;
    const value = btn.dataset.value;
    const ok = normalize(value) === normalize(q.answer);
    $$(".option", ui["q-body"]).forEach((b) => {
      b.disabled = true;
      if (normalize(b.dataset.value) === normalize(q.answer))
        b.classList.add("is-correct");
    });
    if (!ok) btn.classList.add("is-wrong");

    const blank = $(".blank", ui["q-text"]);
    if (blank && q.q.indexOf("____") !== -1) {
      blank.textContent = q.answer;
      blank.classList.add("is-filled", ok ? "is-ok" : "is-bad");
    }
    resolveAnswer(ok);
  }

  function buildTyping(q) {
    const row = el("div", "fill-row");
    const input = el("input", "text-input");
    input.type = "text";
    input.id = "fill-input";
    input.placeholder = "Ketik jawabanmu...";
    input.autocomplete = "off";
    input.autocapitalize = "none";
    input.spellcheck = false;
    input.setAttribute("aria-label", "Jawaban isian");

    const btn = el("button", "btn btn--primary", "Cek");
    btn.type = "button";

    const submit = () => {
      if (game.answered) return;
      if (!normalize(input.value)) {
        input.focus();
        return;
      }
      const ok = q.answer.some((a) => normalize(a) === normalize(input.value));
      input.readOnly = true;
      input.classList.add(ok ? "is-ok" : "is-bad");
      btn.disabled = true;
      const blank = $(".blank", ui["q-text"]);
      if (blank) {
        blank.textContent = q.answer[0];
        blank.classList.add("is-filled", ok ? "is-ok" : "is-bad");
      }
      resolveAnswer(ok);
    };
    btn.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    });
    row.appendChild(input);
    row.appendChild(btn);
    ui["q-body"].appendChild(row);
  }

  function correctText(q) {
    const raw = Array.isArray(q.answer) ? q.answer[0] : q.answer;
    return q.q.indexOf("____") !== -1 ? q.q.replace(/_{3,}/, raw) : raw;
  }

  function resolveAnswer(isCorrect) {
    if (game.answered) return;
    game.answered = true;
    ui["btn-hint"].disabled = true;

    const q = game.currentQ;
    const gate = game.currentGate;
    game.lastCorrect = isCorrect;
    let gained = 0;

    if (isCorrect) {
      gate.solved = true;
      game.solved += 1;
      gained = CONFIG.tierPoints[game.level.tier];
      game.earned += gained;
      store.points += gained;
      persist();
      updatePoints(true);
      const gEl = game.gateEls.get(gate.x + "," + gate.y);
      if (gEl && gEl.parentNode) gEl.parentNode.removeChild(gEl);
      cellAt(gate.x, gate.y).classList.add("is-open");
      SFX.ok();
    } else {
      game.hearts -= 1;
      game.mistakes += 1;
      SFX.bad();
    }
    updateHud();

    const box = ui["q-feedback"];
    box.classList.toggle("is-correct", isCorrect);
    box.classList.toggle("is-wrong", !isCorrect);
    ui["fb-icon"].textContent = isCorrect ? "✓" : "✕";
    ui["fb-title"].textContent = isCorrect
      ? "Benar! Gerbang terbuka."
      : "Belum tepat";
    ui["fb-points"].textContent = isCorrect
      ? "+" + gained + " poin"
      : "Nyawa berkurang 1. Baca penjelasannya ya.";
    ui["fb-answer"].textContent = isCorrect
      ? ""
      : "Jawaban benar: " + correctText(q);
    ui["fb-answer"].hidden = isCorrect;
    ui["fb-explain"].textContent = q.explain;
    ui["btn-q-next"].textContent = isCorrect
      ? "Lanjut jalan"
      : game.hearts <= 0
        ? "Lihat hasil"
        : "Coba lagi nanti";
    box.hidden = false;
    ui["btn-q-next"].focus({ preventScroll: true });
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function afterQuestion() {
    if (!game.answered) return;
    closeModal(ui["modal-question"]);
    const gate = game.currentGate;

    if (game.lastCorrect) {
      game.locked = false;
      enterCell(gate.x, gate.y);
    } else if (game.hearts <= 0) {
      finishLevel(false);
    } else {
      game.locked = false;
    }
  }

  /* --- Item --- */
  function useHint() {
    if (game.answered || game.hintUsed || !game.currentQ) return;
    if ((store.items.hint || 0) <= 0) {
      toast("Petunjuk habis. Beli di Toko!");
      return;
    }
    store.items.hint -= 1;
    persist();
    game.hintUsed = true;
    const q = game.currentQ;

    if (q.type === "choice") {
      const wrong = $$(".option", ui["q-body"]).filter(
        (b) => normalize(b.dataset.value) !== normalize(q.answer),
      );
      const removeCount = Math.max(1, q.options.length - 2);
      shuffle(wrong)
        .slice(0, removeCount)
        .forEach((b) => {
          b.disabled = true;
          b.classList.add("is-eliminated");
        });
    } else {
      ui["q-hint"].textContent = "Petunjuk: " + RULES[q.rule];
      ui["q-hint"].hidden = false;
    }
    ui["btn-hint"].disabled = true;
    ui["hint-count"].textContent = String(store.items.hint);
  }

  function useHeart() {
    if (!game.active || game.locked) return;
    if ((store.items.heart || 0) <= 0) {
      toast("Item nyawa habis. Beli di Toko!");
      return;
    }
    if (game.hearts >= CONFIG.maxHearts) {
      toast("Nyawa sudah penuh.");
      return;
    }
    store.items.heart -= 1;
    game.hearts += 1;
    persist();
    SFX.ok();
    updateHud();
  }

  /* --- Hasil --- */
  function finishLevel(win) {
    game.active = false;
    game.locked = true;

    const level = game.level;
    const stars = win
      ? game.mistakes === 0
        ? 3
        : game.mistakes <= 2
          ? 2
          : 1
      : 0;
    let bonus = 0;

    if (win) {
      const previous = starsOf(level.id);
      bonus =
        previous === 0
          ? CONFIG.starBonus * stars
          : CONFIG.replayBonus +
            Math.max(stars - previous, 0) * CONFIG.starBonus;
      store.points += bonus;
      store.stars[String(level.id)] = Math.max(previous, stars);
      persist();
      updatePoints(true);
      SFX.win();
    } else {
      SFX.lose();
    }

    ui["res-stars"].textContent = "";
    for (let i = 0; i < 3; i++)
      ui["res-stars"].appendChild(
        el("span", "star" + (i < stars ? " is-on" : ""), "★"),
      );

    ui["res-title"].textContent = win ? "Level selesai!" : "Nyawa habis";
    ui["res-sub"].textContent = win
      ? stars === 3
        ? "Sempurna, tanpa kesalahan!"
        : "Bagus! Coba lagi untuk meraih 3 bintang."
      : "Tidak apa-apa. Baca materi, lalu coba lagi. Poin yang sudah kamu dapat tetap tersimpan.";

    const rows = [
      ["Gerbang terbuka", game.solved + "/" + game.data.gates.size],
      ["Kesalahan", String(game.mistakes)],
      ["Langkah", String(game.steps)],
      ["Poin dari soal & koin", "+" + game.earned],
    ];
    if (win) rows.push(["Bonus bintang", "+" + bonus]);
    rows.push(["Total poin didapat", "+" + (game.earned + bonus)]);

    ui["res-list"].textContent = "";
    rows.forEach((row, i) => {
      const li = el("li", i === rows.length - 1 ? "is-total" : "");
      li.appendChild(el("span", "", row[0]));
      li.appendChild(el("strong", "", row[1]));
      ui["res-list"].appendChild(li);
    });

    const nextLevel = levelById(level.id + 1);
    ui["btn-res-next"].hidden = !(win && nextLevel);
    ui["btn-res-next"].dataset.next = nextLevel ? String(nextLevel.id) : "";
    openModal(ui["modal-result"]);
    ui["btn-res-next"].hidden
      ? ui["btn-res-retry"].focus()
      : ui["btn-res-next"].focus();
  }

  function leaveLevel() {
    if (
      !window.confirm(
        "Keluar dari level? Poin yang sudah kamu dapat tetap tersimpan.",
      )
    )
      return;
    game.active = false;
    game.locked = true;
    closeModal(ui["modal-question"]);
    goTo("levels");
  }

  function resetData() {
    if (
      !window.confirm(
        "Hapus semua data game (poin, karakter, bintang)? Tindakan ini tidak bisa dibatalkan.",
      )
    )
      return;
    store = defaultSave();
    persist();
    toast("Data game direset.");
    refreshUI();
  }

  /* ---------- 11. INIT ---------- */
  function onKeydown(e) {
    if (view.current !== "play" || !game.active || game.locked) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const map = {
      ArrowUp: "n",
      ArrowDown: "s",
      ArrowLeft: "w",
      ArrowRight: "e",
      w: "n",
      s: "s",
      a: "w",
      d: "e",
      W: "n",
      S: "s",
      A: "w",
      D: "e",
    };
    const dir = map[e.key];
    if (!dir) return;
    e.preventDefault();
    tryMove(dir);
  }

  function initSwipe() {
    let sx = 0,
      sy = 0,
      tracking = false;
    ui.board.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length !== 1) return;
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
        tracking = true;
      },
      { passive: true },
    );
    ui.board.addEventListener(
      "touchend",
      (e) => {
        if (!tracking) return;
        tracking = false;
        const t = e.changedTouches[0];
        const dx = t.clientX - sx;
        const dy = t.clientY - sy;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        if (Math.abs(dx) > Math.abs(dy)) tryMove(dx > 0 ? "e" : "w");
        else tryMove(dy > 0 ? "s" : "n");
      },
      { passive: true },
    );
  }

  function init() {
    cacheElements();
    initTheme();

    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-view]");
      if (!trigger) return;
      const name = trigger.dataset.view;
      if (VIEWS.includes(name)) goTo(name);
    });
    window.addEventListener("hashchange", () => showView(viewFromHash()));
    document.addEventListener("keydown", onKeydown);

    ui["theme-toggle"].addEventListener("click", toggleTheme);
    ui["sound-toggle"].addEventListener("click", toggleSound);
    ui["btn-reset-data"].addEventListener("click", resetData);

    $$(".dpad__btn").forEach((btn) =>
      btn.addEventListener("click", () => tryMove(btn.dataset.dir)),
    );
    initSwipe();

    ui["btn-leave"].addEventListener("click", leaveLevel);
    ui["btn-heart"].addEventListener("click", useHeart);
    ui["btn-hint"].addEventListener("click", useHint);
    ui["btn-q-next"].addEventListener("click", afterQuestion);

    ui["btn-res-next"].addEventListener("click", () => {
      const id = parseInt(ui["btn-res-next"].dataset.next, 10);
      if (Number.isFinite(id)) startLevel(id);
    });
    ui["btn-res-retry"].addEventListener("click", () => {
      if (game.level) startLevel(game.level.id);
    });
    ui["btn-res-map"].addEventListener("click", () => {
      closeModal(ui["modal-result"]);
      goTo("levels");
    });

    showView(viewFromHash());
  }

  init();
})();
