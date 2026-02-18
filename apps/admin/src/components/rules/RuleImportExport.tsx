import { DeleteOutlined, DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import type { StackingRule } from "@validatehome/rules-engine";
import { getAllCountryRules } from "@validatehome/rules-engine";
import { Alert, Button, Card, Divider, message, Space, Typography, Upload } from "antd";
import React from "react";

const { Title, Text, Paragraph } = Typography;

interface RuleImportExportProps {
  onImport: (rules: StackingRule[]) => void;
}

export const RuleImportExport: React.FC<RuleImportExportProps> = ({ onImport }) => {
  const [rules, setRules] = React.useState<StackingRule[]>([]);

  React.useEffect(() => {
    setRules(getAllCountryRules());
  }, []);

  const handleExport = () => {
    const dataStr = JSON.stringify(rules, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stacking-rules-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success("Rules exported successfully");
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as StackingRule[];
        if (!Array.isArray(imported)) {
          throw new Error("Invalid format");
        }
        onImport(imported);
        message.success(`Imported ${imported.length} rules`);
      } catch {
        message.error("Failed to parse rules file");
      }
    };
    reader.readAsText(file);
    return false;
  };

  const handleClear = () => {
    setRules([]);
    message.info("Rules cleared (local only)");
  };

  return (
    <Card title="Rule Import/Export">
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Alert
          message="Export and Import Stacking Rules"
          description="Export all rules to a JSON file for backup, or import rules from a previously exported file."
          type="info"
          showIcon
        />

        <Divider />

        <Title level={5}>Current Rules Summary</Title>
        <Space>
          <Text>Total Rules: {rules.length}</Text>
          <Text>Jurisdictions: {new Set(rules.map((r) => r.jurisdiction)).size}</Text>
        </Space>

        <Divider />

        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={rules.length === 0}>
            Export All Rules (JSON)
          </Button>

          <Upload accept=".json" showUploadList={false} beforeUpload={handleImport}>
            <Button icon={<UploadOutlined />}>Import Rules</Button>
          </Upload>

          <Button
            icon={<DeleteOutlined />}
            onClick={handleClear}
            danger
            disabled={rules.length === 0}
          >
            Clear Local Rules
          </Button>
        </Space>

        <Divider />

        <Paragraph>
          <Text type="secondary">
            Imported rules will be validated before saving. Duplicate rule IDs will be updated.
          </Text>
        </Paragraph>
      </Space>
    </Card>
  );
};

export default RuleImportExport;
