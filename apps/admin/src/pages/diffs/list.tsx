import { List, useTable } from "@refinedev/antd";
import type { IResourceComponentsProps } from "@refinedev/core";
import { Button, Descriptions, Modal, message, Popconfirm, Space, Table, Tag } from "antd";
import { useState } from "react";
import { useAuditLog } from "../../hooks/use-audit-log.js";
import { apiFetch } from "../../lib/api-client.js";

interface DiffRecord {
  id: string;
  sourceId: string;
  sourceName: string;
  changeType: "status" | "budget" | "deadline" | "benefit";
  oldValue: string;
  newValue: string;
  confidence: number;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}

export function DiffList(_props: IResourceComponentsProps) {
  const [selectedDiff, setSelectedDiff] = useState<DiffRecord | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const { logDiffApprove, logDiffReject, logDiffView } = useAuditLog();

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

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      const response = await apiFetch(`/diffs/${id}/approve`, { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to approve diff");
      }
      await logDiffApprove(id, { status: "approved" });
      message.success("Diff approved");
      window.location.reload();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      message.error(`Approve failed: ${detail}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoadingId(id);
    try {
      const response = await apiFetch(`/diffs/${id}/reject`, { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to reject diff");
      }
      await logDiffReject(id, { status: "rejected" });
      message.success("Diff rejected");
      window.location.reload();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      message.error(`Reject failed: ${detail}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <>
      <List>
        <Table {...tableProps} rowKey="id">
          <Table.Column dataIndex="sourceName" title="Source" />
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
                <Button
                  size="small"
                  type="primary"
                  loading={actionLoadingId === record.id}
                  onClick={() => handleApprove(record.id)}
                >
                  {actionLoadingId === record.id ? "Approving..." : "Approve"}
                </Button>
                <Popconfirm
                  title="Reject this diff?"
                  description="This action marks the diff as rejected and is not reversible."
                  okText="Reject"
                  cancelText="Cancel"
                  onConfirm={() => handleReject(record.id)}
                >
                  <Button size="small" danger loading={actionLoadingId === record.id}>
                    Reject
                  </Button>
                </Popconfirm>
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedDiff(record);
                    logDiffView(record.id);
                  }}
                >
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
          <Popconfirm
            key="reject"
            title="Reject this diff?"
            description="This action marks the diff as rejected and is not reversible."
            okText="Reject"
            cancelText="Cancel"
            onConfirm={() => selectedDiff && handleReject(selectedDiff.id)}
          >
            <Button danger loading={actionLoadingId === selectedDiff?.id}>
              Reject
            </Button>
          </Popconfirm>,
          <Button
            key="approve"
            type="primary"
            loading={actionLoadingId === selectedDiff?.id}
            onClick={() => selectedDiff && handleApprove(selectedDiff.id)}
          >
            Approve
          </Button>,
        ]}
      >
        {selectedDiff && (
          <Descriptions column={1}>
            <Descriptions.Item label="Source">{selectedDiff.sourceName}</Descriptions.Item>
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
}
