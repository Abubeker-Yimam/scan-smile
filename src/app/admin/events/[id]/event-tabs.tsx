"use client";

import { useState } from "react";

export function EventTabs({
  guestCount,
  guestsContent,
  settingsContent,
  printContent,
}: {
  guestCount: number;
  guestsContent: React.ReactNode;
  settingsContent: React.ReactNode;
  printContent: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"guests" | "settings" | "print">("guests");

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="border-b border-cotton-3">
        <nav className="flex space-x-6 sm:space-x-8 font-mono text-[0.68rem] tracking-[0.16em] uppercase">
          <button
            type="button"
            onClick={() => setActiveTab("guests")}
            className={
              "pb-3.5 pt-1 border-b-2 transition-colors cursor-pointer " +
              (activeTab === "guests"
                ? "border-gold text-coffee font-semibold"
                : "border-transparent text-ash hover:text-coffee hover:border-cotton-3")
            }
          >
            Guests &amp; Seating ({guestCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={
              "pb-3.5 pt-1 border-b-2 transition-colors cursor-pointer " +
              (activeTab === "settings"
                ? "border-gold text-coffee font-semibold"
                : "border-transparent text-ash hover:text-coffee hover:border-cotton-3")
            }
          >
            Event Settings &amp; Theme
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("print")}
            className={
              "pb-3.5 pt-1 border-b-2 transition-colors cursor-pointer " +
              (activeTab === "print"
                ? "border-gold text-coffee font-semibold"
                : "border-transparent text-ash hover:text-coffee hover:border-cotton-3")
            }
          >
            Print Table Cards
          </button>
        </nav>
      </div>

      {/* Tab Content Panels */}
      <div>
        {activeTab === "guests" && <div>{guestsContent}</div>}
        {activeTab === "settings" && <div>{settingsContent}</div>}
        {activeTab === "print" && <div>{printContent}</div>}
      </div>
    </div>
  );
}
