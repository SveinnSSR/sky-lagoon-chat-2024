// knowledgeBase.js
export const knowledgeBase = {
    opening_hours: {
        regular: {
            summer: {
                period: "June 1 - September 30",
                hours: "9:00 - 23:00",
                daily: true
            },
            autumn: {
                period: "October 1 - October 31",
                hours: "10:00 - 23:00",
                daily: true
            },
            winter: {
                period: "November 1 - May 31",
                weekday: {
                    days: "Monday - Friday",
                    hours: "11:00 - 22:00"
                },
                weekend: {
                    days: "Saturday - Sunday",
                    hours: "10:00 - 22:00"
                }
            }
        },
        holidays: {
            christmas_eve: {
                date: "December 24",
                hours: "9:00 - 16:00"
            },
            christmas_day: {
                date: "December 25",
                hours: "9:00 - 18:00"
            },
            new_years_eve: {
                date: "December 31",
                hours: "9:00 - 22:00"
            },
            new_years_day: {
                date: "January 1",
                hours: "10:00 - 22:00"
            }
        },
        additional_info: "The Lagoon area closes 30 minutes before advertised closing. The Skjól Ritual and Gelmir Bar close an hour before."
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
        options: {
            ser_gift: {
                name: "Sér Gift Ticket",
                description: "Our premium package including lagoon access, the Skjól ritual and private changing facilities",
                price: "From ISK 14,990",
                includes: [
                    "Lagoon access",
                    "Skjól ritual access",
                    "Private changing facilities"
                ]
            },
            saman_gift: {
                name: "Saman Gift Ticket",
                description: "Our classic and most popular package including lagoon access and a journey through the traditional bathing culture with the Skjól ritual",
                price: "From ISK 11,990",
                includes: [
                    "Lagoon access",
                    "Skjól ritual access",
                    "Public changing facilities"
                ]
            },
            for_two_gift: {
                name: "Sky Lagoon for Two Gift Ticket",
                description: "Give the gift of relaxation shared together",
                options: {
                    saman_for_two: {
                        name: "Saman for Two",
                        price: "From ISK 33,480",
                        includes: [
                            "Two Saman Passes",
                            "Public changing facilities",
                            "Access to our signature Skjól ritual",
                            "One drink per guest at our Gelmir lagoon bar",
                            "Sky Platter from Smakk Bar"
                        ]
                    },
                    ser_for_two: {
                        name: "Sér for Two",
                        price: "From ISK 39,480",
                        includes: [
                            "Two Sér Passes",
                            "Private changing facilities",
                            "Access to our signature Skjól ritual",
                            "One drink per guest at our Gelmir lagoon bar",
                            "Sky Platter from Smakk Bar"
                        ]
                    }
                },
                important_note: "The Sky Lagoon for Two gift ticket comes in two gift tickets that must be used together when booking the experience. The two tickets can not be used separately."
            },
            multi_pass_gift: {
                name: "Multi-Pass Gift Ticket",
                description: "Share the joys of regular visits to Sky Lagoon",
                options: {
                    hefd: {
                        name: "Hefð Multi-Pass",
                        description: "Six premium Sér experiences",
                        price: "44,970 ISK"
                    },
                    venja: {
                        name: "Venja Multi-Pass",
                        description: "Six classic Saman experiences",
                        price: "35,970 ISK"
                    }
                },
                note: "Valid for 4 years from purchase date"
            }
        },
        redemption: {
            steps: [
                "Book your time in advance",
                "Enter gift ticket code in Order Details during checkout",
                "Receive new ticket via email for selected date and time"
            ],
            note: "It's essential to schedule your visit beforehand"
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
        status: {
            included: true,
            mandatory: true,
            packages: [
                "Included in Saman Package",
                "Included in Sér Package"
            ],
            booking: "Cannot be booked separately or excluded from packages"
        },
        description: {
            name: "Skjól Ritual",
            type: "Signature seven-step ritual",
            location: "Dedicated ritual area within Sky Lagoon",
            experience: "Essential part of the Sky Lagoon journey"
        },
        details: {
            steps: [
                "Lagoon",
                "Cold plunge",
                "Sauna",
                "Cold fog-mist",
                "Sky Body Scrub",
                "Steam",
                "Shower"
            ],
            features: [
                "Guided experience",
                "Natural products",
                "Traditional Icelandic elements",
                "Wellness-focused journey"
            ]
        },
        important_notes: [
            "Essential part of Sky Lagoon experience",
            "Cannot be excluded from visit",
            "Included in all admission packages",
            "No separate booking option available"
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
            verification: "Valid ID may be requested",
            rationale: {
                reasons: [
                    "Experience designed for adult relaxation",
                    "Alcohol service in lagoon",
                    "Optimal guest experience"
                ]
            }
        },
        cancellation: {
            individual: {
                notice: "24 hours",
                group_size: "1-9 guests",
                refund: "Full refund available with proper notice"
            },
            groups: {
                small: {
                    notice: "72 hours",
                    size: "11-25 guests"
                },
                medium: {
                    notice: "96 hours",
                    size: "26-50 guests"
                },
                large: {
                    notice: "2 weeks",
                    size: "51-100 guests"
                },
                extra_large: {
                    notice: "12 weeks",
                    size: "101+ guests"
                }
            },
            how_to_cancel: {
                email: "reservations@skylagoon.is",
                required_info: ["Booking reference number", "Preferred action (refund/date change)"]
            }
        },
        health_safety: {
            medical_conditions: {
                consultation: "Physician consultation recommended for underlying conditions",
                high_risk_conditions: [
                    "Cardiovascular disease",
                    "High or low blood pressure",
                    "Recent surgery",
                    "Serious medical conditions"
                ],
                safety_measures: {
                    wristbands: {
                        available: "High-visibility wristbands for guests needing extra attention",
                        process: "Request at reception",
                        team_member_notification: "Safety personnel notified"
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
                recommendations: "Each person responsible for own health assessment"
            },
            allergies: {
                ritual_products: {
                    ingredients: [
                        "Almond oil",
                        "Sesame seed oil"
                    ],
                    alternatives: "Skip scrub step if allergic",
                    notification: "Inform team members of allergies"
                },
                food_allergies: {
                    protocol: "Alert our dining team members",
                    information: "Ingredient lists available",
                    alternatives: "Various options available"
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
                bar_options: {  // New section to clarify hydration vs bar service
                    location: "Gelmir lagoon bar in the lagoon",
                    options: [
                        "Various non-alcoholic beverages",
                        "Refreshing drinks",
                        "Alcoholic beverages (maximum three per guest)"
                    ],
                    payment: "Cashless wristband system"
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
                cancellations: "Website automatically updates if spots become available due to cancellations"
            }
        },
        photography: {
            rules: [
                "Permission required from Sky Lagoon team",
                "Private use only",
                "No commercial use",
                "Respect other guests' privacy",
                "No photography in changing rooms"
            ]
        }
    },

    facilities: {
        amenities: {
            included: [
                "Towels (free of charge)",
                "Changing rooms",
                "Lockers",
                "Water fountains",
                "In-water Gelmir Bar",
                "Keimur Café",
                "Smakk Bar"
            ],
            changing_facilities: {
                public: {
                    features: [
                        "Shower facilities",
                        "Hair dryers",
                        "Basic amenities",
                        "Secure lockers"
                    ]
                },
                private: {
                    features: [
                        "Individual changing space",
                        "Premium amenities",
                        "Sky Lagoon skincare products",
                        "Enhanced privacy"
                    ]
                }
            },
            rentals: {
                swimsuit: {
                    available: true,
                    price: "1,500 ISK",
                    options: ["Various sizes available", "Clean and sanitized"]
                },
                luggage_storage: {
                    available: true,
                    price: "990 ISK",
                    location: "Reception area"
                }
            }
        },
        accessibility: {
            features: [
                "Wheelchair accessible entrances",
                "Accessible changing rooms",
                "Chairlift for lagoon entry/exit",
                "Trained team member assistance available"
            ],
            additional_services: {
                team_member_assistance: "Available upon request",
                private_spaces: "Available for those needing extra assistance",
                equipment: "Modern accessibility equipment"
            }
        },
        changing_rooms: {
            saman_package: {
                type: "Public facilities",
                gender_separation: {
                    layout: "Separate facilities for men and women",
                    features: [ 
                        "Gender-specific shower and locker areas",
                        "Full privacy within gender-designated spaces",
                        "Complete amenities in each changing area"
                    ]
                }
            },
            ser_package: {
                type: "Private facilities",
                features: [
                    "Individual private changing suites",
                    "Personal shower and changing space",
                    "Accommodates up to two people per suite",
                    "Gender-neutral private facilities",
                    "Enhanced privacy and comfort"
                ],
                gender_inclusive: {
                    features: [
                        "Gender-neutral private suites",
                        "Individual changing and shower space",
                        "Complete privacy for all guests",
                        "Suitable for guests of any gender identity"
                    ],
                    accommodation: "Guests who prefer gender-neutral facilities can request Sér package upgrade at check-in without additional cost"
                }
            },
            general_amenities: [
                "Lockers",
                "Showers",
                "Essential amenities"
            ]
        },
        lagoon: {
            specifications: {
                temperature: {
                    regular: "38-40°C (100-104°F)",
                    notes: "Temperature may vary slightly based on weather conditions",
                    comfort_level: "Maintained at optimal therapeutic temperature"
                },
                depth: {
                    maximum: "120 centimeters (47 inches)",
                    variations: "Multiple depth zones throughout",
                    accessibility: "Most guests can stand comfortably",
                    features: [
                        "Gentle slopes between depth zones",
                        "Clear depth indicators around lagoon",
                        "Non-slip surfaces"
                    ]
                },
                capacity: {
                    managed: "Capacity-controlled booking system",
                    comfort: "Spacious design for optimal guest experience"
                },
                water: {
                    type: "Geothermal water",
                    benefits: [
                        "Natural minerals",
                        "Therapeutic properties",
                        "Constantly renewed"
                    ],
                    temperature: "Maintained at 38-40°C year-round for optimal comfort"                    
                }
            },
            rules: {
                photography: {
                    allowed: true,
                    restrictions: [
                        "Subject to team member approval",
                        "Private use only",
                        "No commercial photography",
                        "Must respect other guests' privacy",
                        "Prohibited in changing rooms and showers"
                    ],
                    device_protection: {
                        available: true,
                        type: "Waterproof phone cases",
                        price: "2,500 ISK",
                        purchase_locations: [
                            "Reception desk",
                            "In-water bar"
                        ]
                    }
                },
                swimming: {
                    ocean_access: {
                        allowed: false,
                        reason: "Safety regulations",
                        requirements: [
                            "Stay within designated areas",
                            "Follow team member instructions",
                            "Comply with safety guidelines"
                        ]
                    },
                    general_rules: [
                        "No diving",
                        "No running",
                        "Shower before entering",
                        "Follow team member instructions"
                    ]
                },
                time_limits: {
                    duration: {
                        restriction: "No specific time limit",
                        recommended: "1.5 to 3 hours",
                        check_in: "Arrival within 30 minutes of booked time"
                    },
                    facility_closing: {
                        lagoon: "30 minutes before facility closing",
                        ritual: "1 hour before facility closing",
                        bar: "1 hour before facility closing"
                    }
                }
            },
            features: {
                infinity_edge: {
                    description: "Panoramic ocean views",
                    location: "Main viewing area",
                    experience: "Seamless horizon integration"
                },
                relaxation_areas: {
                    types: [
                        "Built-in benches",
                        "Calm zones",
                        "Viewing platforms"
                    ],
                    features: "Multiple temperatures and depths"
                },
                lighting: {
                    daytime: "Natural illumination",
                    evening: "Ambient lighting system",
                    seasonal: "Adapted to Iceland's daylight variations"
                }
            }
        }
    },

    transportation: {
        location: {
            address: "Vesturvör 44, 200 Kópavogur",
            distance: "7 kilometers from central Reykjavík",
            drive_time: "13-15 minutes",
            landmarks: {
                from_perlan: "9 minutes",
                from_hallgrimskirkja: "12 minutes",
                from_harpa: "14 minutes",
                from_bsi: "9 minutes"
            }
        },
        shuttle_service: {
            provider: "Reykjavík Excursions",
            bsi_service: {
                departure_point: "BSÍ bus terminal",
                timing: "Bus departs BSÍ on the hour of your booking",
                direction: "Direct service to Sky Lagoon"
            },
            hotel_pickup: {
                available: true,
                timing: "Starts 30 minutes before your selected time",
                important_notes: [
                    "Be ready and visible at designated bus stop or outside hotel",
                    "Call +354 580 5400 if pickup hasn't arrived 20 minutes after start time",
                    "If pickup is missed, must reach BSÍ at own cost before departure time"
                ],
                restrictions: "Drop-off may be limited due to street closures and city centre bus restrictions"
            },
            return_service: {
                departure_point: "Sky Lagoon",
                destination: "BSÍ bus terminal",
                times: ["14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:30", "21:30"]
            },
            booking: {
                options: [
                    "Book with Sky Lagoon ticket purchase",
                    "Book separately through www.re.is"
                ]
            }
        },
        public_transport: {
            bus_route: {
                first_leg: {
                    bus: "Take bus #4 to Hamraborg",
                    duration: "15 minutes",
                    from: "Hlemmur square"
                },
                second_leg: {
                    bus: "Transfer to bus #35",
                    stop: "Exit at Hafnarbraut",
                    duration: "4 minutes"
                },
                final_leg: "Short walk along ocean to Sky Lagoon",
                schedule: "Visit straeto.is for current timings"
            }
        },
        parking: {
            available: true,
            cost: "Free",
            time_limit: "No time limit",
            features: ["Electric car charging stations", "Well-lit", "Monitored", "Easy access to facility entrance"],
            accessibility: {
                disabled_spaces: true,
                location: "Near main entrance"
            }
        },
        airport_transfer: {
            distance: "45 minutes from Keflavík International Airport",
            options: [
                "Flybus to BSÍ then shuttle to Sky Lagoon",
                "Taxi services",
                "Private car rental",
                "Private transfer services"
            ]
        }
    },

    group_bookings: {
        overview: {
            description: "Wellness, together - experience Sky Lagoon as a group",
            minimum_size: 10,
            tagline: "Recharge, reconnect and be inspired where the sea meets the sky",
            contact: {
                email: "reservations@skylagoon.is",
                response_time: "Within 24 hours"
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
                minimum_notice: "Based on group size, from 72 hours to 12 weeks"
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
                "Our signature Skjól ritual",
                "Changing facilities",
                "Towels included",
                "Access to our in-water Gelmir Bar"
            ],
            optional_additions: [
                "Private changing areas (subject to availability)",
                "Food and beverage packages",
                "Transportation arrangements",
                "Extended visit duration"
            ]
        },
        ideal_for: [
            "Corporate events",
            "Team building",
            "Special celebrations",
            "Tour groups",
            "Wellness retreats"
        ]
    },

    multi_pass: {
        overview: {
            description: "A wellness program offering six visits to Sky Lagoon",
            validity: "Valid for 4 years from purchase date",
            restrictions: [
                "Valid for one visitor only",
                "Cannot be used for groups",
                "Non-transferable between guests",
                "Same code used for all six visits"
            ]
        },
        types: {
            hefd: {
                name: "Hefð Multi-Pass",
                type: "Premium package",
                price: "44,970 ISK",
                visits: 6,
                includes: [
                    "Six Sér package visits",
                    "Sky Lagoon admission",
                    "Skjól ritual access",
                    "Private changing facilities"
                ],
                features: "Premium experience with private facilities"
            },
            venja: {
                name: "Venja Multi-Pass",
                type: "Classic package",
                price: "35,970 ISK",
                visits: 6,
                includes: [
                    "Six Saman package visits",
                    "Sky Lagoon admission",
                    "Skjól ritual access",
                    "Public changing facilities"
                ],
                features: "Classic experience with standard facilities"
            }
        },
        redemption: {
            process: [
                "Plan visit by choosing date and time",
                "Enter Multi-Pass code during booking",
                "Receive confirmation email with ticket",
                "Present ticket and photo ID at check-in"
            ],
            booking_steps: {
                step1: {
                    name: "Plan the Visit",
                    description: "Book your visit in advance by selecting date and time"
                },
                step2: {
                    name: "Complete the Booking",
                    description: "Enter your Multi-Pass code during checkout"
                },
                step3: {
                    name: "Check-in",
                    description: "Present email ticket and photo ID at Sky Lagoon"
                }
            },
            important_notes: [
                "Same code used for all six visits",
                "Advance booking recommended",
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
        message.includes('schedule')) {
        relevantInfo.push({
            type: 'opening_hours',
            content: knowledgeBase.opening_hours
        });
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
        message.includes('gift ticket')) {
        relevantInfo.push({
            type: 'gift_tickets',
            content: knowledgeBase.gift_tickets
        });
    }    

    // Ritual related queries
    if (message.includes('ritual') || 
        message.includes('skjol') ||
        message.includes('skjól') ||
        message.includes('without ritual') ||
        message.includes('skip ritual') ||
        message.includes('optional ritual') ||
        message.includes('ritual included') ||
        message.includes('ritual access')) {
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

    // Health and safety
    if (message.includes('medical') || 
        message.includes('health') ||
        message.includes('sick') ||
        message.includes('condition') ||
        message.includes('pregnant') ||
        message.includes('pregnancy') ||
        message.includes('safe') ||
        message.includes('doctor') ||
        message.includes('wheelchair') ||
        message.includes('disability') ||
        message.includes('accessible') ||
        message.includes('allergy') ||
        message.includes('allergic') ||
        message.includes('emergency') ||
        message.includes('injury') ||
        message.includes('injured') ||
        message.includes('heart') ||
        message.includes('blood pressure') ||
        message.includes('nursing') ||
        message.includes('medical condition') ||
        message.includes('nut') ||
        message.includes('help') ||
        message.includes('water') ||
        message.includes('drink') ||
        message.includes('wellness') ||
        message.includes('therapy') ||
        message.includes('therapeutic') ||
        message.includes('healing') ||
        message.includes('relax') ||
        message.includes('stress') ||
        message.includes('recovery') ||
        message.includes('risk') ||
        message.includes('anxiety') ||
        message.includes('tension') ||
        message.includes('relief')) {            
        relevantInfo.push({
            type: 'safety',
            content: knowledgeBase.policies.health_safety
        });
    }

    // Age and policies
    if (message.includes('age') || 
        message.includes('old') ||
        message.includes('child') ||
        message.includes('children') ||
        message.includes('restriction') ||
        message.includes('policy') ||
        message.includes('son') ||
        message.includes('daughter') ||
        message.includes('kid') ||
        message.includes('young') ||
        message.includes('baby') ||
        message.includes('infant') ||
        message.includes('family')) {
        relevantInfo.push({
            type: 'policies',
            content: knowledgeBase.policies
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
        message.includes('gender identity')) {
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
        message.includes('bsi to') ||
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
        message.includes('near')) {
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
        message.includes('team building') ||
        message.includes('party') ||
        message.includes('celebration') ||
        message.includes('tour group') ||
        message.includes('company') ||
        message.includes('retreat') ||
        message.includes('multiple people') ||
        message.includes('many people')) {
        relevantInfo.push({
            type: 'group_bookings',
            content: knowledgeBase.group_bookings
        });
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
        message.includes('frequent visits')) {
        relevantInfo.push({
            type: 'multi_pass',
            content: knowledgeBase.multi_pass
        });
    }
    return relevantInfo;
};
