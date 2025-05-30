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
            smakk_bar: "https://www.skylagoon.com/food-drink/smakk-bar/",
            keimur_cafe: "https://www.skylagoon.com/food-drink/keimur-cafe/",
            gelmir_bar: "https://www.skylagoon.com/food-drink/gelmir-bar/"
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
    // STEP 1: First try vector search approach with lower threshold
    console.log('🔍 Vector search starting for English query with threshold: 0.5');
    const results = await searchSimilarContent(query, 5, 0.5, 'en');
    
    if (results && results.length > 0) {
      console.log('✅ Vector search returned results for query:', query);
      
      // Log details about vector search results
      console.log('📊 Vector search result details:');
      let totalSimilarity = 0;
      
      results.forEach((result, index) => {
        totalSimilarity += result.similarity;
        // Create a snippet of the content (first 50 characters)
        const contentSnippet = result.content ? 
          (result.content.substring(0, 50) + (result.content.length > 50 ? '...' : '')) : 
          'No content';
        
        console.log(`  Result ${index + 1}: Type=${result.metadata?.type || 'unknown'}, Similarity=${result.similarity.toFixed(3)}, Snippet="${contentSnippet}"`);
      });
      
      // Calculate and log average similarity
      const avgSimilarity = totalSimilarity / results.length;
      console.log(`📈 Average similarity score: ${avgSimilarity.toFixed(3)}`);
      
      // Check if confidence is too low and try keyword search anyway
      if (avgSimilarity < 0.61) {
        console.log('⚠️ Average similarity below threshold (< 0.61), checking keyword fallback...');
        const keywordResults = keywordSearch(query);
        
        if (keywordResults && keywordResults.length > 0) {
          console.log('🔑 Found keyword matches, using those instead of low-confidence vector results');
          return keywordResults;
        } else {
          console.log('🔍 No keyword matches found, using vector results despite low confidence');
        }
      }
      
      // Transform the results into the format expected by the rest of the code
      return results.map(result => ({
        type: result.metadata?.type || 'unknown',
        content: result.content,
        metadata: result.metadata || {},
        similarity: result.similarity
      }));
    }
    
    // STEP 2: If no vector results, fall back to keyword search
    console.log('No vector search results found for query:', query);
    console.log('🔍 Falling back to keyword-based search...');
    
    return keywordSearch(query);
    
  } catch (error) {
    console.error('Error in vector search for getRelevantKnowledge:', error);
    
    // Even if vector search fails, try keyword search as fallback
    console.log('⚠️ Falling back to keyword-based search due to error...');
    return keywordSearch(query);
  }
}

