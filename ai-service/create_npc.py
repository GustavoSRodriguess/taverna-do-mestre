import random
import requests
import json
import math

class DndApiClient:
    """Client for interacting with the D&D 5e API"""
    
    BASE_URL = "https://www.dnd5eapi.co/api/2014"
    
    @classmethod
    def get_classes(cls):
        """Get all available classes"""
        response = requests.get(f"{cls.BASE_URL}/classes")
        if response.status_code == 200:
            return response.json()["results"]
        return []
    
    @classmethod
    def get_class_details(cls, class_index):
        """Get detailed information about a specific class"""
        response = requests.get(f"{cls.BASE_URL}/classes/{class_index}")
        if response.status_code == 200:
            return response.json()
        return None
    
    @classmethod
    def get_races(cls):
        """Get all available races"""
        response = requests.get(f"{cls.BASE_URL}/races")
        if response.status_code == 200:
            return response.json()["results"]
        return []
    
    @classmethod
    def get_race_details(cls, race_index):
        """Get detailed information about a specific race"""
        response = requests.get(f"{cls.BASE_URL}/races/{race_index}")
        if response.status_code == 200:
            return response.json()
        return None
    
    @classmethod
    def get_backgrounds(cls):
        """Get all available backgrounds"""
        # Note: The 5e API doesn't have backgrounds endpoint, so we'll use a fallback
        return cls.get_fallback_backgrounds()
    
    @classmethod
    def get_fallback_backgrounds(cls):
        """Fallback backgrounds when API doesn't provide them"""
        return [
            {"index": "acolyte", "name": "Acolyte"},
            {"index": "charlatan", "name": "Charlatan"},
            {"index": "criminal", "name": "Criminal"},
            {"index": "entertainer", "name": "Entertainer"},
            {"index": "folk-hero", "name": "Folk Hero"},
            {"index": "guild-artisan", "name": "Guild Artisan"},
            {"index": "hermit", "name": "Hermit"},
            {"index": "noble", "name": "Noble"},
            {"index": "outlander", "name": "Outlander"},
            {"index": "sage", "name": "Sage"},
            {"index": "sailor", "name": "Sailor"},
            {"index": "soldier", "name": "Soldier"},
            {"index": "urchin", "name": "Urchin"}
        ]
    
    @classmethod
    def get_spells_by_class(cls, class_index, level=None):
        """Get spells available to a specific class"""
        url = f"{cls.BASE_URL}/classes/{class_index}/spells"
        if level is not None:
            url += f"?level={level}"
        
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()["results"]
        return []
    
    @classmethod
    def get_spell_details(cls, spell_index):
        """Get detailed information about a specific spell"""
        response = requests.get(f"{cls.BASE_URL}/spells/{spell_index}")
        if response.status_code == 200:
            return response.json()
        return None
    
    @classmethod
    def get_equipment(cls, category=None):
        """Get equipment items, optionally filtered by category"""
        url = f"{cls.BASE_URL}/equipment"
        if category:
            url += f"?equipment-category={category}"
        
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()["results"]
        return []
    
    @classmethod
    def get_equipment_categories(cls):
        """Get all equipment categories"""
        response = requests.get(f"{cls.BASE_URL}/equipment-categories")
        if response.status_code == 200:
            return response.json()["results"]
        return []


