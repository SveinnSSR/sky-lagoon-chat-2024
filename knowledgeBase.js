// knowledgeBase.js
// Add this import at the top of knowledgeBase.js
import { searchSimilarContent } from './utils/embeddings.js';

export const knowledgeBase = {
    website_links: {
        main: "https://www.skylagoon.com",
        booking: "https://www.skylagoon.com/booking/",
        packages: "https://www.skylagoon.com/packages/",
        ritual: "https://www.skylagoon.com/experience/skjol-ritual/",
        dining: {
            overview: "https://www.skylagoon.com/food-drink/",
            smakk_bar: "https://www.skylagoon.com/dining/smakk-bar/",
            keimur_cafe: "https://www.skylagoon.com/food-drink/keimur-cafe/",
            gelmir_bar: "https://www.skylagoon.com/dining/gelmir-bar/"
        },
        transportation: {
            overview: "https://www.skylagoon.com/getting-here",
            re_website: "https://www.re.is",
            re_bus_stops: "https://www.re.is/pick-up-locations",
            re_booking: "https://www.skylagoon.com/book-transfer",
        },
        gift_tickets: "https://www.skylagoon.com/buy-gift-tickets/",
        multi_pass: "https://www.skylagoon.com/multi-pass/"
    },
    opening_hours: {
        tagline: "We look forward to welcoming you where the sea meets the sky",
        regular: {
            summer: {
                period: "June 1 - September 30",
                hours: "09:00 (GMT) - 23:00 (GMT)",
                daily: true,
                facilities: {
                    lagoon: "Closes 30 minutes before closing time",
                    ritual: "Closes 1 hour before closing time",
                    gelmir_bar: "Closes 1 hour before closing time",
                    keimur_cafe: "09:00 (GMT) - 22:30 (GMT)",
                    smakk_bar: "12:00 (GMT) - 22:30 (GMT)"
                }
            },
            autumn: {
                period: "October 1 - October 31",
                hours: "10:00 (GMT) - 23:00 (GMT)",
                daily: true,
                facilities: {
                    lagoon: "Closes 30 minutes before closing time",
                    ritual: "Closes 1 hour before closing time",
                    gelmir_bar: "Closes 1 hour before closing time",
                    keimur_cafe: "10:00 (GMT) - 22:30 (GMT)",
                    smakk_bar: "12:00 (GMT) - 22:30 (GMT)"
                }
            },
            winter: {
                period: "November 1 - May 31",
                weekday: {
                    days: "Monday - Friday",
                    hours: "11:00 (GMT) - 22:00 (GMT)",
                    facilities: {
                        lagoon: "Closes 30 minutes before closing time",
                        ritual: "Closes 1 hour before closing time",
                        gelmir_bar: "Closes 1 hour before closing time",
                        keimur_cafe: "11:00 (GMT) - 21:30 (GMT)",
                        smakk_bar: "12:00 (GMT) - 21:30 (GMT)"
                    }
                },
                weekend: {
                    days: "Saturday - Sunday",
                    hours: "10:00 (GMT) - 22:00 (GMT)",
                    facilities: {
                        lagoon: "Closes 30 minutes before closing time",
                        ritual: "Closes 1 hour before closing time",
                        gelmir_bar: "Closes 1 hour before closing time",
                        keimur_cafe: "11:00 (GMT) - 21:30 (GMT)",
                        smakk_bar: "12:00 (GMT) - 21:30 (GMT)"
                    }
                }
            }
        },
        holidays: {
            christmas_eve: {
                date: "December 24",
                hours: "09:00 (GMT) - 16:00 (GMT)",
            },
            christmas_day: {
                date: "December 25",
                hours: "09:00 (GMT) - 18:00 (GMT)",
            },
            boxing_day: {
                date: "December 26",
                hours: "09:00 (GMT) - 22:00 (GMT)",
            },
            new_years_eve: {
                date: "December 31",
                hours: "09:00 (GMT) - 18:00 (GMT)",
            },
            new_years_day: {
                date: "January 1",
                hours: "10:00 (GMT) - 22:00 (GMT)",
            }
        },
        important_notes: [
            "The Lagoon area closes 30 minutes before advertised closing time",
            "The Skjól Ritual and Gelmir Bar close one hour before facility closing",
            "Last food orders at Smakk Bar are taken 30 minutes before closing",
            "Advance booking recommended to secure your preferred time slot",
            "Hours may vary during special holidays or events",
            "Last entry is always 2 hours before closing time"
        ],
        dining_hours: {
            keimur_cafe: {
                name: "Keimur Café",
                description: "Fresh coffee, light meals, and Icelandic treats",
                summer: {
                    period: "June 1 - September 30",
                    hours: "09:00 (GMT) - 22:30 (GMT)"
                },
                autumn: {
                    period: "October 1 - October 31",
                    hours: "10:00 (GMT) - 22:30 (GMT)"
                },
                winter: {
                    period: "November 1 - May 31",
                    hours: "11:00 (GMT) - 21:30 (GMT)"
                },
                notes: "Last orders 30 minutes before closing"
            },
            smakk_bar: {
                name: "Smakk Bar",
                description: "Icelandic culinary experience with tasting platters",
                summer: {
                    period: "June 1 - September 30",
                    hours: "12:00 (GMT) - 22:30 (GMT)"
                },
                autumn: {
                    period: "October 1 - October 31",
                    hours: "12:00 (GMT) - 22:30 (GMT)"
                },
                winter: {
                    period: "November 1 - May 31",
                    hours: "12:00 (GMT) - 21:30 (GMT)"
                },
                notes: "Last orders 30 minutes before closing"
            },
            gelmir_bar: {
                name: "Gelmir Bar",
                description: "In-water bar for drinks and refreshments",
                note: "Closes one hour before facility closing",
                access: "Available throughout lagoon opening hours until one hour before closing"
            }
        },
        arrival_guidance: {
            check_in: "Arrive within your 30-minute check-in window",
            early_arrival: "Early arrival may result in waiting",
            late_arrival: {
                grace_period: "30 minutes from booked time",
                beyond_grace: "Subject to availability if arriving after grace period"
            },
            // Add this new section here
            last_entry: {
                policy: "Last entry is always 2 hours before closing time",
                seasonal_times: {
                    winter: "20:00 (GMT) during winter season (November 1 - May 31)",
                    summer: "21:00 (GMT) during summer season (June 1 - September 30)",
                    autumn: "21:00 (GMT) during autumn season (October 1 - October 31)"
                },
                important_note: "The Skjól ritual and Gelmir Bar close one hour before facility closing, and the lagoon area closes 30 minutes before closing time",
                booking_recommendation: "We recommend booking at least 2-3 hours before closing to fully enjoy all facilities"
            }    
        },
        seasonal_notes: {
            summer: "Extended daylight hours with midnight sun possibilities in June",
            winter: "Potential for northern lights viewing on clear evenings",
            general: "Experience varies with Iceland's dramatic seasonal changes"
        }
    },

    packages: {
        saman: {
            name: "Saman Package (Standard)",
            description: "Our classic and most popular package - connect with tradition through the essential Sky Lagoon experience",  // Enhanced with website phrasing
            includes: [
                "Sky Lagoon admission",
                "Skjól ritual access",
                "Public changing facilities",
                "Towels included",
                "Access to in-water Gelmir Bar",
                "Basic Sky Lagoon amenities"
            ],
            changing_facilities: {
                type: "Public",
                amenities: [
                    "Showers",
                    "Hair dryers",
                    "Lockers",
                    "Basic amenities",
                    "Shared facilities"
                ]
            },
            pricing: {
                weekday: {
                    range: "12,990 ISK",
                    days: "Monday-Thursday",
                    // best_value: "Monday-Thursday"
                },
                weekend: {
                    range: "14,990 ISK",
                    days: "Friday-Sunday"
                }
            },
            youth_pricing: {
                description: "Special pricing for guests aged 12-14 years",
                note: "Children who turn 12 within the calendar year are eligible for youth pricing",
                requirements: "Must be accompanied by a guardian (18 years or older)",
                weekday: {
                    price: "6,495 ISK",
                    days: "Monday-Thursday"
                },
                weekend: {
                    price: "7,495 ISK",
                    days: "Friday-Sunday"
                }
            },
            booking_info: {
                how_to_book: "Book directly through our website or at reception",
                availability: "Subject to capacity",
                recommended: "Advance booking recommended",
                modifications: {
                    deadline: "24 hours notice required",
                    contact: "reservations@skylagoon.is"
                }
            }
        },
        ser: {
            name: "Sér Package (Premium)", 
            description: "Discover the ultimate Sky Lagoon experience where the sea meets the sky. Our premium package includes Sky Lagoon's signature Skjól ritual and access to our private changing facilities.",  // Enhanced with website phrasing
            includes: [
                "Sky Lagoon admission",
                "One journey through the Skjól ritual",
                "Private changing facilities with our signature Sky Body Lotion",
                "Premium Sky Lagoon amenities",
                "Towels included",
                "Access to in-water Gelmir Bar"
            ],
            changing_facilities: {
                type: "Private",
                amenities: [
                    "Individual private changing space",
                    "Personal shower and changing area",
                    "Premium hair dryers",
                    "Sky Lagoon skincare products",
                    "Enhanced privacy",
                    "Luxury amenities"
                ]
            },
            pricing: {
                weekday: {
                    range: "15,990 ISK",
                    days: "Monday-Thursday",
                    // best_value: "Monday-Thursday"
                },
                weekend: {
                    range: "17,990 ISK",
                    days: "Friday-Sunday"
                }
            },
            youth_pricing: {
                description: "Special pricing for guests aged 12-14 years",
                note: "Children who turn 12 within the calendar year are eligible for youth pricing",
                requirements: "Must be accompanied by a guardian (18 years or older)",
                weekday: {
                    price: "7,995 ISK",
                    days: "Monday-Thursday"
                },
                weekend: {
                    price: "8,995 ISK",
                    days: "Friday-Sunday"
                }
            },
            booking_info: {
                how_to_book: "Book directly through our website or at reception",
                availability: "Subject to capacity",
                recommended: "Advance booking recommended",
                modifications: {
                    deadline: "24 hours notice required",
                    contact: "reservations@skylagoon.is"
                }
            },
            features: "Well-appointed private changing rooms with enhanced comfort and premium amenities"
        },
        for_two: {
            name: "Sky Lagoon for Two",
            also_known_as: "Date Night",
            description: "Share a rejuvenating journey with a partner, friend, or family member at Sky Lagoon.",
            options: {
                ser_for_two: {
                    name: "Sér for Two",
                    price: "From ISK 341,480",
                    includes: [
                        "2 x Sér passes",
                        "Private changing facilities",
                        "Skjól ritual access",
                        "One drink per guest served exclusively with Sky Platter at Smakk Bar", // More explicit
                        "Sky Platter from Smakk Bar",
                        "Towels included"
                    ],
                    drink_note: "Package drinks are only available at Smakk Bar with your Sky Platter. Drinks at Gelmir Bar are available for additional purchase." // Add this new field
                },
                saman_for_two: {
                    name: "Saman for Two",
                    price: "From ISK 35,480",
                    includes: [
                        "2 x Saman passes",
                        "Public changing facilities",
                        "Skjól ritual access",
                        "One drink per guest served exclusively with Sky Platter at Smakk Bar", // More explicit
                        "Sky Platter from Smakk Bar",
                        "Towels included"
                    ],
                    drink_note: "Package drinks are only available at Smakk Bar with your Sky Platter. Drinks at Gelmir Bar are available for additional purchase." // Add this new field
                },
            },
            important_notes: [
                "Complimentary drinks are served only at Smakk Bar with your Sky Platter",
                "Additional drinks can be purchased separately at Gelmir Bar",
                "Maximum three alcoholic drinks per adult during visit"
            ],
            "booking_info": {
                "how_to_book": "Book directly through our website or at reception",
                "availability": "Subject to capacity",
                "recommended": "Advance booking recommended",
                "last_booking": "18:00 (GMT)",
                "timing_note": "Last booking time ensures guests can fully enjoy all package inclusions including our Sky Platter and drinks service"
            }
        }
    },

    gift_tickets: {
        marketing: {
            tagline: "Share an oceanside escape with a Sky Lagoon gift ticket",
            description: "From birthdays and anniversaries to holidays and thank you presents, a trip to Sky Lagoon is the gift that rejuvenates both body and soul.",
            occasions: [
                "Birthdays",
                "Anniversaries",
                "Holidays",
                "Thank you presents",
                "Special celebrations"
            ]
        },
        legacy_names: {
            important_note: "Important: Our package names have been updated. Previous gift cards are still valid.",
            name_changes: {
                pure_pass: {
                    old_name: "Pure Pass (formerly Pure package)",
                    current_name: "Saman Pass",
                    booking_instructions: "Pure Pass gift cards can be used to book the Saman Pass online"
                },
                sky_pass: {
                    old_name: "Sky Pass (formerly Sky package)",
                    current_name: "Sér Pass",
                    booking_instructions: "Sky Pass gift cards can be used to book the Sér Pass online"
                },
                pure_lite: {
                    note: "The Pure Lite package (lagoon only, no ritual) has been discontinued. Only Saman and Sér passes are currently available, both including ritual access."
                }
            },
            booking_process: {
                steps: [
                    "Choose your preferred date on our website",
                    "Enter your gift card code in the booking process",
                    "You'll receive a booking confirmation via email"
                ],
                assistance: "For help with old gift cards or package names, please contact reservations@skylagoon.is"
            }
        },
        options: {
            ser_gift: {
                name: "Sér Gift Ticket",
                tagline: "Gift our premium package",
                description: "Gift our premium package, including lagoon access, the Skjól ritual and private changing facilities",
                price: "14,990 ISK",
                includes: [
                    "Lagoon access",
                    "One journey through the Skjól ritual",
                    "Private changing facilities with our signature Sky Body Lotion",
                    "Towel"
                ]
            },
            saman_gift: {
                name: "Saman Gift Ticket",
                tagline: "Gift our classic package",
                description: "Gift our classic and most popular package, including lagoon access and a journey through the traditional bathing culture with the Skjól ritual",
                price: "11,990 ISK",
                includes: [
                    "Lagoon access",
                    "One journey through the Skjól ritual",
                    "Public changing facilities",
                    "Towel"
                ]
            },
            for_two_gift: {
                name: "Sky Lagoon for Two Gift Ticket",
                tagline: "Give the gift of relaxation shared together",
                options: {
                    saman_for_two: {
                        name: "Saman for Two",
                        price: "35,480 ISK",
                        description: "Two Saman passes to share a rejuvenating journey together",
                        includes: [
                            "Two Saman Passes",
                            "One drink per guest served exclusively with Sky Platter at Smakk Bar", // More explicit
                            "Sky Platter from Smakk Bar"
                        ]
                    },
                    ser_for_two: {
                        name: "Sér for Two",
                        price: "41,480 ISK",
                        description: "Two Sér passes for the ultimate shared experience",
                        includes: [
                            "Two Sér Passes",
                            "One drink per guest served exclusively with Sky Platter at Smakk Bar", // More explicit
                            "Sky Platter from Smakk Bar"
                        ]
                    }
                },
                beverage_note: "The complimentary drinks included in the Sky Lagoon for Two packages are served only at Smakk Bar with your Sky Platter. Guests can purchase additional drinks at Gelmir Bar separately.", // Add this new field
                important_note: "The Sky Lagoon for Two gift ticket comes in two gift tickets that must be used together when booking the experience. The two tickets can not be used separately."
            },
            multi_pass_gift: {
                name: "Multi-Pass Gift Ticket",
                tagline: "Share the joys of regular wellness",
                description: "Share the gift of lasting bliss with our Multi-Pass gift cards which include six visits to Sky Lagoon for far less than regular price.",
                options: {
                    hefd: {
                        name: "Hefð Multi-Pass",
                        description: "Six premium Sér experiences",
                        price: "56,970 ISK",
                        features: "Premium experience with private facilities"
                    },
                    venja: {
                        name: "Venja Multi-Pass",
                        description: "Six classic Saman experiences",
                        price: "44,970 ISK",
                        features: "Classic experience with standard facilities"
                    }
                },
                note: "Valid for 4 years from purchase date"
            }
        },
        redemption: {
            tagline: "How to Redeem Your Gift Ticket",
            steps: [
                {
                    name: "Book Your Time in Advance",
                    description: "If you have a gift ticket, it's essential to schedule your visit beforehand"
                },
                {
                    name: "Enter Gift Ticket Code",
                    description: "To book your visit, check out through the booking portal and enter your gift ticket code in the 'Order Details' section"
                },
                {
                    name: "Receive New Ticket",
                    description: "After booking, you'll receive a new ticket via email that will grant you access on the date and time you've selected"
                }
            ],
            for_two_note: "For Sky Lagoon for Two gift cards, you will need to enter two codes - press Apply after each one",
            important_notes: [
                "Advance booking essential",
                "Must use gift ticket code during booking process",
                "Bring booking confirmation to Sky Lagoon",
                "For Two packages must be booked together"
            ]
        },
        availability: {
            booking_required: true,
            subject_to_capacity: true,
            advance_recommended: true,
            modifications: {
                allowed: true,
                notice_required: "24 hours",
                contact: "reservations@skylagoon.is"
            }
        },
        upgrade_info: {
            ser_from_saman: {
                possible: true,
                instructions: "Yes, you can use your Saman gift card towards a Sér Package. When making your booking, simply select the Sér Package, enter your Saman gift card code during checkout, and you'll be able to pay the difference with a credit card.",
                process: [
                    "Choose Sér Package when booking on our website",
                    "Enter your Saman gift card code during checkout",
                    "The system will automatically calculate the difference",
                    "Pay the remaining balance with a credit card to complete your booking"
                ],
                contact: "If you encounter any issues, please contact us at reservations@skylagoon.is or call +354 527 6800."
            }
        }
    },
    general_upgrades: {
        day_of_entry: {
            possible: true,
            instructions: "Yes, you can upgrade your package from Saman to Sér, but this cannot be done directly through our website after your initial booking has been completed.",
            process: [
                "Option 1: Email reservations@skylagoon.is with your booking reference number and upgrade request. We'll send you a secure payment link to pay the difference.",
                "Option 2: On arrival (subject to availability), speak to our reception team about upgrading your package and pay the difference there."
            ],
            considerations: [
                "Upgrades at reception are strictly subject to availability of Sér facilities on the day",
                "The price difference between packages will need to be paid",
                "During busy periods, on-site upgrades may not be possible"
            ],
            advance_booking: {
                available: true,
                instructions: "To guarantee your upgrade and avoid disappointment, we recommend securing it ahead of time. Simply email us at reservations@skylagoon.is with your booking reference number and desired upgrade. We'll send you a secure payment link to complete your upgrade in advance.",
                benefits: [
                    "Guaranteed availability of your preferred package",
                    "Skip the upgrade process at reception",
                    "Peace of mind knowing your experience is confirmed",
                    "Particularly recommended during peak times"
                ]
            },
            website_limitation: {
                explanation: "Please note that our online booking system does not currently support upgrading an existing booking through the website. Once you've completed a booking for the Saman package, you'll need to contact our team directly to arrange an upgrade.",
                alternatives: [
                    "Contact reservations@skylagoon.is to upgrade before your visit",
                    "Request an upgrade at reception upon arrival (subject to availability)"
                ]
            },
            contact: "If you have more questions about upgrading your visit, please contact us at reservations@skylagoon.is or call +354 527 6800."
        }
    },
    booking_modifications: {
        policy: {
            standard: {
                allowed: true,
                description: "Yes, you can change your booking with 24 hours notice for individual bookings (1-9 guests).",
                instructions: "To modify your booking, you can:",
                methods: {
                    phone: {
                        text: "Call us at +354 527 6800 (open 9 AM - 6 PM) (GMT)",
                        note: "Best option for same-day changes"
                    },
                    email: {
                        text: "Email us at reservations@skylagoon.is",
                        note: "For future date changes"
                    }
                },
                requirements: "When emailing, please include:",
                details: [
                    "Your booking reference number",
                    "Whether you want to change the date or request a refund"
                ]
            },
            late_arrival: {
                grace_period: "30 minutes",
                scenarios: {
                    within_grace: {
                        status: "Automatically accommodated",
                        action: "Proceed directly to reception"
                    },
                    beyond_grace: {
                        status: "Subject to availability",
                        primary_action: "Offer booking modification",
                        secondary_action: "May wait upon arrival if sold out"
                    },
                    sold_out_day: {
                        status: "Limited flexibility",
                        explanation: "Cannot modify same-day booking when sold out",
                        options: [
                            "Wait upon arrival (subject to reception discretion)",
                            "Change to future date"
                        ]
                    }
                }
            },
            sold_out_handling: {
                priority: "Encourage rebooking to different date/time",
                reasoning: "Helps manage capacity and maximize availability",
                exceptions: "Reception team member discretion for same-day adjustments"
            }
        }
    },
    weather_policy: {
        rebooking: "We understand Icelandic weather can be unpredictable, so guests are welcome to rebook up to 24 hours before their scheduled time by emailing reservations@skylagoon.is.",
        recommendations: {
            weather_gear: "If you'd like to experience the lagoon in true Icelandic weather, we recommend bringing a hat.",
            available_items: "We also sell hats at reception and at Gelmir Bar."
        }
    },

    ritual: {
        marketing: {
            tagline: "A healing journey rooted in heritage",
            description: "Our all-encompassing wellness journey guides you through Icelandic bathing culture, powered by the elements that make Iceland unique.",
            highlights: [
                "Connect with tradition through ancient bathing practices",
                "Experience the power of warm and cold therapy",
                "Journey through seven steps of rejuvenation",
                "Immerse yourself in Iceland's bathing heritage"
            ]
        },
        status: {
            included: true,
            mandatory: true,
            medical_exemption: {
                description: "While included in all packages, guests with health conditions may choose which ritual elements to participate in based on their comfort and medical advice",
                options: [
                    "Enjoy lagoon without ritual participation",
                    "Select specific ritual elements suitable for your condition",
                    "Take breaks as needed",
                    "Staff assistance available"
                ]
            },
            packages: [
                "Included in Saman Package",
                "Included in Sér Package"
            ],
            booking: "Cannot be booked separately or excluded from packages"
        },
        steps: {
            laug: {
                name: "Laug (Warm Lagoon)",
                description: "Begin your journey by feeling the embrace of our geothermal Laug. Settle into the natural warmth, lose yourself in the calming energy and soak in the stunning views.",
                temperature: "38-40°C — Warm and relaxing"
            },
            kuldi: {
                name: "Kuldi (Cold Plunge)",
                description: "Inspired by Iceland's ancient Snorralaug pool, the Kuldi plunge engages and awakens your every sense, connecting you to a practice passed down for countless generations.",
                temperature: "5°C — Cold but energising"
            },
            ylur: {
                name: "Ylur (Sauna)",
                description: "Discover absolute tranquility as steam and Ylur open your pores, remove toxins and cleanse your skin. Choose from our classic or phone-free sauna, both offering breathtaking seaside views.",
                temperature: "80-90°C — Warm and ethereal"
            },
            suld: {
                name: "Súld (Cold Mist)",
                description: "Feel the touch of Icelandic winds and the crisp, cool Súld — a revitalizing mist that whispers stories of resilience.",
                temperature: "~5°C — Cold but refreshing"
            },
            mykt: {
                name: "Mýkt (Sky Body Scrub)",
                description: "It's time for gentle invigoration. Exfoliate your skin and lose yourself in the Mýkt of our signature Sky Body Scrub. Slowly, you'll feel the enlivening effects.",
                features: "Exfoliating and rejuvenating",
                ingredients: [
                    "Almond oil",
                    "Sesame seed oil"
                ]
            },
            gufa: {
                name: "Gufa (Steam)",
                description: "Let the Gufa wrap around you, allowing your skin to absorb the key therapeutic elements of the Skjól ritual and maximize the hydrating benefits of the Sky Body Scrub.",
                temperature: "46°C — A healing heat"
            },
            saft: {
                name: "Saft (Refreshment)",
                description: "Taste the essence of krækiber — the crowberries that dot our lava fields. Drank by Icelanders for centuries, this wholesome Saft elixir stimulates the palate with a profile that embodies the spirit of our land."
            }
        },
        experience: {
            location: "Dedicated ritual areas within Sky Lagoon",
            duration: "Take your time to enjoy each step",
            guidance: "Self-guided with clear instructions at each station",
            benefits: {
                skin: {
                    title: "Enhanced Skin Health",
                    description: "Our geothermal waters contain minerals that can detoxify and help remedy skin ailments. Combined with our signature Sky Body Scrub during the Skjól ritual, your skin will feel fresh, clean, and be aglow.",
                },
                pain_relief: {
                    title: "Natural Pain Relief",
                    description: "The warmth of our geothermal water can help alleviate pain sensations. Scientific research shows that soaking in hot water blocks pain receptors in bones and muscles.",
                },
                relaxation: {
                    title: "Deep Relaxation",
                    description: "Soaking in our warm water can be deeply restorative. It can help reduce stress, bring a sense of peace and serenity. By combining a warm soak with our cooling experiences, you're enhancing your chances of a great night's sleep.",
                },
                breathing: {
                    title: "Enhanced Breathing",
                    description: "The heat of our water combined with minerals helps release nasal and lung congestion in powerful ways. You'll emerge breathing clearly and deeply.",
                },
                community: {
                    title: "Connection & Community",
                    description: "Iceland's hot pools have served as a form of community for hundreds of years. People gather in the warmth to visit, catch up, share and collaborate - an important aspect of wellbeing.",
                }
            },
            general_benefits: [
                "Deep relaxation and rejuvenation",
                "Traditional therapeutic elements",
                "Connection to Icelandic heritage",
                "Complete mind and body wellness"
            ]
        },
        duration: {
            answer: "Our ritual typically takes 45 minutes, while you're welcome to take more time if you wish to fully immerse yourself in each step. We recommend allowing at least this amount of time to experience our Skjól ritual in a relaxed manner. ✨",
            guidance: "Self-paced and flexible",
            recommended: 45,
            note: "Take your time to enjoy each step fully"
        },    
        important_notes: [
            "Essential part of Sky Lagoon experience",
            "Cannot be excluded from visit",
            "Included in all admission packages",
            "No separate booking option available",
            "One complete journey through all seven steps included per visit"
        ],
        cultural_significance: {
            meaning: {
                word: "Skjól",
                translations: ["shelter", "retreat", "protection"],
                description: "At Sky Lagoon, Skjól means so much more. Bathing culture has been our 'Skjól' in Iceland for generations. Faced with harsh winter storms, everchanging weather and never-ending summer days, our ancestors chose to embrace the elements rather than resent them."
            },
            historical_importance: {
                gathering_places: "Naturally occurring hot springs have been gathering places since settlement",
                community_aspects: [
                    "Sharing stories",
                    "Building communities",
                    "Connecting with each other and the land",
                    "Experiencing rejuvenation of body and spirit"
                ],
                connection: "Skjól at Sky Lagoon is our invitation to experience the treasured traditions of Icelandic bathing culture for yourself."
            },
            elements: {
                description: "Everything we do at Sky Lagoon is rooted in Icelandic tradition. From our lagoon's stunning oceanside location to the wellness rituals we share with guests, we are honoured to celebrate our home every day.",
                features: [
                    "Embracing natural elements",
                    "Connection to land and sea",
                    "Traditional bathing practices",
                    "Ancient wellness wisdom"
                ]
            }
        }
    },

    seasonal_information: {
        winter: {
            experience: {
                tagline: "Where the Sea Meets the Sky - A Winter Journey",
                description: "Enter a journey of the senses powered by the elements, as you experience our iconic destination in winter's embrace",
                highlights: [
                    "A chance to see the northern lights dancing above while relaxing in the lagoon (weather and conditions permitting)",
                    "Snow-covered surroundings creating a magical winter atmosphere",
                    "Experience the powerful contrast between warm geothermal waters and crisp winter air",
                    "Gaze at stunning winter sunsets from our infinity edge",
                    "Starry night sky views stretching endlessly over the ocean (weather permitting)",
                    "Connect with the dramatic winter elements in our warm embrace",
                    "Less crowded than summer months for a more serene experience"
                ],
                temperature: {
                    water: "38-40°C maintained year-round",
                    air: "Average -1°C to 4°C"
                },
                visitor_patterns: "Generally less crowded than summer",
                special_features: {
                    northern_lights: {
                        description: "Possibility to view the northern lights while soaking in our warm waters (weather dependent)",
                        best_viewing: "On clear, dark winter nights",
                        notes: "While sightings cannot be guaranteed as they depend on natural conditions, our infinity edge provides an unobstructed view of the dancing lights"
                    },
                    winter_sky: "Opportunity to connect with Iceland's starry winter skies from the warm embrace of our lagoon"
                }
            }
        },
        summer: {
            experience: {
                tagline: "Endless Summer Light Where Sky Meets Sea",
                description: "Experience the magic of Icelandic summer, where day seamlessly blends into night under the Midnight Sun",
                highlights: [
                    "Experience the legendary Midnight Sun (around June 21)",
                    "Extended daylight hours until closing at 23:00 (GMT)",
                    "Late evening sun views from infinity edge",
                    "Bask in the bright Nordic evening atmosphere",
                    "Experience warmer outdoor temperatures while maintaining our perfectly heated waters",
                    "Golden light illuminating the lagoon at midnight (June)",
                    "Perfect for evening relaxation under the eternal sun",
                    "Take in the panoramic ocean views from our infinity edge"
                ],
                temperature: {
                    water: "38-40°C maintained year-round",
                    air: "Average 10°C to 15°C"
                },
                visitor_patterns: "Peak season with more visitors",
                special_features: {
                    midnight_sun: {
                        description: "Experience nearly 24 hours of daylight during our magical summer months",
                        peak_period: "Mid-May to mid-August",
                        longest_day: "Around June 21",
                        evening_experience: {
                            hours: "9:00 (GMT) - 23:00 (GMT) daily",
                            highlights: [
                                "Late evening sun views from infinity edge",
                                "Extended twilight atmosphere",
                                "Optimal viewing times from 20:00-23:00",
                                "Perfect for evening relaxation under the midnight sun"
                            ]
                        }
                    },
                    recommended_activities: {
                        evening_soak: {
                            description: "A soothing soak in the geothermal-heated water is the perfect place to experience the Midnight Sun",
                            features: [
                                "Natural grottos and dark volcanic rock formations illuminated in golden light",
                                "Infinity edge views of the endless daylight",
                                "Cold drinks available from Gelmir Bar",
                                "Combine with Skjól ritual for complete rejuvenation"
                            ]
                        },
                        photo_opportunities: [
                            "Midnight sun illuminating the horizon",
                            "Golden evening light on the water",
                            "Panoramic views from infinity edge",
                            "Dramatic sky colors"
                        ]
                    }
                }
            }
        },
        general: {
            tagline: "Experience the Elements Year-Round",
            description: "Enter a journey where the power of nature meets modern comfort, powered by the elements that make Iceland unique",
            year_round_features: [
                "Consistent geothermal water temperature (38-40°C)",
                "Our signature Skjól ritual available all seasons",
                "Indoor facilities heated year-round",
                "Experience the healing powers of geothermal water",
                "Panoramic ocean views stretching to the horizon",
                "Connect with nature at our iconic infinity edge"
            ],
            weather_info: {
                description: "Icelandic weather can be unpredictable",
                recommendations: [
                    "Dress appropriately for the season",
                    "Consider bringing a head covering for additional comfort",
                    "Hats available for purchase at reception and Gelmir Bar",
                    "Weather changes do not affect water temperature"
                ]
            }
        }
    },

    sunset: {
        topic: "sunset",
        keywords: ["sunset", "sundown", "dusk", "twilight", "golden hour", "sky colors", "evening light", "sunset view", "sunset times", "when does the sun set", "sunset hour"],
        content: `
    Sky Lagoon offers a spectacular view of the sunset over the North Atlantic Ocean. The sunset experience varies throughout the year due to Iceland's northern latitude:
    
    - Winter (November-February): Early sunsets between 15:40-16:45
    - Spring (March-April): Evening sunsets between 18:00-20:30
    - Summer (May-August): Late sunsets between 20:30-22:15 with extended twilight
    - Fall (September-October): Evening sunsets between 17:00-19:45
    
    The summer solstice (around June 21) offers nearly 24 hours of daylight with the sun setting after 22:00 and rising again around 3:00 AM, creating a magical golden hour that can last for hours.
    
    December and January have very limited daylight with the sun setting before 16:00.
    
    For the most accurate sunset time on your planned visit date, please check our sunset time database or ask about a specific month.
    
    The lagoon's westward orientation makes it an ideal spot to watch the sunset while immersed in our geothermal waters. Many guests find the combination of the warm water, cool air, and spectacular sunset colors to be a highlight of their visit.
    
    For the best sunset experience, we recommend arriving 1-2 hours before sunset to enjoy the lagoon before the sky transforms with colors.`
    },    

    dining: {
        introduction: {
            main_tagline: "Indulge in Icelandic Cuisine - A Taste of our Island Nation",
            description: "After invigorating both body and mind, let your taste buds have their moment. At Sky Lagoon, we believe in honouring Icelandic culture, heritage and tradition through our carefully selected local vendors and authentic dining experiences."
        },
        venues: {
                smakk_bar: {
                    name: "Smakk Bar",
                    tagline: "Explore and Discover at Smakk Bar",
                    description: "Sample Iceland's culinary world at Smakk Bar. Team your lagoon experience with a unique tasting platter, offering a taste of the flavours that are characteristic of our island nation. It's an inspiring way to connect with Iceland in a whole new sense.",
                    concept: {
                        description: "We believe in honouring Icelandic culture, tradition and heritage in everything we do — big and small.",
                        local_focus: "Our partners are local family businesses and community members that have made a mark on the Icelandic food saga — from our island nation's first specialty coffee shop to one of the oldest bakeries in Iceland."
                    },
                location: "Post-lagoon dining area",
                opening_hours: {
                    summer: {
                        period: "June 1 - September 30",
                        hours: "12:00 (GMT) - 22:30 (GMT)"
                    },
                    autumn: {
                        period: "October 1 - October 31",
                        hours: "12:00 (GMT) - 22:30 (GMT)"
                    },
                    winter: {
                        period: "November 1 - May 31",
                        hours: "12:00 (GMT) - 21:30 (GMT)"
                    }
                },
                menu: {
                    small_platters: [
                        {
                            name: "Mind At Cheese",
                            description: "A creamy cheese named Auður, the fittingly named white mould cheese Ljótur (meaning 'ugly') and the flavourful Feykir paired with organic bilberry jam from Vallanes. Served with freshly baked bread.",
                            price: "2,490 ISK"
                        },
                        {
                            name: "The Generous Sea",
                            description: "Traditional pickled herring from the fishing village Djúpivogur, served on rye bread with Icelandic beetroots and Iceland's signature gravlax with a home-made mustard and dill sauce. Served with freshly baked bread.",
                            price: "2,590 ISK"
                        },
                        {
                            name: "Cheese & Chocolate",
                            description: "Delicious chocolate assortments from the oldest chocolate factory in Iceland, Nói Siríus, paired with our favourite cheese duo: the creamy Auður and the piquant Feykir from north of Iceland, served with organic bilberry jam.",
                            price: "2,190 ISK"
                        }
                    ],
                    large_platters: [
                        {
                            name: "The Sky Platter",
                            description: "The platter with everything. Auður cheese, Feykir and organic bilberry jam, reindeer, pork and goose wild game pâté with red onion jam, signature gravlax with home-made mustard and dill sauce, Hjónabandssæla rhubarb pie. Served with freshly baked bread.",
                            price: "7,190 ISK",
                            note: "Ideal for sharing"
                        },
                        {
                            name: "The Icelandic Feast",
                            description: "Iceland's signature gravlax with home-made mustard and dill sauce and cured sheep fillet with horseradish sauce, pickled herring from Djúpivogur on rye bread, Ljótur blue cheese, flavourful Feykir and organic blueberry jam. Served with freshly baked bread.",
                            price: "7,090 ISK"
                        },
                        {
                            name: "The Good-Natured Vegan Platter",
                            description: "Delicious 'feta cheese' with pickled Icelandic vegetables, date and beetroot purée served on freshly baked rye bread, fresh hummus, olives and gourmet sauerkraut along with a chocolate cake with peanuts. Served with freshly baked bread.",
                            price: "6,890 ISK"
                        }
                    ],
                    drinks: {
                        beer_on_tap: [
                            {
                                name: "Gull",
                                type: "Lager 4%",
                                price: "1,890 ISK"
                            },
                            {
                                name: "Somersby",
                                type: "Apple Cider 4.5%",
                                price: "1,990 ISK"
                            }
                        ],
                        wine: [
                            {
                                name: "House Wine",
                                type: "Red/White/Rosé",
                                price: "from 1,890 ISK"
                            },
                            {
                                name: "Moët & Chandon",
                                type: "Champagne",
                                price: "3,490 ISK"
                            }
                        ],
                        soft_drinks: [
                            {
                                name: "Various Soft Drinks",
                                price: "590 ISK"
                            },
                            {
                                name: "Premium Lemonade",
                                price: "1,490 ISK"
                            }
                        ]
                    }
                },
                features: [
                    "Vegan options available",
                    "Gluten-free options available",
                    "Local Icelandic ingredients",
                    "Fresh baked bread",
                    "Seasonal specialties"
                ]
            },
            keimur_cafe: {
                name: "Keimur Café",
                tagline: "Rustic. Simple. Keimur Café.",
                description: "Slow down, savour the here and now. Join us at Keimur Café for sandwiches, soups and baked goods delivered fresh every morning from one of Iceland's oldest bakeries, Sandholt.",
                opening_hours: {
                    summer: {
                        period: "June 1 - September 30",
                        hours: "09:00 (GMT) - 22:30 (GMT)"
                    },
                    autumn: {
                        period: "October 1 - October 31",
                        hours: "10:00 (GMT) - 22:30 (GMT)"
                    },
                    winter: {
                        period: "November 1 - May 31",
                        hours: "11:00 (GMT) - 21:30 (GMT)"
                    }
                },
                menu: {
                    hot_drinks: [
                        {
                            name: "Coffee",
                            price: "690 ISK"
                        },
                        {
                            name: "Americano",
                            price: "690 ISK"
                        },
                        {
                            name: "Latte",
                            price: "790 ISK"
                        },
                        {
                            name: "Cappuccino",
                            price: "780 ISK"
                        },
                        {
                            name: "Tea",
                            price: "650 ISK"
                        }
                    ],
                    food: [
                        {
                            name: "Soup of the day",
                            price: "2,490 ISK"
                        },
                        {
                            name: "Ham and Cheese Toastie",
                            price: "2,190 ISK"
                        },
                        {
                            name: "Veggie Toastie",
                            price: "1,990 ISK"
                        },
                        {
                            name: "Gravlax Bagel",
                            price: "2,390 ISK"
                        },
                        {
                            name: "Hummus Bagel",
                            price: "1,990 ISK"
                        },
                        {
                            name: "Grandma's Skyr",
                            price: "1,890 ISK"
                        }
                    ]
                }
            },
            gelmir_bar: {
                name: "Gelmir Bar",
                tagline: "Let your Mind Drift at Gelmir Bar",
                description: "Enjoy an Icelandic beer, mixed drink or glass of wine right where the sea meets the sky. Find your way to our cave-side bar beneath the canopy on the far edge of the lagoon to relax and linger with your drink of choice in hand.",
                location: "In-water bar within the lagoon",
                policies: {
                    payment: "Use wristband for all purchases",
                    drink_limit: "Maximum three alcoholic drinks per guest",
                    requirements: "Valid ID may be required"
                },
                menu: {
                    on_tap: [
                        {
                            name: "Gull",
                            type: "Lager 4%",
                            price: "1,890 ISK"
                        },
                        {
                            name: "Somersby",
                            type: "Apple Cider 4.5%",
                            price: "1,990 ISK"
                        }
                    ],
                    wine: [
                        {
                            name: "Sparkling Wine",
                            price: "2,290 ISK"
                        },
                        {
                            name: "Monalto Rosé",
                            price: "2,490 ISK"
                        }
                    ],
                    non_alcoholic: [
                        {
                            name: "Soft Drinks",
                            price: "590 ISK"
                        },
                        {
                            name: "Collab",
                            type: "Caffeine Drink",
                            price: "790 ISK"
                        },
                        {
                            name: "Fresh Juice",
                            price: "590 ISK"
                        }
                    ]
                },
                closing: "Closes one hour before facility closing time"
            }
        },
        philosophy: {
            locally_sourced: {
                description: "Ingredients arrive from throughout Iceland. Game is hunted by a father-son duo roaming the historic fields of Landeyjar, South Iceland. Pickled herring originates from the charming fishing village of Djúpivogur.",
                vision: "Every smakk (meaning taste) on our distinctly Icelandic platters blends in perfect harmony with one another, creating an authentic culinary journey."
            }
        },
        general_info: {
            payment: {
                method: "Cashless system using wristband",
                process: "Credit card linked at check-in for all purchases"
            },
            dietary_options: {
                available: [
                    "Vegan options",
                    "Gluten-free options",
                    "Vegetarian options"
                ]
            },
            local_focus: {
                description: "Featuring dishes and drinks from local vendors",
                highlights: [
                    "Local family businesses",
                    "Traditional Icelandic ingredients",
                    "Seasonal specialties",
                    "Fresh local produce"
                ]
            }
        }
    },

    payment_systems: {
        wristband: {
            functions: {
                primary: [
                    "Payment method for all in-facility purchases",
                    "Locker key",
                    "Access control"
                ],
                setup: {
                    process: "Credit card linked at check-in",
                    security: "Secure encryption for all transactions",
                    location: "Reception desk during check-in"
                }
            },
            usage: {
                accepted_locations: [
                    "In-water Gelmir Bar",
                    "Keimur Café",
                    "Smakk Bar",
                    "All facility outlets"
                ],
                limitations: {
                    alcohol: "Maximum three alcoholic drinks per guest",
                    currency: "No cash accepted in lagoon area"
                }
            },
            lost_wristband: {
                procedure: [
                    "Report immediately to our team members",
                    "Wristband will be deactivated",
                    "New wristband issued if needed"
                ],
                security: {
                    deactivation: "Immediate upon report",
                    protection: "No unauthorized charges possible after deactivation"
                }
            }
        },
        payment_methods: {
            accepted: {
                pre_booking: [
                    "Credit cards",
                    "Debit cards",
                    "Online payment systems"
                ],
                on_site: [
                    "Credit cards",
                    "Debit cards",
                    "Wristband (within facility)",
                    "Mobile payments"
                ],
                restrictions: "Cash not accepted in lagoon area"
            },
            booking_requirements: {
                online: "Full payment required at time of booking",
                groups: "Special payment arrangements available for large groups",
                modifications: "Changes subject to availability and terms"
            }
        },
        checkout: {
            process: [
                "Review charges on wristband",
                "Settle final balance",
                "Return wristband"
            ],
            location: "Reception desk",
            timing: "Complete before leaving facility"
        },
        special_arrangements: {
            groups: {
                available: true,
                contact: "groups@skylagoon.is",
                minimum_size: 10
            },
            corporate: {
                available: true,
                billing: "Invoice options available",
                contact: "reservations@skylagoon.is"
            }
        },
        // New section for error in payment
        checkout_assistance: {
            payment_issues: {
                description: "If you experience any difficulties during the checkout process on our website, we offer alternative payment options to secure your booking.",
                common_issues: [
                    "Credit card payment failure",
                    "Website checkout errors",
                    "International payment card rejections",
                    "Booking confirmation issues"
                ],
                alternative_payment: {
                    process: [
                        "Send an email to reservations@skylagoon.is with your booking details",
                        "Include your desired date and time, package selection, and number of guests",
                        "Our team will respond with a secure payment link",
                        "Complete your payment through the link to confirm your booking"
                    ],
                    response_time: "Within 24 hours (typically much sooner)",
                    benefits: [
                        "Secure alternative payment method",
                        "Personalized booking assistance",
                        "Opportunity to ask additional questions",
                        "Confirmation directly from our reservations team"
                    ]
                },
                important_note: "Please include all necessary booking information in your email to expedite the process. Our team is committed to ensuring a smooth booking experience for all our guests."
            },
            technical_support: {
                contact: "reservations@skylagoon.is",
                phone: "+354 527 6800",
                hours: "9 AM - 6 PM (GMT)",
                assistance_provided: [
                    "Website navigation help",
                    "Payment processing issues",
                    "Booking confirmation problems",
                    "General technical difficulties"
                ]
            }
        }        
    },

    policies: {
        age_restrictions: {
            minimum_age: 12,
            age_calculation: {
                rule: "IMPORTANT: Children who turn 12 within the current calendar year ARE ALLOWED to visit",
                explanation: "We calculate eligibility based on the birth year, not the exact birth date",
                examples: [
                    "An 11-year-old who will turn 12 later this year CAN visit now",
                    "If a child was born in 2013, they can visit in 2025 even if their birthday hasn't happened yet"
                ]
            },
            supervision: "Ages 12-14 must be accompanied by a guardian (18 years or older)",
            verification: {
                requirement: "Valid ID may be requested to confirm child's date of birth",
                right_of_refusal: "Sky Lagoon team members reserve the right to refuse access if ID cannot be provided"
            },
            rationale: {
                reasons: [
                    "Experience designed for adult relaxation",
                    "Alcohol service in the lagoon area",
                    "12-year age limit is a policy to ensure quality of experience for all guests"
                ],
                additional_info: "The experience is focused on adult individuals to provide relaxation and rejuvenation"
            },
            recommendations: {
                supervision: "Guardian must be 18 years or older",
                group_size: "One guardian can supervise multiple children aged 12-14"
            }
        },
        cancellation: {
            individual: {
                notice: "24 hours",
                group_size: "1-9 guests",
                refund: "Full refund available with proper notice",
                contact: "reservations@skylagoon.is",
                requirements: "Cancellations must be presented in writing through email"
            },
            groups: {
                small: {
                    notice: "72 hours",
                    size: "11-25 guests",
                    refund: "Full refund with proper notice"
                },
                medium: {
                    notice: "96 hours",
                    size: "26-50 guests",
                    refund: "Full refund with proper notice"
                },
                large: {
                    notice: "2 weeks",
                    size: "51-100 guests",
                    refund: "Full refund with proper notice"
                },
                extra_large: {
                    notice: "12 weeks",
                    size: "101+ guests",
                    refund: "Full refund with proper notice"
                }
            },
            how_to_cancel: {
                method: "Email only",
                email: "reservations@skylagoon.is",
                required_info: [
                    "Booking reference number",
                    "Preferred action (refund/date change)",
                    "Original booking details"
                ],
                processing: "All refunds processed to original payment method"
            }
        },
        etiquette: {
            general_rules: {
                shoe_removal: {
                    rule: "Remove outdoor shoes before entering changing facilities",
                    description: "Icelanders enjoy thermal spas barefoot. Proper spa etiquette begins with removing outdoor shoes before entering the changing facilities to prevent bacteria and debris from dirtying the floors."
                },
                shower_rules: {
                    rule: "Shower thoroughly with soap before entering lagoon",
                    description: "Icelandic spas require all spa-goers to cleanse thoroughly with soap and warm water to help keep the pools clean",
                    requirements: [
                        "Remove all clothing before showering",
                        "Use provided soap and warm water",
                        "Complete thorough cleaning before putting on swimsuit",
                        "Required for all guests without exception"
                    ]
                },
                swimwear: {
                    rule: "Wearing a swimsuit is obligatory for all spa goers",
                    process: "After your shower, put on your bathing suit before leaving the changing room",
                    rental: "If you didn't pack one, bathing suits are available for rent or purchase at reception",
                    allowed_types: {
                        description: "At Sky Lagoon, we welcome various types of appropriate swimwear for your comfort",
                        types: [
                            "Bikinis and two-piece swimwear",
                            "One-piece swimsuits",
                            "Swim trunks and shorts",
                            "Rashguards and swim shirts for additional coverage",
                            "Water shoes (optional footwear designed for wet environments)"
                        ]
                    }
                },
                personal_items: {
                    wristband: {
                        functions: [
                            "Locker key",
                            "Payment method for food and refreshments",
                            "Linked to credit card at check-in"
                        ],
                        usage: "Store all personal items including wallet, mobile phone and clothing in your locker"
                    },
                    jewelry_watches: {
                        guidance: "While watches and jewelry are permitted in our geothermal waters, we recommend storing valuable items securely in your locker",
                        considerations: [
                            "The natural minerals in our geothermal water may affect certain metals and materials",
                            "Water-resistant watches are generally suitable for the lagoon",
                            "For comfort and safety, we suggest removing dangling jewelry"
                        ]
                    },
                    electronics: {
                        guidance: "You're welcome to bring electronic devices such as smartphones into the lagoon area",
                        protection: "Waterproof phone cases are available for purchase (2,500 ISK)",
                        responsibility: "Sky Lagoon cannot take responsibility for water damage to electronic items"
                    }
                }
            },
            behavior_guidelines: {
                voice_level: {
                    guideline: "Speak in your spa voice",
                    description: "While in-person conversation is welcome, spa etiquette encourages keeping your voice as low as possible",
                    reason: "Guests visit Sky Lagoon to experience Iceland's traditional bathing culture focused on healing, relaxation and rejuvenation in a tranquil environment"
                },
                hydration: {
                    importance: "Stay well hydrated while bathing in Sky Lagoon's warm geothermal waters",
                    locations: [
                        "Water fountains in changing rooms",
                        "Water fountains at the lagoon",
                        "Drinks available at Gelmir Bar"
                    ],
                    alcohol_limit: "Alcoholic beverages limited to three per adult"
                }
            },
            post_bathing: {
                drying_off: {
                    rule: "Always take time to towel dry your hair and body before re-entering changing rooms",
                    reason: "To prevent excess water on floors and seating areas",
                    disposal: "Look for linen baskets to dispose of your wet towel once finished"
                },
                dining_traditions: {
                    description: "Icelanders typically enjoy a post-spa meal",
                    recommendations: [
                        "Visit Keimur Cafe for a hearty post-spa meal",
                        "Try warm soup and fresh baked goods",
                        "Enjoy a local beer and light bites at Smakk Bar"
                    ]
                }
            },
            social_customs: {
                interaction: {
                    description: "Icelanders will readily engage in conversation about current events while soaking in the Lagoon",
                    guidelines: [
                        "Listening or participating is a great way to experience local culture",
                        "To avoid conversation, close your eyes and lay head back",
                        "This signals you're in relaxation mode"
                    ]
                },
                respect: {
                    guidelines: [
                        "Respect other guests' privacy and space",
                        "Maintain peaceful atmosphere",
                        "Follow staff instructions",
                        "Honor facility rules"
                    ]
                }
            }
        },
        health_safety: {
            medical_conditions: {
                consultation: "Physician consultation recommended for underlying conditions",
                high_risk_conditions: [
                    "Cardiovascular disease",
                    "High or low blood pressure",
                    "Recent surgery",
                    "Serious medical conditions",
                    "Epilepsy or seizure disorders"
                ],
                safety_measures: {
                    wristbands: {
                        available: "High-visibility wristbands for guests needing extra attention",
                        process: "Request at reception",
                        team_member_notification: "Safety personnel notified",
                        use_case: "For conditions requiring additional monitoring (e.g., epilepsy)"
                    },
                    monitoring: "Regular team member supervision",
                    assistance: "Trained team members available",
                    facilities: "Private changing spaces available"
                }
            },
            pregnancy: {
                allowed: true,
                temperature: "38°C (100.4°F)",
                guidelines: [
                    "Consult physician before visiting",
                    "Listen to your body",
                    "Stay hydrated",
                    "Exit if feeling uncomfortable",
                    "Avoid extreme temperature changes"
                ],
                recommendations: "Each person responsible for own health assessment",
                important_note: "Under normal circumstances, pregnant women can visit Sky Lagoon, but each individual must assess their own condition"
            },
            allergies: {
                ritual_products: {
                    sky_scrub_ingredients: [
                        "Maris Sal",
                        "Isopropyl Myristate",
                        "Prunus Amygdalus Dulcis (Sweet Almond) Oil",
                        "Sesamum Indicum (Sesame) Seed Oil",
                        "Parfum",
                        "Vitis Vinifera (Grape) Seed Oil",
                        "Argania Spinosa Kernel Oil",
                        "Rosa Canina Fruit Oil",
                        "Tocopheryl Acetate"
                    ],
                    alternatives: "Skip scrub step if allergic",
                    notification: "Inform team members of allergies"
                },
                food_allergies: {
                    protocol: "Alert our dining team members",
                    information: "Ingredient lists available",
                    alternatives: "Various options available including vegan and gluten-free"
                }
            },
            hydration_wellness: {
                water_stations: {
                    locations: [
                        "Changing rooms",
                        "Lagoon area",
                        "Near ritual areas"
                    ],
                    type: "Fresh drinking water",
                    availability: "Free access",
                    priority: "Primary hydration source"
                },
                recommendations: [
                    "Drink water regularly from our water stations",
                    "Take breaks when needed",
                    "Don't visit on empty stomach",
                    "Avoid excessive alcohol"
                ],
                dining_recommendations: {
                    pre_visit: "Eat something light and nutritious before your visit",
                    options: "Light snacks available at Keimur Café"
                },
                bar_options: {
                    location: "Gelmir lagoon bar in the lagoon",
                    options: [
                        "Various non-alcoholic beverages",
                        "Refreshing drinks",
                        "Alcoholic beverages (maximum three per guest)"
                    ],
                    payment: "Cashless wristband system",
                    restrictions: "Maximum three alcoholic drinks per adult during visit"
                }
            }
        },
        booking_capacity: {
            availability: {
                system: "Real-time capacity management system",
                capacity_display: {
                    single_spot: "When system shows '1 available', this means space for only one person",
                    multiple_spots: "Number shown indicates exact capacity available per time slot",
                    sold_out: "When website shows no availability, we cannot accommodate any additional guests"
                },
                real_time: "Availability updates automatically with bookings and cancellations",
                walk_in_policy: {
                    rules: "Walk-ins only possible if website shows availability",
                    restrictions: "Cannot accommodate guests beyond shown availability, even for walk-ins",
                    reason: "Strict capacity limits for guest comfort and safety"
                },
                cancellations: "Website automatically updates if spots become available due to cancellations",
                advance_booking: {
                    recommended: true,
                    reason: "To secure preferred time slot",
                    walk_in: "Subject to availability upon arrival"
                },
                // New waiting list section
                waiting_list: {
                    available: false,
                    explanation: "Sky Lagoon does not maintain a waiting list for sold-out time slots",
                    alternatives: [
                        "Our booking system updates in real-time when slots become available due to cancellations",
                        "We recommend checking our website periodically for new openings",
                        "Booking availability is most accurate on our official website",
                        "Last-minute cancellations may create new openings, especially 24-48 hours before popular time slots"
                    ],
                    contact_info: "For urgent inquiries about specific dates, please contact reservations@skylagoon.is"
                }
            }
        },
        photography: {
            general_policy: "We allow our guests to bring small cameras or phones to capture a memory from their Sky Lagoon journey",
            recommendation: "To truly immerse in the authentic Icelandic bathing culture, we encourage you to unplug, connect with nature, and embrace the serenity of gathering in warm waters",
            rules: [
                "Small cameras or phones permitted for memories",
                "Be very mindful with photography",
                "Respect other guests' privacy",
                "Strictly prohibited in changing rooms and shower area",
                "Only permitted in lagoon area",
                "No professional photography without permission"
            ],
            device_protection: {
                available: true,
                type: "Waterproof phone cases",
                price: "2,500 ISK",
                locations: [
                    "Reception",
                    "In-water Gelmir Bar"
                ]
            }
        },
        payment_systems: {
            wristband: {
                functions: {
                    primary: [
                        "Payment method for all in-facility purchases",
                        "Locker key",
                        "Access control"
                    ],
                    setup: {
                        process: "Credit card linked at check-in",
                        security: "Secure encryption for all transactions",
                        location: "Reception desk during check-in"
                    }
                },
                usage: {
                    accepted_locations: [
                        "In-water Gelmir Bar",
                        "Keimur Café",
                        "Smakk Bar",
                        "All facility outlets"
                    ],
                    limitations: {
                        alcohol: "Maximum three alcoholic drinks per guest",
                        currency: "No cash accepted in lagoon area"
                    }
                }
            },
            payment_methods: {
                accepted: {
                    pre_booking: [
                        "Credit cards",
                        "Debit cards",
                        "Online payment systems"
                    ],
                    on_site: [
                        "Credit cards",
                        "Debit cards",
                        "Cash (ISK only)",
                        "Wristband (within facility)"
                    ]
                },
                booking_requirements: {
                    online: "Full payment required at time of booking",
                    groups: "Special payment arrangements available for large groups",
                    modifications: "Changes subject to availability and terms"
                }
            },
            checkout_assistance: {
                payment_issues: {
                    description: "If you experience any difficulties during the checkout process on our website, we offer alternative payment options to secure your booking.",
                    common_issues: [
                        "Credit card payment failure",
                        "Website checkout errors",
                        "International payment card rejections",
                        "Booking confirmation issues"
                    ],
                    alternative_payment: {
                        process: [
                            "Send an email to reservations@skylagoon.is with your booking details",
                            "Include your desired date and time, package selection, and number of guests",
                            "Our team will respond with a secure payment link",
                            "Complete your payment through the link to confirm your booking"
                        ],
                        response_time: "Within 24 hours (typically much sooner)",
                        benefits: [
                            "Secure alternative payment method",
                            "Personalized booking assistance",
                            "Opportunity to ask additional questions",
                            "Confirmation directly from our reservations team"
                        ]
                    },
                    important_note: "Please include all necessary booking information in your email to expedite the process. Our team is committed to ensuring a smooth booking experience for all our guests."
                },
                technical_support: {
                    contact: "reservations@skylagoon.is",
                    phone: "+354 527 6800",
                    hours: "9 AM - 6 PM (GMT)",
                    assistance_provided: [
                        "Website navigation help",
                        "Payment processing issues",
                        "Booking confirmation problems",
                        "General technical difficulties"
                    ]
                }
            }
        }
    },

    facilities: {
        amenities: {
            tagline: "Experience the heart of Icelandic tradition at our oceanside geothermal lagoon",
            included: [
                "Complimentary towels provided in all changing rooms",
                "Direct access from changing rooms to lagoon - no outdoor walking",
                "Changing rooms designed for comfort and privacy",
                "Secure lockers with electronic wristband access",
                "Fresh drinking water stations",
                "In-water Gelmir Bar beneath the cave-wall canopy",
                "Keimur Café for light refreshments",
                "Smakk Bar for Icelandic culinary experiences"
            ],
            facility_design: {
                description: "Our changing rooms lead directly to the lagoon - no flip flops needed",
                features: [
                    "Walk straight from changing room to lagoon",
                    "No outdoor walking between changing and lagoon",
                    "Heated indoor floors throughout",
                    "Towels provided in all changing rooms",
                    "Comfortable, seamless transition to water"
                ],
                common_questions: [
                    "do I need flip flops",
                    "are towels provided",
                    "do I need to bring towels",
                    "where do I get towels",
                    "do you provide slippers"
                ]
            },
            guest_amenities: {
                towels: {
                    description: "Complimentary towels are provided in all changing rooms",
                    included: true
                },
                robes: {
                    description: "Since you walk directly from the changing rooms to the lagoon, robes are not provided. You're welcome to bring your own if you'd like.",
                    included: false,
                    bring_own: true
                },
                common_questions: [
                    "do you have robes",
                    "are robes provided",
                    "can I bring my own robe",
                    "do you rent robes"
                ]
            },
            changing_facilities: {
                public: {
                    name: "Saman facilities",
                    marketing_description: "Our classic and most popular option, offering a traditional Icelandic bathing experience",
                    features: [
                        "Traditional public changing facilities",
                        "Full shower amenities",
                        "Hair dryers for convenience",
                        "Essential Sky Lagoon amenities",
                        "Secure locker system",
                        "Gender-specific areas for comfort"
                    ]
                },
                private: {
                    name: "Sér facilities",
                    marketing_description: "Discover the ultimate Sky Lagoon experience with enhanced privacy and premium amenities",
                    features: [
                        "Well-appointed private changing rooms",
                        "Individual shower suites",
                        "Premium Sky Lagoon amenities",
                        "Signature Sky Body Lotion",
                        "Enhanced privacy and comfort",
                        "Gender-neutral private facilities"
                    ]
                }
            },
            rentals: {
                swimsuit: {
                    available: true,
                    price: "1,500 ISK",
                    description: "Clean and comfortable swimwear options available for rent",
                    options: [
                        "Various sizes of swimsuits and swim trunks",
                        "Freshly cleaned and sanitized",
                        "Available at reception",
                        "Optional if you prefer to bring your own"
                    ]
                },
                luggage_storage: {
                    available: true,
                    price: "990 ISK",
                    description: "Secure storage for any kind of baggage that does not fit into your locker",
                    location: "Conveniently located at reception"
                }
            }
        },
        accessibility: {
            tagline: "Sky Lagoon welcomes everyone to experience the healing powers of geothermal waters",
            description: "From the beginning, Sky Lagoon has prioritized accessibility, ensuring that our facilities welcome all guests with warmth and consideration",
            features: [
                "Full wheelchair accessibility throughout the facility",
                "Modern chairlift for safe lagoon entry and exit",
                "Accessible changing rooms with necessary support equipment",
                "Lifts available for all ritual areas including cold pool",
                "Trained team members ready to assist",
                "Individual changing spaces for enhanced privacy",
                "Gender-neutral facilities available"
            ],
            commitment: {
                pride_statement: "We are proud participants in Visit Iceland's Good Access Program",
                ongoing_commitment: "We strive to continuously improve our accessibility features",
                support: "Our team members are trained to provide warm and professional assistance"
            }
        },
        changing_rooms: {
            etiquette: {
                description: "From what to wear to hygiene practices, we take bathing culture seriously",
                rules: [
                    "Remove outdoor shoes before entering changing facilities",
                    "Shower thoroughly without swimsuit before entering the lagoon",
                    "Use designated storage for personal belongings",
                    "Maintain a peaceful atmosphere",
                    "Respect others' privacy and space"
                ]
            },
            saman_package: {
                type: "Public changing facilities",
                description: "Traditional Icelandic bathing facilities with complete amenities",
                features: [
                    "Separated facilities for comfort",
                    "Complete shower amenities",
                    "Secure locker system",
                    "Fresh towels provided",
                    "Hair dryers available"
                ]
            },
            ser_package: {
                type: "Premium private changing facilities",
                description: "Well-appointed private changing rooms for an elevated experience",
                features: [
                    "Individual changing suites",
                    "Private shower facilities",
                    "Premium Sky Lagoon amenities",
                    "Enhanced privacy and comfort",
                    "Gender-neutral facilities"
                ],
                gender_inclusive: {
                    description: "We want everyone to feel welcome at Sky Lagoon. No matter how you identify, you are more than welcome to use our private changing facilities.",
                    policy: "If you don't identify as male or female or aren't comfortable within the gendered changing rooms, just let our team know and we will upgrade you to a gender neutral changing room at no extra cost."
                }
            }
        },
        lagoon: {
            marketing_description: "Where the sea meets the sky - enter a journey of the senses, powered by the elements",
            specifications: {
                temperature: {
                    regular: "38-40°C (100-104°F)",
                    description: "Icelandic weather can often have a dramatic effect on the guest experience and the temperature can vary",
                    comfort: "Maintained at optimal therapeutic temperature year-round"
                },
                depth: {
                    maximum: "120 centimeters (47 inches)",
                    description: "At its deepest point, the lagoon is 120 cm (3'11\" ft) deep",
                    features: "Various depth zones for comfort and accessibility"
                },
                special_features: {
                    infinity_edge: {
                        description: "Experience our iconic 70-metre infinity edge, where sky and sea seamlessly meet",
                        views: [
                            "Panoramic ocean views",
                            "Stunning sunsets",
                            "Possible northern lights in winter",
                            "Midnight sun in summer"
                        ],
                        landmarks: {
                            keilir: {
                                name: "Keilir Mountain",
                                description: "A perfectly triangle-shaped mountain visible to the left, historically used by sailors for navigation",
                                location: "Furthest to the left in your view"
                            },
                            fagradalsfjall: {
                                name: "Fagradalsfjall Volcano",
                                description: "Active volcano visible from a safe distance, with recent eruptions since 2021",
                                location: "Visible in clear conditions"
                            },
                            bessastadir: {
                                name: "Bessastaðir",
                                description: "Historic property and official residence of the President of Iceland, featuring white buildings with red roofs",
                                features: [
                                    "Presidential Residence",
                                    "Historic church",
                                    "Reception buildings",
                                    "Historic manor farm dating back to Age of Settlement"
                                ]
                            },
                            snaefellsjokull: {
                                name: "Snæfellsjökull glacier",
                                description: "700,000-year-old stratovolcano with glacial ice cap, visible on clear days",
                                features: [
                                    "Made famous by Jules Verne's 'Journey to the Center of the Earth'",
                                    "Mesmerizing sunset views",
                                    "Visible from next peninsula"
                                ]
                            }
                        },
                        wildlife: {
                            birds: [
                                "Black and white Brant",
                                "Red-eyed oystercatcher",
                                "Tiny sandpiper",
                                "Arctic terns",
                                "Robust Cormorant"
                            ],
                            marine_life: {
                                seals: "Occasional seal sightings possible (Kópavogur means 'seal pup bay')"
                            }
                        },
                        seasonal_highlights: {
                            summer: "Midnight sun and extended twilight views",
                            winter: "Potential northern lights viewing and starry night skies",
                            sunset: "Stunning views especially behind Snæfellsjökull glacier"
                        }
                    },
                    cave_area: {
                        description: "Find your way to our cave-side bar beneath the canopy on the far edge of the lagoon"
                    }
                }
            },
            stay_duration: {
                info: "There is no time limit for your visit to Sky Lagoon. Once you enter, you can stay and enjoy our facilities until closing time on the day of your booking. Your reservation guarantees entry at your selected time slot, but you're welcome to relax and enjoy the experience at your own pace.",
                closing_reminder: "Please note that the lagoon area closes 30 minutes before our advertised closing time, and the Skjól Ritual and Gelmir Bar close one hour before facility closing.",
                recommendation: "We recommend allowing at least 2-3 hours for your visit to fully enjoy all our amenities including the lagoon, ritual, and dining options."
            },
            rules: {
                photography: {
                    policy: "To truly immerse in the authentic Icelandic bathing culture, we encourage you to unplug, connect with nature, and embrace the serenity of gathering in warm waters",
                    guidelines: [
                        "Small cameras or phones permitted for memories",
                        "Be mindful of other guests' privacy",
                        "No photography in changing rooms or shower areas",
                        "Professional photography requires permission"
                    ],
                    device_protection: {
                        available: true,
                        type: "Waterproof phone cases",
                        price: "2,500 ISK",
                        locations: ["Reception", "Gelmir Bar"]
                    }
                },
                swimming: {
                    ocean_access: {
                        allowed: false,
                        explanation: "Due to safety concerns, swimming in the sea around Sky Lagoon is prohibited",
                        alternative: "Instead, enjoy the beautiful ocean view from the lagoon, where himin and haf (sky and sea) blend together at the infinity edge"
                    }
                }
            },
            safety: {
                hydration: {
                    importance: "It's very important that you stay hydrated during your visit to Sky Lagoon",
                    stations: "Drinking water fountains in changing rooms and at the lagoon",
                    guidelines: "Regular hydration ensures you get the most out of your experience and stay healthy"
                },
                monitoring: {
                    staff: "Trained team members monitor guest safety",
                    medical: "First aid trained personnel available",
                    support: "Special assistance available when needed"
                }
            }
        }
    },

    transportation: {
        location: {
            address: "Vesturvör 44-48, 200 Kópavogur",
            description: "Sky Lagoon is conveniently located just minutes from central Reykjavík",
            coordinates: {
                lat: "64.111392",
                lng: "-21.911874"
            },
            maps_url: "https://www.google.com/maps?q=Sky+Lagoon+Iceland&ll=64.111392,-21.911874",
            distance: {
                from_city: "7 kilometers from central Reykjavík",
                drive_time: "13-15 minutes",
                from_landmarks: {
                    perlan: "9 minutes",
                    hallgrimskirkja: "12 minutes",
                    harpa: "14 minutes",
                    bsi: "9 minutes"
                }
            },
            positioning: {
                description: "Located on the Kársnes peninsula in Kópavogur",
                features: [
                    "Oceanside location",
                    "Stunning coastal views",
                    "Easy access from Reykjavík"
                ]
            }
        },
        shuttle_service: {
            provider: "Reykjavík Excursions",
            provider_info: {
                description: "The shuttle service to Sky Lagoon is operated by our partners at Reykjavík Excursions",
                contact: {
                    email: "info@icelandia.is",
                    phone: "+354 599 0000",
                    website: "www.re.is"
                },
                support_services: [
                    "Bus stop information",
                    "Schedule changes",
                    "Pickup assistance",
                    "Last-minute bookings",
                    "Transportation inquiries"
                ]
            },
            bsi_service: {
                departure_point: "BSÍ bus terminal",
                departure_times: ["13:00 (GMT)", "15:00 (GMT)", "17:00 (GMT)", "19:00 (GMT)"],
                timing: "Bus departs BSÍ on the hour of your booking",
                direction: "Direct service to Sky Lagoon",
                pickup_service: {
                    available: true,
                    timing: "Starts 30 minutes before your selected time",
                    finding_bus_stop: {
                        methods: [
                            "Check re.is website for official bus stop list",
                            "Contact Reykjavík Excursions at +354 599 0000 for guidance",
                            "Select the designated bus stop nearest to your accommodation"
                        ],
                        main_bus_stops: [
                            "Bus stop 1. Ráðhúsið - City Hall",
                            "Bus stop 2. Tjörnin - The Pond",
                            "Bus stop 3. Lækjargata",
                            "Bus Stop 4. Miðbakki Harbour",
                            "Bus stop 5. Harpa",
                            "Bus stop 6. The Culture House / Safnahusid",
                            "Bus stop 8. Hallgrímskirkja",
                            "Bus stop 9. Snorrabraut",
                            "Bus stop 11. Austurbær",
                            "Bus stop 12. Höfðatorg",
                            "Bus stop 13. Rauðarárstígur",
                            "Bus stop 14. Skúlagata",
                            "Bus stop 15. Vesturbugt",
                            "BSÍ Bus Terminal - City center"
                        ]
                    },
                    important_notes: [
                        "Be ready and visible at designated bus stop or outside hotel",
                        "Call +354 580 5400 if pickup hasn't arrived 20 minutes after start time",
                        "If pickup is missed, must reach BSÍ at own cost before departure time"
                    ],
                    restrictions: "Some hotels require going to nearby bus stops due to street access restrictions"
                }
            },
            return_service: {
                departure_point: "Sky Lagoon",
                destination: "Same bus stop as pickup location",
                departure_times: [
                    "14:30 (GMT)", "15:30 (GMT)", "16:30 (GMT)", "17:30 (GMT)", 
                    "18:30 (GMT)", "19:30 (GMT)", "20:30 (GMT)", "21:30 (GMT)"    
                ],
                notes: "Return service will drop you off at your original pickup location"
            },
            booking: {
                methods: [
                    "Book with Sky Lagoon ticket purchase",
                    "Book separately through www.re.is"
                ],
                modifications: "Contact Reykjavík Excursions directly at info@icelandia.is for changes",
                support: {
                    phone: "+354 599 0000",
                    email: "info@icelandia.is",
                    website: "www.re.is",
                    help: "Contact Reykjavík Excursions for assistance finding nearest bus stop to your accommodation"
                }
            }
        },
        hotel_bus_stops: {
            description: "Hotel to bus stop mapping for Reykjavík Excursions pickup service",
            note: "Pick-up starts 30 minutes before departure",
            timing: "Be ready and visible at designated bus stop at least 30 minutes before your booked departure time",
            bus_stop_locations: {
                "Bus stop 1. Ráðhúsið - City Hall": {
                    location: "Located at Reykjavík City Hall (Ráðhúsið)",
                    area: "City Center",
                    landmarks: ["Next to City Hall", "By the city pond"],
                    address: "Tjarnargata 11"
                },
                "Bus stop 2. Tjörnin – The Pond": {
                    location: "By the city pond (Tjörnin)",
                    area: "City Center",
                    landmarks: ["Near Fríkirkjan Church", "Along the pond's east side"],
                    address: "Vonarstræti"
                },
                "Bus stop 3. Lækjargata": {
                    location: "On Lækjargata street",
                    area: "Downtown",
                    landmarks: ["Near Lækjartorg square", "Close to Austurstræti"],
                    address: "Lækjargata"
                },
                "Bus Stop 4. Miðbakki Harbour": {
                    location: "At the old harbour area",
                    area: "Harbour",
                    landmarks: ["By the harbour", "Near Whale Watching tours"],
                    address: "Miðbakki"
                },
                "Bus stop 5. Harpa": {
                    location: "Outside Harpa Concert Hall",
                    area: "Harbour/Downtown",
                    landmarks: ["By Harpa Concert Hall", "Near the waterfront"],
                    address: "Austurbakki 2"
                },
                "Bus stop 6. The Culture House / Safnahusid": {
                    location: "By the Culture House (Safnahúsið)",
                    area: "Downtown",
                    landmarks: ["Next to The Culture House", "Near Hverfisgata"],
                    address: "Hverfisgata 15"
                },
                "Bus stop 8. Hallgrímskirkja": {
                    location: "Near Hallgrímskirkja church",
                    area: "City Center",
                    landmarks: ["By Hallgrímskirkja church", "Near Skólavörðustígur"],
                    address: "Skólavörðustígur"
                },
                "Bus Stop 9. Snorrabraut": {
                    location: "On Snorrabraut street",
                    area: "Hlemmur area",
                    landmarks: ["Near Hlemmur Square", "Close to Laugavegur"],
                    address: "Snorrabraut"
                },
                "Bus stop 11. Austurbær": {
                    location: "In the Austurbær district",
                    area: "East City Center",
                    landmarks: ["Near Austurbæjarskóli", "Close to Vitastígur"],
                    address: "Vitastígur"
                },
                "Bus stop 12. Höfðatorg": {
                    location: "At Höfðatorg area",
                    area: "Business District",
                    landmarks: ["Near Höfðatorg tower", "By Borgartún"],
                    address: "Höfðatorg"
                },
                "Bus stop 13. Rauðarárstígur": {
                    location: "On Rauðarárstígur street",
                    area: "Hlemmur area",
                    landmarks: ["Near Hlemmur Food Hall", "Close to Laugavegur"],
                    address: "Rauðarárstígur"
                },
                "Bus stop 14. Skúlagata": {
                    location: "On Skúlagata street",
                    area: "Downtown",
                    landmarks: ["Near the harbor area", "Close to Sæbraut"],
                    address: "Skúlagata"
                },
                "Bus stop 15. Vesturbugt": {
                    location: "In the Vesturbugt area",
                    area: "Harbor Area",
                    landmarks: ["Near the Maritime Museum", "By the old harbor"],
                    address: "Vesturbugt"
                }
            },
            transfer_details: {
                round_trip: {
                    included: true,
                    description: "All transfers include both pick-up and return service, operated by Reykjavík Excursions",
                    return_info: "Return drop-off will be at the same location as pick-up",
                    timing: {
                        pickup: "30 minutes before booked time",
                        return: "Regular return shuttles available throughout the day"
                    }
                },
                identification: {
                    bus_marking: "Reykjavík Excursions shuttle to Sky Lagoon",
                    bus_signs: ["Sky Lagoon", "Reykjavík Excursions"],
                    contact: "If unsure, contact Reykjavík Excursions at +354 599 0000 or info@icelandia.is",
                    what_to_look_for: [
                        "Look for Reykjavík Excursions branded bus",
                        "Bus will have Sky Lagoon signage",
                        "Driver will have passenger list"
                    ]
                },
                important_notes: [
                    "Be visible at your stop 30 minutes before departure",
                    "Have your booking confirmation ready",
                    "Contact Reykjavík Excursions at +354 599 0000 if pickup is more than 20 minutes late",
                    "For any transportation inquiries, contact info@icelandia.is",
                    "Return service drops off at original pickup location only"
                ]
            },
            customer_support: {
                phone: "+354 599 0000",
                website: "www.re.is",
                email: "info@icelandia.is",
                primary_contact: "For all transportation inquiries, please contact Reykjavík Excursions directly",
                assistance_available: [
                    "Finding nearest bus stop",
                    "Locating the bus",
                    "Schedule information",
                    "Last-minute changes",
                    "Delay notifications"
                ],
                when_to_contact: {
                    before_trip: [
                        "Help finding nearest stop",
                        "Schedule confirmation",
                        "Special requirements",
                        "Contact Reykjavík Excursions directly at info@icelandia.is"
                    ],
                    during_trip: [
                        "Bus not arrived within 20 minutes of pickup time",
                        "Cannot locate bus",
                        "Last-minute changes needed",
                        "Contact Reykjavík Excursions at +354 599 0000"
                    ]
                }
            },
            bus_stops: {
                "Bus stop 1. Ráðhúsið - City Hall": [
                    "3 Sisters Guesthouse",
                    "Centerhotel Plaza",
                    "Chez Monique",
                    "Embassy Luxury Apartments",
                    "Gallery Central Guesthouse",
                    "Guesthouse Álfhóll",
                    "Guesthouse Butterfly",
                    "Hótel Hilda",
                    "Hótel Metropolitan",
                    "Hótel Reykjavík Centrum",
                    "House of Spirits",
                    "Iceland Parliament Hotel",
                    "Kvosin Hotel",
                    "Lighthouse Apartments",
                    "Planet Apartments",
                    "Reykjavik Downtown Hostel",
                    "What´s On"
                ],
                "Bus stop 2. Tjörnin – The Pond": [
                    "Castle House Luxury Apartments",
                    "Central Guesthouse",
                    "Hotel Reykjavík Saga",
                    "Luna Hotel Apartments - Amtmannsstígur 5",
                    "Luna Hotel Apartments - Laufásvegur 17",
                    "Luna Hotel Apartments - Spítalastígur 1"
                ],
                "Bus stop 3. Lækjargata": [
                    "1912 Guesthouse",
                    "Apartment K - Bergstaðarstræti 12",
                    "Apartment K - Bergstaðarstræti 3",
                    "Apartment K - Skólastræti 1",
                    "Apartment K - Þingholtsstræti 2-4",
                    "Apotek Hotel",
                    "Black Pearl Hotel",
                    "Centerhotel Þingholt",
                    "Central Apartments",
                    "City Center Hotel",
                    "Downtown Guesthouse Reykjavik",
                    "Hótel Borg",
                    "Loft Hostel",
                    "Ocean Comfort Apartments",
                    "Radisson Blu Hótel 1919",
                    "Reykjavík Konsúlat Hótel"
                ],
                "Bus Stop 4. Miðbakki Harbour": [
                    "Elding Whale Watching",
                    "Local 101"
                ],
                "Bus stop 5. Harpa": [
                    "Centerhotel Arnarhvoll",
                    "The Reykjavik EDITION"
                ],
                "Bus stop 6. The Culture House / Safnahusid": [
                    "101 Hótel",
                    "Apartment K - Hverfisgata 14",
                    "Apartment K - Ingólfsstræti 1a",
                    "Canopy Reykjavík | City Centre",
                    "Hótel Frón"
                ],
                "Bus stop 8. Hallgrímskirkja": [
                    "Baron's Hostel",
                    "Eric The Red Guesthouse",
                    "Forsæla Apartmenthouse",
                    "Freyja Guesthouse",
                    "Gest Inn",
                    "Hostel B47",
                    "Hótel Leifur Eiríksson",
                    "Hótel Óðinsvé",
                    "Inga's New Guest Apartments",
                    "Loki 101 Guesthouse",
                    "Luna Hotel Apartments - Baldursgata 39",
                    "Luna Hotel Apartments - Bergþórugata 23",
                    "Mengi Apartments",
                    "Our House Guesthouse",
                    "Reykjavik Downtown Guesthouse - Egilsgata 1",
                    "SUNNA Guesthouse",
                    "Villa Guesthouse"
                ],
                "Bus Stop 9. Snorrabraut": [
                    "100 Iceland Hotel",
                    "101 Guesthouse",
                    "4th Floor Hotel",
                    "Alda Hotel Reykjavik",
                    "Alfred's Apartments",
                    "Apartment K – Laugavegur 74",
                    "Apartment K – Laugavegur 85-86",
                    "Centerhotel Laugavegur",
                    "City Comfort Apartments",
                    "Guesthouse Von",
                    "Heida's Home",
                    "Hlemmur Apartments",
                    "Luna Hotel Apartments - Laugavegur 86",
                    "OK Hotel",
                    "Reykjavik4you Apartments - Laugavegi 85",
                    "Skuggi Hótel",
                    "Stay Apartments Laugavegur",
                    "Von Guldsmeden Hotel"
                ],
                "Bus stop 11. Austurbær": [
                    "Grettisborg Apartments",
                    "Guesthouse Snorri",
                    "Luna Hotel Apartments - Grettisgata 53b",
                    "Reykjavik Hostel Village",
                    "Stay Apartments Grettisgata"
                ],
                "Bus stop 12. Höfðatorg": [
                    "Fosshótel Reykjavík",
                    "Tower Suites"
                ],
                "Bus stop 13. Rauðarárstígur": [
                    "Centerhotel Miðgarður",
                    "Downtown Reykjavik Apartments",
                    "Fosshótel Lind",
                    "Fosshótel Rauðará",
                    "Guesthouse Pávi",
                    "Stay Apartments Einholt"
                ],
                "Bus stop 14. Skúlagata": [
                    "101 Skuggi Guesthouse",
                    "41 – A Townhouse Hotel",
                    "Alfred's Studios",
                    "Apartment 37",
                    "Apartment K - Lindargata 60",
                    "Apartment K – Hverfisgata 37",
                    "Apartment K – Laugavegur 46",
                    "Apartments Aurora",
                    "Black Tower",
                    "Centerhotel Klöpp",
                    "Centerhotel Skjaldbreið",
                    "Domus Guesthouse",
                    "Gray Tower",
                    "Guesthouse Odinn",
                    "Guesthouse Turninn",
                    "ION City Hotel",
                    "Island Apartments",
                    "KEX Hostel",
                    "Luna Hotel Apartments - Laugavegur 37",
                    "Old Charm Reykjavik Apartments",
                    "Rey Apartments",
                    "Reykjavik Residence Hotel",
                    "Reykjavik Residence Suites",
                    "Reykjavik4you Apartments",
                    "Room With A View",
                    "Sand Hotel",
                    "The Swan House Reykjavík Apartments"
                ],
                "Bus stop 15. Vesturbugt": [
                    "Grandi by Centerhotels",
                    "Reykjavik Marina"
                ]
            },
            direct_pickup_locations: [
                "201 Hotel - Hlíðarsmári 5",
                "22 Hill Hotel - Brautarholt 22-24",
                "Arctic Comfort Hótel - Síðumúli 19",
                "BSÍ Bus Terminal - City center",
                "Cabin Hótel - Borgartún 32",
                "Dalur HI Hostel - Sundlaugavegur 34",
                "Eyja Guldsmeden Hotel - Brautarholt 10-14",
                "Farfuglaheimilið - Sundlaugavegur 34",
                "Fosshótel Barón - Barónstígur 2-4",
                "Grand Hótel Reykjavík - Sigtún 28",
                "Guesthouse Baldursbrá - Laufásvegi 41",
                "Guesthouse Baldursbrá - Tjarnargötu 46",
                "Hilton Reykjavík Nordica - Suðurlandsbraut 2",
                "Hótel Holt",
                "Hótel Ísland - Ármúli 9",
                "Hótel Ísland Comfort - Hlíðasmári 13 - Kópavogur",
                "Hotel Múli - Hallarmúli 1",
                "Hótel Örkin - Brautarholt 29",
                "Hotel Viking - Strandgötu 51",
                "Klettur Hótel - Mjölnisholt 12-14",
                "Lækur Hostel - Laugarnesvegur 74a",
                "Northern Comfort Apartments - Skipholti 15",
                "Oddsson Downtown Hotel - Háteigsvegur 1",
                "Oddsson Hotel - Grensásvegur 16a",
                "R13 - A Townhouse Hotel - Ármúli 13a",
                "Reykjavik Campsite - Sundlaugavegur 32",
                "Reykjavik Domestic Airport",
                "Reykjavik Lights Hotel - Suðurlandsbraut 12",
                "Reykjavik Natura - v/Hlíðarfót",
                "Skarfabakki Harbour - Terminal 312 pick-up point",
                "Stay Apartments Bolholt - Bolholt 6",
                "Storm Hotel"
            ],
            support_info: {
                contact: "+354 599 0000",
                email: "info@icelandia.is",
                website: "www.re.is",
                note: "Contact Reykjavík Excursions directly for assistance finding nearest bus stop to your accommodation"
            }
        },
        public_transport: {
            description: "Sky Lagoon is accessible via public bus service",
            bus_route: {
                first_leg: {
                    bus: "Take bus #4",
                    from: "Hlemmur square",
                    to: "Hamraborg",
                    duration: "15 minutes"
                },
                second_leg: {
                    bus: "Transfer to bus #35",
                    stop: "Exit at Hafnarbraut",
                    duration: "4 minutes"
                },
                final_leg: {
                    description: "Short walk along ocean to Sky Lagoon",
                    duration: "Approximately 10 minutes"
                },
                schedule: "Visit straeto.is for current timings"
            }
        },
        parking: {
            available: true,
            cost: "Free of charge",
            time_limit: "No time restrictions",
            features: [
                "Ample parking spaces",
                "Electric car charging stations",
                "Well-lit area",
                "Easy access to facility entrance"
            ],
            accessibility: {
                disabled_spaces: true,
                location: "Near main entrance",
                features: "Wide, accessible spaces"
            }
        },
        airport_transfer: {
            distance: "45 minutes from Keflavík International Airport",
            driving: {
                duration: "Approximately 40 minutes by taxi or rental car",
                route: "Direct route via main roads"
            },
            bus_option: {
                steps: [
                    "From Keflavík airport, take bus no. 55 and stop at Hlemmur (57 min)",
                    "From there, take bus no.1 to Hamraborg (21 min)",
                    "Then take bus no. 35 to Hafnarbraut (4 min)"
                ],
                note: "Currently, Flybus transfers do not travel directly to Sky Lagoon from the airport",
                alternatives: "Transfer to central Reykjavík first"
            },
            return_to_airport: {
                direct_service: {
                    available: false,
                    explanation: "Sky Lagoon doesn't offer direct shuttle service to Keflavík Airport"
                },
                recommended_route: {
                    steps: [
                        "Take our Reykjavík Excursions shuttle back to BSÍ Bus Terminal (our shuttle drops you at your original pickup location)",
                        "From BSÍ, catch Airport Express or Flybus services to Keflavík Airport (book separately)"
                    ],
                    shuttle_times: "Shuttles return from Sky Lagoon at: 14:30, 15:30, 16:30, 17:30, 18:30, 19:30, 20:30, and 21:30 (GMT)",
                    booking_info: "For airport transportation from BSÍ, check schedules at re.is or flybus.is"
                }
            },
            luggage: {
                storage: "Available for small fee (990 ISK)",
                location: "At reception"
            }
        },
        eco_friendly_options: {
            description: "We encourage environmentally friendly transport options",
            options: [
                "Walking paths along the ocean",
                "Cycling routes available",
                "Public transportation",
                "Electric car charging stations"
            ]
        }
    },

    group_bookings: {
        overview: {
            tagline: "Wellness, together - experience Sky Lagoon as a group",
            description: "Recharge, reconnect and be inspired where the sea meets the sky",
            minimum_size: 10,
            contact: {
                email: "reservations@skylagoon.is",
                response_time: "Within 24 hours",
                required_info: [
                    "Group size",
                    "Preferred date and time",
                    "Package preference (Saman/Sér)",
                    "Any special requirements"
                ]
            }
        },
        booking_process: {
            steps: [
                "Contact us via email with your group size and preferred date",
                "Receive your customized group package options",
                "Confirm your booking with full payment",
                "Receive confirmation and group visit details"
            ],
            requirements: {
                payment: "Full payment required to confirm group reservation",
                minimum_notice: {
                    size_11_25: "72 hours notice",
                    size_26_50: "96 hours notice",
                    size_51_100: "2 weeks notice",
                    size_101_plus: "12 weeks notice"
                }
            }
        },
        cancellation_policies: {
            size_11_25: {
                notice: "72 hours",
                refund: "Full refund available with proper notice"
            },
            size_26_50: {
                notice: "96 hours",
                refund: "Full refund available with proper notice"
            },
            size_51_100: {
                notice: "2 weeks",
                refund: "Full refund available with proper notice"
            },
            size_101_plus: {
                notice: "12 weeks",
                refund: "Full refund available with proper notice"
            }
        },
        amenities: {
            standard: [
                "Access to our geothermal lagoon",
                "One journey through our signature Skjól ritual",
                "Changing facilities (public or private based on package)",
                "Towels included",
                "Access to our in-water Gelmir Bar",
                "Use of electronic wristband payment system"
            ],
            optional_additions: [
                "Private changing areas (subject to availability)",
                "Food and beverage packages from Smakk Bar",
                "Transportation arrangements",
                "Extended visit duration",
                "Customized group experiences"
            ]
        },
        ideal_for: [
            "Corporate events",
            "Team building",
            "Special celebrations",
            "Tour groups",
            "Wellness retreats",
            "Incentive groups",
            "Conference add-ons"
        ],
        package_options: {
            saman: {
                name: "Group Saman Package",
                includes: [
                    "Access to Sky Lagoon",
                    "Skjól ritual experience",
                    "Public changing facilities",
                    "Towels included"
                ],
                note: "Our most popular option for groups"
            },
            ser: {
                name: "Group Sér Package",
                includes: [
                    "Access to Sky Lagoon",
                    "Skjól ritual experience",
                    "Private changing facilities",
                    "Premium Sky Lagoon amenities",
                    "Towels included"
                ],
                note: "Recommended for VIP groups or when enhanced privacy is desired"
            }
        },
        dining_options: {
            smakk_bar: {
                description: "Experience Icelandic culinary traditions with our group platters",
                options: [
                    "Traditional Icelandic tasting platters",
                    "Vegan and gluten-free options available",
                    "Customized group menus",
                    "Drink packages available"
                ],
                note: "Advance booking required for group dining"
            }
        },
        important_notes: [
            "Advance booking required for all groups",
            "Group rates available for 10+ guests",
            "All members of the group must be 12 years or older",
            "One complimentary group leader ticket for large groups",
            "Special arrangements possible for accessibility needs"
        ]
    },

    multi_pass: {
        overview: {
            tagline: "Regular Wellness Routine",
            description: "Make wellness part of your regular routine with a Hefð or Venja Multi-Pass, each containing six visits to Sky Lagoon.",
            marketing_phrases: [
                "Set wellness and health as your priority with Multi-Pass",
                "Get six visits to Sky Lagoon for far less than regular price",
                "Share the gift of lasting bliss",
                "Make wellness a part of your regular routine"
            ],
            validity: "Valid for 4 years from purchase date",
            restrictions: [
                "Valid for one visitor only",
                "Cannot be used for groups",
                "Non-transferable between guests",
                "Same code used for all six visits"
            ],
            important_note: "Please note, each multi-pass is valid for one visitor only. It cannot be used for groups of guests."
        },
        types: {
            hefd: {
                name: "Hefð Multi-Pass",
                tagline: "The Skjól Ritual & Private Change Room",
                description: "Join us for six premium Sér visits, including lagoon access, the Skjól ritual and well-appointed private changing facilities.",
                price: "56,970 ISK",
                marketing: "Choose a Hefð Multi-Pass for six premium Sér experiences. Our signature Sky Lagoon package includes the Skjól ritual and private changing rooms.",
                visits: 6,
                includes: [
                    "Six Sér package visits",
                    "Lagoon access for each visit",
                    "One journey through the Skjól ritual each visit", 
                    "Private changing facilities with our signature Sky Body Lotion",
                    "Towel included each visit"
                ],
                features: "Well-appointed private changing rooms with enhanced comfort and premium amenities"
            },
            venja: {
                name: "Venja Multi-Pass",
                tagline: "The Skjól Ritual",
                description: "Join us for six classic Saman Sky Lagoon experiences, including lagoon access and a journey though the Skjól ritual.",
                price: "44,970 ISK",
                marketing: "Join us for six classic Saman experiences with lagoon access and the Skjól ritual.",
                visits: 6,
                includes: [
                    "Six Saman package visits",
                    "Lagoon access for each visit",
                    "One journey through the Skjól ritual each visit",
                    "Public changing facilities",
                    "Towel included each visit"
                ],
                features: "Classic experience with standard facilities"
            }
        },
        redemption: {
            tagline: "How to Redeem Your Multi-Pass",
            process: [
                "Plan visit by choosing date and time",
                "Enter Multi-Pass code during booking - use the same code all six times",
                "Receive confirmation email with ticket",
                "Present ticket and photo ID at check-in"
            ],
            booking_steps: {
                step1: {
                    name: "Plan the Visit",
                    description: "Book your visit in advance by choosing a date and time."
                },
                step2: {
                    name: "Complete the Booking",
                    description: "Enter your Multi-Pass code while completing the booking. You use the same code for all six visits."
                },
                step3: {
                    name: "Let the Relaxation Begin",
                    description: "You will receive your Sky Lagoon ticket by email. Bring that ticket and photo ID with you when you check in at Sky Lagoon."
                }
            },
            important_notes: [
                "Advance booking recommended",
                "Must use gift ticket code during booking process",
                "Bring booking confirmation to Sky Lagoon",
                "Photo ID required at check-in",
                "Booking subject to availability"
            ]
        },
        usage_rules: {
            personal_use: {
                restriction: "Valid for one person only",
                sharing: "Cannot be shared or transferred",
                verification: "Photo ID required to verify identity"
            },
            validity: {
                duration: "4 years from purchase",
                visits: "Six total visits",
                booking: "Subject to availability"
            }
        }
    },

    products: {
        locations: {
            retail_area: "Available in our retail area right next to the check out",
            gelmir_bar: "Selected items available at Gelmir Bar",
            // Update this incorrect information
            online: "Not available for direct purchase through our website. International shipping available by email request to reservations@skylagoon.is"
        },
        items: {
            skin_care: {
                body_scrub: {
                    name: "Sky Body Scrub",
                    description: "Our signature scrub used in the Skjól ritual",
                    price: "6,990 ISK (200ml)",
                    ingredients: [
                        "Maris Sal",
                        "Isopropyl Myristate",
                        "Prunus Amygdalus Dulcis (Sweet Almond) Oil",
                        "Sesamum Indicum (Sesame) Seed Oil",
                        "Parfum",
                        "Vitis Vinifera (Grape) Seed Oil",
                        "Argania Spinosa Kernel Oil",
                        "Rosa Canina Fruit Oil",
                        "Tocopheryl Acetate"
                    ]
                },
                body_lotion: {
                    name: "Sky Body Lotion",
                    sizes: ["120ml", "30ml (travel size)"],
                    price: "2,490 ISK (30ml)",
                    features: [
                        "Free of parabens",
                        "Free of preservatives",
                        "Free of alcohol",
                        "Created with aloe vera for calming moisturizing"
                    ]
                },
                body_oil: {
                    name: "Sky Body Oil",
                    sizes: ["50ml", "30ml (travel size)"],
                    features: ["Made with vitamin E-rich sunflower oil", "Anti-inflammatory properties"]
                },
                // Add the new bath_essentials items from the price list
                shampoo: {
                    name: "Sky Shampoo",
                    sizes: ["500ml", "100ml (travel size)"],
                    price: {
                        large: "4,990 ISK (500ml)",
                        small: "1,790 ISK (100ml)"
                    }
                },
                conditioner: {
                    name: "Sky Conditioner",
                    sizes: ["500ml", "100ml (travel size)"],
                    price: {
                        large: "4,990 ISK (500ml)",
                        small: "1,790 ISK (100ml)"
                    }
                },
                shampoo_conditioner_combo: {
                    name: "Sky Shampoo & Conditioner Combo",
                    sizes: ["500ml", "100ml (travel size)"],
                    price: {
                        large: "8,600 ISK (500ml)",
                        small: "2,990 ISK (100ml)"
                    }
                }
            },
            home_fragrance: {
                pillow_mist: {
                    name: "Sky Pillow Mist",
                    size: "30ml",
                    description: "Create the perfect aroma for a restful evening"
                },
                candle: {
                    name: "Sky Ilmkerti",
                    description: "Sky Lagoon signature scented candle"
                },
                spray: {
                    name: "Sky Home Spray",
                    description: "Sky Lagoon signature home fragrance spray"
                },
                diffuser: {
                    name: "Sky Ilmgjafi",
                    description: "Sky Lagoon signature home diffuser"
                }
            },
            bath_essentials: {
                soap: {
                    name: "Sky Hand Soap",
                    description: "Sky Lagoon signature hand soap",
                    price: "1,790 ISK (100g)",
                    features: ["Vegan friendly"]
                }
            }
        },
        miniature_combo: {
            name: "Miniature Combo",
            description: "Make wellness a part of your daily routine with our miniature combos",
            includes: [
                "Pillow mist (30ml)",
                "Body oil (30ml)",
                "Body lotion (30ml)"
            ],
            features: "Perfect gift option or travel set"
        },
        purchasing_info: {
            location: "Available at our retail area near the exit",
            gift_packaging: "Available upon request"
        },
        // New detailed shipping section
        shipping: {
            availability: {
                international: true,
                online_store: false,
                how_to_order: "Email request to reservations@skylagoon.is"
            },
            requirements: {
                minimum_order: "25,000 ISK minimum order value for shipping",
                process: [
                    "Email reservations@skylagoon.is with your product selection",
                    "Include quantities and complete shipping address",
                    "You will receive a secure payment link for the total cost"
                ]
            },
            costs: {
                shipping_fee: "4,000 ISK flat rate shipping fee",
                payment: "Secure payment link will be provided for products and shipping"
            },
            policies: {
                carrier: "Shipping handled by Icelandic Post Office",
                liability: "Sky Lagoon is not responsible for any issues during shipping",
                damages: "Any shipping damages must be addressed with the carrier directly",
                customs: "Customer is responsible for any customs duties or extra fees imposed by destination country",
                restrictions: "Shipping availability may vary by country"
            },
            contact: {
                email: "reservations@skylagoon.is",
                information_needed: [
                    "Product items and quantities",
                    "Complete shipping address",
                    "Any special requests"
                ]
            }
        }
    },

    lost_found: {
        overview: {
            description: "If you lost something in Sky Lagoon, we will do our best to find your item and return it to you.",
            contact: {
                email: "lostandfound@skylagoon.is",
                required_info: [
                    "Your name",
                    "Description of the item",
                    "Where and when it was lost",
                    "Photo if possible"
                ]
            }
        },
        storage_policy: {
            valuables: {
                duration: "Three months",
                items: [
                    "Wallets",
                    "Bags",
                    "Jewelry",
                    "Phones",
                    "Cameras",
                    "Other valuable items"
                ]
            },
            clothing: {
                duration: "One week",
                items: [
                    "Bathing suits",
                    "Towels",
                    "Other clothing items"
                ]
            }
        },
        shipping: {
            fee: "4000 ISK",
            process: "Shipping fee applies for returning lost items"
        },
        recommendations: {
            prevention: [
                "Use provided lockers for all valuables",
                "Keep electronic wristband secure",
                "Check changing area thoroughly before leaving",
                "Report lost items as soon as possible"
            ]
        }
    },

    pride_accessibility: {
        pride: {
            tagline: "Celebrating Diversity at Sky Lagoon",
            pledge: "At Sky Lagoon, we are committed to fostering a diverse and inclusive culture where everyone can celebrate their authentic selves.",
            commitments: [
                {
                    name: "Safe and Welcoming Space",
                    description: "We strive to create a safe and welcoming environment for all our guests. Our Sky changing rooms are gender neutral and we have redone restroom signs to accommodate all."
                },
                {
                    name: "Educating and Informing",
                    description: "We are committed to educating ourselves about the challenges and issues faced by the LGBTQ+ community, with the aim of fostering empathy, understanding and support."
                },
                {
                    name: "Striving for Improvement",
                    description: "We welcome feedback from both our team and guests and strive to continuously improve inclusivity and accessibility at Sky Lagoon."
                }
            ],
            changing_room_policy: {
                description: "If guests who have purchased Saman tickets with access to public changing rooms don't identify as male or female or aren't comfortable within the gendered changing rooms, just let the team know and we will upgrade to a gender neutral changing room at no extra cost.",
                features: [
                    "Gender-neutral private facilities available",
                    "Free upgrade from Saman to private facilities when needed",
                    "Discrete and respectful process",
                    "No questions asked policy"
                ]
            }
        },
        accessibility: {
            tagline: "Sky Lagoon welcomes everyone to experience the healing powers of geothermal waters",
            description: "From the beginning, Sky Lagoon has prioritized accessibility, ensuring that our facilities welcome all guests with warmth and consideration",
            features: {
                mobility: [
                    "Full wheelchair accessibility throughout the facility",
                    "Modern chairlift for safe lagoon entry and exit",
                    "Accessible changing rooms with necessary support equipment",
                    "Lifts available for all ritual areas including cold pool",
                    "Wide, accessible spaces in all areas"
                ],
                facilities: [
                    "Individual changing spaces for enhanced privacy",
                    "Gender-neutral facilities available",
                    "Accessible shower facilities",
                    "Support equipment available",
                    "Trained staff ready to assist"
                ]
            },
            certifications: {
                program: "Visit Iceland's Good Access Program",
                commitment: "Sky Lagoon is a proud participant in the Good Access in Tourism project",
                promise: "Our commitment to providing excellent access for all guests"
            },
            support: {
                staff_training: "Our team members are trained to provide warm and professional assistance",
                special_needs: "Special arrangements available upon request",
                advance_notice: "Contact us before your visit for any specific requirements"
            },
            continuous_improvement: {
                statement: "We strive to continuously improve our accessibility features",
                feedback: "We welcome suggestions for improving our accessibility",
                goal: "Our aim is to be a leader in accessible tourism in Iceland"
            }
        }
    },
    age_policy: {
        general_rules: {
            minimum_age: 12,
            supervision: "Ages 12-14 must be accompanied by a guardian (18 years or older)",
            id_verification: {
                requirement: "Valid ID may be requested to confirm child's date of birth",
                right_of_refusal: "Sky Lagoon team members reserve the right to refuse access if ID cannot be provided"
            }
        },
        explanation: {
            reason: "12-year age limit is a policy that Sky Lagoon has implemented to ensure quality of experience for all guests. The experience is designed for adult individuals to provide relaxation and rejuvenation.",
            additional_factors: "Alcohol service in the lagoon area is also a factor in this decision.",
            birth_year: "Birth year counts for age limit - children turning 12 within the calendar year may visit Sky Lagoon"
        },
        recommendations: {
            supervision: "Guardian must be 18 years or older",
            group_size: "One guardian can supervise multiple children aged 12-14"
        }
    },
    careers: {
        questions: [
            "apply for a job",
            "job application",
            "employment opportunity",
            "job opening",
            "summer job",
            "job possibilities",
            "work for you",
            "employment at",
            "careers",
            "security guard",
            "lifeguard",
            "seasonal employment",
            "job opportunities"
        ],
        application_info: {
            instructions: "We encourage you to send your resume and cover letter to info@skylagoon.is.",
            additional_info: "Please let us know about your experience and why you would like to work with us."
        }
    },
};

// Replace or modify your existing getRelevantKnowledge function
export async function getRelevantKnowledge(query) {
  try {
    // Use vector search approach with lower threshold
    const results = await searchSimilarContent(query, 5, 0.5, 'en');
    
    if (!results || results.length === 0) {
      console.log('No vector search results found for query:', query);
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
    console.error('Error in vector search for getRelevantKnowledge:', error);
    // Return empty array in case of error
    return [];
  }
}