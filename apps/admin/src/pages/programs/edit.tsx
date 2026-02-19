import { Edit, useForm } from "@refinedev/antd";
import type { IResourceComponentsProps } from "@refinedev/core";
import { Alert, Form } from "antd";
import { ProgramFormFields } from "../../components/programs/program-form-fields.js";

export function ProgramEdit(_props: IResourceComponentsProps) {
  const { formProps, saveButtonProps } = useForm();
  const hasApiKey = Boolean(import.meta.env.VITE_API_KEY);

  return (
    <Edit
      saveButtonProps={{ ...saveButtonProps, disabled: !hasApiKey || saveButtonProps.disabled }}
    >
      {!hasApiKey && (
        <Alert
          type="warning"
          showIcon
          message="Admin API key is required to edit programs"
          description="Set VITE_API_KEY with an enterprise-tier key before making mutations."
          style={{ marginBottom: 16 }}
        />
      )}
      <Form {...formProps} layout="vertical" disabled={!hasApiKey}>
        <ProgramFormFields />
      </Form>
    </Edit>
  );
}