// Helper function containing the keyword search logic
function keywordSearch(userMessage) {
  const message = userMessage.toLowerCase();
  let relevantInfo = [];
  
// Opening hours and timing
    // Opening hours and timing
    if (message.includes('open') || 
        message.includes('hour') || 
        message.includes('time') ||
        message.includes('close') ||
        message.includes('slot') ||
        message.includes('when') ||
        message.includes('schedule') ||
        // Add these new patterns
        message.includes('last entry') ||
        message.includes('latest entry') ||
        message.includes('last time to enter') ||
        message.includes('latest time to enter') ||
        message.includes('too late') ||
        message.includes('latest booking') ||
        message.includes('last booking') ||
        message.includes('last time to arrive') ||
        message.includes('last admission') ||
        // Adding specific time-related queries
        message.includes('opening') ||
        message.includes('closing') ||
        message.includes('early') ||
        message.includes('late') ||
        message.includes('winter hours') ||
        message.includes('summer hours') ||
        message.includes('weekend') ||
        message.includes('weekday') ||
        message.includes('saturday') ||
        message.includes('sunday') ||
        message.includes('monday') ||
        message.includes('tuesday') ||
        message.includes('wednesday') ||
        message.includes('thursday') ||
        message.includes('friday') ||
        // Holiday specific
        message.includes('holiday') ||
        message.includes('christmas') ||
        message.includes('new year') ||
        message.includes('december 24') ||
        message.includes('december 25') ||
        message.includes('december 26') ||
        message.includes('december 31') ||
        message.includes('january 1') ||
        // Time of day
        message.includes('morning') ||
        message.includes('evening') ||
        message.includes('afternoon') ||
        message.includes('night') ||
        message.includes('tonight') ||
        message.includes('today') ||
        message.includes('tomorrow') ||
        // Venue-specific queries
        message.includes('ritual closing') ||
        message.includes('bar closing') ||
        message.includes('gelmir') ||
        message.includes('cafe hour') ||
        message.includes('café hour') ||
        message.includes('keimur') ||
        message.includes('smakk') ||
        // Seasonal and monthly queries
        (message.includes('season') && (
            message.includes('time') || 
            message.includes('hour') || 
            message.includes('open') || 
            message.includes('close')
        )) ||
        // Add our new seasonal patterns here
        (message.includes('like') && 
            (message.includes('during winter') || 
             message.includes('during summer') || 
             message.includes('in winter') || 
             message.includes('in summer'))) ||
        (message.includes('sky lagoon') && 
            message.includes('during')) ||
        message.includes('june') ||
        message.includes('july') ||
        message.includes('august') ||
        message.includes('september') ||
        message.includes('october') ||
        message.includes('november') ||
        message.includes('december') ||
        message.includes('january') ||
        message.includes('february') ||
        message.includes('march') ||
        message.includes('april') ||
        message.includes('may') ||
        // Common website phrases and questions
        message.includes('visit hour') ||
        message.includes('operating hour') ||
        message.includes('business hour') ||
        message.includes('what time do you') ||
        message.includes('how late') ||
        message.includes('how early') ||
        message.includes('until when') ||
        // Service timing questions
        message.includes('kitchen') ||
        message.includes('food service') ||
        message.includes('last order') ||
        message.includes('stop serving') ||
        message.includes('when can i order') ||
        // Check-in and arrival
        message.includes('arrive') ||
        message.includes('arrival') ||
        message.includes('check in') ||
        message.includes('check-in') ||
        message.includes('get there')) {

        // Add opening hours info
        relevantInfo.push({
            type: 'opening_hours',
            content: knowledgeBase.opening_hours
        });

        // If query is about dining venues, also include dining info
        if (message.includes('bar') || 
            message.includes('cafe') || 
            message.includes('café') || 
            message.includes('smakk') || 
            message.includes('keimur') ||
            message.includes('gelmir') ||
            message.includes('food') ||
            message.includes('drink') ||
            message.includes('dining') ||
            message.includes('kitchen') ||
            message.includes('last order') ||
            message.includes('restaurant')) {
            relevantInfo.push({
                type: 'dining',
                content: knowledgeBase.dining
            });
        }

        // If query is about ritual times, also include ritual info
        if (message.includes('ritual') || 
            message.includes('skjol') || 
            message.includes('skjól') ||
            message.includes('seven step') ||
            message.includes('7 step')) {
            relevantInfo.push({
                type: 'ritual',
                content: knowledgeBase.ritual
            });
        }

        // If query mentions check-in or arrival, also include booking info
        if (message.includes('arrive') ||
            message.includes('arrival') ||
            message.includes('check in') ||
            message.includes('check-in') ||
            message.includes('get there')) {
            relevantInfo.push({
                type: 'transportation',
                content: knowledgeBase.transportation
            });
        }
    }

    // Booking modifications, upgrades, and late arrivals
    if (message.includes('change') || 
        message.includes('modify') ||
        message.includes('reschedule') ||
        message.includes('late') ||
        message.includes('delayed') ||
        message.includes('miss') ||
        message.includes('missed') ||
        message.includes('different time') ||
        message.includes('different date') ||
        message.includes('cancel') ||
        message.includes('refund') ||
        message.includes('change booking') ||
        message.includes('modify booking') ||
        message.includes('change date') ||
        message.includes('money back') ||
        message.includes('cancellation') ||
        message.includes('rebook') ||
        message.includes('update booking') ||
        message.includes('move booking') ||
        message.includes('switch time') ||
        message.includes('switch date') ||
        (message.includes('book') && message.includes('another day'))) {
        
        console.log('\n🔄 Booking Modification Query Match Found');
        relevantInfo.push({
            type: 'booking_modifications',
            content: knowledgeBase.booking_modifications
        });
    }

    // General booking upgrade queries (must come BEFORE gift ticket section)
    if ((message.includes('upgrade') || 
         (message.includes('change') && message.includes('package')) ||
         (message.includes('switch') && message.includes('package')) ||
         (message.includes('change') && message.includes('saman') && message.includes('sér')) ||
         (message.includes('saman') && message.includes('to') && message.includes('sér')) ||
         (message.includes('improve') && message.includes('booking')) ||
         (message.includes('pay') && message.includes('difference'))) && 
        (!message.includes('gift') && 
         !message.includes('card') && 
         !message.includes('voucher') && 
         !message.includes('present'))) {
        
        console.log('\n📊 General Booking Upgrade Query Detected');
        relevantInfo.push({
            type: 'general_upgrades',
            content: knowledgeBase.general_upgrades.day_of_entry
        });
        
        // Return immediately to prevent gift card sections from processing this query
        return relevantInfo;
    } // End of Booking upgrade queries section

    // Package and pricing related
    if (message.includes('package') ||
        message.includes('price') ||
        message.includes('cost') ||
        message.includes('saman') ||
        message.includes('ser') ||
        message.includes('sér') ||
        message.includes('date night') ||
        message.includes('for two') ||
        message.includes('couple') ||
        message.includes('romantic') ||
        message.includes('together') ||  // Added from website language
        message.includes('share') ||     // Added from website language
        message.includes('partner') ||   // Added from website language
        message.includes('youth') ||
        message.includes('child') ||
        message.includes('children') ||
        message.includes('kid') ||
        message.includes('kids') ||
        (message.includes('12') && message.includes('year')) ||
        (message.includes('13') && message.includes('year')) ||
        (message.includes('14') && message.includes('year')) ||
        message.includes('teenage') ||
        message.includes('teen') ||
        message.includes('young') ||
        message.includes('booking') ||
        message.includes('book') ||
        message.includes('purchase') ||
        message.includes('buy') ||
        message.includes('before') ||
        message.includes('advance') ||
        message.includes('better to') ||
        message.includes('should i') ||
        message.includes('recommend') ||
        message.includes('ahead') ||
        message.includes('reservation') ||
        message.includes('modify') ||
        message.includes('change') ||
        message.includes('facilities') ||
        message.includes('amenities') ||
        message.includes('premium') ||
        message.includes('standard') ||
        message.includes('pay') ||
        message.includes('payment') ||
        message.includes('wristband') ||
        message.includes('wallet') ||
        message.includes('cash') ||
        message.includes('available') ||
        message.includes('availability') ||
        message.includes('space') ||
        message.includes('capacity') ||
        message.includes('spot') ||
        message.includes('full') ||
        message.includes('slot') ||
        message.includes('room') ||
        message.includes('spots left') ||
        message.includes('seats') ||
        message.includes('space left') ||
        message.includes('ultimate') ||
        message.includes('discover') ||
        message.includes('journey') ||
        message.includes('signature') ||
        message.includes('classic') ||
        message.includes('popular') ||
        message.includes('admission') ||
        message.includes('access') ||
        message.includes('included') ||
        message.includes('value')) {

        // Check for youth-specific queries first
        if (message.includes('youth') ||
            message.includes('child') ||
            message.includes('children') ||
            message.includes('kid') ||
            message.includes('kids') ||
            (message.includes('12') && message.includes('year')) ||
            (message.includes('13') && message.includes('year')) ||
            (message.includes('14') && message.includes('year')) ||
            message.includes('teenage') ||
            message.includes('teen') ||
            message.includes('young')) {
            
            // If asking specifically about Sér youth pricing
            if (message.includes('ser') || message.includes('sér') || 
                message.includes('premium') || message.includes('private')) {
                relevantInfo.push({
                    type: 'packages',
                    subtype: 'youth_ser',
                    content: {
                        youth_pricing: knowledgeBase.packages.ser.youth_pricing,
                        age_policy: knowledgeBase.policies.age_restrictions
                    }
                });
            }
            // If asking specifically about Saman youth pricing
            else if (message.includes('saman') || message.includes('standard') || 
                     message.includes('regular') || message.includes('basic')) {
                relevantInfo.push({
                    type: 'packages',
                    subtype: 'youth_saman',
                    content: {
                        youth_pricing: knowledgeBase.packages.saman.youth_pricing,
                        age_policy: knowledgeBase.policies.age_restrictions
                    }
                });
            }
            // For general youth pricing queries
            else {
                relevantInfo.push({
                    type: 'packages',
                    subtype: 'youth_all',
                    content: {
                        saman: knowledgeBase.packages.saman.youth_pricing,
                        ser: knowledgeBase.packages.ser.youth_pricing,
                        age_policy: knowledgeBase.policies.age_restrictions
                    }
                });
            }
        }
        // Original package logic for non-youth queries
        else {
            relevantInfo.push({
                type: 'policies',
                content: knowledgeBase.policies
            });
            relevantInfo.push({
                type: 'packages',
                content: {
                    ...knowledgeBase.packages,
                    description: `Discover our unique packages designed for your ultimate relaxation experience. [View Our Packages] (https://www.skylagoon.com/packages)`
                }
            });
        }

        // Add dining info if they ask about food-related aspects
        if (message.includes('platter') ||
            message.includes('food') ||
            message.includes('dinner') ||
            message.includes('smakk') ||
            message.includes('drinks included')) {
            relevantInfo.push({
                type: 'dining',
                content: knowledgeBase.dining
            });
        }

        // Add ritual info if they ask about ritual-related aspects
        if (message.includes('ritual') ||
            message.includes('skjol') ||
            message.includes('skjól') ||
            message.includes('journey')) {
            relevantInfo.push({
                type: 'ritual',
                content: knowledgeBase.ritual
            });
        }
    }

    // Gift ticket related queries
    if (message.includes('gift') || 
        message.includes('present') ||
        message.includes('gifting') ||
        message.includes('give as') ||
        message.includes('buy for') ||
        message.includes('redeem') ||
        message.includes('gift code') ||
        message.includes('gift ticket') ||
        message.includes('gift card') ||
        // Special occasions
        message.includes('birthday') ||
        message.includes('anniversary') ||
        message.includes('celebration') ||
        message.includes('thank you') ||
        message.includes('special occasion') ||
        // Redemption related
        message.includes('how to use') ||
        message.includes('redeem') ||
        message.includes('activate') ||
        message.includes('gift voucher') ||
        message.includes('voucher code') ||
        // Purchasing related
        message.includes('buy a gift') ||
        message.includes('purchase a gift') ||
        message.includes('get a gift') ||
        message.includes('giving') ||
        message.includes('gift options') ||
        // Multi-pass specific
        message.includes('multi-pass gift') ||
        message.includes('multi pass gift') ||
        message.includes('hefð gift') ||
        message.includes('hefd gift') ||
        message.includes('venja gift') ||
        // For Two packages
        (message.includes('for two') && 
            (message.includes('gift') || 
             message.includes('present') || 
             message.includes('buy') || 
             message.includes('purchase'))) ||
        message.includes('couple gift') ||
        message.includes('together gift') ||
        // Common questions
        message.includes('gift price') ||
        message.includes('gift cost') ||
        message.includes('gift ticket price') ||
        message.includes('gift validity') ||
        message.includes('gift expiry') ||
        message.includes('book with gift') ||
        message.includes('use my gift') ||
        // Legacy gift card detection
        message.toLowerCase().includes('pure') ||
        message.toLowerCase().includes('sky') ||
        // Gift card specific upgrade patterns
        (message.includes('upgrade') && (message.includes('gift') || message.includes('card') || message.includes('ticket') || message.includes('voucher'))) ||
        (message.includes('use') && message.includes('gift') && message.includes('different')) ||
        (message.includes('gift') && message.includes('saman') && message.includes('sér')) ||
        (message.includes('gift card') && message.includes('difference'))) {

        // First check for legacy gift card queries
        if (message.toLowerCase().includes('pure') || 
            message.toLowerCase().includes('sky') ||
            (message.toLowerCase().includes('old') && message.includes('gift')) ||
            (message.toLowerCase().includes('previous') && message.includes('gift'))) {
            
            console.log('\n🔄 Legacy Gift Card Query Found');
            
            let response = '';
            
            if (message.toLowerCase().includes('pure')) {
                response = "Your Pure Pass (or Pure Package) gift card can be used to book our Saman Package. Simply select 'Saman Pass' when booking online. Your gift card is still fully valid.\n\n";
            } else if (message.toLowerCase().includes('sky')) {
                response = "Your Sky Pass (or Sky Package) gift card can be used to book our Sér Package. Simply select 'Sér Pass' when booking online. Your gift card is still fully valid.\n\n";
            }

            response += "Here's how to book:\n";
            knowledgeBase.gift_tickets.redemption.steps.forEach((step, index) => {
                response += `${index + 1}. ${step.description}\n`;
            });
            response += "\nIf you need any assistance with legacy gift cards or booking, please don't hesitate to contact us at reservations@skylagoon.is or call us at 527 6800.";

            relevantInfo.push({
                type: 'gift_tickets',
                subtype: 'legacy',
                content: response
            });
        } 
        // Gift card specific upgrade detection
        else if ((message.includes('upgrade') && 
                 (message.includes('gift') || 
                  message.includes('card') || 
                  message.includes('ticket') || 
                  message.includes('voucher'))) || 
                 (message.includes('gift') && message.includes('saman') && message.includes('sér')) ||
                 (message.includes('gift') && message.includes('pay') && message.includes('difference')) ||
                 (message.includes('gift') && message.includes('change') && message.includes('package'))) {
            
            console.log('\n🔄 Gift Card Upgrade Query Found');
            relevantInfo.push({
                type: 'gift_tickets',
                subtype: 'upgrade',
                content: {
                    upgrade_info: knowledgeBase.gift_tickets.upgrade_info.ser_from_saman,
                    links: {
                        booking: `[Book your visit] (${knowledgeBase.website_links.booking})`,
                        gift_tickets: `[View Gift Tickets] (${knowledgeBase.website_links.gift_tickets})`
                    }
                }
            });
        } 
        // Original else clause for standard gift ticket queries
        else {
            relevantInfo.push({
                type: 'gift_tickets',
                content: {
                    ...knowledgeBase.gift_tickets,
                    description: `Give the gift of relaxation with our gift cards. [View Gift Ticket Options] (https://www.skylagoon.com/buy-gift-tickets)`
                }
            });

            // If asking about booking with gift tickets, also include opening hours
            if (message.includes('book') || 
                message.includes('redeem') || 
                message.includes('use') || 
                message.includes('when can i')) {
                relevantInfo.push({
                    type: 'opening_hours',
                    content: knowledgeBase.opening_hours
                });
            }

            // If asking about For Two packages, include dining info
            if (message.includes('for two') || 
                message.includes('couple') || 
                message.includes('together') ||
                message.includes('date night')) {
                relevantInfo.push({
                    type: 'dining',
                    content: knowledgeBase.dining
                });
            }

            // If asking about specific packages, include package info
            if (message.includes('ser ') || 
                message.includes('sér ') || 
                message.includes('saman') || 
                message.includes('premium') || 
                message.includes('standard') ||
                message.includes('classic')) {
                relevantInfo.push({
                    type: 'packages',
                    content: knowledgeBase.packages
                });
            }
        }
    } // End of Gift ticket related queries section

    // Ritual related queries
    if (message.includes('ritual') || 
        message.includes('skjol') ||
        message.includes('skjól') ||
        message.includes('without ritual') ||
        message.includes('skip ritual') ||
        message.includes('optional ritual') ||
        message.includes('ritual included') ||
        message.includes('ritual access') ||
        // Health and medical related ritual queries
        message.includes('cannot do ritual') ||
        message.includes('can\'t do ritual') ||
        message.includes('health') && (
            message.includes('ritual') ||
            message.includes('steps') ||
            message.includes('cold') ||
            message.includes('steam') ||
            message.includes('sauna')
        ) ||
        message.includes('medical') && (
            message.includes('ritual') ||
            message.includes('steps') ||
            message.includes('exempt')
        ) ||
        message.includes('condition') && (
            message.includes('ritual') ||
            message.includes('steps') ||
            message.includes('skip')
        ) ||
        // Adding step-specific terms from website
        message.includes('laug') ||
        message.includes('kuldi') ||
        message.includes('ylur') ||
        message.includes('súld') ||
        message.includes('suld') ||
        message.includes('mykt') ||
        message.includes('mýkt') ||
        message.includes('gufa') ||
        message.includes('saft') ||
        // Adding descriptive terms from website
        message.includes('seven step') ||
        message.includes('7 step') ||
        message.includes('steps') ||
        message.includes('healing journey') ||
        message.includes('wellness journey') ||
        message.includes('bathing culture') ||
        message.includes('cold plunge') ||
        message.includes('sauna') ||
        message.includes('steam') ||
        message.includes('mist') ||
        message.includes('body scrub') ||
        message.includes('crowberry') ||
        message.includes('krækiber') ||
        message.includes('kraekiber') ||
        // Adding wellness-focused terms
        message.includes('benefit') ||
        message.includes('wellness') ||
        message.includes('healing') ||
        message.includes('therapeutic') ||
        message.includes('therapy') ||
        message.includes('pain relief') ||
        message.includes('muscle') ||
        message.includes('stress') ||
        message.includes('relax') ||
        message.includes('relaxing') ||
        message.includes('relaxation') ||
        message.includes('detox') ||
        message.includes('detoxify') ||
        message.includes('mineral') ||
        message.includes('breathing') ||
        message.includes('congestion') ||
        message.includes('sleep') ||
        message.includes('community') ||
        message.includes('peaceful') ||
        message.includes('serenity') ||
        message.includes('restore') ||
        message.includes('restorative') ||
        message.includes('skin') ||
        message.includes('fresh') ||
        message.includes('clean') ||
        message.includes('glow') ||
        message.includes('pain') ||
        message.includes('ache') ||
        message.includes('sore') ||
        message.includes('peace') ||
        message.includes('quiet') ||
        message.includes('tranquil') ||
        message.includes('rejuvenate') ||
        message.includes('rejuvenation') ||
        // Add these terms to the ritual detection section
        message.includes('skjól meaning') ||
        message.includes('skjol meaning') ||
        message.includes('meaning of skjol') ||
        message.includes('meaning of skjól') ||
        message.includes('what does skjol mean') ||
        message.includes('what does skjól mean') ||
        message.includes('shelter') ||
        message.includes('retreat') ||
        message.includes('protection') ||
        message.includes('tradition') ||
        message.includes('traditional') ||
        message.includes('ancestor') ||
        message.includes('historic') ||
        message.includes('historical') ||
        message.includes('heritage') ||
        message.includes('cultural') ||
        message.includes('culture') ||
        message.includes('element') ||
        message.includes('root') ||
        message.includes('origin') ||
        message.includes('background') ||
        message.includes('story behind') ||
        message.includes('history') ||
        message.includes('meaning behind') ||
        message.includes('why is it called') ||
        message.includes('where does the name') ||
        message.includes('settlement') ||
        message.includes('gathering') ||
        message.includes('community') ||
        // Temperature-related queries
        message.includes('temperature') && (
            message.includes('sauna') ||
            message.includes('steam') ||
            message.includes('mist') ||
            message.includes('plunge')
        )) {

        // For health-related ritual queries, include both ritual and health safety info
        if (message.includes('health') || 
            message.includes('medical') || 
            message.includes('condition') ||
            message.includes('cannot do') ||
            message.includes('can\'t do')) {
            relevantInfo.push({
                type: 'ritual_health',
                content: {
                    ritual_status: knowledgeBase.ritual.status,
                    medical_exemption: knowledgeBase.ritual.status.medical_exemption,
                    health_safety: knowledgeBase.policies.health_safety
                }
            });
        }

        // Standard ritual info
        relevantInfo.push({
            type: 'ritual',
            content: {
                ...knowledgeBase.ritual,
                description: `Our Skjól ritual is a transformative seven-step journey deeply rooted in Icelandic bathing culture. [View Ritual Details] (https://www.skylagoon.com/experience/skjol-ritual)`
            }
        });

        // Also include packages info since ritual is part of packages
        relevantInfo.push({
            type: 'packages',
            content: knowledgeBase.packages
        });

        // Also include facilities info for specific wellness queries
        if (message.includes('relax') ||
            message.includes('peaceful') ||
            message.includes('quiet') ||
            message.includes('tranquil') ||
            message.includes('community') ||
            message.includes('healing')) {
            relevantInfo.push({
                type: 'facilities',
                content: knowledgeBase.facilities
            });
        }
    } // End of full Ritual section

    // Specific Payment system - checkout error detection
    if (message.includes('error') ||
        message.includes('issue') ||
        message.includes('problem') ||
        message.includes('trouble') ||
        message.includes('can\'t checkout') ||
        message.includes('cannot checkout') ||
        message.includes('payment failed') ||
        message.includes('payment error') ||
        message.includes('checkout error') ||
        message.includes('card declined') ||
        message.includes('won\'t process') ||
        message.includes('transaction') ||
        message.includes('website error') ||
        message.includes('payment not working') ||
        message.includes('alternative payment') ||
        message.includes('payment link')) {
        
        console.log('\n💰 Payment/Checkout Error Query Detected');
        relevantInfo.push({
            type: 'checkout_assistance',
            content: {
                checkout_assistance: knowledgeBase.payment_systems.checkout_assistance,
                contact: {
                    email: "reservations@skylagoon.is",
                    phone: "+354 527 6800"
                }
            }
        });
    } // End of full Specific Payment system - checkout error detection
    
    // Policy related queries (// including age terms since they may relate to other policies)
    if (message.includes('policy') || 
        message.includes('policies') ||
        message.includes('rule') ||
        message.includes('requirement') ||
        // Add these specific swimwear and personal items terms
        message.includes('bikini') ||
        message.includes('swimming costume') ||
        message.includes('swimsuit') ||
        message.includes('swim suit') ||
        message.includes('swimming suit') ||
        message.includes('bathing suit') ||
        message.includes('swim wear') ||
        message.includes('swimwear') ||
        message.includes('trunks') ||
        message.includes('shorts') ||
        message.includes('can i wear') ||
        message.includes('allowed to wear') ||
        message.includes('permitted to wear') ||
        message.includes('watch') ||
        message.includes('jewelry') ||
        message.includes('jewellery') ||
        message.includes('necklace') ||
        message.includes('ring') ||
        message.includes('earring') ||
        message.includes('bracelet') ||
        message.includes('wearable') ||
        message.includes('apple watch') ||
        message.includes('smart watch') ||
        message.includes('fitness tracker') ||
        message.includes('garmin') ||
        message.includes('fitbit') ||
        message.includes('rashguard') ||
        message.includes('rash guard') ||
        message.includes('swim shirt') ||
        message.includes('water shoe') ||
        message.includes('water shoes') ||
        message.includes('aqua shoes') ||
        // Etiquette related
        message.includes('etiquette') ||
        message.includes('proper behavior') ||
        message.includes('shoes') ||
        message.includes('barefoot') ||
        message.includes('shower') ||
        message.includes('shower before') ||
        message.includes('must shower') ||
        message.includes('soap') ||
        message.includes('clean') ||
        message.includes('washing') ||
        message.includes('voice') ||
        message.includes('quiet') ||
        message.includes('talk') ||
        message.includes('volume') ||
        message.includes('noise') ||
        message.includes('dry off') ||
        message.includes('drying') ||
        message.includes('towel') ||
        message.includes('social') ||
        message.includes('tradition') ||
        message.includes('custom') ||
        message.includes('behavior') ||
        message.includes('behave') ||
        message.includes('proper') ||
        message.includes('protocol') ||
        message.includes('standard') ||
        message.includes('expectation') ||
        message.includes('what should i') ||
        message.includes('how should i') ||
        message.includes('do i need to') ||
        message.includes('required to') ||
        message.includes('must i') ||
        message.includes('before entering') ||
        message.includes('before going in') ||
        message.includes('what do i do') ||
        message.includes('how does it work') ||
        message.includes('first time') ||
        message.includes('never been') ||
        message.includes('spa rules') ||
        // Age related
        message.includes('age') || 
        message.includes('old') ||
        message.includes('child') ||
        message.includes('children') ||
        message.includes('teenager') ||
        message.includes('teen') ||
        message.includes('kid') ||
        message.includes('young') ||
        message.includes('adult') ||
        message.includes('guardian') ||
        message.includes('parent') ||
        message.includes('supervise') ||
        message.includes('supervision') ||
        message.includes('minimum age') ||
        message.includes('age limit') ||
        message.includes('bring my child') ||
        message.includes('family') ||
        message.includes('under 12') ||
        message.includes('12 years') ||
        message.includes('14 years') ||
        // Age calculation specific patterns
        message.includes('11 year') ||
        message.includes('11-year') ||
        message.includes('turning 12') ||
        message.includes('will turn 12') ||
        message.includes('almost 12') ||
        message.includes('nearly 12') ||
        message.includes('not quite 12') ||
        message.includes('soon be 12') ||
        message.includes('later this year') ||
        message.includes('birth year') ||
        message.includes('calendar year') ||
        // Health and Safety
        message.includes('medical') ||
        message.includes('health') ||
        message.includes('condition') ||
        message.includes('pregnant') ||
        message.includes('pregnancy') ||
        message.includes('safe') ||
        message.includes('doctor') ||
        message.includes('epilepsy') ||
        message.includes('heart') ||
        message.includes('blood pressure') ||
        message.includes('surgery') ||
        message.includes('seizure') ||
        message.includes('allergy') ||
        message.includes('allergic') ||
        message.includes('ingredients') ||
        message.includes('scrub ingredients') ||
        message.includes('body scrub') ||
        message.includes('water') ||
        message.includes('drink') ||
        message.includes('hydrate') ||
        message.includes('hydration') ||
        message.includes('eat before') ||
        message.includes('food before') ||
        message.includes('empty stomach') ||
        // Photography
        message.includes('photo') ||
        message.includes('picture') ||
        message.includes('camera') ||
        message.includes('phone') ||
        message.includes('pictures allowed') ||
        message.includes('take pictures') ||
        message.includes('photography') ||
        message.includes('waterproof') ||
        message.includes('phone case') ||
        message.includes('camera allowed') ||
        message.includes('photography rules') ||
        // Cancellation
        message.includes('cancel') ||
        message.includes('refund') ||
        message.includes('change booking') ||
        message.includes('modify booking') ||
        message.includes('change date') ||
        message.includes('reschedule') ||
        message.includes('money back') ||
        message.includes('cancellation policy') ||
        // Booking and Capacity
        message.includes('availability') ||
        message.includes('available') ||
        message.includes('full') ||
        message.includes('capacity') ||
        message.includes('spot') ||
        message.includes('space') ||
        message.includes('book') ||
        message.includes('reservation') ||
        message.includes('advance') ||
        message.includes('walk in') ||
        message.includes('walk-in') ||
        message.includes('without booking') ||
        message.includes('sold out') ||
        // Add these new waiting list related terms
        message.includes('waiting list') ||
        message.includes('waitlist') ||
        message.includes('wait list') ||
        message.includes('waiting') ||
        message.includes('standby') ||
        message.includes('stand by') ||
        message.includes('cancelled spot') ||
        message.includes('canceled spot') ||
        message.includes('if someone cancels') ||
        message.includes('get in if') ||
        message.includes('full but') ||
        message.includes('no spots left') ||
        message.includes('no availability') ||
        message.includes('no slots') ||
        message.includes('join list') ||
        message.includes('put me on') ||
        message.includes('add me to') ||
        message.includes('notify') ||
        message.includes('alert me') ||
        message.includes('let me know') ||
        message.includes('cancellation happens') ||
        // Payment
        message.includes('pay') ||
        message.includes('payment') ||
        message.includes('wristband') ||
        message.includes('credit card') ||
        message.includes('debit card') ||
        message.includes('cash') ||
        message.includes('money') ||
        message.includes('wallet') ||
        message.includes('purchase') ||
        message.includes('buy') ||
        message.includes('cost') ||
        message.includes('price') ||
        message.includes('locker') ||
        message.includes('store items') ||
        message.includes('belongings') ||
        message.includes('valuables')) {

        // Always include general policies
        relevantInfo.push({
            type: 'policies',
            content: knowledgeBase.policies
        });

        // Add specific check for waiting list queries
        if (message.includes('waiting list') ||
            message.includes('waitlist') ||
            message.includes('wait list') ||
            message.includes('standby') ||
            message.includes('stand by') ||
            message.includes('cancelled spot') ||
            message.includes('canceled spot') ||
            message.includes('if someone cancels') ||
            message.includes('notify') ||
            message.includes('put me on') ||
            message.includes('add me to')) {
            
            console.log('\n⏳ Waiting List Query Detected');
            relevantInfo.push({
                type: 'waiting_list',
                content: knowledgeBase.policies.booking_capacity.availability.waiting_list
            });
        }

        // Add specific check for swimwear and personal items
        if (message.includes('bikini') ||
            message.includes('swimsuit') ||
            message.includes('swim') ||
            message.includes('bathing suit') ||
            message.includes('water shoe') ||
            message.includes('rashguard') ||
            message.includes('rash guard') ||
            message.includes('watch') ||
            message.includes('jewelry') ||
            message.includes('can i wear') ||
            message.includes('allowed to wear')) {
            
            console.log('\n👙 Swimwear/Personal Items Query Detected');
            relevantInfo.push({
                type: 'swimwear_personal_items',
                content: {
                    swimwear: knowledgeBase.policies.etiquette.general_rules.swimwear,
                    personal_items: knowledgeBase.policies.etiquette.general_rules.personal_items
                }
            });
        }

        // Add specific related sections based on query
        if (message.includes('pay') || 
            message.includes('payment') || 
            message.includes('wristband') ||
            message.includes('credit card') ||
            message.includes('cash') ||
            message.includes('money') ||
            message.includes('wallet')) {
            relevantInfo.push({
                type: 'payment_systems',
                content: knowledgeBase.policies.payment_systems
            });
        }

        // Add facility info for specific queries
        if (message.includes('locker') || 
            message.includes('store items') || 
            message.includes('belongings') || 
            message.includes('valuables') ||
            message.includes('changing room') ||
            message.includes('shower')) {
            relevantInfo.push({
                type: 'facilities',
                content: knowledgeBase.facilities
            });
        }

        // Add dining info for food/drink related queries
        if (message.includes('eat') || 
            message.includes('food') || 
            message.includes('drink') ||
            message.includes('bar') ||
            message.includes('cafe') ||
            message.includes('restaurant')) {
            relevantInfo.push({
                type: 'dining',
                content: knowledgeBase.dining
            });
        }
    }

    // Age policy specific queries
    if (message.toLowerCase().includes('age') || 
        message.toLowerCase().includes('old') ||
        message.toLowerCase().includes('child') ||
        message.toLowerCase().includes('children') ||
        message.toLowerCase().includes('teenager') ||
        message.toLowerCase().includes('teen') ||
        message.toLowerCase().includes('kid') ||
        message.toLowerCase().includes('young') ||
        message.toLowerCase().includes('adult') ||
        message.toLowerCase().includes('guardian') ||
        message.toLowerCase().includes('parent') ||
        message.toLowerCase().includes('supervise') ||
        message.toLowerCase().includes('supervision') ||
        message.toLowerCase().includes('minimum age') ||
        message.toLowerCase().includes('age limit') ||
        message.toLowerCase().includes('bring my child') ||
        message.toLowerCase().includes('family') ||
        message.toLowerCase().includes('under 12') ||
        message.toLowerCase().includes('12 years') ||
        message.toLowerCase().includes('14 years') ||
        // Month-specific patterns
        (message.toLowerCase().includes('august') && message.toLowerCase().includes('12')) ||
        (message.toLowerCase().includes('january') && message.toLowerCase().includes('12')) ||
        (message.toLowerCase().includes('february') && message.toLowerCase().includes('12')) ||
        (message.toLowerCase().includes('march') && message.toLowerCase().includes('12')) ||
        (message.toLowerCase().includes('april') && message.toLowerCase().includes('12')) ||
        (message.toLowerCase().includes('may') && message.toLowerCase().includes('12')) ||
        (message.toLowerCase().includes('june') && message.toLowerCase().includes('12')) ||
        (message.toLowerCase().includes('july') && message.toLowerCase().includes('12')) ||
        (message.toLowerCase().includes('september') && message.toLowerCase().includes('12')) ||
        (message.toLowerCase().includes('october') && message.toLowerCase().includes('12')) ||
        (message.toLowerCase().includes('november') && message.toLowerCase().includes('12')) ||
        (message.toLowerCase().includes('december') && message.toLowerCase().includes('12')) ||
        // Future birthday patterns
        (message.toLowerCase().includes('until') && message.toLowerCase().includes('12')) ||
        (message.toLowerCase().includes('turning') && message.toLowerCase().includes('12')) ||
        (message.toLowerCase().includes('become') && message.toLowerCase().includes('12')) ||
        (message.toLowerCase().includes('will be') && message.toLowerCase().includes('12'))) {
        
        console.log('\n👶 Age Policy Match Found');
        relevantInfo.push({
            type: 'age_policy',
            content: knowledgeBase.age_policy
        });
    }

    // Facility specific
    if (message.includes('facility') || 
        message.includes('towel') || 
        message.includes('rental') ||
        message.includes('wheelchair') ||
        message.includes('accessible') ||
        message.includes('disabled') ||
        message.includes('disability') ||
        message.includes('handicap') ||
        message.includes('aunt') ||  // Family member mentions often relate to accessibility
        message.includes('assist') ||
        message.includes('help') ||
        message.includes('bring') ||
        message.includes('swimsuit') ||
        message.includes('changing room') ||
        message.includes('change room') ||    // Added common variation
        message.includes('private') ||
        message.includes('storage') ||
        message.includes('locker') ||
        message.includes('shower') ||
        message.includes('depth') ||
        message.includes('deep') ||
        message.includes('temperature') ||
        message.includes('hot') ||
        message.includes('warm') ||
        message.includes('cold') ||
        message.includes('water') ||
        message.includes('swim') ||
        message.includes('photo') ||
        message.includes('camera') ||
        message.includes('picture') ||
        message.includes('infinity') ||
        message.includes('view') ||
        message.includes('ocean') ||
        message.includes('sea') ||
        // Add these new footwear-related terms
        message.includes('flip flop') ||
        message.includes('flipflop') ||
        message.includes('flip-flop') ||
        message.includes('slipper') ||
        message.includes('footwear') ||
        message.includes('foot wear') ||
        message.includes('shoes') ||
        message.includes('sandal') ||
        message.includes('barefoot') ||
        message.includes('need to wear') ||
        message.includes('need to bring') ||
        message.includes('take our own') ||
        message.includes('floor') ||
        message.includes('walking') ||
        // Continue with existing terms        
        message.includes('gender') ||
        message.includes('men') ||
        message.includes('women') ||
        message.includes('male') ||
        message.includes('female') ||
        message.includes('non binary') ||
        message.includes('nonbinary') ||
        message.includes('non-binary') ||
        message.includes('gender neutral') ||
        message.includes('transgender') ||
        message.includes('trans') ||
        message.includes('gender identity') ||
        // Amenities and rentals
        message.includes('amenity') ||
        message.includes('amenities') ||
        message.includes('rent') ||
        message.includes('hair dryer') ||
        message.includes('hairdryer') ||
        message.includes('robe') ||
        message.includes('slipper') ||
        message.includes('luggage') ||
        message.includes('bag') ||
        message.includes('baggage') ||
        // Accessibility terms
        message.includes('mobility') ||
        message.includes('chairlift') ||
        message.includes('lift') ||
        message.includes('support equipment') ||
        message.includes('special needs') ||
        // Photography and rules
        message.includes('photography') ||
        message.includes('phone') ||
        message.includes('device') ||
        message.includes('waterproof') ||
        message.includes('case') ||
        message.includes('pictures allowed') ||
        message.includes('taking pictures') ||
        // Facility features
        message.includes('infinity edge') ||
        message.includes('cave') ||
        message.includes('cave-side') ||
        message.includes('canopy') ||
        message.includes('horizon') ||
        message.includes('bench') ||
        message.includes('viewing platform') ||
        // Etiquette and rules
        message.includes('etiquette') ||
        message.includes('rule') ||
        message.includes('shoes') ||
        message.includes('shower before') ||
        message.includes('hygiene') ||
        message.includes('clean') ||
        // Hydration and safety
        message.includes('hydration') ||
        message.includes('drinking water') ||
        message.includes('fountain') ||
        message.includes('drink water') ||
        message.includes('stay hydrated') ||
        message.includes('medical') ||
        message.includes('first aid') ||
        message.includes('safety') ||
        // Common question phrasings
        message.includes('where is') ||
        message.includes('how deep') ||
        message.includes('how warm') ||
        message.includes('what facilities') ||
        message.includes('can i bring') ||
        message.includes('is there') ||
        message.includes('do you have') ||
        // Stay duration patterns
        message.includes('how long') || 
        message.includes('stay as long') ||
        message.includes('time limit') ||
        message.includes('duration') ||
        message.includes('unlimited time') ||
        message.includes('as long as') ||
        message.includes('leave') ||
        message.includes('entire day') ||
        message.includes('reservation last') ||
        (message.includes('how') && message.includes('long')) ||
        (message.includes('can') && message.includes('stay')) ||
        (message.includes('limit') && message.includes('time')) ||
        (message.includes('whole') && message.includes('day')) ||
        (message.includes('reservation') && message.includes('last'))) {
        
        relevantInfo.push({
            type: 'facilities',
            content: knowledgeBase.facilities
        });
        
        // Specific check for stay duration queries
        if (message.includes('how long') || 
            message.includes('stay as long') ||
            message.includes('time limit') ||
            message.includes('duration') ||
            message.includes('unlimited time') ||
            message.includes('as long as') ||
            message.includes('leave') ||
            message.includes('entire day') ||
            message.includes('reservation last') ||
            (message.includes('how') && message.includes('long')) ||
            (message.includes('can') && message.includes('stay')) ||
            (message.includes('limit') && message.includes('time')) ||
            (message.includes('whole') && message.includes('day')) ||
            (message.includes('reservation') && message.includes('last'))) {
            
            console.log('\n⏱️ Stay Duration Query Match Found');
            relevantInfo.push({
                type: 'facilities',
                subtype: 'stay_duration',
                content: knowledgeBase.facilities.lagoon.stay_duration
            });
        }
    }

    // View and landmark related queries (add this section near other facility queries)
    if (message.includes('view') ||
        message.includes('see') ||
        message.includes('vista') ||
        message.includes('outlook') ||
        message.includes('look out') ||
        message.includes('scenery') ||
        message.includes('scenic') ||
        message.includes('landscape') ||
        message.includes('panorama') ||
        message.includes('panoramic') ||
        // Landmark specific
        message.includes('keilir') ||
        message.includes('fagradalsfjall') ||
        message.includes('volcano') ||
        message.includes('bessastadir') ||
        message.includes('bessastaðir') ||
        message.includes('president') ||
        message.includes('snaefellsjokull') ||
        message.includes('snæfellsjökull') ||
        message.includes('glacier') ||
        message.includes('mountain') ||
        // Wildlife
        message.includes('bird') ||
        message.includes('seal') ||
        message.includes('wildlife') ||
        message.includes('animal') ||
        message.includes('whale') ||
        message.includes('watching') ||
        // Location viewing terms
        message.includes('infinity') ||
        message.includes('edge') ||
        message.includes('horizon') ||
        message.includes('infinite') ||
        message.includes('endless') ||
        message.includes('stretch') ||
        message.includes('landmark') ||
        message.includes('surroundings')) {
        
        relevantInfo.push({
            type: 'facilities',
            content: knowledgeBase.facilities
        });

        // If asking about seasonal views, also include seasonal info
        if (message.includes('winter') ||
            message.includes('summer') ||
            message.includes('northern light') ||
            message.includes('midnight sun') ||
            message.includes('sunset') ||
            message.includes('twilight') ||
            message.includes('star') ||
            message.includes('night sky')) {
            relevantInfo.push({
                type: 'seasonal_information',
                content: knowledgeBase.seasonal_information
            });
        }
    }

    // Dining and bar queries
    if (message.includes('bar') || 
        message.includes('drink') ||
        message.includes('beverage') ||
        message.includes('alcohol') ||
        message.includes('gelmir') ||
        message.includes('food') ||
        message.includes('dining') ||
        message.includes('cafe') ||
        message.includes('restaurant') ||
        message.includes('premises') ||
        message.includes('inside') ||
        message.includes('where is') ||
        // Adding specific venue names
        message.includes('smakk') ||
        message.includes('keimur') ||
        // Food-specific terms
        message.includes('platter') ||
        message.includes('menu') ||
        message.includes('eat') ||
        message.includes('soup') ||
        message.includes('bagel') ||
        message.includes('toastie') ||
        message.includes('skyr') ||
        message.includes('coffee') ||
        message.includes('snack') ||
        message.includes('lunch') ||
        // Specific menu items
        message.includes('cheese') ||
        message.includes('gravlax') ||
        message.includes('herring') ||
        message.includes('vegan') ||
        message.includes('hummus') ||
        message.includes('gluten') ||
        // Drink specifics
        message.includes('wine') ||
        message.includes('beer') ||
        message.includes('gull') ||
        message.includes('somersby') ||
        message.includes('cocktail') ||
        message.includes('soft drink') ||
        message.includes('coffee') ||
        message.includes('latte') ||
        message.includes('cappuccino') ||
        message.includes('tea') ||
        // Price related
        message.includes('how much') ||
        message.includes('cost of food') ||
        message.includes('price of drink') ||
        // Timing related
        message.includes('kitchen') ||
        message.includes('serving') ||
        message.includes('last order') ||
        message.includes('after swim') ||
        message.includes('before swim') ||
        // Local focus terms
        message.includes('icelandic food') ||
        message.includes('local food') ||
        message.includes('traditional') ||
        message.includes('tasting') ||
        message.includes('culinary')) {
            relevantInfo.push({
                type: 'dining',
                content: {
                    ...knowledgeBase.dining,
                    description: `Explore our dining options at Sky Lagoon. [View Dining Options] (https://www.skylagoon.com/food-drink)`
                }
            });
        // Also include facilities info for location context
        relevantInfo.push({
            type: 'facilities',
            content: knowledgeBase.facilities
        });
    } // End of Dining and bar queries

    // Transportation, location, and directions
    if (message.includes('shuttle') || 
        message.includes('transport') ||
        message.includes('bus') ||
        message.includes('how to get') ||
        message.includes('get to') ||
        message.includes('from bsi') ||
        message.includes('bus to') ||
        message.includes('from bsí') ||
        message.includes('bsí to') ||
        message.includes('transfer') ||
        message.includes('travel to') ||
        message.includes('direction') ||
        message.includes('parking') ||
        message.includes('address') ||
        message.includes('location') ||
        message.includes('drive') ||
        message.includes('airport') ||
        message.includes('car') ||
        message.includes('taxi') ||
        message.includes('walking') ||
        message.includes('from reykjavik') ||
        message.includes('from city') ||
        message.includes('far') || 
        message.includes('distance') ||
        message.includes('city') ||
        message.includes('downtown') ||
        message.includes('center') ||
        message.includes('central') ||
        message.includes('where') ||
        message.includes('area') ||
        message.includes('neighbourhood') ||
        message.includes('near') ||
        // Website specific terms
        message.includes('kópavogur') ||
        message.includes('kopavogur') ||
        message.includes('vesturvör') ||
        message.includes('vesturvor') ||
        message.includes('kársnes') ||
        message.includes('karsnes') ||
        // Public transport specifics
        message.includes('public transport') ||
        message.includes('strætó') ||
        message.includes('straeto') ||
        message.includes('bus number') ||
        message.includes('bus #') ||
        message.includes('bus 4') ||
        message.includes('bus 35') ||
        message.includes('bus route') ||
        message.includes('hlemmur') ||
        message.includes('hamraborg') ||
        message.includes('hafnarbraut') ||
        // Airport transfer specifics
        message.includes('keflavik') ||
        message.includes('kef') ||
        message.includes('flybus') ||
        message.includes('fly bus') ||
        message.includes('from airport') ||
        message.includes('to airport') ||
        // BSÍ transfer specifics
        message.includes('reykjavik excursions') ||
        message.includes('pickup') ||
        message.includes('pick up') ||
        message.includes('pick-up') ||
        message.includes('hotel pickup') ||
        message.includes('shuttle time') ||
        message.includes('shuttle schedule') ||
        message.includes('return shuttle') ||
        message.includes('bus terminal') ||
        // Hotel and Bus Stop specifics
        message.includes('hotel') ||
        message.includes('guesthouse') ||
        message.includes('hostel') ||
        message.includes('apartment') ||
        message.includes('accommodation') ||
        message.includes('staying at') ||
        message.includes('bus stop') ||
        message.includes('bus stops') ||
        message.includes('pickup point') ||
        message.includes('pick up point') ||
        message.includes('pick-up point') ||
        message.includes('nearest stop') ||
        message.includes('closest stop') ||
        message.includes('which stop') ||
        message.includes('go to stop') ||
        message.includes('find bus stop') ||
        message.includes('drop off') ||
        message.includes('drop-off') ||
        message.includes('dropoff') ||
        // Bus stop numbers
        message.includes('stop 1') ||
        message.includes('stop 2') ||
        message.includes('stop 3') ||
        message.includes('stop 4') ||
        message.includes('stop 5') ||
        message.includes('stop 6') ||
        message.includes('stop 8') ||
        message.includes('stop 9') ||
        message.includes('stop 11') ||
        message.includes('stop 12') ||
        message.includes('stop 13') ||
        message.includes('stop 14') ||
        message.includes('stop 15') ||
        // Common bus stop names
        message.includes('ráðhúsið') ||
        message.includes('radhusid') ||
        message.includes('city hall') ||
        message.includes('tjörnin') ||
        message.includes('tjornin') ||
        message.includes('the pond') ||
        message.includes('lækjargata') ||
        message.includes('laekjargata') ||
        message.includes('miðbakki') ||
        message.includes('midbakki') ||
        message.includes('harpa') ||
        message.includes('safnahusid') ||
        message.includes('culture house') ||
        message.includes('hallgrímskirkja') ||
        message.includes('hallgrimskirkja') ||
        message.includes('snorrabraut') ||
        message.includes('austurbær') ||
        message.includes('austurbaer') ||
        message.includes('höfðatorg') ||
        message.includes('hofdatorg') ||
        message.includes('rauðarárstígur') ||
        message.includes('raudararstigur') ||
        message.includes('skúlagata') ||
        message.includes('skulagata') ||
        message.includes('vesturbugt') ||
        // Eco transport options
        message.includes('walking path') ||
        message.includes('cycle') ||
        message.includes('cycling') ||
        message.includes('bike') ||
        message.includes('biking') ||
        message.includes('electric car') ||
        message.includes('charging') ||
        // Parking specifics
        message.includes('park') ||
        message.includes('parking lot') ||
        message.includes('car park') ||
        message.includes('free parking') ||
        message.includes('disabled parking') ||
        message.includes('accessible parking') ||
        // Common question formats
        message.includes('how do i get') ||
        message.includes('best way to') ||
        message.includes('easiest way to') ||
        message.includes('what is the way to') ||
        message.includes('how to reach') ||
        message.includes('how can i get') ||
        message.includes('minutes from') ||
        message.includes('hours from') ||
        message.includes('directions to') ||
        message.includes('directions from') ||
        // Time and duration queries
        message.includes('how long') ||
        message.includes('travel time') ||
        message.includes('journey time') ||
        message.includes('duration') ||
        message.includes('minutes away') ||
        message.includes('hours away') ||
        // Location queries
        message.includes('where are you') ||
        message.includes('where is sky') ||
        message.includes('located in') ||
        message.includes('situated in') ||
        message.includes('whereabouts') ||
        // Luggage related
        message.includes('luggage') ||
        message.includes('suitcase') ||
        message.includes('bags') ||
        message.includes('baggage storage') ||
        message.includes('store luggage') ||
        message.includes('store bags')) {

        // First push basic location info
        relevantInfo.push({
            type: 'location',
            content: {
                ...knowledgeBase.transportation.location,
                description: `You can find Sky Lagoon at Vesturvör 44, 200 Kópavogur. [View on Google Maps 📍] (https://www.google.com/maps/dir//Vesturv%C3%B6r+44,+200+K%C3%B3pavogur)`
            }
        });

        // Enhanced shuttle/bus stop detection with more specific info types
        if (message.includes('shuttle') || 
            message.includes('bus') || 
            message.includes('pickup') || 
            message.includes('pick up') ||
            message.includes('pick-up') ||
            message.includes('transfer')) {

            // If asking specifically about bus identification
            if (message.includes('which bus') || 
                message.includes('how will i know') || 
                message.includes('how to identify') || 
                message.includes('find the bus')) {
                relevantInfo.push({
                    type: 'bus_identification',
                    content: knowledgeBase.transportation.hotel_bus_stops.transfer_details.identification
                });
            }

            // If asking about round-trip/return journey
            if (message.includes('return') || 
                message.includes('back') || 
                message.includes('two way') || 
                message.includes('both way') ||
                message.includes('drop off') ||
                message.includes('drop-off') ||
                message.includes('getting back')) {
                relevantInfo.push({
                    type: 'return_journey',
                    content: knowledgeBase.transportation.hotel_bus_stops.transfer_details.round_trip
                });
            }

            // Enhanced general shuttle service info
            if (message.includes('tell me about') || 
                message.includes('how does') || 
                message.includes('explain') || 
                message.includes('shuttle service')) {
                relevantInfo.push({
                    type: 'shuttle_service_detailed',
                    content: {
                        provider_info: {
                            name: "Reykjavík Excursions",
                            contact: {
                                email: "info@icelandia.is",
                                phone: "+354 580 5400",
                                website: "www.re.is"
                            },
                            note: "All shuttle services are operated by our partners at Reykjavík Excursions"
                        },
                        basic_info: knowledgeBase.transportation.shuttle_service,
                        identification: knowledgeBase.transportation.hotel_bus_stops.transfer_details.identification,
                        timing: knowledgeBase.transportation.hotel_bus_stops.transfer_details.timing,
                        important_notes: knowledgeBase.transportation.hotel_bus_stops.transfer_details.important_notes,
                        contact: knowledgeBase.transportation.hotel_bus_stops.customer_support
                    }
                });
            }
            
            // Add specific missed pickup handling
            if (message.includes('miss') || 
                message.includes('late') || 
                message.includes('missed')) {
                relevantInfo.push({
                    type: 'missed_pickup',
                    content: {
                        instructions: [
                            "If pickup hasn't arrived within 20 minutes, contact Reykjavík Excursions at +354 599 0000",
                            "If you miss your pickup, you must reach BSÍ at own cost",
                            "Contact Reykjavík Excursions at info@icelandia.is for assistance with rescheduling"
                        ],
                        contact: {
                            phone: "+354 599 0000",
                            email: "info@icelandia.is",
                            provider: "Reykjavík Excursions",
                            note: "All shuttle services are operated by Reykjavík Excursions"
                        },
                        bsi_info: {
                            location: "BSÍ Bus Terminal - City center",
                            schedule: "Buses depart on the hour of your booking",
                            provider: "Operated by Reykjavík Excursions"
                        }
                    }
                });
            }            

            // If asking about specific hotel or bus stop
            if (message.includes('hotel') || 
                message.includes('hostel') || 
                message.includes('guesthouse') || 
                message.includes('bus stop') || 
                message.includes('pickup point')) {

                // Check if asking specifically about bus stop location
                if (message.includes('where is') || 
                    message.includes('where can i find') || 
                    message.includes('location of') || 
                    message.includes('how to get to bus stop')) {
                    for (let [stopName, location] of Object.entries(knowledgeBase.transportation.hotel_bus_stops.bus_stop_locations)) {
                        if (message.toLowerCase().includes(stopName.toLowerCase())) {
                            relevantInfo.push({
                                type: 'bus_stop_location',
                                content: {
                                    stop_name: stopName,
                                    location_details: location,
                                    area: location.area,
                                    landmarks: location.landmarks,
                                    address: location.address
                                }
                            });
                            break;
                        }
                    }
                }

                // Check for specific hotel mentions first
                let foundDirectPickup = false;
                for (let location of knowledgeBase.transportation.hotel_bus_stops.direct_pickup_locations) {
                    if (message.toLowerCase().includes(location.toLowerCase())) {
                        relevantInfo.push({
                            type: 'direct_pickup',
                            content: {
                                location: location,
                                details: knowledgeBase.transportation.hotel_bus_stops.transfer_details
                            }
                        });
                        foundDirectPickup = true;
                        break;
                    }
                }

                // If not a direct pickup location, check bus stops
                if (!foundDirectPickup) {
                    for (let [stopName, hotels] of Object.entries(knowledgeBase.transportation.hotel_bus_stops.bus_stops)) {
                        // Check if message includes bus stop name or any of its hotels
                        if (message.toLowerCase().includes(stopName.toLowerCase()) ||
                            hotels.some(hotel => message.toLowerCase().includes(hotel.toLowerCase()))) {
                            relevantInfo.push({
                                type: 'bus_stop_info',
                                content: {
                                    stop_name: stopName,
                                    location_details: knowledgeBase.transportation.hotel_bus_stops.bus_stop_locations[stopName],
                                    hotels: hotels,
                                    transfer_details: knowledgeBase.transportation.hotel_bus_stops.transfer_details
                                }
                            });
                            break;
                        }
                    }
                }

                // If no specific hotel or bus stop found, provide general shuttle service info
                if (!foundDirectPickup && relevantInfo.length <= 1) {
                    relevantInfo.push({
                        type: 'shuttle_service',
                        content: {
                            ...knowledgeBase.transportation.shuttle_service,
                            provider_note: "Our shuttle service is operated by Reykjavík Excursions. For assistance finding your nearest bus stop, please contact them directly at info@icelandia.is or +354 599 0000"
                        }
                    });
                    relevantInfo.push({
                        type: 'hotel_bus_stops',
                        content: knowledgeBase.transportation.hotel_bus_stops
                    });
                }
            }

            // If asking about timing
            if (message.includes('when') || 
                message.includes('time') || 
                message.includes('early') || 
                message.includes('how long before')) {
                relevantInfo.push({
                    type: 'pickup_timing',
                    content: {
                        timing: knowledgeBase.transportation.hotel_bus_stops.timing,
                        details: knowledgeBase.transportation.hotel_bus_stops.transfer_details.timing
                    }
                });
            }
        }

        // Enhanced public transport detection
        if (message.includes('public transport') || 
            message.includes('strætó') ||
            message.includes('straeto') ||
            message.includes('bus number') ||
            message.includes('bus #') ||
            message.includes('bus 4') ||
            message.includes('bus 35')) {
            
            // If asking about airport route specifically
            if (message.includes('airport') || 
                message.includes('keflavik') || 
                message.includes('kef')) {
                relevantInfo.push({
                    type: 'airport_public_transport',
                    content: knowledgeBase.transportation.airport_transfer.bus_option
                });
            } else {
                // Standard public transport route
                relevantInfo.push({
                    type: 'public_transport',
                    content: {
                        route: knowledgeBase.transportation.public_transport,
                        schedule_info: "Visit straeto.is for current timings"
                    }
                });
            }
        }

        // If asking about parking
        if (message.includes('park') || 
            message.includes('parking') || 
            message.includes('car') ||
            message.includes('electric')) {
            relevantInfo.push({
                type: 'parking',
                content: knowledgeBase.transportation.parking
            });
        }

        // If asking about airport transfer
        if (message.includes('airport') || 
            message.includes('keflavik') || 
            message.includes('kef') ||
            message.includes('flybus')) {
            
            // Enhance the detection for return to airport queries
            if (message.includes('drop') ||
                message.includes('back to') ||
                message.includes('return to') ||
                message.includes('get to') ||
                message.includes('take me to') ||
                message.includes('leaving to') ||
                message.includes('leaving for') ||
                message.includes('shuttle to') ||
                message.includes('bus to') ||
                message.includes('transfer to') ||
                message.includes('how to get to') ||
                message.includes('go to')) {
                
                console.log('\n✈️ Airport Return Query Detected');
                relevantInfo.push({
                    type: 'airport_return',
                    content: {
                        return_info: knowledgeBase.transportation.airport_transfer.return_to_airport,
                        shuttle_times: knowledgeBase.transportation.shuttle_service.return_service,
                        shuttle_provider: knowledgeBase.transportation.shuttle_service.provider_info
                    }
                });
            } else {
                // Regular airport transfer info
                relevantInfo.push({
                    type: 'airport_transfer',
                    content: knowledgeBase.transportation.airport_transfer
                });
            }
        }

        // If asking about luggage
        if (message.includes('luggage') || 
            message.includes('suitcase') || 
            message.includes('bags') ||
            message.includes('baggage')) {
            relevantInfo.push({
                type: 'luggage',
                content: knowledgeBase.transportation.airport_transfer.luggage
            });
        }

        // If asking about eco-friendly options
        if (message.includes('walk') || 
            message.includes('cycle') || 
            message.includes('bike') ||
            message.includes('cycling') ||
            message.includes('biking') ||
            message.includes('electric')) {
            relevantInfo.push({
                type: 'eco_friendly',
                content: knowledgeBase.transportation.eco_friendly_options
            });
        }
    } // End of full Transportation section

    // Group booking related queries
    if (message.includes('group') || 
        message.includes('corporate') ||
        message.includes('team') ||
        message.includes('party') ||
        message.includes('multiple people') ||
        message.includes('many people') ||
        message.includes('several people') ||
        message.includes('together') ||
        // Specific group types
        message.includes('company') ||
        message.includes('conference') ||
        message.includes('retreat') ||
        message.includes('celebration') ||
        message.includes('tour group') ||
        message.includes('office') ||
        message.includes('team building') ||
        message.includes('business') ||
        message.includes('work') ||
        message.includes('colleagues') ||
        message.includes('staff') ||
        message.includes('employees') ||
        // Size related
        message.includes('10 people') ||
        message.includes('large group') ||
        message.includes('small group') ||
        message.includes('big group') ||
        message.includes('group size') ||
        message.includes('group rate') ||
        message.includes('group discount') ||
        // Booking process
        message.includes('group booking') ||
        message.includes('book for group') ||
        message.includes('group reservation') ||
        message.includes('organize') ||
        message.includes('arrange') ||
        message.includes('plan') ||
        // Group amenities
        message.includes('group package') ||
        message.includes('group deal') ||
        message.includes('group offer') ||
        message.includes('private area') ||
        message.includes('group dining') ||
        message.includes('group food') ||
        message.includes('group transport')) {

        // Always include group booking info
        relevantInfo.push({
            type: 'group_bookings',
            content: knowledgeBase.group_bookings
        });

        // Add dining info for food/dining related queries
        if (message.includes('food') || 
            message.includes('dining') || 
            message.includes('eat') ||
            message.includes('restaurant') ||
            message.includes('menu') ||
            message.includes('platter')) {
            relevantInfo.push({
                type: 'dining',
                content: knowledgeBase.dining
            });
        }

        // Add transportation info for transfer related queries
        if (message.includes('transport') || 
            message.includes('transfer') || 
            message.includes('bus') ||
            message.includes('shuttle') ||
            message.includes('getting there')) {
            relevantInfo.push({
                type: 'transportation',
                content: knowledgeBase.transportation
            });
        }

        // Add package info when asking about group packages
        if (message.includes('package') || 
            message.includes('deal') || 
            message.includes('offer') ||
            message.includes('price') ||
            message.includes('cost') ||
            message.includes('rate')) {
            relevantInfo.push({
                type: 'packages',
                content: knowledgeBase.packages
            });
        }

        // Add policies info for relevant queries
        if (message.includes('cancel') || 
            message.includes('policy') || 
            message.includes('rule') ||
            message.includes('requirement') ||
            message.includes('minimum') ||
            message.includes('notice')) {
            relevantInfo.push({
                type: 'policies',
                content: knowledgeBase.policies
            });
        }
    }

    // Multi-Pass related queries
    if (message.includes('multi-pass') || 
        message.includes('multi pass') ||
        message.includes('multipass') ||
        message.includes('hefð') ||
        message.includes('hefd') ||
        message.includes('venja') ||
        message.includes('six visits') ||
        message.includes('6 visits') ||
        message.includes('multiple visits') ||
        message.includes('loyalty') ||
        message.includes('regular visits') ||
        message.includes('frequent visits') ||
        message.includes('regular wellness') ||
        message.includes('wellness routine') ||
        message.includes('half price visits') ||
        message.includes('discount pass') ||
        message.includes('multiple entries') ||
        message.includes('several visits') ||
        message.includes('repeat visits') ||
        message.includes('reduced price') ||
        message.includes('regular guest') ||
        message.includes('frequent guest') ||
        message.includes('visit often') ||
        message.includes('come back') ||
        message.includes('return visits') ||
        message.includes('regular basis')) {
        relevantInfo.push({
            type: 'multi_pass',
            content: {
                ...knowledgeBase.multi_pass,
                description: `Learn more about our Multi-Pass option for regular visits. [View Multi-Pass Details] (https://www.skylagoon.com/multi-pass)`
            }
        });
    }

    // Products and retail related queries
    if (message.includes('product') || 
        message.includes('buy') ||
        message.includes('purchase') ||
        message.includes('shop') ||
        message.includes('retail') ||
        message.includes('scrub') ||
        message.includes('lotion') ||
        message.includes('oil') ||
        message.includes('mist') ||
        message.includes('candle') ||
        message.includes('spray') ||
        message.includes('diffuser') ||
        message.includes('soap') ||
        message.includes('miniature') ||
        message.includes('travel size') ||
        message.includes('gift set') ||
        message.includes('body products') ||
        message.includes('skin care') ||
        message.includes('fragrance') ||
        message.includes('home products') ||
        message.includes('ingredients') ||
        message.includes('where can i buy') ||
        message.includes('what products') ||
        message.includes('take home') ||
    
        // Add these new shipping-specific terms
        message.includes('ship') ||
        message.includes('shipping') ||
        message.includes('delivery') ||
        message.includes('mail') ||
        message.includes('send') ||
        message.includes('post') ||
        message.includes('order online') ||
        message.includes('buy online') ||
        message.includes('purchase online') ||
        message.includes('international') ||
        message.includes('overseas') ||
        message.includes('abroad') ||
        message.includes('outside iceland') ||
        message.includes('to my country') ||
        message.includes('to my home') ||
        message.includes('to the us') ||
        message.includes('to usa') ||
        message.includes('to europe') ||
        message.includes('to my address') ||
        message.includes('shipping cost') ||
        message.includes('shipping fee') ||
        message.includes('how much to ship') ||
        message.includes('ship products') ||
        message.includes('ship items') ||
        message.includes('customs') ||
        message.includes('import') ||
        message.includes('duties') ||
        message.includes('taxes') ||
        message.includes('minimum order') ||
        message.includes('price list') ||
        message.includes('product prices') ||
        message.includes('how to order') ||
        message.includes('shampoo') ||
        message.includes('conditioner') ||
        message.includes('bath products')) {
        
        relevantInfo.push({
            type: 'products',
            content: knowledgeBase.products
        });

        // New specific check for shipping queries
        if (message.includes('ship') ||
            message.includes('shipping') ||
            message.includes('delivery') ||
            message.includes('mail') ||
            message.includes('send') ||
            message.includes('post') ||
            message.includes('order online') ||
            message.includes('buy online') ||
            message.includes('international') ||
            message.includes('overseas') ||
            message.includes('abroad') ||
            message.includes('outside iceland') ||
            message.includes('to my country') ||
            message.includes('to my home') ||
            message.includes('to the us') ||
            message.includes('to usa') ||
            message.includes('to europe') ||
            message.includes('customs') ||
            message.includes('minimum order') ||
            message.includes('price list')) {
            
            console.log('\n📦 Product Shipping Query Detected');
            relevantInfo.push({
                type: 'product_shipping',
                content: {
                    shipping_info: knowledgeBase.products.shipping,
                    locations: knowledgeBase.products.locations,
                    contact: knowledgeBase.products.shipping.contact
                }
            });
        }
        
        // If asking about scrub ingredients specifically
        if (message.includes('ingredient') || message.includes('allerg')) {
            relevantInfo.push({
                type: 'health_safety',
                content: knowledgeBase.policies.health_safety
            });
        }
    }

    // Lost and Found related queries
    if (message.includes('lost') ||
        message.includes('found') ||
        message.includes('missing') ||
        message.includes('left behind') ||
        message.includes('forgot') ||
        message.includes('forgotten') ||
        message.includes('leave') ||
        message.includes('left') ||
        message.includes('find my') ||
        message.includes('lost and found') ||
        message.includes('lost property') ||
        message.includes('retrieve') ||
        message.includes('get back') ||
        message.includes('ship') ||
        message.includes('send') ||
        message.includes('shipping fee') ||
        message.includes('return item') ||
        message.includes('claim') ||
        message.includes('belongings') ||
        // Specific item mentions
        message.includes('wallet') ||
        message.includes('phone') ||
        message.includes('camera') ||
        message.includes('jewelry') ||
        message.includes('swimsuit') ||
        message.includes('towel') ||
        message.includes('clothes') ||
        message.includes('clothing') ||
        message.includes('items') ||
        // Question formats
        message.includes('what happens if') ||
        message.includes('how do i get') ||
        message.includes('where can i find') ||
        message.includes('how can i get') ||
        message.includes('is there')) {
        
        relevantInfo.push({
            type: 'lost_found',
            content: knowledgeBase.lost_found
        });

        // Also include facilities info for locker-related queries
        if (message.includes('locker') || 
            message.includes('storage') || 
            message.includes('keep') ||
            message.includes('secure')) {
            relevantInfo.push({
                type: 'facilities',
                content: knowledgeBase.facilities
            });
        }
    }

    // Pride and Accessibility related queries
    if (message.includes('pride') ||
        message.includes('lgbtq') ||
        message.includes('lgbt') ||
        message.includes('gay') ||
        message.includes('lesbian') ||
        message.includes('queer') ||
        message.includes('trans') ||
        message.includes('transgender') ||
        message.includes('gender') ||
        message.includes('identity') ||
        message.includes('non binary') ||
        message.includes('nonbinary') ||
        message.includes('non-binary') ||
        message.includes('inclusive') ||
        message.includes('diversity') ||
        // Accessibility terms
        message.includes('wheelchair') ||
        message.includes('accessible') ||
        message.includes('accessibility') ||
        message.includes('disabled') ||
        message.includes('disability') ||
        message.includes('mobility') ||
        message.includes('handicap') ||
        message.includes('special needs') ||
        message.includes('lift') ||
        message.includes('chairlift') ||
        message.includes('assistance') ||
        message.includes('help') ||
        message.includes('support') ||
        // Changing room related
        message.includes('gender neutral') ||
        message.includes('private room') ||
        message.includes('changing room') ||
        message.includes('upgrade room') ||
        message.includes('privacy') ||
        // Question formats
        message.includes('can you accommodate') ||
        message.includes('is it accessible') ||
        message.includes('do you have facilities') ||
        message.includes('how accessible')) {

        relevantInfo.push({
            type: 'pride_accessibility',
            content: knowledgeBase.pride_accessibility
        });

        // Add facilities info for specific queries
        if (message.includes('changing') || 
            message.includes('room') || 
            message.includes('facility') ||
            message.includes('shower')) {
            relevantInfo.push({
                type: 'facilities',
                content: knowledgeBase.facilities
            });
        }
    } // End of Pride and Accessibility related queries section

    // Job/career related queries
    if (message.includes('job') || 
        message.includes('apply') ||
        message.includes('application') ||
        message.includes('career') ||
        message.includes('employment') ||
        message.includes('work for') ||
        message.includes('work at') ||
        message.includes('hiring') ||
        message.includes('position') ||
        message.includes('opening') ||
        message.includes('vacancy') ||
        message.includes('resume') ||
        message.includes('cv') ||
        message.includes('summer job') ||
        message.includes('seasonal') ||
        message.includes('lifeguard') ||
        message.includes('security guard') ||
        (message.includes('job') && message.includes('available')) ||
        (message.includes('looking for') && message.includes('job')) ||
        (message.includes('apply') && message.includes('position')) ||
        (message.includes('opportunity') && message.includes('work')) ||
        (message.includes('send') && message.includes('resume'))) {
        
        console.log('\n💼 Career Inquiry Match Found');
        relevantInfo.push({
            type: 'careers',
            content: knowledgeBase.careers
        });
    } // End of Job/career related queries section

  return relevantInfo;
} // End of keywordSearch function
