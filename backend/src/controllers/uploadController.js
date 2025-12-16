import { v2 as cloudinary } from 'cloudinary';

export const uploadImage = async (req, res) => {
    try {
        // Configure Cloudinary on each request to ensure env vars are loaded
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            console.error('Cloudinary configuration missing:');
            console.error('CLOUDINARY_CLOUD_NAME:', cloudName ? 'Set' : 'Missing');
            console.error('CLOUDINARY_API_KEY:', apiKey ? 'Set' : 'Missing');
            console.error('CLOUDINARY_API_SECRET:', apiSecret ? 'Set' : 'Missing');
            return res.status(500).json({ 
                error: 'Cloudinary is not configured. Please check environment variables.' 
            });
        }

        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret
        });

        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(image, {
            folder: 'ecommerce-products',
            resource_type: 'auto',
            transformation: [
                { width: 1000, height: 1000, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' }
            ]
        });

        res.json({
            url: result.secure_url,
            publicId: result.public_id
        });
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
};

export const deleteImage = async (req, res) => {
    try {
        const { publicId } = req.body;

        if (!publicId) {
            return res.status(400).json({ error: 'No public ID provided' });
        }

        await cloudinary.uploader.destroy(publicId);
        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
};
