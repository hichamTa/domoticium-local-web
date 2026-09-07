export interface LocalDevice {
  entityId: string;
  name: string;
  domain: string;
  state: string | null;
}

export interface LocalRoom {
  name: string;
  devices: LocalDevice[];
}

// Domaines qu'on sait piloter en un clic (toggle) — même liste que
// ALLOWED_SERVICES côté addon pour "toggle", pas plus large. Les autres
// domaines contrôlables (cover, climate, lock, fan) ont des commandes plus
// riches qu'un simple on/off — hors périmètre de cette 1re vraie interface,
// affichés en lecture seule pour l'instant plutôt que mal représentés par un
// toggle qui ne leur correspond pas.
export const TOGGLABLE_DOMAINS = new Set(["light", "switch"]);
