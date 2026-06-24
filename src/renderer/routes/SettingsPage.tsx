import { Card, CardContent, CardHeader, CardTitle, Input, Select } from "../components/ui";

export function SettingsPage() {
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-base font-semibold text-gray-900">Settings</h2>
      <Card>
        <CardHeader>
          <CardTitle>Job Search Criteria</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-gray-700">
            Preferred source
            <Select defaultValue="playwright">
              <option value="playwright">Playwright</option>
              <option value="manual">Manual</option>
            </Select>
          </label>
          <label className="space-y-1 text-xs font-medium text-gray-700">
            CV path
            <Input placeholder="C:\\Users\\...\\cv.pdf" />
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
