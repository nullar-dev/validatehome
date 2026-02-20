import { Create, useForm } from "@refinedev/antd";
import type { IResourceComponentsProps } from "@refinedev/core";
import { Form } from "antd";
import { ProgramFormFields } from "../../components/programs/program-form-fields.js";

export const ProgramCreate: React.FC<IResourceComponentsProps> = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <ProgramFormFields isCreate />
      </Form>
    </Create>
  );
};
