'use client';

import {
  Desk,
  Monitor,
  Chair,
  MeetingTable,
  ServerRack,
  Couch,
  CoffeeMachine,
} from './furniture';
import { defaultLayout } from './layouts/default';
import type { FurniturePlacement, OfficeLayout as OfficeLayoutType } from './layouts/default';

const FURNITURE_COMPONENTS: Record<
  FurniturePlacement['type'],
  React.FC
> = {
  desk: Desk,
  monitor: Monitor,
  chair: Chair,
  meetingTable: MeetingTable,
  serverRack: ServerRack,
  couch: Couch,
  coffeeMachine: CoffeeMachine,
};

interface OfficeLayoutProps {
  layout?: OfficeLayoutType;
}

export function OfficeLayout({ layout }: OfficeLayoutProps) {
  const activeLayout = layout ?? defaultLayout;

  return (
    <group>
      {activeLayout.rooms.map((room) => (
        <group
          key={room.labelKey}
          position={[room.position[0], room.position[1], room.position[2]]}
        >
          {room.furniture.map((item, i) => {
            const Component = FURNITURE_COMPONENTS[item.type];
            return (
              <group
                key={`${room.labelKey}-${item.type}-${i}`}
                position={[item.position[0], item.position[1], item.position[2]]}
                rotation={[0, item.rotation ?? 0, 0]}
              >
                <Component />
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
}
