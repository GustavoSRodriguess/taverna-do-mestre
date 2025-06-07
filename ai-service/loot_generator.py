import random
import json
import math

# Constants for treasure generation
COIN_TYPES = ["cp", "sp", "gp", "pp"]

# Comprehensive D&D 5e Treasure Generator Data
GEMS_BY_VALUE = {
    "minor": [
        {"value": 10, "examples": ["azurite", "quartz", "obsidian", "agate", "turquoise"]},
        {"value": 50, "examples": ["bloodstone", "carnelian", "jasper", "moonstone", "onyx"]},
        {"value": 100, "examples": ["amber", "amethyst", "chrysoprase", "coral", "jade"]}
    ],
    "medium": [
        {"value": 250, "examples": ["aquamarine", "garnet", "pearl", "spinel", "tourmaline"]},
        {"value": 500, "examples": ["alexandrite", "topaz", "black pearl", "deep blue spinel", "golden pearl"]}
    ],
    "major": [
        {"value": 1000, "examples": ["emerald", "opal", "sapphire", "ruby", "diamond (small)"]},
        {"value": 5000, "examples": ["emerald (large)", "diamond", "jacinth", "ruby (large)", "star sapphire"]}
    ]
}

# Art objects organized by value and rarity
ART_OBJECTS_BY_VALUE = {
    "minor": [
        {"value": 25, "examples": ["Silver ewer", "Carved bone statuette", "Small gold bracelet", "Cloth-of-gold vestments", "Black velvet mask with silver thread", "Copper chalice with silver filigree", "Pair of engraved bone dice", "Small mirror set in a painted wooden frame", "Embroidered silk handkerchief", "Gold locket with a painted portrait inside"]},
        {"value": 75, "examples": ["Ivory statuette", "Large gold bracelet", "Silver necklace with gem pendant", "Bronze crown", "Silk robe with gold embroidery", "Large well-made tapestry", "Brass mug with jade inlay", "Box of turquoise animal figurines", "Gold bird cage with electrum filigree"]}
    ],
    "medium": [
        {"value": 250, "examples": ["Gold ring set with bloodstones", "Carved ivory statuette", "Large gold bracelet", "Silver necklace with a gemstone pendant", "Bronze crown", "Silk robe with gold embroidery", "Large well-made tapestry", "Brass mug with jade inlay", "Box of turquoise animal figurines", "Gold bird cage with electrum filigree"]},
        {"value": 750, "examples": ["Silver chalice set with moonstones", "Silver-plated steel longsword with jet set in hilt", "Carved harp of exotic wood with ivory inlay and zircon gems", "Small gold idol", "Gold dragon comb set with red garnets as eyes", "Bottle stopper cork embossed with gold leaf and set with amethysts", "Ceremonial electrum dagger with a black pearl in the pommel", "Silver and gold brooch", "Obsidian statuette with gold fittings and inlay", "Painted gold war mask"]}
    ],
    "major": [
        {"value": 2500, "examples": ["Fine gold chain set with a fire opal", "Old masterpiece painting", "Embroidered silk and velvet mantle set with numerous moonstones", "Platinum bracelet set with a sapphire", "Embroidered glove set with jewel chips", "Jeweled anklet", "Gold music box", "Gold circlet set with four aquamarines", "Eye patch with mock eye of sapphire and moonstone", "A necklace string of small pink pearls"]},
        {"value": 7500, "examples": ["Jeweled gold crown", "Jeweled platinum ring", "Small gold statuette set with rubies", "Gold cup set with emeralds", "Gold jewelry box with platinum filigree", "Painted gold child's sarcophagus", "Jade game board with solid gold playing pieces", "Bejeweled ivory drinking horn with gold filigree", "Fine gold chain set with fire opals"]},
        {"value": 15000, "examples": ["Gold and platinum crown set with jewels", "Golden throne", "Gold and mithral war mask with diamond eyes", "Platinum and electrum chess set with jeweled playing pieces", "Legendary golden scepter set with diamond and rubies", "Ancient platinum and gold idol with emerald eyes", "Legendary masterpiece painting in jeweled frame", "Ancient dragon scale armor with gold and platinum inlays"]}
    ]
}

