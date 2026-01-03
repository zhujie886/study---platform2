import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

function tailLines(text: string, maxLines: number): string {
  const lines = text.split(/\r?\n/);
  const sliced = lines.slice(Math.max(0, lines.length - maxLines));
  return sliced.join('\n');
}

export async function getAdminLogs(req: Request, res: Response) {
  try {
    const type = (req.query.type === 'err' ? 'err' : 'out') as 'out' | 'err';
    const linesRaw = Number(req.query.lines ?? 200);
    const lines = Number.isFinite(linesRaw) ? Math.min(Math.max(linesRaw, 50), 2000) : 200;

    const baseDir = process.env.LOG_DIR
      ? path.resolve(process.env.LOG_DIR)
      : path.join(process.cwd(), 'logs');

    const fileName = type === 'err' ? 'err.log' : 'out.log';
    const fp = path.join(baseDir, fileName);

    if (!fs.existsSync(fp)) {
      return res.json({ ok: true, type, lines, path: fp, content: '' });
    }

    const raw = fs.readFileSync(fp, 'utf-8');
    const content = tailLines(raw, lines);

    return res.json({ ok: true, type, lines, path: fp, content });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message ?? 'Failed to read logs' });
  }
}
