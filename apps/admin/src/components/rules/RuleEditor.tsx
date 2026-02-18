import type { RuleConditions, StackingRule } from "@validatehome/rules-engine";
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Space,
  Switch,
  Tabs,
  Typography,
} from "antd";
import React from "react";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface RuleEditorProps {
  initialRule?: StackingRule;
  onSave: (rule: StackingRule) => void;
  onCancel: () => void;
}

const JURISDICTIONS = [
  { value: "US", label: "United States" },
  { value: "US-CA", label: "US - California" },
  { value: "US-NY", label: "US - New York" },
  { value: "US-MA", label: "US - Massachusetts" },
  { value: "UK", label: "United Kingdom" },
  { value: "UK-SCOTLAND", label: "UK - Scotland" },
  { value: "UK-WALES", label: "UK - Wales" },
  { value: "AU", label: "Australia" },
  { value: "AU-VIC", label: "AU - Victoria" },
  { value: "AU-NSW", label: "AU - New South Wales" },
  { value: "AU-QLD", label: "AU - Queensland" },
  { value: "CA", label: "Canada" },
  { value: "CA-BC", label: "CA - British Columbia" },
  { value: "CA-ON", label: "CA - Ontario" },
  { value: "CA-QC", label: "CA - Quebec" },
];

const EVENT_TYPES = [
  { value: "stackable", label: "Stackable", color: "green" },
  { value: "not_stackable", label: "Not Stackable", color: "red" },
  { value: "conditional", label: "Conditional", color: "orange" },
];

// Reserved for future condition builder enhancement
// const OPERATORS = [
//   { value: "equal", label: "Equal to" },
//   { value: "notEqual", label: "Not equal to" },
//   { value: "in", label: "In list" },
//   { value: "notIn", label: "Not in list" },
//   { value: "greaterThan", label: "Greater than" },
//   { value: "lessThan", label: "Less than" },
// ];

// const FACT_NAMES = [
//   { value: "program_a.code", label: "Program A Code" },
//   { value: "program_a.level", label: "Program A Level" },
//   { value: "program_a.type", label: "Program A Type" },
//   { value: "program_a.jurisdiction", label: "Program A Jurisdiction" },
//   { value: "program_b.code", label: "Program B Code" },
//   { value: "program_b.level", label: "Program B Level" },
//   { value: "program_b.type", label: "Program B Type" },
//   { value: "program_b.jurisdiction", label: "Program B Jurisdiction" },
// ];

