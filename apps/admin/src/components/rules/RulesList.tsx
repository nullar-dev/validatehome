import type { StackingRule } from "@validatehome/rules-engine";
import { getAllCountryRules } from "@validatehome/rules-engine";
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Input,
  message,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import React from "react";

const { Text } = Typography;
const { Search } = Input;

export const RulesList: React.FC = () => {
  const [rules, setRules] = React.useState<StackingRule[]>([]);
  const [filteredRules, setFilteredRules] = React.useState<StackingRule[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [jurisdictionFilter, setJurisdictionFilter] = React.useState<string>("ALL");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedRule, setSelectedRule] = React.useState<StackingRule | null>(null);
  const [drawerVisible, setDrawerVisible] = React.useState(false);

  const loadRules = React.useCallback(async () => {
    setLoading(true);
    try {
      const allRules = getAllCountryRules();
      setRules(allRules);
    } catch {
      message.error("Failed to load rules");
    } finally {
      setLoading(false);
    }
  }, []);

  const filterRules = React.useCallback(() => {
    let filtered = rules;

    if (jurisdictionFilter !== "ALL") {
      filtered = filtered.filter((r) => r.jurisdiction === jurisdictionFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.ruleId.toLowerCase().includes(term) ||
          r.jurisdiction.toLowerCase().includes(term) ||
          r.event.params.explanation.toLowerCase().includes(term),
      );
    }

    setFilteredRules(filtered);
  }, [rules, jurisdictionFilter, searchTerm]);

  React.useEffect(() => {
    loadRules();
  }, [loadRules]);

  React.useEffect(() => {
    filterRules();
  }, [filterRules]);

  const jurisdictions = React.useMemo(() => {
    const unique = new Set(rules.map((r) => r.jurisdiction));
    return Array.from(unique).sort();
  }, [rules]);

  const columns = [
    {
      title: "Rule ID",
      dataIndex: "ruleId",
      key: "ruleId",
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: "Jurisdiction",
      dataIndex: "jurisdiction",
      key: "jurisdiction",
      render: (text: string) => <Tag color={text.includes("EXPIRED") ? "red" : "blue"}>{text}</Tag>,
    },
    {
      title: "Event Type",
      dataIndex: ["event", "type"],
      key: "eventType",
      render: (text: string) => {
        const colors: Record<string, string> = {
          stackable: "green",
          not_stackable: "red",
          conditional: "orange",
        };
        return <Tag color={colors[text] || "default"}>{text}</Tag>;
      },
    },
    {
      title: "Explanation",
      dataIndex: ["event", "params", "explanation"],
      key: "explanation",
      render: (text: string) => (
        <Text ellipsis style={{ maxWidth: 300 }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Source",
      dataIndex: ["event", "params", "source"],
      key: "source",
      render: (text: string) => <Text type="secondary">{text || "N/A"}</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: StackingRule) => (
        <Space>
          <Button size="small" onClick={() => viewRule(record)}>
            View
          </Button>
          <Button size="small" type="primary" onClick={() => editRule(record)}>
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  const viewRule = (rule: StackingRule) => {
    setSelectedRule(rule);
    setDrawerVisible(true);
  };

  const editRule = (rule: StackingRule) => {
    message.info(`Edit rule: ${rule.ruleId}`);
  };

  return (
    <Card title="Stacking Rules Management">
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Space>
          <Search
            placeholder="Search rules..."
            onSearch={setSearchTerm}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            value={jurisdictionFilter}
            onChange={setJurisdictionFilter}
            style={{ width: 200 }}
            options={[
              { value: "ALL", label: "All Jurisdictions" },
              ...jurisdictions.map((j) => ({ value: j, label: j })),
            ]}
          />
          <Button onClick={loadRules}>Refresh</Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredRules}
          rowKey="ruleId"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          size="small"
        />

        <Text type="secondary">
          Showing {filteredRules.length} of {rules.length} rules
        </Text>
      </Space>

      <Drawer
        title="Rule Details"
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={600}
      >
        {selectedRule && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Rule ID">{selectedRule.ruleId}</Descriptions.Item>
            <Descriptions.Item label="Jurisdiction">{selectedRule.jurisdiction}</Descriptions.Item>
            <Descriptions.Item label="Event Type">{selectedRule.event.type}</Descriptions.Item>
            <Descriptions.Item label="Explanation">
              {selectedRule.event.params.explanation}
            </Descriptions.Item>
            <Descriptions.Item label="Source">
              {selectedRule.event.params.source || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Order">
              {selectedRule.event.params.order?.join(" → ") || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Cap">
              {selectedRule.event.params.cap || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Reduction %">
              {selectedRule.event.params.reductionPct || "N/A"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </Card>
  );
};

export default RulesList;
