#!/usr/bin/env python3
import random
import requests
import json
import traceback

class DndApiClient:
    BASE_URL = "https://www.dnd5eapi.co/api"

    @classmethod
    def _get_request(cls, endpoint):
        try:
            response = requests.get(f"{cls.BASE_URL}{endpoint}")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API Error calling {cls.BASE_URL}{endpoint}: {e}")
            return None

    @classmethod
    def get_classes(cls):
        data = cls._get_request("/classes")
        return data.get("results", []) if data else []

    @classmethod
    def get_class_details(cls, class_index):
        if not class_index: return None
        return cls._get_request(f"/classes/{class_index.lower()}")

    @classmethod
    def get_races(cls):
        data = cls._get_request("/races")
        return data.get("results", []) if data else []

    @classmethod
    def get_race_details(cls, race_index):
        if not race_index: return None
        return cls._get_request(f"/races/{race_index.lower()}")

    @classmethod
    def get_backgrounds(cls):
        return cls.get_fallback_backgrounds()

    @classmethod
    def get_fallback_backgrounds(cls):
        return [
            {"index": "acolyte", "name": "Acolyte"}, {"index": "charlatan", "name": "Charlatan"},
            {"index": "criminal", "name": "Criminal"}, {"index": "entertainer", "name": "Entertainer"},
            {"index": "folk-hero", "name": "Folk Hero"}, {"index": "guild-artisan", "name": "Guild Artisan"},
            {"index": "hermit", "name": "Hermit"}, {"index": "noble", "name": "Noble"},
            {"index": "outlander", "name": "Outlander"}, {"index": "sage", "name": "Sage"},
            {"index": "sailor", "name": "Sailor"}, {"index": "soldier", "name": "Soldier"},
            {"index": "urchin", "name": "Urchin"}
        ]

    @classmethod
    def get_spells_by_class(cls, class_index, level=None):
        if not class_index: return []
        endpoint = f"/classes/{class_index.lower()}/spells"
        if level is not None:
            endpoint += f"?level={level}"
        data = cls._get_request(endpoint)
        return data.get("results", []) if data else []

    @classmethod
    def get_class_level_info(cls, class_index, level):
        if not class_index: return None
        return cls._get_request(f"/classes/{class_index.lower()}/levels/{level}")

def generate_attributes(method="standard_array", class_name_index=None):
    attributes = {"strength": 8, "dexterity": 8, "constitution": 8, "intelligence": 8, "wisdom": 8, "charisma": 8}
    safe_class_name_index = class_name_index.lower() if class_name_index else None
    class_priorities = {
        "barbarian": ["strength", "constitution"], "bard": ["charisma", "dexterity"],
        "cleric": ["wisdom", "constitution"], "druid": ["wisdom", "constitution"],
        "fighter": ["strength", "constitution"], "monk": ["dexterity", "wisdom"],
        "paladin": ["strength", "charisma"], "ranger": ["dexterity", "wisdom"],
        "rogue": ["dexterity", "intelligence"], "sorcerer": ["charisma", "constitution"],
        "warlock": ["charisma", "constitution"], "wizard": ["intelligence", "constitution"]
    }
    priorities = class_priorities.get(safe_class_name_index, random.sample(list(attributes.keys()), 2))
    secondary = [attr for attr in attributes.keys() if attr not in priorities]
    random.shuffle(secondary)

    if method == "standard_array":
        values = [15, 14, 13, 12, 10, 8]
        attributes[priorities[0]] = values.pop(0)
        attributes[priorities[1]] = values.pop(0)
        random.shuffle(values)
        for i, attr in enumerate(secondary):
            attributes[attr] = values[i]
    elif method == "roll":
        for attr_key in attributes.keys():
            rolls = sorted([random.randint(1, 6) for _ in range(4)])
            attributes[attr_key] = sum(rolls[1:])
        if safe_class_name_index and priorities and attributes.get(priorities[0], 0) < 13:
            while attributes.get(priorities[0], 0) < 13:
                 attributes[priorities[0]] = sum(sorted([random.randint(1, 6) for _ in range(4)])[1:])
    elif method == "point_buy":
        points = 27
        for p_attr in priorities:
            target_scores = [13, 15] if p_attr == priorities[0] else [13, 14]
            for target_score in target_scores:
                while attributes[p_attr] < target_score and points > 0:
                    current_val = attributes[p_attr]
                    cost_to_inc = 1 if current_val < 13 else 2
                    if current_val < 15 and points >= cost_to_inc:
                        attributes[p_attr] += 1
                        points -= cost_to_inc
                    else: break
        attr_keys = list(attributes.keys())
        random.shuffle(attr_keys)
        while points > 0:
            spent_this_round = False
            for attr_to_increase in attr_keys:
                current_val = attributes[attr_to_increase]
                cost_to_inc = 1 if current_val < 13 else 2
                if current_val < 15 and points >= cost_to_inc:
                    attributes[attr_to_increase] += 1
                    points -= cost_to_inc
                    spent_this_round = True
                    break
            if not spent_this_round: break
    else:
        print(f"Método de atributos \'{method}\' não reconhecido. Usando 'standard_array'.")
        values = [15, 14, 13, 12, 10, 8]
        attributes[priorities[0]] = values.pop(0)
        attributes[priorities[1]] = values.pop(0)
        random.shuffle(values)
        for i, attr in enumerate(secondary):
            attributes[attr] = values[i]
    return attributes

