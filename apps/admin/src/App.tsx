import { RefineThemes, ThemedLayout, useNotificationProvider } from "@refinedev/antd";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router";
import dataProvider from "@refinedev/simple-rest";
import { App as AntdApp, ConfigProvider } from "antd";
import { BrowserRouter, Route, Routes } from "react-router";
import "@refinedev/antd/dist/reset.css";
import { RulesList, RuleTester } from "./components/rules";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/v1";

function AppTitle() {
  return <span>ValidateHome</span>;
}

function DashboardPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>ValidateHome Admin</h1>
      <p>Welcome to the admin dashboard. Use the sidebar to navigate.</p>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ConfigProvider theme={RefineThemes.Green}>
        <AntdApp>
          <Refine
            routerProvider={routerProvider}
            dataProvider={dataProvider(API_URL)}
            notificationProvider={useNotificationProvider}
            resources={[
              {
                name: "programs",
                list: "/programs",
                show: "/programs/:id",
                edit: "/programs/:id/edit",
              },
              {
                name: "sources",
                list: "/sources",
                show: "/sources/:id",
              },
              {
                name: "diffs",
                list: "/diffs",
                show: "/diffs/:id",
              },
              {
                name: "api-keys",
                list: "/api-keys",
              },
              {
                name: "rules",
                list: "/rules",
              },
              {
                name: "rules-tester",
                list: "/rules-tester",
              },
            ]}
          >
            <Routes>
              <Route element={<ThemedLayout Title={AppTitle} />}>
                <Route index element={<DashboardPage />} />
                <Route path="rules" element={<RulesList />} />
                <Route path="rules-tester" element={<RuleTester />} />
              </Route>
            </Routes>
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}
