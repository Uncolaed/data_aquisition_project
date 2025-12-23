import { useEffect, useMemo, useRef, useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Droplets, Droplet } from "lucide-react"

function clamp(value, min, max) {
  if (value < min) return min
  if (value > max) return max
  return value
}

function getLevelLabel(waterLevel, low = 300, high = 600) {
  if (waterLevel == null) return { label: "Unknown", variant: "outline" }
  if (waterLevel < low) return { label: "Low", variant: "destructive" }
  if (waterLevel > high) return { label: "High", variant: "default" }
  return { label: "Normal", variant: "secondary" }
}

function WaterTank({ waterLevel, min = 0, max = 580 }) {
  const percent = useMemo(() => {
    if (waterLevel == null) return 0
    const raw = (waterLevel - min) / (max - min)
    return clamp(Math.round(raw * 100), 0, 100)
  }, [waterLevel, min, max])

  // SVG coordinates, tank inner height is 92px, fill from bottom
  const innerTop = 16
  const innerHeight = 92
  const fillHeight = Math.round((percent / 100) * innerHeight)
  const fillY = innerTop + (innerHeight - fillHeight)

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-28 w-20">
        <svg viewBox="0 0 80 120" className="h-full w-full">
          {/* Tank outline */}
          <rect
            x="12"
            y="12"
            width="56"
            height="96"
            rx="12"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="3"
          />

          {/* Water fill */}
          <defs>
            <clipPath id="tankClip">
              <rect x="12" y="12" width="56" height="96" rx="12" />
            </clipPath>
          </defs>

          <g clipPath="url(#tankClip)">
            <rect
              x="12"
              y={fillY}
              width="56"
              height={fillHeight}
              fill="hsl(var(--primary))"
              opacity="0.28"
            />
            {/* Simple wave line */}
            <path
              d={`M12 ${fillY} C 22 ${fillY - 4}, 30 ${fillY + 4}, 40 ${fillY} C 50 ${fillY - 4}, 58 ${fillY + 4}, 68 ${fillY}`}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              opacity="0.5"
              fill="none"
            />
          </g>
        </svg>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Droplet className="h-4 w-4" />
          <p className="text-sm font-medium">Water Tank</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Level: <span className="font-semibold text-foreground">{waterLevel ?? 0}</span>
          <span className="text-muted-foreground"> , {percent}%</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Sensor range: {min} to {max}
        </p>
      </div>
    </div>
  )
}

export default function Live() {
  const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080"

  const [messages, setMessages] = useState([])
  const [isPaused, setIsPaused] = useState(false)
  const [connection, setConnection] = useState("Connecting")

  const lastMessageRef = useRef(null)
  const lastUpdateRef = useRef(0)

  useEffect(() => {
    const ws = new WebSocket(WS_URL)

    ws.onopen = () => setConnection("Connected")
    ws.onclose = () => setConnection("Disconnected")
    ws.onerror = () => setConnection("Error")

    ws.onmessage = (event) => {
      if (isPaused) return

      const now = Date.now()
      if (now - lastUpdateRef.current < 300) return
      lastUpdateRef.current = now

      try {
        const record = JSON.parse(event.data)

        const msg = {
          waterLevel: record.waterLevel,
          inputMotor: Boolean(record.inputMotor),
          outputMotor: Boolean(record.outputMotor),
          time: record.timestamp
            ? new Date(record.timestamp).toLocaleTimeString()
            : new Date().toLocaleTimeString(),
        }

        setMessages((prev) => {
          const next = [...prev, msg]
          // keep it light, last 200 messages
          return next.length > 200 ? next.slice(next.length - 200) : next
        })
      } catch (e) {
        console.error("Failed to parse message:", e)
      }
    }

    return () => ws.close()
  }, [WS_URL, isPaused])

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const latest = messages.length ? messages[messages.length - 1] : null
  const waterStatus = getLevelLabel(latest?.waterLevel)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            <CardTitle>Live Water System</CardTitle>
          </div>

          <Badge variant="outline">{connection}</Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Simple “fun” top section */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardContent className="pt-6">
                <WaterTank waterLevel={latest?.waterLevel} />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Water status</span>
                  <Badge variant={waterStatus.variant}>{waterStatus.label}</Badge>

                  <span className="ml-2 text-sm text-muted-foreground">Feed</span>
                  <Badge variant={isPaused ? "destructive" : "secondary"}>
                    {isPaused ? "Paused" : "Live"}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Input Pump</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={latest?.inputMotor ? "default" : "outline"}>
                        {latest?.inputMotor ? "ON" : "OFF"}
                      </Badge>
                      {latest?.inputMotor ? (
                        <span className="text-xs text-muted-foreground">running</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">idle</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Output Pump</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={latest?.outputMotor ? "default" : "outline"}>
                        {latest?.outputMotor ? "ON" : "OFF"}
                      </Badge>
                      {latest?.outputMotor ? (
                        <span className="text-xs text-muted-foreground">running</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">idle</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={isPaused ? "default" : "secondary"}
                    onClick={() => setIsPaused((v) => !v)}
                  >
                    {isPaused ? "Resume feed" : "Pause feed"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setMessages([])}
                  >
                    Clear feed
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Your original live feed, kept simple */}
          <div>
            <p className="mb-2 text-sm font-medium">Raw Live Feed</p>
            <ScrollArea className="h-[360px] rounded-md border p-4">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Waiting for sensor data...
                </p>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  ref={index === messages.length - 1 ? lastMessageRef : null}
                  className="space-y-1"
                >
                  <p className="text-xs text-muted-foreground">{msg.time}</p>

                  <p className="text-sm">
                    Water Level:{" "}
                    <span className="font-semibold">{msg.waterLevel}</span>
                  </p>

                  <p className="text-sm">
                    Input Motor:{" "}
                    <Badge variant={msg.inputMotor ? "default" : "outline"}>
                      {msg.inputMotor ? "ON" : "OFF"}
                    </Badge>
                  </p>

                  <p className="text-sm">
                    Output Motor:{" "}
                    <Badge variant={msg.outputMotor ? "default" : "outline"}>
                      {msg.outputMotor ? "ON" : "OFF"}
                    </Badge>
                  </p>

                  {index < messages.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
