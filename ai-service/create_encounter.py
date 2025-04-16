import random
import requests
import json
import math

# Constants based on D&D 5e encounter building guidelines
XP_THRESHOLDS = {
    # Level: [Easy, Medium, Hard, Deadly]
    1: [25, 50, 75, 100],
    2: [50, 100, 150, 200],
    3: [75, 150, 225, 400],
    4: [125, 250, 375, 500],
    5: [250, 500, 750, 1100],
    6: [300, 600, 900, 1400],
    7: [350, 750, 1100, 1700],
    8: [450, 900, 1400, 2100],
    9: [550, 1100, 1600, 2400],
    10: [600, 1200, 1900, 2800],
    11: [800, 1600, 2400, 3600],
    12: [1000, 2000, 3000, 4500],
    13: [1100, 2200, 3400, 5100],
    14: [1250, 2500, 3800, 5700],
    15: [1400, 2800, 4300, 6400],
    16: [1600, 3200, 4800, 7200],
    17: [2000, 3900, 5900, 8800],
    18: [2100, 4200, 6300, 9500],
    19: [2400, 4900, 7300, 10900],
    20: [2800, 5700, 8500, 12700]
}

# Encounter multipliers based on number of monsters
ENCOUNTER_MULTIPLIERS = {
    1: 1,
    2: 1.5,
    3: 2,
    6: 2.5,
    11: 3,
    15: 4
}

# Difficulty mappings
DIFFICULTY_MAP = {
    "e": 0,  # Easy
    "m": 1,  # Medium
    "d": 2,  # Hard
    "mo": 3  # Deadly/Mortal
}

# Theme mappings to monster types
THEME_TYPES = {
    "Goblinóides": ["goblin", "hobgoblin", "bugbear"],
    "Mortos-Vivos": ["undead", "zombie", "skeleton", "ghoul"],
    "Dragões": ["dragon"],
    "Demônios": ["fiend", "demon"],
    "Gigantes": ["giant"],
    "Humanoides": ["humanoid"],
    "Animais Mágicos": ["beast", "monstrosity"],
    "Aberrações": ["aberration"],
    "Elementais": ["elemental"],
    "Fadas": ["fey"],
    "Constructos": ["construct"]
}

class DndApiClient:
    """Client for interacting with the D&D 5e API"""
    
    BASE_URL = "https://www.dnd5eapi.co/api/2014"
    
    @classmethod
    def get_monsters(cls, limit=100):
        """Get a list of monsters from the API"""
        response = requests.get(f"{cls.BASE_URL}/monsters?limit={limit}")
        if response.status_code == 200:
            return response.json()["results"]
        return []
    
    @classmethod
    def get_monster_details(cls, monster_index):
        """Get detailed information about a specific monster"""
        response = requests.get(f"{cls.BASE_URL}/monsters/{monster_index}")
        if response.status_code == 200:
            return response.json()
        return None
    
    @classmethod
    def get_cached_monsters(cls):
        """Get or create cached monster data for faster access"""
        # In a real implementation, you'd check if a cache file exists first
        try:
            # Try to load from cache file
            with open("monster_cache.json", "r") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            # If cache doesn't exist, fetch and create it
            monsters = cls.get_monsters(limit=1000)  # Get as many as possible
            monster_data = []
            
            for monster in monsters:
                details = cls.get_monster_details(monster["index"])
                if details:
                    cr = details.get("challenge_rating", 0)
                    xp = details.get("xp", 0)
                    monster_type = details.get("type", "unknown")
                    
                    monster_data.append({
                        "index": monster["index"],
                        "name": monster["name"],
                        "cr": cr,
                        "xp": xp,
                        "type": monster_type
                    })
            
            # Save to cache
            with open("monster_cache.json", "w") as f:
                json.dump(monster_data, f)
            
            return monster_data


def get_encounter_multiplier(num_monsters):
    """Get the encounter multiplier based on the number of monsters"""
    for threshold, multiplier in sorted(ENCOUNTER_MULTIPLIERS.items(), reverse=True):
        if num_monsters >= threshold:
            return multiplier
    return 1  # Default multiplier for 1 monster

def calculate_adjusted_xp(monsters, party_size):
    """Calculate the adjusted XP for a group of monsters"""
    total_xp = sum(monster["xp"] for monster in monsters)
    
    # Apply multiplier based on number of monsters and party size
    multiplier = get_encounter_multiplier(len(monsters))
    
    # Adjust multiplier based on party size (optional rule)
    if party_size < 3:
        multiplier *= 1.5
    elif party_size > 5:
        multiplier *= 0.5
    
    return int(total_xp * multiplier)

