import random

racas = {
    "Humano": {"Força": 1, "Destreza": 1, "Constituição": 1, "Inteligência": 1, "Sabedoria": 1, "Carisma": 1},
    "Elfo": {"Destreza": 2, "Inteligência": 1},
    "Anão": {"Constituição": 2},
    "Halfling": {"Destreza": 2, "Carisma": 1},
    "Tiefling": {"Inteligência": 1, "Carisma": 2},
    "Dragonborn": {"Força": 2, "Carisma": 1},
    "Gnomo": {"Inteligência": 2},
    "Meio-Elfo": {"Carisma": 2, "Outros": 2},
    "Meio-Orc": {"Força": 2, "Constituição": 1},
    "Aarakocra": {"Destreza": 2, "Sabedoria": 1},
    "Goliath": {"Força": 2, "Constituição": 1},
    "Tabaxi": {"Destreza": 2, "Carisma": 1},
    "Tritão": {"Força": 1, "Constituição": 1, "Carisma": 1},
    "Firbolg": {"Sabedoria": 2, "Força": 1},
    "Kenku": {"Destreza": 2, "Sabedoria": 1},
    "Lizardfolk": {"Constituição": 2, "Sabedoria": 1},
    "Hobgoblin": {"Constituição": 2, "Inteligência": 1},
    "Yuan-Ti Pureblood": {"Carisma": 2, "Inteligência": 1},
    "Aasimar": {"Carisma": 2},
    "Bugbear": {"Força": 2, "Destreza": 1},
    "Githyanki": {"Força": 2, "Inteligência": 1},
    "Githzerai": {"Sabedoria": 2, "Inteligência": 1},
    "Centaur": {"Força": 2, "Sabedoria": 1},
    "Loxodon": {"Constituição": 2, "Sabedoria": 1},
    "Minotauro": {"Força": 2, "Constituição": 1},
    "Simic Hybrid": {"Constituição": 2, "Outro": 1},
    "Vedalken": {"Inteligência": 2, "Sabedoria": 1},
}

# Dados de Classes e Habilidades por Nível
classes = {
    "Guerreiro": {
        "Atributos Prioritários": ["Força", "Constituição"],
        "Habilidades por Nível": {
            1: ["Estilo de Combate", "Segunda Ventilação"],
            2: ["Ataque Extra"],
            3: ["Arquétipo de Guerreiro"],
            4: ["Aumento de Atributo"],
            5: ["Ataque Extra (2x)"],
        },
    },
    "Mago": {
        "Atributos Prioritários": ["Inteligência", "Sabedoria"],
        "Habilidades por Nível": {
            1: ["Conjuração de Magias", "Recuperação Arcana"],
            2: ["Tradição Arcana"],
            3: ["Aprimorar Magias"],
            4: ["Aumento de Atributo"],
            5: ["Magias de Nível 3"],
        },
    },
    "Ladino": {
        "Atributos Prioritários": ["Destreza", "Inteligência"],
        "Habilidades por Nível": {
            1: ["Ataque Furtivo", "Especialização"],
            2: ["Esquiva Ágil"],
            3: ["Arquétipo de Ladino"],
            4: ["Aumento de Atributo"],
            5: ["Ataque Furtivo Aprimorado"],
        },
    },
    "Clérigo": {
        "Atributos Prioritários": ["Sabedoria", "Carisma"],
        "Habilidades por Nível": {
            1: ["Conjuração de Magias", "Domínio Divino"],
            2: ["Canalizar Divindade"],
            3: ["Aprimorar Magias"],
            4: ["Aumento de Atributo"],
            5: ["Destruir Mortos-Vivos"],
        },
    },
    "Bardo": {
        "Atributos Prioritários": ["Carisma", "Destreza"],
        "Habilidades por Nível": {
            1: ["Inspiração Bárdica", "Conjuração de Magias"],
            2: ["Canção de Descanso"],
            3: ["Colégio Bárdico"],
            4: ["Aumento de Atributo"],
            5: ["Inspiração Aprimorada"],
        },
    },
    "Druida": {
        "Atributos Prioritários": ["Sabedoria", "Constituição"],
        "Habilidades por Nível": {
            1: ["Conjuração de Magias", "Transformação Selvagem"],
            2: ["Círculo Druídico"],
            3: ["Aprimorar Magias"],
            4: ["Aumento de Atributo"],
            5: ["Transformação Selvagem Aprimorada"],
        },
    },
    "Monge": {
        "Atributos Prioritários": ["Destreza", "Sabedoria"],
        "Habilidades por Nível": {
            1: ["Defesa sem Armadura", "Artes Marciais"],
            2: ["Ki", "Movimento Acrobático"],
            3: ["Tradição Monástica"],
            4: ["Aumento de Atributo"],
            5: ["Ataque Desarmado Aprimorado"],
        },
    },
    "Paladino": {
        "Atributos Prioritários": ["Força", "Carisma"],
        "Habilidades por Nível": {
            1: ["Juramento Sagrado", "Cura pelas Mãos"],
            2: ["Estilo de Combate", "Conjuração de Magias"],
            3: ["Juramento Divino"],
            4: ["Aumento de Atributo"],
            5: ["Aura de Proteção"],
        },
    },
    "Patrulheiro": {
        "Atributos Prioritários": ["Destreza", "Sabedoria"],
        "Habilidades por Nível": {
            1: ["Exploração", "Inimigo Favorecido"],
            2: ["Estilo de Combate", "Conjuração de Magias"],
            3: ["Arquétipo de Patrulheiro"],
            4: ["Aumento de Atributo"],
            5: ["Ataque Extra"],
        },
    },
    "Feiticeiro": {
        "Atributos Prioritários": ["Carisma", "Constituição"],
        "Habilidades por Nível": {
            1: ["Magia Inata", "Origem Feiticeira"],
            2: ["Metamagia"],
            3: ["Aprimorar Magias"],
            4: ["Aumento de Atributo"],
            5: ["Magias de Nível 3"],
        },
    },
    "Bruxo": {
        "Atributos Prioritários": ["Carisma", "Inteligência"],
        "Habilidades por Nível": {
            1: ["Pacto Mágico", "Eldritch Invocations"],
            2: ["Pacto com o Patrono"],
            3: ["Aprimorar Magias"],
            4: ["Aumento de Atributo"],
            5: ["Magias de Nível 3"],
        },
    },
}

