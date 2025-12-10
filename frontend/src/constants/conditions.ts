export interface Condition {
    id: string;
    name: string;
    description: string;
    color: string; // Cor para exibição visual
}

export const DND_CONDITIONS: Condition[] = [
    {
        id: 'blinded',
        name: 'Cego',
        description: 'Falha automaticamente em testes que requerem visão. Ataques contra você têm vantagem, seus ataques têm desvantagem.',
        color: '#64748b', // slate
    },
    {
        id: 'charmed',
        name: 'Enfeitiçado',
        description: 'Não pode atacar o enfeitiçador ou alvejá-lo com magias prejudiciais.',
        color: '#ec4899', // pink
    },
    {
        id: 'deafened',
        name: 'Ensurdecido',
        description: 'Não consegue ouvir e falha automaticamente em testes que requerem audição.',
        color: '#6b7280', // gray
    },
    {
        id: 'frightened',
        name: 'Amedrontado',
        description: 'Desvantagem em testes de habilidade e ataques enquanto a fonte do medo estiver visível.',
        color: '#7c3aed', // purple
    },
    {
        id: 'grappled',
        name: 'Agarrado',
        description: 'Deslocamento se torna 0 e não se beneficia de bônus de deslocamento.',
        color: '#f97316', // orange
    },
    {
        id: 'incapacitated',
        name: 'Incapacitado',
        description: 'Não pode realizar ações ou reações.',
        color: '#ef4444', // red
    },
    {
        id: 'invisible',
        name: 'Invisível',
        description: 'Impossível de ver sem magia ou sentidos especiais. Ataques contra você têm desvantagem, seus ataques têm vantagem.',
        color: '#06b6d4', // cyan
    },
    {
        id: 'paralyzed',
        name: 'Paralisado',
        description: 'Incapacitado, não pode se mover ou falar. Falha automaticamente em salvaguardas de For e Des. Ataques contra você têm vantagem.',
        color: '#dc2626', // red-600
    },
    {
        id: 'petrified',
        name: 'Petrificado',
        description: 'Transformado em pedra. Resistência a todo dano. Imune a veneno e doença.',
        color: '#78716c', // stone
    },
    {
        id: 'poisoned',
        name: 'Envenenado',
        description: 'Desvantagem em testes de ataque e testes de habilidade.',
        color: '#22c55e', // green
    },
    {
        id: 'prone',
        name: 'Caído',
        description: 'Desvantagem em ataques. Ataques corpo a corpo contra você têm vantagem, ataques à distância têm desvantagem.',
        color: '#a16207', // yellow-700
    },
    {
        id: 'restrained',
        name: 'Contido',
        description: 'Deslocamento se torna 0. Desvantagem em ataques e Des. Ataques contra você têm vantagem.',
        color: '#ea580c', // orange-600
    },
    {
        id: 'stunned',
        name: 'Atordoado',
        description: 'Incapacitado, não pode se mover, fala é incoerente. Falha automaticamente em salvaguardas de For e Des.',
        color: '#eab308', // yellow
    },
    {
        id: 'unconscious',
        name: 'Inconsciente',
        description: 'Incapacitado, não pode se mover ou falar, não tem consciência. Cai qualquer coisa que esteja segurando.',
        color: '#1f2937', // gray-800
    },
    {
        id: 'exhaustion',
        name: 'Exaustão',
        description: 'Níveis cumulativos de fadiga que impõem penalidades progressivas.',
        color: '#991b1b', // red-800
    },
    {
        id: 'concentrating',
        name: 'Concentração',
        description: 'Mantendo concentração em uma magia. Pode ser quebrada por dano ou incapacitação.',
        color: '#3b82f6', // blue
    },
];

export const getConditionById = (id: string): Condition | undefined => {
    return DND_CONDITIONS.find((c) => c.id === id);
};