def apply_racial_bonuses(attributes, race_details):
    if not race_details or not race_details.get("ability_bonuses"): return attributes.copy()
    modified_attributes = attributes.copy()
    for bonus in race_details["ability_bonuses"]:
        ability_name = bonus.get("ability_score", {}).get("index")
        bonus_value = bonus.get("bonus", 0)
        if ability_name and ability_name in modified_attributes:
            modified_attributes[ability_name] += bonus_value
    return modified_attributes

def calculate_modifiers(attributes):
    return {attr: (value - 10) // 2 for attr, value in attributes.items()}

def calculate_hp(class_name_index, level, constitution_modifier):
    safe_class_idx = class_name_index.lower() if class_name_index else "fighter"
    hit_dice_map = {
        "barbarian": 12, "fighter": 10, "paladin": 10, "ranger": 10,
        "bard": 8, "cleric": 8, "druid": 8, "monk": 8, "rogue": 8, "warlock": 8,
        "sorcerer": 6, "wizard": 6 }
    hit_die = hit_dice_map.get(safe_class_idx, 8)
    hp = hit_die + constitution_modifier
    if level > 1:
        for _ in range(1, level):
            hp += max(1, (hit_die // 2) + 1 + constitution_modifier)
    return max(1, int(hp))

def calculate_ac(attributes, class_name_index, equipment_list):
    safe_class_idx = class_name_index.lower() if class_name_index else "fighter"
    modifiers = calculate_modifiers(attributes)
    dex_mod = modifiers["dexterity"]
    base_ac = 10 + dex_mod
    current_ac = base_ac
    armor_type = None
    has_shield = False

    if equipment_list:
        for item_name in equipment_list:
            item_lower = item_name.lower()
            if "shield" in item_lower: has_shield = True
            if "plate" in item_lower: armor_type = "heavy_plate"; break
            if "chain mail" in item_lower: armor_type = "heavy_chainmail"; break
            if "scale mail" in item_lower: armor_type = "medium_scale"; break
            if "hide" in item_lower: armor_type = "medium_hide"; break
            if "studded leather" in item_lower: armor_type = "light_studded"; break
            if "leather" in item_lower: armor_type = "light_leather"; 
    
    if safe_class_idx == "monk":
        current_ac = 10 + dex_mod + modifiers["wisdom"]
    elif safe_class_idx == "barbarian" and not armor_type:
        current_ac = 10 + dex_mod + modifiers["constitution"]
    else:
        if armor_type == "light_leather": current_ac = 11 + dex_mod
        elif armor_type == "light_studded": current_ac = 12 + dex_mod
        elif armor_type == "medium_hide": current_ac = 12 + min(2, dex_mod)
        elif armor_type == "medium_scale": current_ac = 14 + min(2, dex_mod)
        elif armor_type == "heavy_chainmail": current_ac = 16
        elif armor_type == "heavy_plate": current_ac = 18
        elif not armor_type:
            if safe_class_idx in ["wizard", "sorcerer"]: pass 
            elif safe_class_idx in ["rogue", "ranger", "bard"]: current_ac = max(current_ac, 11 + dex_mod)
            elif safe_class_idx == "druid" and not any(m in "".join(equipment_list).lower() for m in ["metal", "chain", "plate"]): current_ac = max(current_ac, 11 + dex_mod)
            elif safe_class_idx == "cleric": current_ac = max(current_ac, 14 + min(2, dex_mod))
            elif safe_class_idx in ["fighter", "paladin"]: current_ac = max(current_ac, 16)

    if has_shield: current_ac += 2
    return current_ac

def get_class_features(class_details, level):
    features = []
    if not class_details: return features
    class_index = class_details.get("index")
    if not class_index: return features
    class_level_info = DndApiClient.get_class_level_info(class_index, level)
    if class_level_info and isinstance(class_level_info, list): # API returns a list of all levels up to requested
        for lvl_info in class_level_info:
            if lvl_info.get("level", 0) <= level:
                 for feature_item in lvl_info.get("features", []):
                    if feature_item.get("name") not in features:
                        features.append(feature_item.get("name", "Unknown Feature"))
    elif class_level_info: # If it's a single level object (older API behavior or specific level call)
        for feature_item in class_level_info.get("features", []):
            if feature_item.get("name") not in features:
                features.append(feature_item.get("name", "Unknown Feature"))
    return list(set(features))

def select_equipment(class_details, background_index):
    equipment = ["Adventurer's Pack", "Clothes, common"]
    class_name_index = class_details.get("index", "").lower() if class_details else ""
    if class_name_index == "barbarian": equipment.extend(["Greataxe", "Handaxe (2)", "Javelin (4)"])
    elif class_name_index == "bard": equipment.extend(["Rapier", "Lute", "Leather Armor", "Dagger"])
    elif class_name_index == "cleric": equipment.extend(["Mace", "Scale Mail", "Shield", "Holy Symbol"])
    elif class_name_index == "druid": equipment.extend(["Scimitar", "Leather Armor", "Explorer's Pack", "Druidic Focus"])
    elif class_name_index == "fighter": equipment.extend(["Longsword", "Shield", "Chain Mail", "Light Crossbow and 20 bolts"])
    elif class_name_index == "monk": equipment.extend(["Shortsword", "10 Darts"])
    elif class_name_index == "paladin": equipment.extend(["Longsword", "Shield", "Chain Mail", "Holy Symbol"])
    elif class_name_index == "ranger": equipment.extend(["Shortsword (2)", "Longbow and Quiver of 20 Arrows", "Leather Armor"])
    elif class_name_index == "rogue": equipment.extend(["Rapier", "Shortbow and Quiver of 20 Arrows", "Leather Armor", "Thieves' Tools"])
    elif class_name_index == "sorcerer": equipment.extend(["Light Crossbow and 20 bolts", "Arcane Focus", "Dagger (2)"])
    elif class_name_index == "warlock": equipment.extend(["Light Crossbow and 20 bolts", "Arcane Focus", "Leather Armor", "Dagger (2)"])
    elif class_name_index == "wizard": equipment.extend(["Quarterstaff", "Arcane Focus", "Spellbook", "Dagger"])

    if background_index == "acolyte": equipment.extend(["Holy Symbol (gift)", "Prayer Book", "5 sticks of Incense", "Vestments"])
    elif background_index == "criminal": equipment.extend(["Crowbar", "Dark common clothes with hood"])
    elif background_index == "noble": equipment.extend(["Set of fine clothes", "Signet ring", "Scroll of pedigree"])
    elif background_index == "sage": equipment.extend(["Bottle of black ink", "Quill", "Small knife", "Letter from dead colleague"])
    elif background_index == "soldier": equipment.extend(["Insignia of rank", "Trophy from fallen enemy", "Set of bone dice or deck of cards"])
    return list(set(equipment))

def select_spells(class_name_index, level, class_details, attributes):
    if not class_name_index or not class_details: return {}
    safe_class_idx = class_name_index.lower()
    spellcasting_info = class_details.get("spellcasting")
    if not spellcasting_info: return {}
    spells_by_level_dict = {}
    max_spell_slot_level = 0
    cantrips_known = 0
    class_level_info = DndApiClient.get_class_level_info(safe_class_idx, level)

    if class_level_info: # API /classes/{index}/levels/{level} is the most reliable source
        # This endpoint returns data for ONLY the specified level, not cumulative.
        # We need to iterate up to the character's level to get all spell slots and cantrips known.
        # However, for simplicity in this call, we'll use the direct level info for slots at THIS level.
        # Cantrips known and max spell level are usually on the class progression table.
        spellcasting_at_level = class_level_info.get("spellcasting", {})
        for i in range(1, 10):
            if spellcasting_at_level.get(f"spell_slots_level_{i}", 0) > 0: max_spell_slot_level = i
        
        # For cantrips_known, it's better to check the specific level info if available.
        # If not, use a general progression.
        # The /levels/{level} endpoint should provide cantrips_known for that specific level's progression.
        if "cantrips_known" in spellcasting_at_level:
            cantrips_known = spellcasting_at_level.get("cantrips_known", 0)
        else: # Fallback if not in specific level data (e.g. some classes gain at earlier levels)
            full_class_level_info_list = DndApiClient.get_class_level_info(safe_class_idx, "") # Get all levels
            if full_class_level_info_list:
                for l_info in full_class_level_info_list:
                    if l_info.get("level",0) <= level and "cantrips_known" in l_info.get("spellcasting",{}):
                        cantrips_known = max(cantrips_known, l_info.get("spellcasting",{}).get("cantrips_known",0))

    if cantrips_known == 0: # Fallback if API didn't provide it
        if safe_class_idx == "wizard": cantrips_known = 3 if level == 1 else (4 if level >=4 else 3)
        elif safe_class_idx == "sorcerer": cantrips_known = 4
        elif safe_class_idx in ["bard","cleric","druid","warlock"]: cantrips_known = 2 if level < 4 else (3 if level < 10 else 4)
    
    if max_spell_slot_level == 0: # Fallback for max spell slot level
        if safe_class_idx in ["bard", "cleric", "druid", "sorcerer", "wizard"]: max_spell_slot_level = min(9, (level + 1) // 2)
        elif safe_class_idx in ["paladin", "ranger"]: max_spell_slot_level = min(5, (level - 1) // 4 + 1) if level >= 2 else 0
        elif safe_class_idx == "warlock": 
            pact_magic_info = next((lvl_info.get("spellcasting") for lvl_info in DndApiClient.get_class_level_info(safe_class_idx, "") or [] if lvl_info.get("level") == level), None)
            if pact_magic_info: max_spell_slot_level = pact_magic_info.get("spell_slot_level",0)
            else: # Simplified fallback for warlock slot level
                if level >= 9: max_spell_slot_level = 5
                elif level >= 7: max_spell_slot_level = 4
                # ... and so on

    all_learnable_spells = DndApiClient.get_spells_by_class(safe_class_idx)
    if not all_learnable_spells and spellcasting_info: return get_fallback_spells(safe_class_idx, level)
    if cantrips_known > 0:
        cantrips = [s for s in all_learnable_spells if s.get("level") == 0]
        if cantrips: spells_by_level_dict["level_0"] = [s["name"] for s in random.sample(cantrips, min(cantrips_known, len(cantrips)))]
    
    # Number of spells known/prepared (simplified)
    spellcasting_ability_mod = calculate_modifiers(attributes).get(spellcasting_info.get("spellcasting_ability",{}).get("index"), 0)
    num_spells_to_select = 1 # Default
    if safe_class_idx in ["cleric", "druid", "paladin"]: # Prepared casters
        num_spells_to_select = max(1, spellcasting_ability_mod + level // (2 if safe_class_idx == "paladin" else 1) )
    elif safe_class_idx == "wizard":
        num_spells_to_select = max(1, spellcasting_ability_mod + level) # Represents spellbook size, selects a few
    # Known casters (Bard, Sorcerer, Warlock, Ranger) have fixed numbers from class table, hard to get easily from API here
    # So we'll simplify and pick a few per spell level.

    for spell_l in range(1, max_spell_slot_level + 1):
        spells_at_this_level = [s for s in all_learnable_spells if s.get("level") == spell_l]
        if spells_at_this_level:
            # For known casters, this is very simplified. For prepared, it's a subset of what they can prepare.
            count = 1 if safe_class_idx not in ["cleric", "druid", "paladin", "wizard"] else num_spells_to_select // max(1,max_spell_slot_level) 
            count = max(1, min(count, len(spells_at_this_level))) # Ensure at least 1 if possible, and not more than available
            selected_spells = random.sample(spells_at_this_level, count)
            if selected_spells:
                spells_by_level_dict[f"level_{spell_l}"] = [s["name"] for s in selected_spells]

    if not spells_by_level_dict and spellcasting_info : return get_fallback_spells(safe_class_idx, level)
    return spells_by_level_dict

def get_fallback_spells(class_name_index, level):
    fb_spells = {"wizard": {"level_0": ["Light", "Ray of Frost"], "level_1": ["Magic Missile"]},
                 "sorcerer": {"level_0": ["Fire Bolt", "Acid Splash"], "level_1": ["Shield"]},
                 "bard": {"level_0": ["Vicious Mockery", "Mage Hand"], "level_1": ["Healing Word"]}}
    return fb_spells.get(class_name_index.lower(), {})

def generate_npc(level=1, attribute_method="standard_array",
                 manual_race_index=None,
                 manual_class_index=None,
                 manual_background_index=None):
    try:
        available_classes = DndApiClient.get_classes()
        available_races = DndApiClient.get_races()
        available_backgrounds = DndApiClient.get_backgrounds()

        if not available_classes or not available_races:
            print("Falha crítica ao buscar dados básicos da API. Usando fallback completo.")
            return generate_fallback_npc(level, attribute_method, manual_race_index, manual_class_index, manual_background_index)

        final_class_data = None
        if manual_class_index and available_classes:
            mci_lower = manual_class_index.lower()
            match = next((c for c in available_classes if c["index"].lower() == mci_lower), None)
            if not match: match = next((c for c in available_classes if c["name"].lower() == mci_lower), None)
            if match: final_class_data = match
            else: print(f"INFO: Classe manual \'{manual_class_index}\' não encontrada. Selecionando aleatoriamente.")
        if not final_class_data and available_classes: final_class_data = random.choice(available_classes)
        elif not final_class_data and not available_classes: # Should not happen if first check passed
             print("ERRO: Nenhuma classe para selecionar."); return generate_fallback_npc(level, attribute_method, manual_race_index, "fighter", manual_background_index)
        
        final_race_data = None
        if manual_race_index and available_races:
            mri_lower = manual_race_index.lower()
            match = next((r for r in available_races if r["index"].lower() == mri_lower), None)
            if not match: match = next((r for r in available_races if r["name"].lower() == mri_lower), None)
            if match: final_race_data = match
            else: print(f"INFO: Raça manual \'{manual_race_index}\' não encontrada. Selecionando aleatoriamente.")
        if not final_race_data and available_races: final_race_data = random.choice(available_races)
        elif not final_race_data and not available_races:
            print("ERRO: Nenhuma raça para selecionar."); return generate_fallback_npc(level, attribute_method, "human", final_class_data['index'] if final_class_data else "fighter" , manual_background_index)

        final_background_data = None
        if manual_background_index and available_backgrounds:
            mbi_lower = manual_background_index.lower()
            match = next((b for b in available_backgrounds if b["index"].lower() == mbi_lower), None)
            if not match: match = next((b for b in available_backgrounds if b["name"].lower() == mbi_lower), None)
            if match: final_background_data = match
            else: print(f"INFO: Background manual \'{manual_background_index}\' não encontrado. Selecionando aleatoriamente.")
        if not final_background_data and available_backgrounds: final_background_data = random.choice(available_backgrounds)
        elif not final_background_data and not available_backgrounds: # Should not happen
            print("ERRO: Nenhum background para selecionar."); final_background_data = {"index":"acolyte", "name":"Acolyte"} # Hard fallback

        # Ensure we have data before proceeding
        if not final_class_data or not final_race_data or not final_background_data:
            print("ERRO: Falha em determinar classe, raça ou background. Usando fallback completo.")
            return generate_fallback_npc(level, attribute_method, 
                                       final_race_data['index'] if final_race_data else None,
                                       final_class_data['index'] if final_class_data else None,
                                       final_background_data['index'] if final_background_data else None)

        class_details = DndApiClient.get_class_details(final_class_data["index"])
        race_details = DndApiClient.get_race_details(final_race_data["index"])

        if not class_details or not race_details:
            print(f"Falha ao obter detalhes da API para classe/raça. Usando fallback.")
            return generate_fallback_npc(level, attribute_method, final_race_data["index"], final_class_data["index"], final_background_data["index"])
        
        current_class_idx = class_details["index"]
        attributes_base = generate_attributes(attribute_method, current_class_idx)
        attributes_final = apply_racial_bonuses(attributes_base, race_details)
        modifiers = calculate_modifiers(attributes_final)
        
        equipment = select_equipment(class_details, final_background_data["index"])
        spells = select_spells(current_class_idx, level, class_details, attributes_final)
        hp = calculate_hp(current_class_idx, level, modifiers["constitution"])
        ac = calculate_ac(attributes_final, current_class_idx, equipment)
        features = get_class_features(class_details, level)
        
        npc = {
            "name": f"{race_details.get('name', 'N/A')} {class_details.get('name', 'N/A')}",
            "description": f"A level {level} {race_details.get('name', 'N/A')} {class_details.get('name', 'N/A')} with a {final_background_data.get('name', 'N/A')} background.",
            "level": level,
            "race": race_details.get('name', 'N/A'),
            "class": class_details.get('name', 'N/A'),
            "background": final_background_data.get('name', 'N/A'),
            "attributes": attributes_final,
            "modifiers": modifiers,
            "abilities": features,
            "equipment": equipment,
            "hp": hp,
            "ac": ac,
            "spells": spells if spells else {}
        }
        return npc

    except Exception as e:
        print(f"Erro inesperado em generate_npc: {e}")
        traceback.print_exc()
        return generate_fallback_npc(level, attribute_method, manual_race_index, manual_class_index, manual_background_index)

def generate_fallback_npc(level=1, attribute_method="standard_array", 
                          manual_race_idx=None, manual_class_idx=None, manual_background_idx=None):
    print("Usando gerador de NPC fallback.")
    race_name = (manual_race_idx or "human").capitalize()
    class_name = (manual_class_idx or "fighter").capitalize()
    background_name = (manual_background_idx or "acolyte").capitalize()
    class_idx_for_attrs = class_name.lower()

    attributes = generate_attributes(attribute_method, class_idx_for_attrs)
    if race_name == "Human": attributes = {k: v + 1 for k, v in attributes.items()}
    elif race_name == "Dwarf": attributes["constitution"] = attributes.get("constitution", 0) + 2
    
    modifiers = calculate_modifiers(attributes)
    hp = calculate_hp(class_idx_for_attrs, level, modifiers["constitution"])
    ac = 10 + modifiers["dexterity"]
    if class_idx_for_attrs in ["fighter", "paladin"]: ac = max(ac, 16)

    return {
        "name": f"{race_name} {class_name} (Fallback)",
        "description": f"Level {level} {race_name} {class_name} with {background_name} background. (Fallback)",
        "level": level, "race": race_name, "class": class_name, "background": background_name,
        "attributes": attributes, "modifiers": modifiers, "abilities": ["Fallback Feature"],
        "equipment": ["Fallback Gear"], "hp": hp, "ac": ac,
        "spells": get_fallback_spells(class_idx_for_attrs, level)
    }

def handle_generate_npc(request_data):
    print(f"\nProcessando requisição: {request_data}")
    level = request_data.get("level", 1)
    raw_attributes_method = str(request_data.get("attributes_method", "standard_array")).lower().strip()
    attribute_method_map = {
        "roll": "roll", "rolagem": "roll", "rolar dados": "roll",
        "standard_array": "standard_array", "standard": "standard_array", "padrão": "standard_array", "padrao": "standard_array", "array padrão": "standard_array",
        "point_buy": "point_buy", "compra de pontos": "point_buy", "pontos": "point_buy"
    }
    attributes_method = attribute_method_map.get(raw_attributes_method, "standard_array")
    if raw_attributes_method not in attribute_method_map and raw_attributes_method != "standard_array":
        print(f"Método de atributos \'{request_data.get('attributes_method')}\' não reconhecido. Usando \'{attributes_method}\'.")

    # Mapeamento de nomes em português para inglês
    class_pt_to_en = {
        "bárbaro": "barbarian", "barbaro": "barbarian",
        "bardo": "bard",
        "clérigo": "cleric", "clerigo": "cleric",
        "druida": "druid",
        "guerreiro": "fighter",
        "monge": "monk",
        "paladino": "paladin",
        "patrulheiro": "ranger",
        "ladino": "rogue", "ladião": "rogue",
        "feiticeiro": "sorcerer",
        "bruxo": "warlock",
        "mago": "wizard"
    }
    
    race_pt_to_en = {
        "humano": "human", "humana": "human",
        "anão": "dwarf", "anao": "dwarf", "anã": "dwarf",
        "elfo": "elf", "elfa": "elf",
        "halfling": "halfling",
        "meio-elfo": "half-elf", "meio elfo": "half-elf",
        "meio-orc": "half-orc", "meio orc": "half-orc",
        "tiefling": "tiefling",
        "gnomo": "gnome"
    }
    
    background_pt_to_en = {
        "acólito": "acolyte", "acolito": "acolyte",
        "charlatão": "charlatan", "charlatao": "charlatan",
        "criminoso": "criminal",
        "artista": "entertainer",
        "herói do povo": "folk-hero", "heroi do povo": "folk-hero",
        "artesão da guilda": "guild-artisan", "artesao da guilda": "guild-artisan",
        "eremita": "hermit",
        "nobre": "noble",
        "forasteiro": "outlander",
        "sábio": "sage", "sabio": "sage",
        "marinheiro": "sailor",
        "soldado": "soldier",
        "órfão": "urchin", "orfao": "urchin"
    }

    manual_race = request_data.get("race")
    manual_class = request_data.get("class") or request_data.get("character_class") 
    manual_background = request_data.get("background")
    
    # Converter nomes em português para inglês
    if manual_race:
        manual_race = race_pt_to_en.get(manual_race.lower(), manual_race)
    if manual_class:
        manual_class = class_pt_to_en.get(manual_class.lower(), manual_class)
    if manual_background:
        manual_background = background_pt_to_en.get(manual_background.lower(), manual_background)
    
    return generate_npc(level, attributes_method,
                        manual_race_index=manual_race,
                        manual_class_index=manual_class,
                        manual_background_index=manual_background)

if __name__ == "__main__":
    test_payloads = [
        {
            "name": "Payload do Usuário - Bard",
            "payload": {"level": 3, "attributes_method": "roll", "character_class": "Bard", "manual": True}
        },
        {
            "name": "Feiticeiro com Rolagem (Português)",
            "payload": {"level": 1, "attributes_method": "rolagem", "character_class": "Sorcerer"}
        },
        {
            "name": "Guerreiro Humano Padrão",
            "payload": {"level": 5, "attributes_method": "standard", "character_class": "Fighter", "race": "Human", "background": "Soldier"}
        },
        {
            "name": "Ladino Halfling por Pontos",
            "payload": {"level": 2, "attributes_method": "compra de pontos", "character_class": "Rogue", "race": "halfling", "background": "criminal"}
        },
        {
            "name": "Aleatório Nível 1",
            "payload": {"level": 1}
        },
        {
            "name": "Classe Inválida",
            "payload": {"level": 1, "character_class": "SuperProgramador"}
        }
    ]

    for test in test_payloads:
        print(f"--- Testando: {test['name']} ---")
        result = handle_generate_npc(test['payload'])
        print(json.dumps(result, indent=2))
        if test['payload'].get('character_class') and 'class' in result and result['class'] != 'N/A':
            expected_class = test['payload']['character_class']
            # Normalize expected class name for comparison (e.g. API returns 'Bard' for 'bard')
            # This is tricky because the API name might differ slightly from input if input was index
            # For now, a simple check if the result class contains the input class (case-insensitive)
            if expected_class.lower() not in result['class'].lower() and result['class'].lower() not in expected_class.lower():
                 # If the expected class was not found and a random one was picked, this is fine if an INFO message was printed.
                 # For this test, we'll be more strict if the class was valid.
                 valid_classes_indices = [c['index'] for c in DndApiClient.get_classes()]
                 valid_classes_names = [c['name'] for c in DndApiClient.get_classes()]
                 if expected_class.lower() in valid_classes_indices or expected_class.lower() in (n.lower() for n in valid_classes_names):
                    print(f"ALERTA DE TESTE: Classe esperada era '{expected_class}', mas obteve '{result['class']}'")
        print("-------------------------")