# Dados de Antecedentes
antecedentes = {
    "Nobre": {"Habilidade": "Posição de Privilégio", "Equipamento": ["Roupas finas", "Selo de família"]},
    "Eremita": {"Habilidade": "Descoberta", "Equipamento": ["Kit de herbalismo", "Livro de orações"]},
    "Soldado": {"Habilidade": "Hierarquia Militar", "Equipamento": ["Insígnia militar", "Kit de aventura"]},
    "Criminoso": {"Habilidade": "Contato Criminoso", "Equipamento": ["Ferramentas de ladrão", "Kit de disfarce"]},
    "Sábio": {"Habilidade": "Pesquisador", "Equipamento": ["Livro de conhecimento", "Tinta e pena"]},
    "Charlatão": {"Habilidade": "Falsidade", "Equipamento": ["Kit de falsificação", "Roupas finas"]},
    "Artífice": {"Habilidade": "Criação de Itens", "Equipamento": ["Ferramentas de artesão", "Kit de alquimia"]},
    "Forasteiro": {"Habilidade": "Sobrevivência", "Equipamento": ["Kit de sobrevivência", "Arco e flecha"]},
    "Herói": {"Habilidade": "Inspiração", "Equipamento": ["Armadura leve", "Arma simples"]},
    "Mercenário": {"Habilidade": "Táticas de Combate", "Equipamento": ["Armadura média", "Arma marcial"]},
}

