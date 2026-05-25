import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentHelpPage() {
  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Help</h1>
        <p className="text-gray-600">
          Find guidance for funding opportunities and research assistant support.
        </p>
      </div>

      <Tabs defaultValue="grant" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="grant">Grant & Funding</TabsTrigger>
          <TabsTrigger value="assistant">Research Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="grant" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Grant & Funding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">Where to look</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Departmental and faculty research grants</li>
                  <li>University research and conference support</li>
                  <li>External funding agencies and foundations</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">How to apply</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Prepare a short proposal and budget</li>
                  <li>Get supervisor approval and feedback</li>
                  <li>Submit before the published deadline</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assistant" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Research Assistant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">Eligibility</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Good academic standing in your program</li>
                  <li>Relevant skills aligned with the project</li>
                  <li>Availability during the project timeline</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">Getting started</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Check openings posted by your department</li>
                  <li>Send a short application and CV to the supervisor</li>
                  <li>Attend an interview or briefing if required</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
