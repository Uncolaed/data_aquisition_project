import { useEffect, useRef, useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export default function Live() {
  const [messages, setMessages] = useState([])
  const lastMessageRef = useRef(null)
  const lastUpdateRef = useRef(0)

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080")

    ws.onmessage = (event) => {
      try {
        const now = Date.now()
        // Add 500ms delay between updates
        if (now - lastUpdateRef.current < 500) {
          return
        }
        lastUpdateRef.current = now

        const record = JSON.parse(event.data)
        setMessages((prev) => [
          ...prev,
          {
            waterLevel: record.waterLevel,
            inputMotor: record.inputMotor,
            outputMotor: record.outputMotor,
            time: new Date(record.timestamp).toLocaleTimeString(),
          },
        ])
      } catch (e) {
        console.error("Failed to parse message:", e)
      }
    }

    return () => ws.close()
  }, [])

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Live Arduino Feed</CardTitle>
        <Badge variant="outline">WebSocket Active</Badge>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px] rounded-md border p-4">
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
              <p className="text-sm">Water Level: <span className="font-semibold">{msg.waterLevel}</span></p>
              <p className="text-sm">Input Motor: <Badge variant={msg.inputMotor ? "default" : "outline"}>{msg.inputMotor ? "ON" : "OFF"}</Badge></p>
              <p className="text-sm">Output Motor: <Badge variant={msg.outputMotor ? "default" : "outline"}>{msg.outputMotor ? "ON" : "OFF"}</Badge></p>
              {index < messages.length - 1 && (
                <Separator className="my-2" />
              )}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
