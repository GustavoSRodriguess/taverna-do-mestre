# app.py - Serviço Python para geração
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import json
import random

# Importa os módulos de geração
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from create_npc import generate_character, calculate_modifiers
from create_encounter import gerar_encontro, calcular_xp_total, escolher_tema

app = Flask(__name__)
CORS(app)

# Função para converter objetos Python em JSON serializável
def serialize_character(character):
    """Converte o personagem para um formato JSON serializável"""
    serialized = {
        "name": f"{character['Raça']} {character['Classe']}", # Nome genérico
        "description": f"Um {character['Raça']} {character['Classe']} de nível {character['Nível']}",
        "level": character["Nível"],
        "race": character["Raça"],
        "class": character["Classe"],
        "hp": character["HP"],
        "ac": character["CA"],
        "background": character["Antecedente"],
        "attributes": character["Atributos"],
        "modifiers": character["Modificadores"],
        "abilities": character["Habilidades"],
        "equipment": character["Equipamento"],
        "traits": character["Traço de Antecedente"],
        "character_type": "npc", # Por padrão, geramos NPCs
        "spells": {}
    }
    
    # Lidar com as magias, se existirem
    if "Magias" in character and character["Magias"]:
        serialized["spells"] = character["Magias"]
    
    return serialized

def serialize_encounter(encounter, xp_total, tema, dificuldade):
    """Converte o encontro para um formato JSON serializável"""
    serialized_monsters = []
    for monster in encounter:
        serialized_monsters.append({
            "name": monster["nome"],
            "xp": monster["xp"],
            "cr": float(monster["cr"])
        })
    
    return {
        "name": f"Encontro de {tema}",
        "theme": tema,
        "total_xp": xp_total,
        "difficulty": dificuldade,
        "monsters": serialized_monsters
    }

# Rotas para geração
@app.route('/generate/character', methods=['POST'])
def generate_char_api():
    """Gera um personagem com base nos parâmetros recebidos"""
    data = request.json
    level = data.get('level', 1)
    attributes_method = data.get('attributes_method', 'rolagem')
    manual = data.get('manual', False)
    
    # Validar dados
    if level < 1 or level > 20:
        return jsonify({"error": "Nível inválido. Use um nível entre 1 e 20."}), 400
    
    if attributes_method not in ['rolagem', 'array', 'compra']:
        attributes_method = 'rolagem'
    
    try:
        character = generate_character(level, attributes_method, manual)
        serialized = serialize_character(character)
        return jsonify(serialized)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/generate/encounter', methods=['POST'])
def generate_encounter_api():
    """Gera um encontro com base nos parâmetros recebidos"""
    data = request.json
    player_level = data.get('player_level', 1)
    number_of_players = data.get('number_of_players', 4)
    difficulty = data.get('difficulty', 'm')  # padrão: médio
    
    # Validar dados
    if player_level < 1 or player_level > 20:
        return jsonify({"error": "Nível inválido. Use um nível entre 1 e 20."}), 400
        
    if number_of_players < 1:
        return jsonify({"error": "Número de jogadores inválido."}), 400
        
    if difficulty not in ['f', 'm', 'd', 'mo']:
        return jsonify({"error": "Dificuldade inválida. Use f (fácil), m (médio), d (difícil) ou mo (mortal)."}), 400
    
    try:
        encontro, xp_total, tema = gerar_encontro(player_level, number_of_players, difficulty)
        
        # Mapeia os códigos de dificuldade para texto
        dificuldade_texto = {
            'f': 'fácil',
            'm': 'médio',
            'd': 'difícil',
            'mo': 'mortal'
        }
        
        serialized = serialize_encounter(encontro, xp_total, tema, dificuldade_texto[difficulty])
        return jsonify(serialized)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Iniciar o servidor
if __name__ == '__main__':
    port = os.environ.get('PORT', 5000)
    app.run(host='0.0.0.0', port=int(port))