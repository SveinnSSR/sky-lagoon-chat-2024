// knowledgeBase_is.js

// Initial language detection functions (keeping these as they are crucial).
export const detectLanguage = (message) => {
    // Add simple Icelandic words check FIRST
    const simpleIcelandicWords = [
        // Single words
        'takk', 'já', 'nei', 'ok', 'oki', 'okei', 'flott', 
        'gott', 'bara', 'allt', 'snilld', 'snillingur', 'jam', 'jamm',
        'geggjað', 'geggjuð', 'magnað', 'hjálpsamt', 'snilldin', 'skil',
        'æði', 'æðislegt', 'æðisleg',
        // Common combinations
        'takk fyrir', 'takk kærlega', 'kærar þakkir',
        'takk fyrir það', 'takk fyrir þetta',
        'takk fyrir hjálpina', 'takk fyrir aðstoðina',
        'takk kæra', 'þúsund þakkir',
        'ók takk', 'okei takk', 'oki takk',
        'flott er', 'flott takk',
        'gott að vita', 'allt í lagi',
        // Snilld variations  
        'snilld takk', 'algjör snilld', 'hrein snilld',
        'þetta er snilld', 'alveg snilld', 'snilldin ein',
        // More variations
        'alveg geggjað', 'alveg frábært', 'frábær hjálp',
        'gott spjall', 'frábær hjálp', 'snilldin ein',
        'magnað', 'magnaður', 'magnað takk',
        'hjálpsamt', 'hjálpsamur', 'hjálpsöm',
        'geggjuð takk', 'geggjað takk',
        // Exclamation versions
        'snilld!', 'geggjað!', 'magnað!', 'frábært!'
    ];
    
    // Modify the check to handle multi-word phrases, punctuation and smileys
    if (simpleIcelandicWords.some(phrase => {
        // Clean the message by removing punctuation and smileys
        const cleanedMessage = message.toLowerCase()
            .trim()
            .replace(/[!.?]/g, '')
            .replace(/[:;][\-]?[\)|\(]/g, '')  // Remove smileys
            .trim();
            
        return cleanedMessage === phrase || 
               cleanedMessage.startsWith(phrase + ' ') ||
               cleanedMessage.endsWith(' ' + phrase) ||
               // Handle variations with exclamation marks
               message.toLowerCase().trim() === phrase + '!' ||
               phrase.endsWith('!');
    })) {
        return true;  // Definitely Icelandic
    }

    // Special characters
    const icelandicIndicators = ['ð', 'þ', 'æ', 'ö', 'á', 'í', 'ú', 'é', 'ó'];
    
    // Expanded common words list including swimwear related terms
    const commonIcelandicWords = [
        'og', 'að', 'er', 'það', 'við', 'ég', 'gleymdi', 
        'sundföt', 'sundskýl', 'sundbol',  // Swimwear terms
        'ekki', 'þú', 'hann', 'hún',       // Common pronouns
        'hvað', 'gera', 'get', 'má',       // Common verbs
        'minni', 'mínum', 'mínar', 'minn', // Possessives
        'aldur', 'aldurstakmark', 'takmark' // Age-related terms
    ];

    const englishIndicators = [
        'the', 'is', 'are', 'what', 'where', 'when', 'how', 'who',
        'can', 'do', 'does', 'your', 'you', 'have', 'has', 'had',
        'will', 'would', 'should', 'could', 'and', 'but', 'or',
        'warm', 'cold', 'hot', 'water', 'temperature', 'pool',
        'in', 'at', 'to', 'from', 'with', 'without', 'about',
        'need', 'want', 'like', 'much', 'many', 'few', 'some',
        'any', 'which', 'for', 'bar', 'drink', 'food', 'eat',
        'booking', 'book', 'reservation', 'reserve', 'price',
        'cost', 'expensive', 'cheap', 'open', 'closed', 'hours',
        'didn\'t', 'don\'t', 'won\'t', 'can\'t', 'not', 'never',
        'get', 'got', 'receive', 'received', 'receiving',
        'my', 'our', 'we', 'i', 'me', 'please',
        // Package-specific indicators
        'about', 'included', 'includes', 'tell', 'explain', 'whats', "what's",
        'package', 'packages', 'details', 'information', 'more', 'price',
        'description', 'differences', 'benefits', 'features', 'options',
        'tell', 'explain', 'show', 'available', 'difference', 'between',
        'includes', 'included', 'including', 'contain', 'contains', 'offer',
        'offers', 'providing', 'access', 'admission', 'entry'
    ];
     
    const internationalWords = [
        // Basic international words
        'email', 'wifi', 'internet', 'ok', 'website',
        'booking', 'reference', 'code', 'paypal', 
        'visa', 'mastercard', 'online', 'pin',
        'instagram', 'facebook', 'app', 'mobile',
        'confirmation', 'ticket', 'message', 'yay',
        'whatsapp', 'messenger', 'tiktok', 'tik tok',
        // Product names and related terms
        'sér', 'ser', 'skjól', 'skjol', 'ritual',
        'sky', 'lagoon', 'saman', 'pure', 'gelmir',
        'ritúal', 'spa', 'bar', 'cafe', 'restaurant',
        // Common package terms
        'package', 'packages', 'access', 'admission',
        'included', 'includes', 'towel', 'towels'
    ];

    const packageTerms = [
        'sér', 'ser', 'saman', 'sky lagoon', 'pure', 'sky',
        'skjól', 'skjol', 'ritual', 'ritúal'
    ];
    
    const lowercaseMessage = message.toLowerCase();
    const messageWords = lowercaseMessage.split(/\s+/);

    // CRITICAL FIX: Check for English sentence structure FIRST - before any other checks
    if (lowercaseMessage.startsWith('tell ') ||
        lowercaseMessage.startsWith('what ') ||
        lowercaseMessage.startsWith('how ') ||
        lowercaseMessage.startsWith('can ') ||
        lowercaseMessage.startsWith('is ') ||
        lowercaseMessage.startsWith('are ') ||
        lowercaseMessage.startsWith('do ') ||
        lowercaseMessage.startsWith('does ') ||
        lowercaseMessage.startsWith('where ') ||
        lowercaseMessage.startsWith('when ') ||
        lowercaseMessage.startsWith('why ') ||
        lowercaseMessage.startsWith('could ') ||
        lowercaseMessage.startsWith('i want') ||
        lowercaseMessage.startsWith('i would') ||
        lowercaseMessage.startsWith('please') ||
        lowercaseMessage.includes('tell me about') ||
        lowercaseMessage.includes('difference between') ||
        lowercaseMessage.includes('what is the')) {
        return false;  // Definitely English, ignore any Icelandic characters
    }
    
    // First filter out international words from English word count
    const englishWordCount = messageWords.filter(word => 
        englishIndicators.includes(word) && 
        !internationalWords.includes(word)
    ).length;
    
    // Check for English based on word count
    if (englishWordCount >= 2) return false;  // Definitely English
    
    // Only then check for specific package queries if not already determined
    if (lowercaseMessage.includes('sér') || 
        lowercaseMessage.includes('ser') ||
        lowercaseMessage.includes('skjól') || 
        lowercaseMessage.includes('skjol')) {
        // If it's just a package name without other Icelandic words, treat as English
        let messageWithoutPackages = lowercaseMessage;
        packageTerms.forEach(term => {
            messageWithoutPackages = messageWithoutPackages.replace(term, '');
        });
        
        // Check if the remaining message has Icelandic words
        const hasOtherIcelandicWords = commonIcelandicWords.some(word => 
            messageWithoutPackages.includes(word)
        );
        
        return hasOtherIcelandicWords;
    }
    
    // Special handling for English-specific queries
    if (lowercaseMessage.includes('package') || 
        lowercaseMessage.includes('packages') ||
        lowercaseMessage.includes('difference between') ||
        lowercaseMessage.includes('what is') ||
        lowercaseMessage.includes('what are') ||
        lowercaseMessage.includes('ritual') ||
        lowercaseMessage.includes('steps') ||
        lowercaseMessage.includes('included in') ||
        lowercaseMessage.includes('what\'s in') ||
        lowercaseMessage.includes('pass') ||
        lowercaseMessage.includes('how do i get') ||
        lowercaseMessage.includes('how to get') ||
        lowercaseMessage.includes('bus from') ||
        lowercaseMessage.includes('shuttle') ||
        lowercaseMessage.includes('transport') ||
        lowercaseMessage.includes('excursions') ||
        lowercaseMessage.includes('how far') ||
        lowercaseMessage.includes('distance') ||
        lowercaseMessage.includes('from reykjavík') ||
        lowercaseMessage.includes('from reykjavik') ||
        lowercaseMessage.includes('close to') ||
        lowercaseMessage.includes('near to') ||
        lowercaseMessage.includes('minutes from')) {
        
        // Check if message contains Icelandic characters that aren't just place names
        const otherIcelandicChars = message.match(/[áðíúýþæö]/g) || [];
        const containsOnlyPlaceNames = otherIcelandicChars.every(char => 
            'reykjavíkbsíkeflavíkkópavogurstrætóhlemmurhamraborg'.includes(char.toLowerCase())
        );
        if (otherIcelandicChars.length === 0 || containsOnlyPlaceNames) {
            return false;
        }
    }

    // First check for any Icelandic special characters
    const hasIcelandicChars = icelandicIndicators.some(char => message.includes(char));
    if (hasIcelandicChars) return true;

    // Then check for common Icelandic words
    const hasIcelandicWord = commonIcelandicWords.some(word => lowercaseMessage.includes(word));
    
    return hasIcelandicWord;
};

// Enhanced language detection with context
export const getLanguageContext = (message) => {
    const icelandicIndicators = ['ð', 'þ', 'æ', 'ö', 'á', 'í', 'ú', 'é', 'ó'];
    const commonIcelandicWords = [
        'og', 'að', 'er', 'það', 'við', 'ekki', 'ég', 'þú', 'hann', 'hún',
        'aldur', 'aldurstakmark', 'takmark'  // Added age-related terms here too
    ];
    
    const hasIcelandicChars = icelandicIndicators.some(char => message.includes(char));
    const hasIcelandicWords = commonIcelandicWords.some(word => 
        message.toLowerCase().split(/\s+/).includes(word)
    );

    // Special handling for transportation queries
    const lowercaseMessage = message.toLowerCase();
    if ((hasIcelandicChars || hasIcelandicWords) && 
        (lowercaseMessage.includes('how do i get') ||
         lowercaseMessage.includes('how to get') ||
         lowercaseMessage.includes('bus from') ||
         lowercaseMessage.includes('shuttle') ||
         lowercaseMessage.includes('transport') ||
         lowercaseMessage.includes('excursions'))) {
        return {
            isIcelandic: false,
            confidence: 'low',
            detected: {
                specialChars: hasIcelandicChars,
                commonWords: hasIcelandicWords,
                transportQuery: true
            }
        };
    }

    // Enhanced context information
    return {
        isIcelandic: hasIcelandicChars || hasIcelandicWords,
        confidence: hasIcelandicChars && hasIcelandicWords ? 'high' : 
                   hasIcelandicChars || hasIcelandicWords ? 'medium' : 'low',
        detected: {
            specialChars: hasIcelandicChars,
            commonWords: hasIcelandicWords
        }
    };
};

