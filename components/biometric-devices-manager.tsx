"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, Plus, Pencil, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: number
  email: string
  companyId: number
  role: string
}

interface Device {
  id: number
  device_name: string
  device_type: string
  ip_address: string
  port: number
  model?: string
  serial_number?: string
  protocol?: string
  username?: string
  password?: string
  location: string
}

interface AttendanceLog {
  id: number
  device_id: number
  employee_number?: string
  first_name?: string
  last_name?: string
  attendance_time: string
  attendance_type: number
  raw_log_id: string
  device_user_id: string
}

interface Props {
  user: User
}

async function safeJson<T = unknown>(res: Response): Promise<T | null> {
  if (res.status === 204) return null
  const type = res.headers.get("content-type") ?? ""
  if (!type.includes("application/json")) return null
  try {
    return (await res.json()) as T
  } catch {
    return null
  }
}

export function BiometricDevicesManager({ user }: Props) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newDevice, setNewDevice] = useState<Partial<Device>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [deviceLogs, setDeviceLogs] = useState<AttendanceLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    if (!user.companyId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/company-admin/biometric-devices?company_id=${user.companyId}`)
      const data = await res.json()
      if (data.success) setDevices(data.devices)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDevice = async () => {
    if (!user.companyId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/company-admin/biometric-devices?company_id=${user.companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDevice,
          company_id: user.companyId,
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Device added successfully")
        setNewDevice({ device_name: '', location: '' })
        setIsDialogOpen(false)
        fetchDevices()
      } else {
        setErrorMessage(data.error || "Failed to add device")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/company-admin/biometric-devices/${id}`, { method: "DELETE" })
      fetchDevices()
    } catch (err) {
      console.error("Delete error:", err)
    }
  }

  const fetchLogs = async (device: Device) => { // Renamed from handleDeviceClick to fetchLogs
    setSelectedDevice(device)
    setLogsLoading(true)
    try {
      const res = await fetch(`/api/company-admin/attendance-logs?company_id=${user.companyId}&device_id=${device.id}`) // Changed user.company_id to user.companyId
      if (!res.ok) throw new Error("Failed to fetch device logs")
      const data = await res.json()
      setDeviceLogs(data)
    } catch (err) {
      setDeviceLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Devices ({devices.length})</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Device
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.map((device) => (
            <Card key={device.id} onClick={() => fetchLogs(device)} className="cursor-pointer">
              <CardHeader>
                <CardTitle>{device.device_name}</CardTitle>
                <CardDescription>
                  {device.device_type} - {device.ip_address}:{device.port}
                </CardDescription>
              </CardHeader>
              <div className="flex justify-end space-x-2 p-4">
                <Button size="sm" variant="outline">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => { e.stopPropagation(); handleDelete(device.id) }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Biometric Device</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

            <Input
              placeholder="Device Name"
              value={newDevice.device_name || ""}
              onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
            />
            <Input
              placeholder="Device Type (e.g. zkteco)"
              value={newDevice.device_type || ""}
              onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value })}
            />
            <Input
              placeholder="IP Address"
              value={newDevice.ip_address || ""}
              onChange={(e) => setNewDevice({ ...newDevice, ip_address: e.target.value })}
            />
            <Input
              placeholder="Port"
              type="number"
              value={newDevice.port || 4370}
              onChange={(e) => setNewDevice({ ...newDevice, port: Number(e.target.value) })}
            />
            <Input
              placeholder="Model"
              value={newDevice.model || ""}
              onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
            />
            <Input
              placeholder="Serial Number"
              value={newDevice.serial_number || ""}
              onChange={(e) => setNewDevice({ ...newDevice, serial_number: e.target.value })}
            />
            <Input
              placeholder="Protocol (e.g. TCP)"
              value={newDevice.protocol || ""}
              onChange={(e) => setNewDevice({ ...newDevice, protocol: e.target.value })}
            />
            <Input
              placeholder="Username"
              value={newDevice.username || ""}
              onChange={(e) => setNewDevice({ ...newDevice, username: e.target.value })}
            />
            <Input
              placeholder="Password"
              type="password"
              value={newDevice.password || ""}
              onChange={(e) => setNewDevice({ ...newDevice, password: e.target.value })}
            />
            <Input
              placeholder="Location"
              value={newDevice.location || ""}
              onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
            />
            <Button onClick={handleAddDevice}>Save Device</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Device details and logs modal */}
      {selectedDevice && (
        <Dialog open={!!selectedDevice} onOpenChange={() => setSelectedDevice(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Device Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div><b>Name:</b> {selectedDevice.device_name}</div>
              <div><b>Type:</b> {selectedDevice.device_type}</div>
              <div><b>IP:</b> {selectedDevice.ip_address}</div>
              <div><b>Port:</b> {selectedDevice.port}</div>
              <div><b>Model:</b> {selectedDevice.model}</div>
              <div><b>Serial Number:</b> {selectedDevice.serial_number}</div>
              <div><b>Location:</b> {selectedDevice.location}</div>
            </div>
            <div className="mt-4">
              <b>Attendance Logs:</b>
              {logsLoading ? <div>Loading...</div> : (
                <div className="overflow-x-auto max-h-64">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Device User ID</th>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Raw Log ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deviceLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{log.first_name || "-"} {log.last_name || ""} <span className="text-xs text-gray-400">{log.employee_number || ""}</span></td>
                          <td>{log.device_user_id}</td>
                          <td>{new Date(log.attendance_time).toLocaleString()}</td>
                          <td>{log.attendance_type === 0 ? "Check-in" : log.attendance_type === 1 ? "Check-out" : log.attendance_type}</td>
                          <td>{log.raw_log_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {deviceLogs.length === 0 && <div className="text-gray-400 p-2">No logs for this device.</div>}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
