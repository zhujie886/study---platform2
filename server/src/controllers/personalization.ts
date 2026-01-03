
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../storage/personalization_db.json');

if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}));
}

const readDb = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
const writeDb = (data: any) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

export const getPersonalization = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || 'default_user'; 
        const db = readDb();
        const config = db[userId] || {};
        
        // 确保返回默认结构，防止前端报错
        const defaultConfig = {
            theme: 'macaron',
            layout: {
                dock: { x: window_innerWidth_half(), y: window_innerHeight_minus_100() }, // 默认底部居中
                windows: {}
            },
            apps: [],
            widgets: { canvasItems: [], pets: [] }
        };

        // 深度合并默认值（简易版）
        const merged = { ...defaultConfig, ...config };
        // 确保 layout 存在
        if (!merged.layout) merged.layout = defaultConfig.layout;
        if (!merged.layout.windows) merged.layout.windows = {};

        res.json({ success: true, data: merged });
    } catch (error) {
        // 容错处理
        res.json({ success: true, data: { layout: { windows: {} }, widgets: { canvasItems: [] } } });
    }
};

// 辅助函数：模拟服务器端无法获取 window 的情况，前端会覆盖这些默认值
function window_innerWidth_half() { return 500; }
function window_innerHeight_minus_100() { return 800; }

export const updatePersonalization = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || 'default_user';
        const updates = req.body;
        const db = readDb();
        const current = db[userId] || {};

        // 智能合并
        const newConfig = {
            ...current,
            ...updates,
            layout: { 
                ...(current.layout || {}), 
                ...(updates.layout || {}),
                // 如果更新包含 windows，则合并 windows
                windows: { ...(current.layout?.windows || {}), ...(updates.layout?.windows || {}) }
            },
            widgets: {
                ...(current.widgets || {}),
                ...(updates.widgets || {})
            }
        };

        db[userId] = newConfig;
        writeDb(db);
        res.json({ success: true, data: newConfig });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
};
