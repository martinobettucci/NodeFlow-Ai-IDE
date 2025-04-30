import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { NodeType, NodeMode, ConnectionType } from '../../types';

const connectionEmoticons = {
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Properties</h2>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this node?')) {
              setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            }
          }}
          className="flex items-center space-x-1 px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
          title="Delete node"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm">Delete</span>
        </button>
      </div>
}