def generate_attributes(method="standard_array", class_name=None):
    """Generate character attributes based on the specified method"""
    attributes = {
        "strength": 0,
        "dexterity": 0,
        "constitution": 0,
        "intelligence": 0,
        "wisdom": 0,
        "charisma": 0
    }
    
    # Class priorities (which attributes are most important for each class)
    class_priorities = {
        "barbarian": ["strength", "constitution"],
        "bard": ["charisma", "dexterity"],
        "cleric": ["wisdom", "constitution"],
        "druid": ["wisdom", "constitution"],
        "fighter": ["strength", "constitution"],
        "monk": ["dexterity", "wisdom"],
        "paladin": ["strength", "charisma"],
        "ranger": ["dexterity", "wisdom"],
        "rogue": ["dexterity", "intelligence"],
        "sorcerer": ["charisma", "constitution"],
        "warlock": ["charisma", "constitution"],
        "wizard": ["intelligence", "constitution"]
    }
    
    # Determine attribute priorities based on class
    if class_name and class_name.lower() in class_priorities:
        priorities = class_priorities[class_name.lower()]
    else:
        priorities = random.sample(list(attributes.keys()), 2)
    
    # Secondary attributes (everything except the priorities)
    secondary = [attr for attr in attributes.keys() if attr not in priorities]
    
    # Generate attributes based on method
    if method == "standard_array":
        # Standard array: 15, 14, 13, 12, 10, 8
        values = [15, 14, 13, 12, 10, 8]
        
        # Assign values to attributes based on priorities
        attributes[priorities[0]] = values[0]  # Primary attribute gets 15
        attributes[priorities[1]] = values[1]  # Secondary attribute gets 14
        
        # Assign remaining values to other attributes
        random.shuffle(secondary)
        for i, attr in enumerate(secondary):
            attributes[attr] = values[i + 2]
    
    elif method == "roll":
        # 4d6, drop the lowest
        for attr in attributes:
            rolls = sorted([random.randint(1, 6) for _ in range(4)])
            attributes[attr] = sum(rolls[1:])  # Drop the lowest roll
        
        # Ensure priority attributes are higher
        # If primary attribute is not at least 14, reroll
        while attributes[priorities[0]] < 14:
            rolls = sorted([random.randint(1, 6) for _ in range(4)])
            attributes[priorities[0]] = sum(rolls[1:])
    
    elif method == "point_buy":
        # Simplified point buy
        # Start with all 8s, then distribute 27 points
        points = 27
        for attr in attributes:
            attributes[attr] = 8
        
        # Cost table
        # 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
        costs = {9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9}
        
        # Prioritize the primary and secondary attributes
        # Try to get primary to 15 and secondary to 14
        if points >= costs[15]:
            attributes[priorities[0]] = 15
            points -= costs[15]
        
        if points >= costs[14]:
            attributes[priorities[1]] = 14
            points -= costs[14]
        
        # Distribute remaining points randomly
        while points > 0:
            # Pick a random attribute
            attr = random.choice(list(attributes.keys()))
            
            # Try to increase it if possible
            if attributes[attr] < 15 and points >= costs.get(attributes[attr] + 1, 0):
                points -= costs.get(attributes[attr] + 1, 0)
                attributes[attr] += 1
            else:
                # If we can't increase any more, break
                break
    
    return attributes


def apply_racial_bonuses(attributes, race_details):
    """Apply racial ability score bonuses"""
    if not race_details:
        return attributes
    
    # Copy attributes to avoid modifying the original
    modified_attributes = attributes.copy()
    
    # Apply ability bonuses from race
    ability_bonuses = race_details.get("ability_bonuses", [])
    for bonus in ability_bonuses:
        ability_name = bonus.get("ability_score", {}).get("index", "")
        bonus_value = bonus.get("bonus", 0)
        
        if ability_name and ability_name in modified_attributes:
            modified_attributes[ability_name] += bonus_value
    
    return modified_attributes


