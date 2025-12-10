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
    message: string;
    timestamp: number;
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

export interface RoomSocketEvent {
    type: string;
    room_id?: string;
    sender_id?: number;
    message?: string;
    scene_state?: SceneState;
    dice?: any;
    metadata?: Record<string, any>;
    members?: number[];
    timestamp?: number;
}
