/**
 * Floor 3 — Comunicação
 * Marketing and sales rooms
 */
import type { OfficeLayout } from './types';

export const communicationLayout: OfficeLayout = {
  rooms: [
    {
      name: 'Marketing',
      labelKey: 'marketing',
      position: [0, 0, 0],
      size: [8, 5],
      furniture: [
        // 3 desk+chair+monitor sets
        { type: 'desk', position: [2, 0, 1.5] },
        { type: 'chair', position: [2, 0, 2.3], rotation: Math.PI },
        { type: 'monitor', position: [2, 0.75, 1.3] },

        { type: 'desk', position: [4, 0, 1.5] },
        { type: 'chair', position: [4, 0, 2.3], rotation: Math.PI },
        { type: 'monitor', position: [4, 0.75, 1.3] },

        { type: 'desk', position: [6, 0, 1.5] },
        { type: 'chair', position: [6, 0, 2.3], rotation: Math.PI },
        { type: 'monitor', position: [6, 0.75, 1.3] },

        // Couch for brainstorming
        { type: 'couch', position: [4, 0, 4] },
      ],
    },
    {
      name: 'Vendas',
      labelKey: 'sales',
      position: [9, 0, 0],
      size: [7, 5],
      furniture: [
        // 2 desk+chair+monitor sets
        { type: 'desk', position: [2, 0, 1.5] },
        { type: 'chair', position: [2, 0, 2.3], rotation: Math.PI },
        { type: 'monitor', position: [2, 0.75, 1.3] },

        { type: 'desk', position: [4.5, 0, 1.5] },
        { type: 'chair', position: [4.5, 0, 2.3], rotation: Math.PI },
        { type: 'monitor', position: [4.5, 0.75, 1.3] },

        // Meeting table for client calls
        { type: 'meetingTable', position: [3.5, 0, 4] },
        { type: 'chair', position: [2.5, 0, 4], rotation: Math.PI / 2 },
        { type: 'chair', position: [4.5, 0, 4], rotation: -Math.PI / 2 },
      ],
    },
  ],
};
