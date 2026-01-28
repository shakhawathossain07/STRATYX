import React from 'react';
import { Activity, ArrowRight } from 'lucide-react';

export const CausalGraph: React.FC = () => {
  return (
    <div className="bg-surface border border-slate-800 rounded-xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Causal Strategy Graph</h3>
          <p className="text-xs text-slate-500">Relating micro-actions to macro outcomes</p>
        </div>
        <Activity className="text-primary" size={20} />
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-4">
        <div className="flex items-center justify-between">
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-center w-32">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Micro Action</p>
            <p className="text-xs font-medium">Early Overpeek</p>
          </div>
          <ArrowRight className="text-slate-600" size={16} />
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-center w-32">
            <p className="text-[10px] text-red-500/70 font-bold uppercase">Intermediate</p>
            <p className="text-xs font-medium">Man Disadvantage</p>
          </div>
          <ArrowRight className="text-slate-600" size={16} />
          <div className="p-3 bg-red-500/20 rounded-lg border border-red-500/40 text-center w-32">
            <p className="text-[10px] text-red-500 font-bold uppercase">Macro Outcome</p>
            <p className="text-xs font-medium">Site Collapse</p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-primary/5 border border-primary/10 rounded-lg">
          <h4 className="text-xs font-bold text-primary uppercase mb-2">AI Diagnosis</h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            Recurring over-aggression by <span className="text-white font-bold">m0NESY</span> in mid-round transitions has a <span className="text-primary font-bold">0.68 causal weight</span> on recent round losses. 
            Counterfactual analysis suggests a <span className="text-green-500 font-bold">+14.2% win probability</span> if defensive posture is maintained.
          </p>
        </div>
      </div>
    </div>
  );
};
