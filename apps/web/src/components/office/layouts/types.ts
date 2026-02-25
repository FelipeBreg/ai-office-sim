export interface FurniturePlacement {
  type:
    | 'desk'
    | 'monitor'
    | 'chair'
    | 'meetingTable'
    | 'serverRack'
    | 'couch'
    | 'coffeeMachine';
  position: [number, number, number];
  rotation?: number; // y-axis rotation in radians
}

export interface RoomLayout {
  name: string;
  labelKey: string; // translation key
  position: [number, number, number];
  size: [number, number]; // width x depth
  furniture: FurniturePlacement[];
}

export interface OfficeLayout {
  rooms: RoomLayout[];
}

export interface FloorConfig {
  id: string;
  labelKey: string; // next-intl translation key under "office.floors"
  baseY: number; // Y position in world space
  layout: OfficeLayout;
}
