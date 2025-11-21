import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  // Mock data
  const rooms = [
    { id: 1, name: "General" },
    { id: 2, name: "Random" },
    { id: 3, name: "Tech Talk" },
  ];

  return (
    <div className="w-64 border-r bg-gray-50 flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-semibold">Chat Rooms</h2>
        <Button variant="ghost" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/room/${room.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 cursor-pointer"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>{room.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{room.name}</span>
            </Link>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full justify-start gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

