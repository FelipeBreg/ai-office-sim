export type { FurniturePlacement, RoomLayout, OfficeLayout, FloorConfig } from './types';
import type { OfficeLayout } from './types';

export const defaultLayout: OfficeLayout = {
  rooms: [
    {
      name: 'Open Workspace',
      labelKey: 'openWorkspace',
      position: [0, 0, 0],
      size: [10, 8],
      furniture: [
        // Row 1 — 3 desk+chair+monitor sets
        { type: 'desk', position: [2, 0, 2] },
        { type: 'chair', position: [2, 0, 2.8], rotation: Math.PI },
        { type: 'monitor', position: [2, 0.75, 1.8] },

        { type: 'desk', position: [4, 0, 2] },
        { type: 'chair', position: [4, 0, 2.8], rotation: Math.PI },
        { type: 'monitor', position: [4, 0.75, 1.8] },

        { type: 'desk', position: [6, 0, 2] },
        { type: 'chair', position: [6, 0, 2.8], rotation: Math.PI },
        { type: 'monitor', position: [6, 0.75, 1.8] },

        // Row 2 — 3 desk+chair+monitor sets
        { type: 'desk', position: [2, 0, 5] },
        { type: 'chair', position: [2, 0, 5.8], rotation: Math.PI },
        { type: 'monitor', position: [2, 0.75, 4.8] },

        { type: 'desk', position: [4, 0, 5] },
        { type: 'chair', position: [4, 0, 5.8], rotation: Math.PI },
        { type: 'monitor', position: [4, 0.75, 4.8] },

        { type: 'desk', position: [6, 0, 5] },
        { type: 'chair', position: [6, 0, 5.8], rotation: Math.PI },
        { type: 'monitor', position: [6, 0.75, 4.8] },
      ],
    },
    {
      name: 'Meeting Pod',
      labelKey: 'meetingPod',
      position: [11, 0, 0],
      size: [4, 4],
      furniture: [
        { type: 'meetingTable', position: [2, 0, 2] },
        { type: 'chair', position: [2, 0, 0.8] },
        { type: 'chair', position: [2, 0, 3.2], rotation: Math.PI },
        { type: 'chair', position: [0.6, 0, 2], rotation: Math.PI / 2 },
        { type: 'chair', position: [3.4, 0, 2], rotation: -Math.PI / 2 },
      ],
    },
    {
      name: 'Breakroom',
      labelKey: 'breakroom',
      position: [11, 0, 5],
      size: [4, 3],
      furniture: [
        { type: 'couch', position: [1.2, 0, 1.5] },
        { type: 'coffeeMachine', position: [3.2, 0, 0.5] },
      ],
    },
    {
      name: 'Server Rack',
      labelKey: 'serverRack',
      position: [16, 0, 0],
      size: [3, 8],
      furniture: [
        { type: 'serverRack', position: [1.5, 0, 1.5] },
        { type: 'serverRack', position: [1.5, 0, 4] },
        { type: 'serverRack', position: [1.5, 0, 6.5] },
      ],
    },
  ],
};