# Dados de Magias por Classe e Nível
magias = {
    "Mago": {
        1: ["Bola de Fogo", "Escudo Mágico", "Raio Arcano", "Detectar Magia", "Disfarçar-se"],
        2: ["Nevasca", "Invisibilidade", "Teia", "Sugestão", "Levitar"],
        3: ["Contramágica", "Dissipar Magia", "Relâmpago"],
        4: ["Muralha de Fogo", "Porta Dimensional", "Polimorfar"],
        5: ["Cone de Frio", "Teletransporte", "Mísseis Mágicos Avançados"],
    },
    "Clérigo": {
        1: ["Curar Ferimentos", "Proteção contra o Mal", "Bênção", "Causar Ferimentos", "Detectar Mal e Bem"],
        2: ["Restauração Menor", "Silêncio", "Proteção contra Veneno", "Arma Espiritual", "Augúrio"],
        3: ["Revivificar", "Dispensar Maldição", "Proteção contra Energia"],
        4: ["Guardião da Fé", "Libertação", "Cura Crítica"],
        5: ["Comunhão", "Planar Ally", "Raio Solar"],
    },
    "Bruxo": {
        1: ["Eldritch Blast", "Armadura de Agathys", "Hex", "Proteção contra o Mal e Bem", "Compreender Idiomas"],
        2: ["Coroa da Loucura", "Escuridão", "Invisibilidade", "Mísseis Mágicos", "Sugestão"],
        3: ["Contramágica", "Dissipar Magia", "Relâmpago"],
        4: ["Muralha de Fogo", "Porta Dimensional", "Polimorfar"],
        5: ["Cone de Frio", "Teletransporte", "Mísseis Mágicos Avançados"],
    },
    "Druida": {
        1: ["Cura pelas Mãos", "Entender Animais", "Falar com Animais", "Crescer Espinhos", "Névoa Obscurecente"],
        2: ["Chamas da Fênix", "Transformação de Pedra", "Chuva de Espinhos", "Proteção contra Veneno", "Calmaria"],
        3: ["Conjurar Animais", "Lentidão", "Relâmpago"],
        4: ["Muralha de Fogo", "Porta Dimensional", "Polimorfar"],
        5: ["Cone de Frio", "Teletransporte", "Mísseis Mágicos Avançados"],
    },
    "Bardo": {
        1: ["Cura pelas Mãos", "Disfarçar-se", "Detectar Magia", "Sono", "Compreender Idiomas"],
        2: ["Invisibilidade", "Sugestão", "Curar Ferimentos", "Silêncio", "Aprimorar Habilidade"],
        3: ["Contramágica", "Dissipar Magia", "Relâmpago"],
        4: ["Muralha de Fogo", "Porta Dimensional", "Polimorfar"],
        5: ["Cone de Frio", "Teletransporte", "Mísseis Mágicos Avançados"],
    },
}

# Dados de Inimigos
inimigos = {
    "Goblin": {
        "Atributos": {"Força": 8, "Destreza": 14, "Constituição": 10, "Inteligência": 10, "Sabedoria": 8, "Carisma": 8},
        "Habilidades": ["Ataque Furtivo", "Esquiva Ágil"],
        "Equipamento": ["Adaga", "Arco Curto"],
    },
    "Orc": {
        "Atributos": {"Força": 16, "Destreza": 12, "Constituição": 14, "Inteligência": 7, "Sabedoria": 8, "Carisma": 10},
        "Habilidades": ["Ataque Poderoso", "Resistência à Dor"],
        "Equipamento": ["Machado Grande", "Armadura de Couro"],
    },
    "Esqueleto": {
        "Atributos": {"Força": 10, "Destreza": 14, "Constituição": 12, "Inteligência": 6, "Sabedoria": 8, "Carisma": 5},
        "Habilidades": ["Imunidade a Veneno", "Vulnerabilidade a Dano Radiante"],
        "Equipamento": ["Espada Curta", "Escudo"],
    },
    "Lobisomem": {
        "Atributos": {"Força": 15, "Destreza": 13, "Constituição": 14, "Inteligência": 10, "Sabedoria": 11, "Carisma": 10},
        "Habilidades": ["Transformação", "Regeneração"],
        "Equipamento": ["Garras", "Pelagem Resistente"],
    },
}

# Função para gerar atributos (rolagem 4d6 descartando o menor)
def roll_attributes():
    attributes = {}
    for stat in ["Força", "Destreza", "Constituição", "Inteligência", "Sabedoria", "Carisma"]:
        rolls = sorted([random.randint(1, 6) for _ in range(4)], reverse=True)
        attributes[stat] = sum(rolls[:3])
    return attributes

def calculate_hp(classe, level, constitution_modifier):
    # Dados de vida inicial por classe
    hit_dice = {
        "Guerreiro": 10,
        "Mago": 6,
        "Ladino": 8,
        "Clérigo": 8,
        "Bardo": 8,
        "Druida": 8,
        "Monge": 8,
        "Paladino": 10,
        "Patrulheiro": 10,
        "Feiticeiro": 6,
        "Bruxo": 8,
    }

    # Vida inicial (máximo do dado de vida + modificador de Constituição)
    hp = hit_dice.get(classe, 6) + constitution_modifier

    # Adiciona vida para cada nível acima do 1
    for _ in range(2, level + 1):
        hp += random.randint(1, hit_dice.get(classe, 6)) + constitution_modifier

    return hp