export const RuleEditor: React.FC<RuleEditorProps> = ({ initialRule, onSave, onCancel }) => {
  const [form] = Form.useForm();
  const [jsonMode, setJsonMode] = React.useState(false);
  const [jsonValue, setJsonValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (initialRule) {
      form.setFieldsValue({
        ruleId: initialRule.ruleId,
        jurisdiction: initialRule.jurisdiction,
        eventType: initialRule.event.type,
        explanation: initialRule.event.params.explanation,
        source: initialRule.event.params.source,
        cap: initialRule.event.params.cap,
        order: initialRule.event.params.order?.join(", "),
      });
      setJsonValue(JSON.stringify(initialRule.conditions, null, 2));
    }
  }, [initialRule, form]);

  const handleJsonSave = () => {
    try {
      const conditions = JSON.parse(jsonValue) as RuleConditions;
      const formValues = form.getFieldsValue();

      const rule: StackingRule = {
        ruleId: formValues.ruleId,
        jurisdiction: formValues.jurisdiction,
        conditions,
        event: {
          type: formValues.eventType,
          params: {
            explanation: formValues.explanation,
            source: formValues.source,
            cap: formValues.cap,
            order: formValues.order
              ? formValues.order.split(",").map((s: string) => s.trim())
              : undefined,
          },
        },
      };

      onSave(rule);
    } catch {
      message.error("Invalid JSON format");
    }
  };

  const handleFormSave = () => {
    form.validateFields().then((values) => {
      setLoading(true);

      const defaultConditions: RuleConditions = {
        all: [
          {
            fact: "program_a.code",
            operator: "equal",
            value: values.programACode || "PLACEHOLDER",
          },
          {
            fact: "program_b.code",
            operator: "equal",
            value: values.programBCode || "PLACEHOLDER",
          },
        ],
      };

      const rule: StackingRule = {
        ruleId: values.ruleId,
        jurisdiction: values.jurisdiction,
        conditions: values.useCustomConditions
          ? JSON.parse(values.conditionsJson || "{}")
          : defaultConditions,
        event: {
          type: values.eventType,
          params: {
            explanation: values.explanation,
            source: values.source,
            cap: values.cap || undefined,
            order: values.order ? values.order.split(",").map((s: string) => s.trim()) : undefined,
          },
        },
      };

      onSave(rule);
      setLoading(false);
    });
  };

  return (
    <Card
      title={initialRule ? "Edit Rule" : "Create New Rule"}
      extra={
        <Space>
          <Text>JSON Mode</Text>
          <Switch checked={jsonMode} onChange={setJsonMode} />
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            type="primary"
            onClick={jsonMode ? handleJsonSave : handleFormSave}
            loading={loading}
          >
            Save Rule
          </Button>
        </Space>
      }
    >
      <Tabs
        defaultActiveKey="basic"
        items={[
          {
            key: "basic",
            label: "Basic Info",
            children: (
              <Form form={form} layout="vertical">
                <Form.Item
                  name="ruleId"
                  label="Rule ID"
                  rules={[{ required: true, message: "Rule ID is required" }]}
                >
                  <Input placeholder="e.g., us-25c-state-not-stackable" />
                </Form.Item>

                <Form.Item
                  name="jurisdiction"
                  label="Jurisdiction"
                  rules={[{ required: true, message: "Jurisdiction is required" }]}
                >
                  <Select options={JURISDICTIONS} placeholder="Select jurisdiction" showSearch />
                </Form.Item>

                <Form.Item name="eventType" label="Event Type" rules={[{ required: true }]}>
                  <Select options={EVENT_TYPES} placeholder="Select event type" />
                </Form.Item>

                <Form.Item
                  name="explanation"
                  label="Explanation"
                  rules={[{ required: true, message: "Explanation is required" }]}
                >
                  <TextArea rows={3} placeholder="Explain when this rule applies..." />
                </Form.Item>

                <Form.Item name="source" label="Source (e.g., IRS Publication)">
                  <Input placeholder="Source document or URL" />
                </Form.Item>

                <Form.Item name="cap" label="Maximum Cap Amount">
                  <InputNumber min={0} style={{ width: "100%" }} placeholder="Maximum amount" />
                </Form.Item>

                <Form.Item name="order" label="Stack Order (comma-separated)">
                  <Input placeholder="e.g., program_a, program_b" />
                </Form.Item>
              </Form>
            ),
          },
          {
            key: "conditions",
            label: "Conditions",
            children: (
              <Form form={form} layout="vertical">
                <Form.Item
                  name="useCustomConditions"
                  label="Use Custom Conditions"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item name="conditionsJson" label="Conditions (JSON)">
                  <TextArea
                    rows={10}
                    value={jsonValue}
                    onChange={(e) => setJsonValue(e.target.value)}
                    placeholder={JSON.stringify(
                      {
                        all: [
                          { fact: "program_a.code", operator: "equal", value: "25C" },
                          { fact: "program_b.level", operator: "equal", value: "state" },
                        ],
                      },
                      null,
                      2,
                    )}
                  />
                </Form.Item>

                <Divider>Quick Condition Builder</Divider>

                <Space direction="vertical" style={{ width: "100%" }}>
                  <Title level={5}>Program A Condition</Title>
                  <Form.Item name="programACode" label="Program Code">
                    <Input placeholder="e.g., 25C, BUS, GREENER-HOMES" />
                  </Form.Item>
                  <Form.Item name="programALevel" label="Level">
                    <Select
                      options={[
                        { value: "federal", label: "Federal" },
                        { value: "state", label: "State/Province" },
                        { value: "utility", label: "Utility" },
                        { value: "local", label: "Local" },
                      ]}
                    />
                  </Form.Item>

                  <Title level={5}>Program B Condition</Title>
                  <Form.Item name="programBCode" label="Program Code">
                    <Input placeholder="e.g., 25C, BUS, GREENER-HOMES" />
                  </Form.Item>
                  <Form.Item name="programBLevel" label="Level">
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
              </Form>
            ),
          },
        ]}
      />
    </Card>
  );
};

export default RuleEditor;
