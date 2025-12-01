import { fetchFromAPI } from './apiService';
import { Room, RoomMember, SceneState } from '../types/room';

interface CreateRoomPayload {
    name: string;
    campaign_id?: number;
    metadata?: Record<string, any>;
}

class RoomService {
    async createRoom(payload: CreateRoomPayload | string): Promise<Room> {
        if (typeof payload === 'string') {
            return fetchFromAPI('/rooms', 'POST', { name: payload });
        }
        return fetchFromAPI('/rooms', 'POST', payload);
    }

    async getCampaignRoom(campaignId: number): Promise<Room | null> {
        try {
            return await fetchFromAPI(`/campaigns/${campaignId}/room`);
        } catch (err: any) {
            const message = (err as Error)?.message || '';
            if (message.includes('404')) {
                return null;
            }
            throw err;
        }
    }

    async getRoom(id: string): Promise<Room> {
        return fetchFromAPI(`/rooms/${id}`);
    }

    async joinRoom(id: string): Promise<{ room: Room; member: RoomMember }> {
        return fetchFromAPI(`/rooms/${id}/join`, 'POST');
    }

    async updateScene(id: string, scene_state: SceneState, metadata?: Record<string, any>): Promise<Room> {
        return fetchFromAPI(`/rooms/${id}/scene`, 'POST', { scene_state, metadata });
    }
}

export const roomService = new RoomService();
export default roomService;
export type { Room, RoomMember, SceneState };
