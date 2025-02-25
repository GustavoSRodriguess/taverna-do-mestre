import random
import numpy as np
import matplotlib.pyplot as plt
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.neighbors import NearestNeighbors


# 1. Geração de Atributos com Base na Classe
def generate_attributes(classe):
    # Perfis de atributos para cada classe
    profiles = {
        "paladino": {"força": 15, "destreza": 10, "inteligência": 8, "carisma": 12},
        "guerreiro": {"força": 16, "destreza": 12, "inteligência": 6, "carisma": 8},
        "bardo": {"força": 8, "destreza": 14, "inteligência": 12, "carisma": 16},
        "mago": {"força": 6, "destreza": 10, "inteligência": 16, "carisma": 12},
        "ladino": {"força": 10, "destreza": 16, "inteligência": 14, "carisma": 10},
    }

    # Gera atributos com base no perfil da classe
    if classe.lower() in profiles:
        base_attributes = profiles[classe.lower()]
        attributes = {stat: base_attributes[stat] + random.randint(-2, 2) for stat in base_attributes}
        return attributes
    else:
        return "Classe não encontrada."

# 2. Geração de Mapas no Estilo Village Generator
def generate_village(width=50, height=50, iterations=5, wall_prob=0.45):
    # Inicializa o mapa com paredes e espaços aleatórios
    map_data = np.random.choice([0, 1], size=(width, height), p=[1 - wall_prob, wall_prob])

    # Aplica Cellular Automata para criar estruturas orgânicas
    for _ in range(iterations):
        new_map = map_data.copy()
        for x in range(1, width - 1):
            for y in range(1, height - 1):
                # Conta o número de paredes ao redor
                walls = np.sum(map_data[x-1:x+2, y-1:y+2]) - map_data[x, y]
                if walls > 4:
                    new_map[x, y] = 1  # Cria uma parede
                else:
                    new_map[x, y] = 0  # Cria um espaço vazio
        map_data = new_map

    return map_data

def plot_village(map_data):
    # Plota o mapa usando matplotlib
    plt.imshow(map_data, cmap='binary', interpolation='nearest')
    plt.title("Mapa de Vilarejo Gerado")
    plt.show()

# 3. Classificação de Encontros
def classify_encounter(description):
    # Dados de treinamento (descrições de encontros e suas classes)
    encounters = [
        ("Os jogadores lutam contra goblins", "combate"),
        ("Os jogadores negociam com um mercador", "social"),
        ("Os jogadores exploram uma caverna escura", "exploração"),
        ("Os jogadores enfrentam um dragão", "combate"),
        ("Os jogadores discutem com o rei", "social"),
        ("Os jogadores descobrem um tesouro escondido", "exploração"),
        ("Os jogadores são emboscados por bandidos", "combate"),
        ("Os jogadores participam de um festival", "social"),
        ("Os jogadores escalam uma montanha perigosa", "exploração"),
    ]

    # Prepara os dados
    texts = [encounter[0] for encounter in encounters]
    labels = [encounter[1] for encounter in encounters]

    # Treina um modelo de classificação de texto
    vectorizer = CountVectorizer()
    X = vectorizer.fit_transform(texts)
    model = MultinomialNB()
    model.fit(X, labels)

    # Classifica um novo encontro
    return model.predict(vectorizer.transform([description]))[0]

# 4. Recomendação de Missões com Base no Nível dos Jogadores
def recommend_mission(player_levels):
    # Dados de missões (nível de dificuldade, recompensa)
    missions = np.array([
        [1, 10],  # Missão fácil, recompensa baixa
        [5, 50],  # Missão média, recompensa média
        [10, 100],  # Missão difícil, recompensa alta
    ])

    # Calcula a média do nível dos jogadores
    avg_level = np.mean(player_levels)

    # Recomenda uma missão com base no nível médio
    model = NearestNeighbors(n_neighbors=1)
    model.fit(missions)
    mission_index = model.kneighbors([[avg_level, 0]])[1][0][0]
    return missions[mission_index]

# 5. Função Principal para Testar Tudo
def main():
    # Geração de Atributos
    classe = input("Digite a classe do personagem (paladino, guerreiro, bardo, mago, ladino): ")
    print("Atributos Gerados:", generate_attributes(classe))

    # Geração de Mapas
    village_map = generate_village()
    plot_village(village_map)

    # Classificação de Encontros
    encounter_description = input("Descreva um encontro: ")
    print("Classificação do Encontro:", classify_encounter(encounter_description))

    # Recomendação de Missões
    num_players = int(input("Digite o número de jogadores (1 a 6): "))
    player_levels = [int(input(f"Nível do jogador {i+1}: ")) for i in range(num_players)]
    print("Missão Recomendada:", recommend_mission(player_levels))

# Executa o programa
if __name__ == "__main__":
    main()