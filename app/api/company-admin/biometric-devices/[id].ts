// File: src/pages/api/company-admin/biometric-devices/[id].ts

import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  if (method === 'DELETE') {
    if (!id || (typeof id !== 'string' && typeof id !== 'number')) {
      return res.status(400).json({ error: 'Invalid device ID' });
    }
    try {
      const result = await sql`
        DELETE FROM biometric_devices WHERE id = ${Number(id)}
        RETURNING *
      `;
      if (result.length === 0) {
        return res.status(404).json({ error: 'Device not found' });
      }
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  res.setHeader('Allow', ['DELETE']);
  res.status(405).end(`Method ${method} Not Allowed`);
}