// Main knowledge base structure
export const knowledgeBase_is = {
    website_links: {
        main: "https://www.skylagoon.com/is",
        booking: "https://www.skylagoon.com/is/boka",
        packages: "https://www.skylagoon.com/is/leidir-til-ad-njota",
        ritual: "https://www.skylagoon.com/is/upplifun/ritual",
        stefnumot: "https://www.skylagoon.com/is/stefnumot",
        dining: {
            overview: "https://www.skylagoon.com/is/matur-og-drykkur",
            smakk_bar: "https://www.skylagoon.com/is/matur-og-drykkur/smakk-bar",
            keimur_cafe: "https://www.skylagoon.com/is/matur-og-drykkur/keim-cafe",
            gelmir_bar: "https://www.skylagoon.com/is/matur-og-drykkur/gelmir-bar"
        },
        transportation: {
            overview: "https://www.skylagoon.com/is/heimsokn/stadsetning",
            re_website: "https://www.re.is/is",
            re_bus_stops: "https://www.re.is/is/pick-up-locations"
        },
        gift_tickets: "https://www.skylagoon.com/is/kaupa-gjafakort",
        multi_pass: "https://www.skylagoon.com/is/kaupa-multi-pass"
    },

    opening_hours: {
        questions: [
            "Hvernig eru opnunartímarnir?",
            "Hvenær er opið?",
            "Hvaða tíma er Sky Lagoon opið?",
            "Hver er afgreiðslutíminn?",
            "Hvenær lokið þið?",
            "Hvenær get ég komið?",
            "Hver er lokunartími?",
            "Breytast opnunartímarnir eftir árstíðum?",
        ],
        regular: {
            summer: {
                period: "1. júní -- 30. september",
                hours: "09:00 -- 23:00",
                daily: true,
                experience: "Á kyrrlátum sumarkvöldum getur þú notið miðnætursólarinnar í hlýju lóninu"

            },
            autumn: {
                period: "1. október -- 31. október",
                hours: "10:00 -- 23:00",
                daily: true,
                description: "Haustið býður upp á rólegar stundir í lóninu með litríku haustlitunum í forgrunni"
            },
            winter: {
                period: "1. nóvember -- 31. maí",
                weekday: {
                    days: "Mánudaga til föstudaga",
                    hours: "11:00 -- 22:00"
                },
                weekend: {
                    days: "Laugardaga og sunnudaga",
                    hours: "10:00 -- 22:00"
                },
                experience: {
                    morning: "Vetramorgnar eru einstakir í lóninu þar sem sólarupprásin skartar sínu fegursta",
                    evening: "Ef heppnin er með þér getur þú fylgst með norðurljósunum stíga draumkenndan dans á dimmum vetrarkvöldum"
                }
            }
        },
        holidays: {
            christmas_eve: {
                date: "24. desember",
                hours: "09:00 -- 16:00"
            },
            christmas_day: {
                date: "25. desember",
                hours: "09:00 -- 18:00"
            },
            boxing_day: {
                date: "26. desember",
                hours: "09:00 -- 10:00"
            },
            new_years_eve: {
                date: "31. desember",
                hours: "09:00 -- 22:00"
            },
            new_years_day: {
                date: "1. janúar",
                hours: "10:00 -- 22:00"
            }
        },
        venue_specific: {
            smakk_bar: {
                description: "Á Smakk Bar bjóðum við upp á nokkra sérvalda íslenska sælkeraplatta ásamt frábæru úrvali af víni, bjór og öðrum drykkjum. Sælkeraplattarnir innihalda sérvalda bita sem mynda fullkomið jafnvægi og eru settir saman úr árstíðabundnu hráefni. Tilvalin leið til að ljúka góðri heimsókn í Sky Lagoonn",
                winter: {
                    period: "Frá 1. október til 17. maí",
                    hours: "12:00--21:30",
                    days: "alla daga"
                },
                summer: {
                    period: "Frá 18. maí til 14. ágúst",
                    hours: "12:00--22:30",
                    days: "alla daga"
                },
                autumn: {
                    period: "Frá 15. ágúst til 30. september",
                    weekday: {
                        days: "sunnudaga til föstudaga",
                        hours: "11:00--22:30"
                    },
                    weekend: {
                        days: "laugardaga",
                        hours: "10:00--22:30"
                    }
                }
            },
            keimur_cafe: {
                description: "Á Keimur Café finnur þú gæðakaffi frá Te & Kaffi, frískandi drykki, ljúffengar súpur og nýbakað lostæti frá einu elsta bakaríi landsins, Sandholt Bakarí. Hér finnur þú einnig glútenlausa og vegan valkosti."
            }
        },
        closing_times: {
            general: "Vinsamlegast athugið: Lónið lokar 30 mínútum fyrir auglýstan lokunartíma.",
            additional: "Skjól Ritúal meðferðin og Gelmir bar loka klukkutíma fyrir lokun."
        }
    },
    facilities: {
        changing_rooms: {
            questions: [
                "Hvað er í boði í búningsklefunum?",
                "Hvernig er aðstaðan í búningsklefunum?",
                "Hvaða þægindi eru í boði?",
                "Hver er munurinn á Saman og Sér aðstöðu?",
                "Hvað fylgir með í búningsklefunum?",
                "Bjóðið þið upp á kynhlutlausa búningsklefa?",
                "Eruð þið með kynsegin búningsklefa?",
                "Hvaða möguleikar eru fyrir kynsegin gesti?"
            ],
            types: {
                saman: {
                    name: "Saman aðstaða",
                    features: [
                        "Hefðbundnir búningsklefar",
                        "Sturtuaðstaða",
                        "Læstir skápar",
                        "Handklæði innifalin",
                        "Hárþurrkur"
                    ],
                    website_info: {
                        name: "Almenn búningsaðstaða",
                        includes: [
                            "Almennur búningsklefi",
                            "Sky Lagoon snyrtivörur",
                            "Handklæði innifalin"
                        ]
                    }
                },
                ser: {
                    name: "Sér aðstaða",
                    features: [
                        "Einkaklefar",
                        "Sturtuaðstaða",
                        "Læstir skápar",
                        "Sky Lagoon snyrtivörur í hverjum klefa",
                        "Handklæði innifalin",
                        "Hárþurrkur",
                        "Rúmar tvo í einum klefa"
                    ],
                    website_info: {
                        name: "Einkabúningsaðstaða",
                        includes: [
                            "Einkaklefi með sturtu (rúmar tvo)",
                            "Sky Lagoon hárvörur og sápa",
                            "Sky Lagoon húðvörur",
                            "Handklæði"
                        ]
                    }
                },
                gender_neutral: {
                    info: "Sér búningsklefarnir okkar eru kynhlutlausir. Kynsegin gestir sem hafa keypt Saman aðgang eru hvattir til að láta vita við innritun og við uppfærum bókunina í Sér án aukakostnaðar."
                }
            }
        },
        lagoon_info: {
            questions: [
                "Hversu heitt er lónið?",
                "Hvað er hitastigið í lóninu?",
                "Er lónið nógu heitt?",
                "Breytist hitastigið?",
                // Adding more temperature related patterns
                "Hvað er vatnið heitt?",
                "Hvað er heitt?",
                "Hver er hitinn?",
                "Hversu heitur er potturinn?",
                "Er heitt?",
                "Er nógu heitt?",
                "Hvernig er hitinn?",
                "Hvernig er hitastigið?",
                "Hvað er mikill hiti?",
                "Hvað eru margar gráður?",
                "Hversu margar gráður?",
                "Hversu mikill hiti?",
                "Er kalt?",
                "Er of heitt?",
                // Add variations with "vatn"
                "Hversu heitt er vatnið?",
                "Hvað er vatnið heitt?",
                "Hver er hiti vatnsins?",
                "Hvernig er hiti vatnsins?",
                "Er vatnið heitt?",
                "Er vatnið nógu heitt?"
            ],
            temperature: {
                answer: "Lónið er u.þ.b. 38--40° heitt. Okkar breytilega veðurfar getur þó auðvitað haft töluverð áhrif á hitastigið og upplifunina almennt.",
                degrees: "38-40°C",
                weather_note: "Okkar breytilega veðurfar getur þó auðvitað haft töluverð áhrif á hitastigið og upplifunina almennt."
            },
            stay_duration: {
                questions: [
                    "Hversu lengi má ég vera?",
                    "Get ég verið allan daginn?",
                    "Er takmörkun á tíma?",
                    "Hversu lengi get ég verið?",
                    "Get ég verið eins lengi og ég vil?",
                    "Hvað má vera lengi?",
                    "Er tímatakmörkun?",
                    "Má ég vera allan daginn?",
                    "Þarf ég að fara á ákveðnum tíma?",
                    "Hvenær þarf ég að fara?"
                ],
                info: "Það er engin tímatakmörkun á heimsókn þinni í Sky Lagoon. Þegar þú kemur inn getur þú dvalið og notið aðstöðunnar okkar þar til lokað er þann dag sem þú bókaðir. Bókunin þín tryggir þér aðgang á völdum tíma, en þú mátt slaka á og njóta upplifunarinnar á þínum eigin hraða.",
                closing_reminder: "Vinsamlegast athugaðu að lónið lokar 30 mínútum fyrir auglýstan lokunartíma og Skjól ritúalið og Gelmir bar loka klukkutíma fyrir lokun.",
                recommendation: "Við mælum með að þú gefir þér að minnsta kosti 2-3 klukkustundir fyrir heimsóknina til að njóta að fullu allra þæginda okkar, þar á meðal lónsins, ritúalsins og veitingastaðanna."
            }
        },
        amenities: {
            handklaedi: {
                questions: [
                    "Fáum við handklæði?",
                    "Eru handklæði innifalin?",
                    "Þarf að koma með handklæði?",
                    "Eru handklæði á staðnum?",
                    "Hvar finn ég handklæði?",
                    "Er hægt að fá handklæði?",
                    "Þarf ég að taka með mér handklæði?",
                    "Eru handklæði í boði?"
                ],
                answer: "Handklæði eru innifalin í öllum pökkunum okkar án aukakostnaðar. Þú finnur hrein handklæði staðsett inni í búningsklefunum og er óþarfi að koma með eigið handklæði nema þú kjósir það sjálf/ur."
            },
            greidslukerfi: {
                questions: [
                    "Hvernig borga ég í lóninu?",
                    "Hvernig virkar greiðslukerfið?",
                    "Get ég tekið með mér veskið í lónið?",
                    "Hvernig virkar greiðsluarmbandið?",
                    "Er hægt að borga með peningum í lóninu?",
                    "Hvernig get ég keypt veitingar í lóninu?",
                    "Hvernig virkar armbandið?",
                    "Er hægt að greiða með peningum?"
                ],
                answer: "Þegar þú mætir í móttökuna færðu afhent sérstakt armband sem þjónar tvöföldum tilgangi: það virkar bæði sem lykill að skápnum þínum og sem greiðslukort fyrir allar veitingar og þjónustu á meðan heimsókn þinni stendur.",
                additional_info: "Við tengjum greiðslukortið þitt örugglega við armbandið í bókunarferlinu sem gerir þér kleift að versla áhyggjulaust í lóninu og tékka þig út hratt og örugglega að heimsókn lokinni. Þetta fyrirkomulag er hannað til að gera upplifun þína sem þægilegasta.",
                cash_payment: "Við tökum á móti greiðslum í íslenskum krónum. Þó mælum við með að nota armbandið sem þú færð við innritun, það gerir alla greiðsluupplifun þægilegri á meðan dvöl þinni stendur.",
                security_note: "Öll kortatenging er framkvæmd á öruggan hátt og upplýsingar þínar eru varðveittar með öruggum hætti."
            },
            rentals: {
                sundfot: {
                    questions: [
                        "Get ég keypt eða leigt sundföt?",
                        "Er hægt að fá sundföt á staðnum?",
                        "Hvað ef ég gleymi sundfötum?",
                        "Er sundfataleiga?",
                        "Ég gleymdi sundskýlu",
                        "Ég gleymdi sundfötum",
                        "Gleymdi sundfötum",
                        "Vantar sundföt",
                        "Gleymdi sundskýlunni",
                        "Gleymdi sundbolnum",
                        "Get ég fengið sundföt?",
                        "Er hægt að fá sundföt?"
                    ],
                    answer: "Já, við bjóðum upp á leigu á sundfötum í móttökunni. Við erum með bæði sundskýlur og sundboli í mismunandi stærðum og leiguverðið er 1.500 kr.",
                    details: [
                        "Sundskýlur og sundbolir í boði",
                        "Leiguverð: 1.500 kr",
                        "Fáanleg í móttöku"
                    ],
                    forgot_swimwear: "Ekki hafa áhyggjur! Við bjóðum upp á leigu á sundfötum í móttökunni. Við erum með úrval af bæði sundskýlum og sundbolum og leiguverðið er 1.500 kr."
                },
                farangursgeymsla: {
                    questions: [
                        "Er hægt að geyma ferðatöskur?",
                        "Get ég geymt töskur?",
                        "Er farangursgeymsla?",
                        "Hvað geri ég við ferðatöskurnar mínar?",
                        "Er hægt að geyma stórar töskur?"
                    ],
                    answer: "Við bjóðum upp á sérstaka farangursgeymslu fyrir allan stærri farangur í móttökunni. Verð er 990 kr fyrir hverja tösku. Vinsamlegast hafið samband við starfsfólk í móttöku við komu."
                },
                sloppar_og_inniskor: {
                    questions: [
                        "Er hægt að leigja slopp eða inniskó?",
                        "Eruð þið með sloppa til leigu?",
                        "Get ég fengið inniskó?",
                        "Er hægt að fá lánaðan slopp?",
                        "Bjóðið þið upp á sloppa?"
                    ],
                    answer: "Nei, við bjóðum ekki upp á leigu á sloppum eða inniskóm þar sem gengið er beint út í lónið úr búningsklefunum. Gestum er þó að sjálfsögðu velkomið að koma með sína eigin sloppa eða inniskó og nota á svæðinu."
                }
            },
            retail_products: {
                questions: [
                    "Get ég keypt Sky vörur, ef svo hvar?",
                    "Hvar get ég keypt Sky vörur?",
                    "Hvað er hægt að kaupa?",
                    "Get ég keypt vörur frá ykkur?",
                    "Seljið þið vörur?",
                    "Er hægt að kaupa vörur hjá ykkur?",
                    "Get ég keypt líkamskrem?",
                    "Seljið þið líkamsolíu?"
                ],
                location: "Vörurnar okkar eru til sölu hægra megin við útganginn úr Sky Lagoon.",
                online_info: "Við bjóðum ekki upp á kaup á vörum frá okkur á netinu eða með póstsendingu.",
                products: [
                    "Sky skrúbburinn",
                    "Sky Líkamskrem (120ml eða 30ml)",
                    "Sky Líkamsolía (50ml eða 30ml)",
                    "Sky kodda Ilmur (30ml)",
                    "Sky handsápa",
                    "Sky Ilmkertið",
                    "Sky Ilmsprey",
                    "Sky Ilmgjafi"
                ],
                answer: {
                    general: "Vörurnar okkar eru til sölu hægra megin við útganginn úr Sky Lagoon. Þar getur þú keypt:",
                    online: "Við bjóðum ekki upp á kaup á vörum frá okkur á netinu eða með póstsendingu. Vörurnar okkar eru aðeins til sölu á staðnum hægra megin við útganginn úr Sky Lagoon.",
                    specific_product: "Já, við seljum {product}. Það er ein af vörunum sem þú getur keypt hægra megin við útganginn úr Sky Lagoon."
                }
            }            
        },
        accessibility: {
            questions: [
                "Er auðvelt aðgengi fyrir öll?",
                "Er aðgengi fyrir hjólastóla?",
                "Er hjólastólaaðgengi?",
                "Er stólalyfta?",
                "Get ég komist um á hjólastól?",
                "Eruð þið með aðgengi fyrir fatlaða?",
                "Er aðgengi fyrir hreyfihamlaða?",
                "Er hjólastólaaðgengi í búningsklefum?",
                "Er aðstoð í boði?",
                "Er fylgdarmaður ókeypis?",
                "Þarf ég að borga fyrir fylgdarmann?",
                "Er hægt að fá hjólastól lánaðan?",
                "Er hægt að fá aðstoð við að komast í og úr lóninu?",
                // New questions from website
                "Hvernig er aðgengið fyrir hreyfihamlaða?",
                "Eruð þið með lyftu?",
                "Er hjólastóll í boði?",
                "Er sérstök aðstaða fyrir hreyfihamlaða?",
                "Hvernig er aðstaðan fyrir kynsegin fólk?",
                "Eruð þið með kynhlutlaus salerni?",
                "Get ég fengið aðstoð starfsfólks?",
                "Hvernig er aðstaðan fyrir fatlaða?",
                "Hvernig er aðgangssvítan?",
                "Hvernig er aðgengissvítan?",
                "Fá fatlaðir aðgang?",
                "Get ég fengið aðstoð?",
                "Er hjálp í boði?",
                "Er hægt að fá aðstoð?",
                "Fá fatlaðir meiri aðstoð?",
                "Er sérstök aðstaða?",
                "Er sérútbúin aðstaða?",
                "Hvernig er aðstaðan?",
                "Er aðstoð í boði?",
                "Fæ ég hjálp?",
                "Er hægt að fá fylgdarmann?"
            ],
            mission_statement: {
                // New from website
                general: "Sky Lagoon hefur sett sér það markmið frá upphafi að veita öllum okkar gestum hlýlegar móttökur og þar af leiðandi lagt mikið upp úr aðgengismálum.",
                design_focus: "Frá hönnun var mikil áhersla lögð á að aðgengi fyrir hreyfihamlaða væri eins og best er á kosið"
            },
            accessibility_suite: {
                // New detailed info from website
                accessibility_suite: {
                    name: "Aðgengissvítan",
                    description: "Aðgengissvítan er sérhönnuð einkaaðstaða fyrir fatlaða gesti með auknu aðgengi.",
                    features: [
                        "Sex læstir skápar",
                        "Rúmgott svæði til að athafna sig",
                        "Öryggis- og hjálparbjalla",
                        "Hindrunarlaust aðgengi að sturtum með stuðningsslá",
                        "Færanlegur sturtustóll með baki og örmum",
                        "Salerni með stuðningsslá",
                        "Rúmgóður bekkur",
                        "Spegill"
                    ],
                    access: "Allir fatlaðir gestir geta fengið aðgang að aðgengissvítunni"
                },
            pool_access: {
                // Enhanced with official website wording
                lifts: {
                    main_pool: "Við útvegum hjólastól sem farið er í að lyftu sem staðsett er við laugarbrúnina og aðstoðar þig við að komast í og úr lóni.",
                    ritual_area: "Önnur lyfta er svo til þess að komast upp á bakka við torfbæinn, ofan í og úr kalda pottinum. Þaðan útvegum við svo hjólastól til afnota í torfbænum."
                }
            },
            staff_assistance: {
                general: "Sky Lagoon teymið er sérstaklega þjálfað til að aðstoða fatlaða gesti og er alltaf tilbúið að hjálpa.",
                communication: "Teymið okkar notar talstöðvar til samskipta, svo það er auðvelt að láta okkur vita ef þú þarft aðstoð, til dæmis með aðgengislyftu eða þegar þú vilt komast upp úr.",
                service: "Teymið okkar mun alltaf glatt aðstoða þig þurfir þú aðstoð.",
                contact: "Við mælum með að hafa samband við okkur fyrirfram á reservations@skylagoon.is ef þú þarft sérstaka aðstoð eða aðbúnað."
            },
            },
            lgbtqia_support: {
                // New from website
                main_info: "Sky búningsklefarnir okkar eru kynhlutlausir. Kynsegin gestir (þau sem skilgreina sig utan tvíhyggjukerfisins) og hafa keypt Saman aðgang eru hvattir til að láta vita við innritun og við uppfærum bókunina í Sér án aukakostnaðar.",
                hinsegin_heit: {
                    title: "Fögnum fjölbreytileikanum",
                    intro: "Hjá Sky Lagoon heitum við því að gera ávallt okkar besta til að bæði gestum og teyminu okkar líði vel og viti að öll séu velkomin.",
                    commitments: [
                        {
                            title: "Öruggt rými fyrir öll",
                            description: "Við leggjum okkur fram við að taka á móti fólki á öruggan hátt, með virðingu og hlýju. Sky búningsklefarnir okkar eru kynhlutlausir og höfum við endurmerkt salernin til að koma til móts við öll.",
                            extra_info: "Kynsegin gestir eða þau sem skilgreina sig utan tvíhyggjukerfisins og hafa keypt Saman miða með aðgangi að almennri búningsaðstöðu eru hvattir til að láta okkur vita og við munum uppfæra bókunina í kynhlutlausan klefa í Sér viðkomandi að kostnaðarlausu."
                        },
                        {
                            title: "Fræðsla í fyrirrúmi",
                            description: "Við leggjum áherslu á að fræða okkur um málefni og áskoranir sem hinsegin samfélagið stendur frammi fyrir, með það að markmiði að efla samkennd, skilning og stuðning."
                        },
                        {
                            title: "Bætum okkur",
                            description: "Við tökum fagnandi á móti tillögum frá bæði teyminu okkar og gestum um hvernig við getum haldið áfram að vinna að betra aðgengi fyrir öll í Sky Lagoon."
                        }
                    ],
                    closing_statements: [
                        "Með auknum sýnileika getum við öll gert betur.",
                        "Við lofum að leggja okkar af mörkum.",
                        "Við erum stolt af því að leggja okkar af mörkum."
                    ]
                }
            },
            features: [
                "Öll aðstaða með gott aðgengi fyrir hjólastóla",
                "Aðgengilegir búningsklefar fyrir hjólastóla",
                "Aðgengilegar sturtur",
                "Stólalyfta við lónið",
                "Þjálfað starfsfólk til aðstoðar",
                "Frír aðgangur fyrir fylgdarmenn",
                "Sérhönnuð aðgangs-svíta",
                "Hjólastólar í boði fyrir ritúalið",
                "Lyfta fyrir aðstoð í og úr lóninu"
            ],
            main_info: "Já. Öll okkar aðstaða, þ.m.t. búningsklefar og sturtur, veita gott aðgengi fyrir hjólastóla, auk þess sem stólalyfta er við lónið sjálft.",
            companion_info: "Við bjóðum frían aðgang fyrir fylgdarmenn.",
            detailed_info: {
                facilities: "Við erum með góða aðstöðu fyrir hjólastóla, bjóðum upp á aðgangs-svítuna sem er hjólastóla væn og sérbúna einkaklefa með betri og stærri aðstöðu.",
                pool_access: "Við erum með lyftu til þess að hjálpa einstaklingum í og úr lóninu.",
                ritual_access: "Þá erum við með hjólastóla sem einstaklingar geta notað á meðan þeir fara í gegnum ritúalið."
            },
            additional_info: "Við mælum með að hafa samband við okkur fyrirfram ef þú þarft sérstaka aðstoð eða aðbúnað. Þú getur sent okkur póst á reservations@skylagoon.is."
        }
    },
    ritual: {
        questions: [
            "Hversu oft má fara í gegnum Skjól Ritúalið?",
            "Er ritúalið innifalið?",
            "Get ég sleppt ritúalinu?",
            "Hvað er Skjól ritúalið?",
            "Hvernig virkar ritúalið?",
            "Er ritúalið val?",
            // Add new question patterns from website
            "Hvernig fer ritúalið fram?",
            "Hver eru skrefin?",
            "Hvað eru mörg skref?",
            "Útskýrðu ritúalið",
            "Segðu mér frá ritúalinu",
            "Hvernig er ritúalmeðferðin?"
        ],
        name: "Skjól Ritúal",
        tagline: "Nærandi ferðalag fyrir öll skilningarvitin [Skoða Ritúal] (https://www.skylagoon.com/is/upplifun/ritual)",
        description: "Fullkomnaðu upplifunina í sjö nærandi skrefum.",
        answer: "Skjól Ritúal meðferðin er innifalin í Sér og Saman pössum. Fullt ferðalag í gegnum öll sjö skref Skjól Ritúalsins er í boði einusinni en þér er velkomið að hafa það notalegt í lóninu eins lengi og þig lystir. Skjól Ritúalið byggir á heilunarmátt heita og kalda vatnsins, við hvetjum þig að drekka nóg af vatni og njóta hvers skrefs til hins ýtrasta.",
        steps: {
            step1: {
                name: "Laug",
                title: "Slökun í hlýjum faðmi lónsins",
                description: "Byrjaðu ferðalagið í hlýja lóninu. Andaðu að þér ferska loftinu, njóttu umhverfisins og finndu friðinn innra með þér.",
                temperature: "38-40°C --- Hlýtt og notalegt"
            },
            step2: {
                name: "Kuldi",
                title: "Kaldur og orkugefandi pottur",
                description: "Eftir slökun í hlýju lóninu er tilvalið að vekja líkamann með stuttri dýfu í kalda pottinn. Kuldameðferð eykur hamingju og velsæld, örvar ónæmiskerfið, eykur blóðflæði og þéttir húðina.",
                temperature: "5°C --- Orkuskot frá náttúrunnar hendi"
            },
            step3: {
                name: "Ylur",
                title: "Töfrandi útsýni og einstök ró í hitanum",
                description: "Njóttu þess að fylgjast með draumkenndu samspili himins og hafs. Hitinn opnar og hreinsar húðina á meðan þú slakar á og nýtur umhverfisins. Veldu annað hvort klassísku eða símalausu saunu okkar. Báðar bjóða upp á einstakt rými í kyrrð og ró með útsýni til sjávar svo langt sem augað eygir.",
                temperature: "80-90°C --- Hlý og notaleg"
            },
            step4: {
                name: "Súld",
                title: "Frískandi kaldur úði",
                description: "Leyfðu kuldanum að leika um líkamann eftir hlýja dvöl í saununni. Finndu hvernig svalt mistrið örvar líkama og sál.",
                temperature: "~5°C - Kalt og svalandi"
            },
            step5: {
                name: "Mýkt",
                title: "Hreinsandi og endurnærandi skrúbbur frá Sky Lagoon",
                description: "Sky saltskrúbburinn mýkir og hreinsar húðina. Berðu skrúbbinn á þig og leyfðu honum að liggja á húðinni á meðan þú slakar á í gufunni í næsta skrefi.",
                note: "Skrúbburinn inniheldur möndlu- og sesamolíu.",
                properties: "Nærandi og mýkjandi"
            },
            step6: {
                name: "Gufa",
                title: "Nærandi gufa",
                description: "Njóttu þess að slaka á í hlýrri gufunni. Gufan fullkomnar Ritúal-meðferðina og hjálpar húðinni að drekka í sig rakann úr Sky saltskrúbbnum.",
                temperature: "~46°C --- Hlýjan umlykur þig"
            },
            step7: {
                name: "Saft",
                title: "Lífgaðu upp á bragðlaukana",
                description: "Njóttu krækiberjasafts okkar sem er unnið úr íslenskum berjum. Finndu kraftinn úr náttúrunni sem leikur við skynfærin og fullkomnar ritúalið, kraftinn sem hefur fylgt þjóðinni frá örófi alda."
            }
        },
        duration: {
            questions: [
                "Hvað tekur ritúalið langan tíma?",
                "Hversu lengi tekur ritúalið?",
                "Hve langan tíma á ég að gefa mér?",
                "Hvað þarf að gefa langan tíma fyrir ritúalið?"
            ],
            answer: "Ritúalið tekur venjulega um 45 mínútur, en þú getur tekið lengri tíma ef þú vilt njóta hvers skrefs til fulls. Við mælum með að gefa því að minnsta kosti þennan tíma til að upplifa okkar Skjól ritúal í rólegheitum. ✨",
            recommended: 45,
            note: "Taktu þér góðan tíma til að njóta hvers skrefs"
        },
        allergies: {
            questions: [
                "Ég er með ofnæmi, get ég notað Sky líkamsskrúbbinn í sjö-skrefa Skjól Ritúalinu?",
                "Er ofnæmisvaldandi efni í skrúbbnum?",
                "Hvað er í skrúbbnum?",
                "Get ég sleppt skrúbbnum?"
            ],
            answer: "Það fer eftir því hvernig ofnæmi þú ert með. Við mælum með því að kynna sér innihaldsefnin vel.",
            ingredients: "Sky líkamsskrúbburinn inniheldur: Maris Sal, Isopropyl Myristate, Prunus Amygdalus Dulcis (Sweet Almond) Oil, Sesamum Indicum (Sesame) Seed Oil, Parfum, Vitis Vinifera (Grape) Seed Oil, Argania Spinosa Kernel Oil, Rosa Canina Fruit Oil, Tocopheryl Acetate"
        }
    },
    packages: {
        questions: [
            "Hvað er innifalið í Sér og Saman pökkunum?",
            "Hver er munurinn á Sér og Saman?",
            "Hvernig er Sér pakkinn öðruvísi en Saman?",
            "Geturðu útskýrt Sér og Saman pakkana?",
            "Hverjir eru valmöguleikarnir?",
            "Hvað kostar inn?",
            "Hvaða pakka á ég að velja?"
        ],
        taglines: {
            main: "Finndu þína leið að hugarró",
            location: "Þú finnur okkur þar sem himinn og haf renna saman"
        },
        saman: {
            name: "Saman aðgangur",
            subtitle: "Almenn búningsaðstaða",
            description: "Vinsælasta leiðin okkar. Hún veitir aðgang að almennri búningsaðstöðu ásamt sjö skrefa Skjól Ritúal meðferðinni. [Skoða Saman aðgang] (https://www.skylagoon.com/is/leidir-til-ad-njota)",
            pricing: {
                weekday: {
                    range: "12.990 ISK",
                    days: "Mánudaga til fimmtudaga",
                    // best_value: "Kvöldbókanir (19:30 - 20:30)"
                },
                weekend: {
                    range: "14.990 ISK",
                    days: "Föstudaga til sunnudaga"
                }
            },
            youth_pricing: {
                description: "Sérstakt verð fyrir gesti á aldrinum 12-14 ára",
                note: "Börn sem verða 12 ára á almanaksárinu geta keypt unglingamiða",
                requirements: "Verða að vera í fylgd forráðamanna (18 ára eða eldri)",
                weekday: {
                    price: "6.495 ISK",
                    days: "Mánudaga til fimmtudaga"
                },
                weekend: {
                    price: "7.495 ISK",
                    days: "Föstudaga til sunnudaga"
                }
            },
            includes: [
                "Aðgangur að Sky Lagoon",
                "Eitt ferðalag í gegnum sjö skrefa Skjól Ritúalið",
                "Almenn búningsaðstaða og Sky Lagoon hárvörur",
                "Handklæði"
            ]
        },
        ser: {
            name: "Sér aðgangur",
            subtitle: "Vel búnir einkaklefar",
            description: "Viltu aukið næði og meiri þægindi? Sér leiðin veitir aðgang að vel búnum einkaklefa með snyrtiaðstöðu og sturtu. [Skoða Sér aðgang] (https://www.skylagoon.com/is/leidir-til-ad-njota)",
            pricing: {
                weekday: {
                    range: "15.990 ISK",
                    days: "Mánudaga til fimmtudaga",
                    // best_value: "Kvöldbókanir (19:30 - 20:30)"
                },
                weekend: {
                    range: "17.990 ISK",
                    days: "Föstudaga til sunnudaga"
                }
            },
            youth_pricing: {
                description: "Sérstakt verð fyrir gesti á aldrinum 12-14 ára",
                note: "Börn sem verða 12 ára á almanaksárinu geta keypt unglingamiða",
                requirements: "Verða að vera í fylgd forráðamanna (18 ára eða eldri)",
                weekday: {
                    price: "7.995 ISK",
                    days: "Mánudaga til fimmtudaga"
                },
                weekend: {
                    price: "8.995 ISK",
                    days: "Föstudaga til sunnudaga"
                }
            },
            includes: [
                "Aðgangur að Sky Lagoon",
                "Eitt ferðalag í gegnum sjö skrefa Skjól Ritúalið",
                "Einkaklefi með sturtu ásamt Sky Lagoon hár- og húðvörum",
                "Handklæði"
            ]
        },
        stefnumot: {
            name: "Stefnumót í Sky Lagoon",
            tagline: "Njóttu Sky Lagoon með þeim sem þér þykir vænt um, hvort sem það er maki, foreldri eða vinur. [Skoða stefnumótspakka] (https://www.skylagoon.com/is/stefnumot)",
            important_note: "Athugið að Smakk Bar tekur síðustu pantanir 30 mínútum fyrir lokun.",
            ser: {
                name: "Sér Stefnumót",
                price: "Verð frá ISK 39,480",
                includes: [
                    "2 x Sér passar",
                    "Drykkur á mann (vín hússins, af krana eða óáfengt)",
                    "Sky sælkeraplatti á Smakk Bar"
                ]
            },
            saman: {
                name: "Saman Stefnumót",
                price: "Verð frá ISK 33,480",
                includes: [
                    "2 x Saman passar",
                    "Drykkur á mann (vín hússins, af krana eða óáfengt)",
                    "Sky sælkeraplatti á Smakk Bar"
                ]
            },
            booking_info: {
                last_booking: "18:00",
                note: "Síðasti bókunartími fyrir Stefnumót pakka er klukkan 18:00 til að tryggja að þið getið notið allrar þjónustu að fullu"
            }
        }
    },    
    multipass: {
        questions: [
            "Ég vil kaupa multi pass",
            "Hvernig virkar multi passinn?",
            "Get ég keypt fjölnotakort?",
            "Hvernig get ég keypt multi pass?",
            "Hvað er multi pass?",
            "Hversu lengi gildir multi passinn?",
            "Get ég notað multi passann fyrir aðra?",
            "Má deila multi passanum?"
        ],
        marketing: {
            tagline: "Regluleg vellíðan",
            description: "Settu vellíðan og heilsu í fyrsta sæti með Multi-Pass og fáðu sex skipti í Sky Lagoon á um helmings afslætti af hefðbundnu verði. [Skoða Multi-Pass] (https://www.skylagoon.com/is/kaupa-multi-pass)"
        },
        general_info: {
            description: "Multi passi er persónulegt fjölnotakort sem veitir þér sex heimsóknir í Sky Lagoon.",
            validity: "Gildir í 4 ár frá kaupdegi",
            usage_rules: [
                "Hægt að kaupa á vefsíðu okkar eða í móttöku",
                "Gildir einungis fyrir eiganda kortsin",
                "Ekki hægt að deila með öðrum eða bjóða gestum með",
                "Sex skipti fyrir sama einstakling"
            ],
            important_note: "Vinsamlega athugið. Hver passi er fyrir sex heimsóknir eins gests, ekki fyrir hóp gesta."
        },
        types: {
            hefd: {
                name: "Hefð Multi-Pass",
                subtitle: "Skjól Ritúal",
                tagline: "vel búnir einkaklefar",
                description: "Njóttu Sér leiðarinnar með aðgangi að lóninu, sjö skrefa Skjól Ritúal meðferðinni og fullbúnum einkaklefa í sex skipti. [Kaupa Hefð Multi-Pass] (https://www.skylagoon.com/is/kaupa-multi-pass)",
                visits: "6 skipti",
                price: "44,970 ISK"
            },
            venja: {
                name: "Venja Multi-Pass",
                subtitle: "Skjól Ritúal",
                visits: "6 skipti",
                description: "Njóttu Saman leiðarinnar með aðgangi að lóninu og sjö skrefa Skjól Ritúal meðferðinni í sex skipti. [Kaupa Venju Multi-Pass] (https://www.skylagoon.com/is/kaupa-multi-pass)",
                price: "35,970 ISK"
            }
        },
        booking_process: {
            steps: [
                {
                    title: "1. Finndu þér tíma",
                    description: "Skipulegðu heimsóknina þína fyrir fram með því að velja dag- og tímasetningu. [Bóka heimsókn] (https://www.skylagoon.com/is/boka)"
                },
                {
                    title: "2. Ganga frá bókun",
                    description: "Sláðu inn Multi-Pass kóðann þinn í bókuninni þegar þú gengur frá bókuninni. Þú notar sama kóða í öll sex skiptin."
                },
                {
                    title: "3. Láttu þreytuna líða úr þér",
                    description: "Þú færð nýjan miða sendan í tölvupósti. Hafðu þann miða og persónuskilríki með mynd meðferðis þegar þú innritar þig í Sky Lagoon."
                }
            ],
            important_notes: [
                "Hver passi er fyrir sex heimsóknir eins gests",
                "Ekki fyrir hóp gesta",
                "Bókaðu tímann þinn fyrir fram á netinu",
                "Notaðu sama kóða fyrir allar sex heimsóknirnar",
                "Taktu með þér persónuskilríki með mynd við innritun"
            ]
        }
    },
    discounts: {
        questions: [
            "Er afsláttur?",
            "Eruð þið með afslátt?",
            "Er hægt að fá afslátt?",
            "Eru einhver tilboð?",
            "Er hægt að fá betra verð?",
            "Er hægt að spara?",
            "Er eitthvað tilboð í gangi?",
            "Eruð þið með sérkjör?",
            "Er hægt að fá það ódýrara?",
            "Er einhver leið til að spara?",
            "Eruð þið með einhver tilboð?",
            "Er hægt að fá afsláttarkjör?",
            "Ertu með einhvern afsláttarkóða?",
            "Er hægt að fá ódýrari miða?",
            "Eru einhverjir afslættir?",
            "Er hægt að versla miða á ódýrara verði?",
            "Er hægt að fá ódýrari pakka?",
            "Eruð þið með einhver sérkjör?"
        ],
        patterns: [
            "afsláttur",
            "afsláttarkjör",
            "verðlækkun",
            "tilboð",
            "sérkjör",
            "betra verð",
            "spara",
            "sparnaður",
            "ódýrara",
            "lækkað verð",
            "hagstætt verð",
            "hagstæðara",
            "lægra verð",
            "afslætti",  // Added these variations below
            "afsláttarkóði",
            "afsláttarkóða",
            "ódýrari miða",
            "ódýrari pakka"
        ],
        answer: {
            introduction: "Við bjóðum ekki upp á sérstakan afslátt, en Multi-Pass er frábær leið til að spara.",
            description: "Multi-Pass veitir þér sex heimsóknir í Sky Lagoon á um helmingi af venjulegu verði. Passinn gildir í 4 ár frá kaupdegi og er í boði bæði með Saman og Sér pökkunum.",
            options: {
                ser: {
                    name: "Sér Multi-Pass (með einkaklefa)",
                    price: "44.970 kr fyrir 6 skipti",
                    includes: [
                        "Aðgangur að lóninu",
                        "Skjól Ritúal meðferð",
                        "Einkaklefi með sturtu"
                    ]
                },
                saman: {
                    name: "Saman Multi-Pass (með almennum klefa)",
                    price: "35.970 kr fyrir 6 skipti",
                    includes: [
                        "Aðgangur að lóninu",
                        "Skjól Ritúal meðferð",
                        "Almenn búningsaðstaða"
                    ]
                }
            },
            important_note: "Multi-Pass er persónubundinn og gildir einungis fyrir eiganda kortsins - ekki er hægt að deila með öðrum eða bjóða gestum með.",
            additional_info: "Ef þú hefur sérstakar spurningar um verð eða afsláttarmöguleika, ekki hika við að hafa samband við okkur á reservations@skylagoon.is."    
        }
    },
    gift_cards: {
        questions: [
            // Existing questions
            "Get ég keypt gjafakort?",
            "Hvernig nota ég gjafabréf?",
            "Ég er með gjafabréf í Sky Lagoon, hvernig bóka ég?",
            "Ég á gjafabréf í Saman Pass, get ég notað það upp í Sér Pass?",
            "Get ég uppfært gjafabréfið mitt?",
            "Má breyta gjafabréfi í dýrari pakka?",
            "Hvernig nota ég gjafabréf upp í Sér Pass?",
            // Add new purchase-related questions
            "Hvernig kaupi ég gjafabréf?",
            "Hvar get ég keypt gjafabréf?",
            "Get ég keypt gjafabréf á netinu?",
            "Hvað kostar gjafabréf?",
            "Langar að kaupa gjafabréf",
            // Add legacy gift card questions
            "Er með pure gjafabréf",
            "Er með pure pass",
            "Er með pure leiðina",
            "Er með sky pass",
            "Er með sky gjafabréf",
            "Pure pass á íslensku",
            "Hvað heitir pure leiðin núna",
            "Hvað heitir sky leiðin núna",
            "Hvað heitir pure pass á íslensku",
            "Hvað heitir sky pass á íslensku",
            "Pure leiðin á íslensku",
            "Sky leiðin á íslensku"
        ],
        marketing: {
            tagline: "Gjafakort frá Sky Lagoon [Skoða gjafakort] (https://www.skylagoon.com/is/kaupa-gjafakort)",
            description: "Gjafakort Sky Lagoon er fullkomið fyrir öll þau sem vilja gefa gjöf sem endurnærir bæði sál og líkama. Fátt er betra en að slaka á undir berum himni í heitu baðlóni í stórbrotnu umhverfi og anda að sér fersku sjávarlofti í amstri hversdagsins."
        },
        legacy_names: {
            important_note: "Mikilvægt: Heiti pakkanna okkar hafa verið uppfærð. Eldri gjafakort eru enn í gildi.",
            name_changes: {
                pure_pass: {
                    old_name: "Pure Pass (áður Pure leiðin)",
                    current_name: "Saman Pass",
                    booking_instructions: "Pure Pass gjafakort er hægt að nota til að bóka Saman Pass á netinu",
                    response: "Pure leiðin heitir núna Saman leiðin. Þú getur notað Pure gjafakortið þitt til að bóka Saman Pass á netinu. Gjafakortið þitt er ennþá í fullu gildi."
                },
                sky_pass: {
                    old_name: "Sky Pass (áður Sky leiðin)",
                    current_name: "Sér Pass",
                    booking_instructions: "Sky Pass gjafakort er hægt að nota til að bóka Sér Pass á netinu",
                    response: "Sky leiðin heitir núna Sér leiðin. Þú getur notað Sky gjafakortið þitt til að bóka Sér Pass á netinu. Gjafakortið þitt er ennþá í fullu gildi."
                },
                pure_lite: {
                    note: "Pure Lite pakkinn (aðeins aðgangur að lóni, ekki að ritúali) er ekki lengur í boði. Aðeins Saman og Sér passar eru í boði núna, báðir með aðgang að ritúalinu.",
                    response: "Pure Lite pakkinn er því miður ekki lengur í boði. Núna bjóðum við upp á Saman og Sér passa, sem báðir innihalda aðgang að ritúalinu."
                }
            },
            booking_process: {
                steps: [
                    "Veldu dagsetningu á heimasíðunni",
                    "Sláðu inn gjafakortskóðann í bókunarferlinu",
                    "Þú færð senda bókunarstaðfestingu í tölvupósti"
                ],
                assistance: "Fyrir aðstoð með eldri gjafakort eða pakkaskilgreiningar, vinsamlegast hafðu samband við reservations@skylagoon.is"
            },
            general_response: {
                has_pure: "Pure leiðin heitir núna Saman leiðin. Þú getur notað Pure gjafakortið þitt til að bóka Saman Pass á netinu. Hér er hvernig þú bókar:",
                has_sky: "Sky leiðin heitir núna Sér leiðin. Þú getur notað Sky gjafakortið þitt til að bóka Sér Pass á netinu. Hér er hvernig þú bókar:",
                assistance: "Ef þú þarft aðstoð með eldri gjafakort eða bókun, ekki hika við að hafa samband við okkur á reservations@skylagoon.is eða í síma 527 6800."
            }
        },
        purchase_info: {
            methods: "Þú getur keypt gjafabréf beint á vefsíðu okkar skylagoon.is eða í móttökunni okkar.",
            options: "Við bjóðum upp á nokkrar gerðir af gjafabréfum:",
            online_steps: [
                "Farðu á skylagoon.is",
                "Veldu 'Kaupa gjafakort'",
                "Veldu gjafakort sem hentar þér",
                "Kláraðu kaupin í gegnum örugga greiðslugátt"
            ]
        },
        types: {
            ser: {
                name: "Sér gjafakort",
                subtitle: "Skjól Ritúal",
                subtitle2: "vel búnir einkaklefar",
                description: "Gefðu gjafakort í Sér leiðina sem veitir aðgang að lóninu, sjö skrefa Skjól Ritúal meðferðinni og vel búnum einkaklefa. [Kaupa Sér gjafakort] (https://www.skylagoon.com/is/kaupa-gjafakort)",
                price: "ISK 14,990"
            },
            saman: {
                name: "Saman gjafakort",
                subtitle: "Skjól Ritúal",
                description: "Gefðu gjafakort í klassísku Saman leiðina með aðgangi að lóninu og sjö skrefa Skjól Ritúal meðferðinni. [Kaupa Saman gjafakort] (https://www.skylagoon.com/is/kaupa-gjafakort)",
                price: "ISK 11,990"
            },
            stefnumot: {
                name: "Stefnumót",
                description: "Með Sér eða Saman stefnumóti geta tvö deilt sinni upplifun og notið bæði matar og drykkjar. [Skoða stefnumótspakka] (https://www.skylagoon.com/is/stefnumot)",
                important_note: "Athugið: Gjafakortin eru afhent sem tvö kort sem þarf að bóka saman til að njóta upplifunarinnar. Ekki er hægt að bóka í sitthvoru lagi.",
                types: {
                    saman: {
                        name: "Saman stefnumót",
                        price: "ISK 33,480",
                        description: "Inniheldur Saman aðgang, einn frískandi drykk á mann og ljúffengan sælkeraplatta á Smakk Bar."
                    },
                    ser: {
                        name: "Sér stefnumót",
                        price: "ISK 39,480",
                        description: "Inniheldur Sér aðgang, einn frískandi drykk á mann og ljúffengan sælkeraplatta á Smakk Bar."
                    }
                }
            }
        },
        booking: {
            instructions: "Til þess að innleysa gjafakortið þitt þá mælum við með að þú bókir tíma fyrirfram á netinu með góðum fyrirvara. [Bóka heimsókn] (https://www.skylagoon.com/is/boka)",
            steps: [
                "Velur dagsetningu",
                "Slærð inn kóða gjafakorts í viðeigandi dálk í næsta skrefi bókunarferlisins",
                "Færð senda bókunarstaðfestingu í tölvupósti"
            ],
            upgrade_info: {
                ser_from_saman: {
                    possible: true,
                    instructions: "Já, þú getur notað Saman gjafabréfið þitt upp í Sér aðgang. Þegar þú bókar, veldu Sér aðgang á heimasíðunni, sláðu inn gjafakortsnúmerið þitt í bókunarferlinu og þú getur greitt eftirstöðvarnar með greiðslukorti.",
                    process: [
                        "Veldu Sér aðgang þegar þú bókar á heimasíðunni",
                        "Sláðu inn gjafakortsnúmerið þitt í bókunarferlinu",
                        "Kerfið reiknar sjálfkrafa mismuninn",
                        "Greiddu eftirstöðvarnar með greiðslukorti til að ljúka bókuninni"
                    ],
                    contact: "Ef þú lendir í vandræðum, ekki hika við að hafa samband við okkur á reservations@skylagoon.is eða í síma +354 527 6800."
                }
            }
        }

    },
    dining: {
        questions: [
            // Original questions (keep all existing ones)
            "Hvað er í boði á Smakk Bar?",
            "Hvar get ég fengið að borða?",
            "Er veitingastaður á staðnum?",
            "Eruð þið með mat?",
            "Hvernig er matseðillinn?",
            "Er hægt að fá mat?",
            "Hvað er í boði að borða?",
            "Er hægt að fá mat í lóninu?",
            "Hvaða veitingar eru í boði?",
            "Er kaffihús á staðnum?",
            "Er hægt að fá kaffi?",
            "Hvað er í boði á Keimur Café?",
            // New questions from website
            "Hvað er á matseðlinum?",
            "Hvernig mat eruð þið með?",
            "Er hægt að fá mat eftir laugina?",
            "Hvað er Smakk Bar?",
            "Get ég fengið að borða eftir dvölina?"
        ],
        overview: {
            // Enhanced with official website content
            tagline: "Sælkeraferðalag um Ísland",
            description: "Keimur Café og Smakk Bar bjóða bragðlaukunum í spennandi ferðalag þar sem ferskt íslenskt hráefni er í aðalhlutverki. [Skoða veitingastaði] (https://www.skylagoon.com/is/matur-og-drykkur)",
            encouragement: "Njóttu augnabliksins lengur með viðkomu á Keimur Café eða Smakk Bar eftir dvölina í lóninu."
        },
        venues: {
            smakk_bar: {
                name: "Smakk Bar",
                tagline: "Ferðalag fyrir bragðlaukana á Smakk Bar [Skoða Smakk Bar] (https://www.skylagoon.com/is/matur-og-drykkur/smakk-bar)",
                // Enhanced description from website
                description: "Á Smakk Bar bjóðum við upp á nokkra sérvalda íslenska sælkeraplatta ásamt frábæru úrvali af víni, bjór og öðrum drykkjum. Sælkeraplattarnir innihalda sérvalda bita sem mynda fullkomið jafnvægi og eru settir saman úr árstíðabundnu hráefni. Tilvalin leið til að ljúka góðri heimsókn í Sky Lagoon.",
                dietary_options: "Boðið er upp á vegan og glútenlausa valkosti.",
                // New section from website content
                about: {
                    title: "Óður til íslenskrar matarmenningar",
                    description: "Í Sky Lagoon leggjum við áherslu á að kynna íslenskar hefðir og menningu fyrir gestum. Þar skipar matur stóran sess og því höfum við leitað til matreiðslufólks sem nýtir ferskt íslenskt hráefni á nýjan og spennandi máta. Íslendingar ættu því að rekast á kunnuglega rétti á matseðlinum á Smakk Bar en þó í nýjum og framandi búningi",
                    highlights: [
                        "Einstakir óðalsostar",
                        "Íslenskir sjávarréttir",
                        "Hráefni úr héraði"
                    ]
                },
                // New section from website content
                production: {
                    title: "Íslensk framleiðsla",
                    description: "Við vinnum með fjölskyldufyrirtækjum sem hafa íslenska matarhefð í heiðri. Við vöndum valið til að tryggja að útkoman verði eins góð og hugsast getur.",
                    sourcing: "Hráefnin koma alls staðar að á landinu. Villibráðin er frá feðgum í Landeyjum, síldin frá Djúpavogi, ostarnir úr Dölunum og sultan frá Fljótsdalshéraði. Saman verða þessi gæðahráefni að ógleymanlegu ferðalagi fyrir bragðlaukana."
                },
                menu: {
                    small_platters: {
                        name: "Litlir plattar",
                        items: [
                            {
                                name: "Óður til íslenskra osta",
                                description: "Rjómakenndi mygluosturinn Auður, blámygluosturinn Ljótur, hinn bragðmikli Feykir frá Goðdölum og gómsæt lífræn aðalbláberjasulta frá Vallanesi í Fljótsdalshéraði. Borið fram með nýbökuðu brauði.",
                                price: "ISK 2,490"
                            },
                            {
                                name: "Hafið gefur",
                                description: "Úrval úr íslenskum vötnum. Kryddlegin síld á rúgbrauði með rauðbeðum og graflax með graflaxssósu úr sinnepi og dilli. Borið fram með nýbökuðu brauði.",
                                price: "ISK 2,590"
                            },
                            {
                                name: "Sætur endir",
                                subtitle: "Tilvalið til að deila",
                                description: "Úrval gómsætra súkkulaðimola frá Nóa Siríus ásamt ostunum Auði úr Dölunum og hinum skagfirska Feyki, borið fram með lífrænni aðalbláberjasultu.",
                                price: "ISK 2,190"
                            }
                        ]
                    },
                    large_platters: {
                        name: "Stórir plattar",
                        items: [
                            {
                                name: "Jólasælkeraplattinn",
                                subtitle: "Aðeins yfir hátíðarnar",
                                description: "Tilvalið að deila. Heimsókn yfir jólatímann kallar á einstaka stund með sérstökum hátíðarplatta með hangikjöti, graflax, jólasíld, laufabrauði og klassískum jólaeftirrétt. Borið fram með súrdeigsbrauði.",
                                price: "ISK 9,590"
                            },
                            {
                                name: "Til sjávar og sveita",
                                description: "Sérútbúinn graflax ásamt heimagerðri graflaxssósu, grafið ærfillet með dýrindis piparrótarsósu, kryddlegin síld á rúgbrauði með rauðbeðum, blámygluosturinn Ljótur og hinn bragðmikli Feykir ásamt lífrænni bláberjasultu frá Íslenskri hollustu. Borið fram með nýbökuðu brauði.",
                                price: "ISK 7,090"
                            },
                            {
                                name: "Sky plattinn",
                                subtitle: "Tilvalið að deila",
                                description: "Bragð af því besta. Ostarnir Auður og Feykir með lífrænni aðalbláberjasultu. Villibráðarpaté úr hreindýri, svínakjöti og villigæs með rauðlaukssultu, sérútbúinn graflax ásamt heimagerðri graflaxssósu, gómsæt hjónabandssæla. Borið fram með nýbökuðu brauði.",
                                price: "ISK 7,190"
                            },
                            {
                                name: "Sá Góðlyndi Vegan Plattinn",
                                description: "Ljúffengur fetaostur með súrsuðu rauðmeti, döðlu- og rauðrófumauk borið fram á nýbökuðu rúgbrauði, klassískt sælkerasúrkál, ferskur hummus, ólífur og dýrindis hnetukaka (inniheldur jarðhnetur). Borið fram með nýbökuðu brauði.",
                                dietary: "Vegan",
                                price: "ISK 6,890"
                            }
                        ]
                    },
                    opening_hours: {
                        winter: {
                            period: "Frá 1. október til 17. maí",
                            hours: "12:00--21:30",
                            days: "alla daga"
                        },
                        summer: {
                            period: "Frá 18. maí til 14. ágúst",
                            hours: "12:00--22:30",
                            days: "alla daga"
                        },
                        autumn: {
                            period: "Frá 15. ágúst til 30. september",
                            weekday: {
                                days: "sunnudaga til föstudaga",
                                hours: "11:00--22:30"
                            },
                            weekend: {
                                days: "laugardaga",
                                hours: "10:00--22:30"
                            }
                        }
                    }
                },  // This closes menu
            },      // This closes smakk_bar
            keimur_cafe: {
                name: "Keimur Café",
                tagline: "Notaleg stund á Keimur Café [Skoða Keimur Café] (https://www.skylagoon.com/is/matur-og-drykkur/keim-cafe)",
                description: "Á Keimur Café finnur þú gæðakaffi frá Te & Kaffi, frískandi drykki, ljúffengar súpur og nýbakað lostæti frá einu elsta bakarí landsins, Sandholt Bakarí.",
                intro: "Eigðu ljúfa stund á Keim Café",
                encouragement: "Njóttu augnabliksins lengur með viðkomu á Keimur Café eftir dvölina í lóninu",
                dietary_options: "Hér finnur þú einnig glútenlausa og vegan valkosti.",
                additional_info: "Á Keim Café getur þú sest niður með góðan kaffibolla og notið augnabliksins. Þar bjóðum við líka upp á nýbakað kruðerí, súpur og samlokur.",
                menu: {
                    hot_drinks: {
                        name: "Heitir drykkir",
                        items: [
                            {
                                name: "Kaffi",
                                price: "ISK 690"
                            },
                            {
                                name: "Americano",
                                price: "ISK 690"
                            },
                            {
                                name: "Espresso",
                                price: "ISK 590"
                            },
                            {
                                name: "Tvöfaldur Espresso",
                                price: "ISK 650"
                            },
                            {
                                name: "Cappuccino",
                                price: "ISK 780"
                            },
                            {
                                name: "Tvöfaldur Cappuccino",
                                price: "ISK 810"
                            },
                            {
                                name: "Latte",
                                price: "ISK 790"
                            },
                            {
                                name: "Tvöfaldur Latte",
                                price: "ISK 820"
                            },
                            {
                                name: "Te",
                                price: "ISK 650"
                            }
                        ]
                    },
                    food: {
                        name: "Matur",
                        description: "Á Keimur Café finnur þú ljúffengar súpur og nýbakað lostæti frá einu elsta bakarí landsins.",
                        items: [
                            {
                                name: "Súpa dagsins",
                                description: "Ljúffeng súpa dagsins, borin fram með nýbökuðu brauði",
                                price: "ISK 2,490"
                            },
                            {
                                name: "Grilluð súrdeigssamloka með skinku og osti",
                                description: "Heimalöguð súrdeigssamloka með gæðahráefni",
                                price: "ISK 2,190"
                            },
                            {
                                name: "Grilluð súrdeigssamloka með grænmeti",
                                description: "Ljúffeng grænmetissamloka á nýbökuðu súrdeigsbrauði",
                                price: "ISK 1,990"
                            },
                            {
                                name: "Beygla með graflax",
                                description: "Fersk beygla með graflax og heimagerðri graflaxsósu",
                                price: "ISK 2,390"
                            },
                            {
                                name: "Beygla með hummus",
                                description: "Fersk beygla með heimagerðu hummus og grænmeti",
                                price: "ISK 1,990"
                            },
                            {
                                name: "Skyrið hennar ömmu með berjum og rjóma",
                                description: "Hefðbundið íslenskt skyr með ferskum berjum og rjóma",
                                price: "ISK 1,890"
                            },
                            {
                                name: "Skyr með múslí og berjum",
                                description: "Ferskt skyr með heimagerðu múslí og berjum",
                                price: "ISK 1,890"
                            }
                        ]
                    },
                    bakery: {
                        name: "Bakkelsi",
                        description: "Það besta frá bakaranum hverju sinni frá Sandholt Bakaríi.",
                        highlight: "Nýbakað kruðerí og sætmeti frá einu elsta bakaríi landsins"
                    }
                }
            },
            gelmir_bar: {
                name: "Gelmir Bar",
                tagline: "Fullkomnaðu augnablikið á Gelmir Bar [Skoða Gelmir Bar] (https://www.skylagoon.com/is/matur-og-drykkur/gelmir-bar)",
                description: "Gelmir bar er staðsettur ofan í lóninu. Þar er boðið upp á fjölbreytt úrval áfengra og óáfengra drykkja sem þú getur notið í heitu lóninu. Einfalt er að ganga frá pöntun með því að skanna armbandið þitt.",
                menu: {
                    draft_beers: {
                        name: "Á krana",
                        items: [
                            {
                                name: "Gull",
                                description: "Lager 4%",
                                price: "ISK 1,890"
                            },
                            {
                                name: "Somersby",
                                description: "Epla Cider 4,5%",
                                price: "ISK 1,990"
                            },
                            {
                                name: "Freyðivín",
                                description: "11%",
                                price: "ISK 2,290"
                            },
                            {
                                name: "Monalto Rosé",
                                description: "11%",
                                price: "ISK 2,490"
                            },
                            {
                                name: "Hvítvín",
                                description: "11%",
                                price: "ISK 2,090"
                            },
                            {
                                name: "Hanastél",
                                description: "8.2-10%",
                                price: "ISK 2,690"
                            }
                        ]
                    },
                    bubbles_wine: {
                        name: "Búbblur & vín",
                        items: [
                            {
                                name: "Moët & Chandon Brut Impérial",
                                description: "12%",
                                price: "ISK 3,490"
                            },
                            {
                                name: "Töst",
                                description: "Freyðandi hvítt te 0.0%",
                                price: "ISK 1,190"
                            },
                            {
                                name: "Töst Rosé",
                                description: "Áfengislaust",
                                price: "ISK 1,190"
                            },
                            {
                                name: "Límonaði",
                                description: "Áfengislaust",
                                price: "ISK 1,490"
                            },
                            {
                                name: "Límonaði rabarbara",
                                description: "Áfengislaust",
                                price: "ISK 1,490"
                            }
                        ]
                    },
                    other_drinks: {
                        name: "Aðrir drykkir",
                        items: [
                            {
                                name: "Úlfrún",
                                description: "Session IPA, 4,5%",
                                price: "ISK 1,790"
                            },
                            {
                                name: "Gull Lite",
                                description: "Glúteinlaus Lager, 4,4%",
                                price: "ISK 1,690"
                            },
                            {
                                name: "Bríó",
                                description: "Áfengislaus hveitibjór",
                                price: "ISK 1,190"
                            },
                            {
                                name: "Gos",
                                description: "Blandað úrval",
                                price: "ISK 590"
                            },
                            {
                                name: "Collab",
                                description: "Koffíndrykkur",
                                price: "ISK 790"
                            },
                            {
                                name: "Safi",
                                description: "Heilsusafi",
                                price: "ISK 590"
                            },
                            {
                                name: "Árstíðarbundinn drykkur",
                                description: "Blandað úrval",
                                price: "ISK 1,890"
                            }
                        ]
                    },
                    important_info: {
                        drink_limit: "Hver fullorðinn gestur má neyta allt að þriggja áfengra drykkja meðan á heimsókn stendur.",
                        payment: "Einfalt er að ganga frá pöntun með því að skanna armbandið þitt.",
                        restrictions: "Ölvuðum er óheimill aðgangur í lónið."
                    }
                }
            }
        },
    },
    transportation: {
        questions: [
            "Hvernig kemst ég í Sky Lagoon?",
            "Hvar er Sky Lagoon?",
            "Hvernig er best að komast í Sky Lagoon?",
            "Hver er staðsetningin?",
            "Hvaða samgöngur eru í boði?",
            "Hvernig kemst ég á staðinn?",
            "Hversu löng er akstursleiðin?",
            "Hvernig er best að keyra?",
            "Hvað tekur langan tíma að keyra?",
            "Hvernig kemst ég frá BSÍ?",
            "Er bílastæði við Sky Lagoon?",
            "Hvar get ég lagt bílnum?",
            "Er gjaldfrjáls bílastæði?",
            "Get ég lagt bílnum frítt?",
            "Er næg bílastæði?",
            "Þarf að borga fyrir bílastæði?",
            "Er hægt að taka strætó?",
            "Er hægt að ganga?",
            "Er hægt að hjóla?",
            "Hvernig kemst ég með almenningssamgöngum?"
        ],
        location: {
            // Enhanced with official website phrasing
            address: "Vesturvör 44-48, 200 Kópavogi",
            tagline: "Þú finnur okkur þar sem himinn og haf renna saman",
            position: "Á ysta odda Kársness í Kópavogi [Skoða á korti 📍] (https://www.google.com/maps/dir//Vesturv%C3%B6r+44,+200+K%C3%B3pavogur)",
            distance: "7 kilómetrar frá miðborg Reykjavíkur",
            landmark_distances: {
                perlan: "9 mínútur",
                hallgrimskirkja: "12 mínútur",
                harpa: "14 mínútur",
                bsi: "9 mínútur",
                keflavik: "45 mínútur"
            }
        },
        transport_options: {
            car: {
                directions_from_reykjavik: "Fylgdu Kringlumýrarbraut (leið 40) að Kársnesbraut, þaðan á Vesturvör [Skoða leiðarlýsingu] (https://www.skylagoon.com/is/heimsokn/stadsetning)",
                driving_times: {
                    from_center: "13-15 mínútur frá miðborg Reykjavíkur",
                    from_perlan: "9 mínútur",
                    from_hallgrimskirkja: "12 mínútur",
                    from_harpa: "14 mínútur",
                    from_bsi: "9 mínútur"
                }
            },
            public_transport: {
                description: "Auðvelt er að komast í Sky Lagoon með strætó [Skoða strætóleiðir] (https://www.straeto.is)",
                bus: {
                    route_1: {
                        bus_number: "4",
                        from: "Hlemmur",
                        to: "Hamraborg",
                        duration: "15 mínútur"
                    },
                    route_2: {
                        bus_number: "35",
                        from: "Hamraborg",
                        to: "Hafnarbraut",
                        duration: "4 mínútur"
                    },
                    final_leg: "Stutt ganga meðfram sjónum að Sky Lagoon",
                    more_info: "Fyrir nánari upplýsingar um tímatöflur og leiðir, heimsækið: [straeto.is] (https://straeto.is)"
                }
            },
            walking_cycling: {
                description: "Stutt akstursleið liggur í Sky Lagoon hvaðanæva af höfuðborgarsvæðinu. Einnig liggja hjóla- og gönguleiðir að lóninu og því er tilvalið að velja umhverfisvæna ferðamáta sem eru að sama skapi góðir fyrir líkama og sál. [Skoða leiðir] (https://www.skylagoon.com/is/heimsokn/stadsetning)",
                distance: "6 kílómetrar (3.7 mílur)",
                duration: "um það bil 1,5 klukkustund",
                route: "Fylgdu Rauðarárstíg (5.9km) → Suðurhlíð → Vesturvör"
            },
            shuttle_service: {
                provider: "Reykjavík Excursions [Skoða Reykjavík Excursions] (https://www.re.is/is)",
                from_bsi: {
                    departures: ["13:00", "15:00", "17:00", "19:00"],
                    location: "BSÍ rútumiðstöð",
                    type: "Beinar tengiferðir að Sky Lagoon"
                },
                hotel_pickup: {
                    timing: "Hefst 30 mínútum fyrir valinn tíma",
                    important_notes: [
                        "Vertu tilbúin/n og sýnileg/ur við tilgreindan strætóstað eða fyrir utan hótel",
                        "Hringdu í +354 580 5400 ef rúta er ekki mætt 20 mínútum eftir upphafstíma",
                        "Ef þú missir af sækju þarft þú að komast á BSÍ á eigin kostnað fyrir brottfarartíma"
                    ]
                }
            }
        },
        parking: {
            availability: "Ókeypis bílastæði fyrir alla gesti okkar",
            location: "Bílastæðin eru staðsett rétt við aðalinngang Sky Lagoon",
            time_limit: "engin tímamörk á dvöl",
            features: [
                "Rúmgott bílastæði",
                "Engin bílastæðagjöld",
                "Engin tímatakmörk",
                "Rafhleðslustöðvar",
                "Vel upplýst, vaktað bílastæði",
                "Auðveldur aðgangur að aðalinngangi",
                "Aðgengileg bílastæði í boði"
            ]
        },
        eco_friendly: {
            description: "Að Sky Lagoon liggja göngu- og hjólaleiðir sem bjóða upp á umhverfisvænar samgöngur. Einnig er þægilegt að nýta hlaupahjólaleigur eða almenningssamgöngur til að komast á áfangastað.",
            options: [
                "Gönguleiðir",
                "Hjólaleiðir",
                "Almenningssamgöngur",
                "Hlaupahjólaleigur"
            ],
            more_info: "Kynntu þér mögulegar leiðir á straeto.is"
        }
    },
    health_safety: {
        questions: [
            "Er óhætt fyrir óléttar konur að fara í lónið?",
            "Mega barnshafandi konur fara í lónið?",
            "Er Sky Lagoon öruggt fyrir þungaðar konur?",
            "Mér líður ekki vel. Ætti ég samt að fara ofan í?",
            "Er í lagi að vera með gleraugu í lóninu?",
            "Get ég verið með gleraugu?",
            "Má fara með gleraugu í lónið?",
            "Er óhætt að vera með gleraugu?"
        ],
        pregnancy: {
            main_info: "Undir eðlilegum kringumstæðum er óhætt fyrir barnshafandi konur að fara í lónið, hitastig lónsins er 38C°.",
            responsibility: "Hver og einn einstaklingur er hins vegar ábyrgur fyrir eigin heilsu og vellíðan.",
            recommendation: "Barnshafandi konum er ráðlagt að meta líkamlegt ástand sitt áður þær fara ofan í lónið þar sem líkaminn bregst misvel við heitu vatni. Við mælum með að drekka nóg af vatni á meðan dvalið er í lóninu."
        },
        medical_conditions: {
            info: "Ef þú ert með undirliggjandi sjúkdóma, t.d. flogaveiki, sem gætu leitt til þess að þú óskir eftir auknu eftirliti með þér á meðan á dvöl þinni í lóninu stendur, þá bjóðum við upp á sjálflýsandi armbönd í móttökunni og látum gæsluna okkar vita af þér."
        },
        glasses: {
            main_info: "Það er í góðu lagi að fara með gleraugu ofan í en við mælum alls ekki með að fara með þau í þurrgufuna þar sem þau gætu eyðilagst út af hitanum. Ef þú mætir með gleraugu þá getur starfsfólkið okkar í torfbænum geymt þau fyrir þig á meðan þú ferð í gegn.",
            disclaimer: "Þar sem umhverfið í lóninu og Torfhúsinu er blautt, rakt og með mismunandi hitastig, mælum við með því að fylgja ávallt leiðbeiningum framleiðanda um notkun til að forðast skemmdir á persónulegum munum. Sky Lagoon ber ekki ábyrgð á tjóni eða skemmdum á persónulegum munum gesta."
        },
        safety_emphasis: {
            title: "Öryggi er mikilvægasta grunngildið okkar",
            description: "Með loforði Sky Lagoon um öryggi skuldbindum við okkur til að tryggja öryggi og velferð gesta jafnt sem starfsfólks.",
            commitment: "Með þessum verkferlum munum við tryggja að gestir Sky Lagoon upplifi öryggi í hvívetna á meðan á heimsókninni stendur."
        },
        cleanliness: {
            title: "ÞRIF: Hertar kröfur um hreinlæti og sótthreinsun",
            points: [
                "Við vinnum eftir ströngum stöðlum við öll regluleg þrif dagsins í sameiginlegum rýmum.",
                "Í búningsklefum eru engir ónauðsynlegir snertifletir."
            ]
        },
        staff_training: {
            title: "UPPLÝSINGAGJÖF: Ströng þjálfun og upplýsingagjöf starfsfólks",
            points: [
                "Við erum mjög meðvituð um mikilvægi þess að tryggja öryggi starfsfólks, gesta og samfélagsins alls. Allar okkar ráðstafanir um sótthreinsun eru vel kynntar og útskýrðar með skýrum hætti til að þær skili tilætluðum árangri.",
                "Þjálfun starfsfólks felur í sér stranga þjálfun á sviði hreinlætis og öryggis.",
                "Merkingar á staðnum og samskipti við gesti áður en þeir mæta skulu ávallt vera skýr.",
                "Við höfum sett okkur starfsreglur til að takast á við tilfallandi veikindi gesta og starfsfólks og tryggja þannig heilsu annarra í leiðinni og samfélagsins í heild."
            ]
        },
        wellness_approach: {
            title: "HUGARRÓ: Jákvæð nálgun",
            points: [
                "Mikilvægur þáttur í framúrskarandi þjónustu okkar og gestrisni er að vera hvatning annarra til góðra verka. Við metum bjartsýni og gleymum aldrei gleðinni.",
                "Við trúum því að stórfenglegir staðir á borð við Sky Lagoon hafa heilandi áhrif og veiti gestum og starfsfólki okkar innblástur í bæði leik og starfi. Það gleður okkur mikið að geta boðið gestum okkar að upplifa krafta þessa nýja baðlóns."
            ]
        }
    },
    booking: {
        questions: [
            "Hvað gerist ef ég mæti of seint?",
            "Get ég mætt seinna?",
            "Hvað ef ég næ ekki að mæta á réttum tíma?",
            "Er svigrúm með mætingartíma?",
            "Get ég endurbókað?",
            "Hvað geri ég ef veðrið er slæmt?",
            "Get ég frestað komu minni?",
            "Get ég breytt bókuninni minni?",
            "Get ég breytt tímanum mínum?"
        ],
        booking_changes: {
            info: {
                policy: "Þú getur breytt bókun með 24 klst fyrirvara fyrir einstaklinga (1-9 gestir).",
                instructions: "Til að breyta bókun þinni getur þú:",
                methods: {
                    phone: {
                        text: "Hringt í okkur í síma +354 527 6800 (opið 9:00-18:00)",
                        number: "+354 527 6800",
                        hours: "9:00 - 18:00"
                    },
                    email: {
                        text: "Sent tölvupóst á reservations@skylagoon.is",
                        address: "reservations@skylagoon.is"
                    }
                },
                requirements: "Vinsamlegast láttu fylgja með í tölvupósti:",
                details: [
                    "Bókunarnúmer",
                    "Hvort þú viljir breyta dagsetningu eða fá endurgreiðslu"
                ]
            }
        },
        late_arrival: {
            grace_period: {
                main: "Þú hefur alltaf 30 mín til að mæta (t.d. fyrir bókun kl. 12:00 er mætingartími 12:00-12:30).",
                waiting: "Þú getur beðið á kaffihúsinu okkar á meðan."
            },
            beyond_grace: {
                instructions: "Ef þú verður seinni en það láttu okkur vita símleiðis og við reynum að færa bókunina.",
                sold_out: "Ef það er fullbókað og ekki hægt að færa þá verður bókunin áfram virk og móttökustarfsfólk metur hvenær þú kemst inn."
            },
            contact: {
                phone: "+354 527 6800",
                hours: "9:00 - 18:00",
                email: "reservations@skylagoon.is"
            }
        },
        refund_policy: {
            missed_booking: {
                policy: "Ef upprunaleg bókun er liðin og þú mættir ekki, getum við því miður ekki boðið endurgreiðslu.",
                reason: "Bókunarstefna okkar krefst 24 klst fyrirvara fyrir breytingar eða afbókanir.",
                recommendation: "Við mælum þó með að hafa samband við bókunarteymið okkar á reservations@skylagoon.is til að ræða mögulegar lausnir. Þau geta veitt aðstoð byggt á aðstæðum í þínu tilfelli.",
                contact: {
                    email: "reservations@skylagoon.is",
                    phone: "+354 527 6800",
                    hours: "9:00 - 18:00"
                }
            }
        },
        weather_policy: {
            rebooking: "Eins og við þekkjum vel getur veðrið komið okkur á óvart og er því öllum velkomið að endurbóka sig allt að 24 klst fyrir áætlaðan komutíma með því að senda email á reservations@skylagoon.is.",
            recommendations: {
                weather_gear: "Ef þig langar að upplifa ferðalagið í íslensku veðri, þá mælum við með að koma með höfuðfat.",
                available_items: "Einnig seljum við húfur í móttökunni og á Gelmir Bar."
            }
        },
        advance_payment: {
            required: "Því miður er ekki hægt að tryggja pláss án fyrirframgreiðslu.",
            reason: "Þar sem oft er fullbókað hjá okkur er fyrirframgreiðsla alltaf nauðsynleg til að staðfesta bókunina."
        }
    },
    group_bookings: {
        questions: [
            "Get ég bókað fyrir hóp?",
            "Er hægt að koma með hóp?",
            "Hvernig bóka ég fyrir hóp?",
            "Er afsláttur fyrir hópa?",
            "Hvað með stóra hópa?",
            "Er hópafsláttur?",
            "Get ég fengið verð fyrir hóp?",
            "Hvað kostar fyrir hóp?",
            "Geturðu gefið mér verð í hópabókun?",
            "Hvert er verðið fyrir hóp?"
        ],
        intro: {
            title: "Upplifðu Sky Lagoon með hópnum þínum",
            tagline: "Njótið saman",
            description: "Slakaðu á undir berum himni í góðra vina hópi. Heimsókn í Sky Lagoon er ávísun á ógleymanlega stund undir kvöldsól eða jafnvel dansandi norðurljósum.",
            group_size: "Við tökum við hópabókunum fyrir 10 manns eða fleiri."
        },
        packages: {
            saman: {
                name: "Saman aðgangur",
                description: "Veitir aðgang að almennri búningsaðstöðu og sjö skrefa Skjól Ritúal meðferðinni.",
                pricing: {
                    weekday: {
                        range: "12.990 ISK",
                        note: "Verð á virkum dögum"
                    },
                    weekend: {
                        range: "14.990 ISK",
                        note: "Verð um helgar"
                    }
                }
            },
            ser: {
                name: "Sér aðgangur",
                description: "Býður upp á aukið næði með aðgang að vel búnum einkaklefa með snyrtiaðstöðu og sturtu.",
                pricing: {
                    weekday: {
                        range: "15.990 ISK",
                        note: "Verð á virkum dögum"
                    },
                    weekend: {
                        range: "17.990 ISK",
                        note: "Verð um helgar"
                    }
                }
            }
        },
        booking_info: {
            contact: {
                message: "Fyrir hópabókanir mælum við með að hafa samband beint til að fá nákvæmari upplýsingar og tilboð sem hentar ykkar þörfum.",
                email: "reservations@skylagoon.is"
            }
        }
    },
    age_policy: {
        questions: [
            "Er aldurstakmark?",
            "Hver er aldurstakmörkin?",
            "Má koma með börn?",
            "Hvaða aldur þarf að vera til að heimsækja Sky Lagoon?",
            "Mega börn koma?",
            "Er Sky Lagoon fyrir alla aldurshópa?",
            "Hvað þarf maður að vera gamall til að koma?",
            "Hvers vegna mega börn undir 12 ára ekki fara í lónið?",
            "Af hverju er aldurstakmark?",
            "Hvers vegna er 12 ára aldurstakmark?",
            "Hver er ástæðan fyrir aldurstakmarkinu?",
            "Í sambandi við aldurstakmark, gildir aldurinn eða árið?",
            "Hvenær telst barn 12 ára?",
            "Þarf barnið að vera orðið 12 ára?",
            "Hvernig reiknast aldurstakmarkið?",
            "Má koma með ungling?",
            "Þarf að vera með foreldri?"
        ],
        general_rules: {
            minimum_age: "Börnum yngri en 12 ára aldri eru óheimill aðgangur að Sky Lagoon.",
            supervision: "Börn frá 12 -- 14 ára aldri verða að vera í fylgd foreldra/forráðamanna (18 ára og eldri).",
            id_verification: "Starfsfólk Sky Lagoon kann að óska eftir staðfestingu á aldri barns í formi löggildra skilríkja og áskilur sér þann rétt að neita aðgangi ef skilríki eru ekki til staðar."
        },
        explanation: {
            reason: "12 ára aldurstakmarkið er stefna sem Sky Lagoon hefur tekið til að tryggja gæði upplifunar allra gesta Sky Lagoon. Upplifunin er miðuð að fullorðnum einstaklingum til að veita slökun og endurnæringu og er ekki til þess fallin að börn geti notið sín.",
            additional_factors: "Áfengissala í lóninu er einnig þáttur í þessari ákvörðun.",
            birth_year: "Fæðingarárið gildir fyrir aldurstakmarkið, þannig að börn sem verða 12 ára á almanaksárinu mega heimsækja Sky Lagoon."
        }
    },
    photography_rules: {
        questions: [
            "Má ég taka ljósmyndir í lóninu?",
            "Er ljósmyndun leyfð?",
            "Get ég tekið myndir?",
            "Má nota síma í lóninu?",
            "Seljið þið \"bag protectors\" fyrir síma?",
            "Get ég keypt símahlíf?",
            "Eruð þið með vatnsheldar símavarnir/símahulstur?",
            "Hvernig get ég varið símann minn?"
        ],
        general_rules: {
            permission: "Það er leyfilegt að taka ljósmyndir af ferðalagi þínu í gegnum Sky Lagoon.",
            privacy: "Við viljum þó biðja þig að fara varlega og bera virðingu fyrir persónulegri friðhelgi annarra gesta í lóninu.",
            restricted_areas: "Öll ljósmyndun er óheimil í búningsklefa og sturtusvæði."
        },
        phone_protection: {
            availability: "Já, við seljum vatnheldar símavarnir sem hægt er að nálgast:",
            locations: [
                "Í móttökunni",
                "Í barnum ofan í lóninu"
            ],
            price: "Verð: 2.500 kr"
        }
    },
    views_and_landmarks: {
        questions: [
            "Hvað sést frá Sky Lagoon?",
            "Hvaða fjöll sjást?",
            "Er hægt að sjá norðurljós?",
            "Sést Snæfellsjökull?",
            "Hvað er hægt að sjá?",
            "Sést til Bessastaða?",
            "Hvaða kennileiti sjást?"
        ],
        landmarks: {
            bessastadir: {
                name: "Bessastaðir",
                description: "Þetta gamla höfuðból hefur verið í byggð frá landnámsöld og er nú, eins og allir vita, bústaður forseta Íslands. Á Bessastöðum eru mörg hús, þar á meðan híbýli forseta, móttökustofa, þjónustálma og kirkja, sem öll eru hvítmáluð með rauðu þaki og sjást vel frá Sky Lagoon þar sem þau ber við grænan bakgrunn Álftaness."
            },
            keilir: {
                name: "Keilir",
                description: "Þegar horft er í átt að Reykjarnesi má glöggt sjá hinn þríhyrningslaga Keili. Keilir var um aldaraðir eitt af kennileitum sjófarenda á svæðinu."
            },
            snaefellsjokull: {
                name: "Snæfellsjökull",
                description: "Á heiðskírum degi fer Snæfellsjökull ekki framhjá nokkrum gesti Sky Lagoon þar sem hann trónir yst á Snæfellsnesi. Jökullinn situr ofan á eldkeilu sem myndaðist fyrir um 700.000 árum og teygir sig rúma 1.400 metra upp í loft. Það er fátt í þessum heimi sem jafnast á við að sjá sólina setjast bak við Snæfellsjökul þar sem fegurð og ægikraftur náttúrunnar birtast skýrum hætti."
            }
        },
        natural_phenomena: {
            sunset: {
                name: "Sumarsólsetur og miðnætursól",
                description: "Fallegu íslensku sumarkvöldin og næturnar eru yndisleg og hvergi betra að njóta en einmitt á bakkanum í Sky Lagoon þegar sólin kyssir sjóndeildarhringinn á roðagullnum himni."
            },
            northern_lights: {
                name: "Norðurljósin",
                description: "Upplifunin í Sky Lagoon að vetri til er sannarlega ekki síðri en að sumri, með tilkomumiklu útsýni yfir stjörnubjartan himinn. Ef þú ert heppin sérðu kannski norðurljósin velta fram um himinskaut."
            }
        }
    },
    lost_found: {
        questions: [
            "Ég týndi einhverju í Sky Lagoon",
            "Hvað geri ég ef ég týni einhverju?",
            "Hvert á ég að leita ef ég gleymi einhverju?",
            "Er óskilamunadeild?",
            "Hvernig get ég fundið týnda hluti?",
            "Hvert get ég leitað ef ég skildi eitthvað eftir?",
            "Týndi síma",
            "Gleymdi veski",
            "Týndi skartgripum",
            "Gleymdi fötunum mínum",
            "Týndi sundfötunum"
        ],
        info: {
            general: "Ef þú týndir eitthverju í Sky Lagoon munum við gera okkar besta í að finna það og skila því til þín.",
            storage_periods: [
                "Við geymum verðmæti í þrjá mánuði (veski, töskur, skartgripi, síma, myndavélar og annað).",
                "Sundföt, handklæði og annan fatnað geymum við í eina viku."
            ],
            shipping_cost: "Kostnaður við að senda hlut sem týndist eru 4000 kr.",
            contact: {
                email: "lostandfound@skylagoon.is",
                instructions: "Gott er að taka fram nafn, lýsingu á hlutnum, hvar og hvenær hann týndist og mynd ef kostur er."
            }
        }
    }                 
};