# Magic items organized by type and rarity rank
MAGIC_ITEMS_BY_TYPE = {
    "armor": {
        "minor": [
            "Armor of Gleaming", "Cast-off Armor", "Sentinel Shield", "Shield of Expression", 
            "Smoldering Armor", "Adamantine Armor", "Mithral Armor", "Mariner's Armor",
            "Shield +1", "Leather Armor +1", "Hide Armor +1", "Studded Leather +1", 
            "Chain Shirt +1", "Scale Mail +1", "Breastplate +1"
        ],
        "medium": [
            "Armor of Resistance (Acid)", "Armor of Resistance (Cold)", "Armor of Resistance (Fire)",
            "Armor of Resistance (Force)", "Armor of Resistance (Lightning)", "Armor of Resistance (Necrotic)",
            "Armor of Resistance (Poison)", "Armor of Resistance (Psychic)", "Armor of Resistance (Radiant)",
            "Armor of Resistance (Thunder)", "Armor of Vulnerability", "Breastplate of Command",
            "Chain Mail +1", "Breastplate +1", "Splint +1", "Half Plate +1", "Full Plate +1",
            "Shield +2", "Armor +2", "Arrow-Catching Shield", "Animated Shield", "Spellguard Shield",
            "Scale Mail of Psychic Resistance", "Elven Chain", "Glamoured Studded Leather"
        ],
        "major": [
            "Armor +3", "Shield +3", "Plate Armor of Etherealness", "Demon Armor", "Dragon Scale Mail",
            "Dwarven Plate", "Efreeti Chain", "Armor of Invulnerability", "Defender Shield",
            "Plate Armor of Fire Giant Strength", "Chain Mail +2", "Breastplate +2", "Full Plate +2",
            "Plate of the Winter King", "Dragonguard", "Armor of the Stars"
        ]
    },
    "weapons": {
        "minor": [
            "Weapon +1", "Moon-Touched Sword", "Walloping Ammunition", "Unbreakable Arrow",
            "Javelin of Lightning", "Trident of Fish Command", "Wand Sheath", "Veteran's Cane",
            "Longsword +1", "Dagger +1", "Shortbow +1", "Mace +1", "Hand Crossbow +1",
            "Light Hammer +1", "Handaxe +1", "Mace of Smiting", "Warhammer +1", 
            "Greataxe +1", "Flail +1", "Whip +1"
        ],
        "medium": [
            "Weapon +2", "Vicious Weapon", "Weapon of Warning", "Dragon Slayer", "Dagger of Venom",
            "Giant Slayer", "Mace of Terror", "Mace of Disruption", "Scimitar of Speed", "Sun Blade",
            "Flame Tongue", "Dancing Sword", "Luck Blade", "Nine Lives Stealer", "Oathbow", 
            "Longsword +2", "Battleaxe +1", "Warhammer +1", "Greatsword +1", "Dwarven Thrower",
            "Hammer of Thunderbolts"
        ],
        "major": [
            "Weapon +3", "Vorpal Sword", "Sword of Sharpness", "Frost Brand", "Holy Avenger", 
            "Defender", "Blackrazor", "Hazirawn", "Wave", "Whelm", "Sword of Life Stealing", 
            "Sword of Wounding", "Flametongue Spear", "Moonblade", "Sword of Answering",
            "Greatsword +3", "Greataxe +3", "Longbow +3", "Staff of Striking"
        ]
    },
    "potions": {
        "minor": [
            "Potion of Healing", "Potion of Climbing", "Potion of Animal Friendship",
            "Philter of Love", "Oil of Slipperiness", "Elixir of Health", "Potion of Growth",
            "Potion of Diminution", "Potion of Water Breathing", "Potion of Poison",
            "Oil of Etherealness", "Potion of Hill Giant Strength", "Potion of Resistance",
            "Potion of Fire Breath"
        ],
        "medium": [
            "Potion of Greater Healing", "Potion of Fire Giant Strength", "Potion of Stone Giant Strength",
            "Potion of Frost Giant Strength", "Potion of Cloud Giant Strength", "Potion of Clairvoyance",
            "Potion of Gaseous Form", "Potion of Heroism", "Potion of Mind Reading", "Oil of Sharpness",
            "Potion of Longevity", "Potion of Vitality", "Potion of Invulnerability", "Potion of Superior Healing"
        ],
        "major": [
            "Potion of Flying", "Potion of Invisibility", "Potion of Speed", "Potion of Storm Giant Strength",
            "Potion of Supreme Healing", "Oil of Sharpness (supreme)", "Potion of Giant Size",
            "Sovereign Glue", "Universal Solvent"
        ]
    },
    "rings": {
        "minor": [
            "Ring of Swimming", "Ring of Jumping", "Ring of Mind Shielding", "Ring of Warmth",
            "Ring of Water Walking", "Ring of Animal Influence", "Ring of Feather Falling",
            "Ring of Protection +1", "Ring of the Ram", "Ring of Resistance (Acid)",
            "Ring of Resistance (Cold)", "Ring of Resistance (Fire)"
        ],
        "medium": [
            "Ring of Protection", "Ring of Resistance", "Ring of Spell Storing", "Ring of X-ray Vision",
            "Ring of Evasion", "Ring of Free Action", "Ring of Invisibility", "Ring of Regeneration",
            "Ring of Fire Elemental Command", "Ring of Water Elemental Command",
            "Ring of Earth Elemental Command", "Ring of Air Elemental Command",
            "Ring of Protection +2", "Ring of Psionic Energy"
        ],
        "major": [
            "Ring of Telekinesis", "Ring of Regeneration", "Ring of Three Wishes",
            "Ring of Djinni Summoning", "Ring of Shooting Stars", "Ring of Spell Turning",
            "Ring of Mind Shielding (greater)", "Ring of Protection +3", "Ring of Wishes",
            "Ring of Winter", "Ring of Temporal Stasis", "Ring of Seven Stars",
            "Ring of Elemental Command"
        ]
    },
    "rods": {
        "minor": [
            "Rod of the Pact Keeper +1", "Rod of the Serpent", "Immovable Rod",
            "Rod of Rulership", "Rod of the Viper", "Scepter of Charming",
            "Rod of Mercurial Form", "Rod of Retribution", "Rod of Shadows",
            "Rod of Absorption (lesser)"
        ],
        "medium": [
            "Rod of the Pact Keeper +2", "Rod of Alertness", "Rod of Absorption",
            "Rod of the Vonindod", "Rod of Flailing", "Rod of Lordly Might (lesser)",
            "Rod of Tentacles", "Rod of the Wasteland", "Rod of Shadows (greater)",
            "Rod of Withering", "Rod of Rulership"
        ],
        "major": [
            "Rod of Lordly Might", "Rod of Resurrection", "Rod of Security",
            "Rod of the Pact Keeper +3", "Rod of Alertness (greater)", "Rod of Absorption (greater)",
            "Rod of Lordly Might (greater)", "Rod of Invulnerability", "Rod of Necromancy",
            "Rod of the Void"
        ]
    },
    "scrolls": {
        "minor": [
            "Scroll of Protection", "Spell Scroll (Cantrip)", "Spell Scroll (1st Level)",
            "Spell Scroll (2nd Level)", "Spell Scroll (3rd Level)", "Scroll of Magic Missile", 
            "Scroll of Charm Person", "Scroll of Detect Magic", "Scroll of Burning Hands", 
            "Scroll of Comprehend Languages", "Scroll of Cure Wounds", "Scroll of Disguise Self", 
            "Scroll of Identify", "Scroll of Mage Armor", "Scroll of Protection from Evil and Good",
            "Scroll of Shield", "Scroll of Silent Image"
        ],
        "medium": [
            "Spell Scroll (4th Level)", "Spell Scroll (5th Level)", "Scroll of Fireball", 
            "Scroll of Fly", "Scroll of Lightning Bolt", "Scroll of Protection from Energy", 
            "Scroll of Remove Curse", "Scroll of Revivify", "Scroll of Sending", 
            "Scroll of Sleet Storm", "Scroll of Speak with Dead", "Scroll of Dispel Magic", 
            "Scroll of Fear", "Scroll of Glyph of Warding", "Scroll of Haste", 
            "Scroll of Mass Healing Word"
        ],
        "major": [
            "Spell Scroll (6th Level)", "Spell Scroll (7th Level)", "Spell Scroll (8th Level)",
            "Spell Scroll (9th Level)", "Scroll of Power Word Kill", "Scroll of Wish", 
            "Scroll of Time Stop", "Scroll of Gate", "Scroll of Meteor Swarm", 
            "Scroll of Power Word Stun", "Scroll of Resurrection", "Scroll of True Resurrection", 
            "Scroll of Foresight", "Scroll of Storm of Vengeance", "Scroll of Imprisonment", 
            "Scroll of Mass Heal"
        ]
    },
    "staves": {
        "minor": [
            "Staff of the Adder", "Staff of the Python", "Staff of Flowers",
            "Staff of Birdcalls", "Staff of Charming", "Staff of Healing (lesser)",
            "Staff of the Woodlands (lesser)", "Staff of Defense", "Staff of Withering (lesser)",
            "Staff of Illumination"
        ],
        "medium": [
            "Staff of Fire", "Staff of Frost", "Staff of Swarming Insects",
            "Staff of Healing", "Staff of Withering", "Staff of Striking",
            "Staff of Thunder and Lightning", "Staff of Charming (greater)", 
            "Staff of the Woodlands", "Staff of Eyes", "Staff of Understanding"
        ],
        "major": [
            "Staff of Power", "Staff of the Woodlands", "Staff of the Magi",
            "Staff of Fire (greater)", "Staff of Frost (greater)", "Staff of Resurrection",
            "Staff of the Archmage", "Blackstaff", "Staff of the Elements",
            "Staff of the Forgotten One"
        ]
    },
    "wands": {
        "minor": [
            "Wand of Magic Missiles", "Wand of Web", "Wand of Secrets", "Wand of Magic Detection",
            "Wand of the War Mage +1", "Wand of Pyrotechnics", "Wand of Enemy Detection",
            "Wand of Entangle", "Wand of Fear (lesser)", "Wand of Identify", "Wand of Binding (lesser)",
            "Wand of Conducting"
        ],
        "medium": [
            "Wand of Fear", "Wand of Fireballs", "Wand of Lightning Bolts", "Wand of Paralysis",
            "Wand of the War Mage +2", "Wand of Binding", "Wand of Magic Detection (greater)",
            "Wand of Web (greater)", "Wand of Wonder", "Wand of Polymorph (lesser)",
            "Wand of Secrets (greater)", "Wand of Paralysis (lesser)", "Wand of Magic Missiles (greater)"
        ],
        "major": [
            "Wand of Polymorph", "Wand of Wonder", "Wand of the War Mage +3", "Wand of Orcus",
            "Wand of Binding (greater)", "Wand of Fireballs (greater)", "Wand of Lightning Bolts (greater)",
            "Wand of Disintegration", "Wand of Force", "Wand of Winter", "Wand of Wish"
        ]
    },
    "wondrous": {
        "minor": [
            "Alchemy Jug", "Amulet of Proof against Detection and Location", "Bag of Holding",
            "Boots of Elvenkind", "Boots of Striding and Springing", "Bracers of Archery",
            "Brooch of Shielding", "Broom of Flying", "Cap of Water Breathing", "Circlet of Blasting",
            "Cloak of Elvenkind", "Cloak of Protection", "Cloak of the Manta Ray", "Decanter of Endless Water",
            "Deck of Illusions", "Driftglobe", "Dust of Disappearance", "Dust of Dryness",
            "Dust of Sneezing and Choking", "Elemental Gem", "Eversmoking Bottle", "Eyes of Charming",
            "Eyes of Minute Seeing", "Eyes of the Eagle", "Figurine of Wondrous Power (Silver Raven)",
            "Gauntlets of Ogre Power", "Gem of Brightness", "Gloves of Missile Snaring",
            "Gloves of Swimming and Climbing", "Gloves of Thievery", "Goggles of Night", 
            "Hat of Disguise", "Headband of Intellect", "Helm of Comprehending Languages",
            "Helm of Telepathy", "Instrument of the Bards (Doss Lute)", "Keoghtom's Ointment",
            "Lantern of Revealing", "Medallion of Thoughts", "Necklace of Adaptation",
            "Pearl of Power", "Periapt of Health", "Periapt of Wound Closure", "Pipes of Haunting",
            "Pipes of the Sewers", "Quiver of Ehlonna", "Ring of Swimming", "Robe of Useful Items",
            "Rope of Climbing", "Saddle of the Cavalier", "Sending Stones", "Slippers of Spider Climbing",
            "Stone of Good Luck", "Wind Fan", "Winged Boots"
        ],
        "medium": [
            "Apparatus of Kwalish", "Amulet of Health", "Amulet of the Planes", "Bag of Beans",
            "Bead of Force", "Belt of Dwarvenkind", "Belt of Giant Strength (Fire Giant)",
            "Belt of Giant Strength (Frost Giant)", "Belt of Giant Strength (Stone Giant)",
            "Boots of Levitation", "Boots of Speed", "Bracers of Defense", "Cape of the Mountebank",
            "Carpet of Flying", "Cloak of Displacement", "Cloak of the Bat", "Cube of Force",
            "Daern's Instant Fortress", "Dimensional Shackles", "Feather Token",
            "Figurine of Wondrous Power (Bronze Griffon)", "Figurine of Wondrous Power (Ebony Fly)",
            "Figurine of Wondrous Power (Golden Lions)", "Figurine of Wondrous Power (Ivory Goats)",
            "Figurine of Wondrous Power (Marble Elephant)", "Figurine of Wondrous Power (Onyx Dog)",
            "Figurine of Wondrous Power (Serpentine Owl)", "Folding Boat", "Gem of Seeing",
            "Helm of Teleportation", "Horn of Blasting", "Horn of Valhalla (Silver or Brass)",
            "Horseshoes of Speed", "Instant Fortress", "Instrument of the Bards (Canaith Mandolin)",
            "Instrument of the Bards (Cli Lyre)", "Instrument of the Bards (Mac-Fuirmidh Cittern)",
            "Ioun Stone (Awareness)", "Ioun Stone (Protection)", "Ioun Stone (Reserve)",
            "Ioun Stone (Sustenance)", "Iron Bands of Bilarro", "Mantle of Spell Resistance",
            "Manual of Bodily Health", "Manual of Gainful Exercise", "Manual of Golems (Clay)",
            "Manual of Golems (Flesh)", "Manual of Quickness of Action", "Mirror of Life Trapping",
            "Necklace of Fireballs", "Necklace of Prayer Beads", "Periapt of Proof against Poison",
            "Portable Hole", "Robe of Eyes", "Robe of Scintillating Colors", "Robe of Stars",
            "Rope of Entanglement", "Scarab of Protection", "Tome of Clear Thought",
            "Tome of Leadership and Influence", "Tome of Understanding", "Wings of Flying"
        ],
        "major": [
            "Apparatus of Kwalish (greater)", "Belt of Giant Strength (Cloud Giant)",
            "Belt of Giant Strength (Storm Giant)", "Cloak of Invisibility", "Crystal Ball",
            "Cubic Gate", "Deck of Many Things", "Efreeti Bottle", "Helm of Brilliance",
            "Horn of Valhalla (Bronze)", "Horn of Valhalla (Iron)", "Horseshoes of a Zephyr",
            "Instrument of the Bards (Anstruth Harp)", "Instrument of the Bards (Ollamh Harp)",
            "Ioun Stone (Absorption)", "Ioun Stone (Agility)", "Ioun Stone (Fortitude)",
            "Ioun Stone (Insight)", "Ioun Stone (Intellect)", "Ioun Stone (Leadership)",
            "Ioun Stone (Strength)", "Iron Flask", "Manual of Golems (Iron)", "Manual of Golems (Stone)",
            "Marvelous Pigments", "Mirror of Mental Prowess", "Nolzur's Marvelous Pigments",
            "Orb of Dragonkind", "Robe of the Archmagi", "Sphere of Annihilation",
            "Talisman of Pure Good", "Talisman of the Sphere", "Talisman of Ultimate Evil",
            "Well of Many Worlds", "Scarab of Protection", "Candle of Invocation", "Sovereign Glue"
        ]
    }
}

