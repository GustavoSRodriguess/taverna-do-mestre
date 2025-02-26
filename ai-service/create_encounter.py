import random

# Dados de XP por nível de jogador (D&D 5e)
xp_por_nivel = {
    1: 300, 2: 600, 3: 1200, 4: 1700, 5: 3500,
    6: 4000, 7: 5000, 8: 6000, 9: 7500, 10: 9000,
    11: 10500, 12: 11500, 13: 13500, 14: 15000, 15: 18000,
    16: 20000, 17: 25000, 18: 27000, 19: 30000, 20: 40000
}

# Multiplicadores de dificuldade (D&D 5e)
multiplicadores_dificuldade = {
    "f": 0.5,
    "m": 1,
    "d": 1.5,
    "mo": 2
}

# Dados de monstros organizados por tema
monstros_por_tema = {
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
    ],
}

# Função para calcular o XP total do encontro
def calcular_xp_total(nivel_jogadores, quantidade_jogadores, dificuldade):
    xp_por_jogador = xp_por_nivel.get(nivel_jogadores, 0)
    xp_total = xp_por_jogador * quantidade_jogadores * multiplicadores_dificuldade.get(dificuldade, 1)
    return xp_total

# Função para escolher um tema de encontro
def escolher_tema():
    temas = list(monstros_por_tema.keys())
    return random.choice(temas)

# Função para gerar um encontro temático
def gerar_encontro(nivel_jogadores, quantidade_jogadores, dificuldade):
    xp_total = calcular_xp_total(nivel_jogadores, quantidade_jogadores, dificuldade)
    tema = escolher_tema()
    monstros_tema = monstros_por_tema[tema]
    encontro = []
    xp_usado = 0

    while xp_usado < xp_total:
        monstro = random.choice(monstros_tema)
        if xp_usado + monstro["xp"] <= xp_total:
            encontro.append(monstro)
            xp_usado += monstro["xp"]
        else:
            break

    return encontro, xp_total, tema

# Função para exibir o encontro
def exibir_encontro(encontro, xp_total, tema):
    print("\n=== Encontro Gerado ===")
    print(f"Tema do Encontro: {tema}")
    print(f"XP Total do Encontro: {xp_total}")
    print("\nMonstros:")
    for monstro in encontro:
        print(f"- {monstro['nome']} (XP: {monstro['xp']}, CR: {monstro['cr']})")
    print("========================")

# Função principal
def main():
    nivel_jogadores = int(input("Digite o nível dos jogadores (1-20): "))
    quantidade_jogadores = int(input("Digite a quantidade de jogadores: "))
    dificuldade = input("Escolha a dificuldade do encontro (fácil - f, médio - m, difícil - d, mortal - mo): ").lower()

    if nivel_jogadores < 1 or nivel_jogadores > 20:
        print("Nível inválido. Use um nível entre 1 e 20.")
        return

    if dificuldade not in multiplicadores_dificuldade:
        print("Dificuldade inválida. Escolha entre: fácil, médio, difícil, mortal.")
        return

    encontro, xp_total, tema = gerar_encontro(nivel_jogadores, quantidade_jogadores, dificuldade)
    exibir_encontro(encontro, xp_total, tema)

# Executa o programa
if __name__ == "__main__":
    main()