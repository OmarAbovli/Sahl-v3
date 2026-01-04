import { NextApiRequest, NextApiResponse } from "next"
import { sql } from "@/lib/database"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  if (method === "GET") {
    const { company_id } = req.query

    try {
      const result = await sql`
        SELECT * FROM biometric_devices
        WHERE company_id = ${Number(company_id)}
      `
      return res.status(200).json(result)
    } catch (error: any) {
      console.error("GET Error:", error)
      return res.status(500).json({ error: error.message || "Unknown GET error" })
    }
  }

  if (method === "POST") {
    const {
      company_id,
      device_name,
      device_type,
      ip_address,
      port = 4370,
      model,
      serial_number,
      protocol,
      username,
      password,
      location,
    } = req.body

    if (!company_id || !device_name || !device_type || !ip_address) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    try {
      const result = await sql`
        INSERT INTO biometric_devices (
          company_id, device_name, device_type, ip_address, port,
          model, serial_number, protocol, username, password, location
        ) VALUES (
          ${company_id}, ${device_name}, ${device_type}, ${ip_address}, ${port},
          ${model}, ${serial_number}, ${protocol}, ${username}, ${password}, ${location}
        )
        RETURNING *
      `
      return res.status(201).json(result[0])
    } catch (error: any) {
      console.error("POST Error:", error)
      return res.status(500).json({ error: error.message || "Unknown POST error" })
    }
  }

  res.setHeader("Allow", ["GET", "POST"])
  res.status(405).end(`Method ${method} Not Allowed`)
}
