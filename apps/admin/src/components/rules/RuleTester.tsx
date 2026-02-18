import type { ProgramFact, StackingRule } from "@validatehome/rules-engine";
import {
  createRulesEngine,
  evaluateStackability,
  getAllCountryRules,
} from "@validatehome/rules-engine";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  Form,
  message,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import React from "react";

const { Text } = Typography;

export const RuleTester: React.FC = () => {
  const [form] = Form.useForm();
  const [rules, setRules] = React.useState<StackingRule[]>([]);
  const [jurisdictions, setJurisdictions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{
    canStack: boolean;
    explanation: string;
    source?: string;
  } | null>(null);

  React.useEffect(() => {
    const allRules = getAllCountryRules();
    setRules(allRules);

    const uniqueJurisdictions = new Set<string>();
    allRules.forEach((r) => {
      if (!r.jurisdiction.includes("EXPIRED")) {
        uniqueJurisdictions.add(r.jurisdiction);
      }
    });
    setJurisdictions(Array.from(uniqueJurisdictions).sort());
  }, []);

  const testRule = async (values: {
    jurisdiction: string;
    programACode: string;
    programALevel: string;
    programBCode: string;
    programBLevel: string;
  }) => {
    setLoading(true);
    setResult(null);

    try {
      const jurisdictionRules = rules.filter(
        (r) => r.jurisdiction === values.jurisdiction || r.jurisdiction === "UK",
      );

      if (jurisdictionRules.length === 0) {
        message.warning("No rules found for this jurisdiction");
        return;
      }

      const engine = createRulesEngine(jurisdictionRules);

      const programA: ProgramFact = {
        id: "program-a",
        name: values.programACode,
        type: values.programALevel as "tax_credit" | "rebate" | "grant",
        level: values.programALevel,
        code: values.programACode,
        jurisdiction: values.jurisdiction,
      };

      const programB: ProgramFact = {
        id: "program-b",
        name: values.programBCode,
        type: values.programBLevel as "tax_credit" | "rebate" | "grant",
        level: values.programBLevel,
        code: values.programBCode,
        jurisdiction: values.jurisdiction,
      };

      const evaluationResult = await evaluateStackability(engine, programA, programB);
      setResult(evaluationResult);
    } catch {
      message.error("Failed to evaluate rule");
    } finally {
      setLoading(false);
    }
  };

  const commonPrograms = [
    { value: "25C", label: "US - IRS 25C (Heat Pump)" },
    { value: "25D", label: "US - IRS 25D (Solar)" },
    { value: "BUS", label: "UK - Boiler Upgrade Scheme" },
    { value: "ECO5", label: "UK - ECO5" },
    { value: "GREENER-HOMES-GRANT", label: "CA - Greener Homes Grant" },
    { value: "VIC-SOLAR", label: "AU - Victoria Solar" },
    { value: "TECH", label: "US-CA - TECH Rebate" },
  ];

  return (
    <Card title="Rule Tester">
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Alert
          message="Test Stacking Rules"
          description="Select two programs to test if they can be stacked together based on the current rules."
          type="info"
          showIcon
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={testRule}
          initialValues={{
            jurisdiction: "US",
            programALevel: "federal",
            programBLevel: "state",
          }}
        >
          <Form.Item name="jurisdiction" label="Jurisdiction" rules={[{ required: true }]}>
            <Select
              options={jurisdictions.map((j) => ({ value: j, label: j }))}
              placeholder="Select jurisdiction"
            />
          </Form.Item>

          <Divider>Program A</Divider>

          <Space style={{ width: "100%" }} size="large">
            <Form.Item
              name="programACode"
              label="Program Code"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select
                showSearch
                options={commonPrograms}
                placeholder="Select or enter program code"
                allowClear
              />
            </Form.Item>

            <Form.Item name="programALevel" label="Level" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "federal", label: "Federal" },
                  { value: "state", label: "State/Province" },
                  { value: "utility", label: "Utility" },
                  { value: "local", label: "Local" },
                ]}
              />
            </Form.Item>
          </Space>

          <Divider>Program B</Divider>

          <Space style={{ width: "100%" }} size="large">
            <Form.Item
              name="programBCode"
              label="Program Code"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select
                showSearch
                options={commonPrograms}
                placeholder="Select or enter program code"
                allowClear
              />
            </Form.Item>

            <Form.Item name="programBLevel" label="Level" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "federal", label: "Federal" },
                  { value: "state", label: "State/Province" },
                  { value: "utility", label: "Utility" },
                  { value: "local", label: "Local" },
                ]}
              />
            </Form.Item>
          </Space>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Test Stackability
            </Button>
          </Form.Item>
        </Form>

        {result && (
          <Card size="small" style={{ background: result.canStack ? "#f6ffed" : "#fff2f0" }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Result">
                <Tag color={result.canStack ? "green" : "red"}>
                  {result.canStack ? "CAN STACK" : "CANNOT STACK"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Explanation">{result.explanation}</Descriptions.Item>
              {result.source && (
                <Descriptions.Item label="Source">
                  <Text type="secondary">{result.source}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}
      </Space>
    </Card>
  );
};

export default RuleTester;
