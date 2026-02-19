import { Edit, useForm } from "@refinedev/antd";
import type { IResourceComponentsProps } from "@refinedev/core";
import { DatePicker, Form, Input, InputNumber, Select } from "antd";

const statusOptions = [
  { label: "Open", value: "open" },
  { label: "Waitlist", value: "waitlist" },
  { label: "Reserved", value: "reserved" },
  { label: "Funded", value: "funded" },
  { label: "Closed", value: "closed" },
  { label: "Coming Soon", value: "coming_soon" },
];

export const ProgramEdit: React.FC<IResourceComponentsProps> = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Name" name="name" rules={[{ required: true }]}>
          <Input placeholder="Enter program name" />
        </Form.Item>

        <Form.Item label="Slug" name="slug" rules={[{ required: true }]}>
          <Input placeholder="e.g., federal-heat-pump-credit" disabled />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <Input.TextArea rows={4} placeholder="Enter program description" />
        </Form.Item>

        <Form.Item label="Status" name="status">
          <Select options={statusOptions} placeholder="Select status" />
        </Form.Item>

        <Form.Item label="Program URL" name="programUrl">
          <Input placeholder="https://example.com/program" />
        </Form.Item>

        <Form.Item label="Budget Total" name="budgetTotal">
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Enter budget amount"
            formatter={(value) => `$ ${Number(value).toLocaleString()}`}
          />
        </Form.Item>

        <Form.Item label="Budget Remaining" name="budgetRemaining">
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Enter remaining budget"
            formatter={(value) => `$ ${Number(value).toLocaleString()}`}
          />
        </Form.Item>

        <Form.Item label="Budget % Used" name="budgetPctUsed">
          <InputNumber style={{ width: "100%" }} min={0} max={100} placeholder="Enter percentage" />
        </Form.Item>

        <Form.Item label="Start Date" name="startDate">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="End Date" name="endDate">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Application Deadline" name="applicationDeadline">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
