import api from './api';

export interface UploadResponse {
    url: string;
    publicId: string;
}

export const uploadImage = async (file: File): Promise<UploadResponse> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onloadend = async () => {
            try {
                const base64String = reader.result as string;
                const response = await api.post('/upload/image', { image: base64String });
                resolve(response.data);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsDataURL(file);
    });
};

export const deleteImage = async (publicId: string): Promise<void> => {
    await api.delete('/upload/image', { data: { publicId } });
};