def calculate_ca(dexterity_modifier, armor=None, shield=False):
    # CA base (10 + modificador de Destreza)
    ca = 10 + dexterity_modifier

    # Bônus de armadura
    if armor == "Leve":
        ca += 11 + dexterity_modifier
    elif armor == "Média":
        ca += 13 + min(2, dexterity_modifier)
    elif armor == "Pesada":
        ca += 15  # Sem bônus de Destreza para armaduras pesadas

    # Bônus de escudo
    if shield:
        ca += 2

    return ca

# Função para gerar atributos usando array padrão
def standard_array(classe):
    # Valores fixos do array padrão
    values = [15, 14, 13, 12, 10, 8]
    # Atributos prioritários da classe
    priority_stats = classes[classe]["Atributos Prioritários"]
    # Outros atributos
    other_stats = [stat for stat in ["Força", "Destreza", "Constituição", "Inteligência", "Sabedoria", "Carisma"] if stat not in priority_stats]

    # Distribui os maiores valores para os atributos prioritários
    attributes = {}
    for i, stat in enumerate(priority_stats):
        attributes[stat] = values[i]

    # Distribui os valores restantes aleatoriamente para os outros atributos
    random.shuffle(other_stats)
    for i, stat in enumerate(other_stats):
        attributes[stat] = values[len(priority_stats) + i]

    return attributes

# Função para gerar atributos usando compra de pontos
def point_buy():
    points = 27
    attributes = {"Força": 8, "Destreza": 8, "Constituição": 8, "Inteligência": 8, "Sabedoria": 8, "Carisma": 8}
    costs = {8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9}

    print("\nDistribua 27 pontos entre os atributos (custo por ponto):")
    for stat in attributes:
        while True:
            try:
                value = int(input(f"{stat} (8-15): "))
                if value < 8 or value > 15:
                    print("Valor deve estar entre 8 e 15.")
                    continue
                cost = costs[value]
                if points - cost < 0:
                    print("Pontos insuficientes.")
                    continue
                points -= cost
                attributes[stat] = value
                break
            except ValueError:
                print("Entrada inválida.")
    return attributes

# Função para aplicar bônus de raça
def apply_race_bonus(attributes, race):
    for stat, bonus in racas[race].items():
        if stat == "Outros":
            # Escolhe dois atributos aleatórios para receber +1
            other_stats = random.sample(["Força", "Destreza", "Constituição", "Inteligência", "Sabedoria", "Carisma"], 2)
            for other_stat in other_stats:
                attributes[other_stat] += 1
        else:
            attributes[stat] += bonus
    return attributes

# Função para calcular modificadores de atributos
def calculate_modifiers(attributes):
    modifiers = {}
    for stat, value in attributes.items():
        modifiers[stat] = (value - 10) // 2
    return modifiers

# Função para gerar magias aleatórias
def generate_random_spells(classe, level):
    spells_by_level = {}
    if classe in magias:
        for lvl in range(1, level + 1):
            if lvl in magias[classe]:
                available_spells = magias[classe][lvl]
                # Escolhe até 3 magias aleatórias por nível
                num_spells = min(3, len(available_spells))
                spells_by_level[f"Magias de Nível {lvl}"] = random.sample(available_spells, num_spells)
    return spells_by_level

def choose_race():
    print("\nEscolha uma raça:")
    for i, race in enumerate(racas.keys(), 1):
        print(f"{i}. {race}")
    choice = int(input("Escolha (1-{}): ".format(len(racas))))
    return list(racas.keys())[choice - 1]

def choose_class():
    print("\nEscolha uma classe:")
    for i, classe in enumerate(classes.keys(), 1):
        print(f"{i}. {classe}")
    choice = int(input("Escolha (1-{}): ".format(len(classes))))
    return list(classes.keys())[choice - 1]

def choose_background():
    print("\nEscolha um antecedente:")
    for i, background in enumerate(antecedentes.keys(), 1):
        print(f"{i}. {background}")
    choice = int(input("Escolha (1-{}): ".format(len(antecedentes))))
    return list(antecedentes.keys())[choice - 1]

# Função para gerar um inimigo
def generate_enemy():
    # Escolhe um inimigo aleatório
    enemy_name = random.choice(list(inimigos.keys()))
    enemy_data = inimigos[enemy_name]
    return {
        "Nome": enemy_name,
        "Atributos": enemy_data["Atributos"],
        "Habilidades": enemy_data["Habilidades"],
        "Equipamento": enemy_data["Equipamento"],
    }