def get_target_xp(player_level, player_count, difficulty):
    """Get the target XP for the encounter based on party composition and difficulty"""
    difficulty_index = DIFFICULTY_MAP.get(difficulty, 1)  # Default to Medium
    xp_per_player = XP_THRESHOLDS[player_level][difficulty_index]
    return xp_per_player * player_count

def filter_monsters_by_theme(monsters, theme):
    """Filter monsters by the selected theme"""
    if theme not in THEME_TYPES:
        return monsters
    
    valid_types = THEME_TYPES[theme]
    return [m for m in monsters if any(t in m["type"].lower() for t in valid_types)]

def filter_monsters_by_cr(monsters, min_cr, max_cr):
    """Filter monsters by challenge rating range"""
    return [m for m in monsters if min_cr <= m["cr"] <= max_cr]

def generate_encounter(player_level, player_count, difficulty="m"):
    """Generate a balanced encounter for the given party"""
    # Validate input
    if player_level < 1 or player_level > 20:
        return {"error": "Player level must be between 1 and 20"}
    
    if player_count < 1:
        return {"error": "Player count must be at least 1"}
    
    if difficulty not in DIFFICULTY_MAP:
        difficulty = "m"  # Default to Medium
    
    # Calculate target XP
    target_xp = get_target_xp(player_level, player_count, difficulty)
    
    # Get available monsters
    try:
        all_monsters = DndApiClient.get_cached_monsters()
    except Exception as e:
        # Fallback to hardcoded data if API/cache fails
        return generate_fallback_encounter(player_level, player_count, difficulty)
    
    # Choose a random theme
    theme = random.choice(list(THEME_TYPES.keys()))
    
    # Filter monsters by theme
    themed_monsters = filter_monsters_by_theme(all_monsters, theme)
    if not themed_monsters:
        themed_monsters = all_monsters  # If no monsters match theme, use all
    
    # Determine appropriate CR range for this party level
    # For balanced encounters, monsters should typically be within ±2 CR of party level
    min_cr = max(0, player_level - 2) / 4  # Convert to CR (roughly)
    max_cr = (player_level + 2) * 0.75  # Higher level parties can handle tougher monsters
    
    # Filter by CR range
    cr_filtered_monsters = filter_monsters_by_cr(themed_monsters, min_cr, max_cr)
    if not cr_filtered_monsters:
        # If no monsters in ideal CR range, widen the range
        cr_filtered_monsters = filter_monsters_by_cr(themed_monsters, 0, max_cr * 2)
        if not cr_filtered_monsters:
            cr_filtered_monsters = themed_monsters  # Last resort
    
    # Generate the encounter
    encounter_monsters = []
    current_xp = 0
    attempts = 0
    max_attempts = 100  # Prevent infinite loops
    
    while current_xp < target_xp and attempts < max_attempts:
        # Select a random monster from our filtered list
        monster = random.choice(cr_filtered_monsters)
        
        # Add monster to encounter
        encounter_monsters.append({
            "name": monster["name"],
            "cr": monster["cr"],
            "xp": monster["xp"]
        })
        
        # Recalculate the adjusted XP
        current_xp = calculate_adjusted_xp(encounter_monsters, player_count)
        
        # If we've exceeded the target, try removing a monster to get closer
        if current_xp > target_xp * 1.5 and len(encounter_monsters) > 1:
            # Remove a random monster
            encounter_monsters.pop(random.randrange(len(encounter_monsters)))
            current_xp = calculate_adjusted_xp(encounter_monsters, player_count)
        
        attempts += 1
    
    # Return the encounter
    return {
        "theme": theme,
        "difficulty": difficulty,
        "total_xp": current_xp,
        "player_level": player_level,
        "player_count": player_count,
        "monsters": encounter_monsters
    }

