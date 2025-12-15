import { recordEvent } from '../services/eventService.js';

export const logEvent = async (req, res)=>{
    try{
        const { userId, productId, eventType } = req.body;
        await recordEvent({ userId, productId, eventType });
        res.status(201).json({status:"ok"});
    }
    catch (err){
        res.status(500).json({error: 'Failed to log event'});
    }
};