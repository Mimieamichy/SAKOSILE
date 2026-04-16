import React, { useState } from "react";
import { useChecklistStore } from "@/lib/checklistStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LEVELS = [
  { value: "msc", label: "MSc" },
  { value: "phd", label: "PhD" },
];

const STAGES = {
  msc: [
    { value: "start", label: "Start" },
    { value: "proposal", label: "Proposal" },
    { value: "internal", label: "Internal Defense" },
    { value: "external", label: "External Defense" },
    { value: "completed", label: "Completed" },
  ],
  phd: [
    { value: "start", label: "Start" },
    { value: "proposal_defense", label: "Proposal Defense" },
    { value: "second_seminar", label: "2nd Seminar" },
    { value: "third_seminar", label: "3rd Seminar" },
    { value: "external_defense", label: "External Defense" },
    { value: "completed", label: "Completed" },
  ],
};

export default function PGAdminSettings() {
  const { content, readinessTemplate, updateStageContent, updateReadinessTemplate, resetToDefault } = useChecklistStore();
  const { toast } = useToast();

  const [selectedLevel, setSelectedLevel] = useState<"msc" | "phd">("msc");
  const [selectedStage, setSelectedStage] = useState<string>("internal");

  // Track the editable items for the selected level/stage
  const currentItems = content[selectedLevel]?.[selectedStage] || [];
  const [editableItems, setEditableItems] = useState<string[]>(currentItems);
  const [editableTemplate, setEditableTemplate] = useState<string>(readinessTemplate);

  // When level or stage changes, update local editable state
  React.useEffect(() => {
    setEditableItems(content[selectedLevel]?.[selectedStage] || []);
  }, [selectedLevel, selectedStage, content]);

  React.useEffect(() => {
    setEditableTemplate(readinessTemplate);
  }, [readinessTemplate]);

  const handleLevelChange = (val: "msc" | "phd") => {
    setSelectedLevel(val);
    setSelectedStage(STAGES[val][0].value);
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...editableItems];
    newItems[index] = value;
    setEditableItems(newItems);
  };

  const handleAddItem = () => {
    setEditableItems([...editableItems, ""]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...editableItems];
    newItems.splice(index, 1);
    setEditableItems(newItems);
  };

  const handleSave = () => {
    // Filter out empty items
    const filteredItems = editableItems.filter((i) => i.trim() !== "");
    updateStageContent(selectedLevel, selectedStage, filteredItems);
    updateReadinessTemplate(editableTemplate);
    
    toast({
      title: "Settings Saved",
      description: `Checklist and Readiness Form updated successfully.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Checklist Settings</h2>
        <Button 
          variant="outline" 
          onClick={() => {
            if (confirm("Are you sure you want to reset all checklist content to their defaults?")) {
              resetToDefault();
              toast({
                title: "Reset Successful",
                description: "All checklist settings have been restored to default.",
              });
            }
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset to Default
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Edit Checklist Descriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Level</Label>
              <Select value={selectedLevel} onValueChange={(val: "msc" | "phd") => handleLevelChange(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stage</Label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES[selectedLevel].map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">Checklist Items</h3>
              <Button size="sm" variant="secondary" onClick={handleAddItem}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>

            {editableItems.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No checklist items defined for this stage.</p>
            ) : (
              <div className="space-y-3">
                {editableItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 w-6">{idx + 1}.</span>
                    <Input 
                      value={item} 
                      onChange={(e) => handleItemChange(idx, e.target.value)}
                      placeholder="Enter checklist description..."
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveItem(idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t space-y-4">
            <h3 className="font-semibold text-gray-700">Readiness Form Letter Template</h3>
            <p className="text-xs text-gray-500">
              Available Placeholders: 
              <code className="bg-gray-100 px-1 py-0.5 mx-1 rounded">{"{{DATE}}"}</code>
              <code className="bg-gray-100 px-1 py-0.5 mx-1 rounded">{"{{NAME}}"}</code>
              <code className="bg-gray-100 px-1 py-0.5 mx-1 rounded">{"{{MATRIC_NO}}"}</code>
              <code className="bg-gray-100 px-1 py-0.5 mx-1 rounded">{"{{PROGRAMME}}"}</code>
              <code className="bg-gray-100 px-1 py-0.5 mx-1 rounded">{"{{DEPARTMENT}}"}</code>
              <code className="bg-gray-100 px-1 py-0.5 mx-1 rounded">{"{{TITLE}}"}</code>
              <code className="bg-gray-100 px-1 py-0.5 mx-1 rounded">{"{{SUPERVISOR_1}}"}</code>
              <code className="bg-gray-100 px-1 py-0.5 mx-1 rounded">{"{{SUPERVISOR_2}}"}</code>
              <code className="bg-gray-100 px-1 py-0.5 mx-1 rounded">{"{{SUPERVISOR_3}}"}</code>
              <code className="bg-gray-100 px-1 py-0.5 mx-1 rounded">{"{{PROPOSED_DATE}}"}</code>
              <code className="bg-gray-100 px-1 py-0.5 mx-1 rounded">{"{{TIME}}"}</code>
              <code className="bg-gray-100 px-1 py-0.5 mx-1 rounded">{"{{VENUE}}"}</code>
            </p>
            <Textarea 
              value={editableTemplate}
              onChange={(e) => setEditableTemplate(e.target.value)}
              className="min-h-[400px] font-mono text-sm bg-gray-50"
            />
          </div>

          <div className="pt-6 border-t flex justify-end">
            <Button className="bg-amber-700 hover:bg-amber-800 text-white" onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}