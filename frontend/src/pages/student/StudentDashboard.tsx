import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { readinessService } from "@/lib/readinessService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { FileText, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export default function StudentDashboard() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const userName = user?.userName || "Student";
  const [loadingProject, setLoadingProject] = useState(false);
  const [project, setProject] = useState<any>(null);

  // Readiness Form State
  const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false);
  const [isLoadingReadiness, setIsLoadingReadiness] = useState(false);
  const [readinessTemplate, setReadinessTemplate] = useState<string>("");
  const [studentReadinessData, setStudentReadinessData] = useState<any>(null);

  const fetchProject = async () => {
    if (!user) return;
    setLoadingProject(true);
    try {
      const studentId = String(user.id ?? "");
      const url = `${baseUrl}/student`;
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const payload = await res.json().catch(() => null);
      console.log("payload:", payload);

      if (!res.ok) {
        console.warn("fetchProject non-OK", res.status);

        return;
      }

      const projectObj = payload?.data
      setProject(projectObj);
      console.log("Fetched project:", projectObj);
    } catch (err) {
      console.error("fetchProject error:", err);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    void fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  const fetchReadinessData = async () => {
    if (!user?.id || !token) return;
    setIsLoadingReadiness(true);
    try {
      // 1. Fetch student's readiness form
      const studentFormRes = await readinessService.getStudentReadinessForm(user.id, token);
      const studentData = studentFormRes.data || studentFormRes;
      setStudentReadinessData(studentData);

      // 2. Fetch all templates and find the matching one
      const templatesRes = await readinessService.getAllTemplates(token);
      const templates = Array.isArray(templatesRes.data) ? templatesRes.data : (Array.isArray(templatesRes) ? templatesRes : []);
      
      const matchingTemplate = templates.find((t: any) => 
        t.level.toLowerCase() === project?.level?.toLowerCase() &&
        t.stage === project?.currentStage
      );

      if (matchingTemplate) {
        setReadinessTemplate(matchingTemplate.form);
      } else {
        setReadinessTemplate("No readiness form template found for your current stage.");
      }
    } catch (error: any) {
      console.error("Error fetching readiness data:", error);
      toast({
        title: "Error",
        description: "Failed to load readiness form data.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReadiness(false);
    }
  };

  const renderedReadinessForm = useMemo(() => {
    if (!readinessTemplate || !project) return "";
    let text = readinessTemplate;
    
    // Simple placeholder replacement
    text = text.replace(/{{DATE}}/g, new Date().toLocaleDateString());
    text = text.replace(/{{NAME}}/g, userName);
    text = text.replace(/{{MATRIC_NO}}/g, project.matricNo || "—");
    text = text.replace(/{{PROGRAMME}}/g, project.level?.toUpperCase() || "—");
    text = text.replace(/{{DEPARTMENT}}/g, project.department || "—");
    text = text.replace(/{{TITLE}}/g, project.projectTopic || "—");
    
    // Add logic for supervisors if available in project object
    text = text.replace(/{{SUPERVISOR_1}}/g, project.majorSupervisor || "—");
    text = text.replace(/{{SUPERVISOR_2}}/g, project.minorSupervisor || "—");
    text = text.replace(/{{SUPERVISOR_3}}/g, project.internalExaminer || "—");
    
    return text;
  }, [readinessTemplate, project, userName]);

  const handlePrint = () => {
    const printContent = document.getElementById('readiness-form-print');
    if (!printContent) return;
    
    const win = window.open('', '', 'height=700,width=900');
    if (!win) return;
    
    win.document.write('<html><head><title>Readiness Form</title>');
    win.document.write('<style>body { font-family: serif; padding: 40px; white-space: pre-wrap; line-height: 1.5; }</style>');
    win.document.write('</head><body>');
    win.document.write(printContent.innerText);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold capitalize text-gray-800 break-words">
          Welcome, {userName}
        </h1>
        
        <Dialog open={isReadinessModalOpen} onOpenChange={(open) => {
          setIsReadinessModalOpen(open);
          if (open) fetchReadinessData();
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Readiness Form
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Oral Defence Readiness Form</DialogTitle>
              <DialogDescription>
                View and print your official readiness form for the current stage.
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingReadiness ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
                <p className="mt-4 text-sm text-gray-500">Loading form data...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div 
                  id="readiness-form-print"
                  className="p-8 border rounded bg-gray-50 font-serif text-sm whitespace-pre-wrap leading-relaxed shadow-inner"
                >
                  {renderedReadinessForm}
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={handlePrint}>
                    <Download className="w-4 h-4 mr-2" />
                    Print / Download
                  </Button>
                  <Button onClick={() => setIsReadinessModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md space-y-6 w-full">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Program</p>
          <p className="text-lg font-semibold text-gray-800 uppercase">
            {project?.level}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Faculty</p>
          <p className="text-lg font-semibold text-gray-800">
            {project?.faculty}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Department</p>
          <p className="text-lg font-semibold text-gray-800">
            {project?.department}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-gray-500">Current Research Stage</p>
          <p className="text-lg font-semibold text-gray-800 capitalize">
            {project?.currentStage}
          </p>
        </div>

        <div className="text-sm text-gray-600 pt-4">
          Make sure to upload your work as you progress through each stage.
        </div>
      </div>
    </div>
  );
}
