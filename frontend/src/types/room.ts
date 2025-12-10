export interface SceneToken {
    id: string;
    name: string;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    color?: string;
    avatar?: string;
    character_id?: number; // ID do personagem vinculado
    initiative?: number; // Valor de iniciativa para ordem de combate
    current_hp?: number; // HP atual (override do personagem)
    temp_hp?: number; // HP temporário
    max_hp?: number; // HP máximo (para tokens sem personagem vinculado)
    conditions?: string[]; // Condições ativas (Envenenado, Atordoado, etc.)
}

export interface SceneState {
    backgroundUrl?: string;
    tokens: SceneToken[];
    notes?: string;
    [key: string]: any;
}

export interface RoomChatMessage {
    id: string;
    room_id: string;
    user_id: number;
    username?: string;
    message: string;
    timestamp: number;
    kind?: RoomChatKind;
    dice?: RoomDicePayload;
}

export interface RoomMember {
    room_id: string;
    user_id: number;
    role: string;
    joined_at: string;
}

export interface Room {
    id: string;
    name: string;
    owner_id: number;
    campaign_id?: number;
    scene_state?: SceneState;
    created_at: string;
    updated_at: string;
    members?: RoomMember[];
    metadata?: Record<string, any>;
}

export type RoomChatKind = 'chat' | 'dice';

export interface RoomDicePayload {
    notation?: string;
    rolls?: number[];
    total?: number;
    modifier?: number;
    label?: string;
    advantage?: boolean;
    disadvantage?: boolean;
    isCritical?: boolean;
    isFumble?: boolean;
    droppedRolls?: number[];
}

export interface RoomSocketEvent {
    type: string;
    room_id?: string;
    sender_id?: number;
    sender_name?: string;
    message?: string;
    scene_state?: SceneState;
    dice?: RoomDicePayload;
    metadata?: Record<string, any>;
    members?: number[];
    timestamp?: number | string;
}
