from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
import numpy as np
import noise
import json
from create_npc import generate_character, calculate_modifiers
from create_encounter import gerar_encontro

# Carrega as variáveis de ambiente
load_dotenv()

app = Flask(__name__)

def generate_procedural_map(width=50, height=50, scale=20.0):
    map_data = np.zeros((width, height))

    for x in range(width):
        for y in range(height):
            map_data[x][y] = noise.pnoise2(x/scale, y/scale, octaves=6)

    return map_data.tolist()

@app.route('/generate-description', methods=['POST'])
def generate_description():
    data = request.json
    prompt = data.get('prompt', '')
    
    try:
        import openai
        # Configura a chave da OpenAI
        openai.api_key = os.getenv("OPENAI_API_KEY")
        
        # Gera a descrição usando a OpenAI
        response = openai.Completion.create(
            engine="text-davinci-003",  # Ou outro modelo mais recente
            prompt=prompt,
            max_tokens=150,  # Limite de tokens na resposta
            temperature=0.7,  # Controla a criatividade
        )

        description = response.choices[0].text.strip()
        return jsonify({"description": description})
    except Exception as e:
        # Fallback se a API do OpenAI falhar
        return jsonify({
            "description": f"Um personagem misterioso com uma história para contar. [Erro ao gerar descrição: {str(e)}]"
        })

@app.route('/generate-npc', methods=['POST'])
def generate_npc_api():
    data = request.json
    level = data.get('level', 1)
    attributes_method = data.get('attributes_method', 'rolagem')
    manual = data.get('manual', False)
    
    # Utiliza a função existente do create_npc.py
    character = generate_character(level, attributes_method, manual)
    
    # Formata para o formato esperado pela API
    npc_data = {
        "name": f"{character['Raça']} {character['Classe']}", 
        "description": f"Um(a) {character['Raça']} {character['Classe']} com antecedente de {character['Antecedente']}",
        "level": character['Nível'],
        "race": character['Raça'],
        "class": character['Classe'],
        "attributes": character['Atributos'],
        "abilities": character['Habilidades'],
        "equipment": character['Equipamento'],
        "hp": character['HP'],
        "ca": character['CA'],
    }
    
    # Adiciona magias se existirem
    if character['Magias']:
        spells = []
        for level_spells, spell_list in character['Magias'].items():
            spells.extend(spell_list)
        npc_data["spells"] = spells
    
    return jsonify(npc_data)

@app.route('/generate-encounter', methods=['POST'])
def generate_encounter_api():
    data = request.json
    player_level = data.get('player_level', 1)
    player_count = data.get('player_count', 4)
    difficulty = data.get('difficulty', 'm')  # f, m, d, mo
    
    # Gera o encontro usando a função do create_encounter.py
    encontro, xp_total, tema = gerar_encontro(player_level, player_count, difficulty)
    
    # Formata o resultado para a API
    monsters = []
    for monstro in encontro:
        monsters.append({
            "name": monstro["nome"],
            "xp": monstro["xp"],
            "cr": monstro["cr"]
        })
    
    response = {
        "theme": tema,
        "difficulty": difficulty,
        "total_xp": xp_total,
        "player_level": player_level,
        "player_count": player_count,
        "monsters": monsters
    }
    
    return jsonify(response)

@app.route('/generate-map', methods=['POST'])
def generate_map_api():
    data = request.json
    width = data.get('width', 50)
    height = data.get('height', 50)
    scale = data.get('scale', 20.0)
    
    map_data = generate_procedural_map(width, height, scale)
    return jsonify({"map": map_data})

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "rpg-generator-python"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
