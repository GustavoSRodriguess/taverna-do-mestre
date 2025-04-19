import random
import json
import math

# Constants for treasure generation
COIN_TYPES = ["cp", "sp", "gp", "pp"]

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

ART_OBJECTS_BY_VALUE = {
    "minor": [
        {"value": 25, "examples": ["silver ewer", "bone statuette", "small gold bracelet", "cloth-of-gold vestments"]},
        {"value": 75, "examples": ["ivory statuette", "large gold bracelet", "silver necklace with gem pendant"]}
    ],
    "medium": [
        {"value": 250, "examples": ["gold ring with semi-precious stones", "carved ivory statuette", "large gold bracelet"]},
        {"value": 750, "examples": ["silver chalice with moonstones", "silver-plated steel longsword with jet jewel"]}
    ],
    "major": [
        {"value": 2500, "examples": ["fine gold chain with ruby pendant", "old masterpiece painting", "embroidered silk and velvet mantle with gems"]},
        {"value": 7500, "examples": ["jeweled gold crown", "jeweled platinum ring", "small gold idol"]}
    ]
}

MAGIC_ITEMS_BY_TYPE = {
    "armor": {
        "minor": [
            "Leather Armor +1", "Hide Armor +1", "Studded Leather +1", "Chain Shirt +1", 
            "Mithral Armor", "Mariner's Armor", "Adamantine Armor", "Armor of Gleaming",
            "Cast-off Armor", "Sentinel Shield", "Shield +1", "Shield of Expression",
            "Smoldering Armor", "Sentinel Shield"
        ],
        "medium": [
            "Chain Mail +1", "Breastplate +1", "Splint +1", "Half Plate +1", "Full Plate +1",
            "Glamoured Studded Leather", "Elven Chain", "Armor of Resistance",
            "Armor of Vulnerability", "Arrow-Catching Shield", "Animated Shield",
            "Shield of Missile Attraction", "Spellguard Shield", "Scale Mail +2",
            "Shield +2", "Demon Armor", "Dragon Scale Mail"
        ],
        "major": [
            "Chain Mail +2", "Breastplate +2", "Full Plate +2", "Plate of Etherealness",
            "Plate Armor +3", "Dwarven Plate", "Efreeti Chain", "Armor of Invulnerability",
            "Shield +3", "Defender Shield", "Armor of Fire Resistance", "Frost Brand Shield",
            "Shield of the Hidden Lord", "Armor of the Stars", "Dragonguard"
        ]
    },
    "weapons": {
        "minor": [
            "Longsword +1", "Dagger +1", "Shortbow +1", "Mace +1", "Javelin of Lightning",
            "Trident of Fish Command", "Moon-Touched Sword", "Walloping Ammunition",
            "Wand Sheath", "Unbreakable Arrow", "Veteran's Cane", "Shortbow +1",
            "Hand Crossbow +1", "Light Hammer +1", "Handaxe +1", "Mace of Smiting",
            "Warhammer +1", "Greataxe +1", "Flail +1", "Whip +1"
        ],
        "medium": [
            "Longsword +2", "Battleaxe +1", "Warhammer +1", "Greatsword +1",
            "Weapon of Warning", "Vicious Weapon", "Sun Blade", "Scimitar of Speed",
            "Oathbow", "Mace of Disruption", "Dagger of Venom", "Dragon Slayer",
            "Flame Tongue", "Giant Slayer", "Luck Blade", "Mace of Terror",
            "Nine Lives Stealer", "Hammer of Thunderbolts", "Dwarven Thrower",
            "Frost Brand", "Dancing Sword"
        ],
        "major": [
            "Sword of Sharpness", "Flame Tongue", "Frost Brand", "Vorpal Sword",
            "Defender", "Holy Avenger", "Blackrazor", "Hazirawn", "Wave",
            "Whelm", "Staff of Striking", "Sword of Life Stealing", "Sword of Wounding",
            "Greatsword +3", "Greataxe +3", "Longbow +3", "Staff of Power",
            "Sword of Answering", "Flametongue Spear", "Moonblade"
        ]
    },
    "potions": {
        "minor": [
            "Potion of Healing", "Potion of Climbing", "Potion of Animal Friendship",
            "Philter of Love", "Oil of Slipperiness", "Elixir of Health",
            "Potion of Growth", "Potion of Diminution", "Potion of Water Breathing",
            "Potion of Poison", "Oil of Etherealness", "Potion of Hill Giant Strength",
            "Potion of Frost Giant Strength", "Potion of Speed", "Potion of Resistance"
        ],
        "medium": [
            "Potion of Greater Healing", "Potion of Fire Breath", "Potion of Water Breathing",
            "Potion of Frost Giant Strength", "Potion of Stone Giant Strength",
            "Potion of Cloud Giant Strength", "Potion of Clairvoyance",
            "Potion of Gaseous Form", "Potion of Heroism", "Potion of Mind Reading",
            "Potion of Fire Giant Strength", "Oil of Sharpness", "Potion of Longevity",
            "Potion of Vitality", "Potion of Flying"
        ],
        "major": [
            "Potion of Superior Healing", "Potion of Invisibility", "Potion of Flying",
            "Potion of Storm Giant Strength", "Potion of Supreme Healing",
            "Oil of Sharpness (supreme)", "Potion of Giant Size", "Potion of Invulnerability",
            "Potion of Speed", "Sovereign Glue", "Universal Solvent"
        ]
    },
    "rings": {
        "minor": [
            "Ring of Swimming", "Ring of Jumping", "Ring of Mind Shielding",
            "Ring of Warmth", "Ring of Water Walking", "Ring of Animal Influence",
            "Ring of Feather Falling", "Ring of Protection +1", "Ring of the Ram",
            "Ring of Resistance (Acid)", "Ring of Resistance (Cold)", "Ring of Resistance (Fire)"
        ],
        "medium": [
            "Ring of Protection", "Ring of Resistance", "Ring of Spell Storing",
            "Ring of X-ray Vision", "Ring of Evasion", "Ring of Free Action",
            "Ring of Invisibility", "Ring of Regeneration", "Ring of Fire Elemental Command",
            "Ring of Water Elemental Command", "Ring of Earth Elemental Command",
            "Ring of Air Elemental Command", "Ring of Protection +2"
        ],
        "major": [
            "Ring of Telekinesis", "Ring of Regeneration", "Ring of Three Wishes",
            "Ring of Djinni Summoning", "Ring of Shooting Stars", "Ring of Spell Turning",
            "Ring of Mind Shielding (greater)", "Ring of Protection +3", "Ring of Wishes",
            "Ring of Winter", "Ring of Temporal Stasis", "Ring of Seven Stars"
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
            "Rod of Withering"
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
            "Scroll of Magic Missile", "Scroll of Charm Person", "Scroll of Detect Magic",
            "Scroll of Burning Hands", "Scroll of Comprehend Languages", 
            "Scroll of Cure Wounds", "Scroll of Disguise Self", "Scroll of Identify",
            "Scroll of Mage Armor", "Scroll of Protection from Evil and Good",
            "Scroll of Shield", "Scroll of Silent Image"
        ],
        "medium": [
            "Scroll of Fireball", "Scroll of Fly", "Scroll of Lightning Bolt",
            "Scroll of Protection from Energy", "Scroll of Remove Curse",
            "Scroll of Revivify", "Scroll of Sending", "Scroll of Sleet Storm",
            "Scroll of Speak with Dead", "Scroll of Dispel Magic", "Scroll of Fear",
            "Scroll of Glyph of Warding", "Scroll of Haste", "Scroll of Mass Healing Word"
        ],
        "major": [
            "Scroll of Power Word Kill", "Scroll of Wish", "Scroll of Time Stop",
            "Scroll of Gate", "Scroll of Meteor Swarm", "Scroll of Power Word Stun",
            "Scroll of Resurrection", "Scroll of True Resurrection", "Scroll of Foresight",
            "Scroll of Storm of Vengeance", "Scroll of Imprisonment", "Scroll of Mass Heal"
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
            "Wand of Magic Missiles", "Wand of Web", "Wand of Secrets",
            "Wand of Magic Detection", "Wand of the War Mage +1", "Wand of Pyrotechnics",
            "Wand of Enemy Detection", "Wand of Entangle", "Wand of Fear (lesser)",
            "Wand of Identify", "Wand of Binding (lesser)", "Wand of Conducting"
        ],
        "medium": [
            "Wand of Fear", "Wand of Fireballs", "Wand of Lightning Bolts",
            "Wand of the War Mage +2", "Wand of Binding", "Wand of Magic Detection (greater)",
            "Wand of Web (greater)", "Wand of Wonder", "Wand of Polymorph (lesser)",
            "Wand of Secrets (greater)", "Wand of Paralysis (lesser)", "Wand of Magic Missiles (greater)"
        ],
        "major": [
            "Wand of Polymorph", "Wand of Wonder", "Wand of Paralysis",
            "Wand of the War Mage +3", "Wand of Orcus", "Wand of Binding (greater)",
            "Wand of Fireballs (greater)", "Wand of Lightning Bolts (greater)",
            "Wand of Disintegration", "Wand of Force", "Wand of Winter", "Wand of Wish"
        ]
    },
    "wondrous": {
        "minor": [
            "Bag of Holding", "Cloak of Elvenkind", "Brooch of Shielding", "Eyes of Minute Seeing",
            "Alchemy Jug", "Amulet of Proof against Detection and Location", "Boots of Elvenkind",
            "Boots of Striding and Springing", "Bracers of Archery", "Broom of Flying",
            "Cap of Water Breathing", "Circlet of Blasting", "Cloak of Protection",
            "Cloak of the Manta Ray", "Decanter of Endless Water", "Deck of Illusions",
            "Dust of Disappearance", "Dust of Dryness", "Dust of Sneezing and Choking",
            "Elemental Gem", "Eversmoking Bottle", "Eyes of Charming", "Eyes of the Eagle",
            "Figurine of Wondrous Power (Silver Raven)", "Gauntlets of Ogre Power",
            "Gloves of Missile Snaring", "Gloves of Swimming and Climbing",
            "Goggles of Night", "Hat of Disguise", "Headband of Intellect", "Helm of Comprehending Languages",
            "Helm of Telepathy", "Instrument of the Bards (Doss Lute)", "Keoghtom's Ointment",
            "Lantern of Revealing", "Medallion of Thoughts", "Necklace of Adaptation",
            "Pearl of Power", "Periapt of Health", "Periapt of Wound Closure",
            "Pipes of Haunting", "Pipes of the Sewers", "Quiver of Ehlonna",
            "Ring of Swimming", "Robe of Useful Items", "Rope of Climbing",
            "Saddle of the Cavalier", "Sending Stones", "Slippers of Spider Climbing",
            "Stone of Good Luck", "Wind Fan", "Winged Boots"
        ],
        "medium": [
            "Boots of Speed", "Cloak of Displacement", "Amulet of Health", "Belt of Giant Strength",
            "Apparatus of Kwalish", "Amulet of the Planes", "Bag of Beans",
            "Bead of Force", "Belt of Dwarvenkind", "Belt of Giant Strength (Fire Giant)",
            "Belt of Giant Strength (Frost Giant)", "Belt of Giant Strength (Stone Giant)",
            "Bracers of Defense", "Cape of the Mountebank", "Carpet of Flying",
            "Cloak of the Bat", "Cube of Force", "Daern's Instant Fortress",
            "Dimensional Shackles", "Figurine of Wondrous Power (Bronze Griffon)",
            "Figurine of Wondrous Power (Ebony Fly)", "Figurine of Wondrous Power (Golden Lions)",
            "Figurine of Wondrous Power (Ivory Goats)", "Figurine of Wondrous Power (Marble Elephant)",
            "Figurine of Wondrous Power (Onyx Dog)", "Figurine of Wondrous Power (Serpentine Owl)",
            "Folding Boat", "Gem of Seeing", "Horn of Blasting",
            "Horn of Valhalla (Silver or Brass)", "Horseshoes of Speed",
            "Instrument of the Bards (Canaith Mandolin)", "Instrument of the Bards (Cli Lyre)",
            "Instrument of the Bards (Mac-Fuirmidh Cittern)", "Ioun Stone (Awareness)",
            "Ioun Stone (Protection)", "Ioun Stone (Reserve)", "Ioun Stone (Sustenance)",
            "Iron Bands of Bilarro", "Mantle of Spell Resistance", "Manual of Bodily Health",
            "Manual of Gainful Exercise", "Manual of Golems (Clay)", "Manual of Golems (Flesh)",
            "Manual of Quickness of Action", "Mirror of Life Trapping", "Necklace of Fireballs",
            "Periapt of Proof against Poison", "Portable Hole", "Robe of Eyes",
            "Robe of Scintillating Colors", "Robe of Stars", "Rod of Rulership",
            "Scarab of Protection", "Tome of Clear Thought", "Tome of Leadership and Influence",
            "Tome of Understanding", "Wings of Flying"
        ],
        "major": [
            "Cubic Gate", "Deck of Many Things", "Robe of the Archmagi", "Sphere of Annihilation",
            "Apparatus of Kwalish (greater)", "Belt of Giant Strength (Cloud Giant)",
            "Belt of Giant Strength (Storm Giant)", "Cloak of Invisibility",
            "Crystal Ball", "Efreeti Bottle", "Horn of Valhalla (Bronze)",
            "Horn of Valhalla (Iron)", "Instrument of the Bards (Anstruth Harp)",
            "Instrument of the Bards (Ollamh Harp)", "Ioun Stone (Absorption)",
            "Ioun Stone (Agility)", "Ioun Stone (Fortitude)", "Ioun Stone (Insight)",
            "Ioun Stone (Intellect)", "Ioun Stone (Leadership)", "Ioun Stone (Strength)",
            "Manual of Golems (Iron)", "Manual of Golems (Stone)", "Mirror of Mental Prowess",
            "Nolzur's Marvelous Pigments", "Robe of the Archmagi (White/Gray/Black)",
            "Sphere of Annihilation", "Talisman of Pure Good", "Talisman of Ultimate Evil",
            "Talisman of the Sphere", "Well of Many Worlds"
        ]
    }
}

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
    
    if more_random:
        # More variance if "more random" is selected
        base_amount = int(base_amount * random.uniform(0.5, 2.0))
    
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
        if more_random:
            # Add some randomness
            amount = int(amount * random.uniform(0.8, 1.2))
        
        if amount > 0:
            coins[coin_type] = amount
    
    return coins

