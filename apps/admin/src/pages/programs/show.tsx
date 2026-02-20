import type { HttpError, IResourceComponentsProps } from "@refinedev/core";
import { useShow } from "@refinedev/core";
import { Card, Descriptions, Spin, Tag } from "antd";

interface Program {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
  programUrl?: string;
  budgetTotal?: string;
  budgetRemaining?: string;
  budgetPctUsed?: number;
  startDate?: string;
  endDate?: string;
  jurisdiction?: { name: string; country: string };
  benefits?: Array<{ type: string; maxAmount?: string; description?: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  open: "green",
  waitlist: "orange",
  reserved: "blue",
  funded: "purple",
  closed: "red",
  coming_soon: "default",
};

export function ProgramShow(_props: IResourceComponentsProps) {
  const { query } = useShow<Program, HttpError>();
  const { data, isLoading } = query;

  const program = data?.data;

  if (isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (!program) {
    return (
      <Card>
        <p>Program not found</p>
      </Card>
    );
  }

  return (
    <Card title={program.name}>
      <Descriptions column={2} bordered>
        <Descriptions.Item label="ID">{program.id}</Descriptions.Item>
        <Descriptions.Item label="Slug">{program.slug}</Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={STATUS_COLORS[program.status] ?? "default"}>{program.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Jurisdiction">
          {program.jurisdiction?.name ?? "Unknown"}
        </Descriptions.Item>
        <Descriptions.Item label="Description" span={2}>
          {program.description ?? "No description"}
        </Descriptions.Item>
        <Descriptions.Item label="Program URL" span={2}>
          {program.programUrl ? (
            <a href={program.programUrl} target="_blank" rel="noopener noreferrer">
              {program.programUrl}
            </a>
          ) : (
            "N/A"
          )}
        </Descriptions.Item>
        {program.budgetTotal && (
          <Descriptions.Item label="Budget Total">
            ${Number(program.budgetTotal).toLocaleString()}
          </Descriptions.Item>
        )}
        {program.budgetRemaining && (
          <Descriptions.Item label="Budget Remaining">
            ${Number(program.budgetRemaining).toLocaleString()}
          </Descriptions.Item>
        )}
        {program.budgetPctUsed !== undefined && (
          <Descriptions.Item label="Budget Used">{program.budgetPctUsed}%</Descriptions.Item>
        )}
        {program.startDate && (
          <Descriptions.Item label="Start Date">
            {new Date(program.startDate).toLocaleDateString()}
          </Descriptions.Item>
        )}
        {program.endDate && (
          <Descriptions.Item label="End Date">
            {new Date(program.endDate).toLocaleDateString()}
          </Descriptions.Item>
        )}
        {program.benefits && program.benefits.length > 0 && (
          <Descriptions.Item label="Benefits" span={2}>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {program.benefits.map(
                (
                  benefit: { type: string; maxAmount?: string; description?: string },
                  idx: number,
                ) => (
                  <li key={`benefit-${idx}-${benefit.type}`}>
                    <strong>{benefit.type}</strong>
                    {benefit.maxAmount && `: $${Number(benefit.maxAmount).toLocaleString()}`}
                    {benefit.description && <br />}
                    {benefit.description && <em>{benefit.description}</em>}
                  </li>
                ),
              )}
            </ul>
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  );
}
