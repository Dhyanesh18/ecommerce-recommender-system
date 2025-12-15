import axios from 'axios';

export type EventType = 'view' | 'click' | 'add_to_cart' | 'purchase';

interface TrackEventPayload {
    userId: number;
    productId: number;
    eventType: EventType;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const trackEvent = ({ userId, productId, eventType }: TrackEventPayload): void => {
    try {
        // fire and forget, no need to await in UI
        axios.post(`${API_URL}/events`, {
            userId, 
            productId,
            eventType
        });
    } catch(err){
        console.error('Event tracking failed', err);
    }
};