# Psionic items collection
PSIONIC_ITEMS = [
    {"name": "Psycrystal", "rarity": "Uncommon", "type": "Wondrous Item"},
    {"name": "Psionic Tattoo (1st level)", "rarity": "Uncommon", "type": "Tattoo"},
    {"name": "Psionic Tattoo (2nd level)", "rarity": "Uncommon", "type": "Tattoo"},
    {"name": "Psionic Tattoo (3rd level)", "rarity": "Rare", "type": "Tattoo"},
    {"name": "Psionic Tattoo (4th level)", "rarity": "Rare", "type": "Tattoo"},
    {"name": "Psionic Tattoo (5th level)", "rarity": "Very Rare", "type": "Tattoo"},
    {"name": "Crystal Mask of Detection", "rarity": "Uncommon", "type": "Wondrous Item"},
    {"name": "Crystal Mask of Discernment", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Crystal Mask of Dread", "rarity": "Uncommon", "type": "Wondrous Item"},
    {"name": "Crystal Mask of Insight", "rarity": "Uncommon", "type": "Wondrous Item"},
    {"name": "Crystal Mask of Knowledge", "rarity": "Uncommon", "type": "Wondrous Item"},
    {"name": "Crystal Mask of Languages", "rarity": "Uncommon", "type": "Wondrous Item"},
    {"name": "Crystal Mask of Mindarmor", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Crystal Mask of Psionic Craft", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Eyes of Power Leech", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Third Eye Aware", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Third Eye Concentrate", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Third Eye Conceal", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Third Eye Dominate", "rarity": "Very Rare", "type": "Wondrous Item"},
    {"name": "Third Eye Expose", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Third Eye Gather", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Third Eye Powerthieve", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Third Eye Repudiate", "rarity": "Very Rare", "type": "Wondrous Item"},
    {"name": "Third Eye Sense", "rarity": "Uncommon", "type": "Wondrous Item"},
    {"name": "Third Eye View", "rarity": "Uncommon", "type": "Wondrous Item"},
    {"name": "Psychic Crystal", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Psionic Bracers", "rarity": "Uncommon", "type": "Wondrous Item"},
    {"name": "Circlet of Mental Domination", "rarity": "Very Rare", "type": "Wondrous Item"},
    {"name": "Psychoactive Skin of Proteus", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Psychoactive Skin of the Defender", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Psychoactive Skin of Iron", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Mind Blade Gauntlet", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Boots of Temporal Acceleration", "rarity": "Very Rare", "type": "Wondrous Item"},
    {"name": "Ring of Psionic Energy", "rarity": "Rare", "type": "Ring"},
    {"name": "Torc of Power Preservation", "rarity": "Rare", "type": "Wondrous Item"}
]

# Chaositech items collection
CHAOSITECH_ITEMS = [
    {"name": "Chaos Caster", "rarity": "Rare", "type": "Weapon"},
    {"name": "Disruption Ray", "rarity": "Very Rare", "type": "Weapon"},
    {"name": "Entropic Blade", "rarity": "Rare", "type": "Weapon"},
    {"name": "Flesh Graft", "rarity": "Uncommon", "type": "Wondrous Item"},
    {"name": "Implant Armor", "rarity": "Rare", "type": "Armor"},
    {"name": "Living Weapon", "rarity": "Rare", "type": "Weapon"},
    {"name": "Madness Inducer", "rarity": "Very Rare", "type": "Wondrous Item"},
    {"name": "Null Zone Generator", "rarity": "Very Rare", "type": "Wondrous Item"},
    {"name": "Reality Scrambler", "rarity": "Very Rare", "type": "Wondrous Item"},
    {"name": "Void Touch Gauntlet", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Aberrant Symbiote", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Chaotic Infuser", "rarity": "Uncommon", "type": "Wondrous Item"},
    {"name": "Entropy Shield", "rarity": "Rare", "type": "Armor"},
    {"name": "Void Eye Implant", "rarity": "Rare", "type": "Wondrous Item"},
    {"name": "Chaotic Transformation Serum", "rarity": "Very Rare", "type": "Potion"},
    {"name": "Dimensional Destabilizer", "rarity": "Very Rare", "type": "Wondrous Item"},
    {"name": "Warping Blade", "rarity": "Rare", "type": "Weapon"},
    {"name": "Chaos Capacitor", "rarity": "Uncommon", "type": "Wondrous Item"},
    {"name": "Mind-Rending Crown", "rarity": "Very Rare", "type": "Wondrous Item"},
    {"name": "Probablity Distorter", "rarity": "Rare", "type": "Wondrous Item"}
]

# Rarity mapping for sorting purposes
RARITY_VALUES = {
    "Common": 1,
    "Uncommon": 2,
    "Rare": 3,
    "Very Rare": 4,
    "Legendary": 5,
    "Artifact": 6
}

# Map of item categories to their display names
ITEM_CATEGORY_NAMES = {
    "armor": "Armor",
    "weapons": "Weapons",
    "potions": "Potions & Oils",
    "rings": "Rings",
    "rods": "Rods",
    "scrolls": "Scrolls",
    "staves": "Staves",
    "wands": "Wands",
    "wondrous": "Wondrous Items",
    "psionic": "Psionic Items",
    "chaositech": "Chaositech Items"
}

# Function to get items by rarity (for custom table generation)
def get_items_by_rarity(rarity):
    result = []
    for category, items in MAGIC_ITEMS_BY_TYPE.items():
        for rank, item_list in items.items():
            for item in item_list:
                # This assumes each item is a string name
                # For more complex item objects, you would extract the rarity differently
                result.append({"name": item, "type": category, "rank": rank})
    
    # Add psionic and chaositech items of the specified rarity
    for item in PSIONIC_ITEMS:
        if item["rarity"].lower() == rarity.lower():
            result.append({"name": item["name"], "type": "psionic", "rank": get_rank_from_rarity(item["rarity"])})
    
    for item in CHAOSITECH_ITEMS:
        if item["rarity"].lower() == rarity.lower():
            result.append({"name": item["name"], "type": "chaositech", "rank": get_rank_from_rarity(item["rarity"])})
    
    return result

# Helper function to convert rarity to rank
def get_rank_from_rarity(rarity):
    if rarity in ["Common", "Uncommon"]:
        return "minor"
    elif rarity == "Rare":
        return "medium"
    elif rarity in ["Very Rare", "Legendary", "Artifact"]:
        return "major"
    return "minor"  # Default

# Level-based treasure multipliers
LEVEL_MULTIPLIERS = {
    1: 1,
    2: 1.5,
    3: 2,
    4: 2.5,
    5: 3,
    6: 4,
    7: 5,
    8: 6,
    9: 7,
    10: 8,
    11: 9,
    12: 10,
    13: 11,
    14: 12,
    15: 13,
    16: 14,
    17: 15,
    18: 16,
    19: 18,
    20: 20
}

def generate_coins(level, more_random=False):
    """Generate coins based on level"""
    base_amount = level * 50  # Base amount of coins
    
    # Adiciona uma variação natural mesmo sem more_random
    if more_random:
        # More variance if "more random" is selected
        base_amount = int(base_amount * random.uniform(0.5, 2.0))
    else:
        # Adiciona uma pequena variação natural (±20%)
        base_amount = int(base_amount * random.uniform(0.8, 1.2))
    
    # Distribute among coin types
    distribution = {}
    if level < 5:
        # Lower levels: more copper, silver
        distribution = {"cp": 0.25, "sp": 0.40, "gp": 0.30, "pp": 0.05}
    elif level < 10:
        # Mid levels: more silver, gold
        distribution = {"cp": 0.10, "sp": 0.30, "gp": 0.50, "pp": 0.10}
    else:
        # High levels: more gold, platinum
        distribution = {"cp": 0.05, "sp": 0.15, "gp": 0.60, "pp": 0.20}
    
    coins = {}
    for coin_type, ratio in distribution.items():
        amount = int(base_amount * ratio)
        
        # Adiciona uma pequena variação por tipo de moeda
        if more_random:
            amount = int(amount * random.uniform(0.8, 1.2))
        else:
            # Pequena variação mesmo no modo normal
            amount = int(amount * random.uniform(0.9, 1.1))
        
        # Adiciona uma chance de variação mais dramática ocasionalmente
        if random.random() < 0.1:  # 10% de chance
            if more_random:
                amount = int(amount * random.uniform(0.5, 1.5))
            else:
                amount = int(amount * random.uniform(0.7, 1.3))
        
        if amount > 0:
            coins[coin_type] = amount
    
    return coins

def generate_magic_items(level, item_types, ranks, include_psionic=False, include_chaositech=False):
    """Generate magic items based on level, selected types and ranks"""
    items = []
    
    # Determine quantity based on level (higher levels get more items)
    base_quantity = max(1, level // 4)
    quantity = random.randint(1, base_quantity)
    
    # Filter available types based on selection
    available_types = {}
    for item_type, ranks_dict in MAGIC_ITEMS_BY_TYPE.items():
        if item_type in item_types:
            available_types[item_type] = {}
            for rank, items_list in ranks_dict.items():
                if rank in ranks:
                    available_types[item_type][rank] = items_list
    
    # Add psionic items if requested
    if include_psionic:
        # Group psionic items by rank
        psionic_by_rank = {"minor": [], "medium": [], "major": []}
        for item in PSIONIC_ITEMS:
            rank = get_rank_from_rarity(item["rarity"])
            if rank in ranks:
                psionic_by_rank[rank].append(item["name"])
        
        if any(len(items) > 0 for items in psionic_by_rank.values()):
            available_types["psionic"] = {rank: items for rank, items in psionic_by_rank.items() if items}
    
    # Add chaositech items if requested
    if include_chaositech:
        # Group chaositech items by rank
        chaositech_by_rank = {"minor": [], "medium": [], "major": []}
        for item in CHAOSITECH_ITEMS:
            rank = get_rank_from_rarity(item["rarity"])
            if rank in ranks:
                chaositech_by_rank[rank].append(item["name"])
        
        if any(len(items) > 0 for items in chaositech_by_rank.values()):
            available_types["chaositech"] = {rank: items for rank, items in chaositech_by_rank.items() if items}
    
    # If no valid types or ranks, return empty list
    if not available_types:
        return []
    
    # Generate items
    for _ in range(quantity):
        # Select item type
        item_type = random.choice(list(available_types.keys()))
        
        # Select rank (with level-based weighting)
        available_ranks = list(available_types[item_type].keys())
        rank_weights = []
        
        if "minor" in available_ranks:
            rank_weights.append((7 - min(6, level // 3.5)) if level < 20 else 1)
        else:
            rank_weights.append(0)
            
        if "medium" in available_ranks:
            rank_weights.append(min(6, level // 3))
        else:
            rank_weights.append(0)
            
        if "major" in available_ranks:
            rank_weights.append(max(1, level // 7))
        else:
            rank_weights.append(0)
        
        # Normalize weights
        total_weight = sum(rank_weights)
        if total_weight == 0:
            continue
            
        normalized_weights = [w / total_weight for w in rank_weights]
        
        # Choose rank based on weights
        rand_val = random.random()
        cumulative = 0
        selected_rank_idx = 0
        
        for i, weight in enumerate(normalized_weights):
            cumulative += weight
            if rand_val <= cumulative:
                selected_rank_idx = i
                break
        
        available_ranks_list = [r for r in available_ranks if r in ["minor", "medium", "major"]]
        if not available_ranks_list:
            continue
            
        try:
            selected_rank = available_ranks_list[selected_rank_idx]
        except IndexError:
            selected_rank = available_ranks_list[-1]
        
        # Select item from the available items for this type and rank
        item_name = random.choice(available_types[item_type][selected_rank])
        
        # Get item details based on type
        item_data = {
            "type": "magic_item",
            "category": item_type,
            "name": item_name,
            "rank": selected_rank
        }
        
        # Add rarity for special item types
        if item_type in ["psionic", "chaositech"]:
            # Find the original item to get its rarity
            if item_type == "psionic":
                for psi_item in PSIONIC_ITEMS:
                    if psi_item["name"] == item_name:
                        item_data["rarity"] = psi_item["rarity"]
                        break
            else:  # chaositech
                for chaos_item in CHAOSITECH_ITEMS:
                    if chaos_item["name"] == item_name:
                        item_data["rarity"] = chaos_item["rarity"]
                        break
        
        items.append(item_data)
    
    return items

def generate_gems_art(level, include_gems=True, include_art_objects=True):
    """Generate gems and art objects based on level"""
    valuables = []
    
    # Early return if both are disabled
    if not include_gems and not include_art_objects:
        return valuables
    
    # Determine quantity based on level
    quantity_gems = 0
    quantity_art = 0
    
    if include_gems:
        quantity_gems = min(random.randint(1, level), 10)
    
    if include_art_objects:
        quantity_art = min(random.randint(1, level // 2 + 1), 5)
    
    # Determine rank based on level
    if level <= 5:
        rank = "minor"
    elif level <= 15:
        rank = "medium"
    else:
        rank = "major"
    
    # Generate gems only if enabled
    if include_gems:
        for _ in range(quantity_gems):
            # Sometimes generate a higher rank gem
            gem_rank = rank
            if random.random() < 0.1:  # 10% chance
                if rank == "minor":
                    gem_rank = "medium"
                elif rank == "medium":
                    gem_rank = "major"
            
            # Select value category
            value_category = random.choice(GEMS_BY_VALUE[gem_rank])
            
            # Generate gem
            gem = {
                "type": "gem",
                "name": random.choice(value_category["examples"]),
                "value": value_category["value"],
                "rank": gem_rank
            }
            valuables.append(gem)
    
    # Generate art objects only if enabled
    if include_art_objects:
        for _ in range(quantity_art):
            # Sometimes generate a higher rank art object
            art_rank = rank
            if random.random() < 0.1:  # 10% chance
                if rank == "minor":
                    art_rank = "medium"
                elif rank == "medium":
                    art_rank = "major"
            
            # Select value category
            value_category = random.choice(ART_OBJECTS_BY_VALUE[art_rank])
            
            # Generate art object
            art_object = {
                "type": "art_object",
                "name": random.choice(value_category["examples"]),
                "value": value_category["value"],
                "rank": art_rank
            }
            valuables.append(art_object)
    
    return valuables

def generate_treasure(request):
    """Generate a complete treasure hoard based on request parameters"""
    # Extract parameters with defaults
    level = request.get('level', 1)
    coin_type = request.get('coin_type', 'standard')
    valuable_type = request.get('valuable_type', 'standard')
    item_type = request.get('item_type', 'standard')
    more_random_coins = request.get('more_random_coins', False)
    trade_option = request.get('trade', 'none')
    
    # Checkbox parameters - these are the key ones!
    include_gems = request.get('gems', True)
    include_art = request.get('art_objects', True)
    include_magic_items = request.get('magic_items', True)
    include_psionic_items = request.get('psionic_items', False)
    include_chaositech_items = request.get('chaositech_items', False)
    
    magic_item_categories = request.get('magic_item_categories', [])
    ranks = request.get('ranks', ['minor', 'medium', 'major'])
    max_value = request.get('max_value', 0)
    combine_hoards = request.get('combine_hoards', False)
    quantity = request.get('quantity', 1)
    
    # Validate level
    try:
        level = int(level)
        if level < 1:
            level = 1
        elif level > 20:
            level = 20
    except (ValueError, TypeError):
        level = 1
    
    # Validate quantity
    try:
        quantity = int(quantity)
        if quantity < 1:
            quantity = 1
    except (ValueError, TypeError):
        quantity = 1
    
    # Generate treasure components
    result = {
        "level": level,
        "hoards": []
    }
    
    total_value = 0
    
    for _ in range(quantity):
        hoard = {
            "coins": {},
            "valuables": [],
            "items": []
        }
        
        # Generate coins based on coin_type
        if coin_type != "none":
            if coin_type == "double":
                hoard["coins"] = {k: v * 2 for k, v in generate_coins(level, more_random_coins).items()}
            elif coin_type == "half":
                hoard["coins"] = {k: v // 2 for k, v in generate_coins(level, more_random_coins).items()}
            else:  # standard
                hoard["coins"] = generate_coins(level, more_random_coins)
        
        # Generate gems and art objects based on checkboxes
        if valuable_type != "none":
            valuables = generate_gems_art(level, include_gems, include_art)
            hoard["valuables"] = valuables
        
        # Generate magic items based on checkboxes
        if item_type != "none" and include_magic_items:
            # If no categories specified, use all
            if not magic_item_categories:
                magic_item_categories = list(MAGIC_ITEMS_BY_TYPE.keys())
            
            magic_items = generate_magic_items(
                level, 
                magic_item_categories, 
                ranks, 
                include_psionic_items, 
                include_chaositech_items
            )
            hoard["items"] = magic_items
        
        # Calculate hoard value
        hoard_value = 0
        
        # Coins value
        for coin_type_name, amount in hoard["coins"].items():
            if coin_type_name == "cp":
                hoard_value += amount / 100
            elif coin_type_name == "sp":
                hoard_value += amount / 10
            elif coin_type_name == "gp":
                hoard_value += amount
            elif coin_type_name == "pp":
                hoard_value += amount * 10
        
        # Valuables value
        for valuable in hoard["valuables"]:
            hoard_value += valuable["value"]
        
        # Apply trade option if specified
        if trade_option == "coins_for_misc":
            # If trading coins for more valuables/items, reduce coins and increase others
            coin_total = sum(hoard["coins"].values())
            if coin_total > 0:
                # Reduce coins by half
                for coin in hoard["coins"]:
                    hoard["coins"][coin] = hoard["coins"][coin] // 2
                
                # Add more valuables if they're enabled
                if include_gems or include_art:
                    extra_valuables = generate_gems_art(level, include_gems, include_art)
                    hoard["valuables"].extend(extra_valuables)
        
        # Apply max value filter if specified
        if max_value > 0 and hoard_value > max_value:
            # Reduce coins first
            excess = hoard_value - max_value
            for coin_type_name in ["cp", "sp", "gp", "pp"]:
                if coin_type_name in hoard["coins"] and excess > 0:
                    coin_value = 0.01 if coin_type_name == "cp" else (0.1 if coin_type_name == "sp" else (1 if coin_type_name == "gp" else 10))
                    max_reduction = hoard["coins"][coin_type_name] * coin_value
                    actual_reduction = min(excess, max_reduction)
                    
                    hoard["coins"][coin_type_name] -= int(actual_reduction / coin_value)
                    excess -= actual_reduction
                    
                    if hoard["coins"][coin_type_name] <= 0:
                        del hoard["coins"][coin_type_name]
            
            # If still over max, remove valuables from least to most valuable
            if excess > 0 and hoard["valuables"]:
                hoard["valuables"].sort(key=lambda x: x["value"])
                while excess > 0 and hoard["valuables"]:
                    removed_valuable = hoard["valuables"].pop(0)
                    excess -= removed_valuable["value"]
            
            # If still over max, remove magic items
            if excess > 0 and hoard["items"]:
                # Just remove items until we're under the max
                while excess > 0 and hoard["items"]:
                    hoard["items"].pop()
                    excess -= 100  # Arbitrary value reduction per item
        
        hoard["value"] = hoard_value
        total_value += hoard_value
        
        result["hoards"].append(hoard)
    
    # Combine hoards if requested
    if combine_hoards and len(result["hoards"]) > 1:
        combined_hoard = {
            "coins": {},
            "valuables": [],
            "items": [],
            "value": total_value
        }
        
        for hoard in result["hoards"]:
            # Combine coins
            for coin_type_name, amount in hoard["coins"].items():
                if coin_type_name in combined_hoard["coins"]:
                    combined_hoard["coins"][coin_type_name] += amount
                else:
                    combined_hoard["coins"][coin_type_name] = amount
            
            # Combine valuables and items
            combined_hoard["valuables"].extend(hoard["valuables"])
            combined_hoard["items"].extend(hoard["items"])
        
        result["hoards"] = [combined_hoard]
    
    result["total_value"] = total_value
    return result

def handle_generate_items(request_data):
    """Handle API requests to generate items/treasure"""
    
    # Log for debugging
    print(f"Received treasure request: {request_data}")
    
    # Set default request parameters if not provided
    if not request_data:
        request_data = {
            "level": 1,
            "coin_type": "standard",
            "valuable_type": "standard", 
            "item_type": "standard",
            "more_random_coins": False,
            "trade": "none",
            "gems": True,
            "art_objects": True,
            "magic_items": True,
            "psionic_items": False,
            "chaositech_items": False,
            "magic_item_categories": ["armor", "weapons", "potions", "rings", "rods", "scrolls", "staves", "wands", "wondrous"],
            "ranks": ["minor", "medium", "major"],
            "max_value": 0,
            "combine_hoards": False,
            "quantity": 1
        }
    
    # Ensure required fields have defaults
    request_data.setdefault("level", 1)
    request_data.setdefault("coin_type", "standard")
    request_data.setdefault("valuable_type", "standard")
    request_data.setdefault("item_type", "standard")
    request_data.setdefault("more_random_coins", False)
    request_data.setdefault("trade", "none")
    request_data.setdefault("gems", True)
    request_data.setdefault("art_objects", True)
    request_data.setdefault("magic_items", True)
    request_data.setdefault("psionic_items", False)
    request_data.setdefault("chaositech_items", False)
    request_data.setdefault("ranks", ["minor", "medium", "major"])
    request_data.setdefault("max_value", 0)
    request_data.setdefault("combine_hoards", False)
    request_data.setdefault("quantity", 1)
    
    # Process the provided magic_item_categories - CORREÇÃO AQUI
    magic_item_categories = request_data.get("magic_item_categories")
    
    # Se magic_items está desabilitado, não processar categorias de itens mágicos
    if not request_data.get("magic_items", True):
        request_data["magic_item_categories"] = []
    elif magic_item_categories and isinstance(magic_item_categories, list) and "*" in magic_item_categories:
        # If "*" is included, use all categories
        request_data["magic_item_categories"] = list(MAGIC_ITEMS_BY_TYPE.keys())
    elif not magic_item_categories or magic_item_categories is None:
        # If no categories specified and magic_items is True, use all
        if request_data.get("magic_items", True):
            request_data["magic_item_categories"] = list(MAGIC_ITEMS_BY_TYPE.keys())
        else:
            request_data["magic_item_categories"] = []
    
    # Log final processed request
    print(f"Processing treasure request with: level={request_data['level']}, gems={request_data['gems']}, art_objects={request_data['art_objects']}, magic_items={request_data['magic_items']}")
    
    return generate_treasure(request_data)


# Example usage
if __name__ == "__main__":
    # Test the treasure generator
    test_request = {
        "level": 5,
        "coin_type": "standard",
        "valuable_type": "standard",
        "item_type": "standard",
        "more_random_coins": True,
        "trade": "none",
        "gems": True,
        "art_objects": True,
        "magic_items": True,
        "magic_item_categories": ["armor", "weapons", "potions"],
        "ranks": ["minor", "medium"],
        "max_value": 0,
        "combine_hoards": False,
        "quantity": 1
    }
    
    result = handle_generate_items(test_request)
    print(json.dumps(result, indent=2))