def generate_fallback_encounter(player_level, player_count, difficulty):
    """Fallback encounter generator if the API isn't available"""
    # This uses a simplified version of the data in your original code
    monster_data = {
        "Goblinóides": [
            {"nome": "Goblin", "xp": 50, "cr": 1/4},
            {"nome": "Hobgoblin", "xp": 100, "cr": 1/2},
            {"nome": "Bugbear", "xp": 200, "cr": 1},
            {"nome": "Goblin Boss", "xp": 450, "cr": 2},
        ],
        "Mortos-Vivos": [
            {"nome": "Esqueleto", "xp": 50, "cr": 1/4},
            {"nome": "Zumbi", "xp": 50, "cr": 1/4},
            {"nome": "Esqueleto Guerreiro", "xp": 450, "cr": 2},
            {"nome": "Vampiro", "xp": 3900, "cr": 7},
            {"nome": "Lich", "xp": 18000, "cr": 21},
        ],
        "Dragões": [
            {"nome": "Dragão Jovem (Branco)", "xp": 2300, "cr": 6},
            {"nome": "Dragão Jovem (Verde)", "xp": 2900, "cr": 7},
            {"nome": "Dragão Adulto (Vermelho)", "xp": 18000, "cr": 17},
            {"nome": "Dragão Ancião (Azul)", "xp": 41000, "cr": 23},
        ],
        "Demônios": [
            {"nome": "Quasit", "xp": 100, "cr": 1},
            {"nome": "Barlgura", "xp": 3900, "cr": 7},
            {"nome": "Glabrezu", "xp": 11000, "cr": 13},
            {"nome": "Balor", "xp": 50000, "cr": 19},
        ],
        "Gigantes": [
            {"nome": "Ogro", "xp": 450, "cr": 2},
            {"nome": "Gigante das Colinas", "xp": 1800, "cr": 5},
            {"nome": "Gigante do Fogo", "xp": 5000, "cr": 9},
            {"nome": "Gigante das Nuvens", "xp": 11000, "cr": 13},
        ],
        "Humanoides": [
            {"nome": "Bandido", "xp": 25, "cr": 1/8},
            {"nome": "Mercenário", "xp": 100, "cr": 1/2},
            {"nome": "Cavaleiro", "xp": 700, "cr": 3},
            {"nome": "Arquimago", "xp": 11000, "cr": 12},
        ],
        "Animais Mágicos": [
            {"nome": "Urso Pardo", "xp": 200, "cr": 1},
            {"nome": "Grifo", "xp": 700, "cr": 3},
            {"nome": "Quimera", "xp": 2300, "cr": 6},
            {"nome": "Fênix", "xp": 18000, "cr": 16},
        ],
        "Aberrações": [
            {"nome": "Beholder", "xp": 18000, "cr": 13},
            {"nome": "Mind Flayer", "xp": 3900, "cr": 7},
            {"nome": "Aboleth", "xp": 11000, "cr": 10},
            {"nome": "Elder Brain", "xp": 50000, "cr": 20},
        ]
    }
    
    # Choose a random theme
    theme = random.choice(list(monster_data.keys()))
    
    # Calculate target XP
    target_xp = get_target_xp(player_level, player_count, difficulty)
    
    # Filter monsters by appropriate CR
    max_cr = player_level * 0.75
    available_monsters = [m for m in monster_data[theme] if m["cr"] <= max_cr * 1.5]
    
    if not available_monsters:
        available_monsters = monster_data[theme]
    
    # Generate encounter
    encounter_monsters = []
    current_xp = 0
    attempts = 0
    max_attempts = 20
    
    while current_xp < target_xp and attempts < max_attempts:
        monster = random.choice(available_monsters)
        encounter_monsters.append(monster)
        
        # Simple calculation for fallback
        current_xp = sum(m["xp"] for m in encounter_monsters)
        if len(encounter_monsters) > 1:
            current_xp = int(current_xp * 1.5)  # Simple multiplier
        
        attempts += 1
    
    return {
        "theme": theme,
        "difficulty": difficulty,
        "total_xp": current_xp,
        "player_level": player_level,
        "player_count": player_count,
        "monsters": encounter_monsters
    }

# API endpoint handler
def handle_generate_encounter(request_data):
    """Handle API requests to generate encounters"""
    player_level = request_data.get("player_level", 1)
    player_count = request_data.get("player_count", 4)
    difficulty = request_data.get("difficulty", "m")
    
    return generate_encounter(player_level, player_count, difficulty)


# Example usage
if __name__ == "__main__":
    # Test the encounter generator
    test_request = {
        "player_level": 3,
        "player_count": 4,
        "difficulty": "d"  # Hard difficulty
    }
    
    result = handle_generate_encounter(test_request)
    print(json.dumps(result, indent=2))