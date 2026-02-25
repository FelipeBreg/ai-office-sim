/**
 * Floor 2 — Inteligência
 * Analytics and research rooms
 */
import type { OfficeLayout } from './types';

export const intelligenceLayout: OfficeLayout = {
  rooms: [
    {
      name: 'Sala de Análise',
      labelKey: 'analysisRoom',
      position: [0, 0, 0],
      size: [8, 6],
      furniture: [
        // 2 desk+chair+monitor sets
        { type: 'desk', position: [2, 0, 2] },
        { type: 'chair', position: [2, 0, 2.8], rotation: Math.PI },
        { type: 'monitor', position: [2, 0.75, 1.8] },

        { type: 'desk', position: [5, 0, 2] },
        { type: 'chair', position: [5, 0, 2.8], rotation: Math.PI },
        { type: 'monitor', position: [5, 0.75, 1.8] },

        // Meeting table for collaboration
        { type: 'meetingTable', position: [4, 0, 4.5] },
        { type: 'chair', position: [3, 0, 4.5], rotation: Math.PI / 2 },
        { type: 'chair', position: [5, 0, 4.5], rotation: -Math.PI / 2 },
      ],
    },
    {
      name: 'Laboratório de Dados',
      labelKey: 'dataLab',
      position: [9, 0, 0],
      size: [6, 4],
      furniture: [
        // 2 desk+monitor sets — data workstations
        { type: 'desk', position: [1.5, 0, 2] },
        { type: 'monitor', position: [1.5, 0.75, 1.8] },
        { type: 'chair', position: [1.5, 0, 2.8], rotation: Math.PI },

        { type: 'desk', position: [4, 0, 2] },
        { type: 'monitor', position: [4, 0.75, 1.8] },
        { type: 'chair', position: [4, 0, 2.8], rotation: Math.PI },

        // Server rack for local data processing
        { type: 'serverRack', position: [5.2, 0, 0.5] },
      ],
    },
  ],
};