# Função para exibir o inimigo
def display_enemy(enemy):
    print("\n=== Ficha do Inimigo ===")
    print(f"Nome: {enemy['Nome']}")
    print("\nAtributos:")
    for stat, value in enemy["Atributos"].items():
        print(f"{stat}: {value}")
    print("\nHabilidades:")
    for habilidade in enemy["Habilidades"]:
        print(f"- {habilidade}")
    print("\nEquipamento:")
    for item in enemy["Equipamento"]:
        print(f"- {item}")
    print("========================")

# Função para gerar um personagem completo
def generate_character(level, attributes_method, manual):
    # Escolha aleatória de raça, classe e antecedente
    if not manual:
        race = random.choice(list(racas.keys()))
        classe = random.choice(list(classes.keys()))
        background = random.choice(list(antecedentes.keys()))
    else:
        race = choose_race()
        classe = choose_class()
        background = choose_background()

    # Gera atributos com base no método escolhido
    if attributes_method == "rolagem":
        attributes = roll_attributes()
    elif attributes_method == "array":
        attributes = standard_array(classe)
    elif attributes_method == "compra":
        attributes = point_buy()

    # Aplica bônus de raça
    attributes = apply_race_bonus(attributes, race)

    # Calcula modificadores
    modifiers = calculate_modifiers(attributes)

    # Gera magias aleatórias (se a classe for conjuradora)
    spells = generate_random_spells(classe, level)

    hp = calculate_hp(classe, level, modifiers['Constituição'])
    ca = calculate_ca(modifiers['Destreza'], armor="Leve", shield=False)

    # Retorna o personagem
    return {
        "Raça": race,
        "Classe": classe,
        "HP": hp,
        "CA": ca,
        "Antecedente": background,
        "Nível": level,
        "Atributos": attributes,
        "Modificadores": modifiers,
        "Habilidades": classes[classe]["Habilidades por Nível"].get(level, []),
        "Magias": spells,
        "Equipamento": antecedentes[background]["Equipamento"],
        "Traço de Antecedente": antecedentes[background]["Habilidade"],
    }

# Função para exibir o personagem
def display_character(character):
    print("\n=== Ficha do Personagem ===")
    print(f"Raça: {character['Raça']}")
    print(f"Classe: {character['Classe']}")
    print(f"HP: {character['HP']}")
    print(f"CA: {character['CA']}")
    print(f"Antecedente: {character['Antecedente']}")
    print(f"Nível: {character['Nível']}")
    print("\nAtributos:")
    for stat, value in character["Atributos"].items():
        print(f"{stat}: {value} (Modificador: {character['Modificadores'][stat]})")
    print("\nHabilidades:")
    for habilidade in character["Habilidades"]:
        print(f"- {habilidade}")
    if character["Magias"]:
        print("\nMagias:")
        for level, spells in character["Magias"].items():
            print(f"{level}:")
            for spell in spells:
                print(f"- {spell}")
    print("\nEquipamento Inicial:")
    for item in character["Equipamento"]:
        print(f"- {item}")
    print(f"\nTraço de Antecedente: {character['Traço de Antecedente']}")
    print("========================")

# Função principal
def main():
    level = int(input("Digite o nível do personagem (1-5): "))
    if level < 1 or level > 5:
        print("Nível inválido. Use um nível entre 1 e 5.")
        return

    manual = input("Você quer fazer isso manualmente? (s/n): ").lower() == "s"

    # Escolha do método de geração de atributos
    print("\nEscolha o método de geração de atributos:")
    print("1. Rolagem 4d6 (aleatoriedade completa)")
    print("2. Array padrão (15, 14, 13, 12, 10, 8)")
    print("3. Compra de pontos (27 pontos para distribuir)")
    method_choice = input("Escolha (1, 2 ou 3): ")

    if method_choice == "1":
        attributes_method = "rolagem"
    elif method_choice == "2":
        attributes_method = "array"
    elif method_choice == "3":
        attributes_method = "compra"
    else:
        print("Escolha inválida. Usando rolagem 4d6 por padrão.")
        attributes_method = "rolagem"

    # Gerar e exibir um personagem
    character = generate_character(level, attributes_method, manual)
    display_character(character)

    # Gerar e exibir um inimigo
    genEnemy = input('gerar inimigo? s/n: ').lower() == 's'
    if(genEnemy):
        enemy = generate_enemy()
        display_enemy(enemy)
        

# Executa o programa
if __name__ == "__main__":
    main()