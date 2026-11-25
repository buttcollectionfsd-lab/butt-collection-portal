import React from 'react';
import { X, Eye } from 'lucide-react';
import WorkOrderDocument from './WorkOrderDocument';

/**
 * Live work-order document preview shown while adding / editing an order.
 * Mirrors the layout of the generated PDF / Word work order so the
 * merchandiser can see the final document before saving.
 */
export default function WorkOrderPreview({ order, company, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-sm overflow-y-auto p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3 text-white">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-300" />
            <span className="text-sm font-bold">Work Order Preview</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 border border-white/20 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition"
            title="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <WorkOrderDocument order={order} company={company} />

        <p className="text-center text-[11px] text-slate-300 mt-3">
          Preview current form data use kar raha hai. Download ke liye order save karein.
        </p>
      </div>
    </div>
  );
}
