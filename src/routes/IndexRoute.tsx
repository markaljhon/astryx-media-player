import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Center, TextInput, VStack } from "@astryxdesign/core";
import { AppLayout } from "@/layouts/AppLayout";
import {
  getAccessModeForPassword,
  getRouteOptionsForAccessMode,
  setAccessMode,
} from "./access";

export const IndexRoute = () => {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const accessMode = getAccessModeForPassword(password);

    if (!accessMode) {
      return;
    }

    setAccessMode(accessMode);
    void navigate(getRouteOptionsForAccessMode(accessMode));
  }, [navigate, password]);

  return (
    <AppLayout>
      <Center height="100dvh">
        <VStack gap={4} width="18rem">
          <TextInput
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            type="password"
            hasClear={true}
            hasAutoFocus={true}
            size="lg"
          />
        </VStack>
      </Center>
    </AppLayout>
  );
};
