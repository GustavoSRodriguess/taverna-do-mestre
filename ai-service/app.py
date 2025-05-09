from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
import numpy as np
import noise
import json
from create_npc import handle_generate_npc
from create_encounter import handle_generate_encounter
from loot_generator import handle_generate_items

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

    # Utiliza a função existente do create_npc.py
    npc_data = handle_generate_npc(data)
    
    return jsonify(npc_data)

@app.route('/generate-encounter', methods=['POST'])
def generate_encounter_api():
    data = request.json
    player_level = data.get('player_level', 1)
    player_count = data.get('player_count', 4)
    difficulty = data.get('difficulty', 'd')  # e, m, d, mo
    
    # Use the improved encounter generator
    encounter_data = handle_generate_encounter({
        "player_level": player_level,
        "player_count": player_count,
        "difficulty": difficulty
    })
    
    return jsonify(encounter_data)

@app.route('/generate-map', methods=['POST'])
def generate_map_api():
    data = request.json
    width = data.get('width', 50)
    height = data.get('height', 50)
    scale = data.get('scale', 20.0)
    
    map_data = generate_procedural_map(width, height, scale)
    return jsonify({"map": map_data})

@app.route('/generate-loot', methods=['POST'])
def generate_items_api():
    data = request.json
    
    # Use the item generator
    items_data = handle_generate_items(data)
    
    return jsonify(items_data)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "rpg-generator-python"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
