/**
 * English — the source of truth.
 *
 * `Dictionary` is inferred from this file, so `am.ts` and `om.ts` are checked
 * against it: a missing key or a dropped step is a type error at build time
 * rather than a paragraph that silently reverts to English halfway down a page
 * nobody on the team can read.
 *
 * That is also why the arrays go through `tuple()` — it fixes their length, so
 * a translation cannot arrive with five steps where the layout expects six.
 */
const tuple = <T extends unknown[]>(...items: T) => items;

export const en = {
  nav: {
    label: "Main",
    footerLabel: "Footer",
    languageLabel: "Language",
    howItWorks: "How it works",
    about: "About",
    contact: "Contact",
    dashboard: "Host dashboard",
    pages: "Pages",
    reach: "Reach us",
  },

  footer: {
    blurb:
      "One scan, a lifetime of memories. Personal QR cards for weddings, Shengerena, graduations and every celebration in between.",
  },

  /** The occasions, named for the public pages. `OTHER` is the contact form's fallback. */
  occasions: {
    WEDDING: "Wedding",
    ENGAGEMENT: "Shengerena",
    BIRTHDAY: "Birthday",
    GRADUATION: "Graduation",
    TRADITIONAL: "Ceremony",
    ANNIVERSARY: "Anniversary",
    BABY_SHOWER: "Baby shower",
    OTHER: "Something else",
  },

  home: {
    metaTitle: "Scan & Smile",
    metaDescription: "One scan, a lifetime of memories.",

    heroTop: "One scan,",
    heroEm: "a lifetime",
    heroBottom: "of memories",
    heroBody:
      "Every guest at your celebration finds a card at their place with their name on it. They scan it, and a page opens that was written for them alone — a welcome, a note from you, a photo, a short video.",
    heroCta: "Plan your event",
    heroSecondary: "See how it works",

    cardCaption: "A real card — point your phone at it",
    weaveFor: "Weave it for",
    cardBlurb:
      "Each occasion is woven in its own colours, so a graduation card never looks like a wedding card — and any host can set three colours of their own.",
    cardLink: "Open the page this code leads to",
    /**
     * `{v}` is the host names. English puts them last; Amharic puts them
     * first, behind a ከ that takes no space after it — so the sentence has to
     * be one translated string with a hole in it rather than two halves.
     */
    scanFor: "Scan for a message from {v}",

    samples: {
      WEDDING: { hosts: "Megersa & Sara", date: "12 September 2026", table: "Table 4" },
      ENGAGEMENT: { hosts: "Hanna & Yonas", date: "3 May 2026", table: "Table 2" },
      BIRTHDAY: { hosts: "Nardos", date: "18 July 2026", table: "Table 6" },
      GRADUATION: { hosts: "The Alemu family", date: "27 June 2026", table: "Table 9" },
      TRADITIONAL: { hosts: "Ato Bekele & family", date: "9 January 2027", table: "Table 1" },
      ANNIVERSARY: { hosts: "Tigist & Dawit", date: "14 February 2027", table: "Table 3" },
      BABY_SHOWER: { hosts: "Ruth & Samuel", date: "22 March 2026", table: "Table 5" },
    },

    unavailable: "The sample card is taking a moment to load. Refresh in a few seconds.",
    setupHint: "to load the sample event and see a live card here.",
    setupHintBefore: "Run",

    stepsHeading: "Four steps, start to table",
    stepLabel: "Step",
    steps: tuple(
      {
        title: "Book the event",
        body: "Name the occasion, the hosts and the date. The colours come with the occasion, or set three of your own.",
      },
      {
        title: "Add your guests",
        body: "One at a time, or paste the whole list at once. Everyone gets a code that opens their page and no one else's.",
      },
      {
        title: "Write what they'll read",
        body: "A note, a photo, a short video. Write it once for everyone, then write something of their own for the people who should have one.",
      },
      {
        title: "Print and place",
        body: "Four cards to an A4 sheet from your own printer, or press-ready arch inserts for a print shop. Then put one at every seat.",
      }
    ),
    stepsFooterBefore: "Nothing in that list needs a developer.",
    stepsFooterLink: "The longer walkthrough",
    stepsFooterAfter:
      "covers what each screen asks for, and what your guests see at the end of it.",

    keepHeading: "A card they take home",
    keepBody:
      "Place cards get left on the table. A card with someone's name, their table and a message that was written for them does not — and the page behind it keeps working long after the hall has been swept.",
    stats: tuple(
      { value: "Minutes", body: "to add two hundred guests, pasted from the list you already keep." },
      { value: "No app", body: "for guests to install. A phone camera opens the page, nothing else." },
      { value: "Every seat", body: "gets its own code, so a card can never open the wrong person's page." },
      { value: "You see", body: "who scanned and when, from the dashboard, while the evening is happening." }
    ),

    ctaHeading: "Tell us about the day",
    ctaBody:
      "The occasion, roughly how many people, and when. We will come back with what the cards would look like and what it would cost.",
    ctaButton: "Contact us",
    ctaLink: "Who we are",
  },

  howItWorks: {
    metaTitle: "How it works — Scan & Smile",
    metaDescription:
      "From booking the event to a card at every place setting: what you fill in, what we print, and what your guests see.",

    eyebrow: "How it works",
    title: "From a guest list to a card at every seat",
    lede: "Six steps. Five of them are a form you fill in, and the sixth is watching people scan. Nothing here needs a developer, and nothing here needs to be finished in one sitting.",

    stepLabel: "Step",
    steps: tuple(
      {
        title: "Book the event",
        lede: "One screen, once.",
        body: tuple(
          "Name the occasion — wedding, Shengerena, graduation, a ceremony the list does not name — then the hosts, the date and the venue.",
          "The colours arrive with the occasion. Each one is woven from three threads, the way a tibeb band on a netela is, and any event can be given three colours of its own to match the flowers."
        ),
      },
      {
        title: "Add your guests",
        lede: "One at a time, or the whole list at once.",
        body: tuple(
          "Paste the names you already keep in a note or a spreadsheet and every one becomes a guest. Add a table, and an Ato, Woizero or Dr. where it belongs.",
          "Each guest is given a short code that is unique across every event we run, with no look-alike characters in it — so a code can be read out loud over a crowded room and still open the right page."
        ),
      },
      {
        title: "Write what they'll read",
        lede: "Once for everyone, then for the people who deserve their own.",
        body: tuple(
          "Write one note on the event and every guest sees it signed by you. Write one on a guest and they see theirs instead. The same holds for video, which is what makes a two-hundred-guest list finishable in an evening.",
          "Add a photo of you with them, and a short video message. A YouTube or Vimeo link works just as well as a file, and costs nothing to store."
        ),
      },
      {
        title: "Print the cards",
        lede: "From your printer, or from a print shop.",
        body: tuple(
          "The A4 sheet prints four cards to a page from the browser, ready to cut and stand up. That is the fast route, and it is free.",
          "The other route is an arch-shaped insert, gold on black, that slides into an acrylic stand at each place setting. Those are generated as press-ready files, one per guest, with the bleed cut round the dome so the black runs to the very edge."
        ),
      },
      {
        title: "Test one before the day",
        lede: "The five minutes that make the rest safe.",
        body: tuple(
          "Print a single card and scan it with the oldest phone that will be at the table. Gold-on-black is an inverted code: current phones read it happily, and a very old scanner may not.",
          "Once the cards are proven, the scan counters get zeroed so the numbers you watch on the night are guests, not rehearsals."
        ),
      },
      {
        title: "Watch the evening happen",
        lede: "The part you did not expect to enjoy.",
        body: tuple(
          "The dashboard shows who has scanned and when. Tables fill up in the list as people sit down, which is the closest thing to a live view of the room you will get without walking it.",
          "The pages do not expire when the hall empties. A guest can open theirs again next year, and it will still be there."
        ),
      }
    ),

    guestHeading: "What your guest does",
    guestSteps: tuple(
      "They sit down and find a card with their own name on it.",
      "They point a phone camera at it — no app, no typing, no wifi password.",
      "A page opens with a welcome by name, your note, the photo, the video, and the table they are sitting at."
    ),

    faqHeading: "The questions we are always asked",
    faq: tuple(
      {
        q: "Do guests need to install anything?",
        a: "No. Every phone camera made in the last several years reads a QR code from the lens app itself. The card opens a web page, and that is the whole of it.",
      },
      {
        q: "What if someone's phone will not scan?",
        a: "The code is printed under the QR in plain characters, chosen to have no look-alikes in them. It can be read out and typed in, or someone else can scan it and hand the phone over.",
      },
      {
        q: "How many guests is too many?",
        a: "None so far. Guests are pasted in as a list rather than typed one by one, and the printing is the same job whether it is forty cards or four hundred.",
      },
      {
        q: "Can we change a message after the cards are printed?",
        a: "Yes. The card carries the code, not the message. Edit what a guest sees an hour before dinner and the same printed card opens the new version.",
      },
      {
        q: "What happens to the photos afterwards?",
        a: "They stay with the event. Location data is stripped out of every photo when it is uploaded, so the coordinates of somebody's house never travel inside a wedding picture.",
      }
    ),

    ctaHeading: "Still deciding?",
    /** `{v}` is how quickly you reply. */
    ctaBody:
      "Send us the occasion and a rough headcount. We answer within {v}, and there is no obligation attached to asking.",
    ctaButton: "Contact us",
    ctaLink: "See a card again",
  },

  about: {
    metaTitle: "About us — Scan & Smile",
    metaDescription:
      "Why a place card should be worth keeping, and who makes them. Personal QR cards for Ethiopian celebrations.",

    eyebrow: "About us",
    title: "We make the card people keep",
    /** `{v}` is the founding year. */
    lede: "Scan & Smile started in {v} with one wedding and a stack of place cards that were going to end the night in a bin.",

    story: tuple(
      "The names were beautifully printed. Every one of them was face-down on a chair by the time the music started, because a name on cardboard is not a thing anyone has a reason to hold on to.",
      "What guests kept, that night, were the two minutes the hosts spent at their table. So we built the smallest version of that we could hand out at scale: a card at every place, a code on it, and behind the code a page written to one person — welcomed by name, thanked in the hosts' own words, with a photo of the two of them and a video if there was one to record.",
      "People scanned. Then they scanned again to show the person next to them. That is the whole idea, and everything since has been in service of making it easy enough that a host can do it themselves in an evening."
    ),

    whereHeading: "Where we are",
    whereBody:
      "We print, deliver and set up in person for events here, and work with hosts anywhere else by sending press-ready files to a printer near them.",

    principlesHeading: "What we hold to",
    principles: tuple(
      {
        title: "A guest should be named",
        body: "A table number on a folded card tells someone where to sit. Their own name, their own note and a photo of the two of you tells them they were thought about before they arrived — which is the only reason to hand out a card at all.",
      },
      {
        title: "Ours should look like ours",
        body: "Every card is edged with a tibeb band, woven in CSS from three threads the way the border of a netela is woven from three on a loom. It is not a template with a colour picker bolted to it. A wedding, a Shengerena and a graduation each come off the same loom looking like themselves.",
      },
      {
        title: "The host should not need us",
        body: "Everything a live event needs — the guests, the messages, the photos, the printing — is a form the host can fill in themselves, on the morning of, from a phone if it comes to that. We would rather be unnecessary on the day than indispensable.",
      }
    ),

    teamHeading: "Who you will be dealing with",

    ctaHeading: "Come and tell us about your day",
    /** `{v}` is how quickly you reply. */
    ctaBody: "We answer every message within {v}, usually with questions of our own.",
    ctaButton: "Contact us",
    ctaLink: "How it works",
  },

  contact: {
    metaTitle: "Contact us — Scan & Smile",
    metaDescription:
      "Tell us the occasion, roughly how many people and when. We answer every message.",

    eyebrow: "Contact us",
    title: "Tell us about the celebration",
    lede: "The occasion, roughly how many people, and when — that is enough for us to come back with what the cards would look like and what it would cost. Asking commits you to nothing.",

    formHeading: "Send a message",
    directHeading: "Or reach us directly",
    labels: {
      email: "Email",
      phone: "Phone",
      telegram: "Telegram",
      whatsapp: "WhatsApp",
      instagram: "Instagram",
      tiktok: "TikTok",
    },

    whenHeading: "When we answer",
    /** `{v}` is how quickly you reply. */
    whenBody:
      "Every message gets a reply within {v}. If yours is for a date inside the next two weeks, say so at the top — we will move it up the pile.",

    whereHeading: "Where we are",
    whereBody:
      "In person for events here; anywhere else, we send press-ready files to a printer near you.",

    form: {
      name: "Your name",
      namePlaceholder: "Sara Megersa",
      email: "Email",
      emailPlaceholder: "sara@example.com",
      phone: "Phone (optional)",
      phonePlaceholder: "+251 91 234 5678",
      occasion: "Occasion",
      date: "Date, if you have one",
      guests: "Roughly how many guests",
      guestsPlaceholder: "200",
      message: "What are you planning?",
      messagePlaceholder:
        "A wedding in September, about two hundred people, at a hall in Bole. We would like a card at every place setting and are not sure where to start.",
      submit: "Send the message",
      submitting: "Sending…",
      privacy: "Your details go to us and nowhere else.",
      sentTitle: "Message sent",
      sendAnother: "Send another",
      honeypot: "Website",
    },

    errors: {
      name: "Tell us your name, so we know who we are replying to.",
      email: "That email does not look right — we would have no way to answer.",
      message:
        "Add a line or two about the celebration. Even the occasion and a rough date is enough to start.",
      /** `{v}` is the line to reach us on instead. */
      saveFailed:
        "Something went wrong at our end and your message was not saved. Please reach us directly on {v} — we are sorry.",
    },

    sentShort: "Thank you — your message is with us.",
    /** `{v}` is how quickly you reply. */
    sent: "Thank you — your message is with us. We answer within {v}, at the address you gave.",
  },
};

/**
 * Deliberately not `as const`: the literal types that would produce make every
 * translated string a mismatch. What is enforced is the shape — every key, and
 * every array's length.
 */
export type Dictionary = typeof en;
