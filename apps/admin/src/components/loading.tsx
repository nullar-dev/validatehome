import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";

interface LoadingProps {
  tip?: string;
}

export function Loading({ tip = "Loading..." }: LoadingProps) {
  return (
    <div
      style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}
    >
      <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} tip={tip} />
    </div>
  );
}

export function TableLoading() {
  return (
    <div style={{ padding: 16 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            height: 48,
            background: "#f5f5f5",
            borderRadius: 4,
            marginBottom: 8,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}

export function CardLoading() {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ height: 200, background: "#f5f5f5", borderRadius: 8, marginBottom: 16 }} />
      <div
        style={{
          height: 24,
          width: "60%",
          background: "#f5f5f5",
          borderRadius: 4,
          marginBottom: 8,
        }}
      />
      <div style={{ height: 16, width: "40%", background: "#f5f5f5", borderRadius: 4 }} />
    </div>
  );
}
