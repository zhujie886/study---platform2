import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const ADMIN_KEY = 'admin123'; // 确保这是你的管理员密码
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export const adminLogin = async (req: Request, res: Response) => {
  try {
    // 确保从 req.body 中获取 key
    const { key } = req.body;
    console.log('管理员尝试登录，Key:', key);

    if (!key || key !== ADMIN_KEY) {
      return res.status(401).json({ message: '管理员密钥错误' });
    }

    // 签发 Token
    const token = jwt.sign(
      { userId: 'admin', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: '登录成功',
      token,
      user: { id: 'admin', username: 'Administrator', role: 'admin' }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

