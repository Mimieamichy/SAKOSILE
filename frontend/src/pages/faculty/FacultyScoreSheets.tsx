import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import ScoreSheetGenerator, { Criterion } from "./ScoreSheetGenerator";
import { Role } from "@/config/roles";
import { useAuthStore } from "@/store/authStore";
import { History, CheckCircle2, AlertCircle, Save, Layers, ArrowLeft } from "lucide-react";

// Define levels and stages
type AcademicLevel = "MSc" | "PhD";


interface ScoreSheetVersion {
  id: string;
  timestamp: string;
  userName: string;
  criteria: Criterion[];
}

interface ScoreSheetData {
  level: AcademicLevel;
  stage: string; // Use string to allow different stages per level
  criteria: Criterion[];
  status: "Draft" | "Published";
  lastModified: string;
  history: ScoreSheetVersion[];
}

interface FacultyScoreSheetsProps {
  onBack?: () => void;
}

export default function FacultyScoreSheets({ onBack }: FacultyScoreSheetsProps) {
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();
  const { toast } = useToast();
  
  const STORAGE_KEY = "faculty-score-sheets";
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const { token } = useAuthStore();
  // Requirement 6: Role Integration
  const isFacultyRep = hasRole(Role.FACULTY_PG_REP);

  const mscStages = ["Proposal", "Internal Defense", "External"];
  const phdStages = [
    "Proposal Defense",
    "2nd Seminar",
    "3rd Seminar",
    "External Defense",
  ];

  const [activeLevel, setActiveLevel] = useState<AcademicLevel>("MSc");

  const stages = useMemo(() => {
    return activeLevel === "MSc" ? mscStages : phdStages;
  }, [activeLevel, mscStages, phdStages]);

  const [activeStage, setActiveStage] = useState<string>(mscStages[0]);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingRemote, setLoadingRemote] = useState(false);

  // Initial static data for demonstration
  const initialData: ScoreSheetData[] = [
    {
      level: "MSc",
      stage: "Proposal",
      status: "Published",
      lastModified: "2026-01-05 10:00 AM",
      criteria: [
        { title: "Literature Review", percentage: 30 },
        { title: "Methodology", percentage: 40 },
        { title: "Presentation", percentage: 30 },
      ],
      history: [
        {
          id: "v1",
          timestamp: "2026-01-05 10:00 AM",
          userName: "Admin",
          criteria: [
            { title: "Literature Review", percentage: 30 },
            { title: "Methodology", percentage: 40 },
            { title: "Presentation", percentage: 30 },
          ],
        },
      ],
    },
    {
      level: "PhD",
      stage: "Proposal Defense",
      status: "Draft",
      lastModified: "2026-01-06 09:00 AM",
      criteria: [
        { title: "Originality", percentage: 40 },
        { title: "Contribution to Knowledge", percentage: 40 },
        { title: "Methodology", percentage: 20 },
      ],
      history: [],
    },
  ];

  const [scoreSheets, setScoreSheets] = useState<ScoreSheetData[]>(initialData);

  // Update activeStage when activeLevel changes
  useEffect(() => {
    setActiveStage(activeLevel === "MSc" ? mscStages[0] : phdStages[0]);
  }, [activeLevel]);

  // Load persisted score sheets created by faculty officer (frontend-only persistence)
  useEffect(() => {
    try {
      const txt = localStorage.getItem(STORAGE_KEY);
      if (txt) {
        const parsed = JSON.parse(txt) as ScoreSheetData[];
        if (Array.isArray(parsed) && parsed.length) {
          setScoreSheets(parsed);
        }
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist whenever score sheets change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scoreSheets));
    } catch {
      /* ignore */
    }
  }, [scoreSheets]);

  // Load existing criteria from backend and merge into sheets
  useEffect(() => {
    const load = async () => {
      setLoadingRemote(true);
      try {
        const facultyParam = user?.faculty ? `/${encodeURIComponent(user.faculty)}` : '';
        const queryParams = new URLSearchParams();
        if (activeLevel) queryParams.append('level', activeLevel.toLowerCase());
        if (activeStage) queryParams.append('stage', activeStage.toLowerCase());
        
        const queryString = queryParams.toString();
        const url = `${baseUrl}/defence/faculty-score-sheet${facultyParam}${queryString ? `?${queryString}` : ''}`;
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        console.log("GET defence/faculty-score-sheet:", json);
        const arr: any[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
        const grouped: Record<string, Criterion[]> = {};
        for (const item of arr) {
          const lvl = String(item.level ?? "").toUpperCase() === "PHD" ? "PhD" : "MSc";
          const stg = String(item.stage ?? "");
          const key = `${lvl}__${stg}`;
          const crit: Criterion = {
            id: item._id ?? item.id,
            title: String(item.title ?? ""),
            percentage: Number(item.percentage ?? 0),
          };
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(crit);
        }
        setScoreSheets((prev) => {
          const byKey = new Map<string, ScoreSheetData>();
          for (const s of prev) byKey.set(`${s.level}__${s.stage}`, s);
          for (const [k, crits] of Object.entries(grouped)) {
            const [lvl, stg] = k.split("__");
            const existing = byKey.get(k);
            const sheet: ScoreSheetData =
              existing
                ? { ...existing, criteria: crits, status: "Published", lastModified: new Date().toLocaleString() }
                : {
                    level: lvl as AcademicLevel,
                    stage: stg,
                    criteria: crits,
                    status: "Published",
                    lastModified: new Date().toLocaleString(),
                    history: [],
                  };
            byKey.set(k, sheet);
          }
          return Array.from(byKey.values());
        });
      } finally {
        setLoadingRemote(false);
      }
    };
    load();
  }, [baseUrl, token]);

  // Find the active score sheet or create a default one
  const currentSheet = useMemo(() => {
    return scoreSheets.find(s => s.level === activeLevel && s.stage === activeStage) || {
      level: activeLevel,
      stage: activeStage,
      status: "Draft" as const,
      lastModified: new Date().toLocaleString(),
      criteria: [
        { title: "Clarity", percentage: 50 },
        { title: "Originality", percentage: 50 },
      ],
      history: [],
    };
  }, [scoreSheets, activeLevel, activeStage]);

  // Filter history to show previous sheets created by the current faculty officer (exclude most recent)
  const previousHistory = useMemo(() => {
    const uname = user?.userName?.trim();
    const mine = uname ? currentSheet.history.filter(h => h.userName === uname) : [];
    if (mine.length <= 1) return [];
    return mine.slice(1);
  }, [currentSheet.history, user?.userName]);

  const [loadVersionKey, setLoadVersionKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"publish" | "history">("publish");
  
  const handleLoadVersion = (version: ScoreSheetVersion) => {
    setScoreSheets(prev => {
      const idx = prev.findIndex(s => s.level === activeLevel && s.stage === activeStage);
      const updated: ScoreSheetData = {
        level: activeLevel,
        stage: activeStage,
        criteria: version.criteria,
        status: "Draft",
        lastModified: new Date().toLocaleString(),
        history: idx > -1 ? prev[idx].history : [],
      };
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [...prev, updated];
    });
    
    // Force a refresh of the ScoreSheetGenerator component by updating the key
    setLoadVersionKey(prev => prev + 1);
    
    toast({
      title: "Version loaded",
      description: "You can make updates and publish.",
    });
  };

  // Requirement 2: Access Control visual indicators
  if (!isFacultyRep) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2 max-w-md">
          You do not have the required permissions to access the Faculty Representative Score Sheet management system.
        </p>
      </div>
    );
  }

  const handlePublish = async (payload: { criteria: Criterion[] }) => {
    const newVersion: ScoreSheetVersion = {
      id: `v${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      userName: user?.userName || "Faculty Rep",
      criteria: payload.criteria,
    };
    setSaving(true);
    try {
      const postUrl = `${baseUrl}/defence/faculty-score-sheet`;
      const postBody = {
        level: String(activeLevel).toLowerCase(),
        stage: String(activeStage).toLowerCase(),
        criteria: payload.criteria.map(c => ({
          title: c.title,
          percentage: c.percentage,
        })),
      };
      console.log("POST defence/faculty-score-sheet →", postUrl, postBody);
      const r = await fetch(postUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(postBody),
      });
      console.log("POST defence/faculty-score-sheet:", r.status);
      try {
        const p = await r.clone().json();
        console.log("POST defence/faculty-score-sheet payload:", p);
      } catch {
        const t = await r.text();
        console.log("POST defence/faculty-score-sheet text:", t);
      }
      if (!r.ok) {
        const msg = await r.text().catch(() => "");
        throw new Error(`Create failed: ${r.status} ${msg}`);
      }
      setScoreSheets(prev => {
        const idx = prev.findIndex(s => s.level === activeLevel && s.stage === activeStage);
        const updated: ScoreSheetData = {
          level: activeLevel,
          stage: activeStage,
          criteria: payload.criteria,
          status: "Published",
          lastModified: newVersion.timestamp,
          history: idx > -1 ? [newVersion, ...prev[idx].history] : [newVersion],
        };
        if (idx > -1) {
          const copy = [...prev];
          copy[idx] = updated;
          return copy;
        }
        return [...prev, updated];
      });
      toast({
        title: "Score Sheet Published",
        description: `Successfully updated ${activeLevel} - ${activeStage} score sheet.`,
        className: "bg-green-50 border-green-200",
      });
    } catch {
      toast({
        title: "Failed",
        description: "Could not save score sheet.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCriterion = async (criterionId: string) => {
    try {
      const deleteUrl = `${baseUrl}/defence/faculty-score-sheet/${encodeURIComponent(criterionId)}`;
      console.log("DELETE defence/faculty-score-sheet →", deleteUrl);
      const r = await fetch(`${baseUrl}/defence/faculty-score-sheet/${encodeURIComponent(criterionId)}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      console.log("DELETE defence/faculty-score-sheet:", r.status);
      try {
        const p = await r.clone().json();
        console.log("DELETE defence/faculty-score-sheet payload:", p);
      } catch {
        const t = await r.text();
        console.log("DELETE defence/faculty-score-sheet text:", t);
      }
      setScoreSheets(prev =>
        prev.map(s =>
          s.level === activeLevel && s.stage === activeStage
            ? { ...s, criteria: s.criteria.filter(c => c.id !== criterionId) }
            : s
        )
      );
      toast({ title: "Removed", description: "Criterion deleted." });
    } catch {
      toast({
        title: "Delete failed",
        description: "Unable to delete criterion.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            if (onBack) {
              onBack();
            } else {
              navigate(-1);
            }
          }} 
          className="w-fit flex items-center gap-2 text-gray-500 hover:text-amber-700 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Layers className="text-amber-600" />
              Faculty Score Sheet Management
            </h1>
            <p className="text-gray-500">Create and manage evaluation rubrics for MSc and PhD students.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Status badge removed as requested */}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("publish")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "publish"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Publish Score Sheet
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "history"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Academic Level</CardTitle>
              <CardDescription>Select student level</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeLevel} onValueChange={(v) => setActiveLevel(v as AcademicLevel)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="MSc">MSc</TabsTrigger>
                  <TabsTrigger value="PhD">PhD</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Evaluation Stage</CardTitle>
              <CardDescription>Select current stage</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                {stages.map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setActiveStage(stage)}
                    className={`flex items-center justify-between px-6 py-4 text-sm transition-colors border-l-4 ${
                      activeStage === stage 
                        ? "bg-amber-50 border-amber-700 text-amber-800 font-medium" 
                        : "border-transparent text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {stage}
                    {scoreSheets.some(s => s.level === activeLevel && s.stage === stage && s.status === "Published") && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {showHistory && (
            <Card className="border-amber-700/20 shadow-amber-50">
              <CardHeader className="bg-amber-50/50 pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Version History
                </CardTitle>
                <CardDescription>Recent changes for this stage</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  {previousHistory.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {previousHistory.map((v) => (
                        <div key={v.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-semibold text-gray-500">{v.timestamp}</span>
                            <Badge variant="outline" className="text-[10px] py-0">{v.id}</Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-700">Modified by {v.userName}</p>
                          <p className="text-xs text-gray-500 mt-1">{v.criteria.length} criteria defined</p>
                          <div className="mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-amber-700 text-amber-800 hover:bg-amber-50"
                              onClick={() => handleLoadVersion(v)}
                            >
                              Load Version
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400 italic text-sm">
                      No previous versions found.
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 min-w-0">
          {activeTab === "publish" ? (
            <Card className="border-t-4 border-t-amber-700 shadow-md overflow-hidden">
              <CardHeader className="px-4 sm:px-6">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl text-gray-900">
                      {activeLevel} - {activeStage} Rubric
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Last modified: {currentSheet.lastModified}
                    </CardDescription>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    activeLevel === "PhD" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {activeLevel} Level
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-4 text-amber-800">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold">Guidelines for {activeStage}</p>
                      <p className="mt-1 opacity-90">
                        Ensure that all scoring criteria are comprehensive and align with the university's PG handbook. 
                        The total percentage must equal exactly 100%. Changes are tracked for audit purposes.
                      </p>
                    </div>
                  </div>
                </div>

                <ScoreSheetGenerator 
                  key={`${activeLevel}-${activeStage}-${loadVersionKey}`}
                  initialCriteria={currentSheet.criteria}
                  rubricId={`${activeLevel}-${activeStage}`}
                  onDeleteCriterion={handleDeleteCriterion}
                  onPublish={handlePublish}
                  saving={saving || loadingRemote}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-t-4 border-t-amber-700 shadow-md overflow-hidden">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-2xl text-gray-900">
                  Score Sheet History
                </CardTitle>
                <CardDescription>
                  All score sheets created, sorted from newest to oldest
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Level</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Stage</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Last Modified</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Criteria Count</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreSheets
                        .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
                        .map((sheet, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">{sheet.level}</td>
                            <td className="py-3 px-4">{sheet.stage}</td>
                            <td className="py-3 px-4">
                              <Badge 
                                variant={sheet.status === "Published" ? "outline" : "secondary"}
                                className={sheet.status === "Published" ? "bg-green-50 text-green-700 border-green-200" : ""}
                              >
                                {sheet.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{sheet.lastModified}</td>
                            <td className="py-3 px-4">{sheet.criteria.length}</td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-amber-700 text-amber-800 hover:bg-amber-50"
                                  onClick={() => {
                                    setActiveLevel(sheet.level);
                                    setActiveStage(sheet.stage);
                                    setActiveTab("publish");
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-700 text-red-800 hover:bg-red-50"
                                  onClick={() => {
                                    // Handle delete logic here
                                    setScoreSheets(prev => prev.filter(s => 
                                      !(s.level === sheet.level && s.stage === sheet.stage)
                                    ));
                                    toast({
                                      title: "Score Sheet Deleted",
                                      description: `${sheet.level} - ${sheet.stage} score sheet has been removed`,
                                    });
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {scoreSheets.length === 0 && (
                    <div className="text-center py-8 text-gray-400 italic">
                      No score sheets found. Create your first score sheet in the Publish tab.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