def generate_gems_art(level, include_gems=True, include_art_objects=True):
    """Generate gems and art objects based on level"""
    valuables = []
    
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
    
    # Generate gems
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
    
    # Generate art objects
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

def generate_magic_items(level, item_types, ranks):
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
        
        # Generate item
        magic_item = {
            "type": "magic_item",
            "category": item_type,
            "name": item_name,
            "rank": selected_rank
        }
        
        items.append(magic_item)
    
    return items

def generate_treasure(request):
    """Generate a complete treasure hoard based on request parameters"""
    # Extract parameters
    level = request.get('level', 1)
    coin_type = request.get('coin_type', 'standard')
    valuable_type = request.get('valuable_type', 'standard')
    item_type = request.get('item_type', 'standard')
    more_random_coins = request.get('more_random_coins', False)
    trade_option = request.get('trade', 'none')
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
        
        # Generate coins
        if coin_type != "none":
            hoard["coins"] = generate_coins(level, more_random_coins)
        
        # Generate gems and art objects
        if valuable_type != "none":
            hoard["valuables"] = generate_gems_art(level, include_gems, include_art)
        
        # Generate magic items
        if item_type != "none" and include_magic_items:
            # If no categories specified, use all
            if not magic_item_categories:
                magic_item_categories = list(MAGIC_ITEMS_BY_TYPE.keys())
            
            hoard["items"] = generate_magic_items(level, magic_item_categories, ranks)
        
        # Calculate hoard value
        hoard_value = 0
        
        # Coins value
        for coin_type, amount in hoard["coins"].items():
            if coin_type == "cp":
                hoard_value += amount / 100
            elif coin_type == "sp":
                hoard_value += amount / 10
            elif coin_type == "gp":
                hoard_value += amount
            elif coin_type == "pp":
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
                
                # Add more valuables
                extra_valuables = generate_gems_art(level, include_gems, include_art)
                hoard["valuables"].extend(extra_valuables)
        
        # Apply max value filter if specified
        if max_value > 0 and hoard_value > max_value:
            # Reduce coins first
            excess = hoard_value - max_value
            for coin_type in ["cp", "sp", "gp", "pp"]:
                if coin_type in hoard["coins"] and excess > 0:
                    coin_value = 0.01 if coin_type == "cp" else (0.1 if coin_type == "sp" else (1 if coin_type == "gp" else 10))
                    max_reduction = hoard["coins"][coin_type] * coin_value
                    actual_reduction = min(excess, max_reduction)
                    
                    hoard["coins"][coin_type] -= int(actual_reduction / coin_value)
                    excess -= actual_reduction
                    
                    if hoard["coins"][coin_type] <= 0:
                        del hoard["coins"][coin_type]
            
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
            for coin_type, amount in hoard["coins"].items():
                if coin_type in combined_hoard["coins"]:
                    combined_hoard["coins"][coin_type] += amount
                else:
                    combined_hoard["coins"][coin_type] = amount
            
            # Combine valuables and items
            combined_hoard["valuables"].extend(hoard["valuables"])
            combined_hoard["items"].extend(hoard["items"])
        
        result["hoards"] = [combined_hoard]
    
    result["total_value"] = total_value
    return result

def handle_generate_items(request_data):
    """Handle API requests to generate items/treasure"""
    
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
    
    # Process the provided magic_item_categories
    if "magic_item_categories" in request_data and "*" in request_data["magic_item_categories"]:
        # If "*" is included, use all categories
        request_data["magic_item_categories"] = list(MAGIC_ITEMS_BY_TYPE.keys())
    
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