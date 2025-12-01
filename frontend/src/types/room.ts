export interface SceneToken {
    id: string;
    name: string;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    color?: string;
    avatar?: string;
}

export interface SceneState {
    backgroundUrl?: string;
    tokens: SceneToken[];
    notes?: string;
    [key: string]: any;
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
