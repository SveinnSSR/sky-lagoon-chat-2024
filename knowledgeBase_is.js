// knowledgeBase_is.js

// Add this import at the top of knowledgeBase.js
import { searchSimilarContent } from './utils/embeddings.js';

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
            additional: "Skjól Ritúal meðferðin og Gelmir bar loka klukkutíma fyrir lokun.",
            // Add this new section
            last_entry: {
                policy: "Síðasta innritun er alltaf 2 klukkustundum fyrir lokun.",
                seasonal_times: {
                    winter: "Síðasta innritun er klukkan 20:00 yfir vetrartímann (1. nóvember - 31. maí)",
                    summer: "Síðasta innritun er klukkan 21:00 yfir sumartímann (1. júní - 30. september)",
                    autumn: "Síðasta innritun er klukkan 21:00 yfir hausttímann (1. október - 31. október)"
                },
                explanation: "Þar sem ritúalið og barinn loka klukkutíma fyrir lokun og lónið 30 mínútum fyrir lokun, þá er innritun lokað 2 klukkustundum fyrir lokun.",
                recommendation: "Við mælum með að bóka að minnsta kosti 2-3 klukkustundum fyrir lokun til að njóta allra þæginda okkar að fullu."
            }
        }
    },
    // Add the new pricing comparison section to knowledgeBase_is
    pricing_comparison: {
        questions: [
            "Hvað er ódýrast?",
            "Hver er ódýrasti pakkinn?",
            "Hvað er hagstæðast?",
            "Hver er hagstæðasti kosturinn?",
            "Hvaða pakki er ódýrastur?",
            "Hvað er ódýrasti valkosturinn?",
            "Hvaða leið er ódýrust?",
            "Hvernig kemst ég ódýrast í Sky Lagoon?",
            "Hvað kostar minnst?",
            "Hvernig get ég sparað?",
            "Hvað er lægsta verðið?",
            "Hver er ódýrasta leiðin?",
            "Hvað er ódýrasta aðgangsleiðin?"
        ],
        cheapest_options: {
            standard: {
                name: "Saman aðgangur - Almenn búningsaðstaða",
                description: "Okkar vinsælasti pakki og ódýrasti valkosturinn fyrir fullorðna.",
                pricing: {
                    weekday: {
                        price: "12.990 ISK",
                        days: "Mánudaga til fimmtudaga"
                    },
                    weekend: {
                        price: "14.990 ISK",
                        days: "Föstudaga til sunnudaga"
                    }
                },
                includes: [
                    "Aðgangur að Sky Lagoon",
                    "Eitt ferðalag í gegnum sjö skrefa Skjól Ritúalið",
                    "Almenn búningsaðstaða og Sky Lagoon hárvörur",
                    "Handklæði"
                ],
                link: "https://www.skylagoon.com/is/leidir-til-ad-njota"
            },
            youth: {
                name: "Saman aðgangur fyrir unglinga (12-14 ára)",
                description: "Ódýrasti kosturinn fyrir unglinga á aldrinum 12-14 ára í fylgd með fullorðnum.",
                pricing: {
                    weekday: {
                        price: "6.495 ISK",
                        days: "Mánudaga til fimmtudaga"
                    },
                    weekend: {
                        price: "7.495 ISK",
                        days: "Föstudaga til sunnudaga"
                    }
                },
                note: "Athugið að unglingur þarf að vera í fylgd forráðamanns (18 ára eða eldri).",
                age_info: "Börn sem verða 12 ára á almanaksárinu geta keypt unglingamiða.",
                link: "https://www.skylagoon.com/is/leidir-til-ad-njota"
            },
            multi_pass: {
                name: "Venja Multi-Pass",
                description: "Ódýrasti kosturinn á hverja heimsókn fyrir þá sem heimsækja Sky Lagoon oft.",
                pricing: {
                    price: "35.970 ISK fyrir 6 skipti",
                    per_visit: "Aðeins 5.995 ISK á hverja heimsókn"
                },
                details: "Multi-Pass kortið gildir í 4 ár og er persónubundið. Hver passi er fyrir sex heimsóknir eins gests, ekki hóp gesta.",
                includes: [
                    "Aðgangur að Sky Lagoon",
                    "Skjól Ritúal meðferð í hverri heimsókn",
                    "Almenn búningsaðstaða"
                ],
                link: "https://www.skylagoon.com/is/kaupa-multi-pass"
            }
        },
        answer: {
            main: "Ódýrasti valkosturinn fyrir fullorðna er Saman aðgangur sem kostar 12.990 ISK á virkum dögum (mánudaga til fimmtudaga) og 14.990 ISK um helgar (föstudaga til sunnudaga).",
            youth: "Fyrir unglinga á aldrinum 12-14 ára er ódýrasti kosturinn Saman unglingaaðgangur sem kostar 6.495 ISK á virkum dögum og 7.495 ISK um helgar. Athugið að unglingur þarf að vera í fylgd með fullorðnum.",
            multi_pass: "Ef þú ætlar að heimsækja Sky Lagoon oftar, þá er hagstæðast að kaupa Venju Multi-Pass sem kostar 35.970 ISK fyrir 6 skipti, eða aðeins 5.995 ISK á hverja heimsókn.",
            links: {
                packages: "[Skoða leiðir til að njóta](https://www.skylagoon.com/is/leidir-til-ad-njota)",
                multi_pass: "[Skoða Multi-Pass](https://www.skylagoon.com/is/kaupa-multi-pass)"
            }
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
        },
        spa_services: {
            questions: [
                "Er boðið upp á nudd?",
                "Get ég pantað nudd?",
                "Eru nuddmeðferðir í boði?",
                "Er hægt að fá nudd?",
                "Bjóðið þið upp á nuddþjónustu?",
                "Er hægt að panta nuddtíma?",
                "Eru nuddarar á staðnum?",
                "Má bóka nudd með heimsókn?",
                "Hvað kostar nudd?",
                "Eruð þið með spa meðferðir?",
                "Er hægt að fá heilnudd?",
                "Býður Sky Lagoon upp á nudd?"
            ],
            massage_info: {
                availability: false,
                answer: "Nei, því miður bjóðum við ekki upp á nuddþjónustu eða sérstakar spa meðferðir í Sky Lagoon. Upplifunin okkar er einblínir á sjö skrefa Skjól Ritúalið sem veitir djúpa slökun og vellíðan fyrir líkama og sál.",
                ritual_alternative: "Við mælum með að njóta Skjól Ritúalsins okkar sem veitir mikla slökun. Meðferðin samanstendur af sjö endurnærandi skrefum sem innihalda heitt og kalt vatn, hlýja gufuböð, ferska súld, endurnærandi saltskrúbb og meira.",
                future_plans: "Við höfum ekki áform um að bæta nuddþjónustu við Sky Lagoon í náinni framtíð, þar sem áhersla okkar er á heildarupplifun lónsins og ritúalsins."
            }
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
                    // best_value: "Mánudaga til fimmtudaga"
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
        },
        // Add the new upgrades section here
        upgrades: {
            questions: [
                "Er hægt að uppfæra frá saman leiðinni í sér?",
                "Get ég uppfært frá saman til sér?",
                "Er hægt að breyta úr saman í sér?",
                "Get ég skipt úr saman yfir í sér?",
                "Má breyta úr saman yfir í sér við komu?",
                "Get ég uppfært bókunina mína?",
                "Er hægt að uppfæra pakkann minn?",
                "Hvað kostar að uppfæra úr saman í sér?",
                "Get ég borgað mismuninn og fengið sér?",
                "Er hægt að uppfæra við komu?",
                "Get ég uppfært þegar ég mæti?",
                "Er hægt að skipta yfir í einkaklefa við komu?",
                "Hvað kostar að breyta úr saman í sér?",
                "Er hægt að uppfæra í móttökunni?"
            ],
            at_arrival: {
                possible: true,
                availability: "Háð framboði á Sér klefum við komu",
                process: "Þú getur beðið um uppfærslu í móttökunni þegar þú mætir",
                payment: "Þú greiðir mismuninn á Sér og Saman í móttökunni",
                note: "Ekki hægt að ábyrgjast að Sér klefi sé laus, sérstaklega á annatímum. Við mælum með að bóka Sér fyrirfram ef það er mikilvægt fyrir þig að fá einkaklefa."
            },
            pre_arrival: {
                possible: true,
                process: "Til að uppfæra úr Saman í Sér fyrir komu, vinsamlegast sendu okkur póst á reservations@skylagoon.is með bókunarnúmerinu þínu að lágmarki 24 tímum fyrir komu",
                contact: {
                    email: "reservations@skylagoon.is",
                    phone: "+354 527 6800"
                }
            },
            response: {
                general: "Já, þú getur uppfært úr Saman í Sér á tvo vegu:\n\n1. **Við komu**: Þú getur beðið um uppfærslu í móttökunni þegar þú mætir og greitt mismuninn. Þetta er þó háð framboði á Sér klefum á þeim tíma.\n\n2. **Fyrir komu**: Sendu okkur póst á reservations@skylagoon.is með bókunarnúmerinu þínu að lágmarki 24 tímum fyrir komu.\n\nEf þú vilt vera með fullkomna vissu um að fá Sér klefa, mælum við með að uppfæra bókunina fyrirfram eða bóka beint Sér leið frá upphafi.",
                with_gift_card: "Já, þú getur uppfært frá Saman til Sér leið. Ef þú ert með Saman gjafabréf, getur þú notað það upp í Sér aðgang og greitt mismuninn. Þetta er hægt að gera bæði við bókun á netinu (slá inn gjafabréfskóðann og greiða mismuninn) eða við komu í móttökunni (háð framboði).\n\nEf þú hefur þegar bókað Saman leið, getur þú beðið um uppfærslu í móttökunni þegar þú mætir og greitt mismuninn, eða sent okkur fyrirfram beiðni á reservations@skylagoon.is."
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
                        text: "Sendu tölvupóst á reservations@skylagoon.is",
                        address: "reservations@skylagoon.is"
                    }
                },
                requirements: "Vinsamlegast láttu fylgja með í tölvupósti:",
                details: [
                    "Bókunarnúmer",
                    "Hvort þú viljir breyta dagsetningu eða fá endurgreiðslu"
                ],
                cancel_wording: "afbóka" // Use "afbóka" instead of "afpanta"
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
        // Add the new booking_capacity section here
        booking_capacity: {
            questions: [
                "Er hægt að koma ef það er ekki laust?",
                "Getum við komið þó að það sé fullt?",
                "Ef það er ekki laust, er líklegt að hægt sé að koma?",
                "Er hægt að koma þó allt sé bókað?",
                "Ef vefsíðan sýnir að það er fullt, getum við komið samt?",
                "Hvað þýðir það þegar það er eitt pláss laust?",
                "Er biðlisti ef allt er uppselt?",
                "Get ég skráð mig á biðlista?",
                "Það er uppselt, hvað get ég gert?",
                "Hvað þýðir \"1 laust\"?",
                "Mig vantar pláss fyrir tvo en það er bara eitt laust",
                "Kemst ég að ef ég mæti bara?",
                "Þarf að bóka eða get ég komið óvænt?",
                "Eru líkur á að ég komist að þó að það sé uppselt?",
                "Hvað ef það er uppselt á netinu, get ég mætt á staðinn?",
                "Getið þið látið mig vita ef það losnar?",
                "Get ég bætt við fleiri gestum í bókunina mína?",
                "Getið þið hringt ef það losnar?",
                "Er hægt að fá SMS ef það kemur afbókun?",
                "Getið þið skráð mig á biðlista ef það losnar?",
                "Getið þið geymt nafnið mitt ef það kemur afbókun?"
            ],
            availability: {
                system: "Rauntíma bókunarkerfi",
                capacity_display: {
                    single_spot: "Þegar kerfið sýnir '1 laust', þýðir það að það er aðeins pláss fyrir einn einstakling á þeim tíma",
                    multiple_spots: "Talan sem sýnd er gefur til kynna nákvæmlega hversu mörg pláss eru laus á hverjum tíma",
                    sold_out: "Þegar vefsíðan sýnir enga lausa tíma, getum við því miður ekki tekið á móti fleiri gestum á þeim tíma"
                },
                real_time: "Framboð uppfærist sjálfkrafa með bókunum og afbókunum",
                walk_in_policy: {
                    rules: "Gestir án bókunar eru aðeins velkomnir ef vefsíðan sýnir laus pláss",
                    restrictions: "Við getum ekki tekið á móti gestum umfram sýnileg laus pláss, jafnvel þó þeir mæti á staðinn",
                    reason: "Við höfum ákveðinn hámarksfjölda til að tryggja þægindi og öryggi gesta"
                },
                cancellations: "Vefsíðan uppfærist sjálfkrafa ef pláss losna vegna afbókana",
                advance_booking: {
                    recommended: true,
                    reason: "Til að tryggja þér þann tíma sem þú vilt",
                    walk_in: "Háð framboði við komu"
                },
                waiting_list: {
                    available: false,
                    explanation: "Sky Lagoon heldur ekki biðlista fyrir uppseld tímabil",
                    alternatives: [
                        "Bókunarkerfið okkar uppfærist í rauntíma þegar pláss losna vegna afbókana",
                        "Við mælum með að athuga vefsíðuna okkar reglulega til að sjá nýjar opnanir",
                        "Bókunarframboð er nákvæmast á okkar opinberu vefsíðu",
                        "Afbókanir á síðustu stundu geta skapað ný pláss, sérstaklega 24-48 klukkustundum fyrir vinsæla tíma"
                    ],
                    contact_info: "Fyrir aðkallandi fyrirspurnir um ákveðna daga, hafðu samband við reservations@skylagoon.is"
                }
            },
            capacity_explanation: {
                one_spot_limitation: "Þegar bókunarsíðan sýnir \"1 laust pláss\" þýðir það nákvæmlega það - aðeins einn einstaklingur getur bókað þann tíma. Því miður er ekki hægt að bóka fyrir fleiri en einn einstakling þegar aðeins er eitt pláss laust.",
                family_with_children: "Ef þú ert að bóka fyrir fullorðinn og barn þegar aðeins er eitt pláss laust, þá dugar plássið því miður ekki fyrir báða. Hver einstaklingur, óháð aldri, þarf sitt eigið pláss í bókunarkerfinu.",
                recommendation: "Við mælum með að skoða aðra tíma þar sem eru tvö eða fleiri pláss laus, eða hafa samband við okkur í síma 527 6800 til að fá aðstoð við að finna tíma sem hentar."
            },
            response: {
                fully_booked: "Því miður getum við ekki tekið á móti fleiri gestum þegar vefsíðan sýnir að það sé uppselt á ákveðnum tíma. Bókunarkerfið okkar sýnir nákvæma stöðu í rauntíma og við verðum að virða þessi takmörk til að tryggja bestu mögulegu upplifun fyrir alla gesti.\n\nVið höldum ekki biðlista, en mælum með að athuga vefsíðuna okkar reglulega þar sem afbókanir geta skapað ný pláss, sérstaklega 24-48 klukkustundum fyrir vinsæla tíma. Þú getur einnig prófað að bóka annan tíma eða dag.",
                one_spot_available: "Þegar bókunarsíðan sýnir \"1 laust pláss\" þýðir það nákvæmlega það - aðeins einn einstaklingur getur bókað þann tíma. Því miður er ekki hægt að bóka fyrir fleiri en einn einstakling þegar aðeins er eitt pláss laust.\n\nÞar sem þú ert að bóka fyrir fullorðinn og barn, þá dugar plássið því miður ekki fyrir báða. Hver einstaklingur, óháð aldri, þarf sitt eigið pláss í bókunarkerfinu.\n\nVið mælum með að skoða aðra tíma þar sem eru tvö eða fleiri pláss laus, eða hafa samband við okkur í síma 527 6800 til að fá aðstoð við að finna tíma sem hentar."
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
    sunset: {
        questions: [
            "Hvenær er sólsetur í júlí?",
            "Hvenær sest sólin?",
            "Hvenær get ég séð sólarlagið í Sky Lagoon?",
            "Hvað er sólin lengi að setjast?",
            "Hvernig er sólarlagið í júní?",
            "Hvenær er best að sjá sólarlagið?",
            "Hvaða tíma sest sólin í desember?",
            "Er hægt að sjá sólarlag á veturna?"
        ],
        topic: "sunset",
        keywords: ["sólsetur", "sólarlag", "kvöldroði", "rökkur", "gyllta stund", "himinlitur", "kvöldbirta", "sólarlagsútsýni", "sólarlagstímar", "hvenær sest sólin", "sólarlagstími"],
        content: `
        Frá Sky Lagoon er stórbrotin sýn yfir sólarlagið yfir Norður-Atlantshafinu. Upplifunin breytist eftir árstíðum vegna legu Íslands á nyrðri breiddargráðu:  
    
        - Vetur (nóvember-febrúar): Snemma sólsetur milli 15:40-16:45  
        - Vor (mars-apríl): Kvöldsólsetur milli 18:00-20:30  
        - Sumar (maí-ágúst): Seint sólsetur milli 20:30-22:15 með langvarandi rökkri  
        - Haust (september-október): Kvöldsólsetur milli 17:00-19:45  
    
        Í kringum sumarsólstöður (21. júní) er nær óslitin dagsbirta, þar sem sólin sest eftir kl. 22:00 og rís aftur um kl. 03:00. Þetta skapar töfrandi gyllna stund sem getur varað í margar klukkustundir.  
    
        Í desember og janúar er hins vegar mjög takmarkað dagsljós, og sólin sest fyrir kl. 16:00.  
    
        Fyrir nákvæmasta sólseturstíma á heimsóknardegi þínum skaltu skoða sólarlagstímagagnagrunninn okkar eða spyrja um tiltekinn mánuð.  
    
        Lónið snýr í vestur og er því fullkominn staður til að horfa á sólarlagið á meðan þú slakar á í jarðhitavatninu okkar. Margir gestir lýsa því sem hápunkti heimsóknarinnar þegar heita vatnið, ferska loftið og stórkostlegt sólarlagið renna saman í eina ógleymanlega upplifun.  
    
        Til að njóta sólarlagsins sem best mælum við með að koma 1-2 klukkustundum fyrir sólsetur og upplifa breytinguna á himninum í kyrrð lónsins.`      
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
            general: "Ef þú týndir einhverju í Sky Lagoon munum við gera okkar besta í að finna það og skila því til þín.",
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
    },
    careers: {
        questions: [
            "get ég sótt um starf",
            "sækja um starf",
            "starfsumsókn",
            "sækja um vinnu",
            "sækja um sumarstarf",
            "starfsmöguleikar",
            "atvinnuumsókn",
            "vinna hjá ykkur",
            "starfa hjá ykkur",
            "gæsluvörður",
            "sumarstörf",
            "atvinnumöguleikar"
        ],
        application_info: {
            instructions: "Við hvetjum þig til að senda okkur ferilskrá og kynningarbréf á netfangið info@skylagoon.is.",
            additional_info: "Láttu okkur vita af reynslu þinni og hvers vegna þú vilt vinna hjá okkur."
        }
    }                 
};

// Replace or modify your existing getRelevantKnowledge_is function
export async function getRelevantKnowledge_is(query) {
  try {
    // Use vector search approach with lower threshold
    const results = await searchSimilarContent(query, 5, 0.5, 'is');
    
    if (!results || results.length === 0) {
      console.log('No vector search results found for Icelandic query:', query);
      return [];
    }
    
    // Transform the results into the format expected by the rest of the code
    return results.map(result => ({
      type: result.metadata?.type || 'unknown',
      content: result.content,
      metadata: result.metadata || {},
      similarity: result.similarity
    }));
    
  } catch (error) {
    console.error('Error in vector search for getRelevantKnowledge_is:', error);
    // Return empty array in case of error
    return [];
  }
}