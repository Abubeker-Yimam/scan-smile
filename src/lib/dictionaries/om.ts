import type { Dictionary } from "./en";

/**
 * Afaan Oromoo.
 *
 * TODO — this needs a native speaker's pass more than either of the other two
 * files. It was translated with care and without fluency, and celebration copy
 * is exactly where a stiff sentence shows. Read it with someone before launch.
 *
 * The brand stays "Scan & Smile". It is a name, not a word.
 */
export const om: Dictionary = {
  nav: {
    label: "Ijoo",
    footerLabel: "Miilla fuulaa",
    languageLabel: "Afaan",
    howItWorks: "Akkamitti hojjeta",
    about: "Waa'ee keenya",
    contact: "Nu quunnamaa",
    dashboard: "Daashboordii keessummeessaa",
    pages: "Fuulawwan",
    reach: "Nu argachuuf",
  },

  footer: {
    blurb:
      "Iskaanii tokko, yaadannoo bara baraa. Kaardii QR dhuunfaa cidhaaf, Shengerenaaf, eebbaaf fi ayyaana gidduu jiran hundaaf.",
  },

  occasions: {
    WEDDING: "Cidha",
    ENGAGEMENT: "Shengerena",
    BIRTHDAY: "Guyyaa dhalootaa",
    GRADUATION: "Eebba",
    TRADITIONAL: "Sirna aadaa",
    ANNIVERSARY: "Ayyaana waggaa",
    BABY_SHOWER: "Simannaa mucaa",
    OTHER: "Kan biraa",
  },

  home: {
    metaTitle: "Scan & Smile — Iskaanii tokko, yaadannoo bara baraa",
    metaDescription: "Iskaanii tokko, yaadannoo bara baraa.",

    heroTop: "Iskaanii tokko,",
    heroEm: "yaadannoo",
    heroBottom: "bara baraa",
    heroBody:
      "Keessummaan ayyaana kee irratti argamu hundi teessoo isaa irratti kaardii maqaa isaa qabu argata. Yeroo iskaanii godhu, fuulli isaaf qofa barreeffame ni banama — simannaa, ergaa ati barreessite, suuraa fi viidiyoo gabaabaa.",
    heroCta: "Ayyaana kee karoorfadhu",
    heroSecondary: "Akkamitti akka hojjetu ilaali",

    cardCaption: "Kaardii dhugaa — bilbila kee itti qabi",
    weaveFor: "Ayyaana kamiif",
    cardBlurb:
      "Ayyaanni hundi halluu ofii isaatiin dhaʼama; kanaaf kaardiin eebbaa gonkumaa akka kaardii cidhaa hin fakkaatu — keessummeessaan kamiyyuu halluu sadan ofii isaa filachuu dandaʼa.",
    cardLink: "Fuula koodiin kun banu bani",
    scanFor: "Ergaa {v} irraa argachuuf iskaanii godhi",

    samples: {
      WEDDING: { hosts: "Megersaa fi Saaraa", date: "12 Fuulbana 2026", table: "Minjaala 4" },
      ENGAGEMENT: { hosts: "Hannaa fi Yoonas", date: "3 Caamsaa 2026", table: "Minjaala 2" },
      BIRTHDAY: { hosts: "Naardos", date: "18 Adoolessa 2026", table: "Minjaala 6" },
      GRADUATION: { hosts: "Maatii Alamuu", date: "27 Waxabajjii 2026", table: "Minjaala 9" },
      TRADITIONAL: { hosts: "Obbo Baqqalaa fi maatii", date: "9 Amajjii 2027", table: "Minjaala 1" },
      ANNIVERSARY: { hosts: "Tigist fi Daawit", date: "14 Guraandhala 2027", table: "Minjaala 3" },
      BABY_SHOWER: { hosts: "Ruut fi Saamuʼeel", date: "22 Bitooteessa 2026", table: "Minjaala 5" },
    },

    unavailable: "Kaardiin fakkeenyaa yeroo xinnoo fudhachaa jira. Sekondii muraasa booda fuula haaromsi.",
    setupHintBefore: "Ayyaana fakkeenyaa fe'uu fi kaardii kallattii asitti arguuf",
    setupHint: "fiigsi.",

    stepsHeading: "Tarkaanfii afur, jalqabaa hanga minjaalaatti",
    stepLabel: "Tarkaanfii",
    steps: [
      {
        title: "Ayyaanicha galmeessi",
        body: "Gosa ayyaanaa, keessummeessitoota fi guyyaa galchi. Halluun ayyaanicha waliin dhufa, yookaan halluu sadan kee filadhu.",
      },
      {
        title: "Keessummoota kee galchi",
        body: "Tokko tokkoon, yookaan tarree guutuu al tokkotti maxxansi. Namni hundi koodii fuula isaa qofa banu argata.",
      },
      {
        title: "Waan isaan dubbisan barreessi",
        body: "Ergaa, suuraa, viidiyoo gabaabaa. Hundaaf al tokko barreessi; itti aansuun warra kan mataa isaanii qabaachuu qabaniif addatti barreessi.",
      },
      {
        title: "Maxxansiitii kaa'i",
        body: "Waraqaa A4 tokko irratti kaardii afur printara keetiin, yookaan kaardii bocaa riqicha fakkaatu maxxansaaf qophaa'e. Sana booda teessoo hunda irratti tokko kaa'i.",
      },
    ],
    stepsFooterBefore: "Tarree kana keessaa wanti tokkoyyuu ogeessa kompiitaraa hin barbaadu.",
    stepsFooterLink: "Ibsi bal'aan",
    stepsFooterAfter:
      "fuulli tokkoon tokkoon isaanii maal akka gaafatan, keessummoonni kees dhuma irratti maal akka argan ibsa.",

    keepHeading: "Kaardii mana isaaniitti geeffatan",
    keepBody:
      "Kaardiin teessoo idilee minjaala irratti hafa. Kaardiin maqaa namichaa, minjaala isaa fi ergaa isaaf barreeffame qabu garuu hin hafu — fuulli koodii duuba jirus erga galmi qulqulleeffamee booda yeroo dheeraaf hojjechuu itti fufa.",
    stats: [
      { value: "Daqiiqaa", body: "keessummoota dhibba lama tarree duraan qabdu irraa maxxansuun galchuuf." },
      { value: "Aappii hin jiru", body: "keessummoonni buufatan hin jiran. Kaameraan bilbilaa fuulicha bana; kan biraa homaa hin jiru." },
      { value: "Teessoon hundi", body: "koodii ofii qaba; kanaaf kaardiin tokko gonkumaa fuula nama biraa hin banu." },
      { value: "Ati ni argita", body: "eenyu yoom akka iskaanii godhe, galgala sana keessa daashboordii irraa." },
    ],

    ctaHeading: "Waa'ee guyyaa sanaa nutti himi",
    ctaBody:
      "Gosa ayyaanaa, tilmaamaan nama meeqa, fi yoom. Kaardiin akkam akka fakkaatuu fi baasii isaa deebinee sitti himna.",
    ctaButton: "Nu quunnamaa",
    ctaLink: "Nu eenyu",
  },

  howItWorks: {
    metaTitle: "Akkamitti hojjeta — Scan & Smile",
    metaDescription:
      "Ayyaana galmeessuu irraa hanga kaardii teessoo hunda irratti kaa'amuutti: waan ati guuttu, waan nuti maxxansinu, fi waan keessummoonni kee argan.",

    eyebrow: "Akkamitti hojjeta",
    title: "Tarree keessummootaa irraa gara kaardii teessoo hundaatti",
    lede:
      "Tarkaanfii ja'a. Shanan isaanii unka ati guuttudha, inni ja'affaan immoo namoonni yeroo iskaanii godhan ilaaluudha. Asitti wanti ogeessa kompiitaraa barbaadu hin jiru; al tokkottis xumuruun si hin barbaachisu.",

    stepLabel: "Tarkaanfii",
    steps: [
      {
        title: "Ayyaanicha galmeessi",
        lede: "Fuula tokko, al tokko.",
        body: [
          "Gosa ayyaanaa moggaasi — cidha, Shengerena, eebba, yookaan sirna tarreen hin moggaasin — itti aansuun keessummeessitoota, guyyaa fi bakka.",
          "Halluun ayyaanicha waliin dhufa. Tokkoon tokkoon isaanii akkuma sabbata tibeb netelaa irraa, kirrii sadii irraa dhaʼama; ayyaanni kamiyyuu immoo halluu sadan daraaraa isaa waliin walsimu argachuu dandaʼa.",
        ],
      },
      {
        title: "Keessummoota kee galchi",
        lede: "Tokko tokkoon, yookaan tarree guutuu al tokkotti.",
        body: [
          "Maqaawwan duraan yaadannoo yookaan gabatee keessatti qabdu maxxansi; tokkoon tokkoon isaanii keessummaa taʼu. Minjaala itti dabali, akkasumas Obbo, Aaddee yookaan Doktora bakka barbaachisutti barreessi.",
          "Keessummaan hundi ayyaanota nuti qopheessinu hunda keessatti kan hin irra deebine koodii gabaabaa argata; qubeewwan wal fakkaatanis keessa hin jiran — kanaaf galma namaan guutame keessatti sagalee ol kaasanii dubbisanillee fuula sirrii bana.",
        ],
      },
      {
        title: "Waan isaan dubbisan barreessi",
        lede: "Al tokko hundaaf, itti aansuun warra addaatti barbaadaniif.",
        body: [
          "Ayyaanicha irratti ergaa tokko barreessi; keessummaan hundi maqaa keetiin mallatteeffamee arga. Keessummaa tokko irratti barreessi; inni kan mataa isaa arga. Viidiyoodhaafis akkasuma — kunis tarreen keessummoota dhibba lamaa galgala tokkotti akka xumuramu kan taasisudha.",
          "Suuraa isaan waliin kaate fi ergaa viidiyoo gabaabaa itti dabali. Liinkiin YouTube yookaan Vimeo akkuma faayilii hojjeta; kuusaadhaafis baasii hin qabu.",
        ],
      },
      {
        title: "Kaardiiwwan maxxansi",
        lede: "Printara kee irraa, yookaan mana maxxansaa irraa.",
        body: [
          "Waraqaan A4 sun fuula tokko irratti kaardii afur biraawzarii irraa maxxansa; muramanii dhaabbachuuf qophii taʼanii. Kun karaa saffisaadha; baasiis hin qabu.",
          "Karaan biraa immoo kaardii bocaa riqicha fakkaatu, gurraacha irratti warqee, kan teessoo hunda irratti miilla akriilikii keessa seenudha. Isaan kunneen keessummaa tokkoof faayilii tokko taʼanii maxxansaaf qophaaʼanii hojjetamu; gurraachi hanga qarqara isaatti akka gaʼuufis marginiin dabalataa boca gubbaa hordofee murama.",
        ],
      },
      {
        title: "Guyyaa sanaan dura tokko yaali",
        lede: "Daqiiqaa shan kan hafe hunda nagaa taasisan.",
        body: [
          "Kaardii tokko maxxansiitii bilbila minjaala irra jiran keessaa isa hunda caalaa moofaa taʼeen iskaanii godhi. Gurraacha irratti warqeen koodii faallaa taʼedha: bilbilli ammaa salphaatti dubbisa, iskaanarri baayʼee moofaan garuu dubbisuu dhiisuu dandaʼa.",
          "Erga kaardiin mirkanaaʼee booda lakkooftuun iskaanii gara duwwaatti deebiʼa; kanaaf lakkoofsi galgala sana ilaaltu kan shaakalaa utuu hin taʼin kan keessummootaa taʼa.",
        ],
      },
      {
        title: "Galgalicha utuu taʼaa jiruu ilaali",
        lede: "Kutaan ati itti gammadda jettee hin eegne.",
        body: [
          "Daashboordiin eenyu yoom akka iskaanii godhe agarsiisa. Namoonni yeroo tataaʼan minjaalonni tarree keessatti guutamu; kunis galma sana utuu hin naannaʼin argachuu kan dandeessu ilaalcha kallattiitti dhiʼoodha.",
          "Yeroo galmi duwwaʼu fuulonni hin dhaabbatan. Keessummaan tokko waggaa itti aanu irra deebiʼee banuu dandaʼa; achuma argata.",
        ],
      },
    ],

    guestHeading: "Keessummaan kee maal godha",
    guestSteps: [
      "Taaʼee kaardii maqaa isaa qabu arga.",
      "Kaameraa bilbilaa itti qaba — aappii hin jiru, barreessuun hin jiru, jechi icciitii wifii hin jiru.",
      "Fuulli simannaa maqaadhaan, ergaa kee, suuraa, viidiyoo fi minjaala inni irra taaʼu qabu ni banama.",
    ],

    faqHeading: "Gaaffiiwwan yeroo hunda nu gaafataman",
    faq: [
      {
        q: "Keessummoonni waanuma buufatan qabu?",
        a: "Hin qaban. Kaameraan bilbilaa waggoota muraasa darban keessa hojjetame hundi koodii QR kaameraa isaa irraa dubbisa. Kaardiin fuula weebii bana; hunduu isuma.",
      },
      {
        q: "Bilbilli nama tokkoo yoo iskaanii gochuu dide hoo?",
        a: "Koodichi qubee wal fakkaatan hin qabneen QR jalatti maxxanfameera. Dubbifamee barreeffamuu dandaʼa; yookaan namni biraa iskaanii godhee bilbila isaa agarsiisuu dandaʼa.",
      },
      {
        q: "Keessummaan meeqa baayʼee dha?",
        a: "Hanga ammaatti kan baayʼate hin jiru. Keessummoonni tokko tokkoon barreeffamuu irra tarreen maxxanfamu; maxxansuunis kaardii afurtama yookaan dhibba afur taʼus hojii tokkuma.",
      },
      {
        q: "Erga kaardiin maxxanfamee booda ergaa jijjiiruu dandeenyaa?",
        a: "Eeyyee. Kaardiin kan qabatu koodii malee ergaa miti. Waan keessummaan argu saʼaatii tokko irbaataan dura yoo sirreessite, kaardiin maxxanfame sunuu haaraa sana bana.",
      },
      {
        q: "Suuraawwan booda maal taʼu?",
        a: "Ayyaanicha waliin turu. Yeroo suuraan hundi ol kaaʼamu odeeffannoon bakkaa ni haqama; kanaaf teessoon mana nama tokkoo suuraa cidhaa keessa hin deemu.",
      },
    ],

    ctaHeading: "Ammayyuu murteessaa jirtaa?",
    ctaBody:
      "Gosa ayyaanaa fi tilmaama baayʼina keessummootaa nuuf ergi. Deebii {v} keessatti kennina; gaafachuunis dirqama tokkollee sirratti hin fidu.",
    ctaButton: "Nu quunnamaa",
    ctaLink: "Kaardii irra deebiʼii ilaali",
  },

  about: {
    metaTitle: "Waa'ee keenya — Scan & Smile",
    metaDescription:
      "Maaliif kaardiin teessoo kaaʼatamuu qabaachuu qaba, eenyus akka hojjetu. Ayyaanota Itoophiyaatiif kaardii QR dhuunfaa.",

    eyebrow: "Waa'ee keenya",
    title: "Kaardii namoonni kaaʼatan hojjenna",
    lede:
      "Scan & Smile bara {v} cidha tokkoo fi kaardii teessoo galgala sana boolla kosii seenuuf jiraniin jalqabe.",

    story: [
      "Maqaawwan sun bareedanii maxxanfamanii turan. Yeroo muuziqaan jalqabu garuu tokkoon tokkoon isaanii teessoo irratti gombifamanii turan; maqaan kaartoonii irratti barreeffame wanti namni tokko qabatuuf sababa argatu miti.",
      "Galgala sana wanti keessummoonni qabatanii deeman daqiiqaa lama keessummeessitoonni minjaala isaanii bira turanidha. Kanaaf, waan sana baayʼinaan hiruu kan dandeenyu haala xinnaa taʼeen hojjenne: teessoo hunda irratti kaardii, kaardii irratti koodii, koodii duubattis fuula nama tokkoof qofa barreeffame — maqaadhaan simatame, jecha keessummeessitootaatiin galateeffatame, suuraa isaan lamaanii fi yoo jiraate viidiyoo waliin.",
      "Namoonni iskaanii godhan. Itti aansuun nama isaan cinaa jiruuf agarsiisuuf irra deebiʼanii iskaanii godhan. Yaadni guutuun isuma; erga sanaas wanti hojjenne hundi keessummeessaan tokko galgala tokko keessatti ofii isaatii hojjechuu akka dandaʼutti salphisuuf ture.",
    ],

    whereHeading: "Bakka jirru",
    whereBody:
      "Ayyaanota asitti taʼaniif ni maxxansina, ni geessina, dhuunfaadhaanis ni qopheessina; keessummeessitoota bakka biraa jiraniif immoo faayilii maxxansaaf qophaaʼe mana maxxansaa isaanitti dhiʼoo jirutti ergina.",

    principlesHeading: "Waan irratti cichinu",
    principles: [
      {
        title: "Keessummaan maqaadhaan waamamuu qaba",
        body: "Lakkoofsi minjaalaa kaardii dachaʼaa irra jiru eessa akka taaʼu qofa itti hima. Maqaan isaa, ergaan isaa fi suuraan isin lamaan waliin kaatan garuu utuu hin dhufin dura akka isaaf yaadame itti hima — kaardii hiruufis sababni jiru isuma qofa.",
      },
      {
        title: "Kan keenya kan keenya fakkaachuu qaba",
        body: "Kaardiin hundi akkuma qarqarri netelaa kirrii sadii irraa dhaʼamu, CSS keessatti kirrii sadii irraa sabbata tibebiin marfama. Kun moodela halluu filachuun itti dabalamedha miti. Cidhi, Shengerenaa fi eebbi meeshaa tokko irraa baʼanii tokkoon tokkoon isaanii ofuma isaanii fakkaatu.",
      },
      {
        title: "Keessummeessaan nu barbaaduu hin qabu",
        body: "Wanti ayyaanni tokko barbaadu hundi — keessummoonni, ergaawwan, suuraawwan, maxxansi — unka keessummeessaan ganama guyyaa sanaa, yoo barbaachisaa taʼes bilbila isaa irraa ofii isaatii guutudha. Guyyaa sana barbaachisoo taʼuu irra barbaachisoo taʼuu dhiisuu filanna.",
      },
    ],

    teamHeading: "Eenyu waliin akka hojjettu",

    ctaHeading: "Kottaatii waaʼee guyyaa keetii nutti himi",
    ctaBody:
      "Ergaa hundaaf deebii {v} keessatti kennina; yeroo baayʼees gaaffii mataa keenyaa qabannee.",
    ctaButton: "Nu quunnamaa",
    ctaLink: "Akkamitti hojjeta",
  },

  contact: {
    metaTitle: "Nu quunnamaa — Scan & Smile",
    metaDescription:
      "Gosa ayyaanaa, tilmaamaan nama meeqa fi yoom akka taʼe nutti himi. Ergaa hundaaf deebii kennina.",

    eyebrow: "Nu quunnamaa",
    title: "Waa'ee ayyaanichaa nutti himi",
    lede:
      "Gosa ayyaanaa, tilmaamaan nama meeqa, fi yoom — kaardiin akkam akka fakkaatuu fi baasii isaa deebinee sitti himuuf kun gaʼaadha. Gaafachuun dirqama tokkollee sirratti hin fidu.",

    formHeading: "Ergaa ergi",
    directHeading: "Yookaan kallattiin nu quunnami",
    labels: {
      email: "Imeelii",
      phone: "Bilbila",
      telegram: "Telegram",
      whatsapp: "WhatsApp",
      instagram: "Instagram",
    },

    whenHeading: "Yoom akka deebisnu",
    whenBody:
      "Ergaan hundi deebii {v} keessatti argata. Kan kee guyyaa torban lamaan dhufan keessa jiruuf yoo taʼe, jalqaba ergaa irratti ibsi — dursa kennineefii.",

    whereHeading: "Bakka jirru",
    whereBody:
      "Ayyaanota asitti taʼaniif dhuunfaan; bakka biraatti immoo faayilii maxxansaaf qophaaʼe mana maxxansaa sitti dhiʼoo jirutti ergina.",

    form: {
      name: "Maqaa kee",
      namePlaceholder: "Saaraa Megersaa",
      email: "Imeelii",
      emailPlaceholder: "sara@example.com",
      phone: "Bilbila (dirqama miti)",
      phonePlaceholder: "+251 91 234 5678",
      occasion: "Gosa ayyaanaa",
      date: "Guyyaa, yoo qabaatte",
      guests: "Tilmaamaan keessummaa meeqa",
      guestsPlaceholder: "200",
      message: "Maal karoorfachaa jirta?",
      messagePlaceholder:
        "Fuulbana keessa cidha qabna, tilmaamaan nama dhibba lama, galma Bole jiru keessatti. Teessoo hunda irratti kaardii barbaanna; garuu eessaa akka jalqabnu hin beeknu.",
      submit: "Ergaa ergi",
      submitting: "Ergamaa jira…",
      privacy: "Odeeffannoon kee gara keenya malee bakka biraa hin deemu.",
      sentTitle: "Ergaan ergameera",
      sendAnother: "Kan biraa ergi",
      honeypot: "Weebsaayitii",
    },

    errors: {
      name: "Eenyuuf akka deebisnu akka beeknuuf maqaa kee nutti himi.",
      email: "Imeeliin kun sirrii hin fakkaatu — karaa itti deebisnu hin qabaannu.",
      message:
        "Waaʼee ayyaanichaa hima tokko yookaan lama itti dabali. Gosa ayyaanaa fi guyyaa tilmaamaa qofti jalqabuuf gaʼaadha.",
      saveFailed:
        "Karaa keenyaan rakkoon uumamee ergaan kee hin olkaaʼamne. Maaloo kallattiin teessoo kanatti nuuf ergi: {v} — dhiifama gaafanna.",
    },

    sentShort: "Galatoomi — ergaan kee nu bira jira.",
    sent:
      "Galatoomi — ergaan kee nu bira jira. Teessoo nuuf kennite irratti deebii {v} keessatti kennina.",
  },
};
