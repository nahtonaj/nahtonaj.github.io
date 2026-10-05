/**
 * GymSpot Proof of Concept - Comprehensive Mock Database
 */

export const GYM_DATA = {
  locations: [
    'All Locations',
    'Austin, TX',
    'Denver, CO',
    'Chicago, IL',
    'New York, NY',
    'Miami, FL'
  ],

  filterOptions: {
    vibes: [
      { id: 'hardcore-powerlifting', label: 'Hardcore & Powerlifting', icon: 'fitness_center' },
      { id: 'bodybuilding', label: 'Bodybuilding Mecca', icon: 'sports_gymnastics' },
      { id: 'boutique-wellness', label: 'Boutique & Recovery', icon: 'spa' },
      { id: 'crossfit-functional', label: 'CrossFit & Hyrox', icon: 'sprint' },
      { id: 'commercial-fitness', label: 'Commercial & Casual', icon: 'groups' }
    ],
    equipment: [
      { id: 'deadlift-platforms', label: 'Deadlift Platforms', icon: 'inventory_2' },
      { id: 'calibrated-plates', label: 'Calibrated Kilo Plates', icon: 'album' },
      { id: 'chalk-allowed', label: 'Chalk Allowed & Provided', icon: 'blur_on' },
      { id: 'dumbbells-over-120', label: 'Dumbbells > 120 lbs', icon: 'weight' },
      { id: 'specialty-bars', label: 'Specialty Bars (SSB/Trap)', icon: 'horizontal_rule' },
      { id: 'hammer-strength', label: 'Hammer Strength Iso-Lateral', icon: 'precision_manufacturing' },
      { id: 'turf-sled-strip', label: 'Turf Sprint & Sled Lane', icon: 'straighten' },
      { id: 'eleiko-rogue', label: 'Eleiko & Rogue Official Gear', icon: 'verified' }
    ],
    amenities: [
      { id: 'sauna', label: 'Traditional/Infrared Sauna', icon: 'hot_tub' },
      { id: 'cold-plunge', label: 'Ice Bath & Cold Plunge', icon: 'ac_unit' },
      { id: 'showers', label: 'Private Showers & Towels', icon: 'shower' },
      { id: '24-7-access', label: '24/7 Keycard Access', icon: 'lock_open' },
      { id: 'smoothie-bar', label: 'Smoothie & Shake Bar', icon: 'local_cafe' }
    ],
    training: [
      { id: 'personal-training', label: '1-on-1 Coaching', icon: 'person' },
      { id: 'group-classes', label: 'Group HIIT & Bootcamp', icon: 'diversity_3' },
      { id: 'open-gym', label: 'Full Open Gym Access', icon: 'door_front' },
      { id: 'powerlifting-coaching', label: 'Powerlifting Prep', icon: 'sports_score' }
    ]
  },

  gyms: [
    {
      id: 'apex-strength-denver',
      name: 'Apex Strength & Iron Den',
      tagline: 'Colorado’s premier heavy lifting sanctum. Chalk friendly, competition racks, and zero fluff.',
      city: 'Denver, CO',
      neighborhood: 'RiNo Arts District',
      address: '2840 Walnut St, Denver, CO 80205',
      distanceMiles: 1.4,
      priceLevel: '$$',
      rating: 4.9,
      reviewCount: 194,
      matchPercentage: 98,
      images: [
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=80'
      ],
      badges: ['verified-operator', 'chalk-friendly', 'gear-certified'],
      vibes: ['hardcore-powerlifting', 'bodybuilding'],
      equipment: [
        'deadlift-platforms',
        'calibrated-plates',
        'chalk-allowed',
        'dumbbells-over-120',
        'specialty-bars',
        'hammer-strength',
        'eleiko-rogue'
      ],
      equipmentHighlights: [
        '8 Dedicated Deadlift Platforms',
        'Eleiko Calibrated Competition Discs',
        'Dumbbells up to 160 lbs',
        '4 Monolifts & Safety Squat Bars'
      ],
      amenities: ['showers', '24-7-access', 'smoothie-bar'],
      training: ['personal-training', 'open-gym', 'powerlifting-coaching'],
      dayPassAvailable: true,
      dayPassPrice: 15,
      activeDeal: {
        id: 'deal-apex-1',
        title: '$15 Day Pass (Save 40%)',
        description: 'Instant drop-in pass for traveling lifters. Valid for 24 hours with full platform access.',
        code: 'APEXDROP15',
        discountType: 'percentage',
        expiresAt: '2026-12-31',
        bonusPoints: 50
      },
      vibeMetrics: {
        cleanliness: 4.8,
        equipmentQuality: 5.0,
        crowdLevel: 3.4 // moderate
      },
      openHours: '24/7 Access for Members | Staffed: 7am - 9pm',
      reviews: [
        {
          id: 'r1',
          authorName: 'Marcus Vance',
          authorDiscipline: 'Competitive Powerlifter (USAPL)',
          authorBadges: ['verified-regular', 'powerlifter'],
          overallRating: 5.0,
          subRatings: { cleanliness: 4.8, equipmentQuality: 5.0, cultureVibe: 5.0, crowdLevel: 3.5 },
          comment: 'Best lifting facility in Denver by a mile. 8 platforms means you never have to wait for a squat rack even at 6 PM. Chalk is fully provided and loud music keeps the intensity high.',
          date: '2 weeks ago',
          helpfulCount: 42
        },
        {
          id: 'r2',
          authorName: 'Elena Rostova',
          authorDiscipline: 'Bodybuilder',
          authorBadges: ['verified-regular'],
          overallRating: 4.8,
          subRatings: { cleanliness: 4.9, equipmentQuality: 5.0, cultureVibe: 4.8, crowdLevel: 3.0 },
          comment: 'Unbelievable selection of Prime and Hammer Strength machines. Dumbbells go all the way up to 160 lbs. Clean locker rooms and ice-cold water refilling stations.',
          date: '1 month ago',
          helpfulCount: 19
        }
      ]
    },
    {
      id: 'kinetix-athletic-austin',
      name: 'Kinetix Athletic Club',
      tagline: 'Modern high-performance club merging functional strength training with state-of-the-art contrast recovery.',
      city: 'Austin, TX',
      neighborhood: 'South Congress',
      address: '1410 S Congress Ave, Austin, TX 78704',
      distanceMiles: 0.8,
      priceLevel: '$$$',
      rating: 4.8,
      reviewCount: 320,
      matchPercentage: 92,
      images: [
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80'
      ],
      badges: ['verified-operator', 'gear-certified'],
      vibes: ['boutique-wellness', 'crossfit-functional'],
      equipment: [
        'deadlift-platforms',
        'turf-sled-strip',
        'chalk-allowed',
        'eleiko-rogue'
      ],
      equipmentHighlights: [
        '40-Yard Indoor Sprint Turf Lane',
        'Rogue Monster Lite Rigs',
        'Infrared Saunas & Cedar Wood Saunas',
        '3 Commercial Cold Plunge Tubs (42°F)'
      ],
      amenities: ['sauna', 'cold-plunge', 'showers', 'smoothie-bar'],
      training: ['group-classes', 'personal-training', 'open-gym'],
      dayPassAvailable: true,
      dayPassPrice: 25,
      activeDeal: {
        id: 'deal-kinetix-1',
        title: 'Free 1-Day Guest Pass + Recovery',
        description: 'Full facility access including high-intensity group classes and unlimited contrast therapy sauna & cold plunge.',
        code: 'ATXRECOVER',
        discountType: 'free-pass',
        expiresAt: '2026-11-15',
        bonusPoints: 75
      },
      vibeMetrics: {
        cleanliness: 4.9,
        equipmentQuality: 4.8,
        crowdLevel: 4.1 // spacious
      },
      openHours: 'Mon-Fri: 5:30am - 10pm | Sat-Sun: 7am - 8pm',
      reviews: [
        {
          id: 'r3',
          authorName: 'Sarah Jenkins',
          authorDiscipline: 'Hyrox Athlete & Runner',
          authorBadges: ['verified-regular'],
          overallRating: 5.0,
          subRatings: { cleanliness: 5.0, equipmentQuality: 4.8, cultureVibe: 4.9, crowdLevel: 4.2 },
          comment: 'The contrast therapy section alone is worth the membership. The cold plunge sits at a crisp 42°F and the turf track makes sled pushes feel amazing. Super friendly coaching staff.',
          date: '3 days ago',
          helpfulCount: 31
        }
      ]
    },
    {
      id: 'foundry-strength-chicago',
      name: 'Foundry Strength & Barbell',
      tagline: 'West Loop’s underground iron den. Specializing in powerlifting, strongman, and heavy barbell athletics.',
      city: 'Chicago, IL',
      neighborhood: 'Fulton Market',
      address: '1120 W Randolph St, Chicago, IL 60607',
      distanceMiles: 2.1,
      priceLevel: '$$',
      rating: 4.9,
      reviewCount: 184,
      matchPercentage: 96,
      images: [
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1200&q=80'
      ],
      badges: ['verified-operator', 'chalk-friendly'],
      vibes: ['hardcore-powerlifting', 'bodybuilding'],
      equipment: [
        'deadlift-platforms',
        'calibrated-plates',
        'chalk-allowed',
        'dumbbells-over-120',
        'specialty-bars',
        'hammer-strength'
      ],
      equipmentHighlights: [
        '10 Competition Squat Racks',
        'TSS & Ghost Combo Benches',
        'Texas Power Bars & Kabuki Duffalo Bars',
        'Atlas Stones & Yokes'
      ],
      amenities: ['showers', '24-7-access'],
      training: ['powerlifting-coaching', 'open-gym'],
      dayPassAvailable: true,
      dayPassPrice: 20,
      activeDeal: {
        id: 'deal-foundry-1',
        title: 'Exclusive $10 Day Pass (50% Off)',
        description: 'Drop in for heavy training. Includes free chalk station access and locker usage.',
        code: 'FOUNDRY10',
        discountType: 'percentage',
        expiresAt: '2026-10-31',
        bonusPoints: 50
      },
      vibeMetrics: {
        cleanliness: 4.7,
        equipmentQuality: 5.0,
        crowdLevel: 3.2
      },
      openHours: '24/7 Keycard Member Access',
      reviews: [
        {
          id: 'r4',
          authorName: 'David Kowalski',
          authorDiscipline: 'Powerlifter',
          authorBadges: ['powerlifter', 'verified-regular'],
          overallRating: 5.0,
          subRatings: { cleanliness: 4.7, equipmentQuality: 5.0, cultureVibe: 5.0, crowdLevel: 3.5 },
          comment: 'If you want to squat 500+ without anyone looking at you weird or telling you to stop using chalk, this is your home. Amazing community of lifters who will spot you without hesitating.',
          date: '5 days ago',
          helpfulCount: 28
        }
      ]
    },
    {
      id: 'solstice-wellness-nyc',
      name: 'Solstice Sanctuary & Club',
      tagline: 'High-end athletic performance club with private thermal suites, eucalyptus steam, and curated group conditioning.',
      city: 'New York, NY',
      neighborhood: 'SoHo',
      address: '452 Broadway, New York, NY 10013',
      distanceMiles: 1.1,
      priceLevel: '$$$$',
      rating: 4.7,
      reviewCount: 412,
      matchPercentage: 86,
      images: [
        'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=80'
      ],
      badges: ['verified-operator'],
      vibes: ['boutique-wellness'],
      equipment: [
        'turf-sled-strip',
        'eleiko-rogue'
      ],
      equipmentHighlights: [
        'Custom Woodway Curve Treadmills',
        'Technogym Biostrength Circuit',
        'Eucalyptus Steam Rooms',
        'Cold-Pressed Juice Lounge'
      ],
      amenities: ['sauna', 'cold-plunge', 'showers', 'smoothie-bar'],
      training: ['personal-training', 'group-classes'],
      dayPassAvailable: true,
      dayPassPrice: 45,
      activeDeal: {
        id: 'deal-solstice-1',
        title: '30% Off First Personal Training Session',
        description: 'Comprehensive 75-minute movement screen and strength baseline assessment with Tier 3 coach.',
        code: 'SOHOFIRST30',
        discountType: 'percentage',
        expiresAt: '2026-12-15',
        bonusPoints: 60
      },
      vibeMetrics: {
        cleanliness: 5.0,
        equipmentQuality: 4.7,
        crowdLevel: 4.5 // very uncrowded
      },
      openHours: 'Mon-Sun: 5:00am - 11:00pm',
      reviews: [
        {
          id: 'r5',
          authorName: 'Chloe Bennett',
          authorDiscipline: 'Pilates & Strength',
          authorBadges: ['verified-regular'],
          overallRating: 4.7,
          subRatings: { cleanliness: 5.0, equipmentQuality: 4.6, cultureVibe: 4.8, crowdLevel: 4.7 },
          comment: 'Spa-quality locker rooms, Malin+Goetz products, pristine machines, and never crowded. Expensive, but worth every penny for peace of mind.',
          date: '1 week ago',
          helpfulCount: 15
        }
      ]
    },
    {
      id: 'iron-mile-crossfit-denver',
      name: 'Iron Mile Functional & Hyrox',
      tagline: 'Mile High City’s premier functional fitness box. Concept2 ergs, 60-foot pull-up rig, and dedicated open gym hours.',
      city: 'Denver, CO',
      neighborhood: 'LoHi',
      address: '2115 15th St, Denver, CO 80202',
      distanceMiles: 2.7,
      priceLevel: '$$',
      rating: 4.8,
      reviewCount: 145,
      matchPercentage: 91,
      images: [
        'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80'
      ],
      badges: ['verified-operator', 'chalk-friendly'],
      vibes: ['crossfit-functional'],
      equipment: [
        'deadlift-platforms',
        'chalk-allowed',
        'turf-sled-strip',
        'eleiko-rogue'
      ],
      equipmentHighlights: [
        '12 Concept2 Rowers, BikeErgs & SkiErgs',
        '60-ft Custom Rogue Rig',
        'Heavy Sandbags up to 250 lbs',
        'Dual Roll-Up Bay Doors for Outdoor Runs'
      ],
      amenities: ['showers'],
      training: ['group-classes', 'open-gym', 'personal-training'],
      dayPassAvailable: true,
      dayPassPrice: 20,
      activeDeal: {
        id: 'deal-ironmile-1',
        title: 'Free First WOD / Hyrox Class',
        description: 'Join any morning or evening coached group session for free.',
        code: 'DENVERWOD',
        discountType: 'free-pass',
        expiresAt: '2026-11-30',
        bonusPoints: 40
      },
      vibeMetrics: {
        cleanliness: 4.6,
        equipmentQuality: 4.9,
        crowdLevel: 3.6
      },
      openHours: '5:00am - 8:30pm Coached Blocks | Open Gym All Day',
      reviews: [
        {
          id: 'r6',
          authorName: 'Tyler Briggs',
          authorDiscipline: 'CrossFit Athlete',
          authorBadges: ['coach', 'verified-regular'],
          overallRating: 5.0,
          subRatings: { cleanliness: 4.7, equipmentQuality: 5.0, cultureVibe: 5.0, crowdLevel: 3.8 },
          comment: 'Coaches are certified and really watch your Olympic lifting form. Great vibe, everyone cheers each other on during conditioning workouts.',
          date: '3 weeks ago',
          helpfulCount: 22
        }
      ]
    },
    {
      id: 'the-barbell-foundry-austin',
      name: 'The Barbell Foundry 24/7',
      tagline: 'Self-serve 24/7 powerlifting and bodybuilding facility. Uncapped chalk, competition calibrated plates, and key fob entry.',
      city: 'Austin, TX',
      neighborhood: 'North Loop',
      address: '5310 Burnet Rd, Austin, TX 78756',
      distanceMiles: 3.4,
      priceLevel: '$',
      rating: 4.9,
      reviewCount: 210,
      matchPercentage: 97,
      images: [
        'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80'
      ],
      badges: ['verified-operator', 'chalk-friendly', 'gear-certified'],
      vibes: ['hardcore-powerlifting', 'bodybuilding'],
      equipment: [
        'deadlift-platforms',
        'calibrated-plates',
        'chalk-allowed',
        'dumbbells-over-120',
        'specialty-bars',
        'hammer-strength'
      ],
      equipmentHighlights: [
        '6 Competition Squat & Bench Combos',
        'Calibrated Steel Plates (IPF spec)',
        'Dumbbells up to 150 lbs',
        'Chalk bowls at every station'
      ],
      amenities: ['24-7-access', 'showers'],
      training: ['open-gym', 'powerlifting-coaching'],
      dayPassAvailable: true,
      dayPassPrice: 12,
      activeDeal: {
        id: 'deal-atxbarbell-1',
        title: '$12 Day Pass (Keyless Digital Access)',
        description: 'Get instant door code access via the GymSpot app for 24 hours of training.',
        code: 'ATXIRON12',
        discountType: 'percentage',
        expiresAt: '2026-12-31',
        bonusPoints: 50
      },
      vibeMetrics: {
        cleanliness: 4.7,
        equipmentQuality: 5.0,
        crowdLevel: 3.8
      },
      openHours: '24 Hours / 365 Days Keyless Access',
      reviews: [
        {
          id: 'r7',
          authorName: 'Samira Patel',
          authorDiscipline: 'Powerlifter',
          authorBadges: ['verified-regular', 'powerlifter'],
          overallRating: 5.0,
          subRatings: { cleanliness: 4.8, equipmentQuality: 5.0, cultureVibe: 4.9, crowdLevel: 4.0 },
          comment: 'Best 24/7 gym in Austin. Can go in at 11 PM or 4 AM and train heavy with calibrated steel plates without any crowds.',
          date: '1 month ago',
          helpfulCount: 36
        }
      ]
    },
    {
      id: 'miami-iron-beach',
      name: 'South Beach Iron & Barbells',
      tagline: 'Iconic indoor-outdoor fitness destination in Miami Beach. Old-school iron bodybuilding meets ocean breeze.',
      city: 'Miami, FL',
      neighborhood: 'South Beach',
      address: '740 Collins Ave, Miami Beach, FL 33139',
      distanceMiles: 0.5,
      priceLevel: '$$',
      rating: 4.8,
      reviewCount: 260,
      matchPercentage: 90,
      images: [
        'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80'
      ],
      badges: ['verified-operator', 'gear-certified'],
      vibes: ['bodybuilding', 'commercial-fitness'],
      equipment: [
        'hammer-strength',
        'dumbbells-over-120',
        'deadlift-platforms',
        'chalk-allowed'
      ],
      equipmentHighlights: [
        'Outdoor Heavy Barbell Pavilion',
        'Arsenal Strength Plate Loaded Gear',
        'Dumbbells up to 140 lbs',
        'Dedicated Posing Room with Contest Lighting'
      ],
      amenities: ['showers', 'smoothie-bar'],
      training: ['personal-training', 'open-gym'],
      dayPassAvailable: true,
      dayPassPrice: 20,
      activeDeal: {
        id: 'deal-miami-1',
        title: '$15 Drop-In Pass + Free Protein Shake',
        description: 'Drop-in for visitors and lifters. Includes post-workout shake at the beachfront juice bar.',
        code: 'SOBEIRON',
        discountType: 'percentage',
        expiresAt: '2026-11-20',
        bonusPoints: 50
      },
      vibeMetrics: {
        cleanliness: 4.7,
        equipmentQuality: 4.9,
        crowdLevel: 3.1
      },
      openHours: 'Mon-Sat: 6am - 11pm | Sun: 7am - 9pm',
      reviews: [
        {
          id: 'r8',
          authorName: 'Alex Rivera',
          authorDiscipline: 'Classic Physique Competitor',
          authorBadges: ['verified-regular'],
          overallRating: 5.0,
          subRatings: { cleanliness: 4.6, equipmentQuality: 5.0, cultureVibe: 4.9, crowdLevel: 3.2 },
          comment: 'The energy here is infectious. Golden-era bodybuilding vibe with modern plate-loaded machines. Plus training outside under the palms is unmatched.',
          date: '2 weeks ago',
          helpfulCount: 27
        }
      ]
    }
  ],

  // Community & Gym Buddy Profiles
  gymBuddies: [
    {
      id: 'buddy-1',
      name: 'Jordan Miller',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      discipline: 'Powerlifting / Heavy Squats',
      homeGymId: 'apex-strength-denver',
      homeGymName: 'Apex Strength & Iron Den',
      city: 'Denver, CO',
      preferredTimes: 'Mon / Wed / Fri at 6:30 AM',
      goals: 'Working towards a 500 lb deadlift. Need a consistent spotter on heavy bench days.',
      lookingFor: 'Spotter & Heavy Lifter',
      experience: '4 years lifting'
    },
    {
      id: 'buddy-2',
      name: 'Maya Lin',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      discipline: 'Hyrox & Contrast Recovery',
      homeGymId: 'kinetix-athletic-austin',
      homeGymName: 'Kinetix Athletic Club',
      city: 'Austin, TX',
      preferredTimes: 'Tue / Thu at 6:00 PM + Sat mornings',
      goals: 'Training for Hyrox Austin pairs division. Love sled pushes and sauna sessions.',
      lookingFor: 'Hyrox Partner',
      experience: '2 years functional fitness'
    },
    {
      id: 'buddy-3',
      name: 'Carlos Ruiz',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      discipline: 'Classic Bodybuilding',
      homeGymId: 'foundry-strength-chicago',
      homeGymName: 'Foundry Strength & Barbell',
      city: 'Chicago, IL',
      preferredTimes: 'Weekdays 5:30 PM',
      goals: 'Push-Pull-Legs split. Looking for someone serious about tracking progressive overload.',
      lookingFor: 'Accountability Partner',
      experience: '5 years bodybuilding'
    }
  ],

  // Iron Passport Achievements (Untappd-style)
  passportAchievements: [
    {
      id: 'nomad',
      title: 'Iron Nomad',
      description: 'Train at 5 different independent gyms across 3 cities.',
      icon: 'flight_takeoff',
      unlocked: true,
      progress: '3 / 5 Gyms Visited'
    },
    {
      id: 'chalk',
      title: 'Chalk & Chains',
      description: 'Review 3 verified powerlifting facilities with calibrated steel plates.',
      icon: 'blur_on',
      unlocked: true,
      progress: 'Unlocked (Gold Badge)'
    },
    {
      id: 'dawn',
      title: 'Dawn Patrol',
      description: 'Check in for a workout before 6:30 AM.',
      icon: 'wb_sunny',
      unlocked: true,
      progress: 'Unlocked'
    },
    {
      id: 'recovery',
      title: 'Contrast Therapy Purist',
      description: 'Log recovery sessions at 5 gyms featuring saunas and cold plunges.',
      icon: 'ac_unit',
      unlocked: false,
      progress: '2 / 5 Gyms'
    }
  ]
};
export default GYM_DATA;
