import { DatePicker, Form, Input, InputNumber, Select } from "antd";
import { CURRENCY_FORMATTER, STATUS_OPTIONS } from "../../constants/program";

type ProgramFormFieldsProps = {
  isCreate?: boolean;
};

export const ProgramFormFields: React.FC<ProgramFormFieldsProps> = ({ isCreate = false }) => {
  const requiredRule = isCreate
    ? [{ required: true, message: "This field is required" }]
    : undefined;

  return (
    <>
      <Form.Item label="Name" name="name" rules={requiredRule}>
        <Input placeholder="Enter program name" />
      </Form.Item>

      <Form.Item label="Slug" name="slug" rules={requiredRule}>
        <Input placeholder="e.g., federal-heat-pump-credit" disabled={!isCreate} />
      </Form.Item>

      <Form.Item label="Description" name="description">
        <Input.TextArea rows={4} placeholder="Enter program description" />
      </Form.Item>

      <Form.Item
        label="Status"
        name="status"
        rules={isCreate ? requiredRule : undefined}
        initialValue={isCreate ? "open" : undefined}
      >
        <Select options={STATUS_OPTIONS} placeholder="Select status" />
      </Form.Item>

      {isCreate && (
        <Form.Item label="Jurisdiction ID" name="jurisdictionId" rules={requiredRule}>
          <Input placeholder="Enter jurisdiction UUID" />
        </Form.Item>
      )}

      <Form.Item label="Program URL" name="programUrl">
        <Input placeholder="https://example.com/program" />
      </Form.Item>

      <Form.Item label="Budget Total" name="budgetTotal">
        <InputNumber
          style={{ width: "100%" }}
          placeholder="Enter budget amount"
          formatter={CURRENCY_FORMATTER}
        />
      </Form.Item>

      <Form.Item label="Budget Remaining" name="budgetRemaining">
        <InputNumber
          style={{ width: "100%" }}
          placeholder="Enter remaining budget"
          formatter={CURRENCY_FORMATTER}
        />
      </Form.Item>

      {!isCreate && (
        <Form.Item label="Budget % Used" name="budgetPctUsed">
          <InputNumber style={{ width: "100%" }} min={0} max={100} placeholder="Enter percentage" />
        </Form.Item>
      )}

      <Form.Item label="Start Date" name="startDate">
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item label="End Date" name="endDate">
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item label="Application Deadline" name="applicationDeadline">
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>
    </>
  );
};
