import { HistoryOutlined, UndoOutlined } from "@ant-design/icons";
import type { StackingRule } from "@validatehome/rules-engine";
import { Button, Card, Divider, Empty, Space, Tag, Timeline, Typography } from "antd";
import React from "react";

const { Title, Text, Paragraph } = Typography;

interface RuleHistoryProps {
  ruleId: string;
  _currentRule: StackingRule;
  onRestore: (version: number) => void;
}

interface RuleVersion {
  version: number;
  rule: StackingRule;
  timestamp: Date;
  changedBy?: string;
}

const mockHistory: RuleVersion[] = [
  {
    version: 3,
    rule: {} as StackingRule,
    timestamp: new Date(),
    changedBy: "admin",
  },
  {
    version: 2,
    rule: {} as StackingRule,
    timestamp: new Date(Date.now() - 86400000),
    changedBy: "admin",
  },
  {
    version: 1,
    rule: {} as StackingRule,
    timestamp: new Date(Date.now() - 172800000),
    changedBy: "system",
  },
];

export const RuleHistory: React.FC<RuleHistoryProps> = ({ ruleId, onRestore }) => {
  const [history] = React.useState<RuleVersion[]>(mockHistory);

  const formatDate = (date: Date) => {
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card
      title={
        <Space>
          <HistoryOutlined />
          <span>Rule History: {ruleId}</span>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Title level={5}>Version Timeline</Title>

        {history.length === 0 ? (
          <Empty description="No history available" />
        ) : (
          <Timeline
            items={history.map((item, index) => ({
              color: index === 0 ? "green" : "blue",
              children: (
                <Space direction="vertical" size="small">
                  <Space>
                    <Tag color={index === 0 ? "green" : "blue"}>Version {item.version}</Tag>
                    {index === 0 && <Tag color="gold">Current</Tag>}
                  </Space>
                  <Text type="secondary">{formatDate(item.timestamp)}</Text>
                  {item.changedBy && <Text type="secondary">Changed by: {item.changedBy}</Text>}
                  {index > 0 && (
                    <Button
                      size="small"
                      icon={<UndoOutlined />}
                      onClick={() => onRestore(item.version)}
                    >
                      Restore this version
                    </Button>
                  )}
                </Space>
              ),
            }))}
          />
        )}

        <Divider />

        <Paragraph>
          <Text type="secondary">
            Rule versions are stored for audit purposes. Only the most recent 10 versions are
            retained.
          </Text>
        </Paragraph>
      </Space>
    </Card>
  );
};

export default RuleHistory;
