'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { WorkflowVariable } from '@ai-office/shared';
import type { Node } from '@xyflow/react';

interface VariablesPanelProps {
  variables: WorkflowVariable[];
  onChange: (variables: WorkflowVariable[]) => void;
  nodes: Node[];
  onClose: () => void;
}

function getVariableReferences(key: string, nodes: Node[]): string[] {
  const refs: string[] = [];
  const pattern = `{{${key}}}`;
  for (const node of nodes) {
    const dataStr = JSON.stringify(node.data ?? {});
    if (dataStr.includes(pattern)) {
      refs.push(node.id);
    }
  }
  return refs;
}

export function VariablesPanel({ variables, onChange, nodes, onClose }: VariablesPanelProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const addVariable = () => {
    const newVar: WorkflowVariable = {
      key: `var_${Date.now()}`,
      label: '',
      type: 'text',
      required: false,
    };
    onChange([...variables, newVar]);
    setEditingIdx(variables.length);
  };

  const updateVariable = (idx: number, updates: Partial<WorkflowVariable>) => {
    const updated = variables.map((v, i) => (i === idx ? { ...v, ...updates } : v));
    onChange(updated);
  };

  const removeVariable = (idx: number) => {
    onChange(variables.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  return (
    <div className="w-56 border border-border-default bg-bg-raised p-2 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[8px] uppercase tracking-[0.15em] text-accent-cyan">
          Variables
        </p>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X size={10} />
        </button>
      </div>

      {variables.map((v, idx) => {
        const refs = getVariableReferences(v.key, nodes);
        const isEditing = editingIdx === idx;

        return (
          <div
            key={idx}
            className="border border-border-default bg-bg-base p-2 space-y-1.5"
          >
            {isEditing ? (
              <>
                <div>
                  <label className="mb-1 block text-[7px] uppercase tracking-[0.15em] text-text-muted">
                    Key
                  </label>
                  <Input
                    value={v.key}
                    onChange={(e) =>
                      updateVariable(idx, { key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })
                    }
                    placeholder="variable_key"
                    className="!text-[10px] !py-1"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[7px] uppercase tracking-[0.15em] text-text-muted">
                    Label
                  </label>
                  <Input
                    value={v.label}
                    onChange={(e) => updateVariable(idx, { label: e.target.value })}
                    placeholder="Display label"
                    className="!text-[10px] !py-1"
                  />
                </div>
                <div className="flex gap-1.5">
                  <div className="flex-1">
                    <label className="mb-1 block text-[7px] uppercase tracking-[0.15em] text-text-muted">
                      Type
                    </label>
                    <select
                      value={v.type}
                      onChange={(e) =>
                        updateVariable(idx, { type: e.target.value as 'text' | 'number' | 'select' })
                      }
                      className="w-full border border-border-default bg-bg-base px-1.5 py-1 text-[10px] text-text-primary focus:border-accent-cyan focus:outline-none"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="select">Select</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-1">
                    <label className="flex items-center gap-1 text-[8px] text-text-muted pb-1">
                      <input
                        type="checkbox"
                        checked={v.required}
                        onChange={(e) => updateVariable(idx, { required: e.target.checked })}
                        className="h-3 w-3"
                      />
                      Req
                    </label>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[7px] uppercase tracking-[0.15em] text-text-muted">
                    Default
                  </label>
                  <Input
                    value={v.defaultValue ?? ''}
                    onChange={(e) => updateVariable(idx, { defaultValue: e.target.value || undefined })}
                    placeholder="Default value"
                    className="!text-[10px] !py-1"
                  />
                </div>
                {v.type === 'select' && (
                  <div>
                    <label className="mb-1 block text-[7px] uppercase tracking-[0.15em] text-text-muted">
                      Options (comma-separated)
                    </label>
                    <Input
                      value={(v.options ?? []).join(', ')}
                      onChange={(e) =>
                        updateVariable(idx, {
                          options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      placeholder="opt1, opt2, opt3"
                      className="!text-[10px] !py-1"
                    />
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <button
                    onClick={() => removeVariable(idx)}
                    className="flex items-center gap-1 text-[8px] text-status-error hover:underline"
                  >
                    <Trash2 size={8} /> Delete
                  </button>
                  <button
                    onClick={() => setEditingIdx(null)}
                    className="text-[8px] text-accent-cyan hover:underline"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setEditingIdx(idx)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-text-primary">
                    {`{{${v.key}}}`}
                  </span>
                  {v.required && (
                    <span className="text-[7px] text-status-error">REQ</span>
                  )}
                </div>
                <p className="text-[8px] text-text-muted">
                  {v.label || v.key} &middot; {v.type}
                  {refs.length > 0 && (
                    <span className="text-accent-cyan"> &middot; {refs.length} ref{refs.length !== 1 ? 's' : ''}</span>
                  )}
                </p>
              </button>
            )}
          </div>
        );
      })}

      <button
        onClick={addVariable}
        className="flex w-full items-center justify-center gap-1 border border-dashed border-border-default px-2 py-1.5 text-[10px] text-text-muted transition-colors hover:border-accent-cyan hover:text-accent-cyan"
      >
        <Plus size={10} /> Add Variable
      </button>
    </div>
  );
}
