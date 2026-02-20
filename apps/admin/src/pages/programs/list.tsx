import { EditButton, List, ShowButton, useTable } from "@refinedev/antd";
import type { IResourceComponentsProps } from "@refinedev/core";
import { Space, Table, Tag } from "antd";

export const ProgramList: React.FC<IResourceComponentsProps> = () => {
  const { tableProps } = useTable({
    sorters: {
      initial: [
        {
          field: "updatedAt",
          order: "desc",
        },
      ],
    },
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="name" title="Name" />
        <Table.Column dataIndex="slug" title="Slug" />
        <Table.Column
          dataIndex="status"
          title="Status"
          render={(status: string) => (
            <Tag color={status === "open" ? "green" : status === "closed" ? "red" : "orange"}>
              {status}
            </Tag>
          )}
        />
        <Table.Column dataIndex="budgetTotal" title="Budget" />
        <Table.Column dataIndex="endDate" title="End Date" />
        <Table.Column
          title="Actions"
          render={(_, record: { id: string }) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.id} />
              <EditButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
