import type { FormProps } from "antd";
import { Button, Card, Form, Input, message } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router";
import { getStoredApiKey } from "../../auth-provider";

interface LoginFormValues {
  apiKey: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [error, setError] = useState<string | null>(null);

  const onFinish: FormProps<LoginFormValues>["onFinish"] = async (values) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/v1/programs?limit=1", {
        headers: {
          Authorization: `Bearer ${values.apiKey}`,
        },
      });

      if (response.ok) {
        localStorage.setItem("validatehome_admin_api_key", values.apiKey);
        message.success("Logged in successfully");
        navigate("/");
      } else {
        setError("Invalid API key. Please check and try again.");
      }
    } catch {
      setError("Failed to connect. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
      <Card title="ValidateHome Admin Login" style={{ width: 400 }}>
        <p style={{ marginBottom: 24, color: "#666" }}>
          Enter your API key to access the admin dashboard.
        </p>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ apiKey: getStoredApiKey() ?? "" }}
        >
          <Form.Item
            label="API Key"
            name="apiKey"
            rules={[{ required: true, message: "Please enter your API key" }]}
          >
            <Input.Password placeholder="Enter API key" size="large" />
          </Form.Item>
          {error && <div style={{ color: "#ff4d4f", marginBottom: 16 }}>{error}</div>}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
