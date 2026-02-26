/**
 * Unified Single-Floor Layout
 *
 * All rooms from every floor merged onto one Y=0 plane.
 *
 * Row 1 (Z=0):  Open Workspace | Meeting Pod + Breakroom | Server Rack
 * Row 2 (Z=10): Analysis Room  | Data Lab
 * Row 3 (Z=18): Marketing      | Sales
 * Row 4 (Z=25): Datacenter
 */
import type { OfficeLayout } from './types';

export const unifiedLayout: OfficeLayout = {
  rooms: [
    // ── Row 1 — Operations (from default layout) ────────────────────
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

    // ── Row 2 — Intelligence (Z offset +10) ─────────────────────────
    {
      name: 'Sala de Análise',
      labelKey: 'analysisRoom',
      position: [0, 0, 10],
      size: [8, 6],
      furniture: [
        { type: 'desk', position: [2, 0, 2] },
        { type: 'chair', position: [2, 0, 2.8], rotation: Math.PI },
        { type: 'monitor', position: [2, 0.75, 1.8] },

        { type: 'desk', position: [5, 0, 2] },
        { type: 'chair', position: [5, 0, 2.8], rotation: Math.PI },
        { type: 'monitor', position: [5, 0.75, 1.8] },

        { type: 'meetingTable', position: [4, 0, 4.5] },
        { type: 'chair', position: [3, 0, 4.5], rotation: Math.PI / 2 },
        { type: 'chair', position: [5, 0, 4.5], rotation: -Math.PI / 2 },
      ],
    },
    {
      name: 'Laboratório de Dados',
      labelKey: 'dataLab',
      position: [9, 0, 10],
      size: [6, 4],
      furniture: [
        { type: 'desk', position: [1.5, 0, 2] },
        { type: 'monitor', position: [1.5, 0.75, 1.8] },
        { type: 'chair', position: [1.5, 0, 2.8], rotation: Math.PI },

        { type: 'desk', position: [4, 0, 2] },
        { type: 'monitor', position: [4, 0.75, 1.8] },
        { type: 'chair', position: [4, 0, 2.8], rotation: Math.PI },

        { type: 'serverRack', position: [5.2, 0, 0.5] },
      ],
    },

    // ── Row 3 — Communication (Z offset +18) ────────────────────────
    {
      name: 'Marketing',
      labelKey: 'marketing',
      position: [0, 0, 18],
      size: [8, 5],
      furniture: [
        { type: 'desk', position: [2, 0, 1.5] },
        { type: 'chair', position: [2, 0, 2.3], rotation: Math.PI },
        { type: 'monitor', position: [2, 0.75, 1.3] },

        { type: 'desk', position: [4, 0, 1.5] },
        { type: 'chair', position: [4, 0, 2.3], rotation: Math.PI },
        { type: 'monitor', position: [4, 0.75, 1.3] },

        { type: 'desk', position: [6, 0, 1.5] },
        { type: 'chair', position: [6, 0, 2.3], rotation: Math.PI },
        { type: 'monitor', position: [6, 0.75, 1.3] },

        { type: 'couch', position: [4, 0, 4] },
      ],
    },
    {
      name: 'Vendas',
      labelKey: 'sales',
      position: [9, 0, 18],
      size: [7, 5],
      furniture: [
        { type: 'desk', position: [2, 0, 1.5] },
        { type: 'chair', position: [2, 0, 2.3], rotation: Math.PI },
        { type: 'monitor', position: [2, 0.75, 1.3] },

        { type: 'desk', position: [4.5, 0, 1.5] },
        { type: 'chair', position: [4.5, 0, 2.3], rotation: Math.PI },
        { type: 'monitor', position: [4.5, 0.75, 1.3] },

        { type: 'meetingTable', position: [3.5, 0, 4] },
        { type: 'chair', position: [2.5, 0, 4], rotation: Math.PI / 2 },
        { type: 'chair', position: [4.5, 0, 4], rotation: -Math.PI / 2 },
      ],
    },

    // ── Row 4 — Datacenter (Z offset +25) ───────────────────────────
    {
      name: 'Datacenter',
      labelKey: 'datacenter',
      position: [0, 0, 25],
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
