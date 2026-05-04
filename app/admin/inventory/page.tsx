"use client";

import { useState, useEffect } from "react";
import InventoryManager from "@/components/admin/InventoryManager";
import type { Hotel, Room } from "@/lib/types";

export default function AdminInventoryPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    fetch("/api/admin/hotels")
      .then((r) => r.json())
      .then((data: { hotels: Hotel[] }) => {
        const list = data.hotels ?? [];
        setHotels(list);
        if (list.length > 0) setSelectedHotelId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingHotels(false));
  }, []);

  useEffect(() => {
    if (!selectedHotelId) return;
    setLoadingRooms(true);
    setSelectedRoomId("");
    fetch(`/api/admin/hotels/${selectedHotelId}/rooms`)
      .then((r) => r.json())
      .then((data: { rooms: Room[] }) => {
        const list = data.rooms ?? [];
        setRooms(list);
        if (list.length > 0) setSelectedRoomId(list[0].id);
      })
      .catch(() => setRooms([]))
      .finally(() => setLoadingRooms(false));
  }, [selectedHotelId]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1
          className="font-playfair text-2xl font-bold text-[#1B2A4A]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Inventory
        </h1>
        <p className="mt-0.5 text-sm text-[#64748B]">
          Manage room availability by date
        </p>
      </div>

      {/* Selectors */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Hotel
          </label>
          <select
            value={selectedHotelId}
            onChange={(e) => setSelectedHotelId(e.target.value)}
            disabled={loadingHotels}
            className="min-w-[220px] rounded-lg border border-[#E2D9C5] bg-white px-3 py-2.5 text-sm text-[#1B2A4A] outline-none focus:border-[#C9A84C]"
          >
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Room Type
          </label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            disabled={loadingRooms || rooms.length === 0}
            className="min-w-[220px] rounded-lg border border-[#E2D9C5] bg-white px-3 py-2.5 text-sm text-[#1B2A4A] outline-none focus:border-[#C9A84C]"
          >
            {loadingRooms ? (
              <option>Loading…</option>
            ) : rooms.length === 0 ? (
              <option>No rooms</option>
            ) : (
              rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Calendar grid */}
      {selectedHotelId && selectedRoomId ? (
        <InventoryManager
          hotelId={selectedHotelId}
          roomId={selectedRoomId}
        />
      ) : (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-[#E2D9C5] bg-white text-[#94A3B8]">
          Select a hotel and room type to manage inventory
        </div>
      )}
    </div>
  );
}
