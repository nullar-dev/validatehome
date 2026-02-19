import { Edit, useForm } from "@refinedev/antd";
import type { IResourceComponentsProps } from "@refinedev/core";
import { Form } from "antd";
import { ProgramFormFields } from "../../components/programs/program-form-fields";

export const ProgramEdit: React.FC<IResourceComponentsProps> = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <ProgramFormFields isCreate={false} />
      </Form>
    </Edit>
  );
};
