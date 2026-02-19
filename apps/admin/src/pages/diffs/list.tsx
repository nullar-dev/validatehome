import { List, useTable } from "@refinedev/antd";
import type { IResourceComponentsProps } from "@refinedev/core";
import { Button, Descriptions, Modal, Space, Table, Tag } from "antd";
import { useState } from "react";

interface DiffRecord {
  id: string;
  programId: string;
  programName: string;
  changeType: "status" | "budget" | "deadline" | "benefit";
  oldValue: string;
  newValue: string;
  confidence: number;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}

export const DiffList: React.FC<IResourceComponentsProps> = () => {
  const [selectedDiff, setSelectedDiff] = useState<DiffRecord | null>(null);

  const { tableProps } = useTable({
    resource: "diffs",
    sorters: {
      initial: [
        {
          field: "createdAt",
          order: "desc",
        },
      ],
    },
    filters: {
      initial: [
        {
          field: "status",
          operator: "eq",
          value: "pending",
        },
      ],
    },
  });

  const handleApprove = async (_id: string) => {};

  const handleReject = async (_id: string) => {};

  return (
    <>
      <List>
        <Table {...tableProps} rowKey="id">
          <Table.Column dataIndex="programName" title="Program" />
          <Table.Column
            dataIndex="changeType"
            title="Change Type"
            render={(changeType: string) => <Tag color="blue">{changeType}</Tag>}
          />
          <Table.Column
            dataIndex="confidence"
            title="Confidence"
            render={(confidence: number) => (
              <Tag color={confidence >= 0.8 ? "green" : confidence >= 0.5 ? "orange" : "red"}>
                {(confidence * 100).toFixed(0)}%
              </Tag>
            )}
          />
          <Table.Column dataIndex="createdAt" title="Detected" />
          <Table.Column
            title="Actions"
            render={(_, record: DiffRecord) => (
              <Space>
                <Button size="small" type="primary" onClick={() => handleApprove(record.id)}>
                  Approve
                </Button>
                <Button size="small" danger onClick={() => handleReject(record.id)}>
                  Reject
                </Button>
                <Button size="small" onClick={() => setSelectedDiff(record)}>
                  Details
                </Button>
              </Space>
            )}
          />
        </Table>
      </List>

      <Modal
        title="Diff Details"
        open={!!selectedDiff}
        onCancel={() => setSelectedDiff(null)}
        footer={[
          <Button key="reject" danger onClick={() => selectedDiff && handleReject(selectedDiff.id)}>
            Reject
          </Button>,
          <Button
            key="approve"
            type="primary"
            onClick={() => selectedDiff && handleApprove(selectedDiff.id)}
          >
            Approve
          </Button>,
        ]}
      >
        {selectedDiff && (
          <Descriptions column={1}>
            <Descriptions.Item label="Program">{selectedDiff.programName}</Descriptions.Item>
            <Descriptions.Item label="Change Type">{selectedDiff.changeType}</Descriptions.Item>
            <Descriptions.Item label="Old Value">{selectedDiff.oldValue}</Descriptions.Item>
            <Descriptions.Item label="New Value">{selectedDiff.newValue}</Descriptions.Item>
            <Descriptions.Item label="Confidence">
              {(selectedDiff.confidence * 100).toFixed(0)}%
            </Descriptions.Item>
            <Descriptions.Item label="Detected">{selectedDiff.createdAt}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};
