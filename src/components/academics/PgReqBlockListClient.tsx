'use client';

import { useState } from 'react';
import { ProgrammeCode, DegreeType, RequirementType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PgRequirementBlockEditor,
  PgReqBlockDeleteButton,
  type ReqBlockFormData,
} from './PgRequirementBlockEditor';
import { getRequirementBlockAction } from '@/server/actions/pgRequirementBlocks';

type ListItem = {
  id: string;
  title: string;
  requirementType: RequirementType;
  orderIndex: number;
  updatedAt: Date;
};

interface Props {
  programmeCode: ProgrammeCode;
  degreeType: DegreeType;
  items: ListItem[];
  total: number;
}

export function PgReqBlockListClient({ programmeCode, degreeType, items }: Props) {
  const [editing, setEditing] = useState<ReqBlockFormData | null>(null);
  const [creating, setCreating] = useState(false);

  const handleEdit = async (id: string) => {
    const res = await getRequirementBlockAction(programmeCode, degreeType, id);
    if (res.success && res.block) {
      setEditing(res.block);
      setCreating(false);
    } else {
      // Could add toastError here, but silently failing an edit click is okay if block went missing
      console.error(res.error || 'Failed to fetch block');
    }
  };

  const handleClose = () => {
    setEditing(null);
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      {!creating && !editing && (
        <div className="flex justify-end">
          <Button onClick={() => setCreating(true)}>Add New Block</Button>
        </div>
      )}

      {creating && (
        <PgRequirementBlockEditor
          programmeCode={programmeCode}
          degreeType={degreeType}
          onClose={handleClose}
        />
      )}

      {editing && (
        <PgRequirementBlockEditor
          programmeCode={programmeCode}
          degreeType={degreeType}
          initialData={editing}
          onClose={handleClose}
        />
      )}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Order</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No requirement blocks yet. Click &quot;Add New Block&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.orderIndex}</TableCell>
                  <TableCell>
                    <span className="text-sm font-medium uppercase tracking-wider">
                      {item.requirementType}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item.id)}>
                      Edit
                    </Button>
                    <PgReqBlockDeleteButton
                      programmeCode={programmeCode}
                      degreeType={degreeType}
                      blockId={item.id}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