def calculate_modifiers(attributes):
    """Calculate ability score modifiers"""
    return {attr: (value - 10) // 2 for attr, value in attributes.items()}


def calculate_hp(class_name, level, constitution_modifier):
    """Calculate HP based on class, level, and constitution modifier"""
    hit_dice = {
        "barbarian": 12,
        "fighter": 10,
        "paladin": 10,
        "ranger": 10,
        "bard": 8,
        "cleric": 8,
        "druid": 8,
        "monk": 8,
        "rogue": 8,
        "warlock": 8,
        "sorcerer": 6,
        "wizard": 6
    }
    
    # Get hit die for class (default to d8)
    hit_die = hit_dice.get(class_name.lower(), 8)
    
    # First level: max hit die + constitution modifier
    hp = hit_die + constitution_modifier
    
    # Additional levels: roll hit die + constitution modifier
    if level > 1:
        for _ in range(1, level):
            # Average roll: (hit_die / 2) + 1
            hp += ((hit_die / 2) + 1) + constitution_modifier
    
    return max(1, int(hp))  # Minimum HP is 1


def calculate_ac(attributes, armor=None, shield=False):
    """Calculate Armor Class based on attributes and equipment"""
    dex_mod = calculate_modifiers(attributes)["dexterity"]
    
    # Base AC (unarmored)
    ac = 10 + dex_mod
    
    # Adjustments based on armor type
    if armor == "light":
        ac = 12 + dex_mod  # Leather armor (AC 11) as base
    elif armor == "medium":
        ac = 14 + min(2, dex_mod)  # Scale mail (AC 14) as base, dex capped at +2
    elif armor == "heavy":
        ac = 16  # Chain mail (AC 16) as base, no dex bonus
    
    # Add shield bonus
    if shield:
        ac += 2
    
    return ac


def get_class_features(class_details, level):
    """Get class features for a specific level"""
    if not class_details:
        return []
    
    features = []
    class_features = class_details.get("class_features", [])
    
    for feature in class_features:
        feature_level = feature.get("level", 1)
        if feature_level <= level:
            features.append(feature.get("name", "Unknown Feature"))
    
    return features


def select_equipment(class_details, background=None):
    """Select appropriate equipment based on class and background"""
    equipment = []
    
    # Base equipment for all classes
    equipment.append("Adventurer's Pack")
    equipment.append("Clothes, common")
    
    # Class-specific equipment
    class_name = class_details.get("name", "").lower() if class_details else ""
    
    if class_name == "barbarian":
        equipment.extend(["Greataxe", "Handaxe (2)", "Javelin (4)", "Backpack"])
    elif class_name == "bard":
        equipment.extend(["Rapier", "Lute", "Leather Armor", "Dagger"])
    elif class_name == "cleric":
        equipment.extend(["Mace", "Scale Mail", "Shield", "Holy Symbol"])
    elif class_name == "druid":
        equipment.extend(["Scimitar", "Leather Armor", "Explorer's Pack", "Druidic Focus"])
    elif class_name == "fighter":
        equipment.extend(["Longsword", "Shield", "Chain Mail", "Light Crossbow and 20 bolts"])
    elif class_name == "monk":
        equipment.extend(["Shortsword", "10 Darts", "Explorer's Pack"])
    elif class_name == "paladin":
        equipment.extend(["Longsword", "Shield", "Chain Mail", "Holy Symbol"])
    elif class_name == "ranger":
        equipment.extend(["Shortsword (2)", "Longbow and Quiver of 20 Arrows", "Leather Armor"])
    elif class_name == "rogue":
        equipment.extend(["Rapier", "Shortbow and Quiver of 20 Arrows", "Leather Armor", "Thieves' Tools"])
    elif class_name == "sorcerer":
        equipment.extend(["Light Crossbow and 20 bolts", "Arcane Focus", "Dagger (2)"])
    elif class_name == "warlock":
        equipment.extend(["Light Crossbow and 20 bolts", "Arcane Focus", "Leather Armor", "Dagger (2)"])
    elif class_name == "wizard":
        equipment.extend(["Quarterstaff", "Arcane Focus", "Spellbook", "Dagger"])
    
    # Add background-specific equipment
    if background == "acolyte":
        equipment.extend(["Holy Symbol", "Prayer Book", "Incense (5 sticks)", "Vestments"])
    elif background == "criminal":
        equipment.extend(["Crowbar", "Dark Clothes with Hood", "Thieves' Tools"])
    elif background == "noble":
        equipment.extend(["Fine Clothes", "Signet Ring", "Scroll of Pedigree"])
    elif background == "sage":
        equipment.extend(["Book of Lore", "Ink and Quill", "Small Knife", "Letter from a colleague"])
    elif background == "soldier":
        equipment.extend(["Insignia of Rank", "Trophy from a fallen enemy", "Dice Set", "Common Clothes"])
    
    return equipment


def select_spells(class_name, level):
    """Select appropriate spells based on class and level"""
    if not class_name:
        return {}
    
    spellcasting_classes = ["bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "warlock", "wizard"]
    if class_name.lower() not in spellcasting_classes:
        return {}
    
    spells_by_level = {}
    
    try:
        # Determine max spell level known
        if class_name.lower() in ["bard", "cleric", "druid", "sorcerer", "wizard"]:
            max_spell_level = min(9, (level + 1) // 2)
        elif class_name.lower() in ["paladin", "ranger"]:
            max_spell_level = min(5, (level - 1) // 4 + 1) if level >= 2 else 0
        elif class_name.lower() == "warlock":
            max_spell_level = min(5, (level + 1) // 2)
        else:
            max_spell_level = 0
        
        # Get spells for each level
        if max_spell_level > 0:
            for spell_level in range(0, max_spell_level + 1):  # Include cantrips (level 0)
                available_spells = DndApiClient.get_spells_by_class(class_name.lower(), spell_level)
                
                # Determine number of spells to select
                if spell_level == 0:  # Cantrips
                    if class_name.lower() in ["bard", "druid", "warlock"]:
                        num_spells = min(2 + (level // 4), 4)
                    elif class_name.lower() in ["cleric", "wizard"]:
                        num_spells = min(3 + (level // 2), 5)
                    elif class_name.lower() == "sorcerer":
                        num_spells = min(4 + (level // 6), 6)
                    else:
                        num_spells = 0
                else:  # Level 1+ spells
                    if class_name.lower() in ["bard", "sorcerer", "warlock"]:
                        num_spells = min(2 + (level // 2), 8)
                    elif class_name.lower() in ["wizard"]:
                        num_spells = min(4 + level, 20)
                    elif class_name.lower() in ["cleric", "druid"]:
                        num_spells = 0  # They know all their spells
                    elif class_name.lower() in ["paladin", "ranger"]:
                        num_spells = min(2 + (level // 2), 8) if level >= 2 else 0
                    else:
                        num_spells = 0
                
                # Select random spells
                if available_spells and num_spells > 0:
                    selected = random.sample(available_spells, min(num_spells, len(available_spells)))
                    spells_by_level[f"level_{spell_level}"] = [spell["name"] for spell in selected]
                elif class_name.lower() in ["cleric", "druid"] and spell_level > 0:
                    # Clerics and druids know all their spells, just grab some representative ones
                    selected = random.sample(available_spells, min(3, len(available_spells))) if available_spells else []
                    spells_by_level[f"level_{spell_level}"] = [spell["name"] for spell in selected]
    except Exception as e:
        # Fallback to predefined spells if API fails
        return get_fallback_spells(class_name, level)
    
    return spells_by_level

def get_fallback_spells(class_name, level):
    """Fallback spells when API isn't available"""
    fallback_spells = {
        "wizard": {
            "level_0": ["Light", "Mage Hand", "Prestidigitation", "Ray of Frost"],
            "level_1": ["Magic Missile", "Shield", "Mage Armor", "Detect Magic"],
            "level_2": ["Invisibility", "Scorching Ray", "Misty Step"],
            "level_3": ["Fireball", "Counterspell", "Fly"]
        },
        "cleric": {
            "level_0": ["Light", "Sacred Flame", "Spare the Dying"],
            "level_1": ["Cure Wounds", "Healing Word", "Bless", "Shield of Faith"],
            "level_2": ["Lesser Restoration", "Spiritual Weapon", "Hold Person"],
            "level_3": ["Mass Healing Word", "Revivify", "Dispel Magic"]
        },
        "bard": {
            "level_0": ["Vicious Mockery", "Mage Hand", "Prestidigitation"],
            "level_1": ["Healing Word", "Charm Person", "Disguise Self"],
            "level_2": ["Invisibility", "Suggestion", "Hold Person"],
            "level_3": ["Hypnotic Pattern", "Dispel Magic", "Sending"]
        },
        "druid": {
            "level_0": ["Druidcraft", "Produce Flame", "Shillelagh"],
            "level_1": ["Cure Wounds", "Entangle", "Faerie Fire"],
            "level_2": ["Barkskin", "Flame Blade", "Moonbeam"],
            "level_3": ["Call Lightning", "Dispel Magic", "Plant Growth"]
        },
        "sorcerer": {
            "level_0": ["Fire Bolt", "Mage Hand", "Prestidigitation", "Ray of Frost"],
            "level_1": ["Magic Missile", "Shield", "Mage Armor"],
            "level_2": ["Scorching Ray", "Misty Step", "Mirror Image"],
            "level_3": ["Fireball", "Counterspell", "Haste"]
        },
        "warlock": {
            "level_0": ["Eldritch Blast", "Mage Hand", "Prestidigitation"],
            "level_1": ["Hex", "Charm Person", "Arms of Hadar"],
            "level_2": ["Invisibility", "Scorching Ray", "Hold Person"],
            "level_3": ["Fireball", "Counterspell", "Hypnotic Pattern"]
        },
        "paladin": {
            "level_1": ["Cure Wounds", "Shield of Faith", "Bless"],
            "level_2": ["Lesser Restoration", "Zone of Truth", "Find Steed"]
        },
        "ranger": {
            "level_1": ["Hunter's Mark", "Goodberry", "Cure Wounds"],
            "level_2": ["Lesser Restoration", "Pass without Trace", "Silence"]
        }
    }
    
    # Filter spells based on level
    max_spell_level = (level + 1) // 2 if class_name.lower() in ["bard", "cleric", "druid", "sorcerer", "wizard"] else 1
    max_spell_level = min(3, max_spell_level)  # Cap at level 3 for fallback
    
    result = {}
    if class_name.lower() in fallback_spells:
        for spell_level_key, spells in fallback_spells[class_name.lower()].items():
            level_num = int(spell_level_key.split("_")[1])
            if level_num <= max_spell_level:
                result[spell_level_key] = spells
    
    return result

def generate_npc(level=1, attribute_method="standard_array", manual=False,  race=None, character_class=None):
    """Generate a random NPC character"""
    try:
        # Get available classes and races from API
        available_classes = DndApiClient.get_classes()
        available_races = DndApiClient.get_races()
        
        # If no classes or races found, use fallback data
        if not available_classes or not available_races:
            return generate_fallback_npc(level, attribute_method)
        
        # Random selection if not manual
        if not manual:
            # Select random class and race
            class_data = random.choice(available_classes)
            race_data = random.choice(available_races)
            background_data = random.choice(DndApiClient.get_backgrounds())
            
            # Get detailed information
            class_details = DndApiClient.get_class_details(class_data["index"])
            race_details = DndApiClient.get_race_details(race_data["index"])
        else:
            class_data = character_class if character_class else random.choice(available_classes)
            race_data = race if race else random.choice(available_races)
            background_data = background_data if background_data else random.choice(DndApiClient.get_backgrounds())
            
            # Get detailed information
            class_details = DndApiClient.get_class_details(class_data)
            race_details = DndApiClient.get_race_details(race_data)
        
        # Generate base attributes
        attributes = generate_attributes(attribute_method, class_data["index"])
        
        # Apply racial bonuses
        attributes = apply_racial_bonuses(attributes, race_details)
        
        # Calculate modifiers
        modifiers = calculate_modifiers(attributes)
        
        # Determine appropriate equipment
        equipment = select_equipment(class_details, background_data["index"])
        
        # Select spells if applicable
        spells = select_spells(class_data["index"], level)
        
        # Calculate HP
        hp = calculate_hp(class_data["index"], level, modifiers["constitution"])
        
        # Determine armor class
        # For simplicity, assume most classes use appropriate armor from their equipment
        if class_data["index"] in ["wizard", "sorcerer", "warlock", "monk"]:
            armor_type = None  # Unarmored
        elif class_data["index"] in ["rogue", "ranger", "bard", "druid"]:
            armor_type = "light"
        elif class_data["index"] in ["cleric", "fighter", "paladin"]:
            armor_type = "medium"
            if class_data["index"] in ["fighter", "paladin"]:
                armor_type = "heavy"
        else:
            armor_type = None
        
        # Determine if using shield
        has_shield = class_data["index"] in ["fighter", "cleric", "paladin"]
        
        # Calculate AC
        ac = calculate_ac(attributes, armor_type, has_shield)
        
        # Get class features
        features = get_class_features(class_details, level)
        
        # Generate name
        name = f"{race_data['name']} {class_data['name']}"
        
        # Generate description
        description = f"A level {level} {race_data['name']} {class_data['name']} with a {background_data['name']} background"
        
        # Format the NPC data structure
        npc = {
            "name": name,
            "description": description,
            "level": level,
            "race": race_data["name"],
            "class": class_data["name"],
            "background": background_data["name"],
            "attributes": attributes,
            "modifiers": modifiers,
            "abilities": features,
            "equipment": equipment,
            "hp": hp,
            "ca": ac,
        }
        
        # Add spells if any
        if spells:
            npc["spells"] = spells
        
        return npc
    except Exception as e:
        # If anything fails, use fallback
        return generate_fallback_npc(level, attribute_method)

def generate_fallback_npc(level=1, attribute_method="standard_array"):
    """Fallback NPC generator when API isn't available"""
    # Predefined races and classes
    races = [
        "Human", "Elf", "Dwarf", "Halfling", "Tiefling", "Dragonborn", 
        "Gnome", "Half-Elf", "Half-Orc"
    ]
    
    classes = [
        "Fighter", "Wizard", "Cleric", "Rogue", "Ranger", "Paladin", 
        "Bard", "Sorcerer", "Warlock", "Monk", "Druid", "Barbarian"
    ]
    
    backgrounds = [
        "Acolyte", "Criminal", "Folk Hero", "Noble", "Sage", "Soldier",
        "Charlatan", "Entertainer", "Hermit", "Outlander", "Sailor", "Urchin"
    ]
    
    # Generate basic character data
    race = random.choice(races)
    character_class = random.choice(classes)
    background = random.choice(backgrounds)
    
    # Generate attributes based on method
    if attribute_method == "roll":
        # 4d6 drop lowest
        attributes = {
            "strength": sum(sorted([random.randint(1, 6) for _ in range(4)])[1:]),
            "dexterity": sum(sorted([random.randint(1, 6) for _ in range(4)])[1:]),
            "constitution": sum(sorted([random.randint(1, 6) for _ in range(4)])[1:]),
            "intelligence": sum(sorted([random.randint(1, 6) for _ in range(4)])[1:]),
            "wisdom": sum(sorted([random.randint(1, 6) for _ in range(4)])[1:]),
            "charisma": sum(sorted([random.randint(1, 6) for _ in range(4)])[1:])
        }
    else:
        # Standard array: 15, 14, 13, 12, 10, 8
        values = [15, 14, 13, 12, 10, 8]
        random.shuffle(values)
        
        attributes = {
            "strength": values[0],
            "dexterity": values[1],
            "constitution": values[2],
            "intelligence": values[3],
            "wisdom": values[4],
            "charisma": values[5]
        }
    
    # Apply racial modifiers (simplified)
    if race == "Human":
        for attr in attributes:
            attributes[attr] += 1
    elif race == "Dwarf":
        attributes["constitution"] += 2
    elif race == "Elf":
        attributes["dexterity"] += 2
    elif race == "Halfling":
        attributes["dexterity"] += 2
    elif race == "Dragonborn":
        attributes["strength"] += 2
        attributes["charisma"] += 1
    elif race == "Gnome":
        attributes["intelligence"] += 2
    elif race == "Half-Elf":
        attributes["charisma"] += 2
        # Choose two other attributes to increase by 1
        other_attrs = [a for a in attributes.keys() if a != "charisma"]
        selected = random.sample(other_attrs, 2)
        for attr in selected:
            attributes[attr] += 1
    elif race == "Half-Orc":
        attributes["strength"] += 2
        attributes["constitution"] += 1
    elif race == "Tiefling":
        attributes["intelligence"] += 1
        attributes["charisma"] += 2
    
    # Calculate modifiers
    modifiers = {attr: (value - 10) // 2 for attr, value in attributes.items()}
    
    # Calculate HP
    hit_dice = {
        "Barbarian": 12,
        "Fighter": 10,
        "Paladin": 10,
        "Ranger": 10,
        "Bard": 8,
        "Cleric": 8,
        "Druid": 8,
        "Monk": 8,
        "Rogue": 8,
        "Warlock": 8,
        "Sorcerer": 6,
        "Wizard": 6
    }
    
    # First level: max hit die + constitution modifier
    base_hp = hit_dice.get(character_class, 8) + modifiers["constitution"]
    
    # Additional levels: average roll for hit die + constitution modifier
    if level > 1:
        for _ in range(1, level):
            hp_per_level = (hit_dice.get(character_class, 8) / 2 + 1) + modifiers["constitution"]
            base_hp += max(1, int(hp_per_level))
    
    hp = max(1, base_hp)  # Minimum HP is 1
    
    # Calculate AC based on class and modifiers
    ac = 10 + modifiers["dexterity"]  # Base AC
    
    # Adjust based on class expectations
    if character_class in ["Fighter", "Paladin"]:
        ac = 16  # Chain mail base (no dex bonus)
        if character_class == "Fighter":
            ac += 1  # Defense fighting style
    elif character_class in ["Barbarian", "Ranger", "Rogue"]:
        ac = 12 + modifiers["dexterity"]  # Leather armor base + dex
    elif character_class in ["Cleric", "Druid"]:
        ac = 14 + min(2, modifiers["dexterity"])  # Scale mail/hide + limited dex
    
    # Add shield bonus for appropriate classes
    if character_class in ["Fighter", "Cleric", "Paladin"]:
        ac += 2
    
    # Generate class abilities
    abilities = []
    if character_class == "Fighter":
        abilities = ["Second Wind", "Action Surge"] if level >= 2 else ["Second Wind"]
    elif character_class == "Barbarian":
        abilities = ["Rage", "Unarmored Defense"]
    elif character_class == "Rogue":
        abilities = ["Sneak Attack", "Expertise"]
    elif character_class == "Wizard":
        abilities = ["Arcane Recovery", "Spellcasting"]
    elif character_class == "Cleric":
        abilities = ["Divine Domain", "Spellcasting"]
    # Add more for other classes...
    
    # Generate equipment based on class
    equipment = ["Adventurer's Pack", "Bedroll", "Tinderbox", "10 Torches"]
    
    if character_class == "Fighter":
        equipment.extend(["Longsword", "Shield", "Chain Mail"])
    elif character_class == "Wizard":
        equipment.extend(["Spellbook", "Component Pouch", "Quarterstaff"])
    elif character_class == "Cleric":
        equipment.extend(["Mace", "Scale Mail", "Shield", "Holy Symbol"])
    elif character_class == "Rogue":
        equipment.extend(["Shortsword", "Shortbow", "Leather Armor", "Thieves' Tools"])
    # Add more for other classes...
    
    # Add spells if applicable
    spells = {}
    spell_classes = ["Wizard", "Cleric", "Bard", "Druid", "Sorcerer", "Warlock", "Paladin", "Ranger"]
    
    if character_class in spell_classes:
        class_name_lower = character_class.lower()
        spells = get_fallback_spells(class_name_lower, level)
    
    # Generate description
    description = f"A level {level} {race} {character_class} with a {background} background"
    
    # Format the NPC data structure
    npc = {
        "name": f"{race} {character_class}",  # Generic name
        "description": description,
        "level": level,
        "race": race,
        "class": character_class,
        "background": background,
        "attributes": attributes,
        "modifiers": modifiers,
        "abilities": abilities,
        "equipment": equipment,
        "hp": hp,
        "ca": ac,
    }
    
    # Add spells if any
    if spells:
        npc["spells"] = spells
    
    return npc

def handle_generate_npc(request_data):
    """Handle API requests to generate NPCs"""
    print("Received request data:", request_data)
    level = request_data.get("level", 1)
    attributes_method = request_data.get("attributes_method", "standard_array")
    manual = request_data.get("manual", False)
    race = request_data.get("race", None)
    character_class = request_data.get("character_class", None)
    background = request_data.get("background", None)
    
    return generate_npc(level, attributes_method, manual, race, character_class)

# Example usage
if __name__ == "__main__":
    # Test the NPC generator
    test_request = {
        "level": 3,
        "attributes_method": "standard_array",
        "manual": False
    }
    
    result = handle_generate_npc(test_request)
    print(json.dumps(result, indent=2))