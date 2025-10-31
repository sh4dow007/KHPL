import React, { useRef, useEffect, useState, useMemo } from 'react';
import Tree from 'react-d3-tree';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';

// Convert backend tree node to react-d3-tree format
const toD3Node = (node) => {
  return {
    name: node.name || 'User',
    attributes: {
      phone: node.phone || '',
      level: `L${node.level ?? 0}`,
      members: `${node.children_count ?? 0} members`,
      points: node.points ?? 0,
      id: node.id,
    },
    children: (node.children || []).map(toD3Node),
  };
};

export default function TreeGraph({ data, isOwner, onDeleteUser, onSavePoints, formatDisplayName }) {
  const containerRef = useRef(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [editingPoints, setEditingPoints] = useState({});
  const [pointsInputs, setPointsInputs] = useState({});

  const d3Data = useMemo(() => (data ? toD3Node(data) : null), [data]);

  useEffect(() => {
    if (!containerRef.current) return;
    const { width } = containerRef.current.getBoundingClientRect();
    // Center horizontally, small top padding
    setTranslate({ x: width / 2, y: 80 });
  }, [containerRef.current]);

  const renderNode = ({ nodeDatum }) => {
    const id = nodeDatum.attributes?.id;
    const level = nodeDatum.attributes?.level || 'L0';
    const members = nodeDatum.attributes?.members || '0 members';
    const phone = nodeDatum.attributes?.phone || '';
    const points = nodeDatum.attributes?.points || 0;
    const name = nodeDatum.name || '';

    const isEditing = editingPoints[id];

    return (
      // Slightly larger bounds and y-offset so shadows/borders aren't clipped by foreignObject
      <foreignObject width={230} height={140} x={-115} y={-70}>
        <div className="relative w-[230px] p-1" style={{ overflow: 'visible' }}>
          <div
            className="bg-white border border-gray-300 rounded-lg p-2 shadow-lg"
            style={{ boxShadow: '0 8px 16px rgba(0,0,0,0.12)', borderBottomWidth: 2 }}
          >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
              <span className="font-semibold text-xs text-gray-900 truncate" title={name}>
                {formatDisplayName ? formatDisplayName(name, 18) : name}
              </span>
            </div>
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-red-500 hover:text-red-700 p-1" title="Delete member">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Member</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete <strong>{name}</strong> and all descendants?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => onDeleteUser?.(id, name)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <div className="text-[11px] text-gray-600 truncate">{phone}</div>
          <div className="mt-1 flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">{level}</Badge>
            <span className="text-[11px] text-gray-600">{members}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center text-[11px] text-gray-600">
              <span className="mr-1">⭐</span>
              <span>Points:</span>
            </div>
            {isOwner && isEditing ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  value={pointsInputs[id] ?? points}
                  onChange={(e) => setPointsInputs((p) => ({ ...p, [id]: parseInt(e.target.value) || 0 }))}
                  className="w-16 h-7 text-xs"
                />
                <Button size="sm" className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700" onClick={async () => {
                  const value = pointsInputs[id] ?? points;
                  const ok = await onSavePoints?.(id, value);
                  if (ok) {
                    setEditingPoints((s) => ({ ...s, [id]: false }));
                  }
                }}>✓</Button>
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setEditingPoints((s) => ({ ...s, [id]: false }))}>✕</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-600 text-xs">{points}</span>
                {isOwner && (
                  <button className="text-blue-500 hover:text-blue-700 p-1" title="Edit points" onClick={() => setEditingPoints((s) => ({ ...s, [id]: true }))}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        </div>
      </foreignObject>
    );
  };

  if (!d3Data) return null;

  return (
    <div ref={containerRef} className="h-[65vh] sm:h-[600px] w-full overflow-hidden">
      <Tree
        data={d3Data}
        translate={translate}
        separation={{ siblings: 1.1, nonSiblings: 1.3 }}
        nodeSize={{ x: 260, y: 160 }}
        pathFunc="elbow"
        orientation="vertical"
        renderCustomNodeElement={renderNode}
        zoomable={true}
      />
    </div>
  );
}