// Knowledge base retrieval function
export const getRelevantKnowledge_is = (userMessage) => {
    console.log('\n🔍 getRelevantKnowledge_is called with:', userMessage);
    
    const message = userMessage.toLowerCase();
    let relevantInfo = [];

// Opening hours and timing
if (message.includes('opið') || 
    message.includes('opnun') ||
    message.includes('lokunartím') ||
    message.includes('lokað') ||
    message.includes('lokar') ||
    message.includes('tímasetning') ||
    message.includes('tími') ||
    message.includes('klukkan') ||
    message.includes('hvenær') ||
    message.includes('afgreiðslutím') ||
    message.includes('í dag') ||
    message.includes('á morgun') ||
    message.includes('opin') ||
    message.includes('opið') ||
    message.includes('lokun') ||
    
    // Holiday specific
    message.includes('jól') ||
    message.includes('áramót') ||
    message.includes('hátíð') ||
    message.includes('desember') ||
    message.includes('24.') ||
    message.includes('25.') ||
    message.includes('31.') ||
    
    // Season specific
    message.includes('sumar') ||
    message.includes('vetur') ||
    message.includes('haust') ||
    
    // Experience specific
    message.includes('norðurljós') ||
    message.includes('miðnætursól') ||
    message.includes('sólarupprás') ||
    message.includes('kvöld') ||
    message.includes('morgn') ||
    
    // Venue specific
    message.includes('smakk bar') ||
    message.includes('keimur') ||
    message.includes('kaffihús') ||
    message.includes('veitingastaður') ||
    message.includes('bar')) {
    
    console.log('\n⏰ Opening Hours Match Found');

    // Return specific content based on query type
    if (message.includes('smakk bar') || message.includes('veitingastaður')) {
        relevantInfo.push({
            type: 'opening_hours',
            subtype: 'smakk_bar',
            content: knowledgeBase_is.opening_hours.venue_specific.smakk_bar.description
        });
    } else if (message.includes('kaffihús') || message.includes('keimur')) {
        relevantInfo.push({
            type: 'opening_hours',
            subtype: 'keimur_cafe',
            content: knowledgeBase_is.opening_hours.venue_specific.keimur_cafe
        });
    } else if (message.includes('jól') || message.includes('áramót') || message.includes('hátíð')) {
        relevantInfo.push({
            type: 'opening_hours',
            subtype: 'holidays',
            content: knowledgeBase_is.opening_hours.holidays
        });
    } else {
        // Return complete opening hours information
        relevantInfo.push({
            type: 'opening_hours',
            content: knowledgeBase_is.opening_hours
        });
    }
}
    // Full getRelevantKnowledge section for Facilities below
    // Búningsklefar (Changing Rooms) - expanded patterns
    // First check specifically for comparisons
    if ((message.includes('munur') || 
        message.includes('muninn') ||
        message.includes('samanburð') ||
        (message.includes('hver') && message.includes('mismun'))) &&
        (message.includes('klefi') ||
        message.includes('klefa') ||
        message.includes('aðstöð') ||
        message.includes('saman') ||
        message.includes('sér'))) {
            
        console.log('\n🔄 Facility Comparison Match Found');
        relevantInfo.push({
            type: 'facilities',
            subtype: 'comparison',
            content: knowledgeBase_is.facilities.changing_rooms
        });
        return relevantInfo;  // Return immediately to prevent other matches
    }

    // Then check for all other facilities queries
    if (message.includes('búningsklefi') || 
        message.includes('búningsklefa') ||
        message.includes('búningsklefann') ||
        message.includes('búningsklefanum') ||
        message.includes('búningsklefar') ||
        message.includes('búningsklefarnir') ||
        // Aðstaða variations
        message.includes('aðstaða') ||
        message.includes('aðstöðu') ||
        message.includes('aðstöðuna') ||
        message.includes('aðstöðunni') ||
        // Package variations
        message.includes('saman') ||
        message.includes('sér') ||
        message.includes('þægindi') || // 'þægindi' triggers a response from the dining section FYI
        // Sturtu variations
        message.includes('sturtu') ||
        message.includes('sturta') ||
        message.includes('sturtuna') ||
        message.includes('sturtunni') ||
        message.includes('sturtur') ||
        // Skáp variations
        message.includes('skáp') ||
        message.includes('skápa') ||
        message.includes('skápana') ||
        message.includes('skápnum') ||
        message.includes('skáparnir') ||
        message.includes('læstur') ||
        message.includes('læstir') ||
        message.includes('læstar') ||
        message.includes('læst') ||
        // Klefi variations
        message.includes('einkaklefi') ||
        message.includes('einkaklefa') ||
        message.includes('einkaklefi') ||
        message.includes('einkaklefann') ||
        message.includes('einkaklefanum') ||
        message.includes('einkaklefar') ||
        message.includes('einkaklefarnir') ||
        message.includes('almenningsklefi') ||
        message.includes('almenningsklefa') ||
        message.includes('almenningsklefann') ||
        message.includes('almenningsklefanum') ||
        message.includes('almenningsklefar') ||
        message.includes('almenningsklefarnir') ||
        message.includes('almennur klefi') ||
        message.includes('almennan klefa') ||
        message.includes('almenna klefann') ||
        message.includes('almenna klefanum') ||
        message.includes('almennir klefar') ||
        message.includes('almennu klefarnir') ||
        // Gender neutral variations
        message.includes('kynhlutlaus') ||
        message.includes('kynhlutlausan') ||
        message.includes('kynhlutlausir') ||
        message.includes('kynhlutlausa') ||
        message.includes('kynsegin') ||
        message.includes('kynlaus') ||
        message.includes('kynlausa') ||
        message.includes('kynlausir') ||
        // Two person related
        message.includes('saman í') ||
        message.includes('með mér') ||
        message.includes('vin') ||
        message.includes('vina') ||
        message.includes('vinur') ||
        message.includes('vinkona') ||
        message.includes('vinkonu') ||
        message.includes('gestir') ||
        message.includes('tveir') ||
        message.includes('tvö') ||
        message.includes('báðir') ||
        message.includes('báðar') ||
        message.includes('bæði') ||
        // Amenities variations
        message.includes('snyrtivör') ||
        message.includes('snyrting') ||
        message.includes('snyrtiaðstaða') ||
        message.includes('snyrtiaðstöðu') ||
        message.includes('sápa') ||
        message.includes('sápu') ||
        message.includes('hárvör') ||
        message.includes('húðvör') ||
        message.includes('fylgir') ||
        message.includes('innifalið') ||
        message.includes('munu') ||
        // Question patterns
        (message.includes('hvað') && message.includes('með')) ||
        (message.includes('hvernig') && message.includes('aðstaða')) ||
        (message.includes('get') && message.includes('með')) ||
        (message.includes('má') && message.includes('með')) ||
        (message.includes('er') && message.includes('leyfilegt'))) {
        
        console.log('\n🚪 Changing Rooms Match Found');
        relevantInfo.push({
            type: 'facilities',
            subtype: 'changing_rooms',
            content: knowledgeBase_is.facilities.changing_rooms
        });
    }

    // Temperature and lagoon info
    if (message.includes('heit') || 
        message.includes('hita') ||
        message.includes('hit') ||
        message.includes('gráð') ||
        message.includes('°') ||
        message.includes('grad') ||
        message.includes('kalt') ||
        message.includes('heitur') ||
        message.includes('heitt') ||
        // Temperature with water/lagoon combinations
        (message.includes('vatn') && 
         (message.includes('heit') || 
          message.includes('hita') || 
          message.includes('hit') || 
          message.includes('gráð') || 
          message.includes('kalt'))) ||
        // General temperature questions
        (message.includes('hvað') && message.includes('heit')) ||
        (message.includes('hversu') && message.includes('heit')) ||
        (message.includes('hver') && message.includes('hit')) ||
        (message.includes('hvernig') && message.includes('hit')) ||
        // Additional common temperature phrases
        (message.includes('hversu') && message.includes('gráður')) ||
        (message.includes('hvað') && message.includes('margar') && message.includes('gráður')) ||
        (message.includes('er') && message.includes('nógu') && message.includes('heit')) ||
        // Temperature with pool/lagoon combinations
        (message.includes('lón') && 
         (message.includes('heit') || 
          message.includes('hita') || 
          message.includes('hit'))) ||
        (message.includes('pottur') && 
         (message.includes('heit') || 
          message.includes('hita') || 
          message.includes('hit')))) {
        
        console.log('\n🌡️ Temperature Query Match Found');
        relevantInfo.push({
            type: 'facilities',
            subtype: 'temperature',
            content: knowledgeBase_is.facilities.lagoon_info.temperature.answer
        });
    }

    // Handklæði (Towels)
    if (message.includes('handklæði') || 
        message.includes('handklæðum') ||
        message.includes('handklæð')) {
        
        console.log('\n🧺 Towels Match Found');
        relevantInfo.push({
            type: 'facilities',
            subtype: 'amenities_handklaedi',
            content: knowledgeBase_is.facilities.amenities.handklaedi
        });
    }

    // Greiðslukerfi (Payment System)
    if (message.includes('greiðslu') || 
        message.includes('borga') ||
        message.includes('armband') ||
        message.includes('veski') ||
        message.includes('pening') ||
        message.includes('greiða') ||
        message.includes('kaupa') ||
        message.includes('krónu') ||
        message.includes('krónur')) {
        
        console.log('\n💳 Payment System Match Found');
        relevantInfo.push({
            type: 'facilities',
            subtype: 'amenities_greidslukerfi',
            content: knowledgeBase_is.facilities.amenities.greidslukerfi
        });
    }

    // Sundföt (Swimwear)
    if (message.includes('sundföt') || 
        message.includes('sundfata') ||
        message.includes('sundbol') ||
        message.includes('sundskýl') ||
        message.includes('sundföt') ||
        message.includes('leiga') ||
        // Add these new patterns
        message.includes('gleym') ||
        message.includes('gleymt') ||
        message.includes('vantar') ||
        message.includes('fá lánaða') ||
        message.includes('sundfötin') ||
        message.includes('sundskýlan') ||
        message.includes('sundbolinn') ||
        // Also catch common question patterns
        (message.includes('get') && message.includes('sund')) ||
        (message.includes('má') && message.includes('sund'))) {
        
        console.log('\n🩱 Swimwear Match Found');
        relevantInfo.push({
            type: 'facilities',
            subtype: 'rentals_sundfot',
            content: knowledgeBase_is.facilities.amenities.rentals.sundfot
        });
    }

    // Farangursgeymsla (Luggage Storage)
    if (message.includes('tösku') || 
        message.includes('farangur') ||
        message.includes('geymsla') ||
        message.includes('geyma') ||
        message.includes('ferðatösk')) {
        
        console.log('\n🧳 Luggage Storage Match Found');
        relevantInfo.push({
            type: 'facilities',
            subtype: 'rentals_farangursgeymsla',
            content: knowledgeBase_is.facilities.amenities.rentals.farangursgeymsla
        });
    }

    // Sloppar og Inniskór (Robes and Slippers)
    if (message.includes('slopp') || 
        message.includes('inniskó')) {
        
        console.log('\n🧥 Robes/Slippers Match Found');
        relevantInfo.push({
            type: 'facilities',
            subtype: 'rentals_sloppar',
            content: knowledgeBase_is.facilities.amenities.rentals.sloppar_og_inniskor
        });
    }
    // Retail products
    if (message.includes('vörur') || 
        message.includes('kaupa') || 
        message.includes('sky vör') ||
        message.includes('skrúbb') ||
        message.includes('krem') ||
        message.includes('olía') ||
        message.includes('ilm') ||
        message.includes('sápa') ||
        message.includes('kerti') ||
        // Add queries about buying/selling
        message.includes('selja') ||
        message.includes('selji') ||
        message.includes('versla') ||
        (message.includes('hvar') && message.includes('kaup')) ||
        // Check for specific product queries
        (message.includes('líkams') && 
         (message.includes('krem') || message.includes('olíu'))) ||
        // Online shopping related
        message.includes('netinu') ||
        message.includes('póstsendin') ||
        message.includes('síðu') ||
        message.includes('vefsíðu') ||
        message.includes('versla á netinu')) {
        
        console.log('\n🛍️ Retail Products Match Found');

        // Check if asking about online/shipping
        if (message.includes('netinu') || 
            message.includes('póstsendin') ||
            message.includes('síðu') ||
            message.includes('vefsíðu') ||
            message.includes('versla á netinu')) {
            relevantInfo.push({
                type: 'facilities',
                subtype: 'retail_products_online',
                content: {
                    location: knowledgeBase_is.facilities.amenities.retail_products.location,
                    online_info: knowledgeBase_is.facilities.amenities.retail_products.online_info
                }
            });
        }
        // Check for specific product queries
        else if (message.includes('líkamskrem') || 
                 message.includes('líkamsolía') || 
                 message.includes('skrúbb') ||
                 message.includes('ilmur') ||
                 message.includes('sápa') ||
                 message.includes('kerti')) {
            relevantInfo.push({
                type: 'facilities',
                subtype: 'retail_products_specific',
                content: {
                    answer: knowledgeBase_is.facilities.amenities.retail_products.answer.specific_product,
                    products: knowledgeBase_is.facilities.amenities.retail_products.products
                }
            });
        }
        // General retail queries
        else {
            relevantInfo.push({
                type: 'facilities',
                subtype: 'retail_products',
                content: knowledgeBase_is.facilities.amenities.retail_products
            });
        }
    }
    // Accessibility specific check
    if (message.includes('aðgengi') ||
        message.includes('hjólastól') ||
        message.includes('stólalyfta') ||
        message.includes('stólalyftu') ||
        message.includes('fatlaða') ||
        message.includes('fatlaðra') ||
        message.includes('fatlaðir') ||
        message.includes('hreyfihamlaða') ||
        message.includes('hreyfihamlaðra') ||
        message.includes('komast') ||
        message.includes('komist') ||
        message.includes('aðstoð') ||
        message.includes('auðvelt að') ||
        message.includes('hægt að') ||
        message.includes('fylgdarmað') ||
        message.includes('fylgdarmann') ||
        message.includes('fylgdarmen') ||
        message.includes('lyfta') ||
        message.includes('lyftu') ||
        // Enhanced accessibility patterns
        message.includes('aðgangssvít') ||
        message.includes('aðgengissvít') ||
        message.includes('svíta') ||
        message.includes('svítu') ||
        message.includes('sérbúin') ||
        message.includes('sérhönnuð') ||
        message.includes('sérútbúin') ||
        message.includes('sturtustól') ||
        message.includes('stuðningsslá') ||
        message.includes('hindrunarlaus') ||
        message.includes('kynsegin') ||
        message.includes('kynhlutlaus') ||
        message.includes('talstöð') ||
        message.includes('hjálparbjall') ||
        (message.includes('fá') && message.includes('aðstoð')) ||
        (message.includes('meiri') && message.includes('aðstoð')) ||
        (message.includes('sérstök') && message.includes('aðstaða'))) {
            
        console.log('\n♿ Accessibility Match Found');

        // Base accessibility info
        let accessibilityInfo = {
            type: 'facilities',
            subtype: 'accessibility'
        };

        // Check for accessibility suite specific queries
        if (message.includes('aðgangssvít') ||
            message.includes('aðgengissvít') ||
            message.includes('svíta') ||
            message.includes('svítu') ||
            message.includes('sérbúin') ||
            message.includes('sérhönnuð') ||
            message.includes('sérútbúin') ||
            message.includes('sturtustól') ||
            message.includes('stuðningsslá') ||
            message.includes('hjálparbjall') ||
            message.includes('einkaklefi') ||
            (message.includes('sérstök') && message.includes('aðstaða'))) {
            
            console.log('\n🚿 Accessibility Suite Match Found');
            accessibilityInfo.content = {
                mission_statement: knowledgeBase_is.facilities.accessibility.mission_statement,
                accessibility_suite: knowledgeBase_is.facilities.accessibility.accessibility_suite
            };
        }

        // Check for staff assistance queries
        if (message.includes('starfsfólk') || 
            message.includes('aðstoð') ||
            message.includes('talstöð') ||
            message.includes('teymi') ||
            (message.includes('get') && message.includes('hjálp'))) {
            
            console.log('\n👥 Staff Assistance Match Found');
            accessibilityInfo.content = {
                staff_assistance: knowledgeBase_is.facilities.accessibility.staff_assistance,
                main_info: knowledgeBase_is.facilities.accessibility.main_info
            };
        }

        // Check for LGBTQIA+ related queries
        if (message.includes('kynsegin') ||
            message.includes('kynhlutlaus') ||
            message.includes('hinsegin') ||
            message.includes('trans') ||
            message.includes('lgbt') ||
            message.includes('queer') ||
            message.includes('fjölbreytileik') ||
            message.includes('sýnileik') ||
            message.includes('heit') ||
            (message.includes('kyn') && message.includes('hlutlaus')) ||
            message.includes('salerni') ||
            message.includes('merking')) {

            console.log('\n🌈 LGBTQIA+ Support Match Found');
            accessibilityInfo.content = {
                lgbtqia_support: knowledgeBase_is.facilities.accessibility.lgbtqia_support
            };
        }

        // Check for specific queries about pool/lón access
        if (message.includes('lón') || 
            message.includes('lónið') || 
            message.includes('lyfta') || 
            message.includes('lyftu') ||
            message.includes('komast í') ||
            message.includes('komast upp') ||
            (message.includes('hjálp') && message.includes('í'))) {
            
            accessibilityInfo.content = {
                main_info: knowledgeBase_is.facilities.accessibility.main_info,
                pool_access: knowledgeBase_is.facilities.accessibility.detailed_info.pool_access
            };
        }
        // Check for ritual-specific queries
        else if (message.includes('ritúal') || 
                 message.includes('ritual') ||
                 message.includes('meðferð')) {
            
            accessibilityInfo.content = {
                main_info: knowledgeBase_is.facilities.accessibility.main_info,
                ritual_access: knowledgeBase_is.facilities.accessibility.detailed_info.ritual_access
            };
        }
        // Check for companion/fylgdarmann queries
        else if (message.includes('fylgdarmað') || 
                 message.includes('fylgdarmann') ||
                 message.includes('fylgdarmen') ||
                 message.includes('borga') ||
                 message.includes('ókeypis')) {
            
            accessibilityInfo.content = {
                companion_info: knowledgeBase_is.facilities.accessibility.companion_info,
                additional_info: knowledgeBase_is.facilities.accessibility.additional_info
            };
        }
        // For general accessibility queries, include all info
        else {
            accessibilityInfo.content = knowledgeBase_is.facilities.accessibility;
        }

        relevantInfo.push(accessibilityInfo);
    } // End of full Accessibility section

    // Stay Duration specific check
    if (message.includes('lengi') || 
        message.includes('tímatakmörkun') ||
        message.includes('allan dag') ||
        message.includes('allan daginn') ||
        message.includes('þarf ég að fara') ||
        message.includes('hversu lengi') ||
        message.includes('hvað má vera lengi') ||
        (message.includes('vera') && message.includes('eins lengi')) ||
        (message.includes('get') && message.includes('verið')) ||
        (message.includes('má') && message.includes('vera')) ||
        (message.includes('hvenær') && message.includes('fara'))) {
        
        console.log('\n⏱️ Stay Duration Query Match Found');
        relevantInfo.push({
            type: 'facilities',
            subtype: 'stay_duration',
            content: knowledgeBase_is.facilities.lagoon_info.stay_duration
        });
    } // End of full Facilities section

    // Ritual related queries
    if (message.includes('ritúal') || 
        message.includes('ritual') || 
        message.includes('skjól') || 
        message.includes('skjol') || 
        message.includes('meðferð') || 
        message.includes('skrúbb') || 
        message.includes('gufa') || 
        message.includes('sauna') || 
        message.includes('kuldi') || 
        message.includes('saft') || 
        message.includes('þrep') || 
        message.includes('sjö') || 
        message.includes('7') || 
        message.includes('ofnæmi') || 
        message.includes('skref') ||
        // Skip ritual patterns
        (message.includes('bara') && message.includes('ofaní')) ||
        (message.includes('bara') && message.includes('lón')) ||
        (message.includes('án') && message.includes('ritúal')) ||
        (message.includes('sleppa') && message.includes('ritúal')) ||
        (message.includes('kaupa') && message.includes('bara')) ||
        (message.includes('bara') && message.includes('aðgang')) ||
        // General ritual query patterns
        (message.includes('hvernig') && message.includes('ritúal')) ||
        (message.includes('hvernig') && message.includes('skjól')) ||
        (message.includes('hvað') && message.includes('ritúal')) ||
        (message.includes('hvað') && message.includes('skjól')) ||
        (message.includes('segðu') && message.includes('ritúal')) ||
        (message.includes('má') && message.includes('oft')) ||
        (message.includes('hver') && message.includes('skref'))) {

        console.log('\n🧖‍♀️ Ritual Match Found');

        // If asking about skipping ritual
        if ((message.includes('bara') && message.includes('ofaní')) ||
            (message.includes('bara') && message.includes('lón')) ||
            (message.includes('án') && message.includes('ritúal')) ||
            (message.includes('sleppa') && message.includes('ritúal')) ||
            (message.includes('kaupa') && message.includes('bara')) ||
            (message.includes('bara') && message.includes('aðgang'))) {
            
            console.log('\n❌ Skip Ritual Query Found');
            relevantInfo.push({
                type: 'ritual_mandatory',
                content: {
                    answer: "Skjól ritúal meðferðin er innifalin í öllum pökkum okkar og er órjúfanlegur hluti af Sky Lagoon upplifuninni. Þú getur valið á milli tveggja pakka - Saman eða Sér - sem báðir innihalda aðgang að lóninu og Skjól ritúal meðferðina.",
                    details: knowledgeBase_is.ritual.answer,
                    link: `[Skoða Ritúal] (${knowledgeBase_is.website_links.ritual})`
                }
            });
        }
        // If asking about allergies
        else if (message.includes('ofnæmi')) {
            console.log('\n🧪 Ritual Allergies Match Found');
            relevantInfo.push({
                type: 'ritual_allergies',
                content: {
                    ...knowledgeBase_is.ritual.allergies,
                    link: `[Skoða Ritúal] (${knowledgeBase_is.website_links.ritual})`
                }
            });
        }
        // For all other ritual queries (including steps), give full ritual information
        else {
            console.log('\n✨ Full Ritual Information Match Found');
            relevantInfo.push({
                type: 'ritual',
                content: {
                    introduction: {
                        name: knowledgeBase_is.ritual.name,
                        tagline: knowledgeBase_is.ritual.tagline,
                        description: knowledgeBase_is.ritual.description,
                        answer: knowledgeBase_is.ritual.answer
                    },
                    steps: knowledgeBase_is.ritual.steps,
                    closing: "Láttu mig vita ef þú hefur fleiri spurningar!",
                    link: `[Skoða Skjól Ritúal] (${knowledgeBase_is.website_links.ritual})`
                }
            });
        }
    }
    
    // Pakkar - Saman, Sér, Stefnumót (Packages)
    if (message.includes('pakki') || 
        message.includes('pakkanum') ||
        message.includes('pökkunum') ||
        message.includes('pakka') ||
        message.includes('verð') || 
        message.includes('kost') ||
        message.includes('saman') ||
        message.includes('sér') ||
        message.includes('mun') ||
        // Youth pricing patterns
        message.includes('ungling') ||
        message.includes('unglingaverð') ||
        message.includes('barna') ||
        message.includes('barnaverð') ||
        message.includes('barnagjald') ||
        (message.includes('12') && message.includes('14')) ||
        (message.includes('börn') && message.includes('verð')) ||
        // Stefnumót related
        message.includes('stefnumót') ||
        message.includes('fyrir tvo') ||
        message.includes('tveir') ||
        message.includes('sælkeraplatt') ||
        message.includes('drykk') ||
        // Price related
        message.includes('króna') ||
        message.includes('kr') ||
        message.includes('ISK') ||
        // Question words with package context
        (message.includes('hvað') && (
        message.includes('innifalið') ||
        message.includes('fylgir') ||
        message.includes('kostar')
    ))) {
    
        console.log('\n📦 Package Match Found');
        
        // Check for youth pricing queries first
        if (message.includes('ungling') ||
            message.includes('unglingaverð') ||
            message.includes('barna') ||
            message.includes('barnaverð') ||
            message.includes('barnagjald') ||
            (message.includes('12') && message.includes('14')) ||
            (message.includes('börn') && message.includes('verð'))) {
            
            // Check if asking about specific package type
            if (message.includes('sér')) {
                console.log('\n👶 Youth Sér Package Match Found');
                relevantInfo.push({
                    type: 'packages',
                    subtype: 'youth_ser',
                    content: {
                        youth_pricing: knowledgeBase_is.packages.ser.youth_pricing,
                        age_policy: knowledgeBase_is.age_policy.general_rules,
                        link: `[Skoða Sér aðgang] (${knowledgeBase_is.website_links.packages})`
                    }
                });
            } else if (message.includes('saman')) {
                console.log('\n👶 Youth Saman Package Match Found');
                relevantInfo.push({
                    type: 'packages',
                    subtype: 'youth_saman',
                    content: {
                        youth_pricing: knowledgeBase_is.packages.saman.youth_pricing,
                        age_policy: knowledgeBase_is.age_policy.general_rules,
                        link: `[Skoða Saman aðgang] (${knowledgeBase_is.website_links.packages})`
                    }
                });
            } else {
                // General youth pricing query
                console.log('\n👶 General Youth Pricing Match Found');
                relevantInfo.push({
                    type: 'packages',
                    subtype: 'youth_all',
                    content: {
                        saman: knowledgeBase_is.packages.saman.youth_pricing,
                        ser: knowledgeBase_is.packages.ser.youth_pricing,
                        age_policy: knowledgeBase_is.age_policy.general_rules,
                        link: `[Skoða leiðir til að njóta] (${knowledgeBase_is.website_links.packages})`
                    }
                });
            }
        }
        // Keep existing package logic for non-youth queries
        else if (message.includes('stefnumót') || 
            message.includes('fyrir tvo') ||
            message.includes('tveir')) {
            
            console.log('\n💑 Date Package Match Found');
            relevantInfo.push({
                type: 'packages',
                subtype: 'stefnumot',
                content: {
                    ...knowledgeBase_is.packages.stefnumot,
                    link: `[Skoða stefnumótspakka] (${knowledgeBase_is.website_links.stefnumot})`
                }
            });
        } else if (message.includes('sér')) {
            console.log('\n🌟 Sér Package Match Found');
            relevantInfo.push({
                type: 'packages',
                subtype: 'ser',
                content: {
                    ...knowledgeBase_is.packages.ser,
                    link: `[Skoða Sér aðgang] (${knowledgeBase_is.website_links.packages})`
                }
            });
        } else if (message.includes('saman')) {
            console.log('\n👥 Saman Package Match Found');
            relevantInfo.push({
                type: 'packages',
                subtype: 'saman',
                content: {
                    ...knowledgeBase_is.packages.saman,
                    link: `[Skoða Saman aðgang] (${knowledgeBase_is.website_links.packages})`
                }
            });
        } else {
            // Return all package info
            relevantInfo.push({
                type: 'packages',
                content: {
                    ...knowledgeBase_is.packages,
                    link: `[Skoða leiðir til að njóta] (${knowledgeBase_is.website_links.packages})`
                }
            });
        }
    }

    // Multi-Pass function
    if (message.includes('multi') ||
        message.includes('multipass') ||
        message.includes('multi-pass') ||
        message.includes('fjölnotakort') ||
        message.includes('hefð') ||
        message.includes('hefd') ||
        message.includes('venja') ||
        message.includes('sex skipti') ||
        message.includes('6 skipti') ||
        message.includes('margir tímar') ||
        message.includes('mörg skipti') ||
        message.includes('fleiri skipti') ||
        (message.includes('gildir') && (
            message.includes('lengi') ||
            message.includes('hversu') ||
            message.includes('tími')
        )) ||
        (message.includes('deila') && (
            message.includes('pass') ||
            message.includes('kort')
        ))) {

        console.log('\n🎫 Multi-Pass Match Found');

        // Determine which specific multi-pass info to return
        if (message.includes('hefð') || 
            message.includes('hefd')) {
            
            console.log('\n✨ Hefð Multi-Pass Match Found');
            relevantInfo.push({
                type: 'multipass',
                subtype: 'hefd',
                content: {
                    ...knowledgeBase_is.multipass.types.hefd,
                    link: `[Kaupa Hefð Multi-Pass] (${knowledgeBase_is.website_links.multi_pass})`
                }
            });
        } else if (message.includes('venja')) {
            console.log('\n👥 Venja Multi-Pass Match Found');
            relevantInfo.push({
                type: 'multipass',
                subtype: 'venja',
                content: {
                    ...knowledgeBase_is.multipass.types.venja,
                    link: `[Kaupa Venju Multi-Pass] (${knowledgeBase_is.website_links.multi_pass})`
                }
            });
        } else if (message.includes('bóka') || 
                   message.includes('panta') || 
                   message.includes('nota')) {
            
            console.log('\n📅 Multi-Pass Booking Match Found');
            relevantInfo.push({
                type: 'multipass',
                subtype: 'booking',
                content: {
                    ...knowledgeBase_is.multipass.booking_process,
                    links: {
                        booking: `[Bóka heimsókn] (${knowledgeBase_is.website_links.booking})`,
                        multi_pass: `[Skoða Multi-Pass] (${knowledgeBase_is.website_links.multi_pass})`
                    }
                }
            });
        } else {
            // Return all multi-pass info
            relevantInfo.push({
                type: 'multipass',
                content: {
                    ...knowledgeBase_is.multipass,
                    link: `[Skoða Multi-Pass] (${knowledgeBase_is.website_links.multi_pass})`
                }
            });
        }
    }  // End of Multi-Pass section
    
    // Discount queries
    if (message.includes('afsláttur') || 
        message.includes('afslætti') ||
        message.includes('afsláttarkjör') ||
        message.includes('verðlækkun') ||
        message.includes('tilboð') ||
        message.includes('sérkjör') ||
        message.includes('betra verð') ||
        message.includes('spara') ||
        message.includes('sparnaður') ||
        message.includes('ódýrara') ||
        message.includes('lækkað verð') ||
        message.includes('hagstætt') ||
        message.includes('hagstæðara') ||
        message.includes('lægra verð') ||
        message.includes('afsláttarkóði') ||
        message.includes('afsláttarkóða') ||
        // Question patterns
        (message.includes('er') && message.includes('afsláttur')) ||
        (message.includes('eruð') && message.includes('tilboð')) ||
        (message.includes('hægt') && message.includes('spara')) ||
        (message.includes('hægt') && message.includes('ódýrara')) ||
        (message.includes('hægt') && message.includes('ódýrari')) ||
        (message.includes('eru') && message.includes('afslættir')) ||
        (message.includes('ertu') && message.includes('afsláttarkóða')) ||
        (message.includes('eru') && message.includes('sérkjör')) ||
        // Complex discount phrases
        (message.includes('versla') && message.includes('ódýrara')) ||
        (message.includes('fá') && message.includes('ódýrari')) ||
        // Add these specific patterns
        (message.includes('bjóðið') && message.includes('afslát')) ||
        (message.includes('bjóða') && message.includes('afslát')) ||
        (message.includes('upp á') && message.includes('afslát'))) {
        
        console.log('\n💰 Discount Query Match Found');
        relevantInfo.push({
            type: 'discounts',
            content: knowledgeBase_is.discounts.answer
        });
    }  // End of Discount section
    
    // Gift Card Pattern Detection
    if (message.includes('gjafakort') ||
        message.includes('gjafabréf') ||
        message.includes('gefa') ||
        message.includes('gefandi') ||
        message.includes('gjöf') ||
        message.includes('kóði') ||
        message.includes('kóða') ||
        message.toLowerCase().includes('pure') ||
        message.toLowerCase().includes('sky') ||
        // Add new upgrade-related patterns for Icelandic
        message.includes('uppfæra') ||
        message.includes('uppfærsla') ||
        (message.includes('nota') && message.includes('saman') && message.includes('sér')) ||
        (message.includes('breyta') && message.includes('pakka')) ||
        (message.includes('greiða') && message.includes('mismun')) ||
        (message.includes('dýrari')) ||
        (message.includes('upp í'))) {

        console.log('\n🎁 Gift Card Match Found');

        // First check for legacy gift card queries
        if (message.toLowerCase().includes('pure') || 
            message.toLowerCase().includes('sky') ||
            (message.toLowerCase().includes('gamla') && message.includes('gjafabréf')) ||
            (message.toLowerCase().includes('eldra') && message.includes('gjafabréf'))) {
            
            console.log('\n🔄 Legacy Gift Card Query Found');
            
            let response = '';
            
            if (message.toLowerCase().includes('pure')) {
                response = "Pure leiðin (eða Pure Pass) heitir núna Saman leiðin. Þú átt að velja 'Saman Pass' þegar þú bókar á netinu. Gjafakortið þitt er ennþá í fullu gildi.\n\n";
            } else if (message.toLowerCase().includes('sky')) {
                response = "Sky leiðin (eða Sky Pass) heitir núna Sér leiðin. Þú átt að velja 'Sér Pass' þegar þú bókar á netinu. Gjafakortið þitt er ennþá í fullu gildi.\n\n";
            }

            response += "Svona bókar þú:\n";
            knowledgeBase_is.gift_cards.legacy_names.booking_process.steps.forEach((step, index) => {
                response += `${index + 1}. ${step}\n`;
            });
            response += "\nEf þú þarft aðstoð með eldri gjafakort eða bókun, ekki hika við að hafa samband við okkur á reservations@skylagoon.is eða í síma 527 6800.";
            response += `\n\n[Bóka heimsókn] (${knowledgeBase_is.website_links.booking})`;

            relevantInfo.push({
                type: 'gift_cards',
                subtype: 'legacy',
                content: response
            });
        }
        // New section: Check for upgrade-related queries
        else if (message.includes('uppfæra') || 
                 message.includes('uppfærsla') ||
                 (message.includes('nota') && message.includes('saman') && message.includes('sér')) ||
                 (message.includes('breyta') && message.includes('pakka')) ||
                 (message.includes('greiða') && message.includes('mismun')) ||
                 (message.includes('dýrari')) ||
                 (message.includes('upp í'))) {
            
            console.log('\n🔄 Gift Card Upgrade Query Found');
            relevantInfo.push({
                type: 'gift_cards',
                subtype: 'upgrade',
                content: {
                    upgrade_info: knowledgeBase_is.gift_cards.booking.upgrade_info.ser_from_saman,
                    links: {
                        booking: `[Bóka heimsókn] (${knowledgeBase_is.website_links.booking})`,
                        gift_cards: `[Skoða gjafakort] (${knowledgeBase_is.website_links.gift_tickets})`
                    }
                }
            });
        }
        // Then check for purchase-related queries
        else if (message.includes('kaupa') || 
            message.includes('kaupi') || 
            message.includes('verð') || 
            message.includes('kostar') ||
            message.includes('langar að') ||
            (message.includes('hvar') && message.includes('get'))) {
            
            console.log('\n💳 Gift Card Purchase Query Found');
            relevantInfo.push({
                type: 'gift_cards',
                subtype: 'purchase',
                content: {
                    marketing: knowledgeBase_is.gift_cards.marketing,  // Always include marketing
                    ...knowledgeBase_is.gift_cards,
                    purchase_info: knowledgeBase_is.gift_cards.purchase_info,
                    link: `[Kaupa gjafakort] (${knowledgeBase_is.website_links.gift_tickets})`
                }
            });
        }
        // Then check for usage-related queries
        else if (message.includes('nota') || 
                 message.includes('bóka') || 
                 message.includes('innleysa') ||
                 (message.includes('hvernig') && !message.includes('kaupa'))) {
            
            console.log('\n📝 Gift Card Usage Query Found');
            relevantInfo.push({
                type: 'gift_cards',
                subtype: 'booking',
                content: {
                    ...knowledgeBase_is.gift_cards.booking,
                    links: {
                        booking: `[Bóka heimsókn] (${knowledgeBase_is.website_links.booking})`,
                        gift_cards: `[Skoða gjafakort] (${knowledgeBase_is.website_links.gift_tickets})`
                    }
                }
            });
        }
        // Check for specific package types
        else if (message.includes('stefnumót') || 
                 message.includes('fyrir tvo')) {
            
            console.log('\n💑 Date Gift Card Match Found');
            relevantInfo.push({
                type: 'gift_cards',
                subtype: 'stefnumot',
                content: {
                    ...knowledgeBase_is.gift_cards.types.stefnumot,
                    link: `[Skoða stefnumótspakka] (${knowledgeBase_is.website_links.stefnumot})`
                }
            });
        }
        else if (message.includes('sér')) {
            console.log('\n✨ Sér Gift Card Match Found');
            relevantInfo.push({
                type: 'gift_cards',
                subtype: 'ser',
                content: {
                    ...knowledgeBase_is.gift_cards.types.ser,
                    link: `[Kaupa Sér gjafakort] (${knowledgeBase_is.website_links.gift_tickets})`
                }
            });
        }
        else if (message.includes('saman')) {
            console.log('\n👥 Saman Gift Card Match Found');
            relevantInfo.push({
                type: 'gift_cards',
                subtype: 'saman',
                content: {
                    ...knowledgeBase_is.gift_cards.types.saman,
                    link: `[Kaupa Saman gjafakort] (${knowledgeBase_is.website_links.gift_tickets})`
                }
            });
        }
        else {
            // Return all gift card info for general queries
            relevantInfo.push({
                type: 'gift_cards',
                content: {
                    ...knowledgeBase_is.gift_cards,
                    link: `[Skoða gjafakort] (${knowledgeBase_is.website_links.gift_tickets})`
                }
            });
        }
    }  // End of Gift Cards section

    // Dining specific - Smakk Bar, Keimur Café and Lagoon Bar
    if (message.includes('matur') || 
        message.includes('mat') ||
        message.includes('borða') ||
        message.includes('plött') ||      // Catches plöttur, plöttunum
        message.includes('platt') ||      // Catches plattar, plattana
        message.includes('sælkera') ||    // Base form
        message.includes('matseðil') ||   // Catches matseðill, matseðilinn
        message.includes('veitingar') ||
        message.includes('veitingastað') ||     // Accusative
        message.includes('veitingastaður') ||   // Nominative
        message.includes('veitingastaðinn') ||  // Accusative with article
        message.includes('veitingastaðnum') ||  // Dative with article
        message.includes('veitingastaði') ||    // Multiple accusative
        message.includes('matsölustaður') ||
        message.includes('café') || 
        message.includes('kaffihús') ||
        message.includes('kaffi') ||
        message.includes('bar') ||
        message.includes('drykkir') ||
        message.includes('drekka') ||
        message.includes('veitingastaðir') ||
        message.includes('platta') || 
        message.includes('plattar') ||
        message.includes('súpa') ||
        message.includes('samloka') ||
        message.includes('beygla') ||
        message.includes('skyr') ||
        message.includes('bakkelsi') ||
        // Smakk Bar specific
        message.includes('smakk') ||
        message.includes('sælkera') ||
        message.includes('ostar') ||
        message.includes('graflax') ||
        message.includes('síld') ||
        message.includes('vegan') ||
        message.includes('glútein') ||
        message.includes('glúteinfrítt') ||
        message.includes('glúteinlausa') ||
        message.includes('glúten') ||
        message.includes('gluten') ||
        message.includes('glutenfrítt') ||
        message.includes('glútenfrítt') ||
        message.includes('glútenlaus') ||
        message.includes('glutenlaus') ||
        message.includes('grænmetis') ||
        // Keimur specific
        message.includes('keimur') ||
        message.includes('Te & Kaffi') ||
        message.includes('espresso') ||
        message.includes('latte') ||
        message.includes('cappuccino') ||
        message.includes('súrdeigssamloka') ||
        // Gelmir specific
        message.includes('gelmir') ||
        message.includes('áfengi') ||
        message.includes('bjór') ||
        message.includes('vín') ||
        message.includes('freyðivín') ||
        message.includes('drykkjur') ||
        message.includes('gos') ||
        message.includes('safi') ||
        // Questions and price related
        message.includes('verð') ||
        message.includes('kostar') ||
        message.includes('krónu') ||
        message.includes('ISK') ||
        // Opening hours related for venues
        message.includes('opið') ||
        message.includes('lokað') ||
        message.includes('tími') ||
        message.includes('opnunartími') ||
        // New patterns from website content
        message.includes('matarhefð') ||
        message.includes('hefðir') ||
        message.includes('menning') ||
        message.includes('matreiðslu') ||
        message.includes('hefðbundin') ||
        message.includes('réttur') ||
        message.includes('réttir') ||
        message.includes('ljúffeng') ||
        message.includes('gómsæt') ||
        message.includes('fersk')) {

        console.log('\n🍽️ Food & Beverage Match Found');

        // Check for menu queries FIRST
        if (message.includes('matseðil') || 
            message.includes('matseðill') ||
            message.includes('matseðilinn') ||
            message.includes('sýna matseðil') ||
            message.includes('sýnt matseðil') ||
            message.match(/má sjá|getið þið sýnt|hvaða plattar|hvað er á/i)) {
            
            console.log('\n📋 Menu Request Detected');
            relevantInfo.push({
                type: 'dining',
                subtype: 'menu_details',
                content: {
                    small_platters: knowledgeBase_is.dining.venues.smakk_bar.menu.small_platters,
                    large_platters: knowledgeBase_is.dining.venues.smakk_bar.menu.large_platters,
                    link: `[Skoða Smakk Bar] (${knowledgeBase_is.website_links.dining.smakk_bar})`
                }
            });
        }
        // Then check for specific menu items
        else if (message.match(/hvað er á|hvað er í|hvað inniheldur|hver er/i)) {
            console.log('\n📋 Menu Item Query Detected');
            
            // Check all menu items
            const allItems = [
                ...knowledgeBase_is.dining.venues.smakk_bar.menu.small_platters.items,
                ...knowledgeBase_is.dining.venues.smakk_bar.menu.large_platters.items
            ];

            // Try to find the requested item
            const requestedItem = allItems.find(item => 
                message.toLowerCase().includes(item.name.toLowerCase())
            );

            if (requestedItem) {
                console.log('\n🍽️ Specific Menu Item Found:', requestedItem.name);
                // Return the EXACT content from knowledge base
                relevantInfo.push({
                    type: 'dining',
                    subtype: 'menu_item',
                    content: {
                        name: requestedItem.name,
                        description: requestedItem.description,
                        price: requestedItem.price,
                        categoryType: requestedItem.subtitle || null,
                        link: `[Skoða matseðil] (${knowledgeBase_is.website_links.dining.smakk_bar})`
                    }
                });
            }
        }
        // Check for general restaurant queries
        else if (message.includes('eruð þið með') || 
                message.includes('hafið þið') ||
                message.includes('er hægt að fá') ||
                message.match(/hvar er hægt að|hvar get ég|get ég fengið/i)) {
            
            console.log('\n🍽️ General Restaurant Query Detected');
            relevantInfo.push({
                type: 'dining',
                content: {
                    overview: knowledgeBase_is.dining.venues.smakk_bar.menu.about,
                    venues: knowledgeBase_is.dining.venues,
                    link: `[Skoða veitingastaði] (${knowledgeBase_is.website_links.dining.overview})`
                }
            });
        }
        // Check for dietary requirements 
        else if (message.includes('glúten') ||
                message.includes('glútein') ||
                message.includes('gluten') || 
                message.includes('vegan') ||
                message.includes('grænmetis')) {
            
            console.log('\n🥗 Dietary Options Match Found');
            relevantInfo.push({
                type: 'dining',
                subtype: 'dietary_options',
                content: {
                    smakk_bar: knowledgeBase_is.dining.venues.smakk_bar.dietary_options,
                    keimur_cafe: knowledgeBase_is.dining.venues.keimur_cafe.dietary_options,
                    link: `[Skoða veitingastaði] (${knowledgeBase_is.website_links.dining.overview})`
                }
            });
        }
        // Check for ingredient and production queries
        else if (message.match(/hráefn|uppruna|framlei[ðþ]|hvaðan/i) ||
                 message.match(/nota[ðr]?\s+þið/i) ||
                 message.includes('hráefni') ||
                 (message.includes('hvað') && 
                  (message.includes('nota') || message.includes('hráefni'))) ||
                 message.includes('hráefnum') ||
                 message.includes('innihald') ||
                 message.includes('inniheldur') ||
                 (message.includes('hvaðan') && message.includes('kemur')) ||
                 (message.includes('hvernig') && message.includes('framlei'))) {
            
            console.log('\n🥘 Ingredients and Production Match Found');
            relevantInfo.push({
                type: 'dining',
                subtype: 'production',
                content: {
                    about: knowledgeBase_is.dining.venues.smakk_bar.menu.about,
                    production: knowledgeBase_is.dining.venues.smakk_bar.menu.production,
                    link: `[Skoða Smakk Bar] (${knowledgeBase_is.website_links.dining.smakk_bar})`
                }
            });
        }
        // Then check venue-specific info
        else if (message.includes('smakk') || 
                message.includes('sælkera') || 
                message.includes('plattar') ||
                message.includes('plött') ||
                message.includes('ostar') ||
                message.includes('graflax') ||
                message.includes('síld')) {
            
            console.log('\n🍽️ Smakk Bar Match Found');
            relevantInfo.push({
                type: 'dining',
                subtype: 'smakk_bar',
                content: {
                    ...knowledgeBase_is.dining.venues.smakk_bar,
                    link: `[Skoða Smakk Bar] (${knowledgeBase_is.website_links.dining.smakk_bar})`
                }
            });
        } 
        else if (message.includes('keimur') || 
                message.includes('kaffi') ||
                message.includes('espresso') ||
                message.includes('latte') ||
                message.includes('cappuccino') ||
                message.includes('súrdeigssamloka') ||
                message.includes('súpa') ||
                message.includes('beygla') ||
                message.includes('skyr') ||
                message.includes('bakkelsi') ||
                // New patterns from website content
                message.includes('nýbakað') ||
                message.includes('te & kaffi') ||
                message.includes('sandholt') ||
                message.includes('kruðerí') ||
                message.includes('kaffibolla') ||
                (message.includes('notaleg') && message.includes('stund'))) {
            
            console.log('\n☕ Keimur Café Match Found');
            relevantInfo.push({
                type: 'dining',
                subtype: 'keimur_cafe',
                content: {
                    ...knowledgeBase_is.dining.venues.keimur_cafe,
                    link: `[Skoða Keimur Café] (${knowledgeBase_is.website_links.dining.keimur_cafe})`
                }
            });
        } 
        else if (message.includes('gelmir') || 
                message.includes('áfengi') ||
                message.includes('bjór') ||
                message.includes('vín') ||
                message.includes('drykkir') ||
                message.includes('bar') ||
                message.includes('lóninu') ||
                // New patterns from website content
                message.includes('drykkja') ||
                message.includes('armband') ||
                message.includes('skanna') ||
                message.includes('búbblur') ||
                message.includes('áfengislaus') ||
                message.includes('heilsusafi') ||
                (message.includes('þrír') && message.includes('drykkir')) ||
                (message.includes('panta') && message.includes('drykk')) ||
                message.includes('freyðivín')) {
            
            console.log('\n🍷 Gelmir Bar Match Found');
            relevantInfo.push({
                type: 'dining',
                subtype: 'gelmir_bar',
                content: {
                    ...knowledgeBase_is.dining.venues.gelmir_bar,
                    link: `[Skoða Gelmir Bar] (${knowledgeBase_is.website_links.dining.gelmir_bar})`
                }
            });
        }

        // Only use general overview if no specific matches found AND it's a general query
        if (!relevantInfo.length && (
            message.includes('veitingastaðir') || 
            message.includes('matsölustaðir') ||
            message.includes('staðir') ||
            message.includes('matur') ||
            (message.includes('hvað') && message.includes('boði')) ||
            // New patterns from website
            message.includes('matarhefð') ||
            message.includes('hefðir') ||
            message.includes('menning'))) {
            
            console.log('\n🍽️ General Dining Information Match Found');
            relevantInfo.push({
                type: 'dining',
                content: {
                    overview: knowledgeBase_is.dining.venues.smakk_bar.menu.about,
                    venues: knowledgeBase_is.dining.venues,
                    link: `[Skoða veitingastaði] (${knowledgeBase_is.website_links.dining.overview})`
                }
            });
        }
    }  // End of Dining section
    
    // Transport and location related queries
    if (message.includes('staðsetn') || 
        message.includes('hvar er') ||
        message.includes('hvað er') ||
        message.includes('komast') ||
        message.includes('kemst') ||
        message.includes('leiðin') ||
        message.includes('leið') ||
        message.includes('keyra') ||
        message.includes('akstur') ||
        message.includes('kílómetr') ||
        message.includes('mínút') ||
        message.includes('strætó') ||
        message.includes('almenningssamgöng') ||
        message.includes('rútu') ||
        message.includes('bíl') ||
        message.includes('bílastæð') ||
        message.includes('leggja') ||
        message.includes('lagt') ||
        message.includes('ganga') ||
        message.includes('hjóla') ||
        message.includes('hjól') ||
        message.includes('BSÍ') ||
        message.includes('bsi') ||
        message.includes('hótel') ||
        message.includes('sækja') ||
        message.includes('tengiferð') ||
        message.includes('reykjavík excursions') ||
        message.includes('vesturvör') ||
        message.includes('kópavog') ||
        message.includes('rafhleðsl') ||
        message.includes('gjaldfrjáls') ||
        message.includes('frítt') ||
        message.includes('borga') ||
        message.includes('samgöng')) {
        
        console.log('\n🚗 Transport & Location Match Found');

        // Parking specific queries
        if (message.includes('bílastæð') || 
            message.includes('leggja') ||
            message.includes('lagt') ||
            message.includes('gjaldfrjáls') ||
            message.includes('frítt') ||
            message.includes('rafhleðsl')) {

            console.log('\n🅿️ Parking Information Match Found');
            
            relevantInfo.push({
                type: 'transportation',
                subtype: 'parking',
                content: {
                    ...knowledgeBase_is.transportation.parking,
                    link: `[Skoða staðsetningu] (${knowledgeBase_is.website_links.transportation.overview})`
                }
            });
        }

        // Public transport specific queries
        if (message.includes('strætó') || 
            message.includes('almenningssamgöng') || 
            message.includes('rútu') ||
            message.includes('BSÍ') ||
            message.includes('bsi') ||
            message.includes('tengiferð')) {

            console.log('\n🚌 Public Transport Match Found');
            
            relevantInfo.push({
                type: 'transportation',
                subtype: 'public_transport',
                content: {
                    public_transport: knowledgeBase_is.transportation.transport_options.public_transport,
                    shuttle_service: knowledgeBase_is.transportation.transport_options.shuttle_service,
                    links: {
                        straeto: `[Skoða strætóleiðir] (${knowledgeBase_is.website_links.transportation.re_website})`,
                        bus_stops: `[Finna næstu stoppistöð] (${knowledgeBase_is.website_links.transportation.re_bus_stops})`
                    }
                }
            });
        }

        // Walking/cycling specific queries
        if (message.includes('ganga') || 
            message.includes('hjóla') ||
            message.includes('hjól') ||
            message.includes('umhverfis')) {

            console.log('\n🚶 Walking/Cycling Information Match Found');
            
            relevantInfo.push({
                type: 'transportation',
                subtype: 'eco_friendly',
                content: {
                    walking_cycling: knowledgeBase_is.transportation.transport_options.walking_cycling,
                    eco_friendly: knowledgeBase_is.transportation.eco_friendly,
                    link: `[Skoða staðsetningu] (${knowledgeBase_is.website_links.transportation.overview})`
                }
            });
        }

        // Driving specific queries
        if (message.includes('keyra') || 
            message.includes('akstur') ||
            message.includes('bíl') ||
            message.includes('kílómetr') ||
            message.includes('mínút')) {

            console.log('\n🚗 Driving Information Match Found');
            
            relevantInfo.push({
                type: 'transportation',
                subtype: 'driving',
                content: {
                    car: knowledgeBase_is.transportation.transport_options.car,
                    location: knowledgeBase_is.transportation.location,
                    links: {
                        map: `[Skoða á korti 📍] (https://www.google.com/maps/dir//Vesturv%C3%B6r+44,+200+K%C3%B3pavogur)`,
                        directions: `[Skoða leiðarlýsingu] (${knowledgeBase_is.website_links.transportation.overview})`
                    }
                }
            });
        }

        // If no specific transport type was matched or asking about general location
        if (!relevantInfo.length ||
            message.includes('staðsetn') ||
            message.includes('hvar er') ||
            message.includes('komast') ||
            message.includes('samgöng')) {

            console.log('\n📍 General Transport & Location Information Match Found');
            
            relevantInfo.push({
                type: 'transportation',
                content: {
                    ...knowledgeBase_is.transportation,
                    links: {
                        map: `[Skoða á korti 📍] (https://www.google.com/maps/dir//Vesturv%C3%B6r+44,+200+K%C3%B3pavogur)`,
                        overview: `[Skoða staðsetningu] (${knowledgeBase_is.website_links.transportation.overview})`
                    }
                }
            });
        }
    }  // End of Transportation section

    // Health and safety related queries
    if (message.includes('ólétt') || 
        message.includes('barnshafandi') || 
        message.includes('þungað') ||
        message.includes('líður ekki vel') ||
        message.includes('sjúkdóm') ||
        message.includes('flogaveiki') ||
        message.includes('gleraugu') ||
        message.includes('öryggi') ||
        message.includes('heilsu') ||
        message.includes('hættuleg') ||
        message.includes('veikindi') ||
        message.includes('veik') ||
        message.includes('meiðsl') ||
        message.includes('slys') ||
        message.includes('gæsla') ||
        message.includes('heilbrigði') ||
        message.includes('þrif') ||
        message.includes('hreinlæti') ||
        message.includes('sótthreinsun')) {

        console.log('\n🏥 Health & Safety Match Found');

        // Pregnancy specific queries
        if (message.includes('ólétt') || 
            message.includes('barnshafandi') || 
            message.includes('þungað')) {
            
            console.log('\n🤰 Pregnancy Information Match Found');
            
            relevantInfo.push({
                type: 'health_safety',
                subtype: 'pregnancy',
                content: knowledgeBase_is.health_safety.pregnancy
            });
        }

        // Medical conditions and illness
        if (message.includes('líður ekki vel') || 
            message.includes('sjúkdóm') || 
            message.includes('flogaveiki') ||
            message.includes('veikindi') ||
            message.includes('veik')) {
            
            console.log('\n🏥 Medical Conditions Match Found');
            
            relevantInfo.push({
                type: 'health_safety',
                subtype: 'medical_conditions',
                content: knowledgeBase_is.health_safety.medical_conditions
            });
        }

        // Glasses and personal items
        if (message.includes('gleraugu')) {
            console.log('\n👓 Glasses Information Match Found');
            
            relevantInfo.push({
                type: 'health_safety',
                subtype: 'glasses',
                content: knowledgeBase_is.health_safety.glasses
            });
        }

        // General safety and cleanliness
        if (message.includes('öryggi') || 
            message.includes('þrif') || 
            message.includes('hreinlæti') ||
            message.includes('sótthreinsun')) {
            
            console.log('\n🧼 Safety & Cleanliness Match Found');
            
            relevantInfo.push({
                type: 'health_safety',
                subtype: 'general_safety',
                content: {
                    safety_emphasis: knowledgeBase_is.health_safety.safety_emphasis,
                    cleanliness: knowledgeBase_is.health_safety.cleanliness,
                    staff_training: knowledgeBase_is.health_safety.staff_training
                }
            });
        }

        // If no specific health topic was matched or asking about general safety
        if (!relevantInfo.length || 
            message.includes('heilsu') || 
            message.includes('heilbrigði')) {
            
            console.log('\n🏥 General Health & Safety Information Match Found');
            
            relevantInfo.push({
                type: 'health_safety',
                content: knowledgeBase_is.health_safety
            });
        }
    }  // End of Health & Safety section

    // Booking and late arrival related queries
    if (message.includes('mæta') || 
        // General booking query patterns
        message.includes('hvernig bóka') ||
        message.includes('hvar bóka') ||
        message.includes('langar að bóka') ||
        message.includes('vil bóka') ||
        message.includes('get ég bókað') ||
        message.includes('er hægt að bóka') ||
        message.includes('má bóka') ||
        (message.includes('hvernig') && message.includes('panta')) ||
        // Existing patterns
        message.includes('seinn') || 
        message.includes('sein') ||
        message.includes('endurbóka') ||
        message.includes('fresta') ||
        message.includes('breyta') ||
        message.includes('færa') ||
        message.includes('fært') ||  // Added
        message.includes('færa tímann') ||  // Added
        message.includes('afbóka') ||
        message.includes('hætta við') ||
        message.includes('veður') ||
        message.includes('veðrið') ||
        message.includes('greiðsla') ||
        message.includes('greiða') ||
        message.includes('borga') ||
        message.includes('fyrirfram') ||
        message.includes('staðfesta') ||
        message.includes('staðfesting') ||
        message.includes('bóka fyrir einn') ||
        (message.includes('bóka') && message.includes('einn')) ||
        (message.includes('bóka') && message.includes('fyrir tvo')) ||
        (message.includes('bóka') && message.includes('tvo')) ||
        (message.includes('er') && message.includes('svigrúm')) ||
        (message.includes('get') && message.includes('seinna')) ||
        (message.includes('ná') && message.includes('tíma')) ||
        message.includes('breytt') ||
        message.includes('bókuninni') ||
        message.includes('tímanum') ||
        // Add new patterns for refund and missed booking queries
        message.includes('endurgreiðsla') ||
        message.includes('endurgreitt') ||
        message.includes('endurgreiða') ||
        message.includes('fá endurgreitt') ||
        message.includes('fengið endurgreitt') ||
        message.includes('komst ekki') ||
        message.includes('komumst ekki') ||
        message.includes('gat ekki mætt') ||
        message.includes('gátum ekki mætt') ||
        message.includes('náði ekki') ||
        message.includes('náðum ekki') ||
        message.includes('mætti ekki') ||
        message.includes('mættum ekki') ||
        (message.includes('bókun') && message.includes('í gær')) ||
        (message.includes('bókun') && message.includes('í fyrradag')) ||
        (message.includes('bókun') && message.includes('átti')) ||
        message.includes('peningana') ||
        message.includes('til baka')) {
        
        console.log('\n📅 Booking Related Query Match Found');

        // Check for missed booking and refund queries first
        if (message.includes('endurgreiðsla') ||
            message.includes('endurgreitt') ||
            message.includes('endurgreiða') ||
            message.includes('fá endurgreitt') ||
            message.includes('fengið endurgreitt') ||
            message.includes('komst ekki') ||
            message.includes('komumst ekki') ||
            message.includes('gat ekki mætt') ||
            message.includes('gátum ekki mætt') ||
            message.includes('náði ekki') ||
            message.includes('náðum ekki') ||
            message.includes('mætti ekki') ||
            message.includes('mættum ekki') ||
            (message.includes('bókun') && message.includes('í gær')) ||
            (message.includes('bókun') && message.includes('í fyrradag')) ||
            message.includes('peningana') ||
            message.includes('til baka')) {
            
            console.log('\n💰 Missed Booking Refund Query Match Found');
            relevantInfo.push({
                type: 'booking',
                subtype: 'refund_policy',
                content: knowledgeBase_is.booking.refund_policy.missed_booking
            });
            return relevantInfo;  // Return immediately for refund queries
        }

        // Check for basic "how to book" queries first
        if (message.includes('hvernig bóka') || 
            message.includes('hvar bóka') ||
            message.includes('langar að bóka') ||
            message.includes('vil bóka') ||
            message.includes('get ég bókað') ||
            message.includes('er hægt að bóka') ||
            message.includes('má bóka') ||
            (message.includes('hvernig') && message.includes('panta'))) {
            
            console.log('\n📝 General Booking Instructions Match Found');
            relevantInfo.push({
                type: 'booking',
                subtype: 'how_to_book',
                content: knowledgeBase_is.booking.general_info
            });
            return relevantInfo;  // Return immediately for basic booking queries
        }

        // Check for booking changes first
        if (message.includes('breyta') || 
            message.includes('breytt') ||
            message.includes('bókuninni') || 
            message.includes('tímanum') ||
            message.includes('endurbóka') ||
            message.includes('fresta') ||
            message.includes('færa') ||
            message.includes('fært') ||  // Added this pattern
            message.includes('færa tímann')) {  // Added this pattern too for good measure
            
            console.log('\n🔄 Booking Change Query Match Found');
            const bookingChangeInfo = knowledgeBase_is.booking.booking_changes.info;
            const response = `${bookingChangeInfo.policy}\n\n` +
                           `${bookingChangeInfo.instructions}\n` +
                           `1. ${bookingChangeInfo.methods.phone.text}\n` +
                           `2. ${bookingChangeInfo.methods.email.text}\n\n` +
                           `${bookingChangeInfo.requirements}\n` +
                           bookingChangeInfo.details.map(detail => `• ${detail}`).join('\n');
            
            relevantInfo.push({
                type: 'booking',
                subtype: 'booking_changes',
                content: response
            });
            return relevantInfo;  // Return immediately for booking changes
        }

        // Check for single person booking queries
        if (message.includes('bóka fyrir einn') || 
            (message.includes('bóka') && message.includes('einn'))) {
            
            console.log('\n👤 Single Booking Query Match Found');
            relevantInfo.push({
                type: 'booking',
                subtype: 'booking_single',
                content: 'Já, þú getur bókað fyrir einn. Við bjóðum bæði upp á Saman og Sér aðgang sem hentar vel fyrir einstaklinga sem vilja njóta slökunar í lóninu. Þú getur bókað á vefsíðu okkar eða í móttökunni ef laust er.'
            });
        }

        // Check for two person booking queries
        if ((message.includes('bóka') && message.includes('fyrir tvo')) || 
            (message.includes('bóka') && message.includes('tvo'))) {
            
            // Check if specifically asking about Date Night/Stefnumót
            if (message.includes('stefnumót') || message.includes('date night')) {
                console.log('\n💑 Date Night Booking Query Match Found');
                relevantInfo.push({
                    type: 'booking',
                    subtype: 'booking_date_night',
                    content: knowledgeBase_is.packages.date_night
                });
            } else {
                console.log('\n👥 Regular Two Person Booking Query Match Found');
                relevantInfo.push({
                    type: 'booking',
                    subtype: 'booking_two',
                    content: 'Til að bóka fyrir tvo getur þú valið á milli tveggja aðgangsleiða:\n\n' +
                            '**Sér aðgangur**\n' +
                            '• Verð frá ISK 13,490 á mann\n' +
                            '• Einkaklefi með sturtu\n' +
                            '• Sky Lagoon hár- og húðvörur\n' +
                            '• Handklæði\n' +
                            '• Aðgangur að Sky Lagoon og Skjól Ritúalinu\n\n' +
                            '**Saman aðgangur**\n' +
                            '• Verð frá ISK 10,490 á mann\n' +
                            '• Almenn búningsaðstaða\n' +
                            '• Sky Lagoon hárvörur\n' +
                            '• Handklæði\n' +
                            '• Aðgangur að Sky Lagoon og Skjól Ritúalinu\n\n' +
                            'Þú getur bókað á vefsíðu okkar skylagoon.is eða í móttökunni ef laust er. Við mælum eindregið með að bóka fyrirfram til að tryggja pláss.'
                });
            }
        }

        // Determine specific booking query type for other cases
        if (message.includes('seinn') || 
            message.includes('sein') || 
            message.includes('mæta') || 
            message.includes('svigrúm')) {
            
            console.log('\n⏰ Late Arrival Query Match Found');
            relevantInfo.push({
                type: 'booking',
                subtype: 'late_arrival',
                content: knowledgeBase_is.booking.late_arrival
            });
        }

        if (message.includes('veður') || 
            message.includes('veðrið')) {
            
            console.log('\n🌤️ Weather Policy Match Found');
            relevantInfo.push({
                type: 'booking',
                subtype: 'weather_policy',
                content: knowledgeBase_is.booking.weather_policy
            });
        }

        if (message.includes('greiðsla') || 
            message.includes('greiða') || 
            message.includes('borga') || 
            message.includes('fyrirfram') || 
            message.includes('staðfesta')) {
            
            console.log('\n💳 Advance Payment Match Found');
            relevantInfo.push({
                type: 'booking',
                subtype: 'advance_payment',
                content: knowledgeBase_is.booking.advance_payment
            });
        }

        // If no specific subtype was matched, return general booking info
        if (!relevantInfo.length) {
            console.log('\n📝 General Booking Information Match Found');
            relevantInfo.push({
                type: 'booking',
                content: knowledgeBase_is.booking
            });
        }
    }

    // Group bookings related queries
    if (message.includes('hóp') ||
        message.includes('hópa') ||
        message.includes('hópabókun') ||
        message.includes('hópnum') ||
        message.includes('saman') ||
        message.includes('margir') ||
        (message.includes('fleiri') && message.includes('manns')) ||
        (message.includes('verð') && message.includes('hóp')) ||
        (message.includes('bóka') && message.includes('marga')) ||
        (message.includes('koma') && message.includes('saman'))) {
        
        console.log('\n👥 Group Booking Match Found');
        relevantInfo.push({
            type: 'group_bookings',
            content: knowledgeBase_is.group_bookings
        });
    }

    // Age policy related queries
    if (message.toLowerCase().includes('aldur') || 
        message.toLowerCase().includes('aldurs') ||
        message.toLowerCase().includes('barn') ||
        message.toLowerCase().includes('börn') ||
        message.toLowerCase().includes('ára') ||
        message.toLowerCase().includes('gamall') ||
        message.toLowerCase().includes('gömul') ||
        message.toLowerCase().includes('fylgd') ||
        message.toLowerCase().includes('foreldri') ||
        message.toLowerCase().includes('foreldra') ||
        message.toLowerCase().includes('forráðamanna') ||
        message.toLowerCase().includes('fæðingarár') ||
        message.toLowerCase().includes('ungling') ||
        // Basic age limit patterns
        message.toLowerCase().includes('aldurstakmark') ||
        message.toLowerCase().includes('aldurstakmörk') ||
        message.toLowerCase().includes('aldurstakmarki') ||
        message.toLowerCase().includes('aldurstakmarkið') ||
        // Add very basic patterns
        message.toLowerCase() === 'er aldurstakmark' ||
        message.toLowerCase() === 'er aldurstakmark?' ||
        (message.toLowerCase().includes('er') && message.toLowerCase().includes('aldurstakmark'))) {

        console.log('\n👶 Age Policy Match Found');
        console.log('Matched message:', message);
        relevantInfo.push({
            type: 'age_policy',
            content: knowledgeBase_is.age_policy
        });
    }
    
    // Photography rules related queries
    if (message.includes('ljósmynd') || 
        message.includes('mynd') ||
        message.includes('mynda') ||
        message.includes('myndavél') ||
        message.includes('símavörn') ||
        message.includes('símahlíf') ||
        message.includes('vatnsheldar') ||
        message.includes('bag protector') ||
        message.includes('verja síma') ||
        message.includes('símahulstur') ||
        (message.includes('taka') && message.includes('myndir')) ||
        (message.includes('nota') && message.includes('síma'))) {
        
        console.log('\n📸 Photography Rules Match Found');
        relevantInfo.push({
            type: 'photography_rules',
            content: knowledgeBase_is.photography_rules
        });
    }

    // Views and landmarks related queries
    if (message.includes('sést') ||
        message.includes('útsýni') ||
        message.includes('norðurljós') ||
        message.includes('bessastað') ||
        message.includes('keili') ||
        message.includes('snæfellsjökul') ||
        message.includes('sólarlag') ||
        message.includes('sólsetur') ||
        message.includes('miðnætursól') ||
        message.includes('stjörnu') ||
        message.includes('kennileiti') ||
        message.includes('fjöll') ||
        message.includes('jökul') ||
        message.includes('staði') ||
        (message.includes('hvaða') && message.includes('sjá')) ||
        (message.includes('hvað') && message.includes('sjá')) ||
        (message.includes('hægt') && message.includes('sjá')) ||
        (message.includes('hvernig') && message.includes('útsýni')) ||
        (message.includes('hvernig') && message.includes('sést'))) {
        
        console.log('\n👀 Views and Landmarks Match Found');

        // Check for specific natural phenomena queries
        if (message.includes('norðurljós') || 
            message.includes('sólarlag') ||
            message.includes('sólsetur') ||
            message.includes('miðnætursól') ||
            message.includes('stjörnu')) {
            
            console.log('\n🌌 Natural Phenomena Match Found');
            relevantInfo.push({
                type: 'views_and_landmarks',
                subtype: 'natural_phenomena',
                content: knowledgeBase_is.views_and_landmarks.natural_phenomena
            });
        }

        // Check for specific landmark queries
        if (message.includes('bessastað')) {
            relevantInfo.push({
                type: 'views_and_landmarks',
                subtype: 'landmark',
                content: knowledgeBase_is.views_and_landmarks.landmarks.bessastadir
            });
        }
        if (message.includes('keili')) {
            relevantInfo.push({
                type: 'views_and_landmarks',
                subtype: 'landmark',
                content: knowledgeBase_is.views_and_landmarks.landmarks.keilir
            });
        }
        if (message.includes('snæfellsjökul') || message.includes('jökul')) {
            relevantInfo.push({
                type: 'views_and_landmarks',
                subtype: 'landmark',
                content: knowledgeBase_is.views_and_landmarks.landmarks.snaefellsjokull
            });
        }

        // If no specific matches or general view query, return all views info
        if (!relevantInfo.length || 
            message.includes('útsýni') ||
            message.includes('sést') ||
            message.includes('kennileiti') ||
            message.includes('staði') ||
            (message.includes('hvaða') && message.includes('sjá')) ||
            (message.includes('hvað') && message.includes('sjá'))) {
            
            console.log('\n🏔️ General Views Information Match Found');
            relevantInfo.push({
                type: 'views_and_landmarks',
                content: knowledgeBase_is.views_and_landmarks
            });
        }
    } // End of Views and landmarks related queries section

    // Lost and found queries
    if (message.includes('týnd') || 
        message.includes('týnt') ||
        message.includes('týndi') ||
        message.includes('gleym') ||
        message.includes('gleymd') ||
        message.includes('gleymdi') ||
        message.includes('óskilamun') ||
        message.includes('fann') ||
        message.includes('fundið') ||
        message.includes('skildi eftir') ||
        message.includes('finna') ||
        (message.includes('hvar') && message.includes('leita'))) {

        console.log('\n🔍 Lost & Found Match Found');
        relevantInfo.push({
            type: 'lost_found',
            content: knowledgeBase_is.lost_found
        });
    }  // End of Lost and found queries section

    return relevantInfo; 
}  // Final closing bracket for the entire function