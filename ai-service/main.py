from flask import Flask, request, jsonify
import openai
import os
from dotenv import load_dotenv
import numpy as np
import noise
import os
os.environ['REQUESTS_CA_BUNDLE'] = ''

# Carrega as variáveis de ambiente
load_dotenv()

app = Flask(__name__)

# Configura a chave da OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

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

    # Gera a descrição usando a OpenAI
    response = openai.Completion.create(
        engine="text-davinci-003",  # Ou "gpt-4" se tiver acesso
        prompt=prompt,
        max_tokens=150,  # Limite de tokens na resposta
        temperature=0.7,  # Controla a criatividade (0 = mais determinístico, 1 = mais criativo)
    )

    description = response.choices[0].text.strip()
    return jsonify({"description": description})

@app.route('/generate-npc', methods=['POST'])
def generate_npc():
    # Gera atributos do NPC
    attributes = generate_attributes()

    # Gera a descrição do NPC
    description_prompt = (
        f"Crie uma descrição detalhada para um NPC com os seguintes atributos: {attributes}. "
        "Inclua personalidade, aparência e uma breve história."
    )
    
    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=description_prompt,
        max_tokens=250,  # Aumente o limite para histórias mais longas
        temperature=0.7,
    )

    description = response.choices[0].text.strip()
    return jsonify({"attributes": attributes, "description": description})

def generate_attributes():
    # Exemplo de geração de atributos
    return {
        "força": 10,
        "destreza": 8,
        "inteligência": 12,
        "carisma": 14,
    }

@app.route('/generate-map', methods=['POST'])
def generate_map():
    map_data = generate_procedural_map()
    return jsonify({"map": map_data})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)