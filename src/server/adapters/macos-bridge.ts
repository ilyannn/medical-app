import { spawnSync } from "node:child_process";
import type { AppConfig } from "@/server/config";
import type { CalendarEvent, ContactProfile } from "@/shared/types";
import { demoAppointments, demoContacts } from "@/test/fixtures/demo-data";

export interface MacOSBridge {
  searchContacts(query: string): Promise<ContactProfile[]>;
  getContactById(id: string): Promise<ContactProfile | null>;
  listEvents(calendarId: string): Promise<CalendarEvent[]>;
  upsertEvent(
    calendarId: string,
    event: Omit<CalendarEvent, "id"> & { id?: string | null },
  ): Promise<CalendarEvent>;
}

export class FakeMacOSBridge implements MacOSBridge {
  private readonly contacts = [...demoContacts];
  private readonly events = [...demoAppointments];

  async searchContacts(query: string): Promise<ContactProfile[]> {
    const normalized = query.toLowerCase();
    return this.contacts.filter((contact) =>
      `${contact.name} ${contact.email ?? ""} ${contact.phone ?? ""}`
        .toLowerCase()
        .includes(normalized),
    );
  }

  async getContactById(id: string): Promise<ContactProfile | null> {
    return this.contacts.find((contact) => contact.id === id) ?? null;
  }

  async listEvents(): Promise<CalendarEvent[]> {
    return [...this.events].sort((left, right) =>
      left.start.localeCompare(right.start),
    );
  }

  async upsertEvent(
    _calendarId: string,
    event: Omit<CalendarEvent, "id"> & { id?: string | null },
  ): Promise<CalendarEvent> {
    const nextEvent: CalendarEvent = {
      ...event,
      id: event.id ?? `event-${crypto.randomUUID().slice(0, 8)}`,
    };
    const index = this.events.findIndex(
      (existing) => existing.id === nextEvent.id,
    );
    if (index >= 0) {
      this.events[index] = nextEvent;
    } else {
      this.events.push(nextEvent);
    }
    return nextEvent;
  }
}

export class LocalMacOSBridge implements MacOSBridge {
  constructor(private readonly config: AppConfig) {}

  private execute(command: string, ...args: string[]) {
    if (!this.config.macosBridge.binary) {
      throw new Error(
        "MACOS_BRIDGE_BIN is required when MACOS_BRIDGE_MODE=local",
      );
    }
    const result = spawnSync(
      this.config.macosBridge.binary,
      [command, ...args],
      {
        encoding: "utf8",
      },
    );
    if (result.status !== 0) {
      throw new Error(result.stderr || `Bridge command failed: ${command}`);
    }
    return JSON.parse(result.stdout);
  }

  async searchContacts(query: string): Promise<ContactProfile[]> {
    return this.execute("search-contacts", query) as ContactProfile[];
  }

  async getContactById(id: string): Promise<ContactProfile | null> {
    const matches = (await this.searchContacts(id)).filter(
      (contact) => contact.id === id,
    );
    return matches[0] ?? null;
  }

  async listEvents(calendarId: string): Promise<CalendarEvent[]> {
    return this.execute("list-events", calendarId) as CalendarEvent[];
  }

  async upsertEvent(
    _calendarId: string,
    _event: Omit<CalendarEvent, "id"> & { id?: string | null },
  ): Promise<CalendarEvent> {
    throw new Error(
      "Native event write support is reserved for local bridge extensions.",
    );
  }
}

export function createMacOSBridge(config: AppConfig): MacOSBridge {
  return config.macosBridge.mode === "local"
    ? new LocalMacOSBridge(config)
    : new FakeMacOSBridge();
}
