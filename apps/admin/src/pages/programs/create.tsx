import { Create, useForm } from "@refinedev/antd";
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

export const ProgramCreate: React.FC<IResourceComponentsProps> = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Name is required" }]}
        >
          <Input placeholder="Enter program name" />
        </Form.Item>

        <Form.Item
          label="Slug"
          name="slug"
          rules={[{ required: true, message: "Slug is required" }]}
        >
          <Input placeholder="e.g., federal-heat-pump-credit" />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <Input.TextArea rows={4} placeholder="Enter program description" />
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
          rules={[{ required: true, message: "Status is required" }]}
          initialValue="open"
        >
          <Select options={statusOptions} placeholder="Select status" />
        </Form.Item>

        <Form.Item
          label="Jurisdiction ID"
          name="jurisdictionId"
          rules={[{ required: true, message: "Jurisdiction is required" }]}
        >
          <Input placeholder="Enter jurisdiction UUID" />
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
    </Create>
  );
};
