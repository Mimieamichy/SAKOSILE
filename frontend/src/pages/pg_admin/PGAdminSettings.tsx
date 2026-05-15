import React, { useState, useEffect } from "react";
import { useChecklistStore } from "@/lib/checklistStore";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, RefreshCw, Save, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { readinessService, ReadinessTemplate } from "@/lib/readinessService";
import axios from "axios";

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
  const { content, readinessTemplate, updateStageContent, updateReadinessTemplate, resetToDefault, saveTemplateToApi, deleteTemplateFromApi } = useChecklistStore();
  const { toast } = useToast();
  const { token } = useAuthStore();

  const [selectedLevel, setSelectedLevel] = useState<"msc" | "phd">("msc");
  const [selectedStage, setSelectedStage] = useState<string>("internal");
  const [isSaving, setIsSaving] = useState(false);

  // Readiness Template State
  const [readinessTemplates, setReadinessTemplates] = useState<ReadinessTemplate[]>([]);
  const [selectedReadinessLevel, setSelectedReadinessLevel] = useState<"msc" | "phd">("msc");
  const [selectedReadinessStage, setSelectedReadinessStage] = useState<string>("internal");
  const [selectedReadinessSchool, setSelectedReadinessSchool] = useState<string>("");
  const [readinessFormContent, setReadinessFormContent] = useState<string>("");
  const [schools, setSchools] = useState<{_id: string, name: string}[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSavingReadiness, setIsSavingReadiness] = useState(false);

  // Track the editable items for the selected level/stage
  const currentItems = content[selectedLevel]?.[selectedStage] || [];
  const [editableItems, setEditableItems] = useState<string[]>(currentItems);

  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  // Fetch data on mount
  useEffect(() => {
    if (!token) return;
    
    const fetchData = async () => {
      setIsLoadingTemplates(true);
      try {
        // Fetch schools
        const schoolRes = await axios.get(`${baseUrl}/school`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const schoolData = schoolRes.data as any;
        const schoolList = Array.isArray(schoolData.data) ? schoolData.data : (Array.isArray(schoolData) ? schoolData : []);
        setSchools(schoolList.map((s: any) => ({ _id: s._id || s.id, name: s.name })));
        
        if (schoolList.length > 0) {
          setSelectedReadinessSchool(schoolList[0]._id || schoolList[0].id);
        }

        // Fetch templates
        const templates = await readinessService.getAllTemplates(token);
        const templatesList = Array.isArray(templates.data) ? templates.data : (Array.isArray(templates) ? templates : []);
        setReadinessTemplates(templatesList);
      } catch (error) {
        console.error("Failed to fetch settings data:", error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchData();
  }, [token, baseUrl]);

  // When level or stage changes, update local editable state
  useEffect(() => {
    setEditableItems(content[selectedLevel]?.[selectedStage] || []);
  }, [selectedLevel, selectedStage, content]);

  // Update readiness form content when selection changes
  useEffect(() => {
    const existing = readinessTemplates.find(
      t => t.level === selectedReadinessLevel && 
           t.stage === selectedReadinessStage && 
           t.school === selectedReadinessSchool
    );
    if (existing) {
      setReadinessFormContent(existing.form);
    } else {
      setReadinessFormContent("");
    }
  }, [selectedReadinessLevel, selectedReadinessStage, selectedReadinessSchool, readinessTemplates]);

  const handleLevelChange = (val: "msc" | "phd") => {
    setSelectedLevel(val);
    setSelectedStage(STAGES[val][0].value);
  };

  const handleReadinessLevelChange = (val: "msc" | "phd") => {
    setSelectedReadinessLevel(val);
    setSelectedReadinessStage(STAGES[val][0].value);
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

  const handleSave = async () => {
    // Filter out empty items
    const filteredItems = editableItems.filter((i) => i.trim() !== "");
    
    setIsSaving(true);
    try {
      if (!token) throw new Error("No authentication token found");

      if (filteredItems.length === 0) {
        // If all items are removed, we should probably call the delete API
        await deleteTemplateFromApi(selectedLevel, selectedStage, token);
      } else {
        // Otherwise, save/update via API
        await saveTemplateToApi(selectedLevel, selectedStage, filteredItems, token);
      }

      // Update local store
      updateStageContent(selectedLevel, selectedStage, filteredItems);
      
      toast({
        title: "Settings Saved",
        description: `Checklist updated successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error Saving Settings",
        description: error.response?.data?.message || error.message || "Failed to save checklist settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReadinessTemplate = async () => {
    if (!token) return;
    if (!selectedReadinessSchool) {
      toast({ title: "Please select a school", variant: "destructive" });
      return;
    }
    if (!readinessFormContent.trim()) {
      toast({ title: "Form content cannot be empty", variant: "destructive" });
      return;
    }

    setIsSavingReadiness(true);
    try {
      const existing = readinessTemplates.find(
        t => t.level === selectedReadinessLevel && 
             t.stage === selectedReadinessStage && 
             t.school === selectedReadinessSchool
      );

      if (existing?._id) {
        await readinessService.updateTemplate(existing._id, readinessFormContent, token);
        toast({ title: "Template Updated", description: "Readiness form template updated successfully." });
      } else {
        await readinessService.createTemplate({
          school: selectedReadinessSchool,
          level: selectedReadinessLevel,
          stage: selectedReadinessStage,
          form: readinessFormContent
        }, token);
        toast({ title: "Template Created", description: "Readiness form template created successfully." });
      }

      // Refresh templates
      const templates = await readinessService.getAllTemplates(token);
      const templatesList = Array.isArray(templates.data) ? templates.data : (Array.isArray(templates) ? templates : []);
      setReadinessTemplates(templatesList);
    } catch (error: any) {
      toast({
        title: "Error Saving Template",
        description: error.response?.data?.message || error.message || "Failed to save template.",
        variant: "destructive",
      });
    } finally {
      setIsSavingReadiness(false);
    }
  };

  const handleDeleteReadinessTemplate = async () => {
    const existing = readinessTemplates.find(
      t => t.level === selectedReadinessLevel && 
           t.stage === selectedReadinessStage && 
           t.school === selectedReadinessSchool
    );
    if (!existing?._id || !token) return;

    if (!confirm("Are you sure you want to delete this template?")) return;

    setIsSavingReadiness(true);
    try {
      await readinessService.deleteTemplate(existing._id, token);
      toast({ title: "Template Deleted" });
      
      // Refresh templates
      const templates = await readinessService.getAllTemplates(token);
      const templatesList = Array.isArray(templates.data) ? templates.data : (Array.isArray(templates) ? templates : []);
      setReadinessTemplates(templatesList);
    } catch (error: any) {
      toast({
        title: "Error Deleting Template",
        description: error.response?.data?.message || error.message || "Failed to delete template.",
        variant: "destructive",
      });
    } finally {
      setIsSavingReadiness(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
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
          Reset Checklist Defaults
        </Button>
      </div>

      <Tabs defaultValue="checklist" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="checklist">Checklist Settings</TabsTrigger>
          <TabsTrigger value="readiness">Readiness Form Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="checklist" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Edit Checklist Descriptions</CardTitle>
              <CardDescription>Define the items students must complete for each stage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Level</Label>
                  <Select value={selectedLevel} onValueChange={(val) => handleLevelChange(val as "msc" | "phd")}>
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
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button 
              size="lg" 
              className="px-8" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Checklist Changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="readiness" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manage Readiness Form Templates</CardTitle>
              <CardDescription>Create and update the official readiness forms for different schools and stages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>School</Label>
                  <Select value={selectedReadinessSchool} onValueChange={setSelectedReadinessSchool}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select School" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => (
                        <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Level</Label>
                  <Select value={selectedReadinessLevel} onValueChange={(val) => handleReadinessLevelChange(val as "msc" | "phd")}>
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
                  <Select value={selectedReadinessStage} onValueChange={setSelectedReadinessStage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES[selectedReadinessLevel].map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-semibold">Form Content (Template)</Label>
                  <div className="text-xs text-gray-500">
                    Use placeholders like &#123;&#123;NAME&#125;&#125;, &#123;&#123;MATRIC_NO&#125;&#125;, etc.
                  </div>
                </div>
                <Textarea 
                  value={readinessFormContent}
                  onChange={(e) => setReadinessFormContent(e.target.value)}
                  placeholder="Enter the readiness form template content here..."
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            {readinessTemplates.some(t => t.level === selectedReadinessLevel && t.stage === selectedReadinessStage && t.school === selectedReadinessSchool) && (
              <Button 
                variant="destructive"
                onClick={handleDeleteReadinessTemplate}
                disabled={isSavingReadiness}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Template
              </Button>
            )}
            <Button 
              size="lg" 
              className="px-8" 
              onClick={handleSaveReadinessTemplate}
              disabled={isSavingReadiness}
            >
              {isSavingReadiness ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Readiness Template
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}