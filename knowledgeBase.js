// knowledgeBase.js
export const knowledgeBase = {
    opening_hours: {
        tagline: "We look forward to welcoming you where the sea meets the sky",
        regular: {
            summer: {
                period: "June 1 - September 30",
                hours: "09:00 - 23:00",
                daily: true,
                facilities: {
                    lagoon: "Closes 30 minutes before closing time",
                    ritual: "Closes 1 hour before closing time",
                    gelmir_bar: "Closes 1 hour before closing time",
                    keimur_cafe: "09:00 - 22:30",
                    smakk_bar: "12:00 - 22:30"
                }
            },
            autumn: {
                period: "October 1 - October 31",
                hours: "10:00 - 23:00",
                daily: true,
                facilities: {
                    lagoon: "Closes 30 minutes before closing time",
                    ritual: "Closes 1 hour before closing time",
                    gelmir_bar: "Closes 1 hour before closing time",
                    keimur_cafe: "10:00 - 22:30",
                    smakk_bar: "12:00 - 22:30"
                }
            },
            winter: {
                period: "November 1 - May 31",
                weekday: {
                    days: "Monday - Friday",
                    hours: "11:00 - 22:00",
                    facilities: {
                        lagoon: "Closes 30 minutes before closing time",
                        ritual: "Closes 1 hour before closing time",
                        gelmir_bar: "Closes 1 hour before closing time",
                        keimur_cafe: "11:00 - 21:30",
                        smakk_bar: "12:00 - 21:30"
                    }
                },
                weekend: {
                    days: "Saturday - Sunday",
                    hours: "10:00 - 22:00",
                    facilities: {
                        lagoon: "Closes 30 minutes before closing time",
                        ritual: "Closes 1 hour before closing time",
                        gelmir_bar: "Closes 1 hour before closing time",
                        keimur_cafe: "11:00 - 21:30",
                        smakk_bar: "12:00 - 21:30"
                    }
                }
            }
        },
        holidays: {
            christmas_eve: {
                date: "December 24",
                hours: "09:00 - 16:00",
            },
            christmas_day: {
                date: "December 25",
                hours: "09:00 - 18:00",
            },
            boxing_day: {
                date: "December 26",
                hours: "09:00 - 22:00",
            },
            new_years_eve: {
                date: "December 31",
                hours: "09:00 - 18:00",
            },
            new_years_day: {
                date: "January 1",
                hours: "10:00 - 22:00",
            }
        },
        important_notes: [
            "The Lagoon area closes 30 minutes before advertised closing time",
            "The Skjól Ritual and Gelmir Bar close one hour before facility closing",
            "Last food orders at Smakk Bar are taken 30 minutes before closing",
            "Advance booking recommended to secure your preferred time slot",
            "Hours may vary during special holidays or events"
        ],
        dining_hours: {
            keimur_cafe: {
                name: "Keimur Café",
                description: "Fresh coffee, light meals, and Icelandic treats",
                summer: {
                    period: "June 1 - September 30",
                    hours: "09:00 - 22:30"
                },
                autumn: {
                    period: "October 1 - October 31",
                    hours: "10:00 - 22:30"
                },
                winter: {
                    period: "November 1 - May 31",
                    hours: "11:00 - 21:30"
                },
                notes: "Last orders 30 minutes before closing"
            },
            smakk_bar: {
                name: "Smakk Bar",
                description: "Icelandic culinary experience with tasting platters",
                summer: {
                    period: "June 1 - September 30",
                    hours: "12:00 - 22:30"
                },
                autumn: {
                    period: "October 1 - October 31",
                    hours: "12:00 - 22:30"
                },
                winter: {
                    period: "November 1 - May 31",
                    hours: "12:00 - 21:30"
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
                    range: "10,490 - 11,990 ISK",
                    days: "Monday-Thursday",
                    best_value: "Evening visits (7:30 PM - 8:30 PM)"
                },
                weekend: {
                    range: "11,490 - 12,990 ISK",
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
                    range: "13,490 - 14,990 ISK",
                    days: "Monday-Thursday",
                    best_value: "Evening visits (7:30 PM - 8:30 PM)"
                },
                weekend: {
                    range: "15,490 - 15,990 ISK",
                    days: "Friday-Sunday"
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
                    price: "From ISK 39,480",
                    includes: [
                        "2 x Sér passes",
                        "Private changing facilities",
                        "Skjól ritual access",
                        "One drink per guest at Gelmir lagoon bar",
                        "Sky Platter from Smakk Bar",
                        "Towels included"
                    ]
                },
                saman_for_two: {
                    name: "Saman for Two",
                    price: "From ISK 33,480",
                    includes: [
                        "2 x Saman passes",
                        "Public changing facilities",
                        "Skjól ritual access",
                        "One drink per guest at Gelmir lagoon bar",
                        "Sky Platter from Smakk Bar",
                        "Towels included"
                    ]
                }
            },
            "booking_info": {
                "how_to_book": "Book directly through our website or at reception",
                "availability": "Subject to capacity",
                "recommended": "Advance booking recommended",
                "last_booking": "18:00",
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
                        price: "33,480 ISK",
                        description: "Two Saman passes to share a rejuvenating journey together",
                        includes: [
                            "Two Saman Passes",
                            "One drink per guest",
                            "Sky Platter from Smakk Bar"
                        ]
                    },
                    ser_for_two: {
                        name: "Sér for Two",
                        price: "39,480 ISK",
                        description: "Two Sér passes for the ultimate shared experience",
                        includes: [
                            "Two Sér Passes",
                            "One drink per guest",
                            "Sky Platter from Smakk Bar"
                        ]
                    }
                },
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
        }
    },

    booking_modifications: {
        policy: {
            standard: {
                allowed: true,
                conditions: [
                    "Booking date/time has not passed",
                    "Availability exists for requested new time"
                ],
                contact_options: {
                    phone: {
                        hours: "09:00 - 19:00",
                        description: "Preferred method for same-day changes"
                    },
                    email: {
                        address: "reservations@skylagoon.is",
                        description: "For future date modifications"
                    }
                }
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
            benefits: [
                "Deep relaxation and rejuvenation",
                "Traditional therapeutic elements",
                "Connection to Icelandic heritage",
                "Complete mind and body wellness"
            ]
        },
        important_notes: [
            "Essential part of Sky Lagoon experience",
            "Cannot be excluded from visit",
            "Included in all admission packages",
            "No separate booking option available",
            "One complete journey through all seven steps included per visit"
        ]
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
                    "Extended daylight hours until closing at 23:00",
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
                            hours: "9:00 - 23:00 daily",
                            highlights: [
                                "Late evening sun views from infinity edge",
                                "Extended twilight atmosphere",
                                "Optimal viewing times from 20:00-23:00",
                                "Perfect for evening relaxation under the midnight sun"
                            ]
                        }
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
                        hours: "12:00 - 22:30"
                    },
                    autumn: {
                        period: "October 1 - October 31",
                        hours: "12:00 - 22:30"
                    },
                    winter: {
                        period: "November 1 - May 31",
                        hours: "12:00 - 21:30"
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
                        hours: "9:00 - 22:30"
                    },
                    autumn: {
                        period: "October 1 - October 31",
                        hours: "10:00 - 22:30"
                    },
                    winter: {
                        period: "November 1 - May 31",
                        hours: "11:00 - 21:30"
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
                contact: "corporate@skylagoon.is"
            }
        }
    },

    policies: {
        age_restrictions: {
            minimum_age: 12,
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
                additional_info: "The experience is focused on adult individuals to provide relaxation and rejuvenation",
                age_calculation: "Birth year counts for age limit - children turning 12 within the calendar year may visit Sky Lagoon"
            },
            recommendations: {
                changing_rooms: "We recommend that families with children aged 12-14 use the Sér Pass' premium changing rooms for space and privacy",
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
            }
        }
    },

    facilities: {
        amenities: {
            tagline: "Experience the heart of Icelandic tradition at our oceanside geothermal lagoon",
            included: [
                "Towels included free of charge",
                "Changing rooms designed for comfort and privacy",
                "Secure lockers with electronic wristband access",
                "Fresh drinking water stations",
                "In-water Gelmir Bar beneath the cave-wall canopy",
                "Keimur Café for light refreshments",
                "Smakk Bar for Icelandic culinary experiences"
            ],
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
                        ]
                    },
                    cave_area: {
                        description: "Find your way to our cave-side bar beneath the canopy on the far edge of the lagoon"
                    }
                }
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
            bsi_service: {
                departure_point: "BSÍ bus terminal",
                departure_times: ["13:00", "15:00", "17:00", "19:00"],
                timing: "Bus departs BSÍ on the hour of your booking",
                direction: "Direct service to Sky Lagoon",
                pickup_service: {
                    available: true,
                    timing: "Starts 30 minutes before your selected time",
                    important_notes: [
                        "Be ready and visible at designated bus stop or outside hotel",
                        "Call +354 580 5400 if pickup hasn't arrived 20 minutes after start time",
                        "If pickup is missed, must reach BSÍ at own cost before departure time"
                    ],
                    restrictions: "Drop-off may be limited due to street closures and city centre bus restrictions"
                }
            },
            return_service: {
                departure_point: "Sky Lagoon",
                destination: "BSÍ bus terminal",
                departure_times: [
                    "14:30", "15:30", "16:30", "17:30", 
                    "18:30", "19:30", "20:30", "21:30"
                ]
            },
            booking: {
                methods: [
                    "Book with Sky Lagoon ticket purchase",
                    "Book separately through www.re.is"
                ],
                modifications: "Contact Reykjavík Excursions directly for changes"
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
            online: "Available through our website"
        },
        items: {
            skin_care: {
                body_scrub: {
                    name: "Sky Body Scrub",
                    description: "Our signature scrub used in the Skjól ritual",
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
                    description: "Sky Lagoon signature hand soap"
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
            gift_packaging: "Available upon request",
            shipping: "International shipping available"
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
};

// Enhanced getRelevantKnowledge function
export const getRelevantKnowledge = (userMessage) => {
    const message = userMessage.toLowerCase();
    let relevantInfo = [];

// Opening hours and timing
    if (message.includes('open') || 
        message.includes('hour') || 
        message.includes('time') ||
        message.includes('close') ||
        message.includes('slot') ||
        message.includes('when') ||
        message.includes('schedule') ||
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

    // Booking modifications and late arrivals
    if (message.includes('change') || 
        message.includes('modify') ||
        message.includes('reschedule') ||
        message.includes('late') ||
        message.includes('delayed') ||
        message.includes('miss') ||
        message.includes('missed') ||
        message.includes('different time') ||
        message.includes('different date')) {
        relevantInfo.push({
            type: 'booking_modifications',
            content: knowledgeBase.booking_modifications
        });
    }

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
        relevantInfo.push({
            type: 'policies',
            content: knowledgeBase.policies
        });
        relevantInfo.push({
            type: 'packages',
            content: knowledgeBase.packages
        });

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
        message.includes('use my gift')) {

        relevantInfo.push({
            type: 'gift_tickets',
            content: knowledgeBase.gift_tickets
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

    // Ritual related queries
    if (message.includes('ritual') || 
        message.includes('skjol') ||
        message.includes('skjól') ||
        message.includes('without ritual') ||
        message.includes('skip ritual') ||
        message.includes('optional ritual') ||
        message.includes('ritual included') ||
        message.includes('ritual access') ||
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
        // Temperature-related queries
        message.includes('temperature') && (
            message.includes('sauna') ||
            message.includes('steam') ||
            message.includes('mist') ||
            message.includes('plunge')
        )) {
        relevantInfo.push({
            type: 'ritual',
            content: knowledgeBase.ritual
        });
        // Also include packages info since ritual is part of packages
        relevantInfo.push({
            type: 'packages',
            content: knowledgeBase.packages
        });
    }

    // Seasonal information
    if (message.includes('winter') ||
        message.includes('summer') ||
        message.includes('season') ||
        message.includes('weather') ||
        message.includes('temperature') ||
        message.includes('crowd') ||
        message.includes('busy') ||
        message.includes('northern lights') ||
        message.includes('midnight sun') ||
        message.includes('snow') ||
        message.includes('crisp air') ||
        message.includes('starry') ||
        message.includes('star') ||
        message.includes('night sky') ||
        message.includes('sunset') ||
        message.includes('peak season') ||
        message.includes('less crowded') ||
        message.includes('quieter') ||
        message.includes('daylight') ||
        message.includes('evening') ||
        message.includes('late evening') ||
        message.includes('twilight') ||
        message.includes('golden light') ||
        message.includes('infinity edge') ||
        message.includes('view') ||
        message.includes('unpredictable') ||
        message.includes('dress') ||
        message.includes('clothing') ||
        message.includes('hat') ||
        message.includes('head covering') ||
        message.includes('best time') ||
        message.includes('optimal time') ||
        message.includes('june') ||
        message.includes('august') ||
        message.includes('may') ||
        message.includes('time of year') ||
        message.includes('conditions') ||
        message.includes('atmosphere') ||
        message.includes('air temperature') ||
        message.includes('water temperature') ||
        message.includes('warm water') ||
        message.includes('geothermal water') ||
        message.includes('what to expect')) {
        relevantInfo.push({
            type: 'seasonal_information',
            content: knowledgeBase.seasonal_information
        });
    }

    // Policy related queries
    if (message.includes('policy') || 
        message.includes('policies') ||
        message.includes('rule') ||
        message.includes('requirement') ||
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
        message.includes('do you have')) {
        relevantInfo.push({
            type: 'facilities',
            content: knowledgeBase.facilities
        });
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
            content: knowledgeBase.dining
        });
        // Also include facilities info for location context
        relevantInfo.push({
            type: 'facilities',
            content: knowledgeBase.facilities
        });
    }

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
        // Adding website specific terms
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
        
        // Include both location and full transportation info
        relevantInfo.push({
            type: 'location',
            content: knowledgeBase.transportation.location
        });
        relevantInfo.push({
            type: 'transportation',
            content: knowledgeBase.transportation
        });
    }

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
            content: knowledgeBase.multi_pass
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
        message.includes('take home')) {
        
        relevantInfo.push({
            type: 'products',
            content: knowledgeBase.products
        });

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
    }
    return relevantInfo;
};
