/**
 * Subsolo — Servidores
 * Server basement / Datacenter
 */
import type { OfficeLayout } from './types';

export const basementLayout: OfficeLayout = {
  rooms: [
    {
      name: 'Datacenter',
      labelKey: 'datacenter',
      position: [0, 0, 0],
      size: [12, 8],
      furniture: [
        // Row 1 — server racks
        { type: 'serverRack', position: [2, 0, 1.5] },
        { type: 'serverRack', position: [4, 0, 1.5] },
        { type: 'serverRack', position: [6, 0, 1.5] },
        { type: 'serverRack', position: [8, 0, 1.5] },
        { type: 'serverRack', position: [10, 0, 1.5] },

        // Row 2 — server racks
        { type: 'serverRack', position: [2, 0, 4] },
        { type: 'serverRack', position: [4, 0, 4] },
        { type: 'serverRack', position: [6, 0, 4] },
        { type: 'serverRack', position: [8, 0, 4] },
        { type: 'serverRack', position: [10, 0, 4] },

        // Row 3 — server racks
        { type: 'serverRack', position: [2, 0, 6.5] },
        { type: 'serverRack', position: [4, 0, 6.5] },
        { type: 'serverRack', position: [6, 0, 6.5] },
        { type: 'serverRack', position: [8, 0, 6.5] },
        { type: 'serverRack', position: [10, 0, 6.5] },
      ],
    },
  ],